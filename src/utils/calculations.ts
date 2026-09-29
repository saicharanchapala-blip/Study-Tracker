import { StudySession, WeeklySubjectTime, Subject, StreakData } from '../types';

export function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function formatTimeHours(totalMinutes: number): string {
  return (totalMinutes / 60).toFixed(1) + ' hrs';
}

// Get the start of the current week (Monday at 00:00:00)
export function getStartOfWeek(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  // day of week (0 is Sunday, 1 is Monday ... 6 is Saturday)
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Calculate subject time breakdown for a given date range (default current week)
export function calculateWeeklySubjectStats(
  sessions: StudySession[],
  subjects: Subject[],
  weekStartDate: Date = getStartOfWeek()
): {
  weeklyData: WeeklySubjectTime[];
  totalWeekMinutes: number;
  totalWeekSessions: number;
  weeklyGoalMinutes: number;
} {
  const weekStartMs = weekStartDate.getTime();
  const weekEndMs = weekStartMs + 7 * 24 * 60 * 60 * 1000;

  // Filter sessions that occurred within this week window
  const thisWeekSessions = sessions.filter((session) => {
    const sessionTime = new Date(session.startTime).getTime();
    return sessionTime >= weekStartMs && sessionTime <= weekEndMs;
  });

  const totalWeekMinutes = thisWeekSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalWeekSessions = thisWeekSessions.length;

  // Calculate per-subject
  const subjectMap: Record<string, { minutes: number; count: number }> = {};
  
  // Initialize for all known subjects
  subjects.forEach((subj) => {
    subjectMap[subj.id] = { minutes: 0, count: 0 };
  });

  thisWeekSessions.forEach((s) => {
    if (!subjectMap[s.subjectId]) {
      subjectMap[s.subjectId] = { minutes: 0, count: 0 };
    }
    subjectMap[s.subjectId].minutes += s.durationMinutes;
    subjectMap[s.subjectId].count += 1;
  });

  const weeklyData: WeeklySubjectTime[] = subjects.map((subj) => {
    const stat = subjectMap[subj.id] || { minutes: 0, count: 0 };
    const targetMinutes = (subj.targetWeeklyHours || 5) * 60;
    const percentageOfTotal = totalWeekMinutes > 0 ? (stat.minutes / totalWeekMinutes) * 100 : 0;

    return {
      subjectId: subj.id,
      subjectName: subj.name,
      color: subj.color,
      totalMinutes: stat.minutes,
      targetMinutes,
      sessionCount: stat.count,
      percentageOfTotal: Math.round(percentageOfTotal),
    };
  });

  const weeklyGoalMinutes = subjects.reduce((sum, s) => sum + ((s.targetWeeklyHours || 5) * 60), 0);

  return {
    weeklyData,
    totalWeekMinutes,
    totalWeekSessions,
    weeklyGoalMinutes,
  };
}

// Calculate streak updates when a new session is logged
export function updateStreakRecord(
  prevStreak: StreakData,
  sessionDate: Date = new Date()
): StreakData {
  const todayStr = sessionDate.toISOString().split('T')[0];
  const activeDates = new Set(prevStreak.activeDatesThisMonth || []);
  activeDates.add(todayStr);

  if (prevStreak.lastStudyDate === todayStr) {
    return {
      ...prevStreak,
      activeDatesThisMonth: Array.from(activeDates),
    };
  }

  const yesterday = new Date(sessionDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let newCurrent = prevStreak.currentStreak;
  if (prevStreak.lastStudyDate === yesterdayStr) {
    newCurrent += 1;
  } else if (!prevStreak.lastStudyDate) {
    newCurrent = 1;
  } else {
    // missed one or more days
    newCurrent = 1;
  }

  const newLongest = Math.max(prevStreak.longestStreak, newCurrent);

  return {
    ...prevStreak,
    currentStreak: newCurrent,
    longestStreak: newLongest,
    lastStudyDate: todayStr,
    activeDatesThisMonth: Array.from(activeDates),
  };
}

// Calculate total study minutes for a given YYYY-MM-DD date
export function getStudyMinutesForDate(sessions: StudySession[], dateStr: string = new Date().toISOString().split('T')[0]): number {
  return sessions
    .filter((s) => {
      const sessionDate = new Date(s.startTime).toISOString().split('T')[0];
      return sessionDate === dateStr;
    })
    .reduce((sum, s) => sum + s.durationMinutes, 0);
}

// Calculate the percentage of streak for a specific day directly from check-in, todos, and study time
export function calculateDayStreakPercentage(params: {
  checkedIn: boolean;
  isExplicitFullCheckIn?: boolean;
  completedTodos: number;
  totalTodos: number;
  studyMinutes: number;
  dailyTargetMinutes?: number;
}): {
  totalPercentage: number;
  breakdown: {
    checkInPercent: number;
    todosPercent: number;
    studyPercent: number;
  };
} {
  const { checkedIn, isExplicitFullCheckIn, completedTodos, totalTodos, studyMinutes, dailyTargetMinutes = 30 } = params;

  if (isExplicitFullCheckIn) {
    return {
      totalPercentage: 100,
      breakdown: {
        checkInPercent: 40,
        todosPercent: 35,
        studyPercent: 25,
      },
    };
  }

  // 1. Daily Check-In Bonus (40%)
  const checkInPercent = checkedIn ? 40 : 0;

  // 2. To-Do Completion (up to 35%)
  let todosPercent = 0;
  if (totalTodos > 0) {
    todosPercent = Math.round((completedTodos / totalTodos) * 35);
  } else if (checkedIn) {
    // If user has no todos set, don't penalize completely: give partial credit if checked in
    todosPercent = 20;
  }

  // 3. Study Session Time (up to 25%)
  const targetMins = Math.max(15, dailyTargetMinutes);
  const studyRatio = Math.min(1, studyMinutes / targetMins);
  const studyPercent = Math.round(studyRatio * 25);

  const totalPercentage = Math.min(100, Math.max(0, checkInPercent + todosPercent + studyPercent));

  return {
    totalPercentage,
    breakdown: {
      checkInPercent,
      todosPercent,
      studyPercent,
    },
  };
}

export function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    });
  } catch {
    return isoString;
  }
}

export function formatDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}
