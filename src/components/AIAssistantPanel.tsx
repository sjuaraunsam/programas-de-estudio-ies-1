import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { CurriculumSubject, SubjectState } from '../types';
import { cn } from '../lib/utils';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface AIAssistantPanelProps {
  subject: {
    id: string;
    name: string;
    career?: string;
    foundation?: string;
    objectives?: string[];
    methodology?: string;
  };
  prerequisites?: CurriculumSubject[];
  progress?: Record<string, SubjectState>;
  apiKey?: string;
}

const getClient = (key: string) => new GoogleGenAI({ apiKey: key });

const buildSystemPrompt = (subject: AIAssistantPanelProps['subject'], prerequisites: CurriculumSubject[]) => {
  const prereqNames = prerequisites.map(p => p.name).join(', ') || 'ninguna';
  return [
    'Sos un asistente académico para estudiantes del IES Nº 1 de Buenos Aires.',
    'Respondés siempre en español, de forma clara y concisa.',
    `La materia actual es: "${subject.name}" (carrera: ${subject.career || 'N/A'}).`,
    prerequisites.length > 0 ? `Sus correlativas necesarias son: ${prereqNames}.` : '',
    subject.foundation ? `Fundamentación: ${subject.foundation.slice(0, 300)}...` : '',
    subject.objectives?.length ? `Objetivos principales: ${subject.objectives.slice(0, 3).join('; ')}.` : '',
    'Ayudá al estudiante a entender los contenidos, correlatividades y metodología de la materia.',
    'Sé directo y pedagógico.',
  ].filter(Boolean).join(' ');
};

export default function AIAssistantPanel({ subject, prerequisites = [], progress = {}, apiKey }: AIAssistantPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
  const [localKey, setLocalKey] = useState(apiKey || envKey);
  const [showKeyInput, setShowKeyInput] = useState(!localKey);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading || !localKey) return;

    const userText = input.trim();
    setInput('');
    setError(null);
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      const client = getClient(localKey);
      const systemInstruction = buildSystemPrompt(subject, prerequisites);

      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));

      const response = await client.models.generateContent({
        model: 'gemini-2.0-flash-lite',
        contents: [...history, { role: 'user', parts: [{ text: userText }] }],
        config: {
          systemInstruction,
          maxOutputTokens: 512,
          temperature: 0.7,
        },
      });

      const text = response.text ?? 'No pude generar una respuesta.';
      setMessages(prev => [...prev, { role: 'model', text }]);
    } catch (err: any) {
      const msg = err?.message ?? 'Error al conectar con Gemini.';
      if (msg.includes('API key')) {
        setError('API key inválida o no autorizada. Verificá tu clave de Gemini.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (showKeyInput) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
        <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center">
          <Sparkles size={24} className="text-stone-500" />
        </div>
        <div>
          <h3 className="font-serif font-bold text-stone-900 mb-1">Asistente IA</h3>
          <p className="text-xs text-stone-500 max-w-xs">
            Ingresá tu API key de Google Gemini para activar el asistente. Podés obtenerla en{' '}
            <span className="font-medium text-stone-700">aistudio.google.com</span>.
          </p>
        </div>
        <div className="w-full max-w-xs space-y-2">
          <input
            type="password"
            placeholder="AIza..."
            value={localKey}
            onChange={e => setLocalKey(e.target.value)}
            className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
          <button
            onClick={() => { if (localKey.trim()) { setShowKeyInput(false); } }}
            disabled={!localKey.trim()}
            className="w-full px-4 py-2.5 text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-colors disabled:opacity-40"
          >
            Activar Asistente
          </button>
        </div>
        <p className="text-[10px] text-stone-400">La clave se guarda solo en esta sesión.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot size={32} className="mx-auto mb-3 text-stone-300" />
            <p className="text-sm text-stone-400 font-medium">Asistente IA listo</p>
            <p className="text-xs text-stone-400 mt-1">Preguntá sobre {subject.name}</p>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {[
                '¿Cuáles son los temas principales?',
                '¿Qué correlativas necesito?',
                '¿Cómo es la evaluación?',
              ].map(q => (
                <button
                  key={q}
                  onClick={() => { setInput(q); }}
                  className="text-xs text-stone-500 border border-stone-200 px-3 py-1.5 rounded-full hover:bg-stone-50 hover:border-stone-300 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={cn('flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
            <div className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5',
              msg.role === 'user' ? 'bg-stone-800' : 'bg-stone-100'
            )}>
              {msg.role === 'user'
                ? <User size={14} className="text-white" />
                : <Bot size={14} className="text-stone-600" />
              }
            </div>
            <div className={cn(
              'max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed',
              msg.role === 'user'
                ? 'bg-stone-900 text-white rounded-tr-sm'
                : 'bg-stone-100 text-stone-800 rounded-tl-sm'
            )}>
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
              <Bot size={14} className="text-stone-600" />
            </div>
            <div className="bg-stone-100 px-4 py-3 rounded-2xl rounded-tl-sm">
              <Loader2 size={16} className="animate-spin text-stone-400" />
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-stone-200 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Preguntá algo sobre esta materia..."
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 focus:bg-white transition-all"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="w-10 h-10 flex items-center justify-center bg-stone-900 hover:bg-stone-800 text-white rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
        <button
          onClick={() => setShowKeyInput(true)}
          className="text-[10px] text-stone-400 hover:text-stone-600 mt-1.5 ml-1 transition-colors"
        >
          Cambiar API key
        </button>
      </div>
    </div>
  );
}
