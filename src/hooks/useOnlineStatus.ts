import { useState, useEffect } from 'react';
import { offlineManager } from '../lib/offlineManager';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(offlineManager.isOnline());
  const [queuedCount, setQueuedCount] = useState<number>(offlineManager.getQueuedEdits().length);
  const [isSimulated, setIsSimulated] = useState<boolean>(offlineManager.isSimulatedOffline());

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(offlineManager.isOnline());
      setIsSimulated(offlineManager.isSimulatedOffline());
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsSimulated(offlineManager.isSimulatedOffline());
    };

    const handleQueueUpdated = (e: any) => {
      setQueuedCount(e?.detail?.count ?? offlineManager.getQueuedEdits().length);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('simulated-offline', handleOffline);
    window.addEventListener('simulated-online', handleOnline);
    window.addEventListener('offline-queue-updated', handleQueueUpdated);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('simulated-offline', handleOffline);
      window.removeEventListener('simulated-online', handleOnline);
      window.removeEventListener('offline-queue-updated', handleQueueUpdated);
    };
  }, []);

  return {
    isOnline,
    queuedCount,
    isSimulated,
    toggleSimulatedOffline: (val: boolean) => {
      offlineManager.setSimulatedOffline(val);
      setIsSimulated(val);
      setIsOnline(offlineManager.isOnline());
    },
  };
}
