import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  BookOpen,
  Clock,
  Tag,
  Smile,
  Sparkles,
  Coffee,
  RotateCcw,
  SkipForward,
  Flame,
  CheckCircle2,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Subject, StudySession, UserPreferences } from '../types';
import { notificationManager } from '../utils/notifications';

interface TimerWidgetProps {
  subjects: Subject[];
  onSessionComplete: (session: StudySession) => void;
  isCompact?: boolean;
  preferences?: UserPreferences;
  onTimerStateChange?: (isActive: boolean) => void;
}

export type TimerMode = 'standard' | 'pomodoro';
export type PomodoroPhase = 'focus' | 'break' | 'long_break';

export const TimerWidget: React.FC<TimerWidgetProps> = ({
  subjects,
  onSessionComplete,
  isCompact = false,
  preferences,
  onTimerStateChange,
}) => {
  // Mode state: 'standard' (stopwatch counting up) or 'pomodoro' (25m focus / 5m break countdown)
  const [timerMode, setTimerMode] = useState<TimerMode>(() => {
    const saved = localStorage.getItem('study_timer_mode');
    return saved === 'pomodoro' ? 'pomodoro' : 'standard';
  });

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [mood, setMood] = useState<'focused' | 'productive' | 'tired' | 'distracted'>(
    preferences?.defaultMood || 'focused'
  );

  // --- Standard Stopwatch States ---
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [manualMinutes, setManualMinutes] = useState<number>(preferences?.defaultFocusDuration || 45);
  const [showManualModal, setShowManualModal] = useState(false);

  // --- Pomodoro States ---
  const focusDurationMinutes = preferences?.defaultFocusDuration || 25;
  const breakDurationMinutes = preferences?.defaultBreakDuration || 5;
  const longBreakDurationMinutes = 15;

  const [pomodoroPhase, setPomodoroPhase] = useState<PomodoroPhase>('focus');
  const [pomodoroSecondsLeft, setPomodoroSecondsLeft] = useState<number>(focusDurationMinutes * 60);
  const [pomodoroCount, setPomodoroCount] = useState<number>(0); // completed focus sessions in current cycle

  // Audio chimes synthesized with Web Audio API
  const playFocusCompleteChime = () => {
    if (preferences?.soundEnabled ?? true) {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const now = ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 celebratory fanfare
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);
          gain.gain.setValueAtTime(0.18, now + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 0.4);
        });
      } catch (e) {}
    }
  };

  const playBreakCompleteChime = () => {
    if (preferences?.soundEnabled ?? true) {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const now = ctx.currentTime;
        const notes = [440, 554.37, 659.25]; // A4, C#5, E5 gentle energetic reminder
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.15);
          gain.gain.setValueAtTime(0.15, now + idx * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.15);
          osc.stop(now + idx * 0.15 + 0.5);
        });
      } catch (e) {}
    }
  };

  const handleCelebration = () => {
    playFocusCompleteChime();
    if (preferences?.confettiEnabled ?? true) {
      try {
        confetti({
          particleCount: 50,
          spread: 65,
          origin: { y: 0.7 },
          colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899'],
        });
      } catch (e) {}
    }
  };

  // Restore active timer state from localStorage to survive page reload / tab switch
  useEffect(() => {
    const savedTimer = localStorage.getItem('study_timer_state');
    if (savedTimer) {
      try {
        const parsed = JSON.parse(savedTimer);
        if (parsed.timerMode) {
          setTimerMode(parsed.timerMode);
        }
        if (parsed.pomodoroPhase) {
          setPomodoroPhase(parsed.pomodoroPhase);
        }
        if (typeof parsed.pomodoroCount === 'number') {
          setPomodoroCount(parsed.pomodoroCount);
        }
        if (parsed.selectedSubjectId) {
          setSelectedSubjectId(parsed.selectedSubjectId);
        }
        if (parsed.notes) {
          setNotes(parsed.notes);
        }

        const now = Date.now();
        const lastSaved = parsed.lastSavedTimestamp || (parsed.startTime ? new Date(parsed.startTime).getTime() : now);
        const timePassedSinceSave = Math.max(0, Math.floor((now - lastSaved) / 1000));

        if (parsed.timerMode === 'pomodoro') {
          const initialRemaining = parsed.pomodoroSecondsLeft ?? focusDurationMinutes * 60;
          if (parsed.isActive) {
            const adjustedRemaining = Math.max(0, initialRemaining - timePassedSinceSave);
            setPomodoroSecondsLeft(adjustedRemaining);
            setIsActive(adjustedRemaining > 0);
          } else {
            setPomodoroSecondsLeft(initialRemaining);
            setIsActive(false);
          }
        } else {
          // Standard stopwatch
          const initialElapsed = parsed.secondsElapsed ?? 0;
          if (parsed.isActive && parsed.startTime) {
            const adjustedElapsed = initialElapsed + timePassedSinceSave;
            setSecondsElapsed(adjustedElapsed);
            setIsActive(true);
            setStartTime(parsed.startTime);
          } else {
            setSecondsElapsed(initialElapsed);
            setIsActive(false);
          }
        }
      } catch (e) {
        console.error('Failed to parse timer state', e);
      }
    }
  }, [subjects, focusDurationMinutes]);

  // Persist timer state while active or when values change
  useEffect(() => {
    if (isActive || secondsElapsed > 0 || (timerMode === 'pomodoro' && pomodoroSecondsLeft < (focusDurationMinutes * 60))) {
      localStorage.setItem(
        'study_timer_state',
        JSON.stringify({
          timerMode,
          isActive,
          startTime,
          selectedSubjectId,
          notes,
          secondsElapsed,
          pomodoroPhase,
          pomodoroSecondsLeft,
          pomodoroCount,
          lastSavedTimestamp: Date.now(),
        })
      );
    } else {
      localStorage.removeItem('study_timer_state');
    }
    localStorage.setItem('study_timer_mode', timerMode);
  }, [
    timerMode,
    isActive,
    startTime,
    selectedSubjectId,
    notes,
    secondsElapsed,
    pomodoroPhase,
    pomodoroSecondsLeft,
    pomodoroCount,
    focusDurationMinutes,
  ]);

  // Main Timer Tick Effect
  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        if (timerMode === 'standard') {
          setSecondsElapsed((prev) => prev + 1);
        } else {
          // Pomodoro countdown
          setPomodoroSecondsLeft((prev) => {
            if (prev <= 1) {
              // Time has elapsed for current Pomodoro phase!
              handlePomodoroPhaseComplete();
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, timerMode, pomodoroPhase, selectedSubjectId, notes, mood]);

  // Handle phase completion in Pomodoro mode
  const handlePomodoroPhaseComplete = () => {
    const subject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

    if (pomodoroPhase === 'focus') {
      // 25-minute focus session finished!
      handleCelebration();
      const currentStart = startTime || new Date(Date.now() - focusDurationMinutes * 60000).toISOString();
      const session: StudySession = {
        id: `session-pomodoro-${Date.now()}`,
        subjectId: subject.id,
        subjectName: subject.name,
        startTime: currentStart,
        endTime: new Date().toISOString(),
        durationMinutes: focusDurationMinutes,
        notes: notes.trim() ? `[Pomodoro] ${notes.trim()}` : '[Pomodoro 25-min Focus]',
        mood,
        tags: ['pomodoro', 'focus'],
      };

      onSessionComplete(session);

      // Notification
      notificationManager.sendLocalNotification('🍅 Pomodoro Focus Complete!', {
        body: `Great job on ${subject.name}! Take a 5-minute break to rest and refresh.`,
      });

      const nextCount = pomodoroCount + 1;
      setPomodoroCount(nextCount);

      // Decide next break: every 4th cycle can be a long break (15 min) or standard break (5 min)
      const isFourthCycle = nextCount % 4 === 0;
      const nextPhase: PomodoroPhase = isFourthCycle ? 'long_break' : 'break';
      const nextDuration = (isFourthCycle ? longBreakDurationMinutes : breakDurationMinutes) * 60;

      setPomodoroPhase(nextPhase);
      setPomodoroSecondsLeft(nextDuration);

      if (preferences?.autoStartBreaks) {
        setIsActive(true);
        setStartTime(new Date().toISOString());
      } else {
        setIsActive(false);
        setStartTime(null);
      }
    } else {
      // Break session finished!
      playBreakCompleteChime();
      notificationManager.sendLocalNotification('⏰ Break Over!', {
        body: 'Your break has finished. Ready to dive into your next 25-minute focus cycle?',
      });

      setPomodoroPhase('focus');
      setPomodoroSecondsLeft(focusDurationMinutes * 60);
      setIsActive(false);
      setStartTime(null);
    }
  };

  // Propagate active state to parent (e.g. for ambient sound auto-pause)
  useEffect(() => {
    onTimerStateChange?.(isActive);
  }, [isActive, onTimerStateChange]);

  // Mode switching
  const handleSwitchMode = (newMode: TimerMode) => {
    if (newMode === timerMode) return;
    if (isActive) {
      const confirmSwitch = window.confirm(
        'Switching timer modes will pause your ongoing session. Do you want to proceed?'
      );
      if (!confirmSwitch) return;
      setIsActive(false);
    }
    setTimerMode(newMode);
    localStorage.setItem('study_timer_mode', newMode);
  };

  // Switch Pomodoro phase manually
  const handleSwitchPomodoroPhase = (phase: PomodoroPhase) => {
    if (isActive && phase !== pomodoroPhase) {
      const confirmSwitch = window.confirm(
        `Switch to ${phase === 'focus' ? 'Focus' : 'Break'}? Your current cycle countdown will reset.`
      );
      if (!confirmSwitch) return;
    }
    setIsActive(false);
    setPomodoroPhase(phase);
    setStartTime(null);
    if (phase === 'focus') {
      setPomodoroSecondsLeft(focusDurationMinutes * 60);
    } else if (phase === 'long_break') {
      setPomodoroSecondsLeft(longBreakDurationMinutes * 60);
    } else {
      setPomodoroSecondsLeft(breakDurationMinutes * 60);
    }
  };

  // Common controls
  const handleStart = () => {
    setIsActive(true);
    setStartTime(new Date().toISOString());
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleResume = () => {
    setIsActive(true);
  };

  const handleResetPomodoro = () => {
    setIsActive(false);
    setStartTime(null);
    if (pomodoroPhase === 'focus') {
      setPomodoroSecondsLeft(focusDurationMinutes * 60);
    } else if (pomodoroPhase === 'long_break') {
      setPomodoroSecondsLeft(longBreakDurationMinutes * 60);
    } else {
      setPomodoroSecondsLeft(breakDurationMinutes * 60);
    }
  };

  const handleSkipPomodoro = () => {
    if (pomodoroPhase === 'focus') {
      // Prompt user whether to log partial progress or just skip to break
      const totalSec = focusDurationMinutes * 60;
      const elapsed = totalSec - pomodoroSecondsLeft;
      if (elapsed >= 60) {
        const shouldLog = window.confirm(
          `You've focused for ${Math.round(elapsed / 60)} minutes. Would you like to log this partial focus session before taking a break?`
        );
        if (shouldLog) {
          handleEarlyPomodoroFinish();
          return;
        }
      }
      handleSwitchPomodoroPhase('break');
    } else {
      // Skip break to focus
      handleSwitchPomodoroPhase('focus');
    }
  };

  // Early finish of Pomodoro focus session
  const handleEarlyPomodoroFinish = () => {
    const totalSec = focusDurationMinutes * 60;
    const elapsed = totalSec - pomodoroSecondsLeft;
    if (elapsed < 30) {
      if (!confirm('Focus session is less than 30 seconds. Do you want to record it anyway?')) {
        handleResetPomodoro();
        return;
      }
    }

    const durationMinutes = Math.max(1, Math.round(elapsed / 60));
    const subject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

    const session: StudySession = {
      id: `session-pomodoro-early-${Date.now()}`,
      subjectId: subject.id,
      subjectName: subject.name,
      startTime: startTime || new Date(Date.now() - durationMinutes * 60000).toISOString(),
      endTime: new Date().toISOString(),
      durationMinutes,
      notes: notes.trim() ? `[Pomodoro Partial] ${notes.trim()}` : '[Pomodoro Focus]',
      mood,
      tags: ['pomodoro', 'focus'],
    };

    onSessionComplete(session);
    handleCelebration();

    // Reset Pomodoro and transition to break
    setPomodoroCount((c) => c + 1);
    setPomodoroPhase('break');
    setPomodoroSecondsLeft(breakDurationMinutes * 60);
    setIsActive(false);
    setStartTime(null);
  };

  // Standard Stop & Save
  const handleStopAndSave = () => {
    if (secondsElapsed < 30) {
      if (!confirm('Session is less than 30 seconds. Do you want to record it anyway?')) {
        setIsActive(false);
        setSecondsElapsed(0);
        setStartTime(null);
        localStorage.removeItem('study_timer_state');
        return;
      }
    }

    const durationMinutes = Math.max(1, Math.round(secondsElapsed / 60));
    const subject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

    const session: StudySession = {
      id: `session-${Date.now()}`,
      subjectId: subject.id,
      subjectName: subject.name,
      startTime: startTime || new Date(Date.now() - durationMinutes * 60000).toISOString(),
      endTime: new Date().toISOString(),
      durationMinutes,
      notes: notes.trim() || undefined,
      mood,
    };

    onSessionComplete(session);
    handleCelebration();

    // Reset timer
    setIsActive(false);
    setSecondsElapsed(0);
    setStartTime(null);
    setNotes('');
    localStorage.removeItem('study_timer_state');
  };

  const handleLogManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualMinutes <= 0) return;
    const subject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];
    const endTime = new Date();
    const startTimeManual = new Date(endTime.getTime() - manualMinutes * 60000);

    const session: StudySession = {
      id: `session-manual-${Date.now()}`,
      subjectId: subject.id,
      subjectName: subject.name,
      startTime: startTimeManual.toISOString(),
      endTime: endTime.toISOString(),
      durationMinutes: manualMinutes,
      notes: notes.trim() || undefined,
      mood,
    };

    onSessionComplete(session);
    handleCelebration();
    setNotes('');
    setShowManualModal(false);
  };

  const formatTimer = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${hours > 0 ? pad(hours) + ':' : ''}${pad(mins)}:${pad(secs)}`;
  };

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

  // Current Pomodoro total phase duration
  const currentPomodoroTotalSec =
    pomodoroPhase === 'focus'
      ? focusDurationMinutes * 60
      : pomodoroPhase === 'long_break'
      ? longBreakDurationMinutes * 60
      : breakDurationMinutes * 60;

  const pomodoroPercent = Math.min(
    100,
    Math.max(0, Math.round(((currentPomodoroTotalSec - pomodoroSecondsLeft) / currentPomodoroTotalSec) * 100))
  );

  // --------------------------------------------------------------------------
  // COMPACT VIEW RENDER
  // --------------------------------------------------------------------------
  if (isCompact) {
    return (
      <div
        id="widget-quick-access"
        className="bg-cream-card dark:bg-stone-900 border border-cream-border dark:border-stone-800 rounded-2xl p-4 shadow-xs"
      >
        {/* Top Bar with Mode Toggle & Status */}
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              {isActive && (
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    timerMode === 'pomodoro' && pomodoroPhase !== 'focus' ? 'bg-emerald-400' : 'bg-teal-400'
                  }`}
                />
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isActive
                    ? timerMode === 'pomodoro' && pomodoroPhase !== 'focus'
                      ? 'bg-emerald-500'
                      : 'bg-teal-500'
                    : 'bg-stone-400'
                }`}
              />
            </span>
            <div className="flex items-center bg-cream-100 dark:bg-stone-800 p-0.5 rounded-lg border border-cream-border/70 dark:border-stone-700/60 text-[11px] font-semibold">
              <button
                id="btn-compact-mode-standard"
                onClick={() => handleSwitchMode('standard')}
                className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                  timerMode === 'standard'
                    ? 'bg-cream-card dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-800'
                }`}
              >
                Standard
              </button>
              <button
                id="btn-compact-mode-pomodoro"
                onClick={() => handleSwitchMode('pomodoro')}
                className={`px-2 py-0.5 rounded-md transition cursor-pointer flex items-center gap-1 ${
                  timerMode === 'pomodoro'
                    ? 'bg-cream-card dark:bg-stone-700 text-amber-700 dark:text-amber-400 shadow-xs'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-800'
                }`}
              >
                <span>🍅</span> Pomodoro
              </button>
            </div>
          </div>

          <span
            className="text-xs px-2.5 py-0.5 rounded-full font-medium border truncate max-w-[110px]"
            style={{
              backgroundColor: `${selectedSubject?.color}15`,
              borderColor: `${selectedSubject?.color}35`,
              color: selectedSubject?.color,
            }}
          >
            {selectedSubject?.name.split(' ')[0] || 'Subject'}
          </span>
        </div>

        {/* Timer Display & Sub-indicator */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-mono text-3xl font-bold text-stone-900 dark:text-stone-100 tracking-tight tabular-nums">
              {timerMode === 'standard' ? formatTimer(secondsElapsed) : formatTimer(pomodoroSecondsLeft)}
            </div>
            {timerMode === 'pomodoro' && (
              <div className="flex items-center gap-1.5 mt-0.5 text-[11px] font-medium text-stone-500 dark:text-stone-400">
                {pomodoroPhase === 'focus' ? (
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <Flame className="w-3 h-3" /> Focus Cycle (25m)
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <Coffee className="w-3 h-3" /> Break Cycle (5m)
                  </span>
                )}
                <span>• #{pomodoroCount + 1}</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            {timerMode === 'standard' ? (
              !isActive && secondsElapsed === 0 ? (
                <button
                  id="btn-widget-start"
                  onClick={handleStart}
                  className="p-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white text-white font-medium transition shadow-xs cursor-pointer"
                  title="Start Study Session"
                >
                  <Play className="w-4 h-4 fill-current" />
                </button>
              ) : isActive ? (
                <>
                  <button
                    id="btn-widget-pause"
                    onClick={handlePause}
                    className="p-2 rounded-xl bg-amber-500/90 hover:bg-amber-500 text-white transition shadow-xs cursor-pointer"
                    title="Pause"
                  >
                    <Pause className="w-4 h-4 fill-current" />
                  </button>
                  <button
                    id="btn-widget-stop"
                    onClick={handleStopAndSave}
                    className="p-2 rounded-xl bg-rose-500/90 hover:bg-rose-500 text-white transition shadow-xs cursor-pointer"
                    title="Stop & Log Session"
                  >
                    <Square className="w-4 h-4 fill-current" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    id="btn-widget-resume"
                    onClick={handleResume}
                    className="p-2 rounded-xl bg-teal-600/90 hover:bg-teal-600 text-white transition shadow-xs cursor-pointer"
                    title="Resume"
                  >
                    <Play className="w-4 h-4 fill-current" />
                  </button>
                  <button
                    id="btn-widget-finish"
                    onClick={handleStopAndSave}
                    className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:hover:bg-white dark:text-stone-900 transition shadow-xs cursor-pointer"
                    title="Finish & Save"
                  >
                    <Square className="w-4 h-4 fill-current" />
                  </button>
                </>
              )
            ) : (
              /* Pomodoro Mode Compact Controls */
              <>
                {!isActive ? (
                  <button
                    id="btn-pomo-compact-start"
                    onClick={handleStart}
                    className="p-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium transition shadow-xs cursor-pointer"
                    title={pomodoroPhase === 'focus' ? 'Start Focus Session' : 'Start Break'}
                  >
                    <Play className="w-4 h-4 fill-current" />
                  </button>
                ) : (
                  <button
                    id="btn-pomo-compact-pause"
                    onClick={handlePause}
                    className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-white transition shadow-xs cursor-pointer"
                    title="Pause"
                  >
                    <Pause className="w-4 h-4 fill-current" />
                  </button>
                )}
                <button
                  id="btn-pomo-compact-skip"
                  onClick={handleSkipPomodoro}
                  className="p-2 rounded-xl bg-cream-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-cream-300 dark:hover:bg-stone-700 transition cursor-pointer"
                  title={pomodoroPhase === 'focus' ? 'Skip to Break' : 'Skip to Focus'}
                >
                  <SkipForward className="w-4 h-4" />
                </button>
                <button
                  id="btn-pomo-compact-reset"
                  onClick={handleResetPomodoro}
                  className="p-2 rounded-xl bg-cream-200 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-cream-300 dark:hover:bg-stone-700 transition cursor-pointer"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Pomodoro Progress Bar in Compact mode */}
        {timerMode === 'pomodoro' && (
          <div className="w-full bg-cream-200 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden mt-3">
            <div
              className={`h-full transition-all duration-300 ${
                pomodoroPhase === 'focus' ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${pomodoroPercent}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // FULL VIEW RENDER
  // --------------------------------------------------------------------------
  return (
    <div
      id="main-timer-card"
      className="bg-cream-card dark:bg-stone-900 border border-cream-border dark:border-stone-800 rounded-3xl p-6 sm:p-8 shadow-xs transition"
    >
      {/* Top Header with Mode Selector & Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-cream-border/60 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              {timerMode === 'pomodoro' ? (
                <>
                  <span className="text-xl">🍅</span>
                  Pomodoro Focus & Break Cycles
                </>
              ) : (
                <>
                  <Clock className="w-5 h-5 text-amber-600" />
                  Active Study Timer
                </>
              )}
            </h2>
          </div>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            {timerMode === 'pomodoro'
              ? 'Maximize flow state with 25-minute focus intervals followed by 5-minute rejuvenating breaks.'
              : 'Log study time in real-time with the stopwatch or register past sessions manually.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Main Segmented Toggle: Standard Stopwatch vs Pomodoro */}
          <div className="flex items-center bg-cream-100 dark:bg-stone-800 p-1 rounded-2xl border border-cream-border dark:border-stone-700/80 shadow-xs">
            <button
              id="btn-toggle-standard-mode"
              onClick={() => handleSwitchMode('standard')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                timerMode === 'standard'
                  ? 'bg-cream-card dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
              <span>Standard Timer</span>
            </button>
            <button
              id="btn-toggle-pomodoro-mode"
              onClick={() => handleSwitchMode('pomodoro')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                timerMode === 'pomodoro'
                  ? 'bg-cream-card dark:bg-stone-700 text-amber-800 dark:text-amber-400 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <span>🍅</span>
              <span>Pomodoro (25m/5m)</span>
            </button>
          </div>

          {timerMode === 'standard' && (
            <button
              id="btn-open-manual-log"
              onClick={() => setShowManualModal(!showManualModal)}
              className="px-3.5 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white bg-cream-100 dark:bg-stone-800 hover:bg-cream-200 dark:hover:bg-stone-700 border border-cream-border dark:border-stone-700 rounded-xl transition cursor-pointer"
            >
              {showManualModal ? 'Use Stopwatch' : '+ Manual Entry'}
            </button>
          )}
        </div>
      </div>

      {/* Manual Entry Form */}
      {showManualModal && timerMode === 'standard' ? (
        <form onSubmit={handleLogManual} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
                Subject
              </label>
              <select
                id="select-manual-subject"
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full bg-cream-50 dark:bg-stone-800/80 border border-cream-border dark:border-stone-700 rounded-xl px-3.5 py-2.5 text-sm font-medium text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
                Duration (Minutes)
              </label>
              <input
                id="input-manual-duration"
                type="number"
                min="1"
                max="720"
                value={manualMinutes}
                onChange={(e) => setManualMinutes(parseInt(e.target.value) || 0)}
                className="w-full bg-cream-50 dark:bg-stone-800/80 border border-cream-border dark:border-stone-700 rounded-xl px-3.5 py-2.5 text-sm font-medium text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
              Session Focus Notes
            </label>
            <input
              id="input-manual-notes"
              type="text"
              placeholder="What topics or chapters did you study?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-cream-50 dark:bg-stone-800/80 border border-cream-border dark:border-stone-700 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowManualModal(false)}
              className="px-4 py-2 text-sm text-stone-600 dark:text-stone-400 hover:bg-cream-100 dark:hover:bg-stone-800 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="btn-submit-manual-session"
              type="submit"
              className="px-5 py-2 text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white dark:text-stone-900 rounded-xl transition shadow-xs cursor-pointer"
            >
              Log Past Session
            </button>
          </div>
        </form>
      ) : timerMode === 'pomodoro' ? (
        /* ------------------------------------------------------------------ */
        /* POMODORO MODE INTERFACE                                            */
        /* ------------------------------------------------------------------ */
        <div className="mt-6 flex flex-col items-center text-center">
          {/* Phase Selector Pills (Focus 25m vs Break 5m vs Long Break 15m) */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-cream-100 dark:bg-stone-800 border border-cream-border dark:border-stone-700/80 mb-6">
            <button
              id="btn-pomodoro-phase-focus"
              onClick={() => handleSwitchPomodoroPhase('focus')}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                pomodoroPhase === 'focus'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-300 hover:bg-cream-200 dark:hover:bg-stone-700'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Focus (25m)</span>
            </button>
            <button
              id="btn-pomodoro-phase-break"
              onClick={() => handleSwitchPomodoroPhase('break')}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                pomodoroPhase === 'break'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-300 hover:bg-cream-200 dark:hover:bg-stone-700'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>Short Break (5m)</span>
            </button>
            <button
              id="btn-pomodoro-phase-long-break"
              onClick={() => handleSwitchPomodoroPhase('long_break')}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                pomodoroPhase === 'long_break'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-300 hover:bg-cream-200 dark:hover:bg-stone-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Long Break (15m)</span>
            </button>
          </div>

          {/* Subject Selector (Active during focus phase) */}
          {pomodoroPhase === 'focus' ? (
            <div className="flex flex-wrap items-center justify-center gap-2 mb-4 max-w-xl">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 mr-1">Target Subject:</span>
              {subjects.map((sub) => {
                const isSelected = sub.id === selectedSubjectId;
                return (
                  <button
                    key={sub.id}
                    id={`btn-pomo-select-subject-${sub.id}`}
                    onClick={() => !isActive && setSelectedSubjectId(sub.id)}
                    disabled={isActive}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'text-white shadow-xs'
                        : 'bg-cream-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-cream-200 dark:hover:bg-stone-700 border border-cream-border/60 dark:border-stone-700'
                    } ${isActive ? 'opacity-80 cursor-not-allowed' : ''}`}
                    style={isSelected ? { backgroundColor: sub.color } : {}}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: isSelected ? '#ffffff' : sub.color }}
                    />
                    {sub.name}
                  </button>
                );
              })}
            </div>
          ) : (
            /* Break Advice Banner */
            <div className="mb-4 px-5 py-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <Coffee className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>
                {pomodoroPhase === 'long_break'
                  ? 'Long break time! Walk around, grab a healthy snack, or do a quick stretch.'
                  : 'Time to rest your eyes! Hydrate, look 20 feet away into the distance, and relax.'}
              </span>
            </div>
          )}

          {/* Large Countdown Display */}
          <div className="relative my-2 py-2">
            <div className="font-mono text-6xl sm:text-7xl md:text-8xl font-black text-stone-900 dark:text-stone-100 tracking-tight tabular-nums">
              {formatTimer(pomodoroSecondsLeft)}
            </div>

            {/* Status text */}
            <div className="flex items-center justify-center gap-2 mt-2">
              {isActive ? (
                <div
                  className={`flex items-center gap-2 text-xs font-medium ${
                    pomodoroPhase === 'focus'
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  } animate-pulse`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      pomodoroPhase === 'focus' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                  />
                  <span>
                    {pomodoroPhase === 'focus'
                      ? `Focusing on ${selectedSubject.name}...`
                      : 'Break in progress — rejuvenating your mind...'}
                  </span>
                </div>
              ) : (
                <span className="text-xs font-medium text-stone-400">
                  {pomodoroSecondsLeft === currentPomodoroTotalSec
                    ? 'Ready to begin cycle'
                    : 'Cycle paused'}
                </span>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-md my-4">
            <div className="flex items-center justify-between text-[11px] font-semibold text-stone-400 mb-1.5 px-1">
              <span>{pomodoroPhase === 'focus' ? 'Focus Interval' : 'Break Interval'}</span>
              <span>{pomodoroPercent}% Complete</span>
            </div>
            <div className="w-full bg-cream-200 dark:bg-stone-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-cream-border dark:border-stone-700">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  pomodoroPhase === 'focus' ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${pomodoroPercent}%` }}
              />
            </div>
          </div>

          {/* 4-Pomodoro Cycle Progress Tracker */}
          <div className="flex items-center gap-3 my-2 text-xs text-stone-500 dark:text-stone-400">
            <span className="font-semibold uppercase tracking-wider text-[11px]">4-Cycle Goal:</span>
            <div className="flex items-center gap-1.5">
              {[0, 1, 2, 3].map((cycleIdx) => {
                const isCompleted = pomodoroCount % 4 > cycleIdx || (pomodoroCount > 0 && pomodoroCount % 4 === 0);
                return (
                  <span
                    key={cycleIdx}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border transition ${
                      isCompleted
                        ? 'bg-amber-500 border-amber-600 text-white'
                        : 'bg-cream-100 dark:bg-stone-800 border-cream-border dark:border-stone-700 text-stone-400'
                    }`}
                    title={`Pomodoro ${cycleIdx + 1}`}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : cycleIdx + 1}
                  </span>
                );
              })}
            </div>
            <span className="text-[11px] font-medium text-stone-400">
              ({pomodoroCount} completed today)
            </span>
          </div>

          {/* Note input for focus phase */}
          {pomodoroPhase === 'focus' && (
            <div className="w-full max-w-md my-3">
              <input
                id="input-pomodoro-notes"
                type="text"
                placeholder="What single task are you focusing on in this 25m cycle?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-center bg-cream-50 dark:bg-stone-800/80 border border-cream-border dark:border-stone-700 rounded-xl px-4 py-2 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          )}

          {/* Pomodoro Action Controls */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
            {!isActive ? (
              <button
                id="btn-pomodoro-start"
                onClick={handleStart}
                className={`px-8 py-3.5 rounded-2xl text-white font-semibold flex items-center gap-2.5 shadow-xs hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer ${
                  pomodoroPhase === 'focus'
                    ? 'bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                <Play className="w-5 h-5 fill-current" />
                {pomodoroPhase === 'focus'
                  ? pomodoroSecondsLeft < currentPomodoroTotalSec
                    ? 'Resume Focus Session'
                    : 'Start 25m Focus Session'
                  : 'Start Break'}
              </button>
            ) : (
              <button
                id="btn-pomodoro-pause"
                onClick={handlePause}
                className="px-7 py-3 rounded-2xl bg-amber-500/90 hover:bg-amber-500 text-white font-semibold flex items-center gap-2 transition cursor-pointer shadow-xs"
              >
                <Pause className="w-5 h-5 fill-current" />
                Pause
              </button>
            )}

            {/* Skip Button */}
            <button
              id="btn-pomodoro-skip"
              onClick={handleSkipPomodoro}
              className="px-5 py-3 rounded-2xl bg-cream-100 dark:bg-stone-800 hover:bg-cream-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-semibold flex items-center gap-2 border border-cream-border dark:border-stone-700 transition cursor-pointer shadow-xs"
              title={pomodoroPhase === 'focus' ? 'Skip directly to Break' : 'Skip Break & Start Focus'}
            >
              <SkipForward className="w-4 h-4" />
              <span>{pomodoroPhase === 'focus' ? 'Skip to Break' : 'Skip Break'}</span>
            </button>

            {/* Reset Button */}
            <button
              id="btn-pomodoro-reset"
              onClick={handleResetPomodoro}
              className="px-5 py-3 rounded-2xl bg-cream-100 dark:bg-stone-800 hover:bg-cream-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-400 font-semibold flex items-center gap-2 border border-cream-border dark:border-stone-700 transition cursor-pointer shadow-xs"
              title="Reset current countdown"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>

            {/* Finish Early & Log (available during focus) */}
            {pomodoroPhase === 'focus' && pomodoroSecondsLeft < currentPomodoroTotalSec && (
              <button
                id="btn-pomodoro-finish-early"
                onClick={handleEarlyPomodoroFinish}
                className="px-5 py-3 rounded-2xl bg-rose-500/90 hover:bg-rose-500 text-white font-semibold flex items-center gap-2 transition cursor-pointer shadow-xs"
                title="Save partial focus minutes right now"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Finish & Log</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* ------------------------------------------------------------------ */
        /* STANDARD STOPWATCH MODE INTERFACE                                  */
        /* ------------------------------------------------------------------ */
        <div className="mt-6 flex flex-col items-center text-center">
          {/* Subject Selector Pill Bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6 max-w-xl">
            {subjects.map((sub) => {
              const isSelected = sub.id === selectedSubjectId;
              return (
                <button
                  key={sub.id}
                  id={`btn-select-subject-${sub.id}`}
                  onClick={() => !isActive && setSelectedSubjectId(sub.id)}
                  disabled={isActive}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'text-white shadow-xs'
                      : 'bg-cream-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-cream-200 dark:hover:bg-stone-700 border border-cream-border/60 dark:border-stone-700'
                  } ${isActive ? 'opacity-80 cursor-not-allowed' : ''}`}
                  style={isSelected ? { backgroundColor: sub.color } : {}}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: isSelected ? '#ffffff' : sub.color }}
                  />
                  {sub.name}
                </button>
              );
            })}
          </div>

          {/* Big Digital Timer Display */}
          <div className="relative my-2 py-4">
            <div className="font-mono text-6xl sm:text-7xl md:text-8xl font-black text-stone-900 dark:text-stone-100 tracking-tight tabular-nums">
              {formatTimer(secondsElapsed)}
            </div>
            {isActive && (
              <div className="flex items-center justify-center gap-2 mt-2 text-xs font-medium text-teal-600 dark:text-teal-400 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-teal-500" />
                Focus session in progress...
              </div>
            )}
          </div>

          {/* Note Input for active session */}
          <div className="w-full max-w-md my-4">
            <input
              id="input-active-timer-notes"
              type="text"
              placeholder="Add quick topic notes (e.g. Chapter 4 Practice Set)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-center bg-cream-50 dark:bg-stone-800/80 border border-cream-border dark:border-stone-700 rounded-xl px-4 py-2 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 mt-2">
            {!isActive && secondsElapsed === 0 ? (
              <button
                id="btn-timer-start"
                onClick={handleStart}
                className="px-8 py-3.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white font-semibold flex items-center gap-2.5 shadow-xs hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current" />
                Start Focus Session
              </button>
            ) : isActive ? (
              <>
                <button
                  id="btn-timer-pause"
                  onClick={handlePause}
                  className="px-6 py-3 rounded-2xl bg-amber-500/90 hover:bg-amber-500 text-white font-semibold flex items-center gap-2 transition cursor-pointer shadow-xs"
                >
                  <Pause className="w-5 h-5 fill-current" />
                  Pause
                </button>
                <button
                  id="btn-timer-stop"
                  onClick={handleStopAndSave}
                  className="px-6 py-3 rounded-2xl bg-rose-500/90 hover:bg-rose-500 text-white font-semibold flex items-center gap-2 transition cursor-pointer shadow-xs"
                >
                  <Square className="w-5 h-5 fill-current" />
                  Finish & Save
                </button>
              </>
            ) : (
              <>
                <button
                  id="btn-timer-resume"
                  onClick={handleResume}
                  className="px-6 py-3 rounded-2xl bg-teal-600/90 hover:bg-teal-600 text-white font-semibold flex items-center gap-2 transition cursor-pointer shadow-xs"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Resume
                </button>
                <button
                  id="btn-timer-finish"
                  onClick={handleStopAndSave}
                  className="px-6 py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:hover:bg-white dark:text-stone-900 font-semibold flex items-center gap-2 transition cursor-pointer shadow-xs"
                >
                  <Square className="w-5 h-5 fill-current" />
                  Finish & Save
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
