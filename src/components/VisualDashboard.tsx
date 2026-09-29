import React from 'react';
import { BarChart3, Clock, Target, Calendar, TrendingUp, Sparkles, CheckCircle2 } from 'lucide-react';
import { WeeklySubjectTime, StudySession, Subject } from '../types';
import { formatMinutes, formatTimeHours } from '../utils/calculations';

interface VisualDashboardProps {
  weeklyData: WeeklySubjectTime[];
  totalWeekMinutes: number;
  totalWeekSessions: number;
  weeklyGoalMinutes: number;
  recentSessions: StudySession[];
  onOpenSubjectModal?: () => void;
}

export const VisualDashboard: React.FC<VisualDashboardProps> = ({
  weeklyData,
  totalWeekMinutes,
  totalWeekSessions,
  weeklyGoalMinutes,
  recentSessions,
  onOpenSubjectModal,
}) => {
  const goalPercent = Math.min(100, Math.round((totalWeekMinutes / (weeklyGoalMinutes || 1)) * 100));

  // Max minutes among subjects to scale relative bar charts
  const maxSubjectMinutes = Math.max(...weeklyData.map((d) => d.totalMinutes), 60);

  return (
    <div id="visual-progress-dashboard" className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Time this week */}
        <div
          id="card-total-week-time"
          className="bg-cream-card dark:bg-stone-900 border border-cream-border dark:border-stone-800 rounded-2xl p-5 shadow-xs"
        >
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Weekly Study Time</span>
            <div className="p-2 rounded-xl bg-cream-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-cream-border dark:border-indigo-900/40">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
            {formatMinutes(totalWeekMinutes)}
          </div>
          <div className="mt-2 flex items-center text-xs text-stone-500 dark:text-stone-400">
            <span className="text-teal-600 dark:text-teal-400 font-medium mr-1.5 flex items-center">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
              {totalWeekSessions} sessions
            </span>
            logged this week
          </div>
        </div>

        {/* Weekly Goal Progress */}
        <div
          id="card-goal-progress"
          className="bg-cream-card dark:bg-stone-900 border border-cream-border dark:border-stone-800 rounded-2xl p-5 shadow-xs"
        >
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Weekly Target</span>
            <div className="p-2 rounded-xl bg-cream-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 border border-cream-border dark:border-teal-900/40">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
              {goalPercent}%
            </div>
            <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              of {Math.round(weeklyGoalMinutes / 60)}h target
            </span>
          </div>
          <div className="w-full bg-cream-200 dark:bg-stone-800 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-teal-400 dark:bg-teal-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${goalPercent}%` }}
            />
          </div>
        </div>

        {/* Top Focus Subject */}
        {(() => {
          const sorted = [...weeklyData].sort((a, b) => b.totalMinutes - a.totalMinutes);
          const topSubject = sorted[0]?.totalMinutes > 0 ? sorted[0] : null;

          return (
            <div
              id="card-top-subject"
              className="bg-cream-card dark:bg-stone-900 border border-cream-border dark:border-stone-800 rounded-2xl p-5 shadow-xs"
            >
              <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Top Subject</span>
                <div className="p-2 rounded-xl bg-cream-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border border-cream-border dark:border-purple-900/40">
                  <BarChart3 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-lg font-bold text-stone-900 dark:text-stone-100 truncate">
                {topSubject ? topSubject.subjectName : 'No sessions yet'}
              </div>
              <div className="mt-2 text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                {topSubject && (
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: topSubject.color }}
                  />
                )}
                {topSubject ? `${formatMinutes(topSubject.totalMinutes)} (${topSubject.percentageOfTotal}%)` : 'Start studying to rank'}
              </div>
            </div>
          );
        })()}

        {/* Consistency / Session Frequency */}
        <div
          id="card-daily-average"
          className="bg-cream-card dark:bg-stone-900 border border-cream-border dark:border-stone-800 rounded-2xl p-5 shadow-xs"
        >
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Daily Average</span>
            <div className="p-2 rounded-xl bg-cream-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-cream-border dark:border-amber-900/40">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
            {formatMinutes(Math.round(totalWeekMinutes / 7))}
          </div>
          <div className="mt-2 text-xs text-stone-500 dark:text-stone-400">
            Paced across standard 7-day study cycle
          </div>
        </div>
      </div>

      {/* Main Subject Time Visual Chart */}
      <div
        id="card-subject-breakdown-chart"
        className="bg-cream-card dark:bg-stone-900 border border-cream-border dark:border-stone-800 rounded-3xl p-6 sm:p-8 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              Total Time Spent Per Subject (This Week)
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Live breakdown of accumulated study hours against your weekly subject goals.
            </p>
          </div>
          {onOpenSubjectModal && (
            <button
              id="btn-manage-subjects"
              onClick={onOpenSubjectModal}
              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Configure Subject Targets
            </button>
          )}
        </div>

        {/* Visual Multi-Bar Breakdown */}
        <div className="space-y-4">
          {weeklyData.map((subj) => {
            const barWidthPercent = maxSubjectMinutes > 0 ? (subj.totalMinutes / maxSubjectMinutes) * 100 : 0;
            const targetHours = subj.targetMinutes / 60;
            const actualHours = (subj.totalMinutes / 60).toFixed(1);
            const targetPercent = Math.min(100, Math.round((subj.totalMinutes / (subj.targetMinutes || 1)) * 100));

            return (
              <div
                key={subj.subjectId}
                id={`subject-row-${subj.subjectId}`}
                className="group p-3 rounded-2xl hover:bg-cream-100/80 dark:hover:bg-stone-800/50 transition border border-transparent hover:border-cream-border dark:hover:border-stone-800"
              >
                <div className="flex items-center justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3 h-3 rounded-md shrink-0 shadow-xs"
                      style={{ backgroundColor: subj.color }}
                    />
                    <span className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">
                      {subj.subjectName}
                    </span>
                    <span className="text-xs text-stone-400 dark:text-stone-500 shrink-0">
                      • {subj.sessionCount} {subj.sessionCount === 1 ? 'session' : 'sessions'}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      {formatMinutes(subj.totalMinutes)}
                    </span>
                    <span className="text-xs text-stone-400 dark:text-stone-500 ml-1.5 font-medium">
                      / {targetHours}h goal
                    </span>
                  </div>
                </div>

                {/* Progress Bar Container */}
                <div className="w-full bg-cream-200 dark:bg-stone-800 h-3 rounded-full overflow-hidden flex items-center p-0.5">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${Math.max(barWidthPercent, 2)}%`,
                      backgroundColor: subj.color,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-stone-400 dark:text-stone-500 mt-1.5 px-0.5">
                  <span>{subj.percentageOfTotal}% of total weekly study time</span>
                  <span className={targetPercent >= 100 ? 'text-teal-600 dark:text-teal-400 font-medium' : ''}>
                    {targetPercent >= 100 ? '✓ Goal Achieved' : `${targetPercent}% of subject goal`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Stacked Proportional Distribution Bar */}
        {totalWeekMinutes > 0 && (
          <div className="mt-8 pt-6 border-t border-cream-border dark:border-stone-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 block mb-2">
              Time Distribution
            </span>
            <div className="h-4 w-full rounded-xl overflow-hidden flex bg-cream-200 dark:bg-stone-800">
              {weeklyData
                .filter((d) => d.totalMinutes > 0)
                .map((d) => (
                  <div
                    key={`stacked-${d.subjectId}`}
                    style={{
                      width: `${d.percentageOfTotal}%`,
                      backgroundColor: d.color,
                    }}
                    title={`${d.subjectName}: ${formatMinutes(d.totalMinutes)} (${d.percentageOfTotal}%)`}
                    className="h-full hover:opacity-90 transition-opacity"
                  />
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
