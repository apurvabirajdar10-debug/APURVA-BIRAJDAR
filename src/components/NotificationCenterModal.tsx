import React, { useState, useEffect } from 'react';
import { X, Bell, Moon, ShieldAlert, Sparkles, AlertCircle, Check, Trash2, Sliders, ToggleLeft, ToggleRight, Clock, PlusCircle } from 'lucide-react';
import { Trip, NotificationItem, NotificationSettings } from '../types/travel';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  trips: Trip[];
  activeTrip: Trip | null;
  onNavigateTab?: (tab: string) => void;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  quietHoursEnabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  allowCriticalInQuiet: true,
  tiers: {
    critical: true,
    helpful: true,
    optional: true,
  },
  tripToggles: {},
};

const SEEDED_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    tier: 'critical',
    title: 'Severe Thunderstorm Warning',
    message: 'Rain precipitation > 80% forecast for Rome tomorrow afternoon. Indoor contingency rerouting recommended.',
    timestamp: '15 mins ago',
    read: false,
    actionTab: 'weather',
  },
  {
    id: 'notif-2',
    tier: 'critical',
    title: 'Inbound Transit Delay Alert',
    message: 'Frecciarossa 9614 train arrival running 35 minutes late due to signal maintenance.',
    timestamp: '1 hour ago',
    read: false,
    actionTab: 'bookings',
  },
  {
    id: 'notif-3',
    tier: 'helpful',
    title: 'Activity Starting Soon: Colosseum Guided Tour',
    message: 'Starts at 10:00 AM at Piazza del Colosseo. Bring physical passport and skip-the-line QR voucher.',
    timestamp: '3 hours ago',
    read: true,
    actionTab: 'itinerary',
  },
  {
    id: 'notif-4',
    tier: 'helpful',
    title: 'Budget Alert: 82% of Target Reached',
    message: 'You have spent ₹1,98,400 of your ₹2,40,000 budget. 3 budget-friendly swaps are available in the catalog.',
    timestamp: '5 hours ago',
    read: false,
    actionTab: 'budget',
  },
  {
    id: 'notif-5',
    tier: 'optional',
    title: 'Hidden Gem Recommendation: Trastevere Bakery',
    message: 'Local traveler favorite Biscottificio Innocenti is just 300m from your evening stroll route.',
    timestamp: 'Yesterday',
    read: true,
    actionTab: 'search',
  },
];

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  trips,
  activeTrip,
  onNavigateTab,
}) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'settings'>('feed');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);

  // Load from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('gt_notification_settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        setSettings(DEFAULT_SETTINGS);
      }
    }

    const savedNotifs = localStorage.getItem('gt_notifications');
    if (savedNotifs) {
      try {
        setNotifications(JSON.parse(savedNotifs));
      } catch (e) {
        setNotifications(SEEDED_NOTIFICATIONS);
      }
    } else {
      setNotifications(SEEDED_NOTIFICATIONS);
      localStorage.setItem('gt_notifications', JSON.stringify(SEEDED_NOTIFICATIONS));
    }
  }, []);

  const saveSettings = (updated: NotificationSettings) => {
    setSettings(updated);
    localStorage.setItem('gt_notification_settings', JSON.stringify(updated));
  };

  const saveNotifications = (updated: NotificationItem[]) => {
    setNotifications(updated);
    localStorage.setItem('gt_notifications', JSON.stringify(updated));
  };

  if (!isOpen) return null;

  const handleMarkAsRead = (id: string) => {
    saveNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllRead = () => {
    saveNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleClearAll = () => {
    saveNotifications([]);
  };

  const handleSimulateAlert = (tier: 'critical' | 'helpful' | 'optional', title: string, message: string, actionTab: string) => {
    const newNotif: NotificationItem = {
      id: `sim-${Date.now()}`,
      tripId: activeTrip?.id,
      tripName: activeTrip?.name,
      tier,
      title,
      message,
      timestamp: 'Just now',
      read: false,
      actionTab,
    };
    saveNotifications([newNotif, ...notifications]);
    setActiveTab('feed');
  };

  const filteredNotifs = filterTier === 'all'
    ? notifications
    : notifications.filter(n => n.tier === filterTier);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold font-serif-heading">Notification Center</h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300">
                Tiered alerts (Critical, Helpful, Optional), quiet hours, and per-trip preferences
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch bar: Feed vs Settings */}
        <div className="px-6 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('feed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'feed'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Live Alerts Feed ({notifications.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'settings'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Tiers & Quiet Hours</span>
            </button>
          </div>

          {activeTab === 'feed' && notifications.length > 0 && (
            <div className="flex items-center space-x-2 text-xs">
              <button
                onClick={handleMarkAllRead}
                className="text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
              >
                Mark all read
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={handleClearAll}
                className="text-slate-400 hover:text-rose-600 font-semibold cursor-pointer"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeTab === 'feed' ? (
            <div className="space-y-4">
              {/* Quick simulation tester */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-200/60 space-y-2">
                <p className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Test Notification Delivery Engine:</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleSimulateAlert('critical', 'Flight Delayed by 45m', 'IndiGo flight 6E-204 departure rescheduled due to runway congestion.', 'bookings')}
                    className="px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    + Critical Alert (Delay)
                  </button>
                  <button
                    onClick={() => handleSimulateAlert('helpful', 'Rain Warning at 2 PM', 'Heavy showers predicted in city center. Grab an umbrella from your packing pack.', 'weather')}
                    className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    + Helpful Alert (Rain)
                  </button>
                  <button
                    onClick={() => handleSimulateAlert('optional', 'Sunset Rooftop Spot', 'Terrace panoramic view opens at 6:30 PM with live acoustic sets.', 'itinerary')}
                    className="px-2.5 py-1 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-800 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    + Optional Alert (Perk)
                  </button>
                </div>
              </div>

              {/* Tier Filter Tabs */}
              <div className="flex items-center space-x-2 text-xs">
                <button
                  onClick={() => setFilterTier('all')}
                  className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    filterTier === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  onClick={() => setFilterTier('critical')}
                  className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    filterTier === 'critical' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  Critical ({notifications.filter(n => n.tier === 'critical').length})
                </button>
                <button
                  onClick={() => setFilterTier('helpful')}
                  className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    filterTier === 'helpful' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  Helpful ({notifications.filter(n => n.tier === 'helpful').length})
                </button>
                <button
                  onClick={() => setFilterTier('optional')}
                  className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    filterTier === 'optional' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700'
                  }`}
                >
                  Optional ({notifications.filter(n => n.tier === 'optional').length})
                </button>
              </div>

              {/* Notification List */}
              {filteredNotifs.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <Bell className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-600">No notifications in this tier</p>
                  <p className="text-[11px] text-slate-400">All travel alerts will appear here in real-time.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredNotifs.map(n => {
                    const isCritical = n.tier === 'critical';
                    const isHelpful = n.tier === 'helpful';
                    return (
                      <div
                        key={n.id}
                        onClick={() => handleMarkAsRead(n.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                          !n.read
                            ? isCritical
                              ? 'bg-rose-50/50 border-rose-300 ring-1 ring-rose-200'
                              : isHelpful
                              ? 'bg-amber-50/50 border-amber-200'
                              : 'bg-indigo-50/50 border-indigo-200'
                            : 'bg-white border-slate-200 opacity-80'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                              isCritical ? 'bg-rose-600 text-white' : isHelpful ? 'bg-amber-500 text-white' : 'bg-indigo-600 text-white'
                            }`}>
                              {n.tier}
                            </span>
                            {!n.read && (
                              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                            )}
                            <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">{n.timestamp}</span>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed font-normal">{n.message}</p>

                        {n.actionTab && onNavigateTab && (
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(n.id);
                                onNavigateTab(n.actionTab!);
                                onClose();
                              }}
                              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 underline cursor-pointer"
                            >
                              Go to {n.actionTab.toUpperCase()} View →
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* SETTINGS TAB */
            <div className="space-y-6">
              {/* Quiet Hours Configuration */}
              <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <Moon className="w-5 h-5 text-indigo-600" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Quiet Hours Mode</h4>
                      <p className="text-[11px] text-slate-500">Mutes non-urgent audio and push alerts during sleep</p>
                    </div>
                  </div>
                  <button
                    onClick={() => saveSettings({ ...settings, quietHoursEnabled: !settings.quietHoursEnabled })}
                    className="text-indigo-600 cursor-pointer"
                  >
                    {settings.quietHoursEnabled ? (
                      <ToggleRight className="w-8 h-8 text-indigo-600" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-slate-400" />
                    )}
                  </button>
                </div>

                {settings.quietHoursEnabled && (
                  <div className="pt-3 border-t border-slate-200/60 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Quiet Hours Start
                        </label>
                        <input
                          type="time"
                          value={settings.quietHoursStart}
                          onChange={(e) => saveSettings({ ...settings, quietHoursStart: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Quiet Hours End
                        </label>
                        <input
                          type="time"
                          value={settings.quietHoursEnd}
                          onChange={(e) => saveSettings({ ...settings, quietHoursEnd: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-800"
                        />
                      </div>
                    </div>

                    <label className="flex items-center space-x-2.5 cursor-pointer text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={settings.allowCriticalInQuiet}
                        onChange={(e) => saveSettings({ ...settings, allowCriticalInQuiet: e.target.checked })}
                        className="rounded text-indigo-600"
                      />
                      <span className="font-semibold text-rose-700">
                        Always allow Critical alerts (e.g. flight delays, severe weather) during Quiet Hours
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {/* Tier Toggles */}
              <div className="p-4.5 rounded-2xl bg-white border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Notification Tier Subscriptions
                </h4>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                    <div>
                      <p className="font-bold text-rose-700">Critical Alerts</p>
                      <p className="text-[11px] text-slate-500">Flight cancellations, severe storm alarms, passport deadlines</p>
                    </div>
                    <button
                      onClick={() => saveSettings({ ...settings, tiers: { ...settings.tiers, critical: !settings.tiers.critical } })}
                      className="cursor-pointer"
                    >
                      {settings.tiers.critical ? <ToggleRight className="w-7 h-7 text-rose-600" /> : <ToggleLeft className="w-7 h-7 text-slate-400" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                    <div>
                      <p className="font-bold text-amber-700">Helpful Alerts</p>
                      <p className="text-[11px] text-slate-500">Activity 2h reminder, check-in prompts, budget warnings</p>
                    </div>
                    <button
                      onClick={() => saveSettings({ ...settings, tiers: { ...settings.tiers, helpful: !settings.tiers.helpful } })}
                      className="cursor-pointer"
                    >
                      {settings.tiers.helpful ? <ToggleRight className="w-7 h-7 text-amber-600" /> : <ToggleLeft className="w-7 h-7 text-slate-400" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                    <div>
                      <p className="font-bold text-indigo-700">Optional Perks & Insights</p>
                      <p className="text-[11px] text-slate-500">Local secret eateries, golden hour photo spots, verified guides</p>
                    </div>
                    <button
                      onClick={() => saveSettings({ ...settings, tiers: { ...settings.tiers, optional: !settings.tiers.optional } })}
                      className="cursor-pointer"
                    >
                      {settings.tiers.optional ? <ToggleRight className="w-7 h-7 text-indigo-600" /> : <ToggleLeft className="w-7 h-7 text-slate-400" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Per-Trip Toggles */}
              <div className="p-4.5 rounded-2xl bg-white border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Per-Trip Notifications
                </h4>
                <div className="space-y-2">
                  {trips.map(t => {
                    const enabled = settings.tripToggles[t.id] !== false;
                    return (
                      <div key={t.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 text-xs">
                        <span className="font-bold text-slate-800 truncate max-w-xs">{t.name}</span>
                        <button
                          onClick={() => {
                            saveSettings({
                              ...settings,
                              tripToggles: { ...settings.tripToggles, [t.id]: !enabled },
                            });
                          }}
                          className="text-xs font-semibold cursor-pointer"
                        >
                          {enabled ? (
                            <span className="text-emerald-600 font-bold">Enabled</span>
                          ) : (
                            <span className="text-slate-400">Muted</span>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
