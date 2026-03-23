import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen, GraduationCap, Clock, User, Calendar, Info, Target, List,
  Settings, CheckCircle, BookMarked, FileText, LogIn, Search, Plus, Check,
  LayoutGrid, Table, ArrowUpDown, ArrowUp, ArrowDown, Upload, Loader2, X,
  Shield, ChevronLeft,
} from 'lucide-react';
import { subjects } from './data';
import { Subject, UserProfile, SubjectState, SubjectMeta, CurriculumSubject, getYearFromCareer, getSemesterFromTerm, getDurationFromTerm } from './types';
import { auth, db, googleProvider, storage } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { availableSubjects, AvailableSubject } from './availableSubjects';
import Sidebar from './components/Sidebar';
import CorrelatividadesPage from './pages/CorrelatividadesPage';
import { cn } from './lib/utils';

// ---- Schedule helpers ----
const parseTimeRange = (timeRange: string) => {
  const [start, end] = timeRange.split(' - ');
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  return { start: startH + startM / 60, end: endH + endM / 60 };
};

const MIN_HOUR = 8;
const MAX_HOUR = 23;
const HOUR_HEIGHT = 72;

const getDatesForSubject = (subjectId: string, schedule: Record<string, any[]>) => {
  const daysMap: Record<string, number> = {
    Domingo: 0, Lunes: 1, Martes: 2, Miércoles: 3, Jueves: 4, Viernes: 5, Sábado: 6,
  };
  const subjectDays: string[] = [];
  Object.entries(schedule).forEach(([day, classes]) => {
    if (classes.some(c => c.id === subjectId)) subjectDays.push(day);
  });
  if (subjectDays.length === 0) return [];
  const targetDays = subjectDays.map(d => daysMap[d]);
  const startDate = new Date(2026, 2, 16);
  const endDate = new Date(2026, 6, 10);
  const dates: Date[] = [];
  let current = new Date(startDate);
  while (current <= endDate) {
    if (targetDays.includes(current.getDay())) dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

// ---- Sort icon helper ----
const SortIcon = ({ column, sortConfig }: { column: keyof AvailableSubject; sortConfig: { key: keyof AvailableSubject; direction: 'asc' | 'desc' } | null }) => {
  if (!sortConfig || sortConfig.key !== column) return <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />;
  return sortConfig.direction === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />;
};

// ---- Subject selection modal tabs ----
const tabs = [
  { id: 'overview' as const, label: 'Resumen', icon: Info },
  { id: 'contents' as const, label: 'Contenidos', icon: List },
  { id: 'methodology' as const, label: 'Metodología', icon: Settings },
  { id: 'evaluation' as const, label: 'Evaluación', icon: CheckCircle },
  { id: 'classes' as const, label: 'Clases', icon: FileText },
];

export default function App() {
  // ---- Navigation ----
  const [activePage, setActivePage] = useState<string>('correlatividades');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'contents' | 'methodology' | 'evaluation' | 'classes'>('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // ---- Auth ----
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // ---- Subject selection ----
  const [isSelectingSubjects, setIsSelectingSubjects] = useState(false);
  const [tempSelectedSubjects, setTempSelectedSubjects] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectViewMode, setSubjectViewMode] = useState<'cards' | 'table'>('cards');
  const [subjectSortConfig, setSubjectSortConfig] = useState<{ key: keyof AvailableSubject; direction: 'asc' | 'desc' } | null>(null);

  // ---- Curriculum (correlatividades) ----
  const [progress, setProgress] = useState<Record<string, SubjectState>>({});
  const [subjectMeta, setSubjectMeta] = useState<Record<string, SubjectMeta>>({});

  // ---- Admin & programs ----
  const [programs, setPrograms] = useState<Record<string, string>>({});
  const [uploadingSubject, setUploadingSubject] = useState<string | null>(null);
  const [adminSearchQuery, setAdminSearchQuery] = useState('');

  // ---- Notes ----
  const [notes, setNotes] = useState<Record<string, Record<string, string>>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // ---- Auth listener ----
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async currentUser => {
      setUser(currentUser);
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        const profileUnsubscribe = onSnapshot(userRef, async docSnap => {
          if (!docSnap.exists()) {
            const newProfile = {
              email: currentUser.email,
              name: currentUser.displayName,
              createdAt: serverTimestamp(),
              selectedSubjects: [],
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
        setProgress({});
        setSubjectMeta({});
        setIsAuthReady(true);
      }
    });
    return () => unsubscribe();
  }, []);

  // ---- Fetch programs ----
  useEffect(() => {
    if (!isAuthReady) return;
    const programsRef = doc(db, 'settings/programs');
    const unsubscribe = onSnapshot(programsRef, docSnap => {
      if (docSnap.exists()) setPrograms(docSnap.data() as Record<string, string>);
    }, err => console.error('Error fetching programs:', err));
    return () => unsubscribe();
  }, [isAuthReady]);

  // ---- Fetch progress & meta from Firestore ----
  useEffect(() => {
    if (!user) return;
    const progressRef = doc(db, `users/${user.uid}/curriculum/progress`);
    const unsubscribeProgress = onSnapshot(progressRef, docSnap => {
      if (docSnap.exists()) setProgress(docSnap.data() as Record<string, SubjectState>);
    });
    const metaRef = doc(db, `users/${user.uid}/curriculum/meta`);
    const unsubscribeMeta = onSnapshot(metaRef, docSnap => {
      if (docSnap.exists()) setSubjectMeta(docSnap.data() as Record<string, SubjectMeta>);
    });
    return () => {
      unsubscribeProgress();
      unsubscribeMeta();
    };
  }, [user]);

  // ---- Fetch notes ----
  useEffect(() => {
    if (!isAuthReady || !user || !selectedSubjectId) return;
    const notesRef = doc(db, `users/${user.uid}/notes/${selectedSubjectId}`);
    const unsubscribe = onSnapshot(notesRef, docSnap => {
      setNotes(prev => ({
        ...prev,
        [selectedSubjectId]: docSnap.exists() ? (docSnap.data().notes || {}) : {},
      }));
    });
    return () => unsubscribe();
  }, [user, isAuthReady, selectedSubjectId]);

  // ---- Reset date on subject change ----
  useEffect(() => {
    setSelectedDate(null);
  }, [selectedSubjectId]);

  // ---- Schedule data ----
  const currentScheduleData = useMemo(() => {
    const schedule: Record<string, any[]> = { Lunes: [], Martes: [], Miércoles: [], Jueves: [], Viernes: [] };
    (userProfile?.selectedSubjects || []).forEach(subjectId => {
      const s = availableSubjects.find(s => s.id === subjectId);
      if (s && schedule[s.day]) {
        schedule[s.day].push({ id: s.id, time: s.time.replace(' a ', ' - '), name: s.name, prof: s.prof });
      }
    });
    return schedule;
  }, [userProfile?.selectedSubjects]);

  // ---- Curriculum subjects (for correlatividades) ----
  const curriculumSubjects: CurriculumSubject[] = useMemo(() => {
    const selected = userProfile?.selectedSubjects || [];
    return selected.map(id => {
      const avail = availableSubjects.find(s => s.id === id);
      if (!avail) return null;
      const meta = subjectMeta[id];
      return {
        id: avail.id,
        name: avail.name,
        prof: avail.prof,
        career: avail.career,
        year: meta?.year ?? getYearFromCareer(avail.career),
        semester: meta?.semester ?? getSemesterFromTerm(avail.term),
        prerequisites: meta?.prerequisites ?? [],
        category: meta?.category ?? 'core',
        duration: meta?.duration ?? getDurationFromTerm(avail.term),
      } as CurriculumSubject;
    }).filter(Boolean) as CurriculumSubject[];
  }, [userProfile?.selectedSubjects, subjectMeta]);

  // ---- In-progress subject names ----
  const inProgressSubjectNames = useMemo(() => {
    return curriculumSubjects
      .filter(s => progress[s.id] === 'in-progress')
      .map(s => s.name);
  }, [curriculumSubjects, progress]);

  // ---- Sorted & filtered subjects for selection modal ----
  const sortedAndFilteredSubjects = useMemo(() => {
    let filtered = availableSubjects.filter(s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.prof.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.career.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (subjectSortConfig) {
      filtered.sort((a, b) => {
        const aVal = a[subjectSortConfig.key];
        const bVal = b[subjectSortConfig.key];
        if (aVal < bVal) return subjectSortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return subjectSortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [searchQuery, subjectSortConfig]);

  // ---- Handlers ----
  const handleLogin = async () => {
    try { await signInWithPopup(auth, googleProvider); }
    catch (err) { console.error('Login failed:', err); }
  };

  const handleLogout = async () => {
    try { await signOut(auth); }
    catch (err) { console.error('Logout failed:', err); }
  };

  const handleSaveSubjects = async () => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid), { selectedSubjects: tempSelectedSubjects }, { merge: true });
      setIsSelectingSubjects(false);
    } catch (err) { console.error('Error saving subjects:', err); }
  };

  const toggleSubjectSelection = (id: string) => {
    setTempSelectedSubjects(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSort = (key: keyof AvailableSubject) => {
    setSubjectSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleFileUpload = async (subjectId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) { alert('Debes iniciar sesión para subir archivos.'); return; }
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { alert('Por favor, sube solo archivos PDF.'); return; }
    setUploadingSubject(subjectId);
    try {
      const fileRef = ref(storage, `programs/${subjectId}.pdf`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      await setDoc(doc(db, 'settings/programs'), { [subjectId]: url }, { merge: true });
    } catch (err) {
      console.error('Error uploading file:', err);
      alert('Hubo un error al subir el archivo.');
    } finally {
      setUploadingSubject(null);
      event.target.value = '';
    }
  };

  const handleNoteChange = async (date: string, content: string) => {
    if (!user || !selectedSubjectId) return;
    setNotes(prev => ({ ...prev, [selectedSubjectId]: { ...(prev[selectedSubjectId] || {}), [date]: content } }));
    try {
      await setDoc(doc(db, `users/${user.uid}/notes/${selectedSubjectId}`), {
        subjectId: selectedSubjectId,
        notes: { ...(notes[selectedSubjectId] || {}), [date]: content },
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (err) { console.error('Error saving note:', err); }
  };

  const handleUpdateSubjectState = async (subject: CurriculumSubject, newState: SubjectState) => {
    const isSubjectUnlocked = (s: CurriculumSubject) =>
      s.prerequisites.length === 0 ||
      s.prerequisites.every(preId => progress[preId] === 'signed' || progress[preId] === 'passed');

    if (!isSubjectUnlocked(subject)) return;

    const newProgress = { ...progress, [subject.id]: newState };

    if (newState === 'pending') {
      const resetDependents = (id: string) => {
        curriculumSubjects
          .filter(s => s.prerequisites.includes(id))
          .forEach(dep => {
            if (newProgress[dep.id] !== 'pending') {
              newProgress[dep.id] = 'pending';
              resetDependents(dep.id);
            }
          });
      };
      resetDependents(subject.id);
    }

    setProgress(newProgress);

    if (user) {
      try {
        await setDoc(doc(db, `users/${user.uid}/curriculum/progress`), newProgress);
      } catch (err) { console.error('Error saving progress:', err); }
    }
  };

  const handleSaveSubjectMeta = async (savedSubject: CurriculumSubject, unlocks: string[]) => {
    const newMeta: SubjectMeta = {
      year: savedSubject.year,
      semester: savedSubject.semester,
      prerequisites: savedSubject.prerequisites,
      category: savedSubject.category,
      duration: savedSubject.duration,
    };

    // Build updated meta for all subjects
    const updatedMeta = { ...subjectMeta, [savedSubject.id]: newMeta };

    // Handle "unlocks" relationships
    curriculumSubjects.forEach(s => {
      if (s.id === savedSubject.id) return;
      const existing = updatedMeta[s.id] ?? {
        year: getYearFromCareer(s.career),
        semester: getSemesterFromTerm(availableSubjects.find(a => a.id === s.id)?.term ?? '1º'),
        prerequisites: [...s.prerequisites],
        category: s.category,
        duration: s.duration,
      };
      // Remove savedSubject from this subject's prerequisites first
      const prereqsWithoutSaved = existing.prerequisites.filter(pid => pid !== savedSubject.id);
      // Add it back if it's in unlocks
      if (unlocks.includes(s.id)) {
        updatedMeta[s.id] = { ...existing, prerequisites: [...prereqsWithoutSaved, savedSubject.id] };
      } else {
        updatedMeta[s.id] = { ...existing, prerequisites: prereqsWithoutSaved };
      }
    });

    setSubjectMeta(updatedMeta);

    if (user) {
      try {
        await setDoc(doc(db, `users/${user.uid}/curriculum/meta`), updatedMeta);
      } catch (err) { console.error('Error saving subject meta:', err); }
    }
  };

  // ---- Selected subject data ----
  const selectedSubject = selectedSubjectId ? subjects.find(s => s.id === selectedSubjectId) : null;
  const selectedFallbackSubject = selectedSubjectId && !selectedSubject
    ? availableSubjects.find(s => s.id === selectedSubjectId)
    : null;

  // ---- Render pages ----
  const renderPage = () => {
    if (activePage === 'correlatividades') {
      return (
        <CorrelatividadesPage
          subjects={curriculumSubjects}
          progress={progress}
          onUpdateSubjectState={handleUpdateSubjectState}
          onSaveSubject={handleSaveSubjectMeta}
        />
      );
    }

    if (activePage === 'agenda') {
      return <AgendaPage scheduleData={currentScheduleData} onSelectSubject={id => { setSelectedSubjectId(id); setActivePage('programas'); setActiveTab('overview'); }} />;
    }

    if (activePage === 'admin') {
      return (
        <AdminPage
          adminSearchQuery={adminSearchQuery}
          onAdminSearchChange={setAdminSearchQuery}
          programs={programs}
          uploadingSubject={uploadingSubject}
          onFileUpload={handleFileUpload}
        />
      );
    }

    if (activePage === 'programas') {
      if (selectedSubject) {
        return (
          <ProgramaPage
            subject={selectedSubject}
            programs={programs}
            user={user}
            notes={notes}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onNoteChange={handleNoteChange}
            onLogin={handleLogin}
            scheduleData={currentScheduleData}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onBack={() => setActivePage('agenda')}
          />
        );
      }
      if (selectedFallbackSubject) {
        return (
          <FallbackProgramaPage
            subject={selectedFallbackSubject}
            programs={programs}
            onBack={() => setActivePage('agenda')}
          />
        );
      }
      // No subject selected: show list of selected subjects
      return (
        <div className="h-full flex flex-col bg-stone-50">
          <header className="bg-white border-b border-stone-200 shrink-0 px-6 h-16 flex items-center">
            <h1 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-3">
              <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center text-white">
                <BookOpen size={18} />
              </div>
              Programas de Estudio
            </h1>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-2xl mx-auto space-y-3">
              {(userProfile?.selectedSubjects || []).length === 0 ? (
                <div className="text-center py-12 text-stone-400">
                  <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
                  <p>No tenés materias seleccionadas.</p>
                </div>
              ) : (
                (userProfile?.selectedSubjects || []).map(id => {
                  const s = availableSubjects.find(x => x.id === id);
                  if (!s) return null;
                  const hasPDF = !!programs[id];
                  return (
                    <button
                      key={id}
                      onClick={() => { setSelectedSubjectId(id); setActiveTab('overview'); }}
                      className="w-full text-left p-4 bg-white rounded-xl border border-stone-200 hover:border-stone-300 hover:shadow-sm transition-all flex items-center justify-between gap-4"
                    >
                      <div>
                        <p className="font-medium text-stone-900">{s.name}</p>
                        <p className="text-xs text-stone-400 mt-0.5">{s.career} · {s.prof}</p>
                      </div>
                      {hasPDF && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">
                          PDF
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </main>
        </div>
      );
    }

    return (
      <div className="flex-1 flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <h2 className="text-2xl font-serif font-bold text-stone-900 mb-2">Página en construcción</h2>
          <p className="text-stone-500">La sección {activePage} estará disponible pronto.</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-stone-50 font-sans">
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-stone-900 text-white z-30 px-4 h-14 flex items-center justify-between">
        <span className="font-serif font-bold text-white">IES Nº 1</span>
        <button onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} className="p-2 hover:bg-stone-800 rounded-lg">
          {isMobileSidebarOpen ? <X size={20} /> : <Settings size={20} />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={cn(
        "fixed md:sticky top-0 left-0 h-screen z-20 transition-transform duration-300",
        isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <Sidebar
          activePage={activePage}
          onNavigate={page => {
            setActivePage(page);
            setIsMobileSidebarOpen(false);
          }}
          user={user}
          onLogin={handleLogin}
          onLogout={handleLogout}
          onConfigureSubjects={() => {
            setTempSelectedSubjects(userProfile?.selectedSubjects || []);
            setIsSelectingSubjects(true);
          }}
          inProgressSubjectNames={inProgressSubjectNames}
        />
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 z-10 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden md:pt-0 pt-14">
        {renderPage()}
      </div>

      {/* Subject selection modal */}
      <AnimatePresence>
        {isSelectingSubjects && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-stone-200"
            >
              {/* Modal header */}
              <div className="p-6 border-b border-stone-100 bg-stone-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                <div>
                  <h2 className="text-xl font-serif font-bold text-stone-900">Configurar Materias</h2>
                  <p className="text-sm text-stone-500 mt-1">
                    {tempSelectedSubjects.length} materia{tempSelectedSubjects.length !== 1 ? 's' : ''} seleccionada{tempSelectedSubjects.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Buscar..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-full text-sm w-52 focus:outline-none focus:ring-2 focus:ring-stone-400"
                    />
                  </div>
                  <div className="flex border border-stone-200 rounded-lg overflow-hidden">
                    <button onClick={() => setSubjectViewMode('cards')} className={cn("p-2 transition-colors", subjectViewMode === 'cards' ? "bg-stone-900 text-white" : "bg-white text-stone-400 hover:bg-stone-50")}>
                      <LayoutGrid size={16} />
                    </button>
                    <button onClick={() => setSubjectViewMode('table')} className={cn("p-2 transition-colors", subjectViewMode === 'table' ? "bg-stone-900 text-white" : "bg-white text-stone-400 hover:bg-stone-50")}>
                      <Table size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal body */}
              <div className="flex-1 overflow-y-auto p-6">
                {subjectViewMode === 'cards' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {sortedAndFilteredSubjects.map(s => {
                      const isSelected = tempSelectedSubjects.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          onClick={() => toggleSubjectSelection(s.id)}
                          className={cn(
                            "text-left p-4 rounded-xl border transition-all flex flex-col gap-2",
                            isSelected ? "border-stone-800 bg-stone-50 ring-1 ring-stone-800" : "border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-mono text-stone-400">{s.career}</span>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-stone-900 flex items-center justify-center shrink-0">
                                <Check size={12} className="text-white" />
                              </div>
                            )}
                          </div>
                          <p className="font-medium text-sm text-stone-900 leading-tight">{s.name}</p>
                          <p className="text-xs text-stone-400 truncate">{s.prof}</p>
                          <p className="text-xs text-stone-500">{s.day} {s.time}</p>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="bg-stone-50 border-y border-stone-200 text-stone-600">
                          <th className="py-2.5 px-3 font-semibold w-8"></th>
                          {(['name', 'career', 'prof', 'day', 'time'] as (keyof AvailableSubject)[]).map(col => (
                            <th key={col} className="py-2.5 px-3 font-semibold">
                              <button onClick={() => handleSort(col)} className="flex items-center gap-1 hover:text-stone-900 transition-colors">
                                {col === 'name' ? 'Materia' : col === 'career' ? 'Carrera' : col === 'prof' ? 'Profesor' : col === 'day' ? 'Día' : 'Horario'}
                                <SortIcon column={col} sortConfig={subjectSortConfig} />
                              </button>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {sortedAndFilteredSubjects.map(s => {
                          const isSelected = tempSelectedSubjects.includes(s.id);
                          return (
                            <tr
                              key={s.id}
                              onClick={() => toggleSubjectSelection(s.id)}
                              className={cn("cursor-pointer transition-colors", isSelected ? "bg-stone-50" : "hover:bg-stone-50/50")}
                            >
                              <td className="py-2.5 px-3">
                                <div className={cn("w-4 h-4 rounded border flex items-center justify-center", isSelected ? "bg-stone-900 border-stone-900" : "border-stone-300")}>
                                  {isSelected && <Check size={10} className="text-white" />}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 font-medium text-stone-900">{s.name}</td>
                              <td className="py-2.5 px-3 text-stone-500">{s.career}</td>
                              <td className="py-2.5 px-3 text-stone-500">{s.prof}</td>
                              <td className="py-2.5 px-3 text-stone-500">{s.day}</td>
                              <td className="py-2.5 px-3 text-stone-500 font-mono text-xs">{s.time}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Modal footer */}
              <div className="p-6 border-t border-stone-100 bg-stone-50 flex justify-between items-center shrink-0">
                <button
                  onClick={() => setIsSelectingSubjects(false)}
                  className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveSubjects}
                  disabled={!user}
                  className="px-5 py-2 text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Guardar Materias
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---- Inline page components ----

function AgendaPage({
  scheduleData,
  onSelectSubject,
}: {
  scheduleData: Record<string, any[]>;
  onSelectSubject: (id: string) => void;
}) {
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

  return (
    <div className="h-full flex flex-col bg-stone-50 overflow-hidden">
      <header className="bg-white border-b border-stone-200 shrink-0 px-6 h-16 flex items-center gap-3">
        <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center text-white">
          <Calendar size={18} />
        </div>
        <h1 className="font-serif font-bold text-lg text-stone-900">Agenda de Horarios</h1>
      </header>

      <main className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              {/* Day headers */}
              <div className="flex border-b border-stone-200 bg-stone-50">
                <div className="w-14 shrink-0 border-r border-stone-200"></div>
                <div className="flex-1 flex">
                  {days.map(day => (
                    <div key={day} className="flex-1 text-center py-3 font-semibold text-stone-700 text-sm border-r last:border-r-0 border-stone-200">
                      {day}
                    </div>
                  ))}
                </div>
              </div>

              {/* Body */}
              <div className="flex relative bg-stone-50/30" style={{ height: `${(MAX_HOUR - MIN_HOUR) * HOUR_HEIGHT}px` }}>
                {/* Time labels */}
                <div className="w-14 shrink-0 border-r border-stone-200 bg-white relative">
                  {Array.from({ length: MAX_HOUR - MIN_HOUR + 1 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-full text-right pr-2 text-xs text-stone-400 font-medium"
                      style={{ top: `${i * HOUR_HEIGHT - 8}px` }}
                    >
                      {MIN_HOUR + i}:00
                    </div>
                  ))}
                </div>

                <div className="flex-1 flex relative bg-white">
                  {Array.from({ length: MAX_HOUR - MIN_HOUR }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-full border-b border-stone-100 pointer-events-none"
                      style={{ top: `${(i + 1) * HOUR_HEIGHT}px` }}
                    />
                  ))}
                  {days.map(day => (
                    <div key={day} className="flex-1 relative border-r last:border-r-0 border-stone-100">
                      {scheduleData[day]?.map(item => {
                        const { start, end } = parseTimeRange(item.time);
                        const top = (start - MIN_HOUR) * HOUR_HEIGHT;
                        const height = (end - start) * HOUR_HEIGHT;
                        return (
                          <div
                            key={item.id}
                            onClick={() => onSelectSubject(item.id)}
                            className="absolute inset-x-1 rounded-lg border border-stone-300 bg-stone-100 p-2 overflow-hidden hover:bg-stone-200 hover:border-stone-400 transition-colors cursor-pointer shadow-sm z-10 flex flex-col"
                            style={{ top: `${top}px`, height: `${height}px` }}
                          >
                            <div className="text-[10px] font-mono font-semibold text-stone-600 mb-1">{item.time}</div>
                            <h4 className="text-xs font-bold text-stone-900 leading-tight line-clamp-3">{item.name}</h4>
                            <p className="text-[10px] text-stone-500 mt-auto pt-1 truncate">{item.prof}</p>
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
      </main>
    </div>
  );
}

function AdminPage({
  adminSearchQuery,
  onAdminSearchChange,
  programs,
  uploadingSubject,
  onFileUpload,
}: {
  adminSearchQuery: string;
  onAdminSearchChange: (v: string) => void;
  programs: Record<string, string>;
  uploadingSubject: string | null;
  onFileUpload: (id: string, e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const filtered = availableSubjects.filter(s =>
    s.name.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
    s.prof.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
    s.career.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
    s.day.toLowerCase().includes(adminSearchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-stone-50 overflow-hidden">
      <header className="bg-white border-b border-stone-200 shrink-0 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center text-white">
            <Shield size={18} />
          </div>
          <h1 className="font-serif font-bold text-lg text-stone-900">Panel de Administración</h1>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Buscar materias, profesores..."
            value={adminSearchQuery}
            onChange={e => onAdminSearchChange(e.target.value)}
            className="pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-full text-sm w-64 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:bg-white transition-all"
          />
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-stone-50 border-y border-stone-200 text-stone-600">
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
              <tbody className="divide-y divide-stone-100">
                {filtered.map(s => (
                  <tr key={s.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-stone-900">{s.name}</td>
                    <td className="py-3 px-4 text-stone-600">{s.prof}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-stone-100 text-stone-700">
                        {s.career}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-stone-600">{s.term}</td>
                    <td className="py-3 px-4 text-stone-600 font-medium">{s.day}</td>
                    <td className="py-3 px-4 text-stone-600 font-mono text-xs">{s.time}</td>
                    <td className="py-3 px-4 text-stone-600">{s.room}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {programs[s.id] ? (
                          <a href={programs[s.id]} target="_blank" rel="noopener noreferrer" className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors" title="Ver programa">
                            <CheckCircle className="w-5 h-5" />
                          </a>
                        ) : (
                          <span className="p-1.5 text-stone-300"><FileText className="w-5 h-5" /></span>
                        )}
                        <label className="cursor-pointer p-1.5 text-stone-600 hover:bg-stone-100 rounded-md transition-colors" title="Subir programa">
                          {uploadingSubject === s.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Upload className="w-5 h-5" />
                          )}
                          <input type="file" accept="application/pdf" className="hidden" onChange={e => onFileUpload(s.id, e)} disabled={uploadingSubject === s.id} />
                        </label>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function ProgramaPage({
  subject,
  programs,
  user,
  notes,
  selectedDate,
  onSelectDate,
  onNoteChange,
  onLogin,
  scheduleData,
  activeTab,
  onTabChange,
  onBack,
}: {
  subject: Subject;
  programs: Record<string, string>;
  user: FirebaseUser | null;
  notes: Record<string, Record<string, string>>;
  selectedDate: string | null;
  onSelectDate: (d: string) => void;
  onNoteChange: (date: string, content: string) => void;
  onLogin: () => void;
  scheduleData: Record<string, any[]>;
  activeTab: 'overview' | 'contents' | 'methodology' | 'evaluation' | 'classes';
  onTabChange: (tab: typeof activeTab) => void;
  onBack: () => void;
}) {
  return (
    <div className="h-full flex flex-col bg-stone-50 overflow-hidden">
      {/* Header */}
      <header className="bg-stone-900 text-white shrink-0">
        <div className="px-6 py-4">
          <button onClick={onBack} className="flex items-center gap-2 text-stone-400 hover:text-white text-sm mb-4 transition-colors">
            <ChevronLeft size={16} /> Volver
          </button>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-medium mb-3">
                <GraduationCap size={14} />
                {subject.career}
              </div>
              <h1 className="text-2xl md:text-3xl font-serif font-bold tracking-tight leading-tight">{subject.name}</h1>
            </div>
            {programs[subject.id] && (
              <a href={programs[subject.id]} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors whitespace-nowrap text-sm">
                <FileText size={16} /> Ver Programa
              </a>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-stone-400 mt-4">
            <div className="flex items-center gap-2"><User size={14} className="text-stone-500" /><span><strong className="text-white">Docente:</strong> {subject.professor}</span></div>
            <div className="flex items-center gap-2"><Clock size={14} className="text-stone-500" /><span><strong className="text-white">Carga:</strong> {subject.hours}</span></div>
            <div className="flex items-center gap-2"><Calendar size={14} className="text-stone-500" /><span><strong className="text-white">Duración:</strong> {subject.duration}</span></div>
            <div className="flex items-center gap-2"><BookOpen size={14} className="text-stone-500" /><span><strong className="text-white">Campo:</strong> {subject.field}</span></div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-t border-white/10 px-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                activeTab === tab.id
                  ? "border-white text-white"
                  : "border-transparent text-stone-400 hover:text-white hover:border-white/30"
              )}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Tab content */}
      <main className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="p-6 md:p-10 max-w-4xl mx-auto"
          >
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <section>
                  <h3 className="font-serif text-xl font-bold text-stone-900 mb-4 flex items-center gap-2"><Info size={18} className="text-stone-500" /> Fundamentación</h3>
                  <p className="text-stone-600 leading-relaxed">{subject.foundation}</p>
                </section>
                <section>
                  <h3 className="font-serif text-xl font-bold text-stone-900 mb-4 flex items-center gap-2"><Target size={18} className="text-stone-500" /> Objetivos</h3>
                  <ul className="space-y-2">
                    {subject.objectives.map((obj, i) => (
                      <li key={i} className="flex items-start gap-3 text-stone-600">
                        <CheckCircle size={16} className="text-stone-400 shrink-0 mt-0.5" />
                        {obj}
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            )}

            {activeTab === 'contents' && (
              <div className="space-y-4">
                <h3 className="font-serif text-xl font-bold text-stone-900 mb-6 flex items-center gap-2"><List size={18} className="text-stone-500" /> Unidades Temáticas</h3>
                {subject.units.map((unit, idx) => (
                  <div key={idx} className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
                    <h4 className="font-semibold text-stone-900 mb-2">{unit.title}</h4>
                    <p className="text-stone-600 leading-relaxed">{unit.description}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'methodology' && (
              <div>
                <h3 className="font-serif text-xl font-bold text-stone-900 mb-6 flex items-center gap-2"><Settings size={18} className="text-stone-500" /> Metodología</h3>
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-6">
                  <p className="text-stone-700 leading-relaxed">{subject.methodology}</p>
                </div>
              </div>
            )}

            {activeTab === 'evaluation' && (
              <div className="space-y-8">
                <section>
                  <h3 className="font-serif text-xl font-bold text-stone-900 mb-4 flex items-center gap-2"><CheckCircle size={18} className="text-stone-500" /> Evaluación</h3>
                  <div className="bg-stone-50 border border-stone-200 rounded-xl p-6">
                    <p className="text-stone-700 leading-relaxed">{subject.evaluation}</p>
                  </div>
                </section>
                <section>
                  <h3 className="font-serif text-xl font-bold text-stone-900 mb-4 flex items-center gap-2"><BookMarked size={18} className="text-stone-500" /> Bibliografía</h3>
                  <ul className="space-y-2">
                    {subject.bibliography.map((bib, i) => (
                      <li key={i} className="flex items-start gap-3 text-stone-600 bg-white p-4 rounded-xl border border-stone-200">
                        <BookOpen size={16} className="text-stone-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{bib}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            )}

            {activeTab === 'classes' && (
              <div>
                <h3 className="font-serif text-xl font-bold text-stone-900 mb-6 flex items-center gap-2"><FileText size={18} className="text-stone-500" /> Notas de Clases</h3>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-1/3 bg-white border border-stone-200 rounded-xl overflow-hidden flex flex-col" style={{ height: 480 }}>
                    <div className="bg-stone-50 p-3 border-b border-stone-200 text-sm font-medium text-stone-700">Fechas de cursada</div>
                    <div className="overflow-y-auto flex-1 p-2 space-y-1">
                      {getDatesForSubject(subject.id, scheduleData).map((date, idx) => {
                        const dateStr = date.toISOString().split('T')[0];
                        const isSelected = selectedDate === dateStr;
                        const hasNote = notes[subject.id]?.[dateStr]?.trim().length > 0;
                        return (
                          <button
                            key={idx}
                            onClick={() => onSelectDate(dateStr)}
                            className={cn(
                              "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex justify-between items-center",
                              isSelected ? "bg-stone-900 text-white font-medium" : "hover:bg-stone-50 text-stone-600"
                            )}
                          >
                            <span>{date.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: 'short' })}</span>
                            {hasNote && <div className="w-1.5 h-1.5 rounded-full bg-stone-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="w-full md:w-2/3 bg-white border border-stone-200 rounded-xl flex flex-col" style={{ height: 480 }}>
                    {!user ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-stone-400 p-6 text-center">
                        <User size={48} className="mb-3 opacity-20" />
                        <p className="mb-4 text-sm">Iniciá sesión para guardar tus notas.</p>
                        <button onClick={onLogin} className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
                          <LogIn size={16} /> Iniciar sesión
                        </button>
                      </div>
                    ) : selectedDate ? (
                      <>
                        <div className="bg-stone-50 p-3 border-b border-stone-200 text-sm font-medium text-stone-700 flex items-center gap-2">
                          <Calendar size={14} className="text-stone-400" />
                          Clase del {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </div>
                        <textarea
                          className="flex-1 w-full p-4 resize-none focus:outline-none text-stone-700 leading-relaxed"
                          placeholder="Escribe tus notas para esta clase aquí..."
                          value={notes[subject.id]?.[selectedDate] || ''}
                          onChange={e => onNoteChange(selectedDate, e.target.value)}
                        />
                      </>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-stone-400 p-6 text-center">
                        <FileText size={48} className="mb-3 opacity-20" />
                        <p className="text-sm">Seleccioná una fecha para ver o escribir notas.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function FallbackProgramaPage({
  subject,
  programs,
  onBack,
}: {
  subject: AvailableSubject;
  programs: Record<string, string>;
  onBack: () => void;
}) {
  return (
    <div className="h-full flex flex-col bg-stone-50 overflow-hidden">
      <header className="bg-stone-900 text-white shrink-0 px-6 py-6">
        <button onClick={onBack} className="flex items-center gap-2 text-stone-400 hover:text-white text-sm mb-4 transition-colors">
          <ChevronLeft size={16} /> Volver
        </button>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-medium mb-3">
              <GraduationCap size={14} />
              {subject.career}
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold tracking-tight">{subject.name}</h1>
          </div>
          {programs[subject.id] && (
            <a href={programs[subject.id]} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors whitespace-nowrap text-sm">
              <FileText size={16} /> Ver Programa
            </a>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm text-stone-400 mt-4">
          <div className="flex items-center gap-2"><User size={14} className="text-stone-500" /><span><strong className="text-white">Docente:</strong> {subject.prof}</span></div>
          <div className="flex items-center gap-2"><Clock size={14} className="text-stone-500" /><span><strong className="text-white">Horario:</strong> {subject.day} {subject.time}</span></div>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-6 md:p-10">
        <div className="max-w-2xl mx-auto bg-stone-100 border border-stone-200 rounded-xl p-8 text-center">
          <Info size={32} className="mx-auto mb-3 text-stone-400" />
          <h3 className="text-lg font-semibold text-stone-900 mb-2">Programa no disponible</h3>
          <p className="text-stone-500 text-sm">El programa de estudio completo para esta materia aún no ha sido cargado en el sistema.</p>
        </div>
      </main>
    </div>
  );
}
