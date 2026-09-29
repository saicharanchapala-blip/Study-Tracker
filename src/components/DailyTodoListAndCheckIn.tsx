import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Flame,
  Calendar,
  Sparkles,
  Clock,
  Tag,
  Check,
  Zap,
  Smile,
  Trophy,
  Filter,
  ListTodo,
  TrendingUp,
  X,
  MessageSquare,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TodoItem, Subject, StreakData, DailyStreakCheckIn, UserPreferences } from '../types';
import { calculateDayStreakPercentage, formatMinutes } from '../utils/calculations';

interface DailyTodoListAndCheckInProps {
  todos: TodoItem[];
  onAddTodo: (todo: Omit<TodoItem, 'id' | 'createdAt'>) => void;
  onToggleTodo: (id: string) => void;
  onDeleteTodo: (id: string) => void;
  subjects: Subject[];
  streak: StreakData;
  onUpdateStreak: (updatedStreak: StreakData) => void;
  todayStudyMinutes: number;
  dailyTargetMinutes?: number;
  preferences?: UserPreferences;
}

const PRESET_SUGGESTIONS = [
  'Review lecture slides & notes',
  'Complete assigned practice problems',
  'Prepare lab report analysis',
  'Read 20 pages of textbook',
  'Review flashcards & key terms',
];

export const DailyTodoListAndCheckIn: React.FC<DailyTodoListAndCheckInProps> = ({
  todos,
  onAddTodo,
  onToggleTodo,
  onDeleteTodo,
  subjects,
  streak,
  onUpdateStreak,
  todayStudyMinutes,
  dailyTargetMinutes = 30,
  preferences,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  // Todo Form State
  const [newTodoText, setNewTodoText] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [filterMode, setFilterMode] = useState<'all' | 'active' | 'completed'>('all');
  const [filterSubjectId, setFilterSubjectId] = useState<string>('all');

  // Check-In Modal State
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInMood, setCheckInMood] = useState<'focused' | 'productive' | 'tired' | 'distracted' | 'energized'>(
    preferences?.defaultMood || 'focused'
  );
  const [checkInReflection, setCheckInReflection] = useState('');
  const [checkInGoalNote, setCheckInGoalNote] = useState('');

  // Daily Check-In Record for Today
  const todayCheckIn: DailyStreakCheckIn | undefined = streak.dailyCheckIns?.[todayStr];
  const isCheckedInToday = Boolean(todayCheckIn?.checkedIn);

  // Filter todos relevant to selected view
  const visibleTodos = todos.filter((todo) => {
    if (filterMode === 'active' && todo.completed) return false;
    if (filterMode === 'completed' && !todo.completed) return false;
    if (filterSubjectId !== 'all' && todo.subjectId !== filterSubjectId) return false;
    return true;
  });

  const totalTodosCount = todos.length;
  const completedTodosCount = todos.filter((t) => t.completed).length;

  // Calculate live streak percentage for today
  const { totalPercentage: todayStreakPercent, breakdown } = calculateDayStreakPercentage({
    checkedIn: isCheckedInToday,
    isExplicitFullCheckIn: todayCheckIn?.percentage === 100,
    completedTodos: completedTodosCount,
    totalTodos: totalTodosCount,
    studyMinutes: todayStudyMinutes,
    dailyTargetMinutes,
  });

  // Selected Day's streak percentage (for 7-day selector)
  const selectedDayPercent =
    selectedDateStr === todayStr
      ? todayStreakPercent
      : streak.dailyPercentages?.[selectedDateStr] || (streak.activeDatesThisMonth?.includes(selectedDateStr) ? 100 : 0);

  // Sound & Confetti celebration trigger
  const triggerCelebration = (intense = false) => {
    if (preferences?.soundEnabled ?? true) {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880.0, now + 0.2); // A5
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.5);
      } catch (e) {}
    }

    if (preferences?.confettiEnabled ?? true) {
      try {
        confetti({
          particleCount: intense ? 70 : 35,
          spread: intense ? 70 : 50,
          origin: { y: 0.65 },
          colors: ['#f59e0b', '#6366f1', '#10b981', '#ec4899'],
        });
      } catch (e) {}
    }
  };

  // Perform Daily Check-In
  const handlePerformCheckIn = (explicit100 = false) => {
    const newPercent = explicit100 ? 100 : Math.max(40, todayStreakPercent);

    const updatedCheckIn: DailyStreakCheckIn = {
      date: todayStr,
      checkedIn: true,
      checkInTimestamp: new Date().toISOString(),
      mood: checkInMood,
      reflection: checkInReflection || 'Daily check-in completed.',
      dailyGoalNote: checkInGoalNote,
      percentage: newPercent,
      completedTodosCount,
      totalTodosCount,
      studyMinutes: todayStudyMinutes,
    };

    const updatedDailyCheckIns = {
      ...(streak.dailyCheckIns || {}),
      [todayStr]: updatedCheckIn,
    };

    const updatedPercentages = {
      ...(streak.dailyPercentages || {}),
      [todayStr]: newPercent,
    };

    const activeDates = new Set(streak.activeDatesThisMonth || []);
    activeDates.add(todayStr);

    let newCurrentStreak = streak.currentStreak;
    // If not studied/checked-in yet today, increment streak
    if (streak.lastStudyDate !== todayStr) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (streak.lastStudyDate === yesterdayStr) {
        newCurrentStreak += 1;
      } else if (!streak.lastStudyDate) {
        newCurrentStreak = 1;
      } else {
        newCurrentStreak = 1;
      }
    }

    const updatedStreak: StreakData = {
      ...streak,
      currentStreak: newCurrentStreak,
      longestStreak: Math.max(streak.longestStreak, newCurrentStreak),
      lastStudyDate: todayStr,
      activeDatesThisMonth: Array.from(activeDates),
      dailyPercentages: updatedPercentages,
      dailyCheckIns: updatedDailyCheckIns,
    };

    onUpdateStreak(updatedStreak);
    setShowCheckInModal(false);
    triggerCelebration(explicit100);
  };

  // Add a task
  const handleCreateTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;

    const matchedSubject = subjects.find((s) => s.id === selectedSubjectId);

    onAddTodo({
      text: newTodoText.trim(),
      completed: false,
      subjectId: matchedSubject?.id,
      subjectName: matchedSubject?.name,
      priority: selectedPriority,
      dueDate: todayStr,
    });

    setNewTodoText('');
  };

  // Build the 7-day consistency strip
  const weekDays = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const isToday = i === 0;
    const dayLabel = d.toLocaleDateString(undefined, { weekday: 'narrow' });
    const dayDateNum = d.getDate();

    let dayPercent = streak.dailyPercentages?.[dateStr];
    if (dayPercent === undefined) {
      if (isToday) {
        dayPercent = todayStreakPercent;
      } else {
        dayPercent = streak.activeDatesThisMonth?.includes(dateStr) ? 100 : 0;
      }
    }

    weekDays.push({
      dateStr,
      isToday,
      dayLabel,
      dayDateNum,
      percent: dayPercent,
      isSecured: dayPercent >= 80,
    });
  }

  return (
    <section id="home-todo-and-daily-checkin" className="space-y-4">
      {/* Container Layout: Left (To-Do List) & Right (Daily Streak Check-In Hub) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* =========================================================================
            LEFT COLUMN: TO-DO LIST (lg:col-span-7)
            ========================================================================= */}
        <div
          id="daily-todo-list-card"
          className="lg:col-span-7 bg-cream-card dark:bg-stone-900 border border-cream-border dark:border-stone-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between"
        >
          <div>
            {/* Header with Title and Completion Stats */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-cream-border/70 dark:border-stone-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cream-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center border border-cream-border dark:border-indigo-900/50">
                  <ListTodo className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 leading-snug flex items-center gap-2">
                    Today's Study To-Do List
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-cream-100 dark:bg-indigo-950/60 text-stone-800 dark:text-indigo-300 border border-cream-border dark:border-indigo-800/50">
                      {completedTodosCount}/{totalTodosCount} Done
                    </span>
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Each task completed directly raises your daily streak by up to +35%
                  </p>
                </div>
              </div>

              {/* Progress Bar & Percentage Pill */}
              <div className="flex items-center gap-3 self-start sm:self-auto">
                <div className="text-right">
                  <div className="text-xs font-bold text-stone-900 dark:text-stone-100">
                    {totalTodosCount > 0 ? Math.round((completedTodosCount / totalTodosCount) * 100) : 0}% Done
                  </div>
                  <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                    +{breakdown.todosPercent}% to streak
                  </div>
                </div>
                <div className="w-16 sm:w-20 bg-stone-100 dark:bg-stone-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${totalTodosCount > 0 ? (completedTodosCount / totalTodosCount) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Add To-Do Form */}
            <form onSubmit={handleCreateTodo} className="mt-4 space-y-2.5">
              <div className="flex items-center gap-2">
                <input
                  id="input-new-todo-text"
                  type="text"
                  value={newTodoText}
                  onChange={(e) => setNewTodoText(e.target.value)}
                  placeholder="What are you studying or solving today? (e.g. Solve Chapter 3 problems)"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-cream-border dark:border-stone-800 bg-cream-50 dark:bg-stone-800/60 text-stone-900 dark:text-stone-100 placeholder-stone-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
                />
                <button
                  type="submit"
                  id="btn-add-todo"
                  disabled={!newTodoText.trim()}
                  className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white dark:bg-stone-100 dark:hover:bg-white dark:text-stone-900 text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>

              {/* Tag Selectors: Subject & Priority */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    id="select-todo-subject"
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-cream-border dark:border-stone-800 bg-cream-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                  >
                    <option value="">No specific subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>

                  {/* Priority Select */}
                  <div className="flex items-center gap-1 bg-cream-100 dark:bg-stone-800/80 p-0.5 rounded-lg border border-cream-border dark:border-stone-800">
                    {(['low', 'medium', 'high'] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setSelectedPriority(p)}
                        className={`px-2 py-1 rounded-md text-[11px] font-semibold capitalize transition ${
                          selectedPriority === p
                            ? p === 'high'
                              ? 'bg-rose-400 text-white shadow-xs'
                              : p === 'medium'
                              ? 'bg-amber-400 text-stone-900 shadow-xs'
                              : 'bg-indigo-500 text-white shadow-xs'
                            : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1">
                  {(['all', 'active', 'completed'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setFilterMode(mode)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold capitalize transition cursor-pointer ${
                        filterMode === mode
                          ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs'
                          : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </form>

            {/* Quick Inspiration Pills */}
            <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> Suggestions:
              </span>
              {PRESET_SUGGESTIONS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setNewTodoText(preset)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-stone-100 dark:bg-stone-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 text-stone-600 dark:text-stone-300 border border-stone-200/60 dark:border-stone-800 transition whitespace-nowrap cursor-pointer shrink-0"
                >
                  + {preset}
                </button>
              ))}
            </div>

            {/* To-Do Items List */}
            <div className="mt-4 space-y-2 max-h-[290px] overflow-y-auto pr-1">
              {visibleTodos.length === 0 ? (
                <div className="py-8 text-center border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-2xl">
                  <CheckCircle2 className="w-8 h-8 text-stone-300 dark:text-stone-600 mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                    {filterMode === 'completed'
                      ? 'No completed tasks yet. Check off items to complete them!'
                      : 'No tasks scheduled! Add a goal above to get started.'}
                  </p>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Completing tasks directly contributes toward today's streak percentage.
                  </p>
                </div>
              ) : (
                visibleTodos.map((item) => {
                  const subject = subjects.find((s) => s.id === item.subjectId);
                  return (
                    <div
                      key={item.id}
                      id={`todo-item-${item.id}`}
                      className={`group flex items-center justify-between p-3 rounded-2xl border transition-all ${
                        item.completed
                          ? 'bg-cream-100/70 dark:bg-stone-900/40 border-cream-border/60 dark:border-stone-800/60 opacity-80'
                          : 'bg-cream-surface dark:bg-stone-800/80 border-cream-border dark:border-stone-700/80 hover:border-amber-300 dark:hover:border-indigo-600 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Checkbox Trigger */}
                        <button
                          type="button"
                          id={`btn-toggle-todo-${item.id}`}
                          onClick={() => {
                            onToggleTodo(item.id);
                            if (!item.completed) {
                              triggerCelebration(false);
                            }
                          }}
                          className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                            item.completed
                              ? 'bg-teal-500 text-white shadow-xs'
                              : 'border-2 border-stone-300 dark:border-stone-600 hover:border-teal-500'
                          }`}
                          title={item.completed ? 'Mark as incomplete' : 'Mark as complete & boost streak'}
                        >
                          {item.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>

                        <div className="min-w-0 flex-1">
                          <span
                            className={`text-xs sm:text-sm font-medium block truncate ${
                              item.completed
                                ? 'line-through text-stone-400 dark:text-stone-500'
                                : 'text-stone-900 dark:text-stone-100'
                            }`}
                          >
                            {item.text}
                          </span>

                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            {/* Subject Pill */}
                            {subject && (
                              <span
                                className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                                style={{ backgroundColor: subject.color }}
                              >
                                {subject.name}
                              </span>
                            )}

                            {/* Priority Pill */}
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                                item.priority === 'high'
                                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/40'
                                  : item.priority === 'medium'
                                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/40'
                                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                              }`}
                            >
                              {item.priority}
                            </span>

                            {/* Streak Impact Pill */}
                            <span className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">
                              {item.completed ? '✓ Streak boosted' : '+ Streak bonus'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Delete Action */}
                      <button
                        type="button"
                        id={`btn-delete-todo-${item.id}`}
                        onClick={() => onDeleteTodo(item.id)}
                        className="p-1.5 rounded-lg text-stone-300 dark:text-stone-600 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0 ml-2"
                        title="Delete task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: DAILY CHECK-IN & DIRECT STREAK PERCENTAGE (lg:col-span-5)
            ========================================================================= */}
        <div
          id="daily-checkin-streak-hub"
          className="lg:col-span-5 bg-cream-card dark:bg-stone-900 border border-cream-border dark:border-stone-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between"
        >
          <div>
            {/* Top Row: Daily Check-in Title & Status */}
            <div className="flex items-center justify-between pb-3 border-b border-cream-border/80 dark:border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-cream-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-cream-border dark:border-amber-900/40 flex items-center justify-center shadow-xs">
                  <Flame className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 leading-tight">
                    Daily Check-In & Streak
                  </h3>
                  <span className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold">
                    {streak.currentStreak} Day Streak Active
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <div
                className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  todayStreakPercent >= 100
                    ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                    : todayStreakPercent >= 50
                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700'
                }`}
              >
                {todayStreakPercent >= 100 ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Secured (100%)</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>{todayStreakPercent}% Today</span>
                  </>
                )}
              </div>
            </div>

            {/* Circular Streak Progress Gauge & Score Details */}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-cream-100 dark:bg-stone-850 border border-cream-border/90 dark:border-stone-800 shadow-xs">
              {/* Radial Percentage Circle */}
              <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="text-stone-100 dark:text-stone-800 stroke-current"
                    strokeWidth="9"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className={`stroke-current transition-all duration-700 ease-out ${
                      todayStreakPercent >= 100
                        ? 'text-teal-400 dark:text-teal-500'
                        : todayStreakPercent >= 60
                        ? 'text-amber-400 dark:text-amber-500'
                        : 'text-indigo-400 dark:text-indigo-500'
                    }`}
                    strokeWidth="9"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - todayStreakPercent / 100)}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-black text-stone-900 dark:text-stone-100 leading-none">
                    {todayStreakPercent}%
                  </span>
                  <span className="text-[9px] uppercase font-bold text-stone-400 dark:text-stone-500 mt-0.5">
                    Streak
                  </span>
                </div>
              </div>

              {/* Progress Summary & Feedback Text */}
              <div className="flex-1 text-center sm:text-left">
                <div className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  {todayStreakPercent >= 100
                    ? '🎉 100% Streak Goal Achieved!'
                    : isCheckedInToday
                    ? '⚡ Checked In! Finish tasks to reach 100%'
                    : '⏳ Complete Daily Check-In to secure streak'}
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
                  {todayStreakPercent >= 100
                    ? "You've met all consistency markers for today. Your streak is safe!"
                    : isCheckedInToday
                    ? `${100 - todayStreakPercent}% remaining. Check off tasks or study to reach 100%.`
                    : 'Click Daily Check-In below for an instant +40% boost towards your streak!'}
                </p>

                {/* Mood or Reflection Note if logged */}
                {todayCheckIn?.mood && (
                  <div className="mt-2 text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 border border-amber-200/50 dark:border-amber-900/40">
                    <Smile className="w-3.5 h-3.5 text-amber-600" />
                    <span>Mood: <strong className="capitalize">{todayCheckIn.mood}</strong></span>
                    {todayCheckIn.dailyGoalNote && <span>• "{todayCheckIn.dailyGoalNote}"</span>}
                  </div>
                )}
              </div>
            </div>

            {/* Direct Formula / Contributing Factors */}
            <div className="mt-4 space-y-2">
              <div className="text-[11px] uppercase tracking-wider font-bold text-stone-400 dark:text-stone-500 px-1">
                Streak Calculation Breakdown:
              </div>

              {/* Check-In Contribution */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-cream-50 dark:bg-stone-850 border border-cream-border/70 dark:border-stone-800 text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                      isCheckedInToday
                        ? 'bg-teal-500 text-white'
                        : 'bg-cream-200 dark:bg-stone-700 text-stone-500'
                    }`}
                  >
                    {isCheckedInToday ? '✓' : '—'}
                  </div>
                  <span className="font-semibold text-stone-800 dark:text-stone-200">Daily Check-In</span>
                </div>
                <span className="font-bold text-amber-700 dark:text-indigo-400">
                  +{breakdown.checkInPercent}% / 40%
                </span>
              </div>

              {/* To-Do Items Contribution */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-cream-50 dark:bg-stone-850 border border-cream-border/70 dark:border-stone-800 text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                      completedTodosCount > 0
                        ? 'bg-teal-500 text-white'
                        : 'bg-cream-200 dark:bg-stone-700 text-stone-500'
                    }`}
                  >
                    {completedTodosCount > 0 ? '✓' : '—'}
                  </div>
                  <span className="font-semibold text-stone-800 dark:text-stone-200">
                    To-Dos ({completedTodosCount}/{totalTodosCount} completed)
                  </span>
                </div>
                <span className="font-bold text-amber-700 dark:text-indigo-400">
                  +{breakdown.todosPercent}% / 35%
                </span>
              </div>

              {/* Study Time Contribution */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-cream-50 dark:bg-stone-850 border border-cream-border/70 dark:border-stone-800 text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                      todayStudyMinutes >= 15
                        ? 'bg-teal-500 text-white'
                        : 'bg-cream-200 dark:bg-stone-700 text-stone-500'
                    }`}
                  >
                    {todayStudyMinutes >= 15 ? '✓' : '—'}
                  </div>
                  <span className="font-semibold text-stone-800 dark:text-stone-200">
                    Focus Time ({formatMinutes(todayStudyMinutes)} logged)
                  </span>
                </div>
                <span className="font-bold text-amber-700 dark:text-indigo-400">
                  +{breakdown.studyPercent}% / 25%
                </span>
              </div>
            </div>

            {/* 7-Day Consistency Micro-Strip */}
            <div className="mt-4 pt-3 border-t border-cream-border/80 dark:border-stone-800">
              <div className="text-[11px] font-bold text-stone-500 dark:text-stone-400 mb-2 flex items-center justify-between">
                <span>Recent 7-Day Streak % History:</span>
                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">
                  Personal Best: {streak.longestStreak}d
                </span>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {weekDays.map((day) => {
                  const isSelected = selectedDateStr === day.dateStr;
                  return (
                    <button
                      key={day.dateStr}
                      type="button"
                      onClick={() => setSelectedDateStr(day.dateStr)}
                      className={`flex flex-col items-center p-1.5 rounded-xl text-center transition cursor-pointer ${
                        isSelected
                          ? 'bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700'
                          : 'bg-cream-50 dark:bg-stone-850 border border-cream-border/70 dark:border-stone-800 hover:bg-cream-100 dark:hover:bg-stone-800'
                      }`}
                      title={`${day.dateStr}: ${day.percent}% Streak`}
                    >
                      <span className="text-[10px] font-semibold text-stone-400 dark:text-stone-500">
                        {day.dayLabel}
                      </span>
                      <span className="text-[11px] font-bold text-stone-900 dark:text-white">
                        {day.dayDateNum}
                      </span>
                      <div
                        className={`mt-1 text-[9px] font-bold px-1 rounded-md leading-tight ${
                          day.percent >= 80
                            ? 'bg-teal-400 text-teal-950 dark:bg-teal-500/80 dark:text-white'
                            : day.percent >= 40
                            ? 'bg-amber-200 text-amber-900 dark:bg-amber-500/80 dark:text-white'
                            : 'bg-cream-200 dark:bg-stone-700 text-stone-600 dark:text-stone-400'
                        }`}
                      >
                        {day.percent}%
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Buttons: Primary Daily Check-In & 100% Instant Lock */}
          <div className="mt-5 space-y-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-trigger-daily-checkin"
                onClick={() => setShowCheckInModal(true)}
                className={`flex-1 py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer ${
                  isCheckedInToday
                    ? 'bg-teal-600 hover:bg-teal-700 text-white'
                    : 'bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:hover:bg-white dark:text-stone-900'
                }`}
              >
                <Flame className="w-4 h-4 fill-current text-amber-400" />
                <span>
                  {isCheckedInToday ? '✓ Check-In Logged (Edit / Update)' : 'Perform Daily Check-In (+40%)'}
                </span>
              </button>

              {/* Instant 100% Button */}
              {todayStreakPercent < 100 && (
                <button
                  type="button"
                  id="btn-instant-100-checkin"
                  onClick={() => handlePerformCheckIn(true)}
                  className="py-3 px-3.5 rounded-2xl font-bold text-xs bg-cream-card dark:bg-stone-800 hover:bg-cream-100 dark:hover:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-cream-border dark:border-stone-700 transition shadow-xs cursor-pointer shrink-0"
                  title="Mark today as 100% completed streak (offline study credit)"
                >
                  <Trophy className="w-4 h-4 text-amber-500" />
                </button>
              )}
            </div>

            {selectedDateStr !== todayStr && (
              <div className="text-[11px] text-center text-stone-500 dark:text-stone-400">
                Viewing <strong>{selectedDateStr}</strong>: {selectedDayPercent}% streak recorded.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODAL: DAILY CHECK-IN REFLECTION & INTENTION DIALOG
          ========================================================================= */}
      {showCheckInModal && (
        <div
          id="modal-daily-checkin"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs"
        >
          <div className="w-full max-w-md bg-cream-card dark:bg-stone-900 border border-cream-border dark:border-stone-800 rounded-3xl p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setShowCheckInModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-white hover:bg-cream-100 dark:hover:bg-stone-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-cream-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-cream-border dark:border-amber-900/40 flex items-center justify-center shadow-xs">
                <Flame className="w-6 h-6 fill-current" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 leading-snug">
                  Daily Study Check-In
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Mood Selection */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block mb-1.5">
                  How are you feeling today?
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(
                    [
                      { id: 'focused', label: 'Focused', emoji: '🎯' },
                      { id: 'energized', label: 'Energized', emoji: '⚡' },
                      { id: 'productive', label: 'Productive', emoji: '🚀' },
                      { id: 'tired', label: 'Tired', emoji: '☕' },
                      { id: 'distracted', label: 'Resetting', emoji: '🧘' },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setCheckInMood(m.id)}
                      className={`p-2 rounded-xl text-center transition cursor-pointer ${
                        checkInMood === m.id
                          ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800 font-bold'
                          : 'bg-cream-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-cream-border/70 dark:border-stone-700 hover:bg-cream-100 dark:hover:bg-stone-700'
                      }`}
                    >
                      <div className="text-lg mb-0.5">{m.emoji}</div>
                      <div className="text-[10px] leading-tight truncate">{m.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Today's Main Priority / Intention */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block mb-1.5">
                  Today's Main Focus / Goal
                </label>
                <input
                  type="text"
                  value={checkInGoalNote}
                  onChange={(e) => setCheckInGoalNote(e.target.value)}
                  placeholder="e.g. Master dynamic programming & complete problem set 4"
                  className="w-full px-3 py-2 rounded-xl border border-cream-border dark:border-stone-800 bg-cream-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              {/* Short Reflection / Notes */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block mb-1.5">
                  Reflection / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={checkInReflection}
                  onChange={(e) => setCheckInReflection(e.target.value)}
                  placeholder="Notes about your headspace, study environment, or strategy..."
                  className="w-full px-3 py-2 rounded-xl border border-cream-border dark:border-stone-800 bg-cream-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                />
              </div>

              {/* Streak Impact Preview */}
              <div className="p-3.5 rounded-2xl bg-cream-100 dark:bg-amber-950/40 border border-cream-border dark:border-amber-900/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-500 fill-current" />
                  <div>
                    <div className="text-xs font-bold text-stone-900 dark:text-stone-100">
                      Streak Progress Impact
                    </div>
                    <div className="text-[11px] text-amber-700 dark:text-amber-300">
                      Instantly adds +40% daily check-in bonus
                    </div>
                  </div>
                </div>
                <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                  → {Math.min(100, Math.max(40, todayStreakPercent))}%
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowCheckInModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-checkin"
                onClick={() => handlePerformCheckIn(false)}
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:hover:bg-white dark:text-stone-900 shadow-xs transition cursor-pointer"
              >
                Confirm Check-In
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
