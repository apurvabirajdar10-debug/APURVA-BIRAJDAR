import React, { useState } from 'react';
import { IndianRupee, Plus, Trash2, Edit3, AlertTriangle, CheckCircle2, TrendingUp, PieChart, Tag, Calendar, MapPin, X, AlertCircle } from 'lucide-react';
import { Trip, Expense, Stop } from '../types/travel';
import { api } from '../lib/api';
import { BudgetMeter } from './BudgetMeter';
import { SetBudgetModal } from './SetBudgetModal';

interface BudgetBreakdownViewProps {
  trip: Trip;
  onTripUpdated: (updatedTrip: Trip) => void;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; fill: string }> = {
  transport: { bg: 'bg-sky-100', text: 'text-sky-800', fill: '#0284c7' },
  stay: { bg: 'bg-indigo-100', text: 'text-indigo-800', fill: '#4f46e5' },
  activities: { bg: 'bg-amber-100', text: 'text-amber-800', fill: '#d97706' },
  meals: { bg: 'bg-emerald-100', text: 'text-emerald-800', fill: '#059669' },
  miscellaneous: { bg: 'bg-purple-100', text: 'text-purple-800', fill: '#9333ea' },
};

export const BudgetBreakdownView: React.FC<BudgetBreakdownViewProps> = ({
  trip,
  onTripUpdated,
}) => {
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showSetBudgetModal, setShowSetBudgetModal] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'transport' | 'stay' | 'activities' | 'meals' | 'miscellaneous'>('meals');
  const [amount, setAmount] = useState<number | string>('');
  const [date, setDate] = useState(trip.start_date || new Date().toISOString().split('T')[0]);
  const [stopId, setStopId] = useState<number | ''>('');
  const [paidBy, setPaidBy] = useState('Alex');
  const [notes, setNotes] = useState('');
  const [titleError, setTitleError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Category filter for table
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const expenses = trip.expenses || [];
  const stops = trip.stops || [];
  const totalBudget = trip.budget_total || 0;
  const totalSpent = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const remainingBudget = totalBudget - totalSpent;
  const spentPercent = totalBudget > 0 ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0;
  const isOverBudget = totalSpent > totalBudget && totalBudget > 0;

  // Compute category breakdown
  const categoryTotals: Record<string, number> = {
    transport: 0,
    stay: 0,
    activities: 0,
    meals: 0,
    miscellaneous: 0,
  };

  expenses.forEach(e => {
    const cat = e.category || 'miscellaneous';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + (e.amount || 0);
  });

  // Calculate day difference for daily average budget
  const startDate = new Date(trip.start_date);
  const endDate = new Date(trip.end_date);
  const totalDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1);
  const dailyAverageBudget = totalBudget > 0 ? Math.round(totalBudget / totalDays) : 250;

  // Daily totals for overbudget day detection
  const dailyTotals: Record<string, number> = {};
  expenses.forEach(e => {
    dailyTotals[e.date] = (dailyTotals[e.date] || 0) + e.amount;
  });

  const overbudgetDays = Object.entries(dailyTotals).filter(([d, amt]) => amt > dailyAverageBudget * 1.3);

  const openAddModal = (existing?: Expense) => {
    setError(null);
    setTitleError(null);
    setAmountError(null);
    setDateError(null);
    if (existing) {
      setExpenseToEdit(existing);
      setTitle(existing.title);
      setCategory(existing.category);
      setAmount(existing.amount);
      setDate(existing.date);
      setStopId(existing.stop_id ?? '');
      setPaidBy(existing.paid_by || 'Alex');
      setNotes(existing.notes || '');
    } else {
      setExpenseToEdit(null);
      setTitle('');
      setCategory('meals');
      setAmount('');
      setDate(trip.start_date || new Date().toISOString().split('T')[0]);
      setStopId(stops.length > 0 ? stops[0].id : '');
      setPaidBy('Alex');
      setNotes('');
    }
    setShowAddExpenseModal(true);
  };

  const validateExpense = (): boolean => {
    let valid = true;
    setTitleError(null);
    setAmountError(null);
    setDateError(null);
    setError(null);

    if (!title.trim()) {
      setTitleError('Expense title cannot be left blank.');
      valid = false;
    }

    if (amount === '' || isNaN(Number(amount)) || Number(amount) <= 0) {
      setAmountError('Please enter a valid amount greater than 0.');
      valid = false;
    }

    if (!date) {
      setDateError('Date cannot be left blank.');
      valid = false;
    }

    return valid;
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateExpense()) return;

    setLoading(true);
    try {
      if (expenseToEdit) {
        await api.updateExpense(expenseToEdit.id, {
          title: title.trim(),
          category,
          amount: Number(amount) || 0,
          date,
          stop_id: stopId !== '' ? Number(stopId) : null,
          paid_by: paidBy.trim(),
          notes: notes.trim(),
        });
      } else {
        await api.addExpense(trip.id, {
          title: title.trim(),
          category,
          amount: Number(amount) || 0,
          date,
          stop_id: stopId !== '' ? Number(stopId) : null,
          paid_by: paidBy.trim(),
          notes: notes.trim(),
        });
      }

      // Refresh trip
      const refreshed = await api.getTrip(trip.id);
      onTripUpdated(refreshed.trip);
      setShowAddExpenseModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId: number) => {
    if (!confirm('Are you sure you want to remove this expense entry?')) return;
    try {
      await api.deleteExpense(expenseId);
      const refreshed = await api.getTrip(trip.id);
      onTripUpdated(refreshed.trip);
    } catch (err: any) {
      alert(err.message || 'Failed to delete expense');
    }
  };

  const filteredExpenses = expenses.filter(e => {
    if (categoryFilter === 'all') return true;
    return e.category === categoryFilter;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wide">
              Financial Summary
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {trip.name} • {expenses.length} Recorded Expenses
            </span>
          </div>
          <h1 className="text-2xl font-bold font-serif-heading text-slate-900 mt-1">
            Trip Budget & Cost Breakdown
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time financial tracking across accommodation, rail/flights, dining, and sights with overbudget detection.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setShowSetBudgetModal(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer border border-slate-200"
          >
            <IndianRupee className="w-4 h-4 text-emerald-600" />
            <span>Set / Adjust Budget</span>
          </button>
          <button
            onClick={() => openAddModal()}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* PROMINENT REAL-TIME BUDGET METER */}
      <BudgetMeter
        trip={trip}
        onOpenSetBudget={() => setShowSetBudgetModal(true)}
      />

      {/* Top 3 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Target Budget */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs relative group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Allocated Budget
            </span>
            <button
              onClick={() => setShowSetBudgetModal(true)}
              className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center space-x-0.5 opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>Change</span>
            </button>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            ₹{totalBudget.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Daily target: ~₹{dailyAverageBudget.toLocaleString('en-IN')}/day ({totalDays} days)
          </p>
        </div>

        {/* Total Spent */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Spent
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isOverBudget ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {spentPercent}% utilized
            </span>
          </div>
          <p className={`text-2xl font-bold mt-1 ${isOverBudget ? 'text-rose-600' : 'text-slate-900'}`}>
            ₹{totalSpent.toLocaleString('en-IN')}
          </p>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isOverBudget ? 'bg-rose-500' : (spentPercent > 85 ? 'bg-amber-500' : 'bg-emerald-500')
              }`}
              style={{ width: `${spentPercent}%` }}
            />
          </div>
        </div>

        {/* Remaining Budget */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {remainingBudget >= 0 ? 'Remaining Balance' : 'Overbudget Amount'}
          </span>
          <p className={`text-2xl font-bold mt-1 ${remainingBudget < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            ₹{Math.abs(remainingBudget).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {remainingBudget >= 0 ? 'Within target parameters' : 'Review expenses below for optimization'}
          </p>
        </div>
      </div>

      {/* Overbudget Day Alerts Banner */}
      {overbudgetDays.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <h4 className="font-bold text-xs uppercase tracking-wider">
              Overbudget Day Alert ({overbudgetDays.length} {overbudgetDays.length === 1 ? 'day' : 'days'})
            </h4>
          </div>
          <p className="text-xs leading-relaxed text-amber-800">
            Spending on these dates exceeded 130% of your daily average (₹{dailyAverageBudget.toLocaleString('en-IN')}/day). Consider adjusting fine-dining or booking tickets in advance:
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {overbudgetDays.map(([d, amt]) => (
              <span key={d} className="px-2.5 py-1 rounded-xl bg-white border border-amber-300 text-xs font-semibold text-amber-900 shadow-2xs">
                {d}: ₹{amt.toLocaleString('en-IN')} (+₹{Math.round(amt - dailyAverageBudget).toLocaleString('en-IN')})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Visual Charts & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG Donut Chart */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col items-center justify-center space-y-4">
          <div className="flex items-center space-x-2 self-start">
            <PieChart className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-sm text-slate-900">Spending by Category</h3>
          </div>

          <div className="relative w-44 h-44 flex items-center justify-center">
            {totalSpent === 0 ? (
              <div className="w-full h-full rounded-full border-4 border-slate-100 flex items-center justify-center text-xs text-slate-400">
                No Expenses
              </div>
            ) : (
              <svg className="w-full h-full -rotate-90" viewBox="0 0 42 42">
                {(() => {
                  let accumulatedPercent = 0;
                  return Object.entries(categoryTotals).map(([cat, amt]) => {
                    if (amt === 0) return null;
                    const slicePercent = (amt / totalSpent) * 100;
                    const strokeDasharray = `${slicePercent} ${100 - slicePercent}`;
                    const strokeDashoffset = -accumulatedPercent;
                    accumulatedPercent += slicePercent;

                    return (
                      <circle
                        key={cat}
                        cx="21"
                        cy="21"
                        r="15.9155"
                        fill="transparent"
                        stroke={CATEGORY_COLORS[cat]?.fill || '#94a3b8'}
                        strokeWidth="4"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                      />
                    );
                  });
                })()}
              </svg>
            )}
            <div className="absolute flex flex-col items-center">
              <span className="text-xl font-black text-slate-900">₹{totalSpent.toLocaleString('en-IN')}</span>
              <span className="text-[10px] uppercase font-bold text-slate-600">Total Spent</span>
            </div>
          </div>

          {/* Donut Legend */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs w-full pt-2">
            {Object.entries(categoryTotals).map(([cat, amt]) => {
              const p = totalSpent > 0 ? Math.round((amt / totalSpent) * 100) : 0;
              return (
                <div key={cat} className="flex items-center space-x-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[cat]?.fill || '#94a3b8' }}
                  />
                  <span className="capitalize text-slate-600 truncate">{cat}</span>
                  <span className="text-slate-800 font-semibold ml-auto">{p}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Category Progress Bars */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 font-serif-heading">
            Category Breakdown & Allowances
          </h3>

          <div className="space-y-4">
            {Object.entries(categoryTotals).map(([cat, amt]) => {
              const p = totalSpent > 0 ? Math.round((amt / totalSpent) * 100) : 0;
              const colorInfo = CATEGORY_COLORS[cat] || { bg: 'bg-slate-100', text: 'text-slate-800', fill: '#94a3b8' };

              return (
                <div key={cat} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="capitalize font-bold text-slate-800 flex items-center space-x-1.5">
                      <span className={`px-2 py-0.5 rounded-md ${colorInfo.bg} ${colorInfo.text} text-[10px]`}>
                        {cat}
                      </span>
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-500">{p}% of spent</span>
                      <span className="font-bold text-slate-900">₹{amt.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${p}%`, backgroundColor: colorInfo.fill }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs space-y-4">
        {/* Table Filter Tabs */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center space-x-1 overflow-x-auto">
            <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mr-1">
              Category:
            </span>
            {(['all', 'transport', 'stay', 'activities', 'meals', 'miscellaneous'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold capitalize transition-colors shrink-0 ${
                  categoryFilter === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-500 font-medium">
            Showing {filteredExpenses.length} entries
          </span>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No expenses found matching the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Expense Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">City / Stop</th>
                  <th className="py-3 px-4">Paid By</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-600">{exp.date}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {exp.title}
                      {exp.notes && (
                        <span className="block text-[10px] font-normal text-slate-500">{exp.notes}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold capitalize ${
                        CATEGORY_COLORS[exp.category]?.bg || 'bg-slate-100'
                      } ${CATEGORY_COLORS[exp.category]?.text || 'text-slate-800'}`}>
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {stops.find(s => s.id === exp.stop_id)?.city_name || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{exp.paid_by || '-'}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      ₹{exp.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => openAddModal(exp)}
                          className="p-1 text-slate-400 hover:text-sky-600 rounded"
                          title="Edit Expense"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Expense Modal */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-sm text-slate-900 font-serif-heading">
                {expenseToEdit ? 'Edit Expense Record' : 'Record Trip Expense'}
              </h3>
              <button
                onClick={() => setShowAddExpenseModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} noValidate className="p-5 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Expense Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (e.target.value.trim()) setTitleError(null);
                  }}
                  placeholder="e.g. Vande Bharat Express / Hotel Stay"
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs focus:outline-none transition-all font-medium ${
                    titleError
                      ? 'border-rose-400 focus:ring-2 focus:ring-rose-500/20 text-rose-900 bg-rose-50/20'
                      : 'border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800'
                  }`}
                />
                {titleError && (
                  <p className="text-xs text-rose-600 font-medium mt-1 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{titleError}</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold"
                  >
                    <option value="transport">Transport (Flights / Trains)</option>
                    <option value="stay">Stay & Accommodation</option>
                    <option value="activities">Activities & Sightseeing</option>
                    <option value="meals">Meals & Dining</option>
                    <option value="miscellaneous">Miscellaneous / Shopping</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Amount (INR - ₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        if (e.target.value && !isNaN(Number(e.target.value)) && Number(e.target.value) > 0) {
                          setAmountError(null);
                        }
                      }}
                      placeholder="2500"
                      className={`w-full pl-6 pr-3 py-2 bg-slate-50 border rounded-xl text-xs focus:outline-none transition-all font-bold ${
                        amountError
                          ? 'border-rose-400 focus:ring-2 focus:ring-rose-500/20 text-rose-900 bg-rose-50/20'
                          : 'border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800'
                      }`}
                    />
                  </div>
                  {amountError && (
                    <p className="text-xs text-rose-600 font-medium mt-1 flex items-center space-x-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{amountError}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      if (e.target.value) setDateError(null);
                    }}
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs focus:outline-none transition-all ${
                      dateError
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-500/20 text-rose-900 bg-rose-50/20'
                        : 'border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800'
                    }`}
                  />
                  {dateError && (
                    <p className="text-xs text-rose-600 font-medium mt-1 flex items-center space-x-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{dateError}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    City / Stop (Optional)
                  </label>
                  <select
                    value={stopId}
                    onChange={(e) => setStopId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  >
                    <option value="">General / Across Trip</option>
                    {stops.map(s => (
                      <option key={s.id} value={s.id}>{s.city_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Paid By
                </label>
                <input
                  type="text"
                  value={paidBy}
                  onChange={(e) => setPaidBy(e.target.value)}
                  placeholder="e.g. Alex"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes / Receipt Info
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Pre-paid online with confirmation code"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  {expenseToEdit ? 'Update Expense' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Set / Adjust Trip Budget Modal */}
      <SetBudgetModal
        isOpen={showSetBudgetModal}
        onClose={() => setShowSetBudgetModal(false)}
        trip={trip}
        onTripUpdated={onTripUpdated}
      />
    </div>
  );
};
