import React, { useState } from 'react';
import { Copy, Share2, MapPin, Calendar, IndianRupee, Clock, ArrowLeft, CheckCircle2, Compass, Check, ArrowRight } from 'lucide-react';
import { Trip } from '../types/travel';
import { api } from '../lib/api';

interface PublicTripViewProps {
  trip: Trip;
  onCopySuccess: (clonedTrip: Trip) => void;
  onBackToApp: () => void;
}

export const PublicTripView: React.FC<PublicTripViewProps> = ({
  trip,
  onCopySuccess,
  onBackToApp,
}) => {
  const [copying, setCopying] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const stops = trip.stops || [];

  const handleCopyTrip = async () => {
    setCopying(true);
    try {
      const res = await api.copyTrip(trip.id);
      onCopySuccess(res.trip);
    } catch (err: any) {
      alert(err.message || 'Failed to clone trip');
    } finally {
      setCopying(false);
    }
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setToastMessage('Public share link copied to clipboard!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-2.5 rounded-2xl shadow-xl flex items-center space-x-2 text-xs font-semibold animate-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToApp}
          className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Globe Trotter App</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopyLink}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Share Link</span>
          </button>
          <button
            onClick={handleCopyTrip}
            disabled={copying}
            className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-md shadow-sky-600/20 active:scale-95 flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copying ? 'Copying to Account...' : 'Copy Trip to My Account'}</span>
          </button>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200 h-80 sm:h-96">
        <img
          src={trip.cover_image}
          alt={trip.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

        <div className="absolute bottom-6 left-6 right-6 text-white space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider">
              Public Itinerary
            </span>
            <span className="px-3 py-1 rounded-full bg-sky-500/80 backdrop-blur-md text-white text-xs font-semibold flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>{stops.length} Cities</span>
            </span>
            {trip.user_name && (
              <span className="text-xs text-slate-300 font-medium">
                Curated by {trip.user_name}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold font-serif-heading drop-shadow">
            {trip.name}
          </h1>

          <p className="text-xs sm:text-sm text-slate-200 max-w-2xl leading-relaxed drop-shadow">
            {trip.description || 'A multi-city travel itinerary curated on Globe Trotter.'}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-300 pt-1">
            <span className="flex items-center space-x-1">
              <Calendar className="w-4 h-4 text-sky-400" />
              <span>{trip.start_date} → {trip.end_date}</span>
            </span>
            {trip.budget_total > 0 && (
              <span className="flex items-center space-x-1">
                <IndianRupee className="w-4 h-4 text-emerald-400" />
                <span>Est. Budget: ₹{trip.budget_total.toLocaleString('en-IN')}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* City Route Sequence Chips */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Route Itinerary Sequence
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          {stops.map((stop, idx) => (
            <React.Fragment key={stop.id}>
              <div className="px-3 py-2 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold flex items-center space-x-1.5 shadow-2xs">
                <span className="w-5 h-5 rounded-full bg-sky-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {idx + 1}
                </span>
                <span>{stop.city_name}, {stop.country}</span>
              </div>
              {idx < stops.length - 1 && (
                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Read-only Stops & Activities Schedule */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold font-serif-heading text-slate-900">
          Daily Schedule & Activities
        </h2>

        {stops.map((stop, sIdx) => (
          <div
            key={stop.id}
            className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden"
          >
            {/* Stop Header */}
            <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-sky-600 text-white font-bold text-sm flex items-center justify-center">
                  {sIdx + 1}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 font-serif-heading">
                    {stop.city_name}, {stop.country}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {stop.start_date} to {stop.end_date} {stop.notes ? `• ${stop.notes}` : ''}
                  </p>
                </div>
              </div>

              {stop.transport_notes && (
                <span className="text-xs font-medium text-slate-600 bg-white px-3 py-1 rounded-xl border border-slate-200">
                  Transit: {stop.transport_notes}
                </span>
              )}
            </div>

            {/* Activities List */}
            <div className="p-5">
              {!stop.activities || stop.activities.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No scheduled activities for this stop.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {stop.activities.map(act => (
                    <div
                      key={act.id}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="uppercase text-sky-600">{act.time_slot}</span>
                        <span className="text-emerald-600">{act.cost > 0 ? `₹${act.cost.toLocaleString('en-IN')}` : 'Free'}</span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-900">{act.title}</h4>
                      {act.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-2">{act.description}</p>
                      )}
                      <div className="pt-1 text-[10px] text-slate-400 capitalize">
                        {act.category} • {act.duration_hours}h
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Floating CTA Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-sky-600 via-indigo-600 to-violet-600 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div>
          <h3 className="font-serif-heading font-bold text-lg">Like this itinerary?</h3>
          <p className="text-xs text-white/80 mt-0.5">
            Clone this entire route into your account, customize activities, and manage your budget.
          </p>
        </div>
        <button
          onClick={handleCopyTrip}
          disabled={copying}
          className="px-6 py-2.5 rounded-xl bg-white text-sky-700 hover:bg-slate-100 font-semibold text-xs shadow-md transition-all shrink-0 cursor-pointer"
        >
          {copying ? 'Cloning Trip...' : 'Copy Trip to My Account'}
        </button>
      </div>
    </div>
  );
};
