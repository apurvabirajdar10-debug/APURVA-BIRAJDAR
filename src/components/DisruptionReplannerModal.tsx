import React, { useState } from 'react';
import { X, CloudRain, Clock, AlertTriangle, Flame, Sparkles, Check, ArrowRight, RefreshCw, Undo2, IndianRupee, ShieldCheck } from 'lucide-react';
import { Trip, DisruptionProposal } from '../types/travel';
import { api } from '../lib/api';

interface DisruptionReplannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  onTripUpdated: (updatedTrip: Trip) => void;
}

export const DisruptionReplannerModal: React.FC<DisruptionReplannerModalProps> = ({
  isOpen,
  onClose,
  trip,
  onTripUpdated,
}) => {
  const [disruptionType, setDisruptionType] = useState<'rain' | 'delay' | 'closure' | 'heatwave'>('rain');
  const [affectedCity, setAffectedCity] = useState<string>(
    trip.stops && trip.stops.length > 0 ? trip.stops[0].city_name : 'Destination'
  );
  const [affectedDate, setAffectedDate] = useState<string>(
    trip.stops && trip.stops.length > 0 ? trip.stops[0].start_date : trip.start_date
  );
  const [userNote, setUserNote] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [proposal, setProposal] = useState<DisruptionProposal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const disruptionOptions = [
    {
      id: 'rain' as const,
      title: 'Heavy Rain / Storm',
      icon: CloudRain,
      color: 'text-sky-600 bg-sky-50 border-sky-200',
      description: 'Replace outdoor walks with covered museums, indoor tasting markets, and subterranean crypts.',
    },
    {
      id: 'delay' as const,
      title: 'Flight / Train Delay',
      icon: Clock,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      description: 'Inbound transit delayed by 3-4 hours; push schedule into twilight passes and rest buffers.',
    },
    {
      id: 'closure' as const,
      title: 'Attraction Closed / Strike',
      icon: AlertTriangle,
      color: 'text-rose-600 bg-rose-50 border-rose-200',
      description: 'Key landmark inaccessible; swap in top-rated alternative spots without losing time.',
    },
    {
      id: 'heatwave' as const,
      title: 'Extreme Heatwave',
      icon: Flame,
      color: 'text-orange-600 bg-orange-50 border-orange-200',
      description: 'Midday heat > 38°C; reschedule strenuous sights to early sunrise and air-conditioned galleries.',
    },
  ];

  const handleGenerateProposal = async () => {
    setLoading(true);
    setError(null);
    setProposal(null);
    setSuccessMessage(null);

    try {
      const res = await api.replanDisruption(trip.id, {
        disruptionType,
        affectedDate,
        affectedCity,
        note: userNote || undefined,
      });

      setProposal(res.proposal);
    } catch (err: any) {
      setError(err.message || 'Failed to simulate replan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRevisedPlan = async () => {
    if (!proposal) return;
    setApplying(true);
    setError(null);

    try {
      const res = await api.applyDisruptionReplan(trip.id, {
        changes: proposal.changes,
        affectedDate: proposal.affectedDate,
      });

      onTripUpdated(res.trip);
      setSuccessMessage('Revised plan successfully applied! Your itinerary has been updated.');
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err: any) {
      setError(err.message || 'Could not apply revised plan');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-serif-heading">Disruption Replanner</h2>
              <p className="text-xs text-slate-300">
                Simulate weather delays, transit strikes, or sudden closures • Gemini AI contingency rerouting
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

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {successMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Select Disruption Type & Scope */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              1. Choose Scenario to Simulate
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {disruptionOptions.map(opt => {
                const Icon = opt.icon;
                const isSelected = disruptionType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDisruptionType(opt.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start space-x-3 ${
                      isSelected
                        ? 'bg-sky-50/80 border-sky-400 ring-2 ring-sky-200 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${opt.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-900">{opt.title}</p>
                      <p className="text-[11px] text-slate-500 leading-snug">{opt.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Target Location & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Affected City / Stop
                </label>
                <select
                  value={affectedCity}
                  onChange={(e) => {
                    setAffectedCity(e.target.value);
                    const stop = trip.stops?.find(s => s.city_name === e.target.value);
                    if (stop) setAffectedDate(stop.start_date);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  {trip.stops?.map(s => (
                    <option key={s.id} value={s.city_name}>
                      {s.city_name}, {s.country}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Affected Date
                </label>
                <input
                  type="date"
                  value={affectedDate}
                  onChange={(e) => setAffectedDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Extra user context note */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Optional Traveler Preferences / Specific Context
              </label>
              <input
                type="text"
                placeholder="e.g., We have a toddler with us; prefer indoor historical sites over loud arcades"
                value={userNote}
                onChange={(e) => setUserNote(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            {/* Trigger Button */}
            <button
              onClick={handleGenerateProposal}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-xs transition-all shadow-md shadow-sky-600/20 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Contingency Options with Gemini AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Generate AI Revised Plan for {affectedCity}</span>
                </>
              )}
            </button>
          </div>

          {/* STEP 2: Proposal Comparison View */}
          {proposal && (
            <div className="pt-6 border-t border-slate-200 space-y-6 animate-in fade-in duration-300">
              <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-4.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-sky-200 text-sky-900 text-[11px] font-bold">
                    {proposal.disruptionLabel}
                  </span>
                  <div className="text-xs font-extrabold flex items-center space-x-1">
                    <span className="text-slate-500">Budget Impact:</span>
                    <span className={proposal.netCostDifference < 0 ? 'text-emerald-700' : 'text-slate-900'}>
                      {proposal.netCostDifference < 0 ? '-' : '+'}₹{Math.abs(proposal.netCostDifference)}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {proposal.summary}
                </p>
              </div>

              {/* Side-by-Side Before vs After Plan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* BEFORE PLAN */}
                <div className="bg-slate-50 rounded-2xl p-4.5 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h4 className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                      <span>Original Plan (Before)</span>
                    </h4>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Exposed</span>
                  </div>
                  <div className="space-y-2.5">
                    {proposal.beforePlan.map((b, idx) => (
                      <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{b.timeSlot}</span>
                          <span className="text-xs font-semibold text-slate-600">₹{b.cost}</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800">{b.activity}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AFTER PLAN */}
                <div className="bg-emerald-50/50 rounded-2xl p-4.5 border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                    <h4 className="text-xs font-bold text-emerald-900 flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Revised Plan (After AI Replanner)</span>
                    </h4>
                    <span className="text-[10px] text-emerald-700 uppercase font-semibold">Safe & Active</span>
                  </div>
                  <div className="space-y-2.5">
                    {proposal.afterPlan.map((a, idx) => (
                      <div key={idx} className="p-3 bg-white rounded-xl border border-emerald-200/80 shadow-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-emerald-700 uppercase">{a.timeSlot}</span>
                          <span className="text-xs font-bold text-slate-900">₹{a.cost}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-900">{a.activity}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Specific Changes & Rationale List */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Specific Adjustments Made:
                </h4>
                <div className="space-y-2">
                  {proposal.changes.map((c, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 flex items-start space-x-3 text-xs">
                      <div className="mt-0.5 w-5 h-5 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0 font-bold text-[10px]">
                        {idx + 1}
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="line-through text-slate-400 font-medium">{c.originalActivity}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="font-bold text-slate-900">{c.newActivity}</span>
                        </div>
                        <p className="text-[11px] text-slate-500">{c.reason}</p>
                      </div>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                        c.costDiff < 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {c.costDiff < 0 ? '-' : '+'}₹{Math.abs(c.costDiff)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Acceptance Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setProposal(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-600 transition-colors cursor-pointer flex items-center space-x-1.5"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Reject / Discard</span>
                </button>
                <button
                  type="button"
                  onClick={handleAcceptRevisedPlan}
                  disabled={applying}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {applying ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating Itinerary...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Accept Revised Plan</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
