import React, { useState, useRef } from 'react';
import {
  X,
  User,
  Settings,
  Bell,
  Clock,
  Target,
  Cloud,
  Download,
  Upload,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  Sparkles,
  ShieldCheck,
  LogOut,
  Users,
  Sun,
  Moon,
  Save,
  Check,
  RefreshCw,
  Sliders,
  Calendar,
  Camera,
  UploadCloud,
  Image as ImageIcon,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { UserProfile, UserPreferences, Subject, StudySession, DeadlineItem, StreakData } from '../types';
import { processAvatarImage } from '../utils/imageHelper';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUpdateUser: (updatedUser: UserProfile) => void;
  allUsers: UserProfile[];
  onSwitchUser: (user: UserProfile) => void;
  onLogout: () => void;
  onConnectGoogle: () => void;
  onDisconnectGoogle: () => void;
  // Account study data handles
  subjects: Subject[];
  onUpdateSubjects: (subjects: Subject[]) => void;
  sessions: StudySession[];
  onUpdateSessions: (sessions: StudySession[]) => void;
  deadlines: DeadlineItem[];
  streak: StreakData;
  onResetAccountData: () => void;
  // Appearance & Cloud
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  userId: string;
  onUpdateUserId: (newId: string) => void;
  onTriggerSync: () => void;
  onRequestPushNotifications: () => void;
}

const AVATAR_PRESETS = [
  { id: '1', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80', label: 'Male Profile' },
  { id: '2', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80', label: 'Female Profile' },
  { id: '3', url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80', label: 'Student Avatar' },
  { id: '4', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80', label: 'Campus Scholar' },
  { id: '5', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80', label: 'Researcher' },
  { id: '6', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80', label: 'Graduate' },
];

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  allUsers,
  onSwitchUser,
  onLogout,
  onConnectGoogle,
  onDisconnectGoogle,
  subjects,
  onUpdateSubjects,
  sessions,
  onUpdateSessions,
  deadlines,
  streak,
  onResetAccountData,
  isDarkMode,
  onToggleDarkMode,
  userId,
  onUpdateUserId,
  onTriggerSync,
  onRequestPushNotifications,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'study' | 'goals' | 'notifications' | 'data'>('profile');

  // Form states for profile
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [avatar, setAvatar] = useState(currentUser.avatar || AVATAR_PRESETS[0].url);

  // Form states for user preferences
  const [focusDuration, setFocusDuration] = useState(currentUser.preferences?.defaultFocusDuration || 25);
  const [breakDuration, setBreakDuration] = useState(currentUser.preferences?.defaultBreakDuration || 5);
  const [soundEnabled, setSoundEnabled] = useState(currentUser.preferences?.soundEnabled ?? true);
  const [confettiEnabled, setConfettiEnabled] = useState(currentUser.preferences?.confettiEnabled ?? true);
  const [autoStartBreaks, setAutoStartBreaks] = useState(currentUser.preferences?.autoStartBreaks ?? false);
  const [defaultMood, setDefaultMood] = useState<'focused' | 'productive' | 'tired' | 'distracted'>(
    currentUser.preferences?.defaultMood || 'focused'
  );

  // Weekly Goal & Notification preferences
  const [weeklyGoalHours, setWeeklyGoalHours] = useState(currentUser.preferences?.weeklyGoalHours || 25);
  const [deadlineLeadHours, setDeadlineLeadHours] = useState(currentUser.preferences?.deadlineAlertLeadHours || 24);
  const [dailyStreakReminder, setDailyStreakReminder] = useState(currentUser.preferences?.dailyStreakReminder ?? true);
  const [dailyReminderTime, setDailyReminderTime] = useState(currentUser.preferences?.dailyReminderTime || '20:00');

  // Custom sync ID state
  const [cloudUserId, setCloudUserId] = useState(userId);

  // Avatar upload states
  const [isProcessingAvatar, setIsProcessingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isDraggingOverAvatar, setIsDraggingOverAvatar] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  // Feedback states
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDangerConfirm, setShowDangerConfirm] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDeviceAvatarSelected = async (file: File) => {
    try {
      setAvatarError(null);
      setIsProcessingAvatar(true);
      const processedDataUrl = await processAvatarImage(file, 256);
      setAvatar(processedDataUrl);
    } catch (err: any) {
      setAvatarError(err.message || 'Failed to process selected image');
    } finally {
      setIsProcessingAvatar(false);
    }
  };

  const playTestChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);
    } catch (e) {
      console.error('Audio playback error', e);
    }
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedPreferences: UserPreferences = {
      defaultFocusDuration: Number(focusDuration),
      defaultBreakDuration: Number(breakDuration),
      soundEnabled,
      confettiEnabled,
      autoStartBreaks,
      defaultMood,
      weeklyGoalHours: Number(weeklyGoalHours),
      deadlineAlertLeadHours: Number(deadlineLeadHours),
      dailyStreakReminder,
      dailyReminderTime,
    };

    const updatedUser: UserProfile = {
      ...currentUser,
      name: name.trim() || currentUser.name,
      email: email.trim() || currentUser.email,
      avatar,
      preferences: updatedPreferences,
    };

    onUpdateUser(updatedUser);

    if (cloudUserId !== userId && cloudUserId.trim()) {
      onUpdateUserId(cloudUserId.trim());
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Export this account's study data to JSON
  const handleExportData = () => {
    const exportBundle = {
      exportVersion: '1.0',
      exportedAt: new Date().toISOString(),
      user: currentUser,
      subjects,
      sessions,
      deadlines,
      streak,
    };

    const blob = new Blob([JSON.stringify(exportBundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study_tracker_${currentUser.name.toLowerCase().replace(/\s+/g, '_')}_backup.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import study data from JSON
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.subjects && Array.isArray(parsed.subjects)) {
          onUpdateSubjects(parsed.subjects);
        }
        if (parsed.sessions && Array.isArray(parsed.sessions)) {
          onUpdateSessions(parsed.sessions);
        }
        setImportSuccess(true);
        setImportError(null);
        setTimeout(() => setImportSuccess(false), 3000);
      } catch (err: any) {
        setImportError('Invalid backup file format. Please upload a valid study tracker JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      id="account-settings-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150"
    >
      <div
        id="account-settings-modal"
        className="bg-cream-card dark:bg-stone-900 rounded-2xl sm:rounded-3xl max-w-3xl w-full shadow-2xl border border-cream-border dark:border-stone-800 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-cream-border dark:border-stone-800 flex items-center justify-between bg-cream-50/80 dark:bg-stone-850/80">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={avatar}
                alt={currentUser.name}
                className="w-10 h-10 rounded-xl object-cover border border-cream-border dark:border-stone-700 shadow-sm"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center text-[9px] font-bold">
                <Settings className="w-2.5 h-2.5" />
              </div>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <span>Account Settings</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cream-100 dark:bg-stone-800 text-amber-900 dark:text-amber-300 font-semibold border border-cream-border dark:border-stone-700">
                  {currentUser.name}
                </span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Configure preferences, Google connectivity, goals, and data isolation for this account
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-account-settings"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-cream-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-cream-border dark:border-stone-800 bg-cream-50/50 dark:bg-stone-900 overflow-x-auto px-4 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'profile'
                ? 'border-amber-600 text-amber-800 dark:text-amber-400'
                : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile & Identity</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('study')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'study'
                ? 'border-amber-600 text-amber-800 dark:text-amber-400'
                : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Timer & Focus</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('goals')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'goals'
                ? 'border-amber-600 text-amber-800 dark:text-amber-400'
                : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Weekly Goals & Subjects</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'notifications'
                ? 'border-amber-600 text-amber-800 dark:text-amber-400'
                : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Notifications & Alerts</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('data')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'data'
                ? 'border-amber-600 text-amber-800 dark:text-amber-400'
                : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Cloud & Backup</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {saveSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-semibold">Account settings saved successfully!</span>
            </div>
          )}

          {/* TAB 1: PROFILE & IDENTITY */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Google Account Connectivity Card */}
              <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-750">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 flex items-center justify-center shrink-0 shadow-xs">
                      <svg className="w-6 h-6" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"/>
                        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.76-2.1-6.71-4.93H1.26v3.15C3.26 21.36 7.33 24 12 24z"/>
                        <path fill="#FBBC05" d="M5.29 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.99 0 12s.46 3.84 1.26 5.42l4.03-3.15z"/>
                        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.26 6.58l4.03 3.15c.95-2.83 3.59-4.98 6.71-4.98z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-stone-900 dark:text-white">
                          Google Account Connection
                        </h4>
                        {currentUser.googleConnected ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                            Connected
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                            Not Linked
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                        {currentUser.googleConnected
                          ? `Syncing Google Classroom coursework for ${currentUser.email}`
                          : 'Connect your Google account to automatically import your real Google Classroom deadlines'}
                      </p>
                    </div>
                  </div>

                  <div>
                    {currentUser.googleConnected ? (
                      <button
                        type="button"
                        onClick={onDisconnectGoogle}
                        className="w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        Disconnect Google Account
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={onConnectGoogle}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <span>Connect with Google</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Student Display Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Avatar Chooser & Device Image Upload */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                      Profile Avatar & Photo
                    </label>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                      Upload an image directly from your device or select from presets
                    </p>
                  </div>

                  {avatar && !AVATAR_PRESETS.some((p) => p.url === avatar) && (
                    <button
                      type="button"
                      onClick={() => setAvatar(AVATAR_PRESETS[0].url)}
                      className="text-xs text-stone-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 font-medium transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset to Preset</span>
                    </button>
                  )}
                </div>

                {/* Hidden File Input for Device Image Selection */}
                <input
                  type="file"
                  ref={avatarFileInputRef}
                  id="avatar-device-file-input"
                  accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleDeviceAvatarSelected(file);
                    }
                    // Reset input value so re-uploading the same file still triggers onChange
                    e.target.value = '';
                  }}
                />

                {/* Error Banner */}
                {avatarError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                    <span>{avatarError}</span>
                  </div>
                )}

                {/* Main Avatar Upload & Preview Layout */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch">
                  {/* Left: Current Avatar Preview Card */}
                  <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 flex flex-col items-center justify-center text-center">
                    <div className="relative group cursor-pointer" onClick={() => avatarFileInputRef.current?.click()}>
                      <img
                        src={avatar}
                        alt="Current Avatar"
                        className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-500 shadow-md transition group-hover:opacity-90"
                      />
                      <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-semibold gap-1">
                        <Camera className="w-5 h-5" />
                        <span>Change</span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-indigo-600 text-white shadow-xs">
                        <Camera className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    <div className="mt-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        !AVATAR_PRESETS.some((p) => p.url === avatar)
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                      }`}>
                        {!AVATAR_PRESETS.some((p) => p.url === avatar) ? 'Device Photo' : 'Preset Avatar'}
                      </span>
                    </div>
                  </div>

                  {/* Right: Drag & Drop Dropzone from Device */}
                  <div
                    id="avatar-dropzone"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDraggingOverAvatar(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDraggingOverAvatar(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDraggingOverAvatar(false);
                      const droppedFile = e.dataTransfer.files?.[0];
                      if (droppedFile) {
                        handleDeviceAvatarSelected(droppedFile);
                      }
                    }}
                    onClick={() => avatarFileInputRef.current?.click()}
                    className={`sm:col-span-2 p-4 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[140px] ${
                      isDraggingOverAvatar
                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 scale-[1.01]'
                        : 'border-stone-300 dark:border-stone-700 hover:border-indigo-500 bg-white dark:bg-stone-850 hover:bg-stone-50 dark:hover:bg-stone-800'
                    }`}
                  >
                    {isProcessingAvatar ? (
                      <div className="flex flex-col items-center gap-2 text-indigo-600 dark:text-indigo-400">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="text-xs font-semibold">Processing & optimizing photo...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                          <UploadCloud className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-stone-800 dark:text-stone-200">
                            Choose from device or drag photo here
                          </p>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                            Supports PNG, JPG, WEBP, or GIF up to 15MB
                          </p>
                        </div>
                        <button
                          type="button"
                          id="btn-choose-device-avatar"
                          onClick={(e) => {
                            e.stopPropagation();
                            avatarFileInputRef.current?.click();
                          }}
                          className="mt-1 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition"
                        >
                          Select Image File
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Preset Avatars Row */}
                <div>
                  <div className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">
                    Or select a pre-made avatar
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                    {AVATAR_PRESETS.map((preset) => {
                      const isSelected = avatar === preset.url;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setAvatar(preset.url);
                            setAvatarError(null);
                          }}
                          className={`relative p-1 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-sm scale-105'
                              : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.label}
                            className="w-12 h-12 rounded-xl object-cover"
                          />
                          {isSelected && (
                            <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          )}
                          <span className="text-[10px] text-stone-500 truncate w-full text-center">
                            {preset.label.split(' ')[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Account Details Footer */}
              <div className="pt-4 border-t border-stone-200 dark:border-stone-800 text-xs text-stone-500 flex flex-wrap items-center justify-between gap-2">
                <span>Account ID: <code className="bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded font-mono text-[11px]">{currentUser.id}</code></span>
                <span>Member since: {new Date(currentUser.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          )}

          {/* TAB 2: TIMER & FOCUS DEFAULTS */}
          {activeTab === 'study' && (
            <div className="space-y-6">
              {/* Default Focus Timer Duration */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                    Default Study Session Duration
                  </label>
                  <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                    {focusDuration} minutes
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[15, 25, 45, 60, 90].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setFocusDuration(mins)}
                      className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all ${
                        focusDuration === mins
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                          : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Default Break Duration */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                    Default Break Duration
                  </label>
                  <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                    {breakDuration} minutes
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 15, 20].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setBreakDuration(mins)}
                      className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all ${
                        breakDuration === mins
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                          : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Sound & Celebration Toggles */}
              <div className="space-y-3 pt-2">
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-750 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <div>
                      <div className="text-xs font-bold text-stone-900 dark:text-white">
                        Audio Completion Chime
                      </div>
                      <div className="text-[11px] text-stone-500">
                        Plays a pleasant bell sound when timer completes
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={playTestChime}
                      className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline px-2 py-1"
                    >
                      Test Sound
                    </button>
                    <input
                      type="checkbox"
                      checked={soundEnabled}
                      onChange={(e) => setSoundEnabled(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-750 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <div>
                      <div className="text-xs font-bold text-stone-900 dark:text-white">
                        Milestone Confetti Animations
                      </div>
                      <div className="text-[11px] text-stone-500">
                        Celebrate streak increases and completed weekly goals
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={confettiEnabled}
                    onChange={(e) => setConfettiEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-750 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-stone-900 dark:text-white">
                      Auto-start Break Timer
                    </div>
                    <div className="text-[11px] text-stone-500">
                      Automatically begin rest countdown after study session finishes
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoStartBreaks}
                    onChange={(e) => setAutoStartBreaks(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Default Mood Preset */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-2">
                  Default Session Mood Rating
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['focused', 'productive', 'tired', 'distracted'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDefaultMood(m)}
                      className={`py-2 px-3 text-xs font-semibold rounded-xl border capitalize transition-all ${
                        defaultMood === m
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                          : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: WEEKLY GOALS & SUBJECTS */}
          {activeTab === 'goals' && (
            <div className="space-y-6">
              {/* Overall Weekly Target Hours */}
              <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-bold text-indigo-950 dark:text-indigo-200">
                      Weekly Study Target Hours
                    </h4>
                    <p className="text-xs text-indigo-800/80 dark:text-indigo-300/80">
                      Overall weekly threshold calculated across all subjects
                    </p>
                  </div>
                  <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">
                    {weeklyGoalHours} hrs/wk
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="1"
                  value={weeklyGoalHours}
                  onChange={(e) => setWeeklyGoalHours(Number(e.target.value))}
                  className="w-full h-2 bg-indigo-200 dark:bg-indigo-900 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[11px] text-stone-500 mt-1">
                  <span>5 hours</span>
                  <span>25 hours</span>
                  <span>60 hours</span>
                </div>
              </div>

              {/* Individual Subject Target Allocation */}
              <div>
                <h4 className="text-xs font-bold text-stone-700 dark:text-stone-300 mb-2 uppercase tracking-wider">
                  Subject Target Allocation
                </h4>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {subjects.map((sub, index) => (
                    <div
                      key={sub.id}
                      className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-800/40 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: sub.color }}
                        />
                        <span className="text-xs font-bold text-stone-900 dark:text-white truncate">
                          {sub.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="number"
                          min="1"
                          max="40"
                          value={sub.targetWeeklyHours}
                          onChange={(e) => {
                            const newHours = Math.max(1, Number(e.target.value));
                            const updated = [...subjects];
                            updated[index] = { ...sub, targetWeeklyHours: newHours };
                            onUpdateSubjects(updated);
                          }}
                          className="w-16 px-2 py-1 text-xs font-bold text-center bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white"
                        />
                        <span className="text-xs text-stone-500">hrs/wk</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: NOTIFICATIONS & ALERTS */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              {/* Browser Push Permission Card */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-750 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-indigo-600" />
                    <span>Browser Push Notifications</span>
                  </div>
                  <div className="text-[11px] text-stone-500 mt-0.5">
                    Permission status:{' '}
                    <strong className="text-stone-700 dark:text-stone-300">
                      {'Notification' in window ? Notification.permission : 'unsupported'}
                    </strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onRequestPushNotifications}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                >
                  Request Permission
                </button>
              </div>

              {/* Daily Streak Reminder */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-750 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-stone-900 dark:text-white">
                      Daily Study Streak Alert
                    </div>
                    <div className="text-[11px] text-stone-500">
                      Sends an evening nudge if you haven't logged a study session today
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={dailyStreakReminder}
                    onChange={(e) => setDailyStreakReminder(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>

                {dailyStreakReminder && (
                  <div className="pt-3 border-t border-stone-200 dark:border-stone-700 flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                      Alert Schedule Time:
                    </span>
                    <input
                      type="time"
                      value={dailyReminderTime}
                      onChange={(e) => setDailyReminderTime(e.target.value)}
                      className="px-2.5 py-1 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Google Classroom Deadline Advance Notice */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-750 space-y-2">
                <div className="text-xs font-bold text-stone-900 dark:text-white">
                  Classroom Assignment Due Date Lead Time
                </div>
                <div className="text-[11px] text-stone-500 mb-2">
                  When to notify you prior to coursework deadlines
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[6, 12, 24, 48].map((hrs) => (
                    <button
                      key={hrs}
                      type="button"
                      onClick={() => setDeadlineLeadHours(hrs)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        deadlineLeadHours === hrs
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                          : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      {hrs}h before
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CLOUD & BACKUP DATA */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              {/* Cloud Sync Section */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-750 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                      <Cloud className="w-4 h-4 text-indigo-600" />
                      <span>Cross-Device Cloud Sync</span>
                    </h4>
                    <p className="text-[11px] text-stone-500">
                      Share study sessions and streak data across phones, laptops, and tablets
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onTriggerSync}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sync Now</span>
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    Cloud Pairing Device ID
                  </label>
                  <input
                    type="text"
                    value={cloudUserId}
                    onChange={(e) => setCloudUserId(e.target.value)}
                    placeholder="student_abc123"
                    className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white"
                  />
                  <p className="text-[10px] text-stone-500 mt-1">
                    Set identical IDs on your other devices to view the same study logs.
                  </p>
                </div>
              </div>

              {/* Export & Import Data */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-750 space-y-3">
                <h4 className="text-xs font-bold text-stone-900 dark:text-white">
                  Backup & Transfer
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleExportData}
                    className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold text-stone-800 dark:text-stone-200 transition-colors"
                  >
                    <Download className="w-4 h-4 text-indigo-600" />
                    <span>Export Study Records (JSON)</span>
                  </button>

                  <label className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold text-stone-800 dark:text-stone-200 transition-colors cursor-pointer">
                    <Upload className="w-4 h-4 text-indigo-600" />
                    <span>Import Records (JSON)</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportData}
                      className="hidden"
                    />
                  </label>
                </div>

                {importSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                    Backup successfully restored!
                  </div>
                )}
                {importError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs">
                    {importError}
                  </div>
                )}
              </div>

              {/* Danger Zone: Reset This Account */}
              <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/50 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>Danger Zone: Reset Study History</span>
                    </h4>
                    <p className="text-[11px] text-rose-700/80 dark:text-rose-400 mt-0.5">
                      Clear study sessions, subject statistics, and streak for <strong>{currentUser.name}</strong> only.
                    </p>
                  </div>
                  {!showDangerConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowDangerConfirm(true)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
                    >
                      Clear Data...
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowDangerConfirm(false)}
                        className="px-2.5 py-1 text-xs text-stone-500 hover:underline"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onResetAccountData();
                          setShowDangerConfirm(false);
                          setSaveSuccess(true);
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                      >
                        Confirm Reset
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions Footer */}
        <div className="px-6 py-4 border-t border-cream-border dark:border-stone-800 bg-cream-50/80 dark:bg-stone-850/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {/* Quick Dark Mode Toggle */}
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="p-2 rounded-xl border border-cream-border dark:border-stone-700 bg-cream-card dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-semibold flex items-center gap-1.5 hover:bg-cream-100 dark:hover:bg-stone-750 transition-colors"
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-stone-600" />}
              <span>{isDarkMode ? 'Light' : 'Dark'}</span>
            </button>

            {/* Logout from within settings */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="p-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-cream-200 dark:hover:bg-stone-800 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              id="btn-save-account-settings"
              onClick={handleSaveAll}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:hover:bg-white dark:text-stone-900 shadow-md transition-all flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save Account Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
