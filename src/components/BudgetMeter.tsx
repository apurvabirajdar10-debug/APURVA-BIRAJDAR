import React from 'react';
import { AlertTriangle, CheckCircle2, AlertCircle, Edit3, TrendingUp, Sparkles, Plus } from 'lucide-react';
import { Trip } from '../types/travel';

interface BudgetMeterProps {
  trip: Trip;
  onOpenSetBudget: () => void;
  compact?: boolean;
}

export const BudgetMeter: React.FC<BudgetMeterProps> = ({
  trip,
  onOpenSetBudget,
  compact = false,
}) => {
  const totalBudget = trip.budget_total || 0;
  const expenses = trip.expenses || [];
  const totalSpent = trip.total_spent !== undefined
    ? trip.total_spent
    : expenses.reduce((acc, e) => acc + (e.amount || 0), 0);

  const hasBudget = totalBudget > 0;
  const ratio = hasBudget ? totalSpent / totalBudget : 0;
  const spentPercent = Math.round(ratio * 100);
  const remainingBudget = totalBudget - totalSpent;
  const isOver = totalSpent > totalBudget && hasBudget;
  const isWarning = ratio >= 0.8 && ratio <= 1.0 && hasBudget;
  const isSafe = ratio < 0.8 && hasBudget;

  // Determine current meter status: 'safe' (green) | 'warning' (yellow) | 'danger' (red) | 'unset'
  type MeterStatus = 'safe' | 'warning' | 'danger' | 'unset';
  const status: MeterStatus = !hasBudget
    ? 'unset'
    : isOver
    ? 'danger'
    : isWarning
    ? 'warning'
    : 'safe';

  // Config mapping for styling based on status
  const config = {
    safe: {
      theme: 'emerald',
      textColor: 'text-emerald-700',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      meterColor: 'bg-emerald-500',
      needleColor: '#10b981',
      glow: 'shadow-emerald-500/20',
      borderColor: 'border-emerald-200',
      cardBg: 'bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/30',
      statusText: 'In Budget',
      statusDetail: `You are safely within your target budget with ₹${remainingBudget.toLocaleString('en-IN')} (${Math.max(0, 100 - spentPercent)}%) remaining.`,
      icon: CheckCircle2,
    },
    warning: {
      theme: 'amber',
      textColor: 'text-amber-800',
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
      meterColor: 'bg-amber-500',
      needleColor: '#f59e0b',
      glow: 'shadow-amber-500/30',
      borderColor: 'border-amber-300',
      cardBg: 'bg-gradient-to-br from-amber-50/70 via-white to-yellow-50/40',
      statusText: 'About to Exceed Budget',
      statusDetail: `Caution: You have utilized ${spentPercent}% of your budget. Only ₹${remainingBudget.toLocaleString('en-IN')} remaining before exceeding.`,
      icon: AlertTriangle,
    },
    danger: {
      theme: 'rose',
      textColor: 'text-rose-700',
      badgeBg: 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse',
      meterColor: 'bg-rose-500',
      needleColor: '#ef4444',
      glow: 'shadow-rose-500/30',
      borderColor: 'border-rose-300',
      cardBg: 'bg-gradient-to-br from-rose-50/70 via-white to-red-50/40',
      statusText: 'Budget Exceeded!',
      statusDetail: `Alert: You have exceeded your set budget by ₹${Math.abs(remainingBudget).toLocaleString('en-IN')} (${spentPercent}% utilized).`,
      icon: AlertCircle,
    },
    unset: {
      theme: 'slate',
      textColor: 'text-slate-600',
      badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
      meterColor: 'bg-slate-300',
      needleColor: '#94a3b8',
      glow: 'shadow-slate-300/20',
      borderColor: 'border-slate-200',
      cardBg: 'bg-white',
      statusText: 'No Budget Set',
      statusDetail: 'Define a spending cap in Rupees (₹) to activate the 3-state real-time Budget Meter.',
      icon: TrendingUp,
    },
  }[status];

  const StatusIcon = config.icon;

  // Meter needle rotation angle for radial gauge: -90deg (0%) to +90deg (100%), can extend up to +110deg for overbudget
  const needleAngle = !hasBudget
    ? -90
    : Math.min(105, -90 + (Math.min(1.25, ratio) * 180));

  // Meter bar pointer percentage position (0 to 100%)
  const meterBarPercent = !hasBudget
    ? 0
    : Math.min(100, Math.max(0, ratio * 100));

  if (compact) {
    return (
      <div className={`p-4 rounded-2xl border ${config.borderColor} ${config.cardBg} shadow-xs space-y-2`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <StatusIcon className={`w-4 h-4 ${config.textColor}`} />
            <span className="text-xs font-bold text-slate-800">Budget Meter (₹)</span>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${config.badgeBg}`}>
            {config.statusText}
          </span>
        </div>

        {/* Compact Meter Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-semibold text-slate-600">
            <span>Spent: ₹{totalSpent.toLocaleString('en-IN')}</span>
            <span>Budget: ₹{totalBudget.toLocaleString('en-IN')}</span>
          </div>
          <div className="relative w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden">
            {/* 3 Zones visual background indicator */}
            <div className="absolute inset-0 flex pointer-events-none opacity-20">
              <div className="w-[80%] bg-emerald-500 h-full border-r border-slate-900" />
              <div className="w-[20%] bg-amber-500 h-full border-r border-slate-900" />
            </div>
            {/* Active filled bar with dynamic color */}
            <div
              className={`h-full rounded-full transition-all duration-500 ${config.meterColor}`}
              style={{ width: `${Math.min(100, meterBarPercent)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-slate-500 font-medium">
            {isOver ? `Over by ₹${Math.abs(remainingBudget).toLocaleString('en-IN')}` : `${Math.max(0, 100 - spentPercent)}% left`}
          </span>
          <button
            onClick={onOpenSetBudget}
            className="text-[10px] font-semibold text-sky-600 hover:text-sky-700 underline flex items-center space-x-0.5 cursor-pointer"
          >
            <Edit3 className="w-2.5 h-2.5" />
            <span>Set Budget</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 sm:p-7 rounded-3xl border-2 ${config.borderColor} ${config.cardBg} shadow-sm transition-all duration-300 relative overflow-hidden`}>
      {/* Top Banner Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-200/60">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-500">
              Real-Time Financial Health (INR)
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center space-x-1 ${config.badgeBg}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              <span>{config.statusText}</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-serif-heading mt-1 flex items-center space-x-2">
            <span>Trip Budget Meter</span>
            {hasBudget && (
              <span className={`text-base sm:text-lg font-bold ${config.textColor}`}>
                ({spentPercent}% Utilized)
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-600 mt-0.5 max-w-xl leading-relaxed">
            {config.statusDetail}
          </p>
        </div>

        {/* Action Button: Set/Adjust Budget */}
        <button
          onClick={onOpenSetBudget}
          className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-xs hover:shadow-md transition-all font-semibold text-xs flex items-center space-x-2 shrink-0 self-start sm:self-auto cursor-pointer"
        >
          {hasBudget ? (
            <>
              <Edit3 className="w-3.5 h-3.5 text-sky-600" />
              <span>Adjust Budget (₹{totalBudget.toLocaleString('en-IN')})</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>Set Trip Budget</span>
            </>
          )}
        </button>
      </div>

      {/* Main Meter Display: Speedometer & Multi-Zone Progress Meter */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-6 items-center">
        {/* Speedometer Radial Arc (Left 4 cols) */}
        <div className="md:col-span-4 flex flex-col items-center justify-center">
          <div className="relative w-48 h-28 flex items-end justify-center overflow-hidden">
            {/* Semi-circular Speedometer SVG */}
            <svg viewBox="0 0 100 55" className="w-full h-full">
              {/* Background track: 3 Zones */}
              {/* Zone 1: Green Zone (0% to 80%) */}
              <path
                d="M 10 50 A 40 40 0 0 1 74 15"
                fill="none"
                stroke="#10b981"
                strokeWidth="10"
                strokeLinecap="round"
                className="opacity-30"
              />
              {/* Zone 2: Yellow Zone (80% to 100%) */}
              <path
                d="M 74 15 A 40 40 0 0 1 90 50"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="10"
                strokeLinecap="round"
                className="opacity-40"
              />
              {/* Zone 3: Danger / Overbudget Edge */}
              <circle
                cx="90"
                cy="50"
                r="5"
                fill="#ef4444"
                className={isOver ? 'animate-ping' : 'opacity-60'}
              />

              {/* Active filled progress arc matching current state */}
              {hasBudget && (
                <path
                  d="M 10 50 A 40 40 0 0 1 90 50"
                  fill="none"
                  stroke={config.needleColor}
                  strokeWidth="10"
                  strokeDasharray={`${Math.min(125, ratio * 125)} 130`}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              )}

              {/* Center Pivot Point */}
              <circle cx="50" cy="50" r="5" fill="#1e293b" />
              <circle cx="50" cy="50" r="2.5" fill="#ffffff" />

              {/* Needle Pointer */}
              <line
                x1="50"
                y1="50"
                x2="50"
                y2="15"
                stroke="#1e293b"
                strokeWidth="2.5"
                strokeLinecap="round"
                transform={`rotate(${needleAngle} 50 50)`}
                className="transition-transform duration-700 origin-bottom"
              />
            </svg>
          </div>

          {/* Speedometer Readout */}
          <div className="text-center mt-1">
            <span className={`text-2xl font-black tracking-tight ${config.textColor}`}>
              {hasBudget ? `${spentPercent}%` : '0%'}
            </span>
            <span className="text-xs text-slate-500 block font-medium">
              {hasBudget ? `₹${totalSpent.toLocaleString('en-IN')} of ₹${totalBudget.toLocaleString('en-IN')}` : 'Budget unset'}
            </span>
          </div>
        </div>

        {/* Multi-Zone Meter Bar with Threshold Indicators (Right 8 cols) */}
        <div className="md:col-span-8 space-y-4">
          {/* Visual Legend of the 3 Meter Zones */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            {/* Green Zone Box */}
            <div className={`p-2.5 rounded-xl border transition-all ${
              status === 'safe'
                ? 'bg-emerald-100/70 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs'
                : 'bg-slate-50 border-slate-200/80 opacity-70'
            }`}>
              <div className="flex items-center space-x-1.5 font-bold text-emerald-800">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Green Zone</span>
              </div>
              <p className="text-[10px] text-emerald-700 mt-0.5 font-medium">
                0% – 79% (In Budget)
              </p>
            </div>

            {/* Yellow Zone Box */}
            <div className={`p-2.5 rounded-xl border transition-all ${
              status === 'warning'
                ? 'bg-amber-100/90 border-amber-400 ring-2 ring-amber-500/20 shadow-xs'
                : 'bg-slate-50 border-slate-200/80 opacity-70'
            }`}>
              <div className="flex items-center space-x-1.5 font-bold text-amber-900">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <span>Yellow Zone</span>
              </div>
              <p className="text-[10px] text-amber-800 mt-0.5 font-medium">
                80% – 100% (About to Exceed)
              </p>
            </div>

            {/* Red Zone Box */}
            <div className={`p-2.5 rounded-xl border transition-all ${
              status === 'danger'
                ? 'bg-rose-100/90 border-rose-400 ring-2 ring-rose-500/20 shadow-xs'
                : 'bg-slate-50 border-slate-200/80 opacity-70'
            }`}>
              <div className="flex items-center space-x-1.5 font-bold text-rose-800">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                <span>Red Zone</span>
              </div>
              <p className="text-[10px] text-rose-700 mt-0.5 font-medium">
                &gt;100% (Exceeded Limit)
              </p>
            </div>
          </div>

          {/* Continuous Multi-Color Meter Track with Active Pointer */}
          <div className="space-y-2 pt-1">
            <div className="relative pt-6">
              {/* Pointer Marker above the track */}
              {hasBudget && (
                <div
                  className="absolute top-0 transition-all duration-700 -translate-x-1/2 flex flex-col items-center z-10"
                  style={{ left: `${Math.min(97, Math.max(3, meterBarPercent))}%` }}
                >
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black text-white shadow-md ${config.meterColor}`}>
                    ₹{totalSpent.toLocaleString('en-IN')}
                  </span>
                  <div className={`w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] ${
                    status === 'safe'
                      ? 'border-t-emerald-500'
                      : status === 'warning'
                      ? 'border-t-amber-500'
                      : 'border-t-rose-500'
                  }`} />
                </div>
              )}

              {/* The Meter Track Container */}
              <div className="relative h-4 rounded-full bg-slate-200 p-0.5 overflow-hidden shadow-inner flex">
                {/* Visual Section: Safe (0% to 80%) */}
                <div className="w-[80%] h-full bg-emerald-500/20 relative border-r-2 border-white">
                  <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400 to-emerald-500 opacity-80" style={{
                    width: status === 'safe' ? `${(meterBarPercent / 80) * 100}%` : '100%',
                  }} />
                </div>

                {/* Visual Section: Warning (80% to 100%) */}
                <div className="w-[20%] h-full bg-amber-500/20 relative">
                  {(status === 'warning' || status === 'danger') && (
                    <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 to-amber-500 opacity-90" style={{
                      width: status === 'warning' ? `${((meterBarPercent - 80) / 20) * 100}%` : '100%',
                    }} />
                  )}
                </div>

                {/* Overbudget pulse bar when exceeded */}
                {isOver && (
                  <div className="absolute inset-0 bg-gradient-to-r from-rose-500 to-red-600 animate-pulse opacity-90" />
                )}
              </div>
            </div>

            {/* Track Ticks and Labels */}
            <div className="flex justify-between text-[11px] font-semibold text-slate-500 px-0.5">
              <span>₹0 (0%)</span>
              <span className="text-emerald-700">Safe: &lt;80%</span>
              <span className="text-amber-700 font-bold">80% Warning Limit</span>
              <span className="text-rose-700 font-bold">₹{totalBudget.toLocaleString('en-IN')} (100% Cap)</span>
            </div>
          </div>

          {/* Quick Metrics Footer */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400">Set Budget</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                ₹{totalBudget.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Spent</span>
              <p className={`text-sm font-bold mt-0.5 ${config.textColor}`}>
                ₹{totalSpent.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400">
                {isOver ? 'Overbudget By' : 'Remaining'}
              </span>
              <p className={`text-sm font-bold mt-0.5 ${isOver ? 'text-rose-600' : 'text-emerald-600'}`}>
                ₹{Math.abs(remainingBudget).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400">Status Meter</span>
              <p className={`text-xs font-bold mt-1 ${config.textColor} uppercase tracking-wider`}>
                {config.statusText}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
