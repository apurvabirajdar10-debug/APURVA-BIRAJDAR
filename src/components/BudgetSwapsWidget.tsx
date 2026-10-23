import React, { useState } from 'react';
import { ArrowRight, Sparkles, TrendingDown, Check, RefreshCw, AlertCircle, IndianRupee, Tag, Compass } from 'lucide-react';
import { Trip, BudgetSwapSuggestion } from '../types/travel';
import { api } from '../lib/api';

interface BudgetSwapsWidgetProps {
  trip: Trip;
  onTripUpdated: (updatedTrip: Trip) => void;
}

// Curated budget alternatives mapped to activity types and destinations
const BUDGET_CATALOG_ALTERNATIVES = [
  {
    targetMatch: ['private cab', 'taxi', 'chauffeur', 'car rental'],
    suggestedTitle: 'Vande Bharat Express / Regional Rapid Rail Pass',
    suggestedCost: 1650,
    category: 'transport',
    description: 'Executive class high-speed rail with onboard breakfast, panoramic windows, and zero traffic delays.',
    rating: 4.8,
    reason: 'Saves 65% compared to private intercity cabs with guaranteed on-time arrival.',
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
  },
  {
    targetMatch: ['fine dining', 'michelin', 'rooftop', 'luxury dinner', 'degustation'],
    suggestedTitle: 'Curated Heritage Food Walk & Artisanal Kiosks',
    suggestedCost: 1100,
    category: 'food',
    description: 'Sample 8 legendary multi-generational street specialties guided by an author and food historian.',
    rating: 4.95,
    reason: 'Authentic local flavors at a fraction of luxury hotel dining costs.',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
  },
  {
    targetMatch: ['private tour', 'exclusive pass', 'vip', 'charter'],
    suggestedTitle: 'Official Audio Guide & Skip-the-Line Museum Pass',
    suggestedCost: 850,
    category: 'culture',
    description: 'Access priority gates with immersive narrated audio commentary recorded by top curators.',
    rating: 4.75,
    reason: 'Saves up to ₹3,500 over expensive private chauffeurs/private guides.',
    imageUrl: 'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?auto=format&fit=crop&w=600&q=80',
  },
  {
    targetMatch: ['scenic cruise', 'yacht', 'speedboat', 'boat tour'],
    suggestedTitle: 'Public Scenic River Ferry & Sunset Promontory Walk',
    suggestedCost: 250,
    category: 'sightseeing',
    description: 'Ride historic commuter ferries for identical skyline water views followed by a sunset promenade stroll.',
    rating: 4.85,
    reason: 'Same iconic horizon vistas at less than 10% of private cruise tickets.',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
  },
];

export const BudgetSwapsWidget: React.FC<BudgetSwapsWidgetProps> = ({
  trip,
  onTripUpdated,
}) => {
  const [swappingId, setSwappingId] = useState<number | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const budgetTotal = trip.budget_total || 1;
  const totalSpent = trip.total_spent || 0;
  const spendRatio = totalSpent / budgetTotal;
  const isNearOrOverBudget = spendRatio >= 0.75;

  // Find candidate activities in the trip that cost > ₹1,800 to propose swaps
  const activities = trip.stops?.flatMap(s => (s.activities || []).map(a => ({ ...a, stopId: s.id }))) || [];
  const expensiveActivities = activities.filter(a => a.cost >= 1800);

  // Generate budget swap suggestions
  const suggestions: BudgetSwapSuggestion[] = [];

  expensiveActivities.forEach((act, idx) => {
    const titleLower = act.title.toLowerCase();
    // Match against catalog
    let alt = BUDGET_CATALOG_ALTERNATIVES.find(b =>
      b.targetMatch.some(m => titleLower.includes(m))
    );

    if (!alt) {
      alt = BUDGET_CATALOG_ALTERNATIVES[idx % BUDGET_CATALOG_ALTERNATIVES.length];
    }

    if (alt && act.cost > alt.suggestedCost) {
      suggestions.push({
        id: `swap-${act.id}`,
        originalActivityId: act.id,
        stopId: act.stopId,
        originalTitle: act.title,
        originalCost: act.cost,
        suggestedTitle: alt.suggestedTitle,
        suggestedCost: alt.suggestedCost,
        savings: act.cost - alt.suggestedCost,
        category: alt.category,
        description: alt.description,
        rating: alt.rating,
        reason: alt.reason,
      });
    }
  });

  const handleApplySwap = async (s: BudgetSwapSuggestion) => {
    setSwappingId(s.originalActivityId);
    setErrorToast(null);
    setSuccessToast(null);

    try {
      const res = await api.applyBudgetSwap(trip.id, {
        originalActivityId: s.originalActivityId,
        suggestedTitle: s.suggestedTitle,
        suggestedCost: s.suggestedCost,
        category: s.category,
        description: s.description,
      });

      onTripUpdated(res.trip);
      setSuccessToast(`Saved ₹${s.savings.toLocaleString('en-IN')}! Swapped into your itinerary.`);
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err: any) {
      setErrorToast(err.message || 'Failed to apply swap');
    } finally {
      setSwappingId(null);
    }
  };

  if (suggestions.length === 0) {
    return (
      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center space-x-2">
        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>Your itinerary is already optimized with high cost-efficiency! No costly outliers detected.</span>
      </div>
    );
  }

  const totalPotentialSavings = suggestions.reduce((acc, s) => acc + s.savings, 0);

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <TrendingDown className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 font-serif-heading">
              Smart Budget Swaps & Cheaper Alternatives
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            {isNearOrOverBudget ? (
              <span className="text-amber-700 font-bold">
                ⚠️ Budget alert: You have reached {Math.round(spendRatio * 100)}% of your target.
              </span>
            ) : (
              <span>Compare high-cost activities with curated local favorites to unlock savings.</span>
            )}
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold flex items-center space-x-1 self-start sm:self-auto">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Save up to ₹{totalPotentialSavings.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {successToast && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{successToast}</span>
        </div>
      )}

      {errorToast && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{errorToast}</span>
        </div>
      )}

      {/* Suggestions List */}
      <div className="space-y-3.5">
        {suggestions.map(s => {
          const isPending = swappingId === s.originalActivityId;
          return (
            <div
              key={s.id}
              className="p-4 rounded-2xl border border-slate-200/90 hover:border-emerald-300 hover:shadow-xs transition-all bg-slate-50/40 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Original vs Replacement */}
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="line-through text-slate-400 font-semibold">{s.originalTitle}</span>
                    <span className="text-slate-400 font-mono">(₹{s.originalCost.toLocaleString('en-IN')})</span>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-extrabold text-slate-900">{s.suggestedTitle}</span>
                    <span className="text-emerald-700 font-extrabold font-mono">(₹{s.suggestedCost.toLocaleString('en-IN')})</span>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-snug">
                    {s.description} • <strong className="text-slate-700 font-semibold">{s.reason}</strong>
                  </p>
                </div>

                {/* Savings Pill & 1-Tap Swap Action */}
                <div className="flex items-center space-x-3 shrink-0">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Net Savings</p>
                    <p className="text-xs font-extrabold text-emerald-600 font-mono">+₹{s.savings.toLocaleString('en-IN')}</p>
                  </div>

                  <button
                    onClick={() => handleApplySwap(s)}
                    disabled={isPending}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isPending ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Swapping...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>1-Tap Swap</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
