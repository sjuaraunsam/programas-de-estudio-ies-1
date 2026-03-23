import React, { useState } from 'react';
import { BookOpen, Settings, GraduationCap, Calendar, ChevronDown, LogOut, LogIn, Shield } from 'lucide-react';
import { cn } from '../lib/utils';
import { User as FirebaseUser } from 'firebase/auth';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  user: FirebaseUser | null;
  onLogin: () => void;
  onLogout: () => void;
  onConfigureSubjects: () => void;
  inProgressSubjectNames: string[];
}

export default function Sidebar({
  activePage,
  onNavigate,
  user,
  onLogin,
  onLogout,
  onConfigureSubjects,
  inProgressSubjectNames,
}: SidebarProps) {
  const [isMateriasOpen, setIsMateriasOpen] = useState(false);

  const menuItems = [
    { id: 'correlatividades', label: 'Correlatividades', icon: GraduationCap },
    { id: 'agenda', label: 'Agenda de Horarios', icon: Calendar },
    { id: 'programas', label: 'Programas', icon: BookOpen },
    { id: 'admin', label: 'Panel Admin', icon: Shield },
  ];

  const userInitials = user?.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0].toUpperCase() ?? '?';

  return (
    <div className="w-64 h-screen bg-stone-900 text-stone-300 flex flex-col shrink-0">
      <div className="p-6 border-b border-stone-800">
        <h2 className="text-xl font-serif font-bold text-white tracking-tight">
          IES Nº 1
        </h2>
        <p className="text-xs text-stone-500 mt-1">Programas de Estudio</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          if (item.id === 'programas') {
            return (
              <div key={item.id} className="space-y-1">
                <button
                  onClick={() => {
                    setIsMateriasOpen(!isMateriasOpen);
                    onNavigate(item.id);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    activePage === item.id
                      ? "bg-stone-800 text-white"
                      : "hover:bg-stone-800/50 hover:text-white"
                  )}
                >
                  <item.icon size={18} />
                  {item.label}
                  <ChevronDown
                    size={16}
                    className={cn("ml-auto transition-transform", isMateriasOpen && "rotate-180")}
                  />
                </button>
                {isMateriasOpen && (
                  <div className="ml-4 pl-4 border-l border-stone-800 space-y-1 mt-1">
                    {inProgressSubjectNames.length > 0 ? (
                      inProgressSubjectNames.map((name, i) => (
                        <div
                          key={i}
                          className="px-4 py-2 rounded-lg text-sm text-stone-400 truncate"
                        >
                          {name}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-xs text-stone-500 italic">
                        No hay materias en curso.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                activePage === item.id
                  ? "bg-stone-800 text-white"
                  : "hover:bg-stone-800/50 hover:text-white"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-stone-800 shrink-0 space-y-2">
        {user ? (
          <>
            <div className="flex items-center gap-3 px-4 py-2">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || ''}
                  className="w-8 h-8 rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-stone-700 flex items-center justify-center text-xs font-bold text-white">
                  {userInitials}
                </div>
              )}
              <div className="flex flex-col overflow-hidden flex-1">
                <span className="text-sm font-medium text-white truncate">
                  {user.displayName || user.email}
                </span>
                <span className="text-xs text-stone-500">Estudiante</span>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 text-stone-500 hover:text-red-400 rounded-md transition-colors"
                title="Cerrar sesión"
              >
                <LogOut size={16} />
              </button>
            </div>
            <button
              onClick={onConfigureSubjects}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-stone-400 hover:text-white hover:bg-stone-800 transition-colors border border-stone-800"
            >
              <Settings size={14} />
              Configurar Materias
            </button>
          </>
        ) : (
          <button
            onClick={onLogin}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-stone-700 hover:bg-stone-600 transition-colors"
          >
            <LogIn size={16} />
            Iniciar sesión con Google
          </button>
        )}
      </div>
    </div>
  );
}
