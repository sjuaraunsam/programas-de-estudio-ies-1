import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, GraduationCap, Clock, User, Calendar, Info, Target, List, Settings, CheckCircle, BookMarked, Menu, X, CalendarDays, FileText, LogOut, LogIn, Search, Plus, Check, LayoutGrid, Table, ArrowUpDown, ArrowUp, ArrowDown, Upload, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { subjects } from './data';
import { Subject, UserProfile } from './types';
import { auth, db, googleProvider, storage } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { availableSubjects, AvailableSubject } from './availableSubjects';

const tbdSubjects: Array<{ id: string, time: string, name: string, prof: string }> = [];

const parseTimeRange = (timeRange: string) => {
  const [start, end] = timeRange.split(' - ');
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  return {
    start: startH + startM / 60,
    end: endH + endM / 60
  };
};

const MIN_HOUR = 8;
const MAX_HOUR = 23;
const HOUR_HEIGHT = 72; // pixels per hour

const getDatesForSubject = (subjectId: string, schedule: Record<string, any[]>) => {
  const daysMap: Record<string, number> = {
    'Domingo': 0, 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6
  };

  const subjectDays: string[] = [];
  Object.entries(schedule).forEach(([day, classes]) => {
    if (classes.some(c => c.id === subjectId)) {
      subjectDays.push(day);
    }
  });

  if (subjectDays.length === 0) return [];

  const targetDays = subjectDays.map(d => daysMap[d]);

  const startDate = new Date(2026, 2, 16); // March 16, 2026
  const endDate = new Date(2026, 6, 10); // July 10, 2026

  const dates: Date[] = [];
  let current = new Date(startDate);

  while (current <= endDate) {
    if (targetDays.includes(current.getDay())) {
      dates.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

export default function App() {
  const [selectedView, setSelectedView] = useState<string>('agenda');
  const [activeTab, setActiveTab] = useState<'overview' | 'contents' | 'methodology' | 'evaluation' | 'classes'>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notes, setNotes] = useState<Record<string, Record<string, string>>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isSelectingSubjects, setIsSelectingSubjects] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [tempSelectedSubjects, setTempSelectedSubjects] = useState<string[]>([]);
  const [subjectViewMode, setSubjectViewMode] = useState<'cards' | 'table'>('cards');
  const [subjectSortConfig, setSubjectSortConfig] = useState<{ key: keyof AvailableSubject, direction: 'asc' | 'desc' } | null>(null);
  const [programs, setPrograms] = useState<Record<string, string>>({});
  const [uploadingSubject, setUploadingSubject] = useState<string | null>(null);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);

        const profileUnsubscribe = onSnapshot(userRef, async (docSnap) => {
          if (!docSnap.exists()) {
            const newProfile = {
              email: currentUser.email,
              name: currentUser.displayName,
              createdAt: serverTimestamp(),
              selectedSubjects: []
            };
            await setDoc(userRef, newProfile);
            setUserProfile(newProfile as any);
            setIsSelectingSubjects(true);
            setTempSelectedSubjects([]);
          } else {
            const data = docSnap.data() as UserProfile;
            setUserProfile(data);
            if (!data.selectedSubjects || data.selectedSubjects.length === 0) {
              setIsSelectingSubjects(true);
              setTempSelectedSubjects([]);
            } else {
              setTempSelectedSubjects(data.selectedSubjects);
            }
          }
          setIsAuthReady(true);
        });

        return () => profileUnsubscribe();
      } else {
        setNotes({});
        setUserProfile(null);
        setIsAuthReady(true);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch programs
  useEffect(() => {
    if (!isAuthReady) return;

    const programsRef = doc(db, 'settings/programs');
    const unsubscribe = onSnapshot(programsRef, (docSnap) => {
      if (docSnap.exists()) {
        setPrograms(docSnap.data() as Record<string, string>);
      }
    }, (error) => {
      console.error('Error fetching programs:', error);
    });

    return () => unsubscribe();
  }, [isAuthReady]);

  // Fetch notes when subject or user changes
  useEffect(() => {
    if (!isAuthReady || !user || selectedView === 'agenda' || selectedView === 'admin') return;

    const notesRef = doc(db, `users/${user.uid}/notes/${selectedView}`);
    const unsubscribe = onSnapshot(notesRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setNotes(prev => ({
          ...prev,
          [selectedView]: data.notes || {}
        }));
      } else {
        setNotes(prev => ({
          ...prev,
          [selectedView]: {}
        }));
      }
    }, (error) => {
      console.error("Error fetching notes:", error);
    });

    return () => unsubscribe();
  }, [user, isAuthReady, selectedView]);

  const handleFileUpload = async (subjectId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
      alert('Debes iniciar sesión para subir archivos.');
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Por favor, sube solo archivos PDF.');
      return;
    }

    setUploadingSubject(subjectId);
    try {
      const fileRef = ref(storage, `programs/${subjectId}.pdf`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);

      const programsRef = doc(db, 'settings/programs');
      await setDoc(programsRef, { [subjectId]: url }, { merge: true });
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Hubo un error al subir el archivo.');
    } finally {
      setUploadingSubject(null);
      event.target.value = '';
    }
  };

  const handleNoteChange = async (date: string, content: string) => {
    if (!user || selectedView === 'agenda' || selectedView === 'admin') return;

    setNotes(prev => ({
      ...prev,
      [selectedView]: {
        ...(prev[selectedView] || {}),
        [date]: content
      }
    }));

    try {
      const notesRef = doc(db, `users/${user.uid}/notes/${selectedView}`);
      const newNotes = {
        ...(notes[selectedView] || {}),
        [date]: content
      };

      await setDoc(notesRef, {
        subjectId: selectedView,
        notes: newNotes,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error("Error saving note:", error);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleSaveSubjects = async () => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { selectedSubjects: tempSelectedSubjects }, { merge: true });
      setIsSelectingSubjects(false);
    } catch (error) {
      console.error("Error saving subjects:", error);
    }
  };

  const toggleSubjectSelection = (subjectId: string) => {
    setTempSelectedSubjects(prev =>
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const currentScheduleData = useMemo(() => {
    const schedule: Record<string, any[]> = {
      Lunes: [], Martes: [], Miércoles: [], Jueves: [], Viernes: []
    };

    if (!userProfile?.selectedSubjects || userProfile.selectedSubjects.length === 0) {
      return schedule;
    }

    userProfile.selectedSubjects.forEach(subjectId => {
      const subject = availableSubjects.find(s => s.id === subjectId);
      if (subject && schedule[subject.day]) {
        schedule[subject.day].push({
          id: subject.id,
          time: subject.time.replace(' a ', ' - '),
          name: subject.name,
          prof: subject.prof
        });
      }
    });

    return schedule;
  }, [userProfile?.selectedSubjects]);

  useEffect(() => {
    setSelectedDate(null);
  }, [selectedView]);

  const selectedSubject = subjects.find(s => s.id === selectedView || selectedView.startsWith(s.id + '-'));

  const daysOrder = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  const orderedSubjectIds = Array.from(new Set(
    daysOrder.flatMap(day => currentScheduleData[day as keyof typeof currentScheduleData].map(item => item.id))
  ));

  const sortedSubjects = [...availableSubjects].sort((a, b) => {
    const indexA = orderedSubjectIds.indexOf(a.id);
    const indexB = orderedSubjectIds.indexOf(b.id);

    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;

    return indexA - indexB;
  });

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: Info },
    { id: 'contents', label: 'Contenidos', icon: List },
    { id: 'methodology', label: 'Metodología', icon: Settings },
    { id: 'evaluation', label: 'Evaluación', icon: CheckCircle },
    { id: 'classes', label: 'Clases', icon: FileText },
  ] as const;

  const handleSort = (key: keyof AvailableSubject) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (subjectSortConfig && subjectSortConfig.key === key && subjectSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSubjectSortConfig({ key, direction });
  };

  const sortedAndFilteredSubjects = useMemo(() => {
    let filtered = availableSubjects.filter(s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.prof.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.career.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (subjectSortConfig !== null) {
      filtered.sort((a, b) => {
        if (a[subjectSortConfig.key] < b[subjectSortConfig.key]) {
          return subjectSortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[subjectSortConfig.key] > b[subjectSortConfig.key]) {
          return subjectSortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return filtered;
  }, [searchQuery, subjectSortConfig]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2 text-indigo-700 font-semibold">
          <BookOpen className="w-6 h-6" />
          <span>Programas de Estudio</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 z-10 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div className={`
        fixed md:sticky top-0 left-0 h-screen w-72 bg-white border-r border-slate-200 flex flex-col z-20 transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-200 hidden md:flex items-center gap-3 text-indigo-700">
          <BookOpen className="w-7 h-7" />
          <h1 className="text-xl font-bold tracking-tight">Programas IES Nº 1</h1>
        </div>

        {/* User Profile Section */}
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          {user ? (
            <div className="flex flex-col">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'User'} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                      {user.email?.[0].toUpperCase()}
                    </div>
                  )}
                  <div className="truncate">
                    <p className="text-sm font-medium text-slate-900 truncate">{user.displayName}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                </div>
                <button onClick={handleLogout} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Cerrar sesión">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => {
                  setTempSelectedSubjects(userProfile?.selectedSubjects || []);
                  setIsSelectingSubjects(true);
                }}
                className="mt-3 w-full flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                Configurar Materias
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              Iniciar sesión con Google
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-4 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">General</div>
          <nav className="space-y-1 px-2 mb-6">
            <button
              onClick={() => {
                setSelectedView('agenda');
                setIsSidebarOpen(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3
                ${selectedView === 'agenda'
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-100'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
            >
              <CalendarDays className="w-5 h-5" />
              <span className="font-medium text-sm">Agenda de Horarios</span>
            </button>
            <button
              onClick={() => {
                setSelectedView('admin');
                setIsSidebarOpen(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3
                ${selectedView === 'admin'
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-100'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium text-sm">Panel Admin</span>
            </button>
          </nav>

          <div className="px-4 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Materias Disponibles</div>
          <nav className="space-y-1 px-2">
            {sortedSubjects.filter(s => orderedSubjectIds.includes(s.id)).map((subject) => (
              <button
                key={subject.id}
                onClick={() => {
                  setSelectedView(subject.id);
                  setActiveTab('overview');
                  setIsSidebarOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex flex-col gap-1
                  ${selectedView === subject.id
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-100'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
              >
                <span className="font-medium text-sm leading-tight">{subject.name}</span>
                <span className={`text-xs ${selectedView === subject.id ? 'text-indigo-500' : 'text-slate-400'}`}>
                  {subject.career}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8 lg:p-12">
        {selectedView === 'agenda' ? (
          <motion.div
            key="agenda"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-6 md:p-10"
          >
            <h2 className="text-3xl font-bold mb-8 text-slate-900 flex items-center gap-3">
              <CalendarDays className="w-8 h-8 text-indigo-600" />
              Agenda de Horarios
            </h2>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col mb-8 overflow-hidden">
              <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                  {/* Header Row */}
                  <div className="flex border-b border-slate-200 bg-slate-50">
                    <div className="w-16 flex-shrink-0 border-r border-slate-200"></div>
                    <div className="flex-1 flex">
                      {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map(day => (
                        <div key={day} className="flex-1 text-center py-3 font-semibold text-slate-700 text-sm border-r last:border-r-0 border-slate-200">
                          {day}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex relative bg-slate-50/50" style={{ height: `${(MAX_HOUR - MIN_HOUR) * HOUR_HEIGHT}px` }}>
                    {/* Time Labels */}
                    <div className="w-16 flex-shrink-0 border-r border-slate-200 bg-white relative">
                      {Array.from({ length: MAX_HOUR - MIN_HOUR + 1 }).map((_, i) => (
                        <div key={i} className="absolute w-full text-right pr-2 text-xs text-slate-400 font-medium" style={{ top: `${i * HOUR_HEIGHT - 8}px` }}>
                          {MIN_HOUR + i}:00
                        </div>
                      ))}
                    </div>

                    {/* Days Columns */}
                    <div className="flex-1 flex relative bg-white">
                      {/* Horizontal Grid Lines */}
                      <div className="absolute inset-0 pointer-events-none">
                        {Array.from({ length: MAX_HOUR - MIN_HOUR }).map((_, i) => (
                          <div key={i} className="w-full border-b border-slate-100" style={{ height: `${HOUR_HEIGHT}px` }} />
                        ))}
                      </div>

                      {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map((day) => (
                        <div key={day} className="flex-1 relative border-r last:border-r-0 border-slate-100">
                          {currentScheduleData[day as keyof typeof currentScheduleData].map(item => {
                            const { start, end } = parseTimeRange(item.time);
                            const top = (start - MIN_HOUR) * HOUR_HEIGHT;
                            const height = (end - start) * HOUR_HEIGHT;

                            return (
                              <div
                                key={item.id}
                                onClick={() => {
                                  setSelectedView(item.id);
                                  setActiveTab('overview');
                                }}
                                className="absolute inset-x-1 rounded-lg border border-indigo-200 bg-indigo-50/90 p-2 overflow-hidden hover:bg-indigo-100 hover:border-indigo-300 transition-colors cursor-pointer group shadow-sm z-10 flex flex-col"
                                style={{ top: `${top}px`, height: `${height}px` }}
                              >
                                <div className="text-[10px] font-mono font-semibold text-indigo-700 mb-1">
                                  {item.time}
                                </div>
                                <h4 className="text-xs font-bold text-slate-900 leading-tight group-hover:text-indigo-700 transition-colors line-clamp-3">
                                  {item.name}
                                </h4>
                                <p className="text-[10px] text-slate-500 mt-auto pt-1 truncate">{item.prof}</p>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Horario a confirmar */}
            {tbdSubjects.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-slate-400" />
                  Materias con horario a confirmar
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {tbdSubjects.map(item => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedView(item.id);
                        setActiveTab('overview');
                      }}
                      className="bg-slate-50 p-4 rounded-xl border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 transition-all cursor-pointer group flex flex-col gap-2"
                    >
                      <div className="text-xs font-mono font-semibold text-slate-600 bg-slate-200/50 px-2 py-1 rounded-md self-start flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        {item.time}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors leading-tight">
                        {item.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-auto pt-1">{item.prof}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ) : selectedView === 'admin' ? (
          <motion.div
            key="admin"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-6 md:p-10"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <Settings className="w-8 h-8 text-indigo-600" />
                Panel de Administración
              </h2>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar materias, profesores..."
                  value={adminSearchQuery}
                  onChange={(e) => setAdminSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 text-sm">
                    <th className="py-3 px-4 font-semibold">Materia</th>
                    <th className="py-3 px-4 font-semibold">Profesor</th>
                    <th className="py-3 px-4 font-semibold">Carrera</th>
                    <th className="py-3 px-4 font-semibold">Año/Cuat.</th>
                    <th className="py-3 px-4 font-semibold">Día</th>
                    <th className="py-3 px-4 font-semibold">Horario</th>
                    <th className="py-3 px-4 font-semibold">Aula</th>
                    <th className="py-3 px-4 font-semibold text-center">Programa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {availableSubjects
                    .filter(s =>
                      s.name.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
                      s.prof.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
                      s.career.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
                      s.day.toLowerCase().includes(adminSearchQuery.toLowerCase())
                    )
                    .map((subject) => (
                    <tr key={subject.id} className="hover:bg-slate-50 transition-colors text-sm">
                      <td className="py-3 px-4 font-medium text-slate-900">{subject.name}</td>
                      <td className="py-3 px-4 text-slate-600">{subject.prof}</td>
                      <td className="py-3 px-4 text-slate-600">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700">
                          {subject.career}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{subject.term}</td>
                      <td className="py-3 px-4 text-slate-600 font-medium">{subject.day}</td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-xs">{subject.time}</td>
                      <td className="py-3 px-4 text-slate-600">{subject.room}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {programs[subject.id] ? (
                            <a
                              href={programs[subject.id]}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                              title="Ver programa"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </a>
                          ) : (
                            <span className="p-1.5 text-slate-300" title="Sin programa">
                              <FileText className="w-5 h-5" />
                            </span>
                          )}
                          <label className="cursor-pointer p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="Subir programa">
                            {uploadingSubject === subject.id ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Upload className="w-5 h-5" />
                            )}
                            <input
                              type="file"
                              accept="application/pdf"
                              className="hidden"
                              onChange={(e) => handleFileUpload(subject.id, e)}
                              disabled={uploadingSubject === subject.id}
                            />
                          </label>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : selectedSubject ? (
          <motion.div
            key={selectedSubject.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
        >
          {/* Header Section */}
          <div className="bg-slate-900 text-white p-8 md:p-10">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-medium mb-6">
                  <GraduationCap className="w-4 h-4" />
                  {selectedSubject.career}
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight leading-tight">
                  {selectedSubject.name}
                </h2>
              </div>
              {programs[selectedSubject.id] && (
                <a
                  href={programs[selectedSubject.id]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
                >
                  <FileText className="w-5 h-5" />
                  Ver Programa
                </a>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300 mt-8">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-indigo-400" />
                <span><strong className="text-white font-medium">Docente:</strong> {selectedSubject.professor}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-indigo-400" />
                <span><strong className="text-white font-medium">Carga horaria:</strong> {selectedSubject.hours}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-indigo-400" />
                <span><strong className="text-white font-medium">Duración:</strong> {selectedSubject.duration}</span>
              </div>
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <span><strong className="text-white font-medium">Campo:</strong> {selectedSubject.field}</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-slate-200 px-4 md:px-8 flex overflow-x-auto hide-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                    ${isActive
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6 md:p-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'overview' && (
                  <div className="space-y-10">
                    <section>
                      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-slate-900">
                        <Info className="w-5 h-5 text-indigo-600" />
                        Fundamentación
                      </h3>
                      <p className="text-slate-600 leading-relaxed text-lg">
                        {selectedSubject.foundation}
                      </p>
                    </section>

                    <section>
                      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-slate-900">
                        <Target className="w-5 h-5 text-indigo-600" />
                        Objetivos
                      </h3>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedSubject.objectives.map((obj, idx) => (
                          <li key={idx} className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                            <span className="text-slate-700 text-sm leading-relaxed">{obj}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  </div>
                )}

                {activeTab === 'contents' && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 text-slate-900">
                      <List className="w-5 h-5 text-indigo-600" />
                      Unidades Temáticas
                    </h3>
                    <div className="space-y-4">
                      {selectedSubject.units.map((unit, idx) => (
                        <div key={idx} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                          <h4 className="font-semibold text-lg text-slate-900 mb-3">{unit.title}</h4>
                          <p className="text-slate-600 leading-relaxed">{unit.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'methodology' && (
                  <div className="space-y-10">
                    <section>
                      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-slate-900">
                        <Settings className="w-5 h-5 text-indigo-600" />
                        Metodología de Trabajo
                      </h3>
                      <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 md:p-8">
                        <p className="text-slate-700 leading-relaxed text-lg">
                          {selectedSubject.methodology}
                        </p>
                      </div>
                    </section>
                  </div>
                )}

                {activeTab === 'evaluation' && (
                  <div className="space-y-10">
                    <section>
                      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-slate-900">
                        <CheckCircle className="w-5 h-5 text-indigo-600" />
                        Modalidad de Evaluación
                      </h3>
                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 md:p-8">
                        <p className="text-slate-700 leading-relaxed text-lg">
                          {selectedSubject.evaluation}
                        </p>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-slate-900">
                        <BookMarked className="w-5 h-5 text-indigo-600" />
                        Bibliografía Obligatoria
                      </h3>
                      <ul className="space-y-3">
                        {selectedSubject.bibliography.map((bib, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-slate-600 bg-white p-4 rounded-xl border border-slate-200">
                            <BookOpen className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                            <span className="leading-relaxed">{bib}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  </div>
                )}

                {activeTab === 'classes' && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 text-slate-900">
                      <FileText className="w-5 h-5 text-indigo-600" />
                      Notas de Clases
                    </h3>

                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Dates List */}
                      <div className="w-full md:w-1/3 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col h-[500px]">
                        <div className="bg-slate-50 p-3 border-b border-slate-200 font-medium text-sm text-slate-700">
                          Fechas de cursada
                        </div>
                        <div className="overflow-y-auto flex-1 p-2 space-y-1">
                          {getDatesForSubject(selectedView, currentScheduleData).map((date, idx) => {
                            const dateStr = date.toISOString().split('T')[0];
                            const isSelected = selectedDate === dateStr;
                            const hasNote = notes[selectedView]?.[dateStr]?.trim().length > 0;

                            return (
                              <button
                                key={idx}
                                onClick={() => setSelectedDate(dateStr)}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex justify-between items-center
                                  ${isSelected ? 'bg-indigo-50 text-indigo-700 font-medium' : 'hover:bg-slate-50 text-slate-600'}`}
                              >
                                <span>
                                  {date.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: 'short' })}
                                </span>
                                {hasNote && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Editor */}
                      <div className="w-full md:w-2/3 bg-white border border-slate-200 rounded-xl flex flex-col h-[500px]">
                        {!user ? (
                          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                            <User className="w-12 h-12 mb-3 text-slate-200" />
                            <p className="mb-4">Inicia sesión para poder guardar tus notas de clase en la nube.</p>
                            <button
                              onClick={handleLogin}
                              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
                            >
                              <LogIn className="w-4 h-4" />
                              Iniciar sesión
                            </button>
                          </div>
                        ) : selectedDate ? (
                          <>
                            <div className="bg-slate-50 p-3 border-b border-slate-200 font-medium text-sm text-slate-700 flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              Clase del {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </div>
                            <textarea
                              className="flex-1 w-full p-4 resize-none focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 rounded-b-xl text-slate-700 leading-relaxed"
                              placeholder="Escribe tus notas para esta clase aquí..."
                              value={notes[selectedView]?.[selectedDate] || ''}
                              onChange={(e) => handleNoteChange(selectedDate, e.target.value)}
                            />
                          </>
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                            <FileText className="w-12 h-12 mb-3 text-slate-200" />
                            <p>Selecciona una fecha de la lista para ver o escribir notas.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
        ) : (
          (() => {
            const fallbackSubject = availableSubjects.find(s => s.id === selectedView);
            if (!fallbackSubject) return null;
            return (
              <motion.div
                key={fallbackSubject.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
              >
                <div className="bg-slate-900 text-white p-8 md:p-10">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-medium mb-6">
                        <GraduationCap className="w-4 h-4" />
                        {fallbackSubject.career}
                      </div>
                      <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight leading-tight">
                        {fallbackSubject.name}
                      </h2>
                    </div>
                    {programs[fallbackSubject.id] && (
                      <a
                        href={programs[fallbackSubject.id]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
                      >
                        <FileText className="w-5 h-5" />
                        Ver Programa
                      </a>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300 mt-8">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-indigo-400" />
                      <span><strong className="text-white font-medium">Docente:</strong> {fallbackSubject.prof}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-indigo-400" />
                      <span><strong className="text-white font-medium">Horario:</strong> {fallbackSubject.day} {fallbackSubject.time}</span>
                    </div>
                  </div>
                </div>
                <div className="p-6 md:p-10">
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 text-indigo-800 text-center mb-8">
                    <Info className="w-8 h-8 mx-auto mb-3 text-indigo-400" />
                    <h3 className="text-lg font-semibold mb-2">Información detallada no disponible</h3>
                    <p className="text-sm">El programa de estudio completo para esta materia aún no ha sido cargado en el sistema.</p>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-indigo-600" />
                    Registro de Clases
                  </h3>

                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-1/3 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col h-[500px]">
                      <div className="bg-slate-50 p-3 border-b border-slate-200 font-medium text-sm text-slate-700">
                        Fechas de cursada
                      </div>
                      <div className="overflow-y-auto flex-1 p-2 space-y-1">
                        {getDatesForSubject(fallbackSubject.id, currentScheduleData).map((date, idx) => {
                          const dateStr = date.toISOString().split('T')[0];
                          const isSelected = selectedDate === dateStr;
                          const hasNote = notes[fallbackSubject.id]?.[dateStr]?.trim().length > 0;

                          return (
                            <button
                              key={idx}
                              onClick={() => setSelectedDate(dateStr)}
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex justify-between items-center
                                ${isSelected ? 'bg-indigo-50 text-indigo-700 font-medium' : 'hover:bg-slate-50 text-slate-600'}`}
                            >
                              <span>
                                {date.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: 'short' })}
                              </span>
                              {hasNote && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="w-full md:w-2/3 bg-white border border-slate-200 rounded-xl flex flex-col h-[500px]">
                      {!user ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                          <User className="w-12 h-12 mb-3 text-slate-200" />
                          <p className="mb-4">Inicia sesión para poder guardar tus notas de clase en la nube.</p>
                          <button
                            onClick={handleLogin}
                            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
                          >
                            <LogIn className="w-4 h-4" />
                            Iniciar sesión
                          </button>
                        </div>
                      ) : selectedDate ? (
                        <>
                          <div className="bg-slate-50 p-3 border-b border-slate-200 font-medium text-sm text-slate-700 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            Clase del {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                          </div>
                          <textarea
                            className="flex-1 w-full p-4 resize-none focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 rounded-b-xl text-slate-700 leading-relaxed"
                            placeholder="Escribe tus notas para esta clase aquí..."
                            value={notes[fallbackSubject.id]?.[selectedDate] || ''}
                            onChange={(e) => handleNoteChange(selectedDate, e.target.value)}
                          />
                        </>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                          <FileText className="w-12 h-12 mb-3 text-slate-200" />
                          <p>Selecciona una fecha de la lista para ver o escribir notas.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })()
        )}
      </main>

      {/* Subject Selection Modal */}
      <AnimatePresence>
        {isSelectingSubjects && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-bold text-slate-900">Selecciona tus materias</h2>
                  <div className="flex items-center bg-slate-100 rounded-lg p-1">
                    <button
                      onClick={() => setSubjectViewMode('cards')}
                      className={`p-1.5 rounded-md transition-colors ${subjectViewMode === 'cards' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                      title="Vista de tarjetas"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSubjectViewMode('table')}
                      className={`p-1.5 rounded-md transition-colors ${subjectViewMode === 'table' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                      title="Vista de tabla"
                    >
                      <Table className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-slate-500 text-sm">Elige las materias que estás cursando para armar tu agenda automáticamente.</p>

                <div className="mt-4 relative">
                  <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar materia, profesor o carrera..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
                {subjectViewMode === 'cards' ? (
                  <div className="grid grid-cols-1 gap-3">
                    {sortedAndFilteredSubjects.map(subject => {
                        const isSelected = tempSelectedSubjects.includes(subject.id);
                        return (
                          <div
                            key={subject.id}
                            onClick={() => toggleSubjectSelection(subject.id)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-4
                              ${isSelected
                                ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                                : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm'
                              }`}
                          >
                            <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors
                              ${isSelected ? 'bg-indigo-600 text-white' : 'border-2 border-slate-300'}
                            `}>
                              {isSelected && <Check className="w-3.5 h-3.5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className={`font-semibold text-sm mb-1 ${isSelected ? 'text-indigo-900' : 'text-slate-900'}`}>
                                {subject.name}
                              </h3>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                                <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {subject.prof}</span>
                                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {subject.day} {subject.time}</span>
                                <span className="flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" /> {subject.career}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                          <tr>
                            <th className="p-3 w-10"></th>
                            <th className="p-3 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('name')}>
                              <div className="flex items-center gap-1">
                                Materia
                                {subjectSortConfig?.key === 'name' ? (
                                  subjectSortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                              </div>
                            </th>
                            <th className="p-3 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('prof')}>
                              <div className="flex items-center gap-1">
                                Profesor
                                {subjectSortConfig?.key === 'prof' ? (
                                  subjectSortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                              </div>
                            </th>
                            <th className="p-3 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('career')}>
                              <div className="flex items-center gap-1">
                                Carrera
                                {subjectSortConfig?.key === 'career' ? (
                                  subjectSortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                              </div>
                            </th>
                            <th className="p-3 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('day')}>
                              <div className="flex items-center gap-1">
                                Día
                                {subjectSortConfig?.key === 'day' ? (
                                  subjectSortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                              </div>
                            </th>
                            <th className="p-3 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('time')}>
                              <div className="flex items-center gap-1">
                                Horario
                                {subjectSortConfig?.key === 'time' ? (
                                  subjectSortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {sortedAndFilteredSubjects.map(subject => {
                            const isSelected = tempSelectedSubjects.includes(subject.id);
                            return (
                              <tr
                                key={subject.id}
                                onClick={() => toggleSubjectSelection(subject.id)}
                                className={`cursor-pointer transition-colors hover:bg-slate-50 ${isSelected ? 'bg-indigo-50/50' : ''}`}
                              >
                                <td className="p-3">
                                  <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors
                                    ${isSelected ? 'bg-indigo-600 text-white' : 'border-2 border-slate-300'}
                                  `}>
                                    {isSelected && <Check className="w-3.5 h-3.5" />}
                                  </div>
                                </td>
                                <td className={`p-3 font-medium ${isSelected ? 'text-indigo-900' : 'text-slate-900'}`}>{subject.name}</td>
                                <td className="p-3 text-slate-600">{subject.prof}</td>
                                <td className="p-3 text-slate-600">{subject.career}</td>
                                <td className="p-3 text-slate-600">{subject.day}</td>
                                <td className="p-3 text-slate-600">{subject.time}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between">
                <div className="text-sm text-slate-500">
                  <span className="font-semibold text-indigo-600">{tempSelectedSubjects.length}</span> materias seleccionadas
                </div>
                <div className="flex gap-3">
                  {userProfile?.selectedSubjects && userProfile.selectedSubjects.length > 0 && (
                    <button
                      onClick={() => {
                        setTempSelectedSubjects(userProfile.selectedSubjects!);
                        setIsSelectingSubjects(false);
                      }}
                      className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors text-sm"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    onClick={handleSaveSubjects}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors text-sm shadow-sm"
                  >
                    Guardar y Continuar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
