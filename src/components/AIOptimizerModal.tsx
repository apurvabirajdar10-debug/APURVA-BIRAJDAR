import React, { useState, useEffect } from 'react';
import { X, Sparkles, TrendingUp, IndianRupee, Clock, MapPin, CheckCircle2, AlertTriangle, ShieldCheck, Zap, RotateCcw, Compass } from 'lucide-react';
import { Trip, OptimizationResult } from '../types/travel';
import { api } from '../lib/api';

interface AIOptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
}

export const AIOptimizerModal: React.FC<AIOptimizerModalProps> = ({
  isOpen,
  onClose,
  trip,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'budget' | 'sequence' | 'pacing' | 'logistics'>('all');

  useEffect(() => {
    if (isOpen && trip) {
      runOptimization();
    }
  }, [isOpen, trip.id]);

  const runOptimization = async () => {
    setLoading(true);
    setError(null);

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Optimization analysis timed out. The server took longer than expected.')), 30000)
    );

    try {
      const fetchPromise = api.optimizeItinerary(trip.id);
      const res = (await Promise.race([fetchPromise, timeoutPromise])) as { optimization: OptimizationResult };
      setResult(res.optimization);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze itinerary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const suggestions = result?.suggestions || [];
  const filteredSuggestions = activeFilter === 'all'
    ? suggestions
    : suggestions.filter(s => s.category === activeFilter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold font-serif-heading">AI Itinerary Optimizer</h2>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-semibold tracking-wide uppercase">
                  Route & Budget Analysis
                </span>
              </div>
              <p className="text-xs text-white/80 mt-0.5">
                Analyzing sequencing, travel pacing, and budget allocations for {trip.name}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* CLEAN LOADING SPINNER WITH STATUS TEXT */}
          {loading && (
            <div className="py-16 text-center space-y-6 animate-in fade-in duration-300">
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-amber-100 animate-pulse" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-amber-500 border-r-orange-500 animate-spin" />
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-md">
                  <Compass className="w-5 h-5 text-white animate-spin" />
                </div>
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-lg font-bold text-slate-900 font-serif-heading tracking-wide">
                  AI is crafting your custom travel plan
                </h3>
                <p className="text-xs font-semibold text-amber-800 bg-amber-50 py-1.5 px-4 rounded-full inline-block border border-amber-200">
                  Evaluating stops, intercity transit, and activity pacing...
                </p>
                <p className="text-xs text-slate-500 pt-1">
                  Gemini 3.8 Flash is checking for transit bottlenecks, rest windows, and budget optimization opportunities.
                </p>
              </div>

              <div className="w-64 h-1.5 bg-slate-100 rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full animate-pulse-glow" style={{ width: '80%' }} />
              </div>
            </div>
          )}

          {/* GRACEFUL ERROR / FALLBACK STATE WITH TRY AGAIN */}
          {!loading && error && (
            <div className="p-6 rounded-3xl bg-rose-50/70 border-2 border-rose-200 text-center space-y-4 my-4 animate-in fade-in">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-rose-900">
                  Unable to analyze itinerary
                </h3>
                <p className="text-xs text-rose-700 max-w-md mx-auto">
                  {error}
                </p>
                <p className="text-[11px] text-slate-500 pt-1">
                  The optimizer encountered a temporary issue. Click below to re-run the diagnosis without interrupting your session.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={runOptimization}
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-amber-600/20 active:scale-95 transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </button>
              </div>
            </div>
          )}

          {!loading && !error && result && (
            <div className="space-y-6">
              {/* Score and Summary Overview Card */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-5">
                {/* Score Circle */}
                <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-200"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={result.score >= 85 ? 'text-emerald-500' : (result.score >= 70 ? 'text-amber-500' : 'text-rose-500')}
                      strokeDasharray={`${result.score}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-black text-slate-900">{result.score}</span>
                    <span className="text-[9px] uppercase font-bold text-slate-600">Health</span>
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start space-x-2">
                    <h3 className="font-bold text-sm text-slate-900">Itinerary Diagnostics</h3>
                    {result.savings_potential ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                        Save up to ₹{result.savings_potential.toLocaleString('en-IN')}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {result.summary}
                  </p>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
                {(['all', 'budget', 'pacing', 'sequence', 'logistics'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl font-medium transition-colors uppercase tracking-wider text-[10px] shrink-0 cursor-pointer ${
                      activeFilter === cat
                        ? 'bg-slate-900 text-white font-bold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Suggestion Cards */}
              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                {filteredSuggestions.map((sug, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs hover:border-amber-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            sug.impact === 'high'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {sug.impact} Impact
                        </span>
                        <span className="text-[11px] font-semibold text-slate-600 uppercase">
                          {sug.category}
                        </span>
                      </div>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 mt-1.5">{sug.title}</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-normal">{sug.description}</p>
                    {sug.actionable_tip && (
                      <div className="mt-2.5 p-2 rounded-xl bg-amber-50/80 border border-amber-200/60 text-[11px] text-amber-900 flex items-start space-x-2 font-medium">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>Actionable Tip: {sug.actionable_tip}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={runOptimization}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  Re-analyze Itinerary
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Got It
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
