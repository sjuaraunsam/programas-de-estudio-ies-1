import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, ArrowRight, Info, Search, Lock, Edit2 } from 'lucide-react';
import { CurriculumSubject, SubjectState, SubjectCategory } from '../types';
import { cn } from '../lib/utils';
import SubjectFormModal from '../components/SubjectFormModal';

type ConnectionType = 'prerequisite' | 'unlocks' | 'none';

const CATEGORY_COLORS: Record<SubjectCategory, string> = {
  core: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  general: 'bg-teal-100 text-teal-800 border-teal-200',
  practice: 'bg-pink-100 text-pink-800 border-pink-200',
  complementary: 'bg-slate-100 text-slate-800 border-slate-200',
};

const CATEGORY_LABELS: Record<SubjectCategory, string> = {
  core: 'Específica',
  general: 'Form. General',
  practice: 'Práctica',
  complementary: 'Complementaria',
};

const CategoryBadge = ({ category }: { category: SubjectCategory }) => (
  <span
    className={cn(
      "text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border",
      CATEGORY_COLORS[category]
    )}
  >
    {CATEGORY_LABELS[category]}
  </span>
);

const SubjectCard = React.forwardRef<
  HTMLDivElement,
  {
    subject: CurriculumSubject;
    connectionType: ConnectionType;
    isHovered: boolean;
    state: SubjectState;
    isLocked: boolean;
    onHover: (id: string) => void;
    onLeave: () => void;
    onUpdateState: (subject: CurriculumSubject, newState: SubjectState) => void;
    onShowDetails: (subject: CurriculumSubject) => void;
    onEdit: (subject: CurriculumSubject) => void;
  }
>(
  (
    {
      subject,
      connectionType,
      isHovered,
      state,
      isLocked,
      onHover,
      onLeave,
      onUpdateState,
      onShowDetails,
      onEdit,
    },
    ref
  ) => {
    let borderClass = 'border-stone-200';
    let bgClass = 'bg-white';
    let opacityClass = 'opacity-100';
    let shadowClass = 'shadow-sm hover:shadow-md';
    let zIndexClass = 'z-0';

    if (isLocked) {
      bgClass = 'bg-stone-100';
      borderClass = 'border-stone-200';
      opacityClass = 'opacity-70';
    } else if (state === 'passed') {
      bgClass = 'bg-emerald-100';
      borderClass = 'border-emerald-300';
    } else if (state === 'signed') {
      bgClass = 'bg-lime-50';
      borderClass = 'border-lime-200';
    } else if (state === 'in-progress') {
      bgClass = 'bg-blue-50';
      borderClass = 'border-blue-200';
    }

    if (isHovered) {
      if (connectionType === 'none') {
        opacityClass = 'opacity-30';
      } else if (connectionType === 'prerequisite') {
        borderClass = 'border-orange-500 ring-2 ring-orange-500';
        shadowClass = 'shadow-lg';
        zIndexClass = 'z-10';
      } else if (connectionType === 'unlocks') {
        borderClass = 'border-emerald-500 ring-2 ring-emerald-500';
        shadowClass = 'shadow-lg';
        zIndexClass = 'z-10';
      } else {
        borderClass = 'border-stone-800 ring-2 ring-stone-800';
        shadowClass = 'shadow-xl';
        zIndexClass = 'z-20';
      }
    }

    return (
      <motion.div
        ref={ref}
        layoutId={subject.id}
        className={cn(
          'relative p-3 rounded-lg border transition-all duration-200 cursor-grab active:cursor-grabbing flex flex-col gap-2 h-full min-h-[130px] group',
          borderClass,
          bgClass,
          opacityClass,
          shadowClass,
          zIndexClass
        )}
        onMouseEnter={() => onHover(subject.id)}
        onMouseLeave={onLeave}
      >
        <div className="flex justify-between items-start">
          <span className="text-xs font-mono text-stone-400 truncate max-w-[60px]">{subject.career}</span>
          <div className="flex gap-1 items-center">
            <button
              onClick={e => {
                e.stopPropagation();
                onEdit(subject);
              }}
              className="p-1 rounded-full text-stone-400 hover:text-stone-600 transition-colors"
              title="Editar correlativas"
            >
              <Edit2 size={12} />
            </button>
            <button
              onClick={e => {
                e.stopPropagation();
                onShowDetails(subject);
              }}
              className="p-1 rounded-full text-stone-400 hover:text-stone-600 transition-colors"
            >
              <Info size={14} />
            </button>
            <CategoryBadge category={subject.category} />
          </div>
        </div>

        <h3 className="font-serif text-sm font-medium leading-tight text-stone-900 flex-grow">
          {subject.name}
        </h3>

        <div className="flex items-center justify-center mt-2 h-8">
          {isLocked ? (
            <div className="flex items-center gap-1.5 text-xs font-medium text-stone-400 bg-stone-200/50 px-2 py-1 rounded-md w-full justify-center select-none">
              <Lock size={12} /> Bloqueada
            </div>
          ) : (
            <div
              className="flex items-center gap-3 bg-white/50 px-3 py-1 rounded-full border border-stone-100 shadow-sm"
              onPointerDown={e => e.stopPropagation()}
            >
              <button
                onClick={e => {
                  e.stopPropagation();
                  onUpdateState(subject, 'pending');
                }}
                className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer',
                  state === 'pending'
                    ? 'bg-stone-500 border-stone-600 scale-110'
                    : 'bg-stone-100 border-stone-300 hover:bg-stone-500 hover:border-stone-600'
                )}
                title="Pendiente"
              />
              <button
                onClick={e => {
                  e.stopPropagation();
                  onUpdateState(subject, 'in-progress');
                }}
                className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer',
                  state === 'in-progress'
                    ? 'bg-blue-400 border-blue-500 scale-110'
                    : 'bg-blue-100 border-blue-200 hover:bg-blue-400 hover:border-blue-500'
                )}
                title="Cursando"
              />
              <button
                onClick={e => {
                  e.stopPropagation();
                  onUpdateState(subject, 'signed');
                }}
                className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer',
                  state === 'signed'
                    ? 'bg-lime-400 border-lime-500 scale-110'
                    : 'bg-lime-100 border-lime-200 hover:bg-lime-400 hover:border-lime-500'
                )}
                title="Aprobada"
              />
              <button
                onClick={e => {
                  e.stopPropagation();
                  onUpdateState(subject, 'passed');
                }}
                className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer',
                  state === 'passed'
                    ? 'bg-emerald-600 border-emerald-700 scale-110'
                    : 'bg-emerald-100 border-emerald-200 hover:bg-emerald-600 hover:border-emerald-700'
                )}
                title="Con Final"
              />
            </div>
          )}
        </div>

        {connectionType === 'prerequisite' && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-orange-200 flex items-center gap-1 shadow-sm whitespace-nowrap z-20">
            <ArrowRight className="w-3 h-3 rotate-90" /> Requisito
          </div>
        )}
        {connectionType === 'unlocks' && (
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 shadow-sm whitespace-nowrap z-20">
            Habilita <ArrowRight className="w-3 h-3 rotate-90" />
          </div>
        )}
      </motion.div>
    );
  }
);

SubjectCard.displayName = 'SubjectCard';

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-stone-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-stone-100 bg-stone-50/50">
          <div className="flex justify-between items-start mb-2">
            <CategoryBadge category={subject.category} />
            <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <h2 className="text-2xl font-serif font-bold text-stone-900 mb-1">{subject.name}</h2>
          <p className="text-stone-500 text-sm">
            {subject.career} · Año {subject.year} · {subject.semester}° Cuatrimestre
          </p>
          {subject.prof && (
            <p className="text-stone-400 text-xs mt-1">{subject.prof}</p>
          )}
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
              Correlativas Necesarias
            </h4>
            {prerequisites.length > 0 ? (
              <ul className="space-y-2">
                {prerequisites.map(p => (
                  <li
                    key={p.id}
                    className="flex items-center gap-2 text-sm text-stone-700 p-2 bg-stone-50 rounded border border-stone-100"
                  >
                    <span className="font-mono text-xs text-stone-400">{p.career}</span>
                    {p.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-stone-400 italic">No tiene correlativas previas.</p>
            )}
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Habilita para cursar
            </h4>
            {unlocks.length > 0 ? (
              <ul className="space-y-2">
                {unlocks.map(u => (
                  <li
                    key={u.id}
                    className="flex items-center gap-2 text-sm text-stone-700 p-2 bg-stone-50 rounded border border-stone-100"
                  >
                    <span className="font-mono text-xs text-stone-400">{u.career}</span>
                    {u.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-stone-400 italic">No es correlativa de ninguna materia posterior.</p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const ArrowsOverlay = ({
  hoveredSubjectId,
  subjects,
  cardRefs,
  progress,
  containerRef,
}: {
  hoveredSubjectId: string | null;
  subjects: CurriculumSubject[];
  cardRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
  progress: Record<string, SubjectState>;
  containerRef: React.RefObject<HTMLDivElement>;
}) => {
  const [paths, setPaths] = useState<React.ReactNode[]>([]);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    const updatePaths = () => {
      const newPaths: React.ReactNode[] = [];

      if (!containerRef.current) {
        requestRef.current = requestAnimationFrame(updatePaths);
        return;
      }

      const containerRect = containerRef.current.getBoundingClientRect();

      const getCenter = (el: HTMLDivElement) => {
        const rect = el.getBoundingClientRect();
        return {
          x: rect.left + rect.width / 2 - containerRect.left,
          y: rect.top + rect.height / 2 - containerRect.top,
          left: rect.left - containerRect.left,
          right: rect.right - containerRect.left,
        };
      };

      const gap = 4;

      subjects.forEach(targetSubject => {
        targetSubject.prerequisites.forEach(sourceId => {
          const sourceEl = cardRefs.current.get(sourceId);
          const targetEl = cardRefs.current.get(targetSubject.id);

          if (sourceEl && targetEl) {
            const sourceStatus = progress[sourceId];
            const isSourceActive = sourceStatus === 'signed' || sourceStatus === 'passed';
            const isSourceHovered = sourceId === hoveredSubjectId;
            const isTargetHovered = targetSubject.id === hoveredSubjectId;

            if (isSourceActive || isSourceHovered || isTargetHovered) {
              const sourcePos = getCenter(sourceEl);
              const targetPos = getCenter(targetEl);

              const startX = sourcePos.right + gap;
              const startY = sourcePos.y;
              const endX = targetPos.left - gap;
              const endY = targetPos.y;

              const dist = Math.abs(endX - startX);
              const cp1 = { x: startX + dist * 0.5, y: startY };
              const cp2 = { x: endX - dist * 0.5, y: endY };

              let color = '#f97316';
              let markerId = 'url(#arrowhead-orange)';

              if (sourceStatus === 'signed') {
                color = '#84cc16';
                markerId = 'url(#arrowhead-lime)';
              } else if (sourceStatus === 'passed') {
                color = '#047857';
                markerId = 'url(#arrowhead-emerald-dark)';
              }

              newPaths.push(
                <g key={`${sourceId}-${targetSubject.id}`}>
                  <path
                    d={`M ${startX} ${startY} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${endX} ${endY}`}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    markerEnd={markerId}
                  />
                </g>
              );
            }
          }
        });
      });

      setPaths(newPaths);
      requestRef.current = requestAnimationFrame(updatePaths);
    };

    requestRef.current = requestAnimationFrame(updatePaths);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [hoveredSubjectId, subjects, cardRefs, progress, containerRef]);

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
      <defs>
        <marker id="arrowhead-orange" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#f97316" />
        </marker>
        <marker id="arrowhead-lime" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#84cc16" />
        </marker>
        <marker id="arrowhead-emerald-dark" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#047857" />
        </marker>
      </defs>
      {paths}
    </svg>
  );
};

export default function CorrelatividadesPage({
  subjects,
  progress,
  onUpdateSubjectState,
  onSaveSubject,
}: {
  subjects: CurriculumSubject[];
  progress: Record<string, SubjectState>;
  onUpdateSubjectState: (subject: CurriculumSubject, newState: SubjectState) => void;
  onSaveSubject: (savedSubject: CurriculumSubject, unlocks: string[]) => void;
}) {
  const [hoveredSubjectId, setHoveredSubjectId] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<CurriculumSubject | null>(null);
  const [editingSubject, setEditingSubject] = useState<CurriculumSubject | undefined>(undefined);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});

  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const canvasRef = useRef<HTMLDivElement>(null);

  const COLUMN_WIDTH = 320;
  const ROW_HEIGHT = 220;
  const CANVAS_PADDING_TOP = 80;
  const CANVAS_PADDING_LEFT = 40;

  // Group subjects by year
  const maxYear = Math.max(...subjects.map(s => s.year), 1);
  const years = Array.from({ length: maxYear }, (_, i) => i + 1);

  const subjectsByYear = useMemo(
    () =>
      years.map(year => ({
        year,
        subjects: subjects.filter(s => s.year === year),
      })),
    [subjects, maxYear]
  );

  useEffect(() => {
    const newPositions: Record<string, { x: number; y: number }> = {};
    subjectsByYear.forEach((group, groupIndex) => {
      const x = CANVAS_PADDING_LEFT + groupIndex * COLUMN_WIDTH;
      group.subjects.forEach((subject, subjectIndex) => {
        const y = CANVAS_PADDING_TOP + subjectIndex * ROW_HEIGHT;
        newPositions[subject.id] = { x, y };
      });
    });
    setPositions(newPositions);
  }, [subjectsByYear]);

  const isSubjectUnlocked = (subject: CurriculumSubject) => {
    if (subject.prerequisites.length === 0) return true;
    return subject.prerequisites.every(preId => {
      const status = progress[preId];
      return status === 'signed' || status === 'passed';
    });
  };

  const getConnectionType = (subjectId: string): ConnectionType => {
    if (!hoveredSubjectId) return 'none';
    if (subjectId === hoveredSubjectId) return 'none';

    const hoveredSubject = subjects.find(s => s.id === hoveredSubjectId);
    if (!hoveredSubject) return 'none';

    if (hoveredSubject.prerequisites.includes(subjectId)) return 'prerequisite';

    const subject = subjects.find(s => s.id === subjectId);
    if (subject && subject.prerequisites.includes(hoveredSubjectId)) return 'unlocks';

    return 'none';
  };

  const filteredSubjects = searchTerm
    ? subjects.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : subjects;

  const canvasWidth = CANVAS_PADDING_LEFT * 2 + maxYear * COLUMN_WIDTH;
  const maxSubjectsInYear = Math.max(...subjectsByYear.map(g => g.subjects.length), 1);
  const canvasHeight = CANVAS_PADDING_TOP * 2 + maxSubjectsInYear * ROW_HEIGHT;

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
    <div className="h-full flex flex-col bg-[#f5f5f4] selection:bg-stone-200 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 z-40 shrink-0">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center text-white">
              <GraduationCap size={18} />
            </div>
            <h1 className="font-serif font-bold text-lg tracking-tight text-stone-900">
              Correlatividades
            </h1>
          </div>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar materia..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-stone-100 border-transparent focus:bg-white focus:border-stone-300 focus:ring-0 rounded-full text-sm w-48 transition-all border"
            />
          </div>
        </div>
      </header>

      {/* Legend */}
      <div className="bg-white/50 border-b border-stone-200 backdrop-blur-sm shrink-0">
        <div className="px-6 py-2.5 flex flex-wrap gap-6 text-xs text-stone-600">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-stone-100 border border-stone-200"></span>
            <span>Pendiente</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-100 border border-blue-200"></span>
            <span>Cursando</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-lime-100 border border-lime-200"></span>
            <span>Aprobada</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-200 border border-emerald-300"></span>
            <span>Con Final</span>
          </div>
          <div className="w-px h-4 bg-stone-300"></div>
          <div className="flex items-center gap-2">
            <Lock size={12} className="text-stone-400" />
            <span>Bloqueada</span>
          </div>
          <div className="w-px h-4 bg-stone-300"></div>
          <div className="flex items-center gap-2 text-stone-400 italic">
            <Edit2 size={11} />
            <span>Clic en lápiz para definir correlativas</span>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <main className="flex-1 overflow-auto relative bg-stone-50">
        <div ref={canvasRef} className="relative" style={{ width: canvasWidth, height: canvasHeight }}>
          <ArrowsOverlay
            hoveredSubjectId={hoveredSubjectId}
            subjects={subjects}
            cardRefs={cardRefs}
            progress={progress}
            containerRef={canvasRef}
          />

          {/* Year Headers */}
          {subjectsByYear.map((group, index) => (
            <div
              key={group.year}
              className="absolute top-8 border-b border-stone-300 pb-2"
              style={{ left: CANVAS_PADDING_LEFT + index * COLUMN_WIDTH, width: COLUMN_WIDTH - 40 }}
            >
              <span className="font-serif font-bold text-xl text-stone-800 whitespace-nowrap">
                {group.year}° Año
              </span>
            </div>
          ))}

          {/* Draggable Subject Cards */}
          {filteredSubjects.map(subject => {
            const pos = positions[subject.id];
            if (!pos) return null;

            return (
              <motion.div
                key={subject.id}
                drag
                dragMomentum={false}
                initial={{ x: pos.x, y: pos.y }}
                style={{ position: 'absolute', top: 0, left: 0, zIndex: hoveredSubjectId === subject.id ? 50 : 10 }}
                onHoverStart={() => setHoveredSubjectId(subject.id)}
                onHoverEnd={() => setHoveredSubjectId(null)}
                className="w-[270px]"
              >
                <SubjectCard
                  ref={el => {
                    if (el) cardRefs.current.set(subject.id, el);
                    else cardRefs.current.delete(subject.id);
                  }}
                  subject={subject}
                  connectionType={getConnectionType(subject.id)}
                  isHovered={!!hoveredSubjectId}
                  state={progress[subject.id] || 'pending'}
                  isLocked={!isSubjectUnlocked(subject)}
                  onHover={setHoveredSubjectId}
                  onLeave={() => setHoveredSubjectId(null)}
                  onUpdateState={onUpdateSubjectState}
                  onShowDetails={setSelectedSubject}
                  onEdit={s => {
                    setEditingSubject(s);
                    setIsFormModalOpen(true);
                  }}
                />
              </motion.div>
            );
          })}
        </div>
      </main>

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
