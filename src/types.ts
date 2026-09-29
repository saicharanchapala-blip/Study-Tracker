export interface Subject {
  id: string;
  name: string;
  color: string;
  targetWeeklyHours?: number;
  iconName?: string;
}

export interface StudySession {
  id: string;
  subjectId: string;
  subjectName: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  durationMinutes: number;
  notes?: string;
  classroomCourseId?: string;
  classroomAssignmentId?: string;
  mood?: 'focused' | 'productive' | 'tired' | 'distracted';
  tags?: string[];
}

export interface ClassroomCourse {
  id: string;
  name: string;
  section?: string;
  alternateLink?: string;
}

export interface DeadlineItem {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  description?: string;
  dueDate: string; // ISO string or formatted date
  dueTime?: string;
  alternateLink?: string;
  maxPoints?: number;
  completed?: boolean;
  notifyEnabled?: boolean;
}

export interface WeeklySubjectTime {
  subjectId: string;
  subjectName: string;
  color: string;
  totalMinutes: number;
  targetMinutes: number;
  sessionCount: number;
  percentageOfTotal: number;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  subjectId?: string;
  subjectName?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string; // YYYY-MM-DD
  createdAt: string;
  completedAt?: string;
}

export interface DailyStreakCheckIn {
  date: string; // YYYY-MM-DD
  percentage: number; // 0 to 100
  checkedIn: boolean;
  checkInTimestamp?: string;
  mood?: 'focused' | 'productive' | 'tired' | 'distracted' | 'energized';
  reflection?: string;
  dailyGoalNote?: string;
  completedTodosCount: number;
  totalTodosCount: number;
  studyMinutes: number;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string; // YYYY-MM-DD
  activeDatesThisMonth: string[]; // List of YYYY-MM-DD
  dailyPercentages?: Record<string, number>; // date (YYYY-MM-DD) -> percentage (0-100)
  dailyCheckIns?: Record<string, DailyStreakCheckIn>;
}

export interface SyncStatus {
  lastSyncedAt: string | null;
  pendingOfflineCount: number;
  isOnline: boolean;
  cloudSyncEnabled: boolean;
}

export interface ClassroomConfig {
  connected: boolean;
  userEmail?: string;
  lastSyncTime?: string;
}

export interface NotificationSettings {
  enabled: boolean;
  permission: NotificationPermission;
  deadlineAlertLeadHours: number; // e.g. 24 or 4 hours before
  dailyStreakReminder: boolean;
  dailyReminderTime: string; // "20:00"
}

export interface UserPreferences {
  defaultFocusDuration: number; // e.g. 25, 45, 60
  defaultBreakDuration: number; // e.g. 5, 10, 15
  soundEnabled: boolean;
  confettiEnabled: boolean;
  autoStartBreaks: boolean;
  defaultMood: 'focused' | 'productive' | 'tired' | 'distracted';
  weeklyGoalHours: number;
  deadlineAlertLeadHours: number;
  dailyStreakReminder: boolean;
  dailyReminderTime: string; // "20:00"
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  authProvider: 'google' | 'email';
  googleConnected: boolean;
  googleAccountId?: string;
  createdAt: string;
  preferences?: UserPreferences;
}
