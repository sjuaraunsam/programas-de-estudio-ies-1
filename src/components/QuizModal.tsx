import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Trash2, Check, AlertCircle, Trophy, RotateCcw, ChevronRight, Save } from 'lucide-react';
import { Quiz, QuizQuestion, QuizAttempt, CurriculumSubject } from '../types';
import { cn } from '../lib/utils';

// ---- Quiz Builder (Admin) ----
export function QuizBuilder({
  subject,
  initialQuiz,
  onSave,
  onClose,
}: {
  subject: CurriculumSubject;
  initialQuiz?: Quiz;
  onSave: (quiz: Quiz) => void;
  onClose: () => void;
}) {
  const [passingScore, setPassingScore] = useState(initialQuiz?.passingScore ?? 6);
  const [questions, setQuestions] = useState<QuizQuestion[]>(initialQuiz?.questions ?? []);

  const addQuestion = () => {
    const id = `q-${Date.now()}`;
    setQuestions(prev => [...prev, {
      id,
      text: '',
      options: [
        { id: `${id}-a`, label: '' },
        { id: `${id}-b`, label: '' },
        { id: `${id}-c`, label: '' },
        { id: `${id}-d`, label: '' },
      ],
      correctOptionId: `${id}-a`,
    }]);
  };

  const updateQuestion = (qIdx: number, text: string) => {
    setQuestions(prev => prev.map((q, i) => i === qIdx ? { ...q, text } : q));
  };

  const updateOption = (qIdx: number, oIdx: number, label: string) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q;
      const opts = [...q.options];
      opts[oIdx] = { ...opts[oIdx], label };
      return { ...q, options: opts };
    }));
  };

  const setCorrect = (qIdx: number, optionId: string) => {
    setQuestions(prev => prev.map((q, i) => i === qIdx ? { ...q, correctOptionId: optionId } : q));
  };

  const removeQuestion = (qIdx: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== qIdx));
  };

  const handleSave = () => {
    const valid = questions.every(q => q.text.trim() && q.options.every(o => o.label.trim()));
    if (!valid) { alert('Completá todos los campos de las preguntas y opciones.'); return; }
    onSave({ passingScore, questions });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-stone-200 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 border-b border-stone-100 bg-stone-50/50 flex justify-between items-start shrink-0">
          <div>
            <h2 className="text-lg font-serif font-bold text-stone-900">Editor de Quiz</h2>
            <p className="text-sm text-stone-500 mt-0.5">{subject.name}</p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Passing score */}
          <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-xl border border-stone-200">
            <label className="text-sm font-medium text-stone-700 whitespace-nowrap">Puntaje mínimo para aprobar:</label>
            <input
              type="number" min={1} max={10}
              value={passingScore}
              onChange={e => setPassingScore(Number(e.target.value))}
              className="w-16 px-3 py-1.5 border border-stone-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
            <span className="text-sm text-stone-400">/ 10</span>
          </div>

          {/* Questions */}
          {questions.map((q, qIdx) => (
            <div key={q.id} className="border border-stone-200 rounded-xl p-4 space-y-3 bg-white">
              <div className="flex items-start gap-3">
                <span className="text-xs font-bold text-stone-400 bg-stone-100 px-2 py-1 rounded-md shrink-0 mt-1">P{qIdx + 1}</span>
                <input
                  type="text"
                  placeholder="Escribí la pregunta..."
                  value={q.text}
                  onChange={e => updateQuestion(qIdx, e.target.value)}
                  className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
                />
                <button onClick={() => removeQuestion(qIdx)} className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-9">
                {q.options.map((opt, oIdx) => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <button
                      onClick={() => setCorrect(qIdx, opt.id)}
                      className={cn(
                        'w-5 h-5 rounded-full border-2 shrink-0 transition-all',
                        q.correctOptionId === opt.id
                          ? 'bg-emerald-500 border-emerald-600 scale-110'
                          : 'bg-white border-stone-300 hover:border-emerald-400'
                      )}
                      title="Marcar como correcta"
                    />
                    <input
                      type="text"
                      placeholder={`Opción ${String.fromCharCode(65 + oIdx)}`}
                      value={opt.label}
                      onChange={e => updateOption(qIdx, oIdx, e.target.value)}
                      className="flex-1 px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-stone-400"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button
            onClick={addQuestion}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-stone-300 text-stone-500 rounded-xl hover:border-stone-400 hover:text-stone-700 transition-colors text-sm font-medium"
          >
            <Plus size={16} /> Agregar Pregunta
          </button>
        </div>

        <div className="p-5 border-t border-stone-100 bg-stone-50 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors flex items-center gap-2">
            <Save size={15} /> Guardar Quiz
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ---- Quiz Attempt (Student) ----
export function QuizAttemptModal({
  subject,
  quiz,
  lastAttempt,
  onSubmit,
  onClose,
  inline = false,
}: {
  subject: CurriculumSubject;
  quiz: Quiz;
  lastAttempt?: QuizAttempt;
  onSubmit: (attempt: QuizAttempt) => void;
  onClose: () => void;
  inline?: boolean;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; passed: boolean; correct: number; total: number } | null>(null);
  const [showReview, setShowReview] = useState(false);

  // Show last attempt result if already completed
  useEffect(() => {
    if (lastAttempt) {
      setAnswers(lastAttempt.answersByQuestionId);
      setSubmitted(true);
      const correct = quiz.questions.filter(q => lastAttempt.answersByQuestionId[q.id] === q.correctOptionId).length;
      setResult({ score: lastAttempt.score, passed: lastAttempt.passed, correct, total: quiz.questions.length });
    }
  }, []);

  const selectAnswer = (questionId: string, optionId: string) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = () => {
    const total = quiz.questions.length;
    const correct = quiz.questions.filter(q => answers[q.id] === q.correctOptionId).length;
    const score = total > 0 ? Math.round((correct / total) * 10) : 0;
    const passed = score >= quiz.passingScore;

    const attempt: QuizAttempt = {
      score,
      passed,
      completedAt: new Date().toISOString(),
      answersByQuestionId: answers,
    };

    setResult({ score, passed, correct, total });
    setSubmitted(true);
    onSubmit(attempt);
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setResult(null);
    setShowReview(false);
  };

  const allAnswered = quiz.questions.every(q => answers[q.id]);

  const content = (
    <div className="flex flex-col h-full">
      {/* Result view */}
      {submitted && result && !showReview ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
          <div className={cn('w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white mb-2', result.passed ? 'bg-emerald-500' : 'bg-orange-500')}>
            {result.score}
          </div>
          {result.passed ? (
            <>
              <Trophy size={28} className="text-emerald-500" />
              <h3 className="text-xl font-serif font-bold text-stone-900">¡Aprobado!</h3>
              <p className="text-stone-500">Respondiste {result.correct} de {result.total} correctamente.</p>
            </>
          ) : (
            <>
              <AlertCircle size={28} className="text-orange-500" />
              <h3 className="text-xl font-serif font-bold text-stone-900">Necesitás seguir estudiando</h3>
              <p className="text-stone-500">Respondiste {result.correct} de {result.total} correctamente. Se necesita {quiz.passingScore}/10.</p>
            </>
          )}
          <div className="flex gap-3 mt-2">
            <button onClick={() => setShowReview(true)} className="px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-lg transition-colors border border-stone-200 flex items-center gap-2">
              <ChevronRight size={15} /> Ver respuestas
            </button>
            <button onClick={handleRetry} className="px-4 py-2 text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors flex items-center gap-2">
              <RotateCcw size={15} /> Reintentar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {quiz.questions.map((q, qIdx) => (
            <div key={q.id} className="space-y-3">
              <p className="font-medium text-stone-900 text-sm">
                <span className="text-stone-400 font-mono mr-2">{qIdx + 1}.</span>
                {q.text}
              </p>
              <div className="grid grid-cols-1 gap-2">
                {q.options.map(opt => {
                  const isSelected = answers[q.id] === opt.id;
                  const isCorrect = opt.id === q.correctOptionId;
                  const showCorrect = submitted && showReview;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => selectAnswer(q.id, opt.id)}
                      disabled={submitted}
                      className={cn(
                        'text-left px-4 py-2.5 rounded-xl border text-sm transition-all',
                        showCorrect && isCorrect ? 'border-emerald-400 bg-emerald-50 text-emerald-800' :
                        showCorrect && isSelected && !isCorrect ? 'border-red-300 bg-red-50 text-red-700' :
                        isSelected ? 'border-stone-800 bg-stone-50 font-medium' :
                        'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <span className={cn('w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center',
                          showCorrect && isCorrect ? 'border-emerald-500 bg-emerald-500' :
                          showCorrect && isSelected && !isCorrect ? 'border-red-400 bg-red-400' :
                          isSelected ? 'border-stone-700 bg-stone-700' : 'border-stone-300'
                        )}>
                          {(showCorrect && isCorrect || (!showCorrect && isSelected)) && (
                            <Check size={11} className="text-white" />
                          )}
                        </span>
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {!submitted && (
        <div className="p-5 border-t border-stone-100 bg-stone-50 flex justify-end shrink-0">
          <button
            onClick={handleSubmit}
            disabled={!allAnswered}
            className="px-5 py-2 text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Entregar ({Object.keys(answers).length}/{quiz.questions.length})
          </button>
        </div>
      )}
    </div>
  );

  if (inline) return content;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-xl flex flex-col border border-stone-200 overflow-hidden"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 border-b border-stone-100 bg-stone-50/50 flex justify-between items-start shrink-0">
          <div>
            <h2 className="text-lg font-serif font-bold text-stone-900">Quiz</h2>
            <p className="text-sm text-stone-500 mt-0.5">{subject.name}</p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>{content}</div>
      </motion.div>
    </div>
  );
}
