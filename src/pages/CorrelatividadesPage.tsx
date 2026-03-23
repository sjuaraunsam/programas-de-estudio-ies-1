import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  NodeTypes,
  EdgeTypes,
  BackgroundVariant,
} from '@xyflow/react';
import { AnimatePresence, motion } from 'motion/react';
import { GraduationCap, Search, Edit2, Lock, Info, ArrowRight } from 'lucide-react';
import { CurriculumSubject, SubjectState, SubjectCategory, Quiz, QuizAttempt } from '../types';
import { cn } from '../lib/utils';
import SubjectNode, { SubjectNodeData } from '../components/SubjectNode';
import CurriculumEdge, { CurriculumEdgeDefs, CurriculumEdgeData } from '../components/CurriculumEdge';
import SubjectFormModal from '../components/SubjectFormModal';

const nodeTypes: NodeTypes = { subjectNode: SubjectNode };
const edgeTypes: EdgeTypes = { curriculumEdge: CurriculumEdge };

const COLUMN_WIDTH = 320;
const ROW_HEIGHT = 190;
const PADDING_X = 80;
const PADDING_Y = 100;

const DetailModal = ({
  subject,
  allSubjects,
  onClose,
}: {
  subject: CurriculumSubject;
  allSubjects: CurriculumSubject[];
  onClose: () => void;
}) => {
  const prerequisites = allSubjects.filter(s => subject.prerequisites.includes(s.id));
  const unlocks = allSubjects.filter(s => s.prerequisites.includes(subject.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-stone-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-stone-100 bg-stone-50/50">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-mono text-stone-400">{subject.career}</span>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <h2 className="text-xl font-serif font-bold text-stone-900 mb-1">{subject.name}</h2>
          <p className="text-stone-500 text-sm">Año {subject.year} · {subject.semester}° Cuatrimestre · {subject.duration}</p>
          {subject.prof && <p className="text-stone-400 text-xs mt-1">{subject.prof}</p>}
        </div>
        <div className="p-6 space-y-5">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span> Correlativas Necesarias
            </h4>
            {prerequisites.length > 0 ? (
              <ul className="space-y-2">
                {prerequisites.map(p => (
                  <li key={p.id} className="flex items-center gap-2 text-sm text-stone-700 p-2 bg-stone-50 rounded border border-stone-100">
                    <span className="font-mono text-xs text-stone-400">{p.career}</span>{p.name}
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-stone-400 italic">No tiene correlativas previas.</p>}
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Habilita para cursar
            </h4>
            {unlocks.length > 0 ? (
              <ul className="space-y-2">
                {unlocks.map(u => (
                  <li key={u.id} className="flex items-center gap-2 text-sm text-stone-700 p-2 bg-stone-50 rounded border border-stone-100">
                    <span className="font-mono text-xs text-stone-400">{u.career}</span>{u.name}
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-stone-400 italic">No es correlativa de ninguna materia posterior.</p>}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default function CorrelatividadesPage({
  subjects,
  progress,
  quizzes,
  onUpdateSubjectState,
  onSaveSubject,
  onOpenQuiz,
}: {
  subjects: CurriculumSubject[];
  progress: Record<string, SubjectState>;
  quizzes: Record<string, Quiz>;
  onUpdateSubjectState: (subject: CurriculumSubject, newState: SubjectState) => void;
  onSaveSubject: (savedSubject: CurriculumSubject, unlocks: string[]) => void;
  onOpenQuiz: (subject: CurriculumSubject) => void;
}) {
  const [selectedSubject, setSelectedSubject] = useState<CurriculumSubject | null>(null);
  const [editingSubject, setEditingSubject] = useState<CurriculumSubject | undefined>(undefined);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const isSubjectUnlocked = useCallback(
    (s: CurriculumSubject) =>
      s.prerequisites.length === 0 ||
      s.prerequisites.every(pid => progress[pid] === 'signed' || progress[pid] === 'passed'),
    [progress]
  );

  // Build RF nodes
  const initialNodes = useMemo<Node[]>(() => {
    const maxYear = Math.max(...subjects.map(s => s.year), 1);
    const yearGroups: Record<number, CurriculumSubject[]> = {};
    for (let y = 1; y <= maxYear; y++) yearGroups[y] = subjects.filter(s => s.year === y);

    return subjects.map(subject => {
      const yearIndex = subject.year - 1;
      const indexInYear = yearGroups[subject.year].indexOf(subject);
      const isLocked = !isSubjectUnlocked(subject);

      const nodeData: SubjectNodeData = {
        subject,
        state: progress[subject.id] || 'pending',
        isLocked,
        hasQuiz: !!quizzes[subject.id],
        onUpdateState: onUpdateSubjectState,
        onShowDetails: setSelectedSubject,
        onEdit: s => { setEditingSubject(s); setIsFormModalOpen(true); },
        onOpenQuiz,
      };

      return {
        id: subject.id,
        type: 'subjectNode',
        position: {
          x: PADDING_X + yearIndex * COLUMN_WIDTH,
          y: PADDING_Y + indexInYear * ROW_HEIGHT,
        },
        data: nodeData,
        draggable: true,
      };
    });
  }, [subjects, progress, quizzes, isSubjectUnlocked, onUpdateSubjectState, onOpenQuiz]);

  // Build RF edges
  const initialEdges = useMemo<Edge[]>(() => {
    const edges: Edge[] = [];
    subjects.forEach(target => {
      target.prerequisites.forEach(sourceId => {
        const sourceState = progress[sourceId] || 'pending';
        const isActive = sourceState === 'signed' || sourceState === 'passed';
        const edgeData: CurriculumEdgeData = { sourceState, isActive };
        edges.push({
          id: `e-${sourceId}-${target.id}`,
          source: sourceId,
          target: target.id,
          type: 'curriculumEdge',
          data: edgeData,
          animated: false,
        });
      });
    });
    return edges;
  }, [subjects, progress]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync nodes when subjects/progress changes
  useEffect(() => {
    setNodes(nds =>
      nds.map(node => {
        const subject = subjects.find(s => s.id === node.id);
        if (!subject) return node;
        const isLocked = !isSubjectUnlocked(subject);
        return {
          ...node,
          data: {
            ...node.data,
            subject,
            state: progress[subject.id] || 'pending',
            isLocked,
            hasQuiz: !!quizzes[subject.id],
          },
        };
      })
    );
  }, [subjects, progress, quizzes, isSubjectUnlocked]);

  // Sync edges when prerequisites change
  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges]);

  const filteredNodes = useMemo(() => {
    if (!searchTerm) return nodes;
    const lower = searchTerm.toLowerCase();
    return nodes.map(n => ({
      ...n,
      hidden: !(n.data as SubjectNodeData).subject.name.toLowerCase().includes(lower),
    }));
  }, [nodes, searchTerm]);

  if (subjects.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-stone-50 gap-4">
        <div className="w-16 h-16 bg-stone-200 rounded-full flex items-center justify-center">
          <GraduationCap size={32} className="text-stone-400" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-serif font-bold text-stone-900 mb-2">Sin materias seleccionadas</h2>
          <p className="text-stone-500 text-sm max-w-xs">
            Configurá tus materias desde el botón en el panel lateral para ver el mapa de correlatividades.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-stone-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 z-40 shrink-0">
        <div className="px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center text-white">
              <GraduationCap size={18} />
            </div>
            <h1 className="font-serif font-bold text-lg tracking-tight text-stone-900">Correlatividades</h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Legend */}
            <div className="hidden md:flex items-center gap-4 text-xs text-stone-500">
              {[
                { color: 'bg-stone-300', label: 'Pendiente' },
                { color: 'bg-blue-300', label: 'Cursando' },
                { color: 'bg-lime-300', label: 'Aprobada' },
                { color: 'bg-emerald-500', label: 'Con Final' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className={cn('w-2 h-2 rounded-full', color)}></span>
                  {label}
                </div>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-1.5 bg-stone-100 border-transparent focus:bg-white focus:border-stone-300 rounded-full text-sm w-40 border focus:outline-none transition-all"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Canvas */}
      <div className="flex-1 relative">
        <CurriculumEdgeDefs />
        {/* Flow animation CSS */}
        <style>{`
          @keyframes flowDash {
            from { stroke-dashoffset: 0; }
            to { stroke-dashoffset: -28; }
          }
          .react-flow__node { cursor: grab; }
          .react-flow__node:active { cursor: grabbing; }
          .react-flow__handle { opacity: 0; }
          .react-flow__node:hover .react-flow__handle { opacity: 1; }
        `}</style>

        <ReactFlow
          nodes={filteredNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.2}
          maxZoom={2}
          deleteKeyCode={null}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#d6d3d1" />
          <Controls className="[&>button]:bg-white [&>button]:border-stone-200 [&>button]:text-stone-600 [&>button:hover]:bg-stone-50" />
          <MiniMap
            nodeColor={node => {
              const state = (node.data as SubjectNodeData).state;
              if (state === 'passed') return '#10b981';
              if (state === 'signed') return '#84cc16';
              if (state === 'in-progress') return '#60a5fa';
              return '#d6d3d1';
            }}
            maskColor="rgba(245,245,244,0.7)"
            className="!bg-white !border !border-stone-200 !rounded-xl overflow-hidden"
          />
        </ReactFlow>

        {/* Year labels overlay */}
        <div className="absolute top-4 left-0 right-0 flex pointer-events-none z-20 overflow-hidden px-[80px]"
             style={{ gap: `${COLUMN_WIDTH - 260}px` }}>
          {Array.from(new Set(subjects.map(s => s.year))).sort().map(year => (
            <div key={year} className="w-[260px] shrink-0">
              <span className="font-serif font-bold text-sm text-stone-400 bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded-md border border-stone-200 whitespace-nowrap">
                {year}° Año
              </span>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedSubject && (
          <DetailModal
            subject={selectedSubject}
            allSubjects={subjects}
            onClose={() => setSelectedSubject(null)}
          />
        )}
        {isFormModalOpen && editingSubject && (
          <SubjectFormModal
            isOpen={isFormModalOpen}
            onClose={() => setIsFormModalOpen(false)}
            onSave={onSaveSubject}
            existingSubjects={subjects}
            initialSubject={editingSubject}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
