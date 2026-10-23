import React, { useState } from 'react';
import { WifiOff, RefreshCw, CheckCircle2, Download, CloudOff, AlertCircle } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { offlineManager } from '../lib/offlineManager';

interface OfflineIndicatorProps {
  onOpenOfflinePackModal: () => void;
  onSyncComplete?: () => void;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  onOpenOfflinePackModal,
  onSyncComplete,
}) => {
  const { isOnline, queuedCount, isSimulated, toggleSimulatedOffline } = useOnlineStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await offlineManager.syncQueuedEdits();
      if (res.success > 0) {
        setSyncFeedback(`Successfully synced ${res.success} offline edit${res.success > 1 ? 's' : ''}!`);
      } else if (res.failed > 0) {
        setSyncFeedback(`${res.failed} item(s) could not sync yet.`);
      } else {
        setSyncFeedback('All offline changes are up to date.');
      }
      if (onSyncComplete) onSyncComplete();
    } catch (err: any) {
      setSyncFeedback(err?.message || 'Sync failed');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  // If online and has queued items or just synced
  if (isOnline && queuedCount > 0) {
    return (
      <div className="fixed bottom-5 left-5 z-50 flex items-center space-x-3 bg-indigo-900/95 backdrop-blur-md text-white text-xs px-4 py-2.5 rounded-2xl shadow-xl border border-indigo-700 animate-in fade-in slide-in-from-bottom-2">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Connected — <strong>{queuedCount}</strong> offline change{queuedCount > 1 ? 's' : ''} ready to sync</span>
        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
        </button>
      </div>
    );
  }

  // Active Offline Banner
  if (!isOnline) {
    return (
      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white px-4 py-2.5 text-xs font-medium shadow-md sticky top-16 z-30 transition-all">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
            </span>
            <WifiOff className="w-4 h-4 shrink-0 text-amber-100" />
            <span>
              <strong>Offline Mode Active:</strong> You are viewing cached trip data.
              {queuedCount > 0 && (
                <span className="ml-1.5 px-2 py-0.5 rounded-full bg-amber-800/60 font-semibold text-amber-100">
                  {queuedCount} edit{queuedCount > 1 ? 's' : ''} queued
                </span>
              )}
            </span>
            {isSimulated && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-black/20 rounded-md">
                (Simulated)
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenOfflinePackModal}
              className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white font-semibold transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Offline Trip Pack</span>
            </button>

            {isSimulated ? (
              <button
                onClick={() => toggleSimulatedOffline(false)}
                className="px-2.5 py-1 rounded-lg bg-white text-amber-900 font-bold hover:bg-amber-50 transition-colors cursor-pointer"
              >
                Go Online
              </button>
            ) : (
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-black/25 hover:bg-black/35 text-white font-semibold transition-colors cursor-pointer"
                title="Attempt to reconnect and sync"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Reconnect</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Feedback toast when synced
  if (syncFeedback) {
    return (
      <div className="fixed bottom-5 left-5 z-50 flex items-center space-x-2 bg-emerald-600 text-white text-xs px-4 py-2.5 rounded-2xl shadow-xl animate-in fade-in slide-in-from-bottom-2">
        <CheckCircle2 className="w-4 h-4" />
        <span>{syncFeedback}</span>
      </div>
    );
  }

  return null;
};
