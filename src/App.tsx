import React, { useState, useEffect } from 'react';
import {
  Clock,
  BookOpen,
  Calendar,
  GraduationCap,
  Flame,
  Sun,
  Moon,
  Bell,
  CheckCircle2,
  RefreshCw,
  Plus,
  History,
  Trash2,
  Share2,
  BarChart3,
  Sliders,
  Settings,
  Download,
} from 'lucide-react';
import confetti from 'canvas-confetti';

import {
  Subject,
  StudySession,
  DeadlineItem,
  StreakData,
  ClassroomConfig,
  SyncStatus,
  ClassroomCourse,
  UserProfile,
  TodoItem,
} from './types';
import {
  INITIAL_SUBJECTS,
  INITIAL_SESSIONS,
  INITIAL_DEADLINES,
  INITIAL_STREAK,
  INITIAL_CLASSROOM_CONFIG,
  DEMO_USERS,
  INITIAL_TODOS,
  ELENA_SUBJECTS,
  ELENA_SESSIONS,
  ELENA_DEADLINES,
  ELENA_STREAK,
  ELENA_TODOS,
} from './initialData';
import { calculateWeeklySubjectStats, updateStreakRecord, formatDateTime, formatMinutes, getStudyMinutesForDate, calculateDayStreakPercentage } from './utils/calculations';
import { notificationManager } from './utils/notifications';
import { GoogleClassroomService } from './utils/classroom';

import { TimerWidget } from './components/TimerWidget';
import { VisualDashboard } from './components/VisualDashboard';
import { StreakMaintainer } from './components/StreakMaintainer';
import { ClassroomDeadlines } from './components/ClassroomDeadlines';
import { CloudSyncBar } from './components/CloudSyncBar';
import { SubjectModal } from './components/SubjectModal';
import { LoginPage } from './components/LoginPage';
import { UserProfileMenu } from './components/UserProfileMenu';
import { AccountSettingsModal } from './components/AccountSettingsModal';
import { DailyTodoListAndCheckIn } from './components/DailyTodoListAndCheckIn';
import { AmbientSoundBottomBar } from './components/AmbientSoundBottomBar';
import { SessionHistoryLogs } from './components/SessionHistoryLogs';

export default function App() {
  // --- THEME STATE (Dark Mode / Light Mode) ---
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('study_tracker_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('study_tracker_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('study_tracker_theme', 'light');
    }
  }, [isDarkMode]);

  // --- MULTI-USER ISOLATION & AUTHENTICATION STATE ---
  const [allRegisteredUsers, setAllRegisteredUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('study_tracker_all_users');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return DEMO_USERS;
  });

  const [isLoggedOut, setIsLoggedOut] = useState<boolean>(() => {
    return localStorage.getItem('study_tracker_logged_out') === 'true';
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    if (localStorage.getItem('study_tracker_logged_out') === 'true') {
      return null;
    }
    const saved = localStorage.getItem('study_tracker_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return DEMO_USERS[0];
  });

  // Unique user ID used for cloud syncing and data segregation
  const [userId, setUserId] = useState<string>(() => {
    return currentUser?.id || DEMO_USERS[0].id;
  });

  // Helper to fetch/initialize isolated data per individual user
  const getUserData = (uid: string) => {
    const subjKey = `study_tracker_${uid}_subjects`;
    const sessKey = `study_tracker_${uid}_sessions`;
    const deadKey = `study_tracker_${uid}_deadlines`;
    const streakKey = `study_tracker_${uid}_streak`;
    const classKey = `study_tracker_${uid}_classroom_config`;
    const todoKey = `study_tracker_${uid}_todos`;

    const savedSubj = localStorage.getItem(subjKey);
    const savedSess = localStorage.getItem(sessKey);
    const savedDead = localStorage.getItem(deadKey);
    const savedStreak = localStorage.getItem(streakKey);
    const savedClass = localStorage.getItem(classKey);
    const savedTodos = localStorage.getItem(todoKey);

    let defaultSubj = INITIAL_SUBJECTS;
    let defaultSess = INITIAL_SESSIONS;
    let defaultDead = INITIAL_DEADLINES;
    let defaultStreak = INITIAL_STREAK;
    let defaultTodos = INITIAL_TODOS;

    if (uid === 'student_elena') {
      defaultSubj = ELENA_SUBJECTS;
      defaultSess = ELENA_SESSIONS;
      defaultDead = ELENA_DEADLINES;
      defaultStreak = ELENA_STREAK;
      defaultTodos = ELENA_TODOS;
    } else if (uid === 'google_saicharan') {
      defaultSubj = INITIAL_SUBJECTS;
      defaultSess = INITIAL_SESSIONS;
      defaultDead = INITIAL_DEADLINES;
      defaultStreak = INITIAL_STREAK;
      defaultTodos = INITIAL_TODOS;
    } else if (!savedSubj && !savedSess) {
      // Clean account for a freshly registered user
      defaultSubj = [
        { id: 'sub-1', name: 'Core Major Focus', color: '#6366f1', targetWeeklyHours: 10 },
        { id: 'sub-2', name: 'Applied Laboratory', color: '#10b981', targetWeeklyHours: 6 },
        { id: 'sub-3', name: 'Elective Seminar', color: '#f59e0b', targetWeeklyHours: 4 },
      ];
      defaultSess = [];
      defaultDead = [];
      defaultTodos = [];
      defaultStreak = {
        currentStreak: 0,
        longestStreak: 0,
        lastStudyDate: '',
        activeDatesThisMonth: [],
      };
    }

    return {
      subjects: savedSubj ? JSON.parse(savedSubj) : defaultSubj,
      sessions: savedSess ? JSON.parse(savedSess) : defaultSess,
      deadlines: savedDead ? JSON.parse(savedDead) : defaultDead,
      streak: savedStreak ? JSON.parse(savedStreak) : defaultStreak,
      todos: savedTodos ? JSON.parse(savedTodos) : defaultTodos,
      classroomConfig: savedClass ? JSON.parse(savedClass) : {
        connected: uid.startsWith('google'),
        userEmail: currentUser?.email || 'saicharan.chapala@gmail.com',
      },
    };
  };

  const initialData = getUserData(currentUser?.id || DEMO_USERS[0].id);

  // --- CORE APPLICATION DATA WITH OFFLINE LOCALSTORAGE BACKING ---
  const [subjects, setSubjects] = useState<Subject[]>(initialData.subjects);
  const [sessions, setSessions] = useState<StudySession[]>(initialData.sessions);
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>(initialData.deadlines);
  const [streak, setStreak] = useState<StreakData>(initialData.streak);
  const [todos, setTodos] = useState<TodoItem[]>(initialData.todos);
  const [classroomConfig, setClassroomConfig] = useState<ClassroomConfig>(initialData.classroomConfig);

  const [classroomCourses, setClassroomCourses] = useState<ClassroomCourse[]>([]);

  // Sync Status
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSyncedAt: null,
    pendingOfflineCount: 0,
    isOnline: navigator.onLine,
    cloudSyncEnabled: true,
  });

  // Active view tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'timer' | 'deadlines' | 'history'>('dashboard');
  const [isStudyTimerActive, setIsStudyTimerActive] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);

  // --- PERSISTENCE EFFECT (Local first for offline reliability, isolated per individual user) ---
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`study_tracker_${currentUser.id}_subjects`, JSON.stringify(subjects));
    }
  }, [subjects, currentUser]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`study_tracker_${currentUser.id}_sessions`, JSON.stringify(sessions));
    }
  }, [sessions, currentUser]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`study_tracker_${currentUser.id}_deadlines`, JSON.stringify(deadlines));
    }
  }, [deadlines, currentUser]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`study_tracker_${currentUser.id}_streak`, JSON.stringify(streak));
    }
  }, [streak, currentUser]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`study_tracker_${currentUser.id}_todos`, JSON.stringify(todos));
    }
  }, [todos, currentUser]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`study_tracker_${currentUser.id}_classroom_config`, JSON.stringify(classroomConfig));
    }
  }, [classroomConfig, currentUser]);

  // --- SERVICE WORKER & OFFLINE LISTENER ---
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('Service worker registration error (expected in dev mode):', err);
      });
    }

    const handleOnline = () => {
      setSyncStatus((prev) => ({ ...prev, isOnline: true }));
      triggerCloudSync();
    };
    const handleOffline = () => {
      setSyncStatus((prev) => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check for deadlines notifications
    notificationManager.scheduleDeadlineCheck(deadlines);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // --- GOOGLE CLASSROOM CLIENT INITIALIZATION ---
  useEffect(() => {
    fetch('/api/auth/google/config')
      .then((res) => res.json())
      .then((cfg) => {
        if (cfg.clientId) {
          GoogleClassroomService.initClient(cfg.clientId, (resp) => {
            if (resp.access_token) {
              setClassroomConfig((prev) => ({
                ...prev,
                connected: true,
                lastSyncTime: new Date().toISOString(),
              }));
              refreshClassroomData();
            }
          });
        }
      })
      .catch(() => {});
  }, []);

  // --- CLOUD SYNC METHOD (Seamless cross-device state update) ---
  const triggerCloudSync = async () => {
    if (!navigator.onLine) {
      setSyncStatus((prev) => ({
        ...prev,
        pendingOfflineCount: prev.pendingOfflineCount + 1,
      }));
      return;
    }

    try {
      // Push state to cloud
      const pushRes = await fetch(`/api/sync/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessions,
          subjects,
          deadlines,
          streak,
        }),
      });

      if (pushRes.ok) {
        const data = await pushRes.json();
        setSyncStatus({
          lastSyncedAt: data.updatedAt || new Date().toISOString(),
          pendingOfflineCount: 0,
          isOnline: true,
          cloudSyncEnabled: true,
        });
      }
    } catch (e) {
      console.warn('Cloud sync offline fallback');
      setSyncStatus((prev) => ({ ...prev, isOnline: false }));
    }
  };

  // Pull cloud data when user changes or pairs another device
  const fetchCloudData = async (targetUserId: string) => {
    try {
      const res = await fetch(`/api/sync/${targetUserId}`);
      const result = await res.json();
      if (result.success && result.data) {
        if (result.data.sessions) setSessions(result.data.sessions);
        if (result.data.subjects) setSubjects(result.data.subjects);
        if (result.data.deadlines) setDeadlines(result.data.deadlines);
        if (result.data.streak) setStreak(result.data.streak);
        setSyncStatus((prev) => ({
          ...prev,
          lastSyncedAt: result.data.updatedAt,
          pendingOfflineCount: 0,
        }));
      }
    } catch (err) {
      console.warn('Could not fetch cloud device state:', err);
    }
  };

  const handleUpdateUserId = (newId: string) => {
    setUserId(newId);
    localStorage.setItem('study_tracker_user_id', newId);
    fetchCloudData(newId);
  };

  // --- USER AUTHENTICATION & MULTI-USER SWITCHING HANDLERS ---
  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    setUserId(user.id);
    setIsLoggedOut(false);
    localStorage.setItem('study_tracker_current_user', JSON.stringify(user));
    localStorage.removeItem('study_tracker_logged_out');
    localStorage.setItem('study_tracker_user_id', user.id);

    // Save to known registered users
    setAllRegisteredUsers((prev) => {
      const exists = prev.some((u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
      if (exists) {
        return prev.map((u) => (u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase() ? user : u));
      }
      const updated = [...prev, user];
      localStorage.setItem('study_tracker_all_users', JSON.stringify(updated));
      return updated;
    });

    // Populate the isolated personal workspace for this user
    const data = getUserData(user.id);
    setSubjects(data.subjects);
    setSessions(data.sessions);
    setDeadlines(data.deadlines);
    setStreak(data.streak);
    setTodos(data.todos);
    setClassroomConfig(data.classroomConfig);

    // Fetch cloud data for this user ID
    fetchCloudData(user.id);
  };

  const handleLogout = () => {
    setIsLoggedOut(true);
    localStorage.setItem('study_tracker_logged_out', 'true');
  };

  const handleSwitchUser = (targetUser: UserProfile) => {
    handleLogin(targetUser);
  };

  const handleConnectGoogle = async () => {
    if (!currentUser) return;
    try {
      await GoogleClassroomService.requestAccessToken();
      const updatedUser: UserProfile = {
        ...currentUser,
        authProvider: 'google',
        googleConnected: true,
      };
      handleLogin(updatedUser);
      setClassroomConfig((prev) => ({ ...prev, connected: true, userEmail: currentUser.email }));
      refreshClassroomData();
    } catch (e: any) {
      // If user confirms via dialog or token request
      const updatedUser: UserProfile = {
        ...currentUser,
        authProvider: 'google',
        googleConnected: true,
      };
      handleLogin(updatedUser);
    }
  };

  // --- ACCOUNT SETTINGS HANDLERS ---
  const handleUpdateUserProfile = (updatedUser: UserProfile) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('study_tracker_current_user', JSON.stringify(updatedUser));
    setAllRegisteredUsers((prev) => {
      const updated = prev.map((u) => (u.id === updatedUser.id ? updatedUser : u));
      localStorage.setItem('study_tracker_all_users', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDisconnectGoogle = () => {
    if (!currentUser) return;
    const updatedUser: UserProfile = {
      ...currentUser,
      googleConnected: false,
      authProvider: 'email',
    };
    handleUpdateUserProfile(updatedUser);
    setClassroomConfig((prev) => ({
      ...prev,
      connected: false,
    }));
  };

  const handleResetAccountData = () => {
    if (!currentUser) return;
    const defaultSubj: Subject[] = [
      { id: `sub-1-${Date.now()}`, name: 'Major Core Focus', color: '#6366f1', targetWeeklyHours: 10 },
      { id: `sub-2-${Date.now()}`, name: 'Laboratory & Practicals', color: '#10b981', targetWeeklyHours: 6 },
      { id: `sub-3-${Date.now()}`, name: 'General Electives', color: '#f59e0b', targetWeeklyHours: 4 },
    ];
    setSubjects(defaultSubj);
    setSessions([]);
    setDeadlines([]);
    setTodos([]);
    setStreak({
      currentStreak: 0,
      longestStreak: 0,
      lastStudyDate: '',
      activeDatesThisMonth: [],
    });

    localStorage.removeItem(`study_tracker_${currentUser.id}_sessions`);
    localStorage.removeItem(`study_tracker_${currentUser.id}_deadlines`);
    localStorage.removeItem(`study_tracker_${currentUser.id}_streak`);
    localStorage.removeItem(`study_tracker_${currentUser.id}_todos`);
    localStorage.setItem(`study_tracker_${currentUser.id}_subjects`, JSON.stringify(defaultSubj));

    triggerCloudSync();
  };

  // --- REFRESH GOOGLE CLASSROOM DATA ---
  const refreshClassroomData = async () => {
    try {
      const courses = await GoogleClassroomService.fetchCourses();
      setClassroomCourses(courses);

      let allDeadlines: DeadlineItem[] = [];
      for (const course of courses.slice(0, 5)) {
        try {
          const courseItems = await GoogleClassroomService.fetchCourseWork(course.id, course.name);
          allDeadlines = [...allDeadlines, ...courseItems];
        } catch {
          // ignore single course failure
        }
      }

      if (allDeadlines.length > 0) {
        setDeadlines((prev) => {
          const map = new Map<string, DeadlineItem>();
          // retain completed status of existing items
          prev.forEach((item) => map.set(item.id, item));
          allDeadlines.forEach((item) => {
            if (!map.has(item.id)) {
              map.set(item.id, item);
            }
          });
          return Array.from(map.values());
        });
      }
    } catch (err: any) {
      console.warn('Classroom sync info:', err.message);
    }
  };

  const handleConnectClassroom = async () => {
    try {
      await GoogleClassroomService.requestAccessToken();
      setClassroomConfig((prev) => ({ ...prev, connected: true }));
      await refreshClassroomData();
    } catch (err: any) {
      // If client not loaded or needs fallback
      alert(err.message || 'Google Classroom connection cancelled or unavailable.');
    }
  };

  const handleDisconnectClassroom = () => {
    GoogleClassroomService.disconnect();
    setClassroomConfig((prev) => ({ ...prev, connected: false }));
  };

  // --- LOGGING A STUDY SESSION ---
  const handleSessionComplete = async (newSession: StudySession) => {
    const updatedSessions = [newSession, ...sessions];
    setSessions(updatedSessions);

    // Update streak
    const updatedStreak = updateStreakRecord(streak, new Date(newSession.startTime));
    const sessionDateStr = new Date(newSession.startTime).toISOString().split('T')[0];
    const newDayMins = getStudyMinutesForDate(updatedSessions, sessionDateStr);
    const { totalPercentage: newDayPercent } = calculateDayStreakPercentage({
      checkedIn: Boolean(updatedStreak.dailyCheckIns?.[sessionDateStr]?.checkedIn),
      isExplicitFullCheckIn: updatedStreak.dailyCheckIns?.[sessionDateStr]?.percentage === 100,
      completedTodos: todos.filter((t) => t.completed).length,
      totalTodos: todos.length,
      studyMinutes: newDayMins,
      dailyTargetMinutes: Math.round(((currentUser?.preferences?.weeklyGoalHours || 20) * 60) / 7),
    });

    updatedStreak.dailyPercentages = {
      ...(updatedStreak.dailyPercentages || {}),
      [sessionDateStr]: newDayPercent,
    };

    setStreak(updatedStreak);

    // Celebrate with confetti
    confetti({
      particleCount: 60,
      spread: 50,
      origin: { y: 0.8 },
      colors: ['#6366f1', '#10b981', '#f59e0b'],
    });

    // Push cloud update
    setTimeout(() => {
      triggerCloudSync();
    }, 500);
  };

  // --- TO-DO LIST HANDLERS ---
  const handleAddTodo = (newTodoData: Omit<TodoItem, 'id' | 'createdAt'>) => {
    const newItem: TodoItem = {
      ...newTodoData,
      id: `todo-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newItem, ...todos];
    setTodos(updated);
    triggerCloudSync();
  };

  const handleToggleTodo = (todoId: string) => {
    const updated = todos.map((t) => {
      if (t.id === todoId) {
        return {
          ...t,
          completed: !t.completed,
          completedAt: !t.completed ? new Date().toISOString() : undefined,
        };
      }
      return t;
    });
    setTodos(updated);

    const todayDateKey = new Date().toISOString().split('T')[0];
    const todayMins = getStudyMinutesForDate(sessions, todayDateKey);
    const updatedCompletedCount = updated.filter((t) => t.completed).length;
    const { totalPercentage: newPercent } = calculateDayStreakPercentage({
      checkedIn: Boolean(streak.dailyCheckIns?.[todayDateKey]?.checkedIn),
      isExplicitFullCheckIn: streak.dailyCheckIns?.[todayDateKey]?.percentage === 100,
      completedTodos: updatedCompletedCount,
      totalTodos: updated.length,
      studyMinutes: todayMins,
      dailyTargetMinutes: Math.round(((currentUser?.preferences?.weeklyGoalHours || 20) * 60) / 7),
    });

    const updatedPercentages = {
      ...(streak.dailyPercentages || {}),
      [todayDateKey]: newPercent,
    };

    let updatedActiveDates = streak.activeDatesThisMonth || [];
    if (newPercent >= 50 && !updatedActiveDates.includes(todayDateKey)) {
      updatedActiveDates = [...updatedActiveDates, todayDateKey];
    }

    setStreak((prev) => ({
      ...prev,
      dailyPercentages: updatedPercentages,
      activeDatesThisMonth: updatedActiveDates,
    }));

    triggerCloudSync();
  };

  const handleDeleteTodo = (todoId: string) => {
    const updated = todos.filter((t) => t.id !== todoId);
    setTodos(updated);
    triggerCloudSync();
  };

  // --- NOTIFICATION HANDLERS ---
  const handleRequestPushPermission = async () => {
    const perm = await notificationManager.requestPermission();
    if (perm === 'granted') {
      notificationManager.sendLocalNotification('🔔 Study Notifications Enabled', {
        body: 'You will receive proactive alerts for upcoming Google Classroom deadlines and streak maintenance.',
      });
    }
  };

  const handleSendTestNotification = async (deadline: DeadlineItem) => {
    if (notificationManager.getPermissionStatus() !== 'granted') {
      const perm = await notificationManager.requestPermission();
      if (perm !== 'granted') {
        alert('Please allow notification permissions in your browser to test push notifications.');
        return;
      }
    }

    notificationManager.sendLocalNotification(`⏳ Upcoming Deadline: ${deadline.title}`, {
      body: `${deadline.courseName} is due soon on ${new Date(deadline.dueDate).toLocaleDateString()} at ${deadline.dueTime || '23:59'}!`,
      tag: `test-${deadline.id}`,
    });
  };

  // --- DEADLINE TOGGLE & ADD ---
  const handleToggleDeadline = (id: string) => {
    setDeadlines((prev) =>
      prev.map((d) => (d.id === id ? { ...d, completed: !d.completed } : d))
    );
    triggerCloudSync();
  };

  const handleAddDeadline = (newDl: Partial<DeadlineItem>) => {
    const item: DeadlineItem = {
      id: `dl-${Date.now()}`,
      courseId: 'custom-course',
      courseName: newDl.courseName || 'General Subject',
      title: newDl.title || 'Assignment',
      dueDate: newDl.dueDate || new Date(Date.now() + 86400000 * 3).toISOString(),
      dueTime: newDl.dueTime || '23:59',
      completed: false,
      notifyEnabled: true,
    };
    setDeadlines((prev) => [item, ...prev]);
    triggerCloudSync();
  };

  const handleDeleteSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    triggerCloudSync();
  };

  // Compute live weekly stats
  const { weeklyData, totalWeekMinutes, totalWeekSessions, weeklyGoalMinutes: calculatedWeeklyGoalMinutes } =
    calculateWeeklySubjectStats(sessions, subjects);

  const weeklyGoalMinutes = currentUser?.preferences?.weeklyGoalHours
    ? currentUser.preferences.weeklyGoalHours * 60
    : calculatedWeeklyGoalMinutes;

  // Compute live daily streak percentage metrics
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todayStudyMinutes = getStudyMinutesForDate(sessions, todayDateStr);
  const dailyTargetMinutes = Math.round(((currentUser?.preferences?.weeklyGoalHours || 20) * 60) / 7);
  const todayCheckIn = streak.dailyCheckIns?.[todayDateStr];
  const isCheckedInToday = Boolean(todayCheckIn?.checkedIn);
  const completedTodosCount = todos.filter((t) => t.completed).length;

  const { totalPercentage: todayStreakPercent } = calculateDayStreakPercentage({
    checkedIn: isCheckedInToday,
    isExplicitFullCheckIn: todayCheckIn?.percentage === 100,
    completedTodos: completedTodosCount,
    totalTodos: todos.length,
    studyMinutes: todayStudyMinutes,
    dailyTargetMinutes,
  });

  // If user is logged out or unauthenticated, show the dedicated login page
  if (!currentUser || isLoggedOut) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'dark bg-stone-950 text-stone-100' : 'bg-cream-canvas text-stone-900'}`}>
        <LoginPage onLogin={handleLogin} registeredUsers={allRegisteredUsers} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-canvas dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-cream-card/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-cream-border dark:border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* VERY LEFT TOP CORNER: USER ACCOUNT SETTINGS OPTION */}
            <button
              id="btn-account-settings-top-left"
              onClick={() => setIsAccountSettingsOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-cream-border dark:border-stone-800 bg-cream-100/90 dark:bg-stone-850 hover:bg-cream-200 dark:hover:bg-stone-800 hover:border-amber-300/80 dark:hover:border-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold shadow-xs transition-all cursor-pointer shrink-0"
              title="User Account Settings & Study Goals"
            >
              <Settings className="w-4 h-4 text-stone-700 dark:text-stone-300" />
              <span className="hidden sm:inline">Account Settings</span>
            </button>

            {/* Subtle Divider */}
            <div className="h-6 w-[1px] bg-cream-border dark:bg-stone-800 hidden xs:block" />

            {/* App Brand Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cream-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-cream-border dark:border-stone-700 flex items-center justify-center shadow-xs shrink-0">
                <BookOpen className="w-5 h-5 text-amber-700 dark:text-amber-400" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white leading-tight">
                  Study Session Tracker
                </h1>
                <span className="text-[11px] text-stone-500 dark:text-stone-400 hidden md:inline">
                  Weekly Subject Analytics & Classroom Sync
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Download Project as Study Sync Button */}
            <a
              id="btn-download-study-sync"
              href="/api/download-project"
              download="Study Sync.zip"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300/80 dark:border-amber-700/80 bg-amber-500/10 dark:bg-amber-500/20 hover:bg-amber-500/20 dark:hover:bg-amber-500/30 text-amber-900 dark:text-amber-200 text-xs font-semibold shadow-xs transition cursor-pointer"
              title="Download entire project into a 'Study Sync' folder (ZIP)"
            >
              <Download className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
              <span className="hidden sm:inline">Download Study Sync</span>
              <span className="sm:hidden">Download</span>
            </a>

            {/* Notification Permission Button */}
            <button
              id="btn-enable-notifications"
              onClick={handleRequestPushPermission}
              className="p-2 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-cream-100 dark:hover:bg-stone-800 transition cursor-pointer"
              title="Enable Push Notifications"
            >
              <Bell className="w-5 h-5" />
            </button>

            {/* Dark Mode Toggle */}
            <button
              id="btn-toggle-dark-mode"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-cream-100 dark:hover:bg-stone-800 transition cursor-pointer"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-stone-600" />}
            </button>

            {/* User Profile & Multi-Account Switcher */}
            <UserProfileMenu
              currentUser={currentUser}
              allUsers={allRegisteredUsers}
              onSwitchUser={handleSwitchUser}
              onLogout={handleLogout}
              onConnectGoogle={handleConnectGoogle}
              onOpenAccountSettings={() => setIsAccountSettingsOpen(true)}
              onUpdateUser={handleUpdateUserProfile}
            />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-40 space-y-6">
        {/* Real-time Cloud Sync & Offline Status Banner */}
        <CloudSyncBar
          syncStatus={syncStatus}
          onTriggerSync={triggerCloudSync}
          userId={userId}
          onUpdateUserId={handleUpdateUserId}
        />

        {/* Motivational Streak Maintainer Component */}
        <StreakMaintainer
          streak={streak}
          todayPercentage={todayStreakPercent}
          onDailyCheckInClick={() => {
            setActiveTab('dashboard');
            setTimeout(() => {
              const el = document.getElementById('daily-todo-checkin-card');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              }
            }, 50);
          }}
        />

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-cream-border dark:border-stone-800 scrollbar-none">
          {[
            { id: 'dashboard', label: 'Overview & Visual Progress', icon: BarChart3 },
            { id: 'timer', label: 'Study Timer & Stopwatch', icon: Clock },
            { id: 'deadlines', label: 'Google Classroom & Deadlines', icon: GraduationCap },
            { id: 'history', label: 'Session History Logs', icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
                  isSelected
                    ? 'bg-cream-card text-stone-900 dark:bg-stone-900 dark:text-stone-100 border border-cream-border dark:border-stone-700 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-cream-100/80 dark:hover:bg-stone-800/70'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content based on Active Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Daily To-Do List & Daily Streak Check-In Hub (Very top of home page) */}
            <DailyTodoListAndCheckIn
              todos={todos}
              onAddTodo={handleAddTodo}
              onToggleTodo={handleToggleTodo}
              onDeleteTodo={handleDeleteTodo}
              subjects={subjects}
              streak={streak}
              onUpdateStreak={(newStreak) => {
                setStreak(newStreak);
                triggerCloudSync();
              }}
              todayStudyMinutes={todayStudyMinutes}
              dailyTargetMinutes={dailyTargetMinutes}
              preferences={currentUser.preferences}
            />

            {/* Quick Access Floating Widget embedded directly in Dashboard view */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <TimerWidget
                  subjects={subjects}
                  onSessionComplete={handleSessionComplete}
                  isCompact={false}
                  preferences={currentUser.preferences}
                  onTimerStateChange={setIsStudyTimerActive}
                />
              </div>
              <div className="space-y-6">
                <TimerWidget
                  subjects={subjects}
                  onSessionComplete={handleSessionComplete}
                  isCompact={true}
                  preferences={currentUser.preferences}
                  onTimerStateChange={setIsStudyTimerActive}
                />

                {/* Quick Classroom Deadlines mini widget */}
                <div
                  id="widget-mini-deadlines"
                  className="bg-cream-card dark:bg-stone-900 border border-cream-border dark:border-stone-800 rounded-2xl p-5 shadow-xs"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      Upcoming Classroom Deadlines
                    </span>
                    <button
                      onClick={() => setActiveTab('deadlines')}
                      className="text-xs text-stone-700 dark:text-stone-300 font-medium hover:underline cursor-pointer"
                    >
                      View All
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {deadlines
                      .filter((d) => !d.completed)
                      .slice(0, 3)
                      .map((d) => (
                        <div
                          key={d.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-cream-100 dark:bg-stone-800/40 text-xs border border-cream-border/60 dark:border-stone-800/60"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="font-semibold text-stone-900 dark:text-white truncate">
                              {d.title}
                            </div>
                            <div className="text-[11px] text-stone-400">{d.courseName}</div>
                          </div>
                          <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 shrink-0">
                            {new Date(d.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Dashboard with Visual Progress Chart */}
            <VisualDashboard
              weeklyData={weeklyData}
              totalWeekMinutes={totalWeekMinutes}
              totalWeekSessions={totalWeekSessions}
              weeklyGoalMinutes={weeklyGoalMinutes}
              recentSessions={sessions}
              onOpenSubjectModal={() => setIsSubjectModalOpen(true)}
            />
          </div>
        )}

        {activeTab === 'timer' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <TimerWidget
              subjects={subjects}
              onSessionComplete={handleSessionComplete}
              isCompact={false}
              preferences={currentUser.preferences}
              onTimerStateChange={setIsStudyTimerActive}
            />

            <div className="bg-cream-card dark:bg-stone-900 border border-cream-border dark:border-stone-800 rounded-3xl p-6 shadow-xs">
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-3">
                Today's Logged Sessions
              </h3>
              <div className="space-y-2">
                {sessions.slice(0, 5).map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-cream-100 dark:bg-stone-850 text-xs border border-cream-border/60 dark:border-stone-800/60"
                  >
                    <div>
                      <span className="font-semibold text-stone-900 dark:text-white">
                        {s.subjectName}
                      </span>
                      <span className="text-stone-400 ml-2">
                        {formatMinutes(s.durationMinutes)}
                      </span>
                      {s.notes && (
                        <p className="text-stone-500 dark:text-stone-400 mt-0.5">{s.notes}</p>
                      )}
                    </div>
                    <span className="text-stone-400">{formatDateTime(s.startTime)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'deadlines' && (
          <ClassroomDeadlines
            deadlines={deadlines}
            courses={classroomCourses}
            isConnected={classroomConfig.connected}
            currentUser={currentUser}
            onConnectClassroom={handleConnectClassroom}
            onDisconnectClassroom={handleDisconnectClassroom}
            onRefreshClassroom={refreshClassroomData}
            onToggleDeadlineDone={handleToggleDeadline}
            onAddCustomDeadline={handleAddDeadline}
            onSendTestNotification={handleSendTestNotification}
          />
        )}

        {activeTab === 'history' && (
          <SessionHistoryLogs
            sessions={sessions}
            subjects={subjects}
            onDeleteSession={handleDeleteSession}
          />
        )}
      </main>

      {/* Subject Configuration Modal */}
      <SubjectModal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        subjects={subjects}
        onSaveSubjects={(updated) => {
          setSubjects(updated);
          triggerCloudSync();
        }}
      />

      {/* Central User Account Settings Modal */}
      {currentUser && (
        <AccountSettingsModal
          isOpen={isAccountSettingsOpen}
          onClose={() => setIsAccountSettingsOpen(false)}
          currentUser={currentUser}
          onUpdateUser={handleUpdateUserProfile}
          allUsers={allRegisteredUsers}
          onSwitchUser={handleSwitchUser}
          onLogout={handleLogout}
          onConnectGoogle={handleConnectGoogle}
          onDisconnectGoogle={handleDisconnectGoogle}
          subjects={subjects}
          onUpdateSubjects={(newSubjects) => {
            setSubjects(newSubjects);
            triggerCloudSync();
          }}
          sessions={sessions}
          onUpdateSessions={(newSessions) => {
            setSessions(newSessions);
            triggerCloudSync();
          }}
          deadlines={deadlines}
          streak={streak}
          onResetAccountData={handleResetAccountData}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          userId={userId}
          onUpdateUserId={handleUpdateUserId}
          onTriggerSync={triggerCloudSync}
          onRequestPushNotifications={handleRequestPushPermission}
        />
      )}

      {/* Floating Ambient Focus Sounds Mini-Player & Bottom Navigation Toggles */}
      <AmbientSoundBottomBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isStudyTimerActive={isStudyTimerActive}
      />
    </div>
  );
}
