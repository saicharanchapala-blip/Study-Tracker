import React, { useState } from 'react';
import {
  GraduationCap,
  Calendar,
  Clock,
  ExternalLink,
  Bell,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Filter,
} from 'lucide-react';
import { DeadlineItem, ClassroomCourse } from '../types';
import { formatDateTime } from '../utils/calculations';
import { GoogleClassroomService } from '../utils/classroom';

interface ClassroomDeadlinesProps {
  deadlines: DeadlineItem[];
  courses: ClassroomCourse[];
  isConnected: boolean;
  currentUser?: import('../types').UserProfile;
  onConnectClassroom: () => void;
  onDisconnectClassroom: () => void;
  onRefreshClassroom: () => Promise<void>;
  onToggleDeadlineDone: (id: string) => void;
  onAddCustomDeadline: (deadline: Partial<DeadlineItem>) => void;
  onSendTestNotification: (deadline: DeadlineItem) => void;
}

export const ClassroomDeadlines: React.FC<ClassroomDeadlinesProps> = ({
  deadlines,
  courses,
  isConnected,
  currentUser,
  onConnectClassroom,
  onDisconnectClassroom,
  onRefreshClassroom,
  onToggleDeadlineDone,
  onAddCustomDeadline,
  onSendTestNotification,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state for custom deadline
  const [newTitle, setNewTitle] = useState('');
  const [newCourseName, setNewCourseName] = useState('Mathematics & Calculus');
  const [newDueDate, setNewDueDate] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
  );
  const [newDueTime, setNewDueTime] = useState('23:59');

  const handleManualRefresh = async () => {
    setIsSyncing(true);
    try {
      await onRefreshClassroom();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCreateDeadline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddCustomDeadline({
      title: newTitle.trim(),
      courseName: newCourseName,
      dueDate: `${newDueDate}T${newDueTime}:00.000Z`,
      dueTime: newDueTime,
      completed: false,
      notifyEnabled: true,
    });

    setNewTitle('');
    setShowAddModal(false);
  };

  const filteredDeadlines = deadlines.filter((d) => {
    if (filter === 'pending') return !d.completed;
    if (filter === 'completed') return !!d.completed;
    return true;
  });

  return (
    <div
      id="classroom-deadlines-card"
      className="bg-cream-card dark:bg-stone-900 border border-cream-border dark:border-stone-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-cream-border/60 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100/60 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
              Google Classroom & Upcoming Deadlines
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            Seamlessly import coursework deadlines and receive push notifications before due dates.
          </p>
          {currentUser && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[11px] text-stone-500 dark:text-stone-400">Account:</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-cream-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-cream-border dark:border-stone-700">
                {currentUser.googleConnected ? (
                  <>
                    <svg className="w-3 h-3" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"/>
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.76-2.1-6.71-4.93H1.26v3.15C3.26 21.36 7.33 24 12 24z"/>
                      <path fill="#FBBC05" d="M5.29 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.99 0 12s.46 3.84 1.26 5.42l4.03-3.15z"/>
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.26 6.58l4.03 3.15c.95-2.83 3.59-4.98 6.71-4.98z"/>
                    </svg>
                    <span>Google Account: <strong className="text-stone-900 dark:text-white">{currentUser.email}</strong></span>
                  </>
                ) : (
                  <span>Student: <strong className="text-stone-900 dark:text-white">{currentUser.name}</strong> ({currentUser.email})</span>
                )}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isConnected ? (
            <>
              <button
                id="btn-refresh-classroom"
                onClick={handleManualRefresh}
                disabled={isSyncing}
                className="px-3 py-2 text-xs font-medium rounded-xl bg-cream-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-cream-200 dark:hover:bg-stone-700 border border-cream-border dark:border-stone-700 flex items-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync Classroom'}
              </button>
              <button
                id="btn-disconnect-classroom"
                onClick={onDisconnectClassroom}
                className="px-3 py-2 text-xs font-medium rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              id="btn-connect-classroom"
              onClick={onConnectClassroom}
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-amber-700 hover:bg-amber-800 text-white flex items-center gap-2 shadow-xs transition cursor-pointer"
            >
              <GraduationCap className="w-4 h-4" />
              Connect Google Classroom
            </button>
          )}

          <button
            id="btn-add-custom-deadline"
            onClick={() => setShowAddModal(true)}
            className="px-3 py-2 text-xs font-medium rounded-xl bg-cream-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-cream-200 dark:hover:bg-stone-700 border border-cream-border dark:border-stone-700 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            + Add Deadline
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 bg-cream-100 dark:bg-stone-800/80 p-1 rounded-xl border border-cream-border dark:border-stone-700/60">
          {(['pending', 'all', 'completed'] as const).map((tab) => (
            <button
              key={tab}
              id={`btn-filter-${tab}`}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1 text-xs font-medium rounded-lg capitalize transition cursor-pointer ${
                filter === tab
                  ? 'bg-cream-card dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs font-semibold'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <span className="text-xs text-stone-400 dark:text-stone-500">
          Showing {filteredDeadlines.length} items
        </span>
      </div>

      {/* Deadline Items List */}
      <div className="space-y-3">
        {filteredDeadlines.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-cream-border dark:border-stone-800 rounded-2xl bg-cream-50/40 dark:bg-transparent">
            <CheckCircle2 className="w-8 h-8 text-amber-600 mx-auto mb-2 opacity-80" />
            <div className="text-sm font-semibold text-stone-700 dark:text-stone-300">
              No pending deadlines!
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              All coursework is up to date, or connect Google Classroom to pull fresh coursework assignments.
            </p>
          </div>
        ) : (
          filteredDeadlines.map((dl) => {
            const isDueSoon =
              !dl.completed &&
              new Date(dl.dueDate).getTime() - Date.now() < 86400000 * 2 &&
              new Date(dl.dueDate).getTime() > Date.now();

            return (
              <div
                key={dl.id}
                id={`deadline-item-${dl.id}`}
                className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  dl.completed
                    ? 'bg-cream-50/50 dark:bg-stone-900/30 border-cream-border/50 dark:border-stone-800/40 opacity-70'
                    : isDueSoon
                    ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/60'
                    : 'bg-cream-card dark:bg-stone-850/60 border-cream-border dark:border-stone-800 hover:border-amber-300 dark:hover:border-stone-700'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <button
                    id={`btn-toggle-done-${dl.id}`}
                    onClick={() => onToggleDeadlineDone(dl.id)}
                    className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition cursor-pointer shrink-0 ${
                      dl.completed
                        ? 'bg-amber-600 border-amber-600 text-white'
                        : 'border-cream-border dark:border-stone-600 hover:border-amber-500 bg-cream-50 dark:bg-stone-800'
                    }`}
                  >
                    {dl.completed && <CheckCircle2 className="w-4 h-4" />}
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-cream-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-cream-border/70 dark:border-stone-700">
                        {dl.courseName}
                      </span>
                      {isDueSoon && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100/80 dark:bg-amber-900/40 text-amber-900 dark:text-amber-300 border border-amber-300/80 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Due Soon
                        </span>
                      )}
                    </div>

                    <h4
                      className={`text-sm font-semibold mt-1 text-stone-900 dark:text-white ${
                        dl.completed ? 'line-through text-stone-400 dark:text-stone-500' : ''
                      }`}
                    >
                      {dl.title}
                    </h4>

                    {dl.description && (
                      <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-1 mt-0.5">
                        {dl.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pl-8 sm:pl-0 shrink-0">
                  <div className="text-right text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDateTime(dl.dueDate)}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Push notification test trigger */}
                    <button
                      id={`btn-notify-${dl.id}`}
                      onClick={() => onSendTestNotification(dl)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-amber-700 hover:bg-cream-100 dark:hover:bg-stone-800 transition cursor-pointer"
                      title="Send instant push notification for this deadline"
                    >
                      <Bell className="w-4 h-4" />
                    </button>

                    {dl.alternateLink && (
                      <a
                        href={dl.alternateLink}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-cream-100 dark:hover:bg-stone-800 transition"
                        title="Open in Google Classroom"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Manual Deadline Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div className="bg-cream-card dark:bg-stone-900 border border-cream-border dark:border-stone-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-4">
              Add Course Deadline / Assignment
            </h3>

            <form onSubmit={handleCreateDeadline} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
                  Assignment Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chapter 6 Problem Set"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-cream-50 dark:bg-stone-800 border border-cream-border dark:border-stone-700 rounded-xl px-3.5 py-2 text-sm text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
                  Course or Subject
                </label>
                <input
                  type="text"
                  placeholder="e.g. CS 204 or Mathematics"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  className="w-full bg-cream-50 dark:bg-stone-800 border border-cream-border dark:border-stone-700 rounded-xl px-3.5 py-2 text-sm text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full bg-cream-50 dark:bg-stone-800 border border-cream-border dark:border-stone-700 rounded-xl px-3.5 py-2 text-sm text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
                    Time
                  </label>
                  <input
                    type="time"
                    value={newDueTime}
                    onChange={(e) => setNewDueTime(e.target.value)}
                    className="w-full bg-cream-50 dark:bg-stone-800 border border-cream-border dark:border-stone-700 rounded-xl px-3.5 py-2 text-sm text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm text-stone-600 dark:text-stone-400 hover:bg-cream-100 dark:hover:bg-stone-800 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white dark:text-stone-900 rounded-xl transition shadow-xs cursor-pointer"
                >
                  Save Deadline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
