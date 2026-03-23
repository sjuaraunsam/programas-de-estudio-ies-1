import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Plus, Check, Save } from 'lucide-react';
import { CurriculumSubject, SubjectCategory } from '../types';
import { cn } from '../lib/utils';

interface SubjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (subject: CurriculumSubject, unlocks: string[]) => void;
  existingSubjects: CurriculumSubject[];
  initialSubject?: CurriculumSubject;
}

const CATEGORY_LABELS: Record<SubjectCategory, string> = {
  core: 'Específica',
  general: 'Formación General',
  practice: 'Práctica Docente',
  complementary: 'Complementaria',
};

export default function SubjectFormModal({
  isOpen,
  onClose,
  onSave,
  existingSubjects,
  initialSubject,
}: SubjectFormModalProps) {
  const [year, setYear] = useState<number>(1);
  const [semester, setSemester] = useState<1 | 2>(1);
  const [category, setCategory] = useState<SubjectCategory>('core');
  const [duration, setDuration] = useState<'anual' | 'cuatrimestral'>('cuatrimestral');
  const [prerequisites, setPrerequisites] = useState<string[]>([]);
  const [unlocks, setUnlocks] = useState<string[]>([]);

  useEffect(() => {
    if (initialSubject) {
      setYear(initialSubject.year);
      setSemester(initialSubject.semester);
      setCategory(initialSubject.category);
      setDuration(initialSubject.duration);
      setPrerequisites(initialSubject.prerequisites);
      const currentUnlocks = existingSubjects
        .filter(s => s.prerequisites.includes(initialSubject.id))
        .map(s => s.id);
      setUnlocks(currentUnlocks);
    } else {
      setYear(1);
      setSemester(1);
      setCategory('core');
      setDuration('cuatrimestral');
      setPrerequisites([]);
      setUnlocks([]);
    }
  }, [initialSubject, isOpen, existingSubjects]);

  if (!isOpen || !initialSubject) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subjectData: CurriculumSubject = {
      ...initialSubject,
      year,
      semester,
      category,
      duration,
      prerequisites,
    };
    onSave(subjectData, unlocks);
    onClose();
  };

  const togglePrerequisite = (subjectId: string) => {
    if (subjectId === initialSubject.id) return;
    setPrerequisites(prev =>
      prev.includes(subjectId) ? prev.filter(sid => sid !== subjectId) : [...prev, subjectId]
    );
  };

  const toggleUnlocks = (subjectId: string) => {
    if (subjectId === initialSubject.id) return;
    setUnlocks(prev =>
      prev.includes(subjectId) ? prev.filter(sid => sid !== subjectId) : [...prev, subjectId]
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden border border-stone-200 flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-stone-100 bg-stone-50/50 flex justify-between items-start shrink-0">
          <div>
            <h2 className="text-xl font-serif font-bold text-stone-900">Editar Materia</h2>
            <p className="text-sm text-stone-500 mt-1">{initialSubject.name}</p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Año</label>
              <select
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
              >
                {[1, 2, 3, 4, 5].map(y => (
                  <option key={y} value={y}>{y}° Año</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Cuatrimestre</label>
              <select
                value={semester}
                onChange={e => setSemester(Number(e.target.value) as 1 | 2)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
              >
                <option value={1}>1°</option>
                <option value={2}>2°</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Categoría</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as SubjectCategory)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
              >
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Duración</label>
              <select
                value={duration}
                onChange={e => setDuration(e.target.value as 'anual' | 'cuatrimestral')}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
              >
                <option value="cuatrimestral">Cuatrimestral</option>
                <option value="anual">Anual</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center justify-between">
                Correlativas (Requisitos)
                <span className="text-[10px] font-normal text-stone-400">{prerequisites.length} seleccionadas</span>
              </label>
              <div className="h-48 overflow-y-auto border border-stone-200 rounded-lg bg-stone-50 p-2 space-y-1">
                {existingSubjects
                  .filter(s => s.id !== initialSubject.id)
                  .map(s => (
                    <div
                      key={s.id}
                      onClick={() => togglePrerequisite(s.id)}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded cursor-pointer text-sm transition-colors",
                        prerequisites.includes(s.id)
                          ? "bg-orange-100 text-orange-800"
                          : "hover:bg-stone-100 text-stone-600"
                      )}
                    >
                      <div
                        className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                          prerequisites.includes(s.id)
                            ? "border-orange-500 bg-orange-500 text-white"
                            : "border-stone-300 bg-white"
                        )}
                      >
                        {prerequisites.includes(s.id) && <Check size={10} />}
                      </div>
                      <span className="truncate">{s.name}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center justify-between">
                Habilita (Es correlativa de)
                <span className="text-[10px] font-normal text-stone-400">{unlocks.length} seleccionadas</span>
              </label>
              <div className="h-48 overflow-y-auto border border-stone-200 rounded-lg bg-stone-50 p-2 space-y-1">
                {existingSubjects
                  .filter(s => s.id !== initialSubject.id)
                  .map(s => (
                    <div
                      key={s.id}
                      onClick={() => toggleUnlocks(s.id)}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded cursor-pointer text-sm transition-colors",
                        unlocks.includes(s.id)
                          ? "bg-emerald-100 text-emerald-800"
                          : "hover:bg-stone-100 text-stone-600"
                      )}
                    >
                      <div
                        className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                          unlocks.includes(s.id)
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-stone-300 bg-white"
                        )}
                      >
                        {unlocks.includes(s.id) && <Check size={10} />}
                      </div>
                      <span className="truncate">{s.name}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-stone-100 bg-stone-50/50 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors flex items-center gap-2"
          >
            <Save size={16} />
            Guardar Cambios
          </button>
        </div>
      </motion.div>
    </div>
  );
}
