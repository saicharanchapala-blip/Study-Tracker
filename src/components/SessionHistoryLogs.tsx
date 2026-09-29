import React, { useState, useMemo } from 'react';
import {
  Clock,
  Trash2,
  Filter,
  Search,
  ArrowUpDown,
  BookOpen,
  Calendar,
  X,
  Sparkles,
  Smile,
  Tag,
  Flame,
} from 'lucide-react';
import { StudySession, Subject } from '../types';
import { formatDateTime, formatMinutes } from '../utils/calculations';

interface SessionHistoryLogsProps {
  sessions: StudySession[];
  subjects: Subject[];
  onDeleteSession: (sessionId: string) => void;
}

export const SessionHistoryLogs: React.FC<SessionHistoryLogsProps> = ({
  sessions,
  subjects,
  onDeleteSession,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'longest' | 'shortest'>('newest');

  // Calculate session count per subject for the filter badges
  const subjectCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    sessions.forEach((s) => {
      counts[s.subjectId] = (counts[s.subjectId] || 0) + 1;
    });
    return counts;
  }, [sessions]);

  // Filter and sort sessions
  const filteredSessions = useMemo(() => {
    return sessions
      .filter((session) => {
        // Subject filter
        if (selectedSubjectId !== 'all' && session.subjectId !== selectedSubjectId) {
          return false;
        }

        // Search query filter (matches subject name, notes, or tags)
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const matchesName = session.subjectName.toLowerCase().includes(query);
          const matchesNotes = session.notes ? session.notes.toLowerCase().includes(query) : false;
          const matchesTags = session.tags ? session.tags.some((t) => t.toLowerCase().includes(query)) : false;
          return matchesName || matchesNotes || matchesTags;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
        }
        if (sortBy === 'longest') {
          return b.durationMinutes - a.durationMinutes;
        }
        if (sortBy === 'shortest') {
          return a.durationMinutes - b.durationMinutes;
        }
        return 0;
      });
  }, [sessions, selectedSubjectId, searchQuery, sortBy]);

  // Total minutes for filtered sessions
  const filteredTotalMinutes = useMemo(() => {
    return filteredSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  }, [filteredSessions]);

  const activeSubject = subjects.find((s) => s.id === selectedSubjectId);

  return (
    <div
      id="session-history-card"
      className="bg-cream-card dark:bg-stone-900 border border-cream-border dark:border-stone-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6"
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-cream-border/70 dark:border-stone-800">
        <div>
          <h3 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            Study Session Log History
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Browse, filter by subject, and manage your completed focus intervals.
          </p>
        </div>

        {/* Global Summary Badge */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-cream-100 dark:bg-stone-800 border border-cream-border dark:border-stone-700/80 text-xs font-semibold text-stone-700 dark:text-stone-300">
            <span className="font-bold text-stone-900 dark:text-white">{filteredSessions.length}</span>
            {selectedSubjectId !== 'all' || searchQuery ? ` of ${sessions.length}` : ''} Sessions
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-300/40 dark:border-amber-700/40 text-xs font-semibold text-amber-800 dark:text-amber-300">
            Total: {formatMinutes(filteredTotalMinutes)}
          </div>
        </div>
      </div>

      {/* FILTER COMPONENT SECTION */}
      <div
        id="session-history-filter-bar"
        className="bg-cream-50 dark:bg-stone-850/60 p-4 sm:p-5 rounded-2xl border border-cream-border dark:border-stone-800 space-y-4"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Label & Active State */}
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
            <Filter className="w-3.5 h-3.5 text-amber-600" />
            <span>Filter By Subject</span>
            {selectedSubjectId !== 'all' && (
              <span className="px-2 py-0.5 rounded-md bg-cream-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200 font-semibold normal-case text-[11px]">
                {activeSubject?.name}
              </span>
            )}
          </div>

          {/* Quick controls: Search & Sort */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 sm:flex-none">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="input-filter-sessions-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topic or notes..."
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-cream-card dark:bg-stone-800 border border-cream-border dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 bg-cream-card dark:bg-stone-800 border border-cream-border dark:border-stone-700 rounded-xl px-2.5 py-1 text-xs">
              <ArrowUpDown className="w-3 h-3 text-stone-400" />
              <select
                id="select-sort-sessions"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-stone-700 dark:text-stone-300 font-medium focus:outline-none cursor-pointer pr-1"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="longest">Longest Duration</option>
                <option value="shortest">Shortest Duration</option>
              </select>
            </div>
          </div>
        </div>

        {/* Subject Filter Pills Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/* 'All Subjects' Pill */}
          <button
            id="filter-subject-all"
            onClick={() => setSelectedSubjectId('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              selectedSubjectId === 'all'
                ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs'
                : 'bg-cream-card dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-cream-200 dark:hover:bg-stone-700 border border-cream-border dark:border-stone-700'
            }`}
          >
            <span>All Subjects</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                selectedSubjectId === 'all'
                  ? 'bg-stone-700 dark:bg-stone-300 text-stone-100 dark:text-stone-900'
                  : 'bg-cream-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
              }`}
            >
              {sessions.length}
            </span>
          </button>

          {/* Individual Subject Pills */}
          {subjects.map((sub) => {
            const isSelected = selectedSubjectId === sub.id;
            const count = subjectCounts[sub.id] || 0;
            return (
              <button
                key={sub.id}
                id={`filter-subject-${sub.id}`}
                onClick={() => setSelectedSubjectId(sub.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer border ${
                  isSelected
                    ? 'text-white shadow-xs'
                    : 'bg-cream-card dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-cream-200 dark:hover:bg-stone-700 border-cream-border dark:border-stone-700'
                }`}
                style={
                  isSelected
                    ? { backgroundColor: sub.color, borderColor: sub.color }
                    : {}
                }
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: isSelected ? '#ffffff' : sub.color }}
                />
                <span className="truncate max-w-[140px]">{sub.name}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isSelected
                      ? 'bg-black/20 text-white'
                      : 'bg-cream-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}

          {/* Reset Filter Button if active */}
          {(selectedSubjectId !== 'all' || searchQuery) && (
            <button
              id="btn-clear-session-filters"
              onClick={() => {
                setSelectedSubjectId('all');
                setSearchQuery('');
              }}
              className="ml-auto text-xs text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-cream-200 dark:hover:bg-stone-800 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* SESSIONS LIST */}
      {filteredSessions.length === 0 ? (
        <div
          id="session-history-empty-state"
          className="text-center py-12 px-4 rounded-2xl bg-cream-50 dark:bg-stone-850/40 border border-cream-border/60 dark:border-stone-800"
        >
          <div className="w-12 h-12 mx-auto rounded-2xl bg-cream-200 dark:bg-stone-800 text-stone-500 flex items-center justify-center mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-stone-800 dark:text-stone-200">
            {selectedSubjectId !== 'all'
              ? `No sessions recorded for "${activeSubject?.name || 'this subject'}"`
              : searchQuery
              ? `No sessions found matching "${searchQuery}"`
              : 'No study sessions recorded yet'}
          </h4>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto mt-1">
            {selectedSubjectId !== 'all' || searchQuery
              ? 'Try selecting a different subject or reset your search query.'
              : 'Start a Pomodoro or stopwatch timer to begin logging your focus sessions.'}
          </p>

          {(selectedSubjectId !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedSubjectId('all');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 text-xs font-semibold rounded-xl bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 transition cursor-pointer"
            >
              View All Subjects
            </button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-cream-border dark:divide-stone-800">
          {filteredSessions.map((s) => {
            const subject = subjects.find((subj) => subj.id === s.subjectId);
            const isPomodoro = s.tags?.includes('pomodoro') || s.notes?.includes('[Pomodoro');

            return (
              <div
                key={s.id}
                id={`session-log-item-${s.id}`}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-cream-50/60 dark:hover:bg-stone-850/30 px-3 -mx-3 rounded-2xl transition"
              >
                <div className="flex items-start gap-3.5">
                  {/* Subject Color Pill / Icon */}
                  <div
                    className="p-2.5 rounded-2xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      backgroundColor: `${subject?.color || '#888'}18`,
                      color: subject?.color || '#888',
                    }}
                  >
                    {isPomodoro ? (
                      <span className="text-sm">🍅</span>
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-xs font-bold px-2.5 py-0.5 rounded-full border"
                        style={{
                          backgroundColor: `${subject?.color || '#888'}15`,
                          borderColor: `${subject?.color || '#888'}35`,
                          color: subject?.color || '#888',
                        }}
                      >
                        {s.subjectName}
                      </span>

                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cream-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-cream-border dark:border-stone-700">
                        {formatMinutes(s.durationMinutes)}
                      </span>

                      {isPomodoro && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-300/40 flex items-center gap-1">
                          <Flame className="w-3 h-3 text-amber-500" />
                          Pomodoro
                        </span>
                      )}

                      {s.mood && (
                        <span className="text-[11px] capitalize text-stone-500 dark:text-stone-400 bg-cream-100 dark:bg-stone-800 px-2 py-0.5 rounded-full border border-cream-border/60 dark:border-stone-750">
                          Mood: {s.mood}
                        </span>
                      )}
                    </div>

                    {s.notes && (
                      <p className="text-xs text-stone-700 dark:text-stone-300 mt-1 font-medium">
                        {s.notes}
                      </p>
                    )}

                    <div className="text-[11px] text-stone-400 dark:text-stone-500 flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-stone-400" />
                        Started: {formatDateTime(s.startTime)}
                      </span>
                      <span>•</span>
                      <span>Finished: {formatDateTime(s.endTime)}</span>
                    </div>
                  </div>
                </div>

                {/* Delete action */}
                <button
                  id={`btn-delete-session-${s.id}`}
                  onClick={() => onDeleteSession(s.id)}
                  className="self-end sm:self-center p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                  title="Delete session record"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
