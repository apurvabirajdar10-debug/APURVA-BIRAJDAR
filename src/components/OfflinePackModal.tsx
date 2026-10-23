import React, { useState, useEffect } from 'react';
import {
  Download,
  Wifi,
  WifiOff,
  CheckCircle2,
  Phone,
  Shield,
  FileText,
  MapPin,
  Calendar,
  Ticket,
  Clock,
  RefreshCw,
  X,
  Printer,
  Smartphone,
  AlertTriangle,
  FolderDown,
  Check
} from 'lucide-react';
import { Trip, OfflineTripPack, EmergencyContact } from '../types/travel';
import { api } from '../lib/api';
import { offlineManager } from '../lib/offlineManager';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface OfflinePackModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
}

export const OfflinePackModal: React.FC<OfflinePackModalProps> = ({
  isOpen,
  onClose,
  trip,
}) => {
  const { isOnline, isSimulated, toggleSimulatedOffline, queuedCount } = useOnlineStatus();
  const [offlinePack, setOfflinePack] = useState<OfflineTripPack | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCachedLocally, setIsCachedLocally] = useState(false);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'emergency' | 'bookings' | 'queued'>('overview');
  const [queuedItems, setQueuedItems] = useState(offlineManager.getQueuedEdits());

  useEffect(() => {
    if (isOpen) {
      // Check if already in local storage cache
      const existing = offlineManager.getOfflinePack(trip.id);
      if (existing) {
        setOfflinePack(existing);
        setIsCachedLocally(true);
      } else {
        // Fetch from API to preview
        fetchPackFromApi();
      }
      setQueuedItems(offlineManager.getQueuedEdits());
    }
  }, [isOpen, trip.id]);

  const fetchPackFromApi = async () => {
    try {
      setIsDownloading(true);
      const res = await api.getOfflinePack(trip.id);
      setOfflinePack(res.pack);
    } catch (err) {
      console.warn('Could not fetch pack from backend, building fallback locally:', err);
      // Construct fallback offline pack
      const fallbackPack: OfflineTripPack = {
        tripId: trip.id,
        tripName: trip.name,
        downloadedAt: new Date().toISOString(),
        startDate: trip.start_date,
        endDate: trip.end_date,
        budgetTotal: trip.budget_total,
        totalSpent: trip.total_spent || 0,
        stops: trip.stops || [],
        bookings: [],
        emergencyContacts: [
          { label: 'National All-in-One Emergency', number: '112', description: 'Police, Fire, Ambulance in India', type: 'police' },
          { label: 'Tourist Helpline (24/7 Multi-language)', number: '1363', description: 'Ministry of Tourism India', type: 'tourist' },
          { label: 'Indian Railways Helpline (IRCTC / TTE)', number: '139', description: 'Train enquiries & onboard security', type: 'railway' },
          { label: 'Ambulance / Medical Emergency', number: '108', description: 'Emergency medical services', type: 'medical' }
        ],
        members: trip.members || [],
        proposals: trip.proposals || []
      };
      setOfflinePack(fallbackPack);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadAndCache = async () => {
    try {
      setIsDownloading(true);
      let packToSave = offlinePack;
      if (!packToSave) {
        const res = await api.getOfflinePack(trip.id);
        packToSave = res.pack;
      }
      if (packToSave) {
        offlineManager.saveOfflinePack(packToSave);
        setOfflinePack(packToSave);
        setIsCachedLocally(true);
        setDownloadSuccessToast('Offline Trip Pack cached! Available without cell reception or Wi-Fi.');
        setTimeout(() => setDownloadSuccessToast(null), 4000);
      }
    } catch (err: any) {
      alert(err.message || 'Could not download offline pack');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleExportJSON = () => {
    if (!offlinePack) return;
    offlineManager.downloadOfflineFile(offlinePack);
  };

  const handlePrintDossier = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2 text-sky-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Smartphone className="w-4 h-4" />
            <span>PWA Offline Vault & Trip Pack</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold font-serif-heading">
            Offline Trip Dossier: {trip.name}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-lg">
            Store full day schedules, confirmed booking vouchers, and verified emergency helplines locally on this device. Accessible in flight mode, remote valleys, and trains with spotty reception.
          </p>

          {/* Quick Action Pills in Header */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadAndCache}
              disabled={isDownloading}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-md ${
                isCachedLocally
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : 'bg-amber-400 hover:bg-amber-500 text-slate-950 font-black'
              }`}
            >
              {isCachedLocally ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Update Offline Cache</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Offline Pack</span>
                </>
              )}
            </button>

            <button
              onClick={handleExportJSON}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors flex items-center space-x-1 cursor-pointer"
            >
              <FolderDown className="w-3.5 h-3.5" />
              <span>Export JSON File</span>
            </button>

            <button
              onClick={handlePrintDossier}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors flex items-center space-x-1 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Dossier</span>
            </button>
          </div>
        </div>

        {/* Success Toast */}
        {downloadSuccessToast && (
          <div className="p-3 bg-emerald-600 text-white text-xs font-bold flex items-center justify-between px-6 shrink-0 animate-in fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{downloadSuccessToast}</span>
            </div>
            <span className="text-[10px] font-mono opacity-80">Encrypted Local Storage</span>
          </div>
        )}

        {/* Offline Simulation Control Bar */}
        <div className="bg-slate-100 px-6 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-700">Network Simulation:</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
            }`}>
              {isOnline ? 'Online (Live Sync)' : isSimulated ? 'Offline (Simulated)' : 'Offline (No Connection)'}
            </span>
          </div>

          <button
            onClick={() => toggleSimulatedOffline(!isSimulated)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              isSimulated
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-amber-500 text-slate-950 hover:bg-amber-600'
            }`}
          >
            {isSimulated ? (
              <>
                <Wifi className="w-3.5 h-3.5" />
                <span>Disable Offline Simulation</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span>Simulate Offline Mode Now</span>
              </>
            )}
          </button>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50 text-xs shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'overview'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Itinerary & Stops ({trip.stops?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('emergency')}
            className={`py-3 px-3 font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'emergency'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Phone className="w-3.5 h-3.5 text-rose-500" />
            <span>Emergency Contacts ({offlinePack?.emergencyContacts?.length || 4})</span>
          </button>

          <button
            onClick={() => setActiveTab('bookings')}
            className={`py-3 px-3 font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'bookings'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Ticket className="w-3.5 h-3.5 text-amber-500" />
            <span>Vouchers & PNRs ({offlinePack?.bookings?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('queued')}
            className={`py-3 px-3 font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'queued'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />
            <span>Queued Edits ({queuedItems.length})</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
          {/* TAB 1: OVERVIEW & STOPS */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-sky-800 uppercase font-bold">Trip Duration</span>
                  <div className="font-bold text-slate-900 text-sm">
                    {trip.start_date} to {trip.end_date}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-sky-800 uppercase font-bold">Total Budget</span>
                  <div className="font-bold text-slate-900 text-sm">
                    ₹{(trip.budget_total || 50000).toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-sky-800 uppercase font-bold">Status</span>
                  <div className="font-bold text-emerald-700 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isCachedLocally ? 'Cached for Offline' : 'Ready to Download'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Day-Wise Stops & Activities
                </h4>

                {trip.stops && trip.stops.length > 0 ? (
                  trip.stops.map((stop, idx) => (
                    <div key={stop.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 text-sm">{stop.city_name}</span>
                            <span className="text-slate-500 text-xs ml-1.5">({stop.country})</span>
                          </div>
                        </div>
                        <span className="text-slate-500 font-medium text-[11px]">
                          {stop.start_date} → {stop.end_date}
                        </span>
                      </div>

                      {/* Activities in this stop */}
                      {stop.activities && stop.activities.length > 0 && (
                        <div className="mt-3 pl-8 space-y-1.5 border-l-2 border-slate-200 ml-3">
                          {stop.activities.map(act => (
                            <div key={act.id} className="flex items-center justify-between text-xs py-1">
                              <span className="font-semibold text-slate-800">{act.title}</span>
                              <div className="flex items-center space-x-3 text-slate-500 text-[11px]">
                                <span className="capitalize">{act.time_slot}</span>
                                <span className="font-bold text-slate-900">₹{act.cost}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 italic">No stops added to this trip yet.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: EMERGENCY NUMBERS */}
          {activeTab === 'emergency' && (
            <div className="space-y-3">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 text-xs flex items-center space-x-2">
                <Shield className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  All numbers are verified emergency helplines. Tap any phone number to dial directly from your mobile device.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(offlinePack?.emergencyContacts || [
                  { label: 'All-in-One Emergency', number: '112', description: 'National emergency helpline (Police, Medical, Fire)', type: 'police' },
                  { label: 'Police Control Room', number: '100', description: 'Immediate local police assistance', type: 'police' },
                  { label: 'Tourist Helpline (24/7)', number: '1363', description: 'Multi-lingual Ministry of Tourism support', type: 'tourist' },
                  { label: 'Indian Railways Security (RPF)', number: '139', description: 'Train security, complaints & medical in-transit', type: 'railway' },
                  { label: 'Ambulance / EMS', number: '108', description: 'Toll-free emergency medical services', type: 'medical' },
                  { label: 'Women Helpline', number: '1091', description: '24/7 dedicated women safety & distress', type: 'police' }
                ]).map((contact, i) => (
                  <div key={i} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                          {contact.type}
                        </span>
                        <a
                          href={`tel:${contact.number}`}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-mono font-bold text-xs hover:bg-rose-700 transition-colors inline-flex items-center space-x-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Dial {contact.number}</span>
                        </a>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm mt-1">{contact.label}</h4>
                      <p className="text-slate-500 text-[11px] mt-0.5">{contact.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: BOOKINGS & PNRS */}
          {activeTab === 'bookings' && (
            <div className="space-y-3">
              {offlinePack?.bookings && offlinePack.bookings.length > 0 ? (
                offlinePack.bookings.map((bk: any, i: number) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                        {bk.type} • {bk.provider}
                      </span>
                      <strong className="font-mono text-emerald-800 text-xs">
                        Ref #{bk.confirmation_number}
                      </strong>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">{bk.title}</h4>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                      <div>Date: <strong className="text-slate-800">{bk.start_date}</strong></div>
                      <div>Location: <strong className="text-slate-800">{bk.location}</strong></div>
                      <div>Amount: <strong className="text-slate-900">₹{bk.amount}</strong></div>
                      {bk.notes && <div>Notes: {bk.notes}</div>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                  <Ticket className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">No confirmed booking vouchers yet</p>
                  <p className="text-[11px] text-slate-400">
                    Use the 'Bookings' section or AI Booking Import tool to attach confirmed transit tickets and hotel stays.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: QUEUED EDITS */}
          {activeTab === 'queued' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">
                  Edits made while offline will be automatically dispatched once connectivity returns.
                </span>
                {queuedItems.length > 0 && (
                  <button
                    onClick={async () => {
                      await offlineManager.syncQueuedEdits();
                      setQueuedItems(offlineManager.getQueuedEdits());
                    }}
                    className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                  >
                    Sync Now
                  </button>
                )}
              </div>

              {queuedItems.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">All local edits synced</p>
                  <p className="text-[11px] text-slate-400">
                    No pending mutations in your offline queue.
                  </p>
                </div>
              ) : (
                queuedItems.map((item) => (
                  <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="font-mono text-[10px] text-indigo-700 uppercase font-bold">
                        {item.type.replace('_', ' ')}
                      </span>
                      <p className="text-[11px] text-slate-800 font-semibold">
                        {item.description}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Queued at {new Date(item.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                      Pending Sync
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500">
            {isCachedLocally ? (
              <span className="text-emerald-700 font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Cached on this device</span>
              </span>
            ) : (
              <span>Not cached locally yet</span>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
