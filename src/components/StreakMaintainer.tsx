import React, { useState } from 'react';
import { Flame, Trophy, Award, Calendar, Check, Zap, Info } from 'lucide-react';
import confetti from 'canvas-confetti';
import { StreakData } from '../types';

interface StreakMaintainerProps {
  streak: StreakData;
  onManualCheckIn?: () => void;
  todayPercentage?: number;
  onDailyCheckInClick?: () => void;
}

export const StreakMaintainer: React.FC<StreakMaintainerProps> = ({
  streak,
  onManualCheckIn,
  todayPercentage,
  onDailyCheckInClick,
}) => {
  const [checkedToday, setCheckedToday] = useState(false);
  const todayStr = new Date().toISOString().split('T')[0];
  const studiedToday = streak.lastStudyDate === todayStr || checkedToday || (todayPercentage !== undefined && todayPercentage >= 50);

  const handleCelebrateStreak = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#f59e0b', '#ec4899', '#6366f1', '#10b981'],
    });
  };

  // Build the last 7 days visual streak circles
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const isToday = i === 0;
    const isCompleted = streak.activeDatesThisMonth?.includes(dateStr) || (isToday && studiedToday);
    const dayLabel = d.toLocaleDateString(undefined, { weekday: 'narrow' });
    const percent = isToday
      ? todayPercentage ?? streak.dailyPercentages?.[dateStr] ?? (isCompleted ? 100 : 0)
      : streak.dailyPercentages?.[dateStr] ?? (isCompleted ? 100 : 0);

    days.push({ dateStr, isToday, isCompleted, dayLabel, percent });
  }

  return (
    <div
      id="streak-maintainer-card"
      className="bg-cream-card dark:bg-stone-900 border border-cream-border dark:border-stone-800 rounded-3xl p-6 sm:p-7 shadow-xs transition"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            onClick={handleCelebrateStreak}
            className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-white flex items-center justify-center shadow-xs cursor-pointer hover:scale-105 active:scale-95 transition-transform"
            title="Click to celebrate streak!"
          >
            <Flame className="w-8 h-8 fill-current" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white tracking-tight">
                {streak.currentStreak} Day{streak.currentStreak === 1 ? '' : 's'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100/70 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800/40">
                Active Streak
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              {studiedToday
                ? '🔥 You extended your streak today! Keep the momentum alive.'
                : 'Study for at least 15 minutes today to preserve your streak!'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:border-l sm:border-cream-border sm:dark:border-stone-800 sm:pl-6">
          <div className="text-left sm:text-right">
            <div className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
              Today's Streak
            </div>
            <div className="text-lg font-black text-stone-900 dark:text-white flex items-center sm:justify-end gap-1.5">
              <span className={todayPercentage && todayPercentage >= 80 ? 'text-teal-600 dark:text-teal-400' : 'text-amber-600 dark:text-amber-400'}>
                {todayPercentage ?? 0}%
              </span>
            </div>
          </div>

          <div className="text-left sm:text-right border-l border-cream-border dark:border-stone-800 pl-3">
            <div className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
              Personal Best
            </div>
            <div className="text-lg font-bold text-stone-900 dark:text-white flex items-center sm:justify-end gap-1.5">
              <Trophy className="w-4 h-4 text-amber-500" />
              {streak.longestStreak} Days
            </div>
          </div>

          {onDailyCheckInClick && (
            <button
              type="button"
              id="btn-streak-quick-checkin"
              onClick={onDailyCheckInClick}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Check In</span>
            </button>
          )}
        </div>
      </div>

      {/* 7-Day Visual Consistency Row with Daily Percentages */}
      <div className="mt-6 pt-5 border-t border-cream-border/60 dark:border-stone-800/80">
        <div className="flex items-center justify-between gap-1 sm:gap-2">
          {days.map((day) => (
            <div key={day.dateStr} className="flex flex-col items-center gap-1.5 flex-1">
              <span className="text-[11px] font-semibold text-stone-400 dark:text-stone-500">
                {day.dayLabel}
              </span>
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex flex-col items-center justify-center transition-all ${
                  day.isCompleted || (day.percent && day.percent >= 80)
                    ? 'bg-gradient-to-tr from-amber-500 to-amber-400 text-white shadow-xs'
                    : day.isToday
                    ? 'border-2 border-dashed border-amber-300 bg-amber-50/70 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300'
                    : 'bg-cream-100 dark:bg-stone-800 text-stone-400 dark:text-stone-600 border border-cream-border/60 dark:border-transparent'
                }`}
                title={`${day.dateStr}: ${day.percent}% Streak`}
              >
                {day.isCompleted || (day.percent && day.percent >= 80) ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : day.isToday ? (
                  <Zap className="w-3.5 h-3.5 animate-pulse" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-cream-300 dark:bg-stone-700" />
                )}
              </div>
              <span className={`text-[10px] font-bold px-1 rounded-sm ${
                day.percent >= 80
                  ? 'text-teal-600 dark:text-teal-400'
                  : day.percent >= 40
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-stone-400'
              }`}>
                {day.percent}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
