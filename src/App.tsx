import React, { useState, useEffect, useMemo } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  addMonths, 
  subMonths, 
  addYears,
  subYears,
  startOfYear, 
  endOfYear, 
  eachMonthOfInterval,
  parseISO,
  isToday,
  getYear,
  getDay
} from 'date-fns';
import { ptBR, es, enUS } from 'date-fns/locale';
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft,
  ChevronsRight,
  Calendar, 
  LogOut, 
  User,
  Trash2,
  Settings2,
  Check,
  LayoutGrid,
  CalendarDays,
  ArrowLeft,
  BarChart3,
  Edit2,
  Languages,
  Share2,
  Bell,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';
import { 
  auth, 
  db, 
  loginWithGoogle, 
  logout, 
  handleFirestoreError, 
  OperationType 
} from './firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  setDoc, 
  doc, 
  deleteDoc, 
  updateDoc,
  Timestamp,
  orderBy
} from 'firebase/firestore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utils ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Translations ---
const translations = {
  pt: {
    title: "Rastreador de Hábitos",
    subtitle: "Organize sua rotina diária com precisão e estilo.",
    login: "Entrar com Google",
    monthly: "Mensal",
    yearly: "Anual",
    back: "Voltar para lista",
    monthlyProgress: "Progresso Mensal",
    yearlyOverview: "Visão Geral Anual",
    yourHabits: "Seus Hábitos",
    clickDetails: "Clique para ver detalhes",
    noHabits: "Nenhum hábito rastreado ainda. Comece adicionando um.",
    newHabit: "Novo Hábito",
    editHabit: "Editar Hábito",
    name: "Nome",
    themeColor: "Cor do Tema",
    cancel: "Cancelar",
    create: "Criar",
    save: "Salvar",
    delete: "Excluir",
    confirmDelete: "Tem certeza que deseja excluir este hábito?",
    today: "Hoje",
    streak: "Sequência",
    share: "Compartilhar",
    reminders: "Lembretes",
    reminderTime: "Hora do Lembrete",
    reminderDays: "Dias do Lembrete",
    enableReminders: "Ativar Lembretes",
    notificationsNotSupported: "Notificações não são suportadas neste navegador.",
    notificationsPermissionDenied: "Permissão para notificações negada.",
    completedDays: "Dias Completados",
    days: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
    months: ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
  },
  en: {
    title: "Habit Tracker",
    subtitle: "Organize your daily routine with precision and style.",
    login: "Login with Google",
    monthly: "Monthly",
    yearly: "Yearly",
    back: "Back to list",
    monthlyProgress: "Monthly Progress",
    yearlyOverview: "Yearly Overview",
    yourHabits: "Your Habits",
    clickDetails: "Click for details",
    noHabits: "No habits tracked yet. Start by adding one.",
    newHabit: "New Habit",
    editHabit: "Edit Habit",
    name: "Name",
    themeColor: "Theme Color",
    cancel: "Cancel",
    create: "Create",
    save: "Save",
    delete: "Delete",
    confirmDelete: "Are you sure you want to delete this habit?",
    today: "Today",
    streak: "Streak",
    share: "Share",
    reminders: "Reminders",
    reminderTime: "Reminder Time",
    reminderDays: "Reminder Days",
    enableReminders: "Enable Reminders",
    notificationsNotSupported: "Notifications are not supported in this browser.",
    notificationsPermissionDenied: "Notification permission denied.",
    completedDays: "Completed Days",
    days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
  },
  es: {
    title: "Rastreador de Hábitos",
    subtitle: "Organiza tu rutina diaria con precisión y estilo.",
    login: "Entrar con Google",
    monthly: "Mensual",
    yearly: "Anual",
    back: "Volver a la lista",
    monthlyProgress: "Progreso Mensual",
    yearlyOverview: "Resumen Anual",
    yourHabits: "Tus Hábitos",
    clickDetails: "Haz clic para ver detalles",
    noHabits: "Aún no hay hábitos rastreados. Comienza agregando uno.",
    newHabit: "Nuevo Hábito",
    editHabit: "Editar Hábito",
    name: "Nombre",
    themeColor: "Color del Tema",
    cancel: "Cancelar",
    create: "Crear",
    save: "Guardar",
    delete: "Eliminar",
    confirmDelete: "¿Estás seguro de que quieres eliminar este hábito?",
    today: "Hoy",
    streak: "Racha",
    share: "Compartir",
    reminders: "Recordatorios",
    reminderTime: "Hora del Recordatorio",
    reminderDays: "Días del Recordatorio",
    enableReminders: "Activar Recordatorios",
    notificationsNotSupported: "Las notificações não são suportadas neste navegador.",
    notificationsPermissionDenied: "Permiso de notificación denegado.",
    completedDays: "Días Completados",
    days: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
    months: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
  }
};

type Language = 'pt' | 'en' | 'es';

const getLocale = (lang: Language) => {
  switch (lang) {
    case 'es': return es;
    case 'en': return enUS;
    default: return ptBR;
  }
};

// --- Types ---
interface Habit {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: Timestamp;
  reminderEnabled?: boolean;
  reminderTime?: string;
  reminderDays?: number[];
}

interface HabitLog {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  userId: string;
}

// --- Components ---

const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const [hasError, setHasError] = useState(false);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      try {
        const parsed = JSON.parse(event.error.message);
        if (parsed.error) {
          setHasError(true);
          setErrorInfo(parsed.error);
        }
      } catch {
        // Not a JSON error
      }
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-zinc-200">
          <h2 className="text-xl font-semibold text-zinc-900 mb-2">Algo deu errado</h2>
          <p className="text-zinc-600 mb-6">{errorInfo || "Ocorreu um erro inesperado."}</p>
          <button 
            onClick={() => setHasError(false)}
            className="w-full py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const HabitTracker = () => {
  const [user, setUser] = useState(auth.currentUser);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [isEditingHabit, setIsEditingHabit] = useState<Habit | null>(null);
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitColor, setNewHabitColor] = useState('#141414');
  const [language, setLanguage] = useState<Language>('pt');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [reminderDays, setReminderDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
  }, []);
  
  const contentRef = React.useRef<HTMLDivElement>(null);
  const shareRef = React.useRef<HTMLDivElement>(null);
  const t = translations[language];

  const getStreak = (habitId: string) => {
    const habitLogs = logs
      .filter(l => l.habitId === habitId)
      .map(l => l.date)
      .sort((a, b) => b.localeCompare(a)); // Sort descending (newest first)

    if (habitLogs.length === 0) return 0;

    let streak = 0;
    let checkDate = new Date();
    
    // If not completed today, check if it was completed yesterday to continue streak
    const todayStr = format(checkDate, 'yyyy-MM-dd');
    const yesterdayStr = format(new Date(checkDate.getTime() - 86400000), 'yyyy-MM-dd');
    
    if (!habitLogs.includes(todayStr) && !habitLogs.includes(yesterdayStr)) {
      return 0;
    }

    // Start from the most recent completion
    let currentIdx = habitLogs.includes(todayStr) ? 0 : 0;
    if (!habitLogs.includes(todayStr) && habitLogs.includes(yesterdayStr)) {
      checkDate = new Date(checkDate.getTime() - 86400000);
    }

    while (true) {
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      if (habitLogs.includes(dateStr)) {
        streak++;
        checkDate = new Date(checkDate.getTime() - 86400000);
      } else {
        break;
      }
    }

    return streak;
  };

  const shareImage = async () => {
    if (shareRef.current === null) return;
    
    try {
      const dataUrl = await toPng(shareRef.current, { 
        backgroundColor: selectedHabit?.color || '#020617',
        quality: 1,
        pixelRatio: 3
      });
      
      // Check if native share is available and supports files
      if (navigator.share && navigator.canShare) {
        try {
          const response = await fetch(dataUrl);
          const blob = await response.blob();
          const file = new File([blob], `habit-progress-${selectedHabitId}.png`, { type: 'image/png' });
          
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'Habit Progress',
            });
            return;
          }
        } catch (shareErr) {
          console.error('Native share failed, falling back to download:', shareErr);
        }
      }
      
      // Fallback to download
      const link = document.createElement('a');
      link.download = `habit-progress-${selectedHabitId}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error generating image:', err);
    }
  };

  useEffect(() => {
    return auth.onAuthStateChanged((u) => setUser(u));
  }, []);

  useEffect(() => {
    if (!user) return;

    const habitsQuery = query(
      collection(db, 'habits'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'asc')
    );

    const unsubscribeHabits = onSnapshot(habitsQuery, (snapshot) => {
      setHabits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Habit)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'habits'));

    const logsQuery = query(
      collection(db, 'logs'),
      where('userId', '==', user.uid)
    );

    const unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HabitLog)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'logs'));

    return () => {
      unsubscribeHabits();
      unsubscribeLogs();
    };
  }, [user]);

  const toggleHabit = async (habitId: string, date: Date) => {
    if (!user) return;
    const dateStr = format(date, 'yyyy-MM-dd');
    const logId = `${habitId}_${dateStr}`;
    const existingLog = logs.find(l => l.habitId === habitId && l.date === dateStr);

    try {
      if (existingLog) {
        await deleteDoc(doc(db, 'logs', logId));
      } else {
        await setDoc(doc(db, 'logs', logId), {
          habitId,
          date: dateStr,
          completed: true,
          userId: user.uid
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `logs/${logId}`);
    }
  };

  const addHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newHabitName.trim()) return;

    try {
      await addDoc(collection(db, 'habits'), {
        name: newHabitName,
        color: newHabitColor,
        userId: user.uid,
        createdAt: Timestamp.now(),
        reminderEnabled,
        reminderTime,
        reminderDays
      });
      setNewHabitName('');
      setIsAddingHabit(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'habits');
    }
  };

  const updateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isEditingHabit || !newHabitName.trim()) return;

    try {
      await updateDoc(doc(db, 'habits', isEditingHabit.id), {
        name: newHabitName,
        color: newHabitColor,
        reminderEnabled,
        reminderTime,
        reminderDays
      });
      setNewHabitName('');
      setIsEditingHabit(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `habits/${isEditingHabit.id}`);
    }
  };

  const deleteHabit = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'habits', id));
      if (selectedHabitId === id) setSelectedHabitId(null);
      setHabitToDelete(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `habits/${id}`);
    }
  };

  useEffect(() => {
    if (!user || !habits.length) return;

    const checkReminders = () => {
      if (!("Notification" in window) || Notification.permission !== 'granted') return;

      const now = new Date();
      const currentDay = now.getDay();
      const currentTime = format(now, 'HH:mm');

      habits.forEach(habit => {
        if (
          habit.reminderEnabled &&
          habit.reminderTime === currentTime &&
          habit.reminderDays?.includes(currentDay)
        ) {
          const todayStr = format(now, 'yyyy-MM-dd');
          const isCompleted = logs.some(l => l.habitId === habit.id && l.date === todayStr);

          if (!isCompleted) {
            new Notification(habit.name, {
              body: language === 'pt' ? `Não se esqueça de: ${habit.name}!` : (language === 'en' ? `Don't forget: ${habit.name}!` : `¡No olvides: ${habit.name}!`),
              icon: '/favicon.ico'
            });
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 60000);
    return () => clearInterval(interval);
  }, [user, habits, logs, language]);

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      alert(t.notificationsNotSupported);
      return false;
    }
    
    if (Notification.permission === 'granted') return true;
    
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      alert(t.notificationsPermissionDenied);
      return false;
    }
    return true;
  };

  const toggleReminderDay = (day: number) => {
    setReminderDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  };

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const monthsInYear = useMemo(() => {
    const start = startOfYear(currentDate);
    const end = endOfYear(currentDate);
    return eachMonthOfInterval({ start, end });
  }, [currentDate]);

  const selectedHabit = habits.find(h => h.id === selectedHabitId);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 font-sans p-6 text-slate-100">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center"
        >
          <h1 className="text-6xl font-serif italic mb-4 tracking-tight text-blue-400">{t.title}</h1>
          <p className="text-slate-400 mb-8 text-lg">{t.subtitle}</p>
          <button 
            onClick={loginWithGoogle}
            className="flex items-center justify-center gap-3 w-full py-4 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-500 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-blue-900/20"
          >
            <User size={20} />
            {t.login}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 md:px-8 py-3 md:py-5"
      >
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-2 md:gap-4">
          <div className="flex items-center gap-3 md:gap-8 overflow-hidden">
            <h1 className="text-lg md:text-2xl font-serif italic tracking-tighter uppercase cursor-pointer text-blue-400 shrink-0" onClick={() => setSelectedHabitId(null)}>
              {t.title}
            </h1>
            
            {selectedHabitId && (
              <div className="hidden sm:flex items-center gap-1 md:gap-4 bg-slate-800/50 p-1 rounded-full border border-slate-700">
                <button 
                  onClick={() => setViewMode('month')}
                  className={cn(
                    "px-3 md:px-4 py-1.5 rounded-full text-[10px] md:text-xs font-medium transition-all flex items-center gap-1 md:gap-2",
                    viewMode === 'month' ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-100"
                  )}
                >
                  <CalendarDays size={12} className="md:w-3.5 md:h-3.5" />
                  <span>{t.monthly}</span>
                </button>
                <button 
                  onClick={() => setViewMode('year')}
                  className={cn(
                    "px-3 md:px-4 py-1.5 rounded-full text-[10px] md:text-xs font-medium transition-all flex items-center gap-1 md:gap-2",
                    viewMode === 'year' ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-100"
                  )}
                >
                  <LayoutGrid size={12} className="md:w-3.5 md:h-3.5" />
                  <span>{t.yearly}</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <div className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-full border border-slate-700">
              {(['pt', 'en', 'es'] as const).map(lang => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={cn(
                    "w-7 h-7 md:w-8 md:h-8 rounded-full text-[9px] md:text-[10px] font-bold transition-all",
                    language === lang ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-100"
                  )}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
            
            {selectedHabitId && (
              <button 
                onClick={() => {
                  setNewHabitName('');
                  setNewHabitColor('#2563eb');
                  setReminderEnabled(false);
                  setReminderTime('09:00');
                  setReminderDays([0, 1, 2, 3, 4, 5, 6]);
                  setIsAddingHabit(true);
                }}
                className="p-2 bg-blue-600 text-white rounded-full hover:rotate-90 transition-transform shadow-lg shadow-blue-900/20"
              >
                <Plus size={20} />
              </button>
            )}
            
            <button 
              onClick={logout}
              className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-100"
              title="Sair"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* Mobile View Mode Selector - Second Row */}
        {selectedHabitId && (
          <div className="sm:hidden mt-4 flex items-center justify-center gap-2 bg-slate-800/30 p-1 rounded-full border border-slate-800/50">
            <button 
              onClick={() => setViewMode('month')}
              className={cn(
                "flex-1 py-2 rounded-full text-[10px] font-medium transition-all flex items-center justify-center gap-2",
                viewMode === 'month' ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" : "text-slate-400"
              )}
            >
              <CalendarDays size={14} />
              {t.monthly}
            </button>
            <button 
              onClick={() => setViewMode('year')}
              className={cn(
                "flex-1 py-2 rounded-full text-[10px] font-medium transition-all flex items-center justify-center gap-2",
                viewMode === 'year' ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" : "text-slate-400"
              )}
            >
              <LayoutGrid size={14} />
              {t.yearly}
            </button>
          </div>
        )}
      </motion.header>

      <main className={cn(
        "p-4 md:p-8 max-w-[1600px] mx-auto transition-all duration-500",
        !selectedHabitId ? "pt-12 md:pt-20" : ""
      )}>
        {/* Controls - Only shown when a habit is selected */}
        <AnimatePresence>
          {selectedHabitId && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col items-center justify-center text-center gap-4 md:gap-6 mb-8 md:mb-12 overflow-hidden"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2 md:gap-4">
                    {/* Year Back */}
                    <button 
                      onClick={() => setCurrentDate(subYears(currentDate, 1))}
                      className="p-1.5 md:p-2 bg-slate-800/30 hover:bg-slate-800 border border-slate-700/30 rounded-lg md:rounded-xl text-slate-500 hover:text-slate-100 transition-all active:scale-90 group"
                      title={language === 'pt' ? 'Ano Anterior' : 'Previous Year'}
                    >
                      <ChevronsLeft size={18} className="md:w-6 md:h-6 group-hover:-translate-x-0.5 transition-transform" />
                    </button>

                    {/* Month Back (only in month view) */}
                    {viewMode === 'month' && (
                      <button 
                        onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                        className="p-2 md:p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-xl md:rounded-2xl text-slate-400 hover:text-slate-100 transition-all shadow-lg active:scale-90 group"
                        title={language === 'pt' ? 'Mês Anterior' : 'Previous Month'}
                      >
                        <ChevronLeft size={20} className="md:w-8 md:h-8 group-hover:-translate-x-0.5 transition-transform" />
                      </button>
                    )}

                    <div className="flex flex-col items-center px-2 md:px-8">
                      <h2 className="text-xl md:text-5xl font-serif italic capitalize text-slate-100 mb-1">
                        {selectedHabit?.name}
                      </h2>
                      <div className="flex items-center gap-2 md:gap-3">
                        <button 
                          onClick={() => setIsYearPickerOpen(true)}
                          className="text-[8px] md:text-sm uppercase tracking-[0.1em] md:tracking-[0.2em] text-slate-500 font-mono hover:text-blue-400 transition-colors flex items-center gap-1"
                        >
                          {viewMode === 'month' ? format(currentDate, 'MMMM yyyy', { locale: getLocale(language) }) : format(currentDate, 'yyyy')}
                          <Calendar size={10} className="md:w-4 md:h-4" />
                        </button>
                        <button 
                          onClick={() => setCurrentDate(new Date())}
                          className="px-1.5 py-0.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-full text-[7px] md:text-[10px] font-mono uppercase tracking-widest transition-all active:scale-95"
                        >
                          {t.today}
                        </button>
                      </div>
                    </div>

                    {/* Month Forward (only in month view) */}
                    {viewMode === 'month' && (
                      <button 
                        onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                        className="p-2 md:p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-xl md:rounded-2xl text-slate-400 hover:text-slate-100 transition-all shadow-lg active:scale-90 group"
                        title={language === 'pt' ? 'Próximo Mês' : 'Next Month'}
                      >
                        <ChevronRight size={20} className="md:w-8 md:h-8 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    )}

                    {/* Year Forward */}
                    <button 
                      onClick={() => setCurrentDate(addYears(currentDate, 1))}
                      className="p-1.5 md:p-2 bg-slate-800/30 hover:bg-slate-800 border border-slate-700/30 rounded-lg md:rounded-xl text-slate-500 hover:text-slate-100 transition-all active:scale-90 group"
                      title={language === 'pt' ? 'Próximo Ano' : 'Next Year'}
                    >
                      <ChevronsRight size={18} className="md:w-6 md:h-6 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <button 
                    onClick={shareImage}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800/60 hover:bg-blue-600/20 text-slate-400 hover:text-blue-400 rounded-full border border-slate-700 transition-all text-xs font-mono uppercase tracking-widest"
                  >
                    <Share2 size={14} />
                    {t.share}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div ref={contentRef}>
          {!selectedHabitId ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {habits.map(habit => (
                <motion.div 
                  key={habit.id}
                  layoutId={habit.id}
                  onClick={() => setSelectedHabitId(habit.id)}
                  style={{ backgroundColor: habit.color }}
                  whileHover={{ 
                    scale: 1.03, 
                    y: -5,
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)"
                  }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="group relative p-5 md:p-8 rounded-[24px] md:rounded-[40px] cursor-pointer shadow-xl shadow-black/20 flex flex-col items-center justify-center text-center min-h-[160px] md:min-h-[220px]"
                >
                  <div className="absolute top-4 right-4 flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setNewHabitName(habit.name);
                        setNewHabitColor(habit.color);
                        setReminderEnabled(habit.reminderEnabled || false);
                        setReminderTime(habit.reminderTime || '09:00');
                        setReminderDays(habit.reminderDays || [0, 1, 2, 3, 4, 5, 6]);
                        setIsEditingHabit(habit);
                      }}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setHabitToDelete(habit);
                      }}
                      className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-full transition-all text-white"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <h3 className="text-xl md:text-3xl font-serif italic text-white drop-shadow-lg leading-tight">{habit.name}</h3>
                  <div className="absolute bottom-4 w-full flex items-center justify-center px-4">
                    {habit.reminderEnabled && (
                      <div className="flex items-center gap-1 text-white/60 bg-black/20 px-2 py-0.5 rounded-full">
                        <Bell size={10} />
                        <span className="text-[8px] md:text-[10px] font-mono">{habit.reminderTime}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {habits.length === 0 && (
                <div className="col-span-full py-12 md:py-20 text-center">
                  <p className="text-slate-500 italic font-serif px-4">{t.noHabits}</p>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="mb-6 md:mb-8 flex justify-start">
                <button 
                  onClick={() => setSelectedHabitId(null)}
                  className="group flex items-center gap-3 px-5 py-3 md:px-6 md:py-3 bg-slate-800/40 hover:bg-slate-800 border border-slate-700 rounded-2xl text-xs md:text-sm font-medium text-slate-300 hover:text-white transition-all shadow-lg hover:shadow-blue-900/10 active:scale-95"
                >
                  <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                  {t.back}
                </button>
              </div>
              <AnimatePresence mode="wait">
              {viewMode === 'month' ? (
                <motion.div 
                  key="month"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="overflow-x-auto pb-8 -mx-4 px-4 md:-mx-6 md:px-6"
                >
                  <div className="min-w-[320px] md:min-w-[800px] max-w-4xl mx-auto">
                    <div className="grid grid-cols-7 gap-1.5 md:gap-4">
                      {t.days.map(day => (
                        <div key={day} className="text-center text-[8px] md:text-[10px] font-mono uppercase text-slate-500 mb-1 md:mb-2">{day}</div>
                      ))}
                      
                      {/* Padding for start of month */}
                      {Array.from({ length: startOfMonth(currentDate).getDay() }).map((_, i) => (
                        <div key={`pad-${i}`} />
                      ))}

                      {daysInMonth.map(day => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const isCompleted = logs.some(l => l.habitId === selectedHabitId && l.date === dateStr);
                        const habit = habits.find(h => h.id === selectedHabitId);
                        return (
                          <button
                            key={dateStr}
                            onClick={() => toggleHabit(selectedHabitId, day)}
                            className={cn(
                              "aspect-square rounded-lg md:rounded-2xl border flex flex-col items-center justify-center transition-all relative group active:scale-90",
                              isCompleted 
                                ? "border-transparent text-white shadow-lg" 
                                : "bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-600",
                              isToday(day) && !isCompleted && "ring-2 ring-blue-500/50"
                            )}
                            style={{ 
                              backgroundColor: isCompleted ? habit?.color || '#2563eb' : undefined,
                              boxShadow: isCompleted ? `0 10px 15px -3px ${habit?.color}40` : undefined
                            }}
                          >
                            <span className={cn("text-[9px] md:text-xs font-mono", isCompleted ? "opacity-90" : "opacity-100")}>
                              {format(day, 'd')}
                            </span>
                            {isCompleted && <Check size={14} className="md:w-5 md:h-5 mt-0.5 md:mt-1" strokeWidth={3} />}
                            {isToday(day) && (
                              <div className="absolute top-1.5 right-1.5 md:top-2 md:right-2 w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-blue-400" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="year"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8"
                >
                  {monthsInYear.map((month, mIdx) => {
                    const habit = habits.find(h => h.id === selectedHabitId);
                    const monthDays = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
                    const completedCount = monthDays.filter(day => 
                      logs.some(l => l.habitId === selectedHabitId && l.date === format(day, 'yyyy-MM-dd'))
                    ).length;

                    return (
                      <div key={month.toISOString()} className="bg-slate-900/50 p-4 md:p-6 rounded-[24px] md:rounded-[40px] border border-slate-800">
                        <div className="flex justify-between items-center mb-3 md:mb-4">
                          <div className="flex flex-col">
                            <h3 className="text-sm md:text-lg font-serif italic capitalize text-slate-200">{t.months[mIdx]}</h3>
                            <span className="text-[8px] md:text-[9px] font-mono text-blue-400 uppercase tracking-tighter">
                              {completedCount} {completedCount === 1 ? (language === 'pt' ? 'dia' : 'day') : (language === 'pt' ? 'dias' : 'days')}
                            </span>
                          </div>
                          <span className="text-[8px] md:text-[10px] font-mono text-slate-600">{getYear(month)}</span>
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {monthDays.map(day => {
                            const dateStr = format(day, 'yyyy-MM-dd');
                            const isCompleted = logs.some(l => l.habitId === selectedHabitId && l.date === dateStr);

                            return (
                              <button 
                                key={dateStr}
                                onClick={() => toggleHabit(selectedHabitId, day)}
                                className={cn(
                                  "aspect-square rounded-[3px] flex items-center justify-center text-[7px] md:text-[9px] font-mono transition-all active:scale-90",
                                  isCompleted 
                                    ? "text-white/90 shadow-sm" 
                                    : "bg-slate-900/50 text-slate-500 hover:text-slate-300 hover:border-slate-700 border border-transparent"
                                )}
                                style={{ 
                                  backgroundColor: isCompleted 
                                    ? habit?.color || '#3b82f6' 
                                    : undefined 
                                }}
                                title={`${format(day, 'dd/MM')} - ${t.days[getDay(day)]}`}
                              >
                                {format(day, 'd')}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </main>

      {/* Add/Edit Habit Modal */}
      <AnimatePresence>
        {(isAddingHabit || isEditingHabit) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsAddingHabit(false);
                setIsEditingHabit(null);
              }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-slate-900 p-6 md:p-8 rounded-[32px] md:rounded-[40px] shadow-2xl border border-slate-800"
            >
              <h2 className="text-2xl md:text-3xl font-serif italic mb-6 text-blue-400">{isEditingHabit ? t.editHabit : t.newHabit}</h2>
              <form onSubmit={isEditingHabit ? updateHabit : addHabit} className="space-y-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-mono text-slate-500 mb-2">{t.name}</label>
                  <input 
                    autoFocus
                    type="text"
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    placeholder="ex: Meditação Matinal"
                    className="w-full bg-transparent border-b-2 border-slate-700 py-2 text-xl focus:outline-none focus:border-blue-500 transition-colors text-slate-100 placeholder:text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-mono text-slate-500 mb-4">{t.themeColor}</label>
                  <div className="flex flex-wrap gap-3">
                    {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'].map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewHabitColor(c)}
                        className={cn(
                          "w-8 h-8 rounded-full transition-all",
                          newHabitColor === c ? "ring-2 ring-offset-2 ring-offset-slate-900 ring-blue-500 scale-110" : "opacity-60 hover:opacity-100"
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-800/50">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Bell size={14} className={cn("transition-colors", reminderEnabled ? "text-blue-400" : "text-slate-600")} />
                        <label className="text-[10px] uppercase tracking-[0.2em] font-mono text-slate-400 font-bold">{t.reminders}</label>
                      </div>
                      {reminderEnabled && Notification.permission !== 'granted' && (
                        <span className="text-[8px] text-amber-500 font-mono uppercase tracking-tighter bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          {t.notificationsPermissionDenied}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!reminderEnabled) {
                          setReminderEnabled(true);
                          await requestNotificationPermission();
                        } else {
                          setReminderEnabled(false);
                        }
                      }}
                      className={cn(
                        "w-14 h-7 rounded-full transition-all relative p-1",
                        reminderEnabled ? "bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.3)]" : "bg-slate-800"
                      )}
                    >
                      <motion.div 
                        layout
                        className={cn(
                          "w-5 h-5 rounded-full bg-white shadow-sm",
                          reminderEnabled ? "ml-auto" : "ml-0"
                        )} 
                      />
                    </button>
                  </div>

                  {reminderEnabled && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50">
                        <div className="flex items-center gap-2 mb-3">
                          <Clock size={12} className="text-slate-500" />
                          <label className="text-[9px] uppercase tracking-widest font-mono text-slate-500">{t.reminderTime}</label>
                        </div>
                        <div className="relative group">
                          <input 
                            type="time"
                            value={reminderTime}
                            onChange={(e) => setReminderTime(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xl font-mono text-slate-100 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600 group-hover:text-blue-400 transition-colors">
                            <Clock size={18} />
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50">
                        <div className="flex items-center gap-2 mb-4">
                          <Calendar size={12} className="text-slate-500" />
                          <label className="text-[9px] uppercase tracking-widest font-mono text-slate-500">{t.reminderDays}</label>
                        </div>
                        <div className="grid grid-cols-7 gap-1.5">
                          {t.days.map((dayName, idx) => {
                            const isSelected = reminderDays.includes(idx);
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => toggleReminderDay(idx)}
                                className={cn(
                                  "aspect-square rounded-xl text-[10px] font-bold transition-all border flex items-center justify-center relative overflow-hidden group",
                                  isSelected 
                                    ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20" 
                                    : "bg-slate-900 border-slate-800 text-slate-600 hover:border-slate-700 hover:text-slate-400"
                                )}
                              >
                                <span className="relative z-10">{dayName[0]}</span>
                                {isSelected && (
                                  <motion.div 
                                    layoutId="activeDay"
                                    className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"
                                  />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsAddingHabit(false);
                      setIsEditingHabit(null);
                    }}
                    className="flex-1 py-3 border border-slate-700 rounded-full font-medium hover:bg-slate-800 transition-colors text-slate-300"
                  >
                    {t.cancel}
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-900/20 transition-all"
                  >
                    {isEditingHabit ? t.save : t.create}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Year Picker Modal */}
      <AnimatePresence>
        {isYearPickerOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsYearPickerOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xs bg-slate-900 border border-slate-800 rounded-[32px] p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-serif italic text-slate-100">{language === 'pt' ? 'Selecionar Ano' : (language === 'en' ? 'Select Year' : 'Seleccionar Año')}</h3>
                <button onClick={() => setIsYearPickerOpen(false)} className="text-slate-500 hover:text-white">
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {years.map(year => (
                  <button
                    key={year}
                    onClick={() => {
                      const newDate = new Date(currentDate);
                      newDate.setFullYear(year);
                      setCurrentDate(newDate);
                      setIsYearPickerOpen(false);
                    }}
                    className={cn(
                      "py-3 rounded-xl text-sm font-mono transition-all",
                      getYear(currentDate) === year 
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
                        : "bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                    )}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {habitToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setHabitToDelete(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-slate-900 p-6 md:p-8 rounded-[32px] md:rounded-[40px] shadow-2xl border border-slate-800 text-center"
            >
              <div className="w-12 h-12 md:w-16 md:h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                <Trash2 className="text-red-500" size={24} />
              </div>
              <h2 className="text-xl md:text-2xl font-serif italic mb-2 text-slate-100">{t.confirmDelete}</h2>
              <p className="text-xs md:text-sm text-slate-500 mb-6 md:mb-8 font-mono uppercase tracking-widest">{habitToDelete.name}</p>
              <div className="flex gap-3 md:gap-4">
                <button 
                  onClick={() => setHabitToDelete(null)}
                  className="flex-1 py-3 border border-slate-700 rounded-full font-medium hover:bg-slate-800 transition-colors text-slate-300 text-sm"
                >
                  {t.cancel}
                </button>
                <button 
                  onClick={() => deleteHabit(habitToDelete.id)}
                  className="flex-1 py-3 bg-red-600 text-white rounded-full font-medium hover:bg-red-500 transition-all text-sm shadow-lg shadow-red-900/20"
                >
                  {t.delete}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Action Buttons for Main Page */}
      <AnimatePresence>
        {!selectedHabitId && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed bottom-8 right-8 z-40"
          >
            <button 
              onClick={() => {
                setNewHabitName('');
                setNewHabitColor('#2563eb');
                setReminderEnabled(false);
                setReminderTime('09:00');
                setReminderDays([0, 1, 2, 3, 4, 5, 6]);
                setIsAddingHabit(true);
              }}
              className="w-14 h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center transition-all shadow-2xl shadow-blue-900/40 active:scale-95"
              title={t.newHabit}
            >
              <Plus size={28} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="fixed -left-[9999px] top-0 pointer-events-none">
        <div 
          ref={shareRef}
          className="w-[500px] p-12 flex flex-col items-center relative overflow-hidden"
          style={{ backgroundColor: selectedHabit?.color || '#020617' }}
        >
          {/* Decorative background elements */}
          <div className="absolute top-0 left-0 w-full h-full opacity-20">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-white blur-[100px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-black blur-[100px]" />
          </div>

          <div className="w-full text-center mb-10 bg-black/30 p-10 rounded-[50px] backdrop-blur-md border border-white/20 shadow-2xl relative z-10">
            <h1 className="text-5xl font-serif italic text-white mb-3 drop-shadow-lg">{selectedHabit?.name}</h1>
            <p className="text-[12px] uppercase tracking-[0.4em] text-white/80 font-mono mb-6">
              {viewMode === 'month' ? format(currentDate, 'MMMM yyyy', { locale: getLocale(language) }) : format(currentDate, 'yyyy')}
            </p>
            
            {viewMode === 'month' && (
              <div className="flex flex-col items-center">
                <div className="text-6xl font-serif italic text-white mb-1">
                  {daysInMonth.filter(day => logs.some(l => l.habitId === selectedHabitId && l.date === format(day, 'yyyy-MM-dd'))).length}
                </div>
                <p className="text-[10px] font-mono text-white/60 uppercase tracking-[0.3em]">
                  {t.completedDays}
                </p>
              </div>
            )}
          </div>
          
          <div className="w-full bg-white/10 p-10 rounded-[50px] backdrop-blur-md border border-white/10 shadow-2xl relative z-10">
            {selectedHabitId && (
              viewMode === 'month' ? (
                <div className="grid grid-cols-7 gap-2">
                  {t.days.map(day => (
                    <div key={day} className="text-[9px] uppercase text-white/50 text-center py-2 font-mono font-bold">{day}</div>
                  ))}
                  {daysInMonth.map(date => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const isCompleted = logs.some(l => l.habitId === selectedHabitId && l.date === dateStr);
                    return (
                      <div 
                        key={dateStr}
                        className={cn(
                          "aspect-square rounded-xl flex items-center justify-center text-[11px] font-mono transition-all",
                          isCompleted 
                            ? "bg-white text-black font-black shadow-[0_0_15px_rgba(255,255,255,0.4)] scale-105" 
                            : "bg-black/20 text-white/20 border border-white/5"
                        )}
                      >
                        {format(date, 'd')}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-8">
                  {monthsInYear.map((month, mIdx) => {
                    const monthDays = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
                    const completedCount = monthDays.filter(day => 
                      logs.some(l => l.habitId === selectedHabitId && l.date === format(day, 'yyyy-MM-dd'))
                    ).length;

                    return (
                      <div key={month.toString()} className="space-y-3 bg-black/20 p-4 rounded-3xl border border-white/5">
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] uppercase tracking-widest text-white/80 font-mono font-bold">{t.months[mIdx]}</p>
                          <span className="text-[10px] font-mono text-white bg-white/20 px-2 py-0.5 rounded-full font-bold">
                            {completedCount}
                          </span>
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {monthDays.map(date => {
                            const dateStr = format(date, 'yyyy-MM-dd');
                            const isCompleted = logs.some(l => l.habitId === selectedHabitId && l.date === dateStr);
                            return (
                              <div 
                                key={dateStr}
                                className={cn(
                                  "w-1.5 h-1.5 rounded-full",
                                  isCompleted ? "bg-white shadow-[0_0_5px_rgba(255,255,255,0.8)]" : "bg-white/5"
                                )}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
          
          <div className="mt-12 pt-8 border-t border-white/10 w-full text-center relative z-10">
            <p className="text-[11px] uppercase tracking-[0.5em] text-white/40 font-mono">Habit Tracker ✨</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <HabitTracker />
    </ErrorBoundary>
  );
}
