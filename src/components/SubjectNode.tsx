import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Lock, Info, Edit2, ClipboardList } from 'lucide-react';
import { CurriculumSubject, SubjectState, SubjectCategory } from '../types';
import { cn } from '../lib/utils';

export type SubjectNodeData = {
  subject: CurriculumSubject;
  state: SubjectState;
  isLocked: boolean;
  hasQuiz: boolean;
  onUpdateState: (s: CurriculumSubject, newState: SubjectState) => void;
  onShowDetails: (s: CurriculumSubject) => void;
  onEdit: (s: CurriculumSubject) => void;
  onOpenQuiz: (s: CurriculumSubject) => void;
};

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

const SubjectNode = memo(({ data, selected }: NodeProps) => {
  const { subject, state, isLocked, hasQuiz, onUpdateState, onShowDetails, onEdit, onOpenQuiz } = data as SubjectNodeData;

  const borderColor = isLocked
    ? 'border-stone-200'
    : state === 'passed'
    ? 'border-emerald-400'
    : state === 'signed'
    ? 'border-lime-400'
    : state === 'in-progress'
    ? 'border-blue-400'
    : 'border-stone-200';

  const bgColor = isLocked
    ? 'bg-stone-100'
    : state === 'passed'
    ? 'bg-emerald-50'
    : state === 'signed'
    ? 'bg-lime-50'
    : state === 'in-progress'
    ? 'bg-blue-50'
    : 'bg-white';

  return (
    <div
      className={cn(
        'w-[260px] rounded-xl border-2 shadow-sm flex flex-col gap-2 p-3 transition-all duration-200 select-none',
        borderColor,
        bgColor,
        selected && 'ring-2 ring-stone-700 ring-offset-1',
        isLocked && 'opacity-70'
      )}
    >
      {/* Handles for edge connections */}
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-stone-400 !border-2 !border-white" />
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-stone-400 !border-2 !border-white" />

      {/* Top row: career + actions */}
      <div className="flex items-center justify-between gap-1">
        <span className="text-[10px] font-mono text-stone-400 truncate max-w-[80px]">{subject.career}</span>
        <div className="flex items-center gap-0.5 shrink-0">
          {hasQuiz && (
            <button
              onPointerDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); onOpenQuiz(subject); }}
              className="p-1 rounded-full text-stone-400 hover:text-indigo-600 transition-colors"
              title="Quiz"
            >
              <ClipboardList size={12} />
            </button>
          )}
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onEdit(subject); }}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 transition-colors"
            title="Editar correlativas"
          >
            <Edit2 size={12} />
          </button>
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onShowDetails(subject); }}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 transition-colors"
            title="Ver detalles"
          >
            <Info size={13} />
          </button>
          <span className={cn('text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-full border', CATEGORY_COLORS[subject.category])}>
            {CATEGORY_LABELS[subject.category]}
          </span>
        </div>
      </div>

      {/* Subject name */}
      <h3 className="font-serif text-sm font-semibold leading-snug text-stone-900">{subject.name}</h3>

      {/* State controls */}
      <div className="flex items-center justify-center">
        {isLocked ? (
          <div className="flex items-center gap-1.5 text-xs font-medium text-stone-400 bg-stone-200/60 px-2 py-1 rounded-md w-full justify-center">
            <Lock size={11} /> Bloqueada
          </div>
        ) : (
          <div
            className="flex items-center gap-3 bg-white/60 px-3 py-1.5 rounded-full border border-stone-100 shadow-sm"
            onPointerDown={e => e.stopPropagation()}
          >
            {(
              [
                { s: 'pending' as SubjectState, active: 'bg-stone-500 border-stone-600', inactive: 'bg-stone-100 border-stone-300 hover:bg-stone-400', title: 'Pendiente' },
                { s: 'in-progress' as SubjectState, active: 'bg-blue-400 border-blue-500', inactive: 'bg-blue-100 border-blue-200 hover:bg-blue-400', title: 'Cursando' },
                { s: 'signed' as SubjectState, active: 'bg-lime-400 border-lime-500', inactive: 'bg-lime-100 border-lime-200 hover:bg-lime-400', title: 'Aprobada' },
                { s: 'passed' as SubjectState, active: 'bg-emerald-600 border-emerald-700', inactive: 'bg-emerald-100 border-emerald-200 hover:bg-emerald-600', title: 'Con Final' },
              ] as const
            ).map(({ s, active, inactive, title }) => (
              <button
                key={s}
                onClick={e => { e.stopPropagation(); onUpdateState(subject, s); }}
                className={cn(
                  'w-5 h-5 rounded-full border-2 transition-all cursor-pointer',
                  state === s ? `${active} scale-110` : inactive
                )}
                title={title}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

SubjectNode.displayName = 'SubjectNode';
export default SubjectNode;
