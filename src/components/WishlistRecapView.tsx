import React, { useState, useEffect } from 'react';
import { Heart, Target, TrendingUp, Plus, Sparkles, Check, Share2, Copy, Download, Calendar, MapPin, IndianRupee, Trophy, ArrowRight, Plane, Image as ImageIcon } from 'lucide-react';
import { Trip, WishlistItem, User } from '../types/travel';
import { api } from '../lib/api';

interface WishlistRecapViewProps {
  trips: Trip[];
  activeTrip: Trip | null;
  user: User | null;
  onTripCreated: (newTrip: Trip) => void;
  onSelectTrip: (trip: Trip, tab?: string) => void;
}

const SEEDED_WISHLIST: WishlistItem[] = [
  {
    id: 'wish-1',
    destination: 'Northern Lights & Fjord Expedition',
    country: 'Norway',
    imageUrl: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1200&q=80',
    targetBudget: 280000,
    currentSaved: 168000,
    targetDate: '2026-12',
    notes: 'Stay in a glass igloo in Tromsø, dog-sledding through Arctic valleys, and chasing aurora borealis.',
    createdAt: '2026-01-15',
  },
  {
    id: 'wish-2',
    destination: 'Spring Cherry Blossoms & Ryokan Serenity',
    country: 'Japan',
    imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
    targetBudget: 220000,
    currentSaved: 195000,
    targetDate: '2027-04',
    notes: 'Philosopher Path in Kyoto, Mount Fuji viewpoints, and kaiseki multi-course dinners in Hakone onsens.',
    createdAt: '2026-02-10',
  },
  {
    id: 'wish-3',
    destination: 'Amalfi Coast Cliffside Roadtrip & Capri Grottos',
    country: 'Italy',
    imageUrl: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80',
    targetBudget: 190000,
    currentSaved: 85000,
    targetDate: '2026-09',
    notes: 'Positano pastel houses, Path of the Gods hike, and private boat charter to Capri Blue Grotto.',
    createdAt: '2026-03-01',
  },
];

export const WishlistRecapView: React.FC<WishlistRecapViewProps> = ({
  trips,
  activeTrip,
  user,
  onTripCreated,
  onSelectTrip,
}) => {
  const [activeTab, setActiveTab] = useState<'wishlist' | 'recap'>('wishlist');
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [selectedTripForRecap, setSelectedTripForRecap] = useState<Trip | null>(activeTrip || trips[0] || null);

  // Modals & form state
  const [addWishModalOpen, setAddWishModalOpen] = useState(false);
  const [depositModalItem, setDepositModalItem] = useState<WishlistItem | null>(null);
  const [depositAmount, setDepositAmount] = useState<number>(5000);
  const [copyShareToast, setCopyShareToast] = useState(false);

  // New wishlist item fields
  const [newDestination, setNewDestination] = useState('');
  const [newCountry, setNewCountry] = useState('');
  const [newTargetBudget, setNewTargetBudget] = useState<number>(150000);
  const [newInitialSaved, setNewInitialSaved] = useState<number>(20000);
  const [newTargetDate, setNewTargetDate] = useState('2026-11');
  const [newNotes, setNewNotes] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');

  // Load wishlist from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('gt_wishlist');
    if (saved) {
      try {
        setWishlist(JSON.parse(saved));
      } catch {
        setWishlist(SEEDED_WISHLIST);
      }
    } else {
      setWishlist(SEEDED_WISHLIST);
      localStorage.setItem('gt_wishlist', JSON.stringify(SEEDED_WISHLIST));
    }
  }, []);

  const saveWishlist = (items: WishlistItem[]) => {
    setWishlist(items);
    localStorage.setItem('gt_wishlist', JSON.stringify(items));
  };

  const handleDepositSavings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositModalItem || depositAmount <= 0) return;

    const updated = wishlist.map(item =>
      item.id === depositModalItem.id
        ? { ...item, currentSaved: Math.min(item.targetBudget, item.currentSaved + depositAmount) }
        : item
    );
    saveWishlist(updated);
    setDepositModalItem(null);
  };

  const handleCreateWishlistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDestination.trim() || !newCountry.trim()) return;

    const newItem: WishlistItem = {
      id: `wish-${Date.now()}`,
      destination: newDestination.trim(),
      country: newCountry.trim(),
      imageUrl: newImageUrl.trim() || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
      targetBudget: Number(newTargetBudget) || 100000,
      currentSaved: Number(newInitialSaved) || 0,
      targetDate: newTargetDate,
      notes: newNotes.trim(),
      createdAt: new Date().toISOString().split('T')[0],
    };

    saveWishlist([newItem, ...wishlist]);
    setAddWishModalOpen(false);
    setNewDestination('');
    setNewCountry('');
    setNewNotes('');
    setNewImageUrl('');
  };

  const handlePromoteToTrip = async (item: WishlistItem) => {
    try {
      const res = await api.createTrip({
        name: `${item.destination}`,
        start_date: `${item.targetDate}-01`,
        end_date: `${item.targetDate}-10`,
        budget_total: item.targetBudget,
        description: item.notes || `Dream journey to ${item.destination}, ${item.country}`,
        cover_image: item.imageUrl,
        is_public: false,
      });

      onTripCreated(res.trip);
      alert(`🎉 Wishlist goal promoted! "${item.destination}" is now an active trip!`);
    } catch (err: any) {
      alert(err.message || 'Could not promote to trip');
    }
  };

  const handleCopyRecapSummary = () => {
    if (!selectedTripForRecap) return;
    const recapText = `✈️ My Travel Recap: ${selectedTripForRecap.name}
📍 Explored ${selectedTripForRecap.stops?.length || 1} destinations (${selectedTripForRecap.stops?.map(s => s.city_name).join(', ')})
🎯 Budget: ₹${selectedTripForRecap.budget_total?.toLocaleString('en-IN')} (Spent: ₹${(selectedTripForRecap.total_spent || 0).toLocaleString('en-IN')})
✨ Activities: ${selectedTripForRecap.stops?.flatMap(s => s.activities || []).length || 0} unforgettable moments
Created with Globe Trotter Multi-City Travel Planner!`;

    navigator.clipboard.writeText(recapText);
    setCopyShareToast(true);
    setTimeout(() => setCopyShareToast(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold">
              <Target className="w-3.5 h-3.5" />
              <span>Travel Savings Goals & Post-Trip Memories</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-serif-heading">
              Wishlist Goals & Trip Recap
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Track progress toward dream bucket-list journeys with monthly savings targets, and generate beautiful, shareable post-trip visual recap cards after adventures conclude.
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-slate-900/60 p-1 rounded-2xl border border-slate-700/80 backdrop-blur-md">
            <button
              onClick={() => setActiveTab('wishlist')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'wishlist'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Wishlist Goals ({wishlist.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('recap')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'recap'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Trip Recap Card</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: WISHLIST SAVINGS GOALS */}
      {activeTab === 'wishlist' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 font-serif-heading">
              Bucket List Destinations & Savings Progress
            </h2>
            <button
              onClick={() => setAddWishModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Destination Goal</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map(item => {
              const progressPct = Math.min(100, Math.round((item.currentSaved / item.targetBudget) * 100));
              const remainingAmount = Math.max(0, item.targetBudget - item.currentSaved);

              // Calculate monthly savings suggestion
              const targetDateObj = new Date(`${item.targetDate}-01`);
              const now = new Date();
              const monthsRemaining = Math.max(1, (targetDateObj.getFullYear() - now.getFullYear()) * 12 + (targetDateObj.getMonth() - now.getMonth()));
              const monthlyNeeded = Math.round(remainingAmount / monthsRemaining);

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {/* Image Header */}
                    <div className="relative aspect-[16/9] bg-slate-900 overflow-hidden">
                      <img
                        src={item.imageUrl}
                        alt={item.destination}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-emerald-400 font-extrabold text-xs border border-emerald-500/30">
                        {progressPct}% Funded
                      </div>
                      <div className="absolute bottom-3 left-3 text-white space-y-0.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300">
                          {item.country}
                        </span>
                        <h3 className="text-sm font-bold line-clamp-1">{item.destination}</h3>
                      </div>
                    </div>

                    {/* Savings Tracker Body */}
                    <div className="p-5 space-y-4">
                      {/* Financial Progress Bar */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900 font-mono">
                            ₹{item.currentSaved.toLocaleString('en-IN')}
                          </span>
                          <span className="text-slate-400 font-mono">
                            Goal: ₹{item.targetBudget.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Monthly Savings Calculator Prompt */}
                      <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-[11px] text-emerald-900 space-y-1">
                        <div className="flex items-center justify-between font-bold">
                          <span>Target: {item.targetDate}</span>
                          <span>{monthsRemaining} months away</span>
                        </div>
                        <p className="text-emerald-800/80">
                          {remainingAmount > 0
                            ? `Save ₹${monthlyNeeded.toLocaleString('en-IN')}/month to reach 100% on schedule.`
                            : '🎉 Congratulations! Full budget has been secured!'}
                        </p>
                      </div>

                      {item.notes && (
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-normal">
                          {item.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="p-5 pt-0 border-t border-slate-100 grid grid-cols-2 gap-2 mt-2">
                    <button
                      onClick={() => setDepositModalItem(item)}
                      className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Deposit ₹</span>
                    </button>
                    <button
                      onClick={() => handlePromoteToTrip(item)}
                      className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-1 cursor-pointer shadow-xs"
                      title="Convert this wishlist goal into an active itinerary"
                    >
                      <Plane className="w-3.5 h-3.5" />
                      <span>Promote to Trip</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: SHAREABLE TRIP RECAP CARD */}
      {activeTab === 'recap' && (
        <div className="space-y-6">
          {/* Trip Selector for Recap */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between gap-4">
            <span className="text-xs font-bold text-slate-700 shrink-0">Select Trip for Recap Card:</span>
            <select
              value={selectedTripForRecap?.id || ''}
              onChange={(e) => {
                const found = trips.find(t => t.id === Number(e.target.value));
                if (found) setSelectedTripForRecap(found);
              }}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 focus:outline-none"
            >
              {trips.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.start_date})</option>
              ))}
            </select>
          </div>

          {selectedTripForRecap ? (
            <div className="max-w-2xl mx-auto space-y-4">
              {copyShareToast && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold text-center animate-in fade-in">
                  Recap summary copied to clipboard! Share it on WhatsApp or Instagram.
                </div>
              )}

              {/* Instagram-Story / Passport Style Visual Card */}
              <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 rounded-3xl p-8 text-white shadow-2xl border border-slate-800 space-y-6 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Card Top Stamp */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">🌍</span>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-indigo-300 font-extrabold">Globe Trotter Expedition Dossier</p>
                      <h3 className="text-xl font-bold font-serif-heading">{selectedTripForRecap.name}</h3>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
                    Verified Journey
                  </span>
                </div>

                {/* Hero Photo Collage */}
                <div className="relative aspect-[16/9] rounded-2xl overflow-hidden shadow-lg border border-white/10">
                  <img
                    src={selectedTripForRecap.cover_image || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80'}
                    alt={selectedTripForRecap.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <span className="text-xs font-bold text-white drop-shadow-sm flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-300" />
                      <span>{selectedTripForRecap.start_date} to {selectedTripForRecap.end_date}</span>
                    </span>
                    <span className="text-xs font-bold text-amber-300 font-mono">
                      {selectedTripForRecap.stops?.length || 1} Cities Explored
                    </span>
                  </div>
                </div>

                {/* Key Stats Metrics */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Cities Visited</p>
                    <p className="text-xl font-black text-white">{selectedTripForRecap.stops?.length || 1}</p>
                    <p className="text-[10px] text-indigo-300 truncate">{selectedTripForRecap.stops?.map(s => s.city_name).join(', ') || 'Global'}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Total Activities</p>
                    <p className="text-xl font-black text-amber-300">
                      {selectedTripForRecap.stops?.flatMap(s => s.activities || []).length || 0}
                    </p>
                    <p className="text-[10px] text-slate-400">Memories Crafted</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Budget Spent</p>
                    <p className="text-xl font-black text-emerald-400 font-mono">
                      ₹{(selectedTripForRecap.total_spent || 0).toLocaleString('en-IN')}
                    </p>
                    <p className="text-[10px] text-emerald-300">Target ₹{selectedTripForRecap.budget_total?.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                {/* Footer Signature */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Traveler: <strong className="text-white">{user?.name || 'Globe Trotter Explorer'}</strong></span>
                  <span>globetrotter.io/recap</span>
                </div>
              </div>

              {/* Share and Export Buttons */}
              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={handleCopyRecapSummary}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-2 cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Copy Shareable Text Summary</span>
                </button>
                <button
                  onClick={() => alert('Recap card ready for snapshotting and Instagram story sharing!')}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Save Image Snapshot</span>
                </button>
              </div>
            </div>
          ) : (
            <p className="text-center text-xs text-slate-500 py-8">No trip selected for recap.</p>
          )}
        </div>
      )}

      {/* MODAL 1: ADD WISHLIST ITEM */}
      {addWishModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-serif-heading">Add Wishlist Destination</h3>
                <p className="text-xs text-slate-500">Set a savings target and goal date</p>
              </div>
              <button
                onClick={() => setAddWishModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWishlistItem} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Destination Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Swiss Alps Explorer"
                    value={newDestination}
                    onChange={(e) => setNewDestination(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Country</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Switzerland"
                    value={newCountry}
                    onChange={(e) => setNewCountry(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Budget (₹)</label>
                  <input
                    type="number"
                    required
                    min={1000}
                    value={newTargetBudget}
                    onChange={(e) => setNewTargetBudget(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Current Saved (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={newInitialSaved}
                    onChange={(e) => setNewInitialSaved(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Date (Month & Year)</label>
                <input
                  type="month"
                  required
                  value={newTargetDate}
                  onChange={(e) => setNewTargetDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cover Image URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dream Highlights & Notes</label>
                <textarea
                  rows={2}
                  placeholder="Key spots, railway routes, special food you want to experience..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAddWishModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Save Wishlist Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DEPOSIT SAVINGS */}
      {depositModalItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-slate-900 font-serif-heading">
              Deposit to {depositModalItem.destination}
            </h3>
            <p className="text-xs text-slate-500">
              Current savings: ₹{depositModalItem.currentSaved.toLocaleString('en-IN')} of ₹{depositModalItem.targetBudget.toLocaleString('en-IN')}
            </p>

            <form onSubmit={handleDepositSavings} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Deposit Amount (₹)</label>
                <input
                  type="number"
                  min={500}
                  step={500}
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDepositModalItem(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Record Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
