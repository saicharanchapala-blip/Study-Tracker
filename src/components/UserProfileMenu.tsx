import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  LogOut,
  Users,
  Check,
  ShieldCheck,
  ChevronDown,
  GraduationCap,
  Sparkles,
  Settings,
  Camera,
  Upload,
  Loader2,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { UserProfile } from '../types';
import { processAvatarImage } from '../utils/imageHelper';

interface UserProfileMenuProps {
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onSwitchUser: (user: UserProfile) => void;
  onLogout: () => void;
  onConnectGoogle: () => void;
  onOpenAccountSettings?: () => void;
  onUpdateUser?: (updatedUser: UserProfile) => void;
}

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({
  currentUser,
  allUsers,
  onSwitchUser,
  onLogout,
  onConnectGoogle,
  onOpenAccountSettings,
  onUpdateUser,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const quickFileInputRef = useRef<HTMLInputElement>(null);

  const handleQuickUpload = async (file: File) => {
    if (!onUpdateUser) return;
    try {
      setUploadError(null);
      setIsUploading(true);
      const optimizedUrl = await processAvatarImage(file, 256);
      onUpdateUser({
        ...currentUser,
        avatar: optimizedUrl,
      });
    } catch (err: any) {
      setUploadError(err.message || 'Failed to update avatar');
    } finally {
      setIsUploading(false);
    }
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        id="btn-user-profile-menu"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full border border-cream-border dark:border-stone-800 bg-cream-card/90 dark:bg-stone-900/90 hover:bg-cream-100 dark:hover:bg-stone-800 transition-colors shadow-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
      >
        <img
          src={
            currentUser.avatar ||
            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.name)}`
          }
          alt={currentUser.name}
          className="w-8 h-8 rounded-full object-cover border border-stone-300 dark:border-stone-700 shrink-0"
        />
        <div className="text-left hidden sm:block">
          <div className="text-xs font-bold text-stone-900 dark:text-white leading-tight flex items-center gap-1.5">
            <span className="truncate max-w-[110px]">{currentUser.name}</span>
            {currentUser.googleConnected && (
              <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" title="Google Account Connected" />
            )}
          </div>
          <div className="text-[10px] text-stone-500 dark:text-stone-400 leading-none truncate max-w-[120px]">
            {currentUser.googleConnected ? 'Google Account' : currentUser.email}
          </div>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
      </button>

      {isOpen && (
        <div
          id="user-profile-dropdown"
          className="absolute right-0 mt-2 w-72 bg-cream-card dark:bg-stone-900 rounded-2xl shadow-xl border border-cream-border dark:border-stone-800 p-3 z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          {/* User Profile Header */}
          <div className="p-3 bg-cream-50 dark:bg-stone-850 rounded-xl mb-2.5 border border-cream-border/60 dark:border-stone-800">
            {/* Hidden device image picker */}
            <input
              type="file"
              ref={quickFileInputRef}
              id="quick-avatar-file-input"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleQuickUpload(file);
                }
                e.target.value = '';
              }}
            />

            <div className="flex items-center gap-3">
              <div
                className="relative group cursor-pointer shrink-0"
                onClick={() => quickFileInputRef.current?.click()}
                title="Click to upload photo from your device"
              >
                <img
                  src={
                    currentUser.avatar ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.name)}`
                  }
                  alt={currentUser.name}
                  className="w-11 h-11 rounded-full object-cover border-2 border-amber-300 dark:border-amber-800 group-hover:opacity-85 transition"
                />
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-3.5 h-3.5" />
                  )}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 flex items-center justify-center text-[9px] shadow-xs">
                  {isUploading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Camera className="w-2.5 h-2.5" />}
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-stone-900 dark:text-white truncate">
                  {currentUser.name}
                </div>
                <div className="text-xs text-stone-500 dark:text-stone-400 truncate">
                  {currentUser.email}
                </div>
                {currentUser.googleConnected ? (
                  <div className="inline-flex items-center gap-1 text-[10px] font-medium text-teal-600 dark:text-teal-400 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                    <span>Google Connected</span>
                  </div>
                ) : (
                  <span className="text-[10px] text-stone-400">Local Account</span>
                )}
              </div>
            </div>

            {uploadError && (
              <div className="mt-2 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-[11px] leading-tight">
                {uploadError}
              </div>
            )}
          </div>

          {/* Primary Quick Actions */}
          <div className="space-y-1 mb-2">
            {onOpenAccountSettings && (
              <button
                type="button"
                id="btn-profile-menu-settings"
                onClick={() => {
                  setIsOpen(false);
                  onOpenAccountSettings();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-cream-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 text-stone-600 dark:text-stone-400" />
                  <span>Account & Settings</span>
                </div>
                <span className="text-[10px] text-stone-600 dark:text-stone-400 font-bold">Open →</span>
              </button>
            )}

            <button
              type="button"
              id="btn-quick-change-avatar"
              onClick={() => quickFileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-cream-100 dark:hover:bg-stone-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center gap-2.5">
                <Camera className="w-4 h-4 text-stone-500" />
                <span>Change Avatar Photo</span>
              </div>
              <span className="text-[10px] text-stone-400 font-medium">Upload</span>
            </button>
          </div>

          {/* MORE OPTIONS FACILITY */}
          <div className="pt-2 border-t border-cream-border/60 dark:border-stone-800 mb-2">
            <button
              type="button"
              id="btn-profile-more-options"
              onClick={() => setShowMoreOptions(!showMoreOptions)}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-cream-100 dark:hover:bg-stone-800/60 transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-amber-600" />
                <span>More Options</span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${
                  showMoreOptions ? 'rotate-180 text-amber-600' : ''
                }`}
              />
            </button>

            {showMoreOptions && (
              <div className="mt-2 space-y-2.5 px-1 py-1 animate-in fade-in duration-150">
                {/* Switch Person Sub-section */}
                <div>
                  <div className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-1.5">
                    Switch Student Account
                  </div>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {allUsers.map((user) => {
                      const isCurrent = user.id === currentUser.id;
                      return (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => {
                            if (!isCurrent) {
                              onSwitchUser(user);
                              setIsOpen(false);
                            }
                          }}
                          className={`w-full text-left p-1.5 rounded-lg flex items-center justify-between text-xs transition-colors cursor-pointer ${
                            isCurrent
                              ? 'bg-amber-100/70 dark:bg-amber-950/60 text-amber-950 dark:text-amber-200 font-semibold'
                              : 'hover:bg-cream-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-5 h-5 rounded-full object-cover shrink-0"
                            />
                            <span className="truncate text-xs">{user.name}</span>
                          </div>
                          {isCurrent ? (
                            <Check className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          ) : (
                            <span className="text-[9px] text-stone-400">Switch</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Google Connection Link if not linked */}
                {!currentUser.googleConnected && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onConnectGoogle();
                    }}
                    className="w-full text-left p-2 rounded-lg bg-teal-50/60 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 text-xs font-semibold flex items-center justify-between hover:bg-teal-100/60 transition cursor-pointer"
                  >
                    <span>Connect Google Classroom</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Account ID / Workspace Tag */}
                <div className="text-[10px] text-stone-400 flex items-center justify-between px-1">
                  <span>Workspace ID</span>
                  <span className="font-mono text-[9px]">{currentUser.id.slice(0, 12)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Sign Out Button */}
          <div className="pt-2 border-t border-cream-border/60 dark:border-stone-800">
            <button
              type="button"
              id="btn-user-logout"
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out to Login Page</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
