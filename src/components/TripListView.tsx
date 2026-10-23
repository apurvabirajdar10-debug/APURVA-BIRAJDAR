import React, { useState } from 'react';
import { Plus, Sparkles, MapPin, Calendar, IndianRupee, Edit3, Trash2, Copy, Share2, Eye, Search, AlertCircle, Check, Filter } from 'lucide-react';
import { Trip } from '../types/travel';
import { api } from '../lib/api';

interface TripListViewProps {
  trips: Trip[];
  onSelectTrip: (trip: Trip, tab?: string) => void;
  onOpenCreateTrip: () => void;
  onEditTrip: (trip: Trip) => void;
  onOpenAIAssistant: () => void;
  onTripDeleted: (tripId: number) => void;
  onTripDuplicated: (newTrip: Trip) => void;
  onViewPublic: (slug: string) => void;
}

export const TripListView: React.FC<TripListViewProps> = ({
  trips,
  onSelectTrip,
  onOpenCreateTrip,
  onEditTrip,
  onOpenAIAssistant,
  onTripDeleted,
  onTripDuplicated,
  onViewPublic,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'inprogress' | 'past'>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [copyingId, setCopyingId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredTrips = trips.filter((trip) => {
    // Search query match
    const query = searchQuery.toLowerCase().trim();
    const nameMatch = trip.name.toLowerCase().includes(query);
    const stopsMatch = trip.stops?.some(s =>
      s.city_name.toLowerCase().includes(query) || s.country.toLowerCase().includes(query)
    );
    const matchesSearch = !query || nameMatch || stopsMatch;

    if (!matchesSearch) return false;

    if (filterStatus === 'upcoming') {
      return trip.start_date > todayStr;
    } else if (filterStatus === 'past') {
      return trip.end_date < todayStr;
    } else if (filterStatus === 'inprogress') {
      return trip.start_date <= todayStr && trip.end_date >= todayStr;
    }
    return true;
  });

  const handleDelete = async (id: number) => {
    try {
      await api.deleteTrip(id);
      onTripDeleted(id);
      setDeleteConfirmId(null);
      showToast('Trip deleted successfully');
    } catch (err: any) {
      alert(err.message || 'Failed to delete trip');
    }
  };

  const handleDuplicate = async (id: number) => {
    setCopyingId(id);
    try {
      const res = await api.copyTrip(id);
      onTripDuplicated(res.trip);
      showToast('Trip cloned successfully into your itinerary list');
    } catch (err: any) {
      alert(err.message || 'Failed to copy trip');
    } finally {
      setCopyingId(null);
    }
  };

  const handleCopyShareLink = (trip: Trip) => {
    const url = `${window.location.origin}?share=${trip.public_slug}`;
    navigator.clipboard.writeText(url);
    showToast('Shareable link copied to clipboard!');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-2.5 rounded-2xl shadow-xl flex items-center space-x-2 text-xs font-semibold animate-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif-heading text-slate-900">My Trips</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your multi-city journeys, stops, dates, and budget plans
          </p>
        </div>
        <div className="flex items-center space-x-2.5">
          <button
            onClick={onOpenAIAssistant}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-sm flex items-center space-x-1.5 active:scale-95 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Assistant</span>
          </button>
          <button
            onClick={onOpenCreateTrip}
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm flex items-center space-x-1.5 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Trip</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by trip name or city..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'upcoming', 'inprogress', 'past'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors shrink-0 ${
                filterStatus === status
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {status === 'inprogress' ? 'In Progress' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Trip Cards Grid */}
      {filteredTrips.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-3">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-700">No trips matching criteria</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? 'Try modifying your search keywords or resetting filters.'
              : 'You have no trips in this category. Click below to start planning!'}
          </p>
          <button
            onClick={onOpenCreateTrip}
            className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-semibold hover:bg-sky-700"
          >
            Plan a Trip
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map((trip) => {
            const stopsCount = trip.destinations_count || trip.stops?.length || 0;
            const spent = trip.total_spent || 0;
            const budget = trip.budget_total || 0;
            const percent = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
            const isPast = trip.end_date < todayStr;
            const isCurrent = trip.start_date <= todayStr && trip.end_date >= todayStr;

            return (
              <div
                key={trip.id}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Card Cover */}
                  <div className="relative h-48 overflow-hidden group">
                    <img
                      src={trip.cover_image}
                      alt={trip.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                    {/* Top Status Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-[11px] font-semibold flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-sky-400" />
                        <span>{stopsCount} {stopsCount === 1 ? 'City' : 'Cities'}</span>
                      </span>

                      <div className="flex items-center space-x-1.5">
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider animate-pulse">
                            Active Now
                          </span>
                        )}
                        {isPast && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-500/80 text-white text-[10px] font-semibold uppercase">
                            Completed
                          </span>
                        )}
                        {trip.is_public && (
                          <span className="px-2 py-0.5 rounded-full bg-sky-500/80 text-white text-[10px] font-bold uppercase">
                            Public
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Title on Image */}
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h3 className="text-lg font-bold font-serif-heading leading-tight drop-shadow">
                        {trip.name}
                      </h3>
                      <p className="text-xs text-slate-200 mt-1 flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-sky-300" />
                        <span>{trip.start_date} → {trip.end_date}</span>
                      </p>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3">
                    {/* Stops List */}
                    {trip.stops && trip.stops.length > 0 && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">
                          Route Sequence
                        </span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {trip.stops.map((stop, sIdx) => (
                            <span
                              key={stop.id}
                              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium flex items-center space-x-1"
                            >
                              <span className="text-[10px] text-slate-600">{sIdx + 1}.</span>
                              <span>{stop.city_name}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {trip.description && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {trip.description}
                      </p>
                    )}

                    {/* Budget meter with Green, Yellow, Red States */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">
                          Budget: <strong className="text-slate-700">₹{budget.toLocaleString('en-IN')}</strong>
                        </span>
                        <div className="flex items-center space-x-1">
                          <span className={`w-2 h-2 rounded-full ${
                            spent > budget && budget > 0
                              ? 'bg-rose-500 animate-pulse'
                              : percent >= 80
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`} />
                          <span className={`text-[10px] font-bold ${
                            spent > budget && budget > 0
                              ? 'text-rose-600'
                              : percent >= 80
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                          }`}>
                            {spent > budget && budget > 0
                              ? 'Over Budget'
                              : percent >= 80
                              ? 'Near Limit'
                              : 'In Budget'}
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden p-0.5">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            spent > budget && budget > 0
                              ? 'bg-rose-500 shadow-xs shadow-rose-500/50'
                              : percent >= 80
                              ? 'bg-amber-500 shadow-xs shadow-amber-500/50'
                              : 'bg-emerald-500 shadow-xs shadow-emerald-500/50'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>₹{spent.toLocaleString('en-IN')} spent</span>
                        <span>{percent}% utilized</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-4 pt-2 border-t border-slate-100 space-y-2">
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => onSelectTrip(trip, 'itinerary')}
                      className="py-1.5 px-2 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl text-xs font-semibold text-center transition-colors flex items-center justify-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                    <button
                      onClick={() => onSelectTrip(trip, 'builder')}
                      className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold text-center transition-colors flex items-center justify-center space-x-1"
                    >
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>Stops</span>
                    </button>
                    <button
                      onClick={() => onSelectTrip(trip, 'budget')}
                      className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold text-center transition-colors flex items-center justify-center space-x-1"
                    >
                      <IndianRupee className="w-3.5 h-3.5" />
                      <span>Budget</span>
                    </button>
                  </div>

                  {/* Secondary Action Toolbar */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onEditTrip(trip)}
                        className="p-1.5 text-slate-500 hover:text-sky-600 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Edit Trip Details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(trip.id)}
                        disabled={copyingId === trip.id}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Duplicate Trip"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleCopyShareLink(trip)}
                        className="p-1.5 text-slate-500 hover:text-sky-600 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Copy Public Share Link"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onViewPublic(trip.public_slug)}
                        className="p-1.5 text-slate-500 hover:text-amber-600 rounded-lg hover:bg-slate-100 transition-colors text-[11px] font-semibold"
                        title="Open Shared View"
                      >
                        Public
                      </button>
                    </div>

                    {/* Delete action */}
                    {deleteConfirmId === trip.id ? (
                      <div className="flex items-center space-x-1">
                        <span className="text-[11px] text-rose-600 font-bold">Delete?</span>
                        <button
                          onClick={() => handleDelete(trip.id)}
                          className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold hover:bg-rose-700"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] hover:bg-slate-300"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(trip.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Delete Trip"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
