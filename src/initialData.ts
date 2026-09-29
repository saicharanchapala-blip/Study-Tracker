import { Subject, StudySession, DeadlineItem, StreakData, ClassroomConfig, TodoItem } from './types';

export const INITIAL_SUBJECTS: Subject[] = [
  { id: 'math', name: 'Mathematics & Calculus', color: '#7c8cf4', targetWeeklyHours: 8 },
  { id: 'cs', name: 'Computer Science & Algorithms', color: '#52b788', targetWeeklyHours: 10 },
  { id: 'physics', name: 'Physics & Thermodynamics', color: '#e9a858', targetWeeklyHours: 6 },
  { id: 'literature', name: 'Literature & Academic Writing', color: '#e2858b', targetWeeklyHours: 4 },
  { id: 'history', name: 'World History & Geopolitics', color: '#9b82db', targetWeeklyHours: 4 },
];

export const INITIAL_SESSIONS: StudySession[] = [
  {
    id: 's-1',
    subjectId: 'cs',
    subjectName: 'Computer Science & Algorithms',
    startTime: new Date(Date.now() - 3600000 * 26).toISOString(),
    endTime: new Date(Date.now() - 3600000 * 24).toISOString(),
    durationMinutes: 120,
    notes: 'Dynamic programming state optimization & graph shortest paths',
    mood: 'focused',
  },
  {
    id: 's-2',
    subjectId: 'math',
    subjectName: 'Mathematics & Calculus',
    startTime: new Date(Date.now() - 3600000 * 18).toISOString(),
    endTime: new Date(Date.now() - 3600000 * 16.5).toISOString(),
    durationMinutes: 90,
    notes: 'Multivariable chain rule and Jacobians practice set',
    mood: 'productive',
  },
  {
    id: 's-3',
    subjectId: 'physics',
    subjectName: 'Physics & Thermodynamics',
    startTime: new Date(Date.now() - 3600000 * 6).toISOString(),
    endTime: new Date(Date.now() - 3600000 * 5).toISOString(),
    durationMinutes: 60,
    notes: 'Carnot cycle efficiency and entropy change derivations',
    mood: 'focused',
  },
  {
    id: 's-4',
    subjectId: 'cs',
    subjectName: 'Computer Science & Algorithms',
    startTime: new Date(Date.now() - 3600000 * 2).toISOString(),
    endTime: new Date(Date.now() - 3600000 * 1.25).toISOString(),
    durationMinutes: 45,
    notes: 'Reviewed Google Classroom assignment specs and code scaffolding',
    mood: 'productive',
  }
];

export const INITIAL_DEADLINES: DeadlineItem[] = [
  {
    id: 'd-1',
    courseId: 'cs-course',
    courseName: 'CS 204: Advanced Data Structures',
    title: 'Assignment 3: Red-Black Tree Implementation',
    description: 'Submit source code with memory benchmarks and unit tests on Classroom.',
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
    dueTime: '23:59',
    maxPoints: 100,
    completed: false,
    notifyEnabled: true,
  },
  {
    id: 'd-2',
    courseId: 'math-course',
    courseName: 'MATH 301: Multivariable Analysis',
    title: 'Problem Set 4: Stokes Theorem & Surface Integrals',
    description: 'Complete problems 1 through 12. Typeset PDF preferred.',
    dueDate: new Date(Date.now() + 86400000 * 4).toISOString(), // 4 days from now
    dueTime: '17:00',
    maxPoints: 50,
    completed: false,
    notifyEnabled: true,
  },
  {
    id: 'd-3',
    courseId: 'phys-course',
    courseName: 'PHYS 150: Engineering Thermodynamics',
    title: 'Laboratory Report: Heat Exchanger Performance',
    description: 'Analyze experimental thermistor data and plot p-V curves.',
    dueDate: new Date(Date.now() + 86400000 * 6).toISOString(), // 6 days from now
    dueTime: '12:00',
    maxPoints: 40,
    completed: false,
    notifyEnabled: true,
  }
];

const todayISO = new Date().toISOString().split('T')[0];
const dayMinus1 = new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0];
const dayMinus2 = new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0];
const dayMinus3 = new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0];
const dayMinus4 = new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0];

export const INITIAL_TODOS: TodoItem[] = [
  {
    id: 'todo-1',
    text: 'Implement Red-Black tree insertion & balancing algorithms',
    completed: true,
    subjectId: 'cs',
    subjectName: 'Computer Science & Algorithms',
    priority: 'high',
    dueDate: todayISO,
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    completedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'todo-2',
    text: 'Solve Multivariable Calculus Stokes theorem practice problems',
    completed: false,
    subjectId: 'math',
    subjectName: 'Mathematics & Calculus',
    priority: 'high',
    dueDate: todayISO,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'todo-3',
    text: 'Review Carnot cycle and entropy derivations from lecture',
    completed: true,
    subjectId: 'physics',
    subjectName: 'Physics & Thermodynamics',
    priority: 'medium',
    dueDate: todayISO,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    completedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: 'todo-4',
    text: 'Organize research references for geopolitics seminar draft',
    completed: false,
    subjectId: 'history',
    subjectName: 'World History & Geopolitics',
    priority: 'low',
    dueDate: todayISO,
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
];

export const INITIAL_STREAK: StreakData = {
  currentStreak: 5,
  longestStreak: 14,
  lastStudyDate: todayISO,
  activeDatesThisMonth: [dayMinus4, dayMinus3, dayMinus2, dayMinus1, todayISO],
  dailyPercentages: {
    [dayMinus4]: 100,
    [dayMinus3]: 85,
    [dayMinus2]: 100,
    [dayMinus1]: 90,
    [todayISO]: 75,
  },
  dailyCheckIns: {
    [todayISO]: {
      date: todayISO,
      percentage: 75,
      checkedIn: true,
      checkInTimestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
      mood: 'focused',
      reflection: 'Staying on track with Red-Black tree benchmarks and multivariable problem sets.',
      dailyGoalNote: 'Finish 2 more core problem sets before evening.',
      completedTodosCount: 2,
      totalTodosCount: 4,
      studyMinutes: 105,
    },
  },
};

export const INITIAL_CLASSROOM_CONFIG: ClassroomConfig = {
  connected: false,
  userEmail: 'saicharan.chapala@gmail.com',
};

// Initial User Personas demonstrating data isolation per person
export const DEMO_USERS: import('./types').UserProfile[] = [
  {
    id: 'google_saicharan',
    name: 'Sai Charan',
    email: 'saicharan.chapala@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    authProvider: 'google',
    googleConnected: true,
    googleAccountId: 'g_1029384756',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'student_elena',
    name: 'Elena Rostova',
    email: 'elena.rostova@campus.edu',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    authProvider: 'email',
    googleConnected: false,
    createdAt: '2026-09-10T10:00:00.000Z',
  },
];

// Elena's isolated medical subjects
export const ELENA_SUBJECTS: Subject[] = [
  { id: 'biochem', name: 'Organic Chemistry & Biochemistry', color: '#e2858b', targetWeeklyHours: 12 },
  { id: 'cellbio', name: 'Cellular & Molecular Biology', color: '#52b788', targetWeeklyHours: 10 },
  { id: 'anatomy', name: 'Human Anatomy & Physiology', color: '#7c8cf4', targetWeeklyHours: 8 },
  { id: 'ethics', name: 'Bioethics & Clinical Practice', color: '#9b82db', targetWeeklyHours: 4 },
];

export const ELENA_SESSIONS: StudySession[] = [
  {
    id: 'elena-s-1',
    subjectId: 'biochem',
    subjectName: 'Organic Chemistry & Biochemistry',
    startTime: new Date(Date.now() - 3600000 * 20).toISOString(),
    endTime: new Date(Date.now() - 3600000 * 17).toISOString(),
    durationMinutes: 180,
    notes: 'Electrophilic addition mechanisms and reaction coordinate diagrams',
    mood: 'focused',
  },
  {
    id: 'elena-s-2',
    subjectId: 'cellbio',
    subjectName: 'Cellular & Molecular Biology',
    startTime: new Date(Date.now() - 3600000 * 10).toISOString(),
    endTime: new Date(Date.now() - 3600000 * 8).toISOString(),
    durationMinutes: 120,
    notes: 'Signal transduction cascades and G-protein coupled receptors',
    mood: 'productive',
  },
  {
    id: 'elena-s-3',
    subjectId: 'anatomy',
    subjectName: 'Human Anatomy & Physiology',
    startTime: new Date(Date.now() - 3600000 * 3).toISOString(),
    endTime: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    durationMinutes: 90,
    notes: 'Cranial nerves pathways and peripheral innervations',
    mood: 'focused',
  },
];

export const ELENA_DEADLINES: DeadlineItem[] = [
  {
    id: 'elena-d-1',
    courseId: 'chem-301',
    courseName: 'CHEM 301: Organic Synthesis',
    title: 'Lab Report: Grignard Reaction Yield & NMR Spectrometry',
    dueDate: new Date(Date.now() + 86400000 * 1.5).toISOString(),
    dueTime: '18:00',
    maxPoints: 100,
    completed: false,
    notifyEnabled: true,
  },
  {
    id: 'elena-d-2',
    courseId: 'bio-220',
    courseName: 'BIO 220: Cellular Physiology',
    title: 'Midterm 2 Revision Problem Set: Membrane Potentials',
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
    dueTime: '23:59',
    maxPoints: 75,
    completed: false,
    notifyEnabled: true,
  },
];

export const ELENA_TODOS: TodoItem[] = [
  {
    id: 'elena-todo-1',
    text: 'Memorize cranial nerves pathways and clinical test reflexes',
    completed: true,
    subjectId: 'anatomy',
    subjectName: 'Human Anatomy & Physiology',
    priority: 'high',
    dueDate: todayISO,
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    completedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'elena-todo-2',
    text: 'Complete Grignard reaction yield calculations & NMR analysis',
    completed: true,
    subjectId: 'biochem',
    subjectName: 'Organic Chemistry & Biochemistry',
    priority: 'high',
    dueDate: todayISO,
    createdAt: new Date(Date.now() - 3600000 * 7).toISOString(),
    completedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'elena-todo-3',
    text: 'Read Bioethics clinical practice case studies: informed consent',
    completed: false,
    subjectId: 'ethics',
    subjectName: 'Bioethics & Clinical Practice',
    priority: 'medium',
    dueDate: todayISO,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
];

export const ELENA_STREAK: StreakData = {
  currentStreak: 8,
  longestStreak: 21,
  lastStudyDate: todayISO,
  activeDatesThisMonth: [
    new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0],
    new Date(Date.now() - 86400000 * 6).toISOString().split('T')[0],
    new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
    new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0],
    new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
    new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    dayMinus1,
    todayISO,
  ],
  dailyPercentages: {
    [new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0]]: 100,
    [new Date(Date.now() - 86400000 * 6).toISOString().split('T')[0]]: 100,
    [new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0]]: 85,
    [new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0]]: 100,
    [new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0]]: 90,
    [new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0]]: 100,
    [dayMinus1]: 100,
    [todayISO]: 85,
  },
  dailyCheckIns: {
    [todayISO]: {
      date: todayISO,
      percentage: 85,
      checkedIn: true,
      checkInTimestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      mood: 'energized',
      reflection: 'Strong lab progress today. On track for anatomy clinicals!',
      dailyGoalNote: 'Review membrane potentials problem set before sleep.',
      completedTodosCount: 2,
      totalTodosCount: 3,
      studyMinutes: 180,
    },
  },
};
