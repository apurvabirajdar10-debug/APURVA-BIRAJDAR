import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle, TrendingUp } from 'lucide-react';
import { Trip } from '../types/travel';
import { api } from '../lib/api';

interface SetBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  onTripUpdated: (updatedTrip: Trip) => void;
}

const BUDGET_PRESETS = [25000, 50000, 75000, 100000, 150000, 250000];

export const SetBudgetModal: React.FC<SetBudgetModalProps> = ({
  isOpen,
  onClose,
  trip,
  onTripUpdated,
}) => {
  const [budgetInput, setBudgetInput] = useState<string>(
    trip.budget_total ? String(trip.budget_total) : '75000'
  );
  const [budgetError, setBudgetError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setBudgetInput(trip.budget_total ? String(trip.budget_total) : '75000');
      setBudgetError(null);
      setGeneralError(null);
    }
  }, [isOpen, trip.budget_total]);

  if (!isOpen) return null;

  // Calculate day difference for daily breakdown estimate
  const startDate = new Date(trip.start_date);
  const endDate = new Date(trip.end_date);
  const totalDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1);

  const numericBudget = parseFloat(budgetInput) || 0;
  const dailyTarget = totalDays > 0 && numericBudget > 0 ? Math.round(numericBudget / totalDays) : 0;
  const currentSpent = trip.total_spent || (trip.expenses || []).reduce((acc, e) => acc + (e.amount || 0), 0);

  const validate = (): boolean => {
    setBudgetError(null);
    setGeneralError(null);

    if (!budgetInput.trim()) {
      setBudgetError('Target budget cannot be left blank.');
      return false;
    }

    const val = parseFloat(budgetInput);
    if (isNaN(val) || val <= 0) {
      setBudgetError('Please enter a valid budget greater than ₹0.');
      return false;
    }

    return true;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const parsed = parseFloat(budgetInput);
      const res = await api.updateTrip(trip.id, { budget_total: parsed });
      onTripUpdated(res.trip);
      onClose();
    } catch (err: any) {
      setGeneralError(err.message || 'Failed to update trip budget. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner font-extrabold text-2xl">
              ₹
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif-heading">Set Trip Budget (Rupees)</h2>
              <p className="text-xs text-white/80 mt-0.5">
                Configure your total spending cap for {trip.name} in ₹ (INR)
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSave} noValidate className="p-6 space-y-5">
          {generalError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Quick Info Explanation */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <div className="flex items-center space-x-1.5 font-semibold text-slate-800">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>How the Budget Meter Works:</span>
            </div>
            <p className="leading-relaxed">
              The <span className="font-semibold text-emerald-700">Budget Meter</span> stays <strong className="text-emerald-700">Green</strong> while you are safely within budget, shifts to <strong className="text-amber-700">Yellow</strong> when you are approaching your limit (&ge;80%), and turns <strong className="text-rose-700">Red</strong> if your spending exceeds your set ₹ budget.
            </p>
          </div>

          {/* Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Quick Budget Presets (₹ INR)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {BUDGET_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => {
                    setBudgetInput(String(preset));
                    setBudgetError(null);
                  }}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    numericBudget === preset
                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 hover:bg-emerald-50/50 hover:border-emerald-300 border-slate-200 text-slate-700'
                  }`}
                >
                  ₹{preset.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Total Target Budget (INR - ₹) *</span>
              {currentSpent > 0 && (
                <span className="text-[11px] text-slate-500 font-normal">
                  Current spent: ₹{currentSpent.toLocaleString('en-IN')}
                </span>
              )}
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-base select-none">
                ₹
              </div>
              <input
                type="number"
                min="1"
                step="500"
                value={budgetInput}
                onChange={(e) => {
                  setBudgetInput(e.target.value);
                  if (e.target.value && parseFloat(e.target.value) > 0) {
                    setBudgetError(null);
                  }
                }}
                placeholder="e.g. 75000"
                className={`w-full pl-8 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-bold focus:outline-none transition-all ${
                  budgetError
                    ? 'border-rose-400 focus:ring-2 focus:ring-rose-500/20 text-rose-900 bg-rose-50/20'
                    : 'border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900'
                }`}
              />
            </div>
            {budgetError && (
              <p className="text-xs text-rose-600 font-medium mt-1 flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{budgetError}</span>
              </p>
            )}
          </div>

          {/* Daily Schedule Preview */}
          {dailyTarget > 0 && (
            <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
              <span className="font-medium">Estimated Daily Allowance:</span>
              <span className="font-bold text-sm">~₹{dailyTarget.toLocaleString('en-IN')} / day</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Budget</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
