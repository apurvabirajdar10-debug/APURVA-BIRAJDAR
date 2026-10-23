import { OfflineTripPack, EmergencyContact } from '../types/travel';
import { api } from './api';

export interface QueuedOfflineEdit {
  id: string;
  type: 'vote_proposal' | 'propose_activity' | 'add_expense' | 'add_activity' | 'add_stop';
  tripId: number;
  payload: any;
  timestamp: string;
  description: string;
}

const OFFLINE_PACK_KEY_PREFIX = 'gt_offline_pack_';
const OFFLINE_QUEUE_KEY = 'gt_offline_edits_queue';
const OFFLINE_SIMULATION_KEY = 'gt_offline_simulated';

export const offlineManager = {
  // Check if simulated offline mode is toggled on
  isSimulatedOffline(): boolean {
    return localStorage.getItem(OFFLINE_SIMULATION_KEY) === 'true';
  },

  setSimulatedOffline(val: boolean) {
    localStorage.setItem(OFFLINE_SIMULATION_KEY, String(val));
    window.dispatchEvent(new Event(val ? 'simulated-offline' : 'simulated-online'));
  },

  // Effective online status
  isOnline(): boolean {
    if (this.isSimulatedOffline()) return false;
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  },

  // Save full pack to local storage
  saveOfflinePack(pack: OfflineTripPack) {
    try {
      localStorage.setItem(`${OFFLINE_PACK_KEY_PREFIX}${pack.tripId}`, JSON.stringify(pack));
      const cachedTrips = this.getCachedTripsList();
      if (!cachedTrips.some(t => t.tripId === pack.tripId)) {
        cachedTrips.push({
          tripId: pack.tripId,
          tripName: pack.tripName,
          downloadedAt: pack.downloadedAt,
          stopsCount: pack.stops?.length || 0,
        });
        localStorage.setItem('gt_offline_cached_index', JSON.stringify(cachedTrips));
      }
    } catch (e) {
      console.warn('Could not save offline trip pack to localStorage:', e);
    }
  },

  // Retrieve cached pack for a trip
  getOfflinePack(tripId: number): OfflineTripPack | null {
    try {
      const raw = localStorage.getItem(`${OFFLINE_PACK_KEY_PREFIX}${tripId}`);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to parse offline pack:', e);
      return null;
    }
  },

  // Get all indexed cached trips
  getCachedTripsList(): { tripId: number; tripName: string; downloadedAt: string; stopsCount: number }[] {
    try {
      const raw = localStorage.getItem('gt_offline_cached_index');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  // Remove cached pack
  removeOfflinePack(tripId: number) {
    localStorage.removeItem(`${OFFLINE_PACK_KEY_PREFIX}${tripId}`);
    const list = this.getCachedTripsList().filter(t => t.tripId !== tripId);
    localStorage.setItem('gt_offline_cached_index', JSON.stringify(list));
  },

  // Queued edits management
  getQueuedEdits(): QueuedOfflineEdit[] {
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  queueEdit(edit: Omit<QueuedOfflineEdit, 'id' | 'timestamp'>) {
    const list = this.getQueuedEdits();
    const newEntry: QueuedOfflineEdit = {
      ...edit,
      id: 'queue-' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
    };
    list.push(newEntry);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('offline-queue-updated', { detail: { count: list.length } }));
    return newEntry;
  },

  clearQueue() {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
    window.dispatchEvent(new CustomEvent('offline-queue-updated', { detail: { count: 0 } }));
  },

  // Sync queued edits to the server
  async syncQueuedEdits(): Promise<{ success: number; failed: number; errors: string[] }> {
    const edits = this.getQueuedEdits();
    if (edits.length === 0) return { success: 0, failed: 0, errors: [] };

    let successCount = 0;
    const errors: string[] = [];
    const remaining: QueuedOfflineEdit[] = [];

    for (const item of edits) {
      try {
        if (item.type === 'vote_proposal') {
          await api.voteProposal(item.payload.proposalId, item.payload.vote, item.payload.userName);
        } else if (item.type === 'propose_activity') {
          await api.proposeActivity(item.tripId, item.payload);
        } else if (item.type === 'add_activity') {
          await api.addActivity(item.tripId, item.payload);
        } else if (item.type === 'add_expense') {
          await api.addExpense(item.tripId, item.payload);
        } else if (item.type === 'add_stop') {
          await api.addStop(item.tripId, item.payload);
        }
        successCount++;
      } catch (err: any) {
        console.warn('Failed to sync offline item:', item, err);
        errors.push(err?.message || 'Sync error');
        remaining.push(item);
      }
    }

    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
    window.dispatchEvent(new CustomEvent('offline-queue-updated', { detail: { count: remaining.length } }));

    return {
      success: successCount,
      failed: remaining.length,
      errors,
    };
  },

  // Download Offline Pack as a standalone offline HTML file (contains all itinerary, bookings & emergency numbers)
  downloadOfflineFile(pack: OfflineTripPack) {
    const jsonStr = JSON.stringify(pack, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pack.tripName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-offline-pack.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
