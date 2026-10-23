import React, { useState, useEffect } from 'react';
import { IndianRupee, Plus, Trash2, Edit3, AlertTriangle, CheckCircle2, TrendingUp, PieChart, Tag, Calendar, MapPin, X, AlertCircle, Users, ArrowRightLeft, Check, Sparkles, HandCoins, ArrowRight, RefreshCw, UserCheck } from 'lucide-react';
import { Trip, Expense, Stop, TripBalancesResponse, SimplifiedDebt, Settlement, ExpenseSplit } from '../types/travel';
import { api } from '../lib/api';
import { BudgetMeter } from './BudgetMeter';
import { SetBudgetModal } from './SetBudgetModal';
import { TripMembersModal } from './TripMembersModal';

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
  const [activeTab, setActiveTab] = useState<'breakdown' | 'balances'>('breakdown');

  // Modals state
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showSetBudgetModal, setShowSetBudgetModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showCustomSettleModal, setShowCustomSettleModal] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

  // Balances state
  const [balances, setBalances] = useState<TripBalancesResponse | null>(null);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [settlingDebtId, setSettlingDebtId] = useState<string | null>(null);
  const [settleToast, setSettleToast] = useState<string | null>(null);

  // Custom settlement modal fields
  const [settleFrom, setSettleFrom] = useState('');
  const [settleTo, setSettleTo] = useState('');
  const [customSettleAmount, setCustomSettleAmount] = useState<string | number>('');
  const [settleNotes, setSettleNotes] = useState('');
  const [settleError, setSettleError] = useState<string | null>(null);

  // Expense form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'transport' | 'stay' | 'activities' | 'meals' | 'miscellaneous'>('meals');
  const [amount, setAmount] = useState<number | string>('');
  const [date, setDate] = useState(trip.start_date || new Date().toISOString().split('T')[0]);
  const [stopId, setStopId] = useState<number | ''>('');
  const [paidBy, setPaidBy] = useState(trip.user_name || 'Alex');
  const [paidByUserId, setPaidByUserId] = useState<number | null>(trip.user_id || null);
  const [notes, setNotes] = useState('');

  // Expense splitting state
  const [splitType, setSplitType] = useState<'equal' | 'exact' | 'percent'>('equal');
  const [sharedMemberNames, setSharedMemberNames] = useState<string[]>([]);
  const [exactAmounts, setExactAmounts] = useState<Record<string, string | number>>({});
  const [percentageSplits, setPercentageSplits] = useState<Record<string, string | number>>({});

  const [titleError, setTitleError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [splitError, setSplitError] = useState<string | null>(null);
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

  // Available member names for splitting
  const allMembers = trip.members && trip.members.length > 0
    ? trip.members
    : [{ id: 0, trip_id: trip.id, user_id: trip.user_id, email: trip.user_email || '', name: trip.user_name || 'Alex', role: 'owner' as const, status: 'accepted' as const }];

  // Load balances data
  const loadBalances = async () => {
    setLoadingBalances(true);
    try {
      const res = await api.getTripBalances(trip.id);
      setBalances(res);
    } catch (err: any) {
      console.warn('Failed to load balances:', err);
    } finally {
      setLoadingBalances(false);
    }
  };

  useEffect(() => {
    loadBalances();
  }, [trip.id, expenses.length]);

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

  const startDate = new Date(trip.start_date);
  const endDate = new Date(trip.end_date);
  const totalDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1);
  const dailyAverageBudget = totalBudget > 0 ? Math.round(totalBudget / totalDays) : 250;

  const dailyTotals: Record<string, number> = {};
  expenses.forEach(e => {
    dailyTotals[e.date] = (dailyTotals[e.date] || 0) + e.amount;
  });

  const overbudgetDays = Object.entries(dailyTotals).filter(([d, amt]) => amt > dailyAverageBudget * 1.3);

  // Initialize and open Add/Edit Expense modal
  const openAddModal = (existing?: Expense) => {
    setError(null);
    setTitleError(null);
    setAmountError(null);
    setDateError(null);
    setSplitError(null);

    const memberNamesList = allMembers.map(m => m.name);

    if (existing) {
      setExpenseToEdit(existing);
      setTitle(existing.title);
      setCategory(existing.category);
      setAmount(existing.amount);
      setDate(existing.date);
      setStopId(existing.stop_id ?? '');
      setPaidBy(existing.paid_by || (allMembers[0]?.name || 'Alex'));
      setPaidByUserId(existing.paid_by_user_id || null);
      setNotes(existing.notes || '');
      setSplitType(existing.split_type || 'equal');

      if (existing.splits && existing.splits.length > 0) {
        setSharedMemberNames(existing.splits.map(s => s.name));
        const exactMap: Record<string, number> = {};
        const pctMap: Record<string, number> = {};
        for (const s of existing.splits) {
          exactMap[s.name] = s.amount;
          if (s.percent !== undefined) pctMap[s.name] = s.percent;
        }
        setExactAmounts(exactMap);
        setPercentageSplits(pctMap);
      } else {
        setSharedMemberNames(memberNamesList);
        setExactAmounts({});
        setPercentageSplits({});
      }
    } else {
      setExpenseToEdit(null);
      setTitle('');
      setCategory('meals');
      setAmount('');
      setDate(trip.start_date || new Date().toISOString().split('T')[0]);
      setStopId(stops.length > 0 ? stops[0].id : '');
      setPaidBy(allMembers[0]?.name || trip.user_name || 'Alex');
      setPaidByUserId(allMembers[0]?.user_id || trip.user_id || null);
      setNotes('');
      setSplitType('equal');
      setSharedMemberNames(memberNamesList);
      setExactAmounts({});
      setPercentageSplits({});
    }
    setShowAddExpenseModal(true);
  };

  // Toggle member in shared list
  const toggleSharedMember = (memberName: string) => {
    setSharedMemberNames(prev => {
      if (prev.includes(memberName)) {
        if (prev.length <= 1) return prev; // Keep at least one
        return prev.filter(n => n !== memberName);
      } else {
        return [...prev, memberName];
      }
    });
  };

  const validateExpense = (): boolean => {
    let valid = true;
    setTitleError(null);
    setAmountError(null);
    setDateError(null);
    setSplitError(null);
    setError(null);

    if (!title.trim()) {
      setTitleError('Expense title cannot be left blank.');
      valid = false;
    }

    const numAmount = Number(amount);
    if (amount === '' || isNaN(numAmount) || numAmount <= 0) {
      setAmountError('Please enter a valid amount greater than 0.');
      valid = false;
    }

    if (!date) {
      setDateError('Date cannot be left blank.');
      valid = false;
    }

    if (sharedMemberNames.length === 0) {
      setSplitError('Select at least one member sharing this expense.');
      valid = false;
    }

    // Validate exact or percent splits if chosen
    if (splitType === 'exact') {
      const sumExact = sharedMemberNames.reduce((acc, name) => acc + (Number(exactAmounts[name]) || 0), 0);
      if (Math.abs(sumExact - numAmount) > 1) {
        setSplitError(`Exact split total (₹${sumExact}) must match expense amount (₹${numAmount}). Difference: ₹${Math.abs(sumExact - numAmount)}`);
        valid = false;
      }
    } else if (splitType === 'percent') {
      const sumPct = sharedMemberNames.reduce((acc, name) => acc + (Number(percentageSplits[name]) || 0), 0);
      if (Math.abs(sumPct - 100) > 0.5) {
        setSplitError(`Percentage split total (${sumPct}%) must equal 100%.`);
        valid = false;
      }
    }

    return valid;
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateExpense()) return;

    setLoading(true);
    const numAmount = Number(amount);

    // Build splits array
    const splitsPayload: ExpenseSplit[] = [];
    if (splitType === 'equal') {
      const share = numAmount / sharedMemberNames.length;
      for (const name of sharedMemberNames) {
        const mem = allMembers.find(m => m.name.toLowerCase() === name.toLowerCase());
        splitsPayload.push({
          userId: mem?.user_id || undefined,
          name,
          amount: Math.round(share * 100) / 100,
        });
      }
    } else if (splitType === 'exact') {
      for (const name of sharedMemberNames) {
        const mem = allMembers.find(m => m.name.toLowerCase() === name.toLowerCase());
        splitsPayload.push({
          userId: mem?.user_id || undefined,
          name,
          amount: Number(exactAmounts[name]) || 0,
        });
      }
    } else if (splitType === 'percent') {
      for (const name of sharedMemberNames) {
        const mem = allMembers.find(m => m.name.toLowerCase() === name.toLowerCase());
        const pct = Number(percentageSplits[name]) || 0;
        splitsPayload.push({
          userId: mem?.user_id || undefined,
          name,
          amount: Math.round((numAmount * pct) / 100 * 100) / 100,
          percent: pct,
        });
      }
    }

    try {
      const payload: Partial<Expense> = {
        title: title.trim(),
        category,
        amount: numAmount,
        currency: 'INR',
        date,
        stop_id: stopId !== '' ? Number(stopId) : null,
        paid_by: paidBy.trim(),
        paid_by_user_id: paidByUserId,
        split_type: splitType,
        splits: splitsPayload,
        notes: notes.trim(),
      };

      if (expenseToEdit) {
        await api.updateExpense(expenseToEdit.id, payload);
      } else {
        await api.addExpense(trip.id, payload);
      }

      // Refresh trip and balances
      const refreshed = await api.getTrip(trip.id);
      onTripUpdated(refreshed.trip);
      await loadBalances();
      setShowAddExpenseModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId: number) => {
    if (!confirm('Are you sure you want to remove this expense record?')) return;
    try {
      await api.deleteExpense(expenseId);
      const refreshed = await api.getTrip(trip.id);
      onTripUpdated(refreshed.trip);
      await loadBalances();
    } catch (err: any) {
      alert(err.message || 'Failed to delete expense');
    }
  };

  // Instant Settle Up handler
  const handleSettleDebt = async (debt: SimplifiedDebt) => {
    const debtKey = `${debt.fromName}-${debt.toName}`;
    setSettlingDebtId(debtKey);
    try {
      const res = await api.settleUp(trip.id, {
        from_name: debt.fromName,
        from_user_id: debt.fromUserId,
        to_name: debt.toName,
        to_user_id: debt.toUserId,
        amount: debt.amount,
        currency: 'INR',
        date: new Date().toISOString().split('T')[0],
        notes: `Settled simplified debt between ${debt.fromName} and ${debt.toName}`,
      });

      setBalances(res.balances);
      setSettleToast(`Successfully settled ₹${debt.amount.toLocaleString('en-IN')} from ${debt.fromName} to ${debt.toName}!`);
      setTimeout(() => setSettleToast(null), 4000);
      
      const refreshed = await api.getTrip(trip.id);
      onTripUpdated(refreshed.trip);
    } catch (err: any) {
      alert(err.message || 'Failed to settle debt');
    } finally {
      setSettlingDebtId(null);
    }
  };

  // Custom settlement modal submission
  const handleSaveCustomSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleFrom || !settleTo) {
      setSettleError('Select both payer and recipient.');
      return;
    }
    if (settleFrom === settleTo) {
      setSettleError('Payer and recipient cannot be the same member.');
      return;
    }
    const amt = Number(customSettleAmount);
    if (!amt || isNaN(amt) || amt <= 0) {
      setSettleError('Enter a valid amount greater than 0.');
      return;
    }

    try {
      const fromMem = allMembers.find(m => m.name === settleFrom);
      const toMem = allMembers.find(m => m.name === settleTo);

      const res = await api.settleUp(trip.id, {
        from_name: settleFrom,
        from_user_id: fromMem?.user_id,
        to_name: settleTo,
        to_user_id: toMem?.user_id,
        amount: amt,
        currency: 'INR',
        date: new Date().toISOString().split('T')[0],
        notes: settleNotes.trim() || 'Manual settlement',
      });

      setBalances(res.balances);
      setShowCustomSettleModal(false);
      setSettleToast(`Recorded ₹${amt.toLocaleString('en-IN')} payment from ${settleFrom} to ${settleTo}.`);
      setTimeout(() => setSettleToast(null), 4000);
    } catch (err: any) {
      setSettleError(err.message || 'Failed to record settlement');
    }
  };

  const handleDeleteSettlement = async (settlementId: number) => {
    if (!confirm('Undo this settlement record?')) return;
    try {
      const res = await api.deleteSettlement(trip.id, settlementId);
      setBalances(res.balances);
      setSettleToast('Settlement reversed.');
      setTimeout(() => setSettleToast(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to delete settlement');
    }
  };

  const filteredExpenses = expenses.filter(e => {
    if (categoryFilter === 'all') return true;
    return e.category === categoryFilter;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Alert for Settlements */}
      {settleToast && (
        <div className="p-4 rounded-2xl bg-emerald-600 text-white font-medium text-xs shadow-lg flex items-center justify-between animate-in slide-in-from-top-3 duration-200">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>{settleToast}</span>
          </div>
          <button onClick={() => setSettleToast(null)} className="text-emerald-200 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wide">
              Financial & Group Hub
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {trip.name} • {allMembers.length} {allMembers.length === 1 ? 'Collaborator' : 'Collaborators'}
            </span>
          </div>
          <h1 className="text-2xl font-bold font-serif-heading text-slate-900 mt-1">
            Trip Budget, Expenses & Balances
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time financial tracking, multi-member expense splitting (equal, exact, percent), and simplified debt settlement.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setShowMembersModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer border border-slate-200"
          >
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Group Members ({allMembers.length})</span>
          </button>
          <button
            onClick={() => setShowSetBudgetModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer border border-slate-200"
          >
            <IndianRupee className="w-4 h-4 text-emerald-600" />
            <span>Adjust Budget</span>
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

      {/* Primary Tab Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('breakdown')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'breakdown'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>Expenses & Budget ({expenses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('balances')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer relative ${
            activeTab === 'balances'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Balances & Debt Settlement</span>
          {balances?.simplifiedDebts && balances.simplifiedDebts.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
              {balances.simplifiedDebts.length}
            </span>
          )}
        </button>
      </div>

      {/* =========================================================================
          VIEW 1: EXPENSES & BUDGET BREAKDOWN TAB
         ========================================================================= */}
      {activeTab === 'breakdown' && (
        <div className="space-y-6">
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
                No expenses recorded matching the selected filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Expense Title</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Paid By</th>
                      <th className="py-3 px-4">Split Details</th>
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
                        <td className="py-3 px-4 text-slate-800 font-medium">
                          {exp.paid_by || '-'}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {exp.splits && exp.splits.length > 0 ? (
                            <div className="flex items-center space-x-1.5">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold uppercase">
                                {exp.split_type || 'equal'}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {exp.splits.length} members
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">All members (equal)</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          ₹{exp.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => openAddModal(exp)}
                              className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Expense"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(exp.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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
        </div>
      )}

      {/* =========================================================================
          VIEW 2: BALANCES SCREEN & SIMPLIFIED DEBTS
         ========================================================================= */}
      {activeTab === 'balances' && (
        <div className="space-y-6">
          {/* Top Control Bar for Balances */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Group Expense Settlement & Balances
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Debts are algorithmically simplified to minimize the number of transfers needed between members.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSettleError(null);
                  setSettleFrom(allMembers[0]?.name || '');
                  setSettleTo(allMembers[1]?.name || '');
                  setCustomSettleAmount('');
                  setSettleNotes('');
                  setShowCustomSettleModal(true);
                }}
                className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-200 transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <HandCoins className="w-3.5 h-3.5" />
                <span>Record Manual Settle</span>
              </button>
              <button
                type="button"
                onClick={loadBalances}
                disabled={loadingBalances}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
                title="Refresh Balances"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingBalances ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* SIMPLIFIED DEBTS SECTION ("WHO OWES WHOM") */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold font-serif-heading text-slate-900">
                    Who Owes Whom (Simplified Debts)
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-bold uppercase">
                    Optimal Transfers
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click <strong>"Settle Up"</strong> to record direct debt payment and balance your ledger instantly.
                </p>
              </div>
            </div>

            {(!balances?.simplifiedDebts || balances.simplifiedDebts.length === 0) ? (
              <div className="p-8 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-inner">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h4 className="text-sm font-bold text-emerald-950">
                  All Debts Are Settled!
                </h4>
                <p className="text-xs text-emerald-800 max-w-md mx-auto">
                  Every collaborator on {trip.name} is completely square. As new expenses are recorded, simplified debts will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {balances.simplifiedDebts.map((debt, idx) => {
                  const debtKey = `${debt.fromName}-${debt.toName}`;
                  const isSettling = settlingDebtId === debtKey;

                  return (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all shadow-xs"
                    >
                      {/* From -> To Row */}
                      <div className="flex items-center justify-between gap-3">
                        {/* Debtor */}
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                            {debt.fromName.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="text-[11px] font-semibold text-rose-600 uppercase block">Owes</span>
                            <span className="text-xs font-bold text-slate-900 truncate block">{debt.fromName}</span>
                          </div>
                        </div>

                        {/* Amount & Arrow */}
                        <div className="flex flex-col items-center px-2 shrink-0">
                          <span className="text-base font-extrabold text-slate-900">
                            ₹{debt.amount.toLocaleString('en-IN')}
                          </span>
                          <div className="flex items-center text-slate-400 mt-0.5">
                            <span className="w-8 h-0.5 bg-slate-300" />
                            <ArrowRight className="w-3.5 h-3.5 text-slate-500 -ml-1" />
                          </div>
                        </div>

                        {/* Creditor */}
                        <div className="flex items-center space-x-2.5 min-w-0 text-right justify-end">
                          <div className="min-w-0">
                            <span className="text-[11px] font-semibold text-emerald-600 uppercase block">Gets</span>
                            <span className="text-xs font-bold text-slate-900 truncate block">{debt.toName}</span>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                            {debt.toName.slice(0, 2).toUpperCase()}
                          </div>
                        </div>
                      </div>

                      {/* Settle Up Action Button */}
                      <button
                        type="button"
                        onClick={() => handleSettleDebt(debt)}
                        disabled={isSettling}
                        className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-[0.99] disabled:opacity-60"
                      >
                        {isSettling ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Recording Settlement...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 stroke-[2.5]" />
                            <span>Settle Up (₹{debt.amount.toLocaleString('en-IN')})</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* MEMBER NET BALANCES TABLE */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold font-serif-heading text-slate-900">
              Member Net Ledger & Spending Breakdown
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Total Paid Out</th>
                    <th className="py-3 px-4">Fair Share</th>
                    <th className="py-3 px-4 text-right">Net Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {balances?.members.map((m, idx) => {
                    const isOwed = m.netBalance > 0.5;
                    const owes = m.netBalance < -0.5;

                    return (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                              {m.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">{m.name}</span>
                              {m.email && <span className="text-[11px] text-slate-500">{m.email}</span>}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold capitalize">
                            {m.role || 'Member'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          ₹{m.totalPaid.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          ₹{m.totalOwed.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {isOwed ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold inline-block">
                              +₹{m.netBalance.toLocaleString('en-IN')} (is owed)
                            </span>
                          ) : owes ? (
                            <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold inline-block">
                              -₹{Math.abs(m.netBalance).toLocaleString('en-IN')} (owes)
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold inline-block">
                              Settled (₹0)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* SETTLEMENTS HISTORY */}
          {balances?.settlements && balances.settlements.length > 0 && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold font-serif-heading text-slate-900">
                Settlement History ({balances.settlements.length})
              </h3>

              <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                {balances.settlements.map((st) => (
                  <div key={st.id} className="p-3.5 bg-slate-50/50 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          {st.from_name} paid {st.to_name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {st.date} • {st.notes || 'Settled'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="font-extrabold text-xs text-emerald-700">
                        ₹{st.amount.toLocaleString('en-IN')}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteSettlement(st.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                        title="Delete settlement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODAL 1: ADD / EDIT EXPENSE WITH COMPLETE SPLIT MECHANISM
         ========================================================================= */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
              <div className="flex items-center space-x-2">
                <IndianRupee className="w-5 h-5 text-emerald-200" />
                <h3 className="font-bold text-sm font-serif-heading">
                  {expenseToEdit ? 'Edit Expense & Split' : 'Record Expense & Choose Split'}
                </h3>
              </div>
              <button
                onClick={() => setShowAddExpenseModal(false)}
                className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} noValidate className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Expense Title */}
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
                  placeholder="e.g. Vande Bharat Express / Taj Lake Palace Stay"
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

              {/* Category & Amount */}
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

              {/* Date & Stop */}
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
                    Associated Stop (Optional)
                  </label>
                  <select
                    value={stopId}
                    onChange={(e) => setStopId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  >
                    <option value="">General / Entire Trip</option>
                    {stops.map(s => (
                      <option key={s.id} value={s.id}>{s.city_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* WHO PAID? */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>Who Paid For This Expense?</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {allMembers.map(m => {
                    const isSelected = paidBy.toLowerCase() === m.name.toLowerCase();
                    return (
                      <button
                        key={m.id || m.name}
                        type="button"
                        onClick={() => {
                          setPaidBy(m.name);
                          setPaidByUserId(m.user_id || null);
                        }}
                        className={`p-2 rounded-xl text-xs font-bold text-left border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span className="block truncate">{m.name}</span>
                        <span className={`text-[10px] block ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                          {m.role || 'Member'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* WHO SHARED & SPLIT TYPE */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center space-x-1.5">
                    <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
                    <span>Split Method & Participants</span>
                  </label>
                </div>

                {splitError && (
                  <p className="text-xs text-rose-600 font-semibold flex items-center space-x-1 bg-white p-2 rounded-lg border border-rose-200">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{splitError}</span>
                  </p>
                )}

                {/* Split Type Selector */}
                <div className="grid grid-cols-3 gap-2">
                  {(['equal', 'exact', 'percent'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSplitType(type)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                        splitType === type
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-white text-slate-700 border border-indigo-200 hover:bg-indigo-100/50'
                      }`}
                    >
                      {type === 'equal' && '= Equal Split'}
                      {type === 'exact' && '₹ Exact Amounts'}
                      {type === 'percent' && '% Percentages'}
                    </button>
                  ))}
                </div>

                {/* Participants Checkbox List */}
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-semibold text-slate-600 block">
                    Select members who shared this expense:
                  </span>

                  <div className="space-y-2">
                    {allMembers.map(m => {
                      const isChecked = sharedMemberNames.includes(m.name);
                      const numAmount = Number(amount) || 0;
                      const equalShare = sharedMemberNames.length > 0 ? Math.round((numAmount / sharedMemberNames.length)) : 0;

                      return (
                        <div
                          key={m.name}
                          className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-indigo-100 shadow-2xs"
                        >
                          <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-medium text-slate-800">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSharedMember(m.name)}
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>{m.name}</span>
                          </label>

                          {/* Detail inputs depending on split type */}
                          {isChecked && (
                            <div className="flex items-center space-x-1.5">
                              {splitType === 'equal' && (
                                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                                  ₹{equalShare.toLocaleString('en-IN')}
                                </span>
                              )}

                              {splitType === 'exact' && (
                                <div className="flex items-center space-x-1">
                                  <span className="text-xs text-slate-400 font-bold">₹</span>
                                  <input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={exactAmounts[m.name] ?? ''}
                                    onChange={(e) => setExactAmounts(prev => ({ ...prev, [m.name]: e.target.value }))}
                                    className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-right"
                                  />
                                </div>
                              )}

                              {splitType === 'percent' && (
                                <div className="flex items-center space-x-1">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    placeholder="50"
                                    value={percentageSplits[m.name] ?? ''}
                                    onChange={(e) => setPercentageSplits(prev => ({ ...prev, [m.name]: e.target.value }))}
                                    className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-right"
                                  />
                                  <span className="text-xs text-slate-400 font-bold">%</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes / Receipt Info
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Paid online via UPI / Credit card"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-60"
                >
                  {loading ? 'Saving...' : (expenseToEdit ? 'Update Expense' : 'Record Expense')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: CUSTOM / MANUAL SETTLEMENT MODAL
         ========================================================================= */}
      {showCustomSettleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-sky-700 text-white">
              <div className="flex items-center space-x-2">
                <HandCoins className="w-5 h-5 text-indigo-200" />
                <h3 className="font-bold text-sm font-serif-heading">Record Debt Settlement</h3>
              </div>
              <button
                onClick={() => setShowCustomSettleModal(false)}
                className="p-1 rounded-full text-white/80 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomSettlement} className="p-6 space-y-4">
              {settleError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{settleError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Who paid the settlement? (Debtor)
                </label>
                <select
                  value={settleFrom}
                  onChange={(e) => setSettleFrom(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold"
                >
                  <option value="">Select payer...</option>
                  {allMembers.map(m => (
                    <option key={m.name} value={m.name}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Who received the settlement? (Creditor)
                </label>
                <select
                  value={settleTo}
                  onChange={(e) => setSettleTo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold"
                >
                  <option value="">Select recipient...</option>
                  {allMembers.map(m => (
                    <option key={m.name} value={m.name}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Settled Amount (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={customSettleAmount}
                  onChange={(e) => setCustomSettleAmount(e.target.value)}
                  placeholder="e.g. 600"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  placeholder="e.g. Settled via Google Pay UPI"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCustomSettleModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  Mark as Settled
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

      {/* Trip Collaborators / Members Modal */}
      <TripMembersModal
        isOpen={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        trip={trip}
        onTripUpdated={onTripUpdated}
      />
    </div>
  );
};
