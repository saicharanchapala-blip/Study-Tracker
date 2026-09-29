import React, { useState } from 'react';
import {
  Cloud,
  Wifi,
  WifiOff,
  RefreshCw,
  Smartphone,
  Laptop,
  CheckCircle2,
  HardDrive,
  Copy,
  Check,
} from 'lucide-react';
import { SyncStatus } from '../types';

interface CloudSyncBarProps {
  syncStatus: SyncStatus;
  onTriggerSync: () => Promise<void>;
  userId: string;
  onUpdateUserId: (id: string) => void;
}

export const CloudSyncBar: React.FC<CloudSyncBarProps> = ({
  syncStatus,
  onTriggerSync,
  userId,
  onUpdateUserId,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [inputUserId, setInputUserId] = useState(userId);
  const [copied, setCopied] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await onTriggerSync();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveUserId = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUserId.trim()) {
      onUpdateUserId(inputUserId.trim());
      setShowDeviceModal(false);
    }
  };

  return (
    <>
      <div
        id="cloud-sync-status-bar"
        className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-cream-100/90 dark:bg-stone-900/90 border border-cream-border dark:border-stone-800 text-xs text-stone-600 dark:text-stone-400"
      >
        <div className="flex items-center gap-3">
          {syncStatus.isOnline ? (
            <span className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400 font-semibold">
              <Wifi className="w-3.5 h-3.5" />
              Online
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
              <WifiOff className="w-3.5 h-3.5" />
              Offline Mode
            </span>
          )}

          <span className="hidden sm:inline text-stone-300 dark:text-stone-700">|</span>

          <span className="flex items-center gap-1.5">
            <Cloud className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="hidden md:inline">Cross-Device Sync:</span>
            {syncStatus.lastSyncedAt
              ? `Synced ${new Date(syncStatus.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'Local persistent storage active'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {syncStatus.pendingOfflineCount > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-amber-100/80 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border border-amber-300/60 font-medium">
              {syncStatus.pendingOfflineCount} pending offline items
            </span>
          )}

          <button
            id="btn-open-device-sync"
            onClick={() => setShowDeviceModal(true)}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg hover:bg-cream-200/80 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium transition flex items-center gap-1.5 cursor-pointer"
            title="Multi-device sync settings"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sync Code</span>
          </button>

          <button
            id="btn-cloud-sync-now"
            onClick={handleSync}
            disabled={isSyncing || !syncStatus.isOnline}
            className="p-1.5 sm:px-3 sm:py-1 rounded-lg bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white text-white disabled:opacity-50 transition flex items-center gap-1.5 font-medium shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync Cloud'}</span>
          </button>
        </div>
      </div>

      {/* Sync Code Modal */}
      {showDeviceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div className="bg-cream-card dark:bg-stone-900 border border-cream-border dark:border-stone-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-xl space-y-5">
            <div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <Laptop className="w-5 h-5 text-amber-600" />
                Cross-Device Cloud Sync
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Enter your unique Device Sync Code on your laptop, tablet, or phone to access all your study records in real time.
              </p>
            </div>

            <div className="bg-cream-50 dark:bg-stone-800/80 p-4 rounded-2xl border border-cream-border dark:border-stone-700">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-400 mb-1">
                Your Device Sync Code
              </label>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm font-bold text-stone-900 dark:text-white">
                  {userId}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="p-2 text-xs font-semibold rounded-xl bg-cream-card dark:bg-stone-700 border border-cream-border dark:border-stone-600 text-stone-700 dark:text-stone-200 hover:bg-cream-100 flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveUserId} className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Switch or Pair Another Device
              </label>
              <input
                type="text"
                placeholder="Enter Sync Code from your other device..."
                value={inputUserId}
                onChange={(e) => setInputUserId(e.target.value)}
                className="w-full bg-cream-50 dark:bg-stone-800 border border-cream-border dark:border-stone-700 rounded-xl px-3.5 py-2 text-sm text-stone-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeviceModal(false)}
                  className="px-4 py-2 text-sm text-stone-600 dark:text-stone-400 hover:bg-cream-100 dark:hover:bg-stone-800 rounded-xl cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white rounded-xl shadow-xs cursor-pointer"
                >
                  Apply & Sync
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
