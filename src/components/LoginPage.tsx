import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Users,
  ExternalLink,
  ChevronDown,
  Sliders,
  UserCheck,
} from 'lucide-react';
import { UserProfile } from '../types';
import { DEMO_USERS } from '../initialData';

interface LoginPageProps {
  onLogin: (user: UserProfile) => void;
  registeredUsers?: UserProfile[];
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, registeredUsers = [] }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('saicharan.chapala@gmail.com');
  const [googleNameInput, setGoogleNameInput] = useState('Sai Charan');
  const [isGoogleConnecting, setIsGoogleConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Combine demo users with any locally registered users
  const allUsers: UserProfile[] = React.useMemo(() => {
    const list = [...DEMO_USERS];
    registeredUsers.forEach((reg) => {
      if (!list.some((u) => u.id === reg.id || u.email === reg.email)) {
        list.push(reg);
      }
    });
    return list;
  }, [registeredUsers]);

  // Attempt to initialize Google Identity Services (GSI) if available
  useEffect(() => {
    const initGsi = async () => {
      try {
        const res = await fetch('/api/auth/google/config');
        const cfg = await res.json();
        if (cfg.clientId && window.google?.accounts?.id) {
          window.google.accounts.id.initialize({
            client_id: cfg.clientId,
            callback: (response: any) => {
              if (response.credential) {
                // Decode JWT
                try {
                  const payload = JSON.parse(
                    atob(response.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
                  );
                  const googleUser: UserProfile = {
                    id: `google_${payload.sub || Math.random().toString(36).substring(2, 9)}`,
                    name: payload.name || 'Google Student',
                    email: payload.email || 'user@gmail.com',
                    avatar: payload.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${payload.email}`,
                    authProvider: 'google',
                    googleConnected: true,
                    googleAccountId: payload.sub,
                    createdAt: new Date().toISOString(),
                  };
                  onLogin(googleUser);
                } catch (e) {
                  console.error('Failed to parse Google JWT credential', e);
                }
              }
            },
          });
        }
      } catch (err) {
        // Fallback gracefully if config endpoint unavailable
      }
    };
    initGsi();
  }, [onLogin]);

  // Handle Google Sign-in click
  const handleGoogleSignInClick = () => {
    setIsGoogleConnecting(true);
    setError(null);

    // If Google GSI client is loaded and client ID exists, trigger Google prompt
    if (window.google?.accounts?.oauth2) {
      try {
        fetch('/api/auth/google/config')
          .then((r) => r.json())
          .then((cfg) => {
            if (cfg.clientId) {
              const tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: cfg.clientId,
                scope: 'https://www.googleapis.com/auth/classroom.courses.readonly https://www.googleapis.com/auth/classroom.coursework.me.readonly',
                callback: (tokenResp: any) => {
                  setIsGoogleConnecting(false);
                  if (tokenResp.access_token) {
                    const googleUser: UserProfile = {
                      id: `google_${googleEmailInput.replace(/[^a-zA-Z0-9]/g, '_')}`,
                      name: googleNameInput,
                      email: googleEmailInput,
                      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
                      authProvider: 'google',
                      googleConnected: true,
                      createdAt: new Date().toISOString(),
                    };
                    onLogin(googleUser);
                  }
                },
              });
              tokenClient.requestAccessToken({ prompt: 'consent' });
              return;
            } else {
              // Show seamless Google Account Confirmation Modal
              setIsGoogleConnecting(false);
              setShowGoogleModal(true);
            }
          })
          .catch(() => {
            setIsGoogleConnecting(false);
            setShowGoogleModal(true);
          });
      } catch (err) {
        setIsGoogleConnecting(false);
        setShowGoogleModal(true);
      }
    } else {
      setIsGoogleConnecting(false);
      setShowGoogleModal(true);
    }
  };

  const handleConfirmGoogleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmailInput.trim()) {
      setError('Please provide your Google email address');
      return;
    }

    const cleanEmail = googleEmailInput.trim();
    const cleanName = googleNameInput.trim() || cleanEmail.split('@')[0];
    const googleId = `google_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;

    const googleUser: UserProfile = {
      id: googleId,
      name: cleanName,
      email: cleanEmail,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}&backgroundColor=4f46e5,6366f1`,
      authProvider: 'google',
      googleConnected: true,
      googleAccountId: `g_${Math.random().toString(36).substring(2, 10)}`,
      createdAt: new Date().toISOString(),
    };

    setShowGoogleModal(false);
    onLogin(googleUser);
  };

  // Handle Standard Email/Password Form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Email address is required');
      return;
    }

    if (isSignUp && !name.trim()) {
      setError('Full name is required to create an account');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = allUsers.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!isSignUp && !existing && !password) {
      // In demo/prototype mode, allow instant login or suggest sign up
    }

    const userId = existing?.id || `user_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const userName = name.trim() || existing?.name || cleanEmail.split('@')[0];

    const user: UserProfile = {
      id: userId,
      name: userName,
      email: cleanEmail,
      avatar: existing?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userName)}&backgroundColor=0284c7,38bdf8`,
      authProvider: 'email',
      googleConnected: false,
      createdAt: existing?.createdAt || new Date().toISOString(),
    };

    onLogin(user);
  };

  return (
    <div
      id="login-page-root"
      className="min-h-screen bg-cream-canvas dark:bg-stone-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-200"
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cream-100 dark:bg-stone-850 text-amber-800 dark:text-amber-400 border border-cream-border dark:border-stone-800 shadow-xs mb-4">
          <BookOpen className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100">
          Study Session Tracker
        </h1>
        <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
          Sign in to access your weekly study goals, course deadlines, and ambient focus soundscapes.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-cream-card dark:bg-stone-900 py-8 px-6 shadow-sm sm:rounded-2xl border border-cream-border dark:border-stone-800">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Primary Action: Google Account Sign In */}
          <div>
            <button
              type="button"
              id="btn-google-login"
              onClick={handleGoogleSignInClick}
              disabled={isGoogleConnecting}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-cream-border dark:border-stone-700 bg-cream-50 dark:bg-stone-850 text-stone-700 dark:text-stone-200 font-semibold text-sm hover:bg-cream-100 dark:hover:bg-stone-800 active:scale-[0.99] transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 dark:focus:ring-offset-stone-900 cursor-pointer"
            >
              {/* Multicolored Google 'G' SVG */}
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.76-2.1-6.71-4.93H1.26v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.29 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.99 0 12s.46 3.84 1.26 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.26 6.58l4.03 3.15c.95-2.83 3.59-4.98 6.71-4.98z"
                />
              </svg>
              <span>{isGoogleConnecting ? 'Connecting to Google...' : 'Continue with Google Account'}</span>
            </button>
          </div>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-cream-border dark:border-stone-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-cream-card dark:bg-stone-900 px-3 text-stone-400 dark:text-stone-500 font-medium">
                or with email
              </span>
            </div>
          </div>

          {/* Streamlined, Congestion-Free Email Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Student Email
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  id="input-login-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  required
                  className="block w-full pl-10 pr-3 py-2.5 text-sm bg-cream-50 dark:bg-stone-800/80 border border-cream-border dark:border-stone-700 rounded-xl text-stone-900 dark:text-white placeholder-stone-400 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                />
              </div>
            </div>

            <button
              type="submit"
              id="btn-submit-login"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:hover:bg-white dark:text-stone-900 font-semibold text-sm shadow-xs active:scale-[0.99] transition-all cursor-pointer"
            >
              <span>Continue to Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* MORE OPTIONS FACILITY: Neatly houses persona switcher, passwords, guest mode, and privacy */}
          <div className="mt-6 pt-4 border-t border-cream-border/80 dark:border-stone-800">
            <button
              type="button"
              id="btn-login-more-options"
              onClick={() => setShowMoreOptions(!showMoreOptions)}
              className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-cream-100 dark:hover:bg-stone-800/60 transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>More Sign-in Options & Personas</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${
                  showMoreOptions ? 'rotate-180 text-amber-800 dark:text-amber-400' : ''
                }`}
              />
            </button>

            {showMoreOptions && (
              <div className="mt-3 space-y-3 pt-1 animate-in fade-in zoom-in-95 duration-150">
                {/* 1. Quick Demo Persona Switcher */}
                <div>
                  <div className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      Select Demo Student
                    </span>
                    <span className="text-[10px] lowercase font-normal">instant test login</span>
                  </div>

                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-0.5">
                    {allUsers.map((user) => {
                      const isGoogle = user.authProvider === 'google';
                      return (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => onLogin(user)}
                          className="w-full text-left p-2 rounded-xl border border-cream-border dark:border-stone-800 hover:border-amber-400 dark:hover:border-amber-600 bg-cream-50/70 dark:bg-stone-800/40 hover:bg-cream-100 dark:hover:bg-stone-800 transition-all flex items-center justify-between group cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-7 h-7 rounded-full object-cover border border-cream-border dark:border-stone-700 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-stone-900 dark:text-white truncate flex items-center gap-1">
                                <span>{user.name}</span>
                                {isGoogle && (
                                  <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-amber-100 dark:bg-stone-800 text-amber-900 dark:text-amber-300 border border-amber-200/50 dark:border-stone-700">
                                    Google
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-stone-400 truncate">
                                {user.email}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs font-medium text-amber-800 dark:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                            Select →
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Optional Password Protected Login / Custom Name */}
                <div className="p-3 rounded-xl bg-cream-50 dark:bg-stone-800/40 border border-cream-border/80 dark:border-stone-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                      Custom Name & Password (Optional)
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsSignUp(!isSignUp)}
                      className="text-[11px] text-amber-800 dark:text-amber-400 hover:underline font-medium"
                    >
                      {isSignUp ? 'Simple Mode' : '+ Add Name/Pass'}
                    </button>
                  </div>
                  {isSignUp && (
                    <div className="space-y-2 pt-1">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Full Student Name"
                        className="w-full px-3 py-1.5 text-xs bg-cream-card dark:bg-stone-900 border border-cream-border dark:border-stone-700 rounded-lg text-stone-900 dark:text-white"
                      />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password (Optional)"
                        className="w-full px-3 py-1.5 text-xs bg-cream-card dark:bg-stone-900 border border-cream-border dark:border-stone-700 rounded-lg text-stone-900 dark:text-white"
                      />
                    </div>
                  )}
                </div>

                {/* 3. Instant Offline Guest Mode */}
                <button
                  type="button"
                  id="btn-login-guest-mode"
                  onClick={() => {
                    const guestUser: UserProfile = {
                      id: `guest_${Date.now()}`,
                      name: 'Guest Student',
                      email: 'guest@studysession.local',
                      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Guest&backgroundColor=d97706',
                      authProvider: 'email',
                      googleConnected: false,
                      createdAt: new Date().toISOString(),
                    };
                    onLogin(guestUser);
                  }}
                  className="w-full p-2.5 rounded-xl border border-dashed border-cream-border dark:border-stone-700 hover:border-amber-400 dark:hover:border-stone-600 text-center text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-cream-100 transition cursor-pointer"
                >
                  Continue as Offline Guest (Local Only)
                </button>

                {/* 4. Privacy & Data Isolation Note */}
                <div className="p-2.5 rounded-xl bg-cream-100 dark:bg-stone-800/40 border border-cream-border dark:border-stone-800 text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Isolated workspace with client-side & cloud synchronization.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Google Account Connection Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div className="bg-cream-card dark:bg-stone-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-cream-border dark:border-stone-800 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cream-100 dark:bg-stone-850 flex items-center justify-center text-amber-800 shrink-0">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.76-2.1-6.71-4.93H1.26v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.29 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.99 0 12s.46 3.84 1.26 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.26 6.58l4.03 3.15c.95-2.83 3.59-4.98 6.71-4.98z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  Connect Google Account
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Link your personal Google profile to this study tracker.
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmGoogleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Google Account Name
                </label>
                <input
                  type="text"
                  value={googleNameInput}
                  onChange={(e) => setGoogleNameInput(e.target.value)}
                  placeholder="Your Name"
                  required
                  className="w-full px-3 py-2 text-sm bg-cream-50 dark:bg-stone-800 border border-cream-border dark:border-stone-700 rounded-xl text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Google Account Email
                </label>
                <input
                  type="email"
                  value={googleEmailInput}
                  onChange={(e) => setGoogleEmailInput(e.target.value)}
                  placeholder="your.email@gmail.com"
                  required
                  className="w-full px-3 py-2 text-sm bg-cream-50 dark:bg-stone-800 border border-cream-border dark:border-stone-700 rounded-xl text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-400"
                />
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                  Used for Google Classroom enrollment syncing and coursework notifications.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-cream-100 dark:bg-stone-800/80 text-xs text-stone-600 dark:text-stone-300 flex items-center gap-2 border border-cream-border dark:border-stone-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Enables Google Classroom coursework integration</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-cream-100 dark:hover:bg-stone-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-confirm-google-auth"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white shadow-xs transition-colors"
                >
                  Log In with this Google Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
