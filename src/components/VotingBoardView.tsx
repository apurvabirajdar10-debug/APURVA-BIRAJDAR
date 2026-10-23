import React, { useState, useEffect } from 'react';
import {
  Vote,
  Plus,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  Calendar,
  Clock,
  MapPin,
  IndianRupee,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Filter,
  Check,
  ChevronDown,
  ArrowRight,
  ShieldAlert,
  Users,
  Compass,
  DollarSign
} from 'lucide-react';
import { Trip, ActivityProposal, VoteType, User } from '../types/travel';
import { api } from '../lib/api';

interface VotingBoardViewProps {
  trip: Trip;
  user: User | null;
  onTripUpdated: (updatedTrip: Trip) => void;
  onGoToItinerary?: () => void;
}

export const VotingBoardView: React.FC<VotingBoardViewProps> = ({
  trip,
  user,
  onTripUpdated,
  onGoToItinerary,
}) => {
  const [proposals, setProposals] = useState<ActivityProposal[]>([]);
  const [votingDeadline, setVotingDeadline] = useState<string | undefined>(trip.voting_deadline);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmittingVote, setIsSubmittingVote] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'accepted' | 'top'>('all');
  const [isProposeModalOpen, setIsProposeModalOpen] = useState(false);
  const [isDeadlineModalOpen, setIsDeadlineModalOpen] = useState(false);
  const [newDeadlineDate, setNewDeadlineDate] = useState<string>(
    trip.voting_deadline ? trip.voting_deadline.split('T')[0] : ''
  );

  // Proposal acceptance modal with budget impact
  const [proposalToAccept, setProposalToAccept] = useState<ActivityProposal | null>(null);
  const [selectedStopId, setSelectedStopId] = useState<number>(trip.stops?.[0]?.id || 0);
  const [selectedDate, setSelectedDate] = useState<string>(trip.stops?.[0]?.start_date || trip.start_date || '');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<'morning' | 'afternoon' | 'evening'>('afternoon');
  const [partySize, setPartySize] = useState<number>(trip.members && trip.members.length > 0 ? trip.members.length : 1);
  const [isAccepting, setIsAccepting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // New proposal form state
  const [newProposal, setNewProposal] = useState({
    title: '',
    place: '',
    cost_per_person: 500,
    category: 'sightseeing' as const,
    description: '',
    stop_id: trip.stops?.[0]?.id || undefined,
  });

  const isOwnerOrEditor = trip.user_role === 'owner' || trip.user_role === 'editor' || !trip.user_role;

  // Load proposals
  const fetchProposals = async () => {
    try {
      setIsLoading(true);
      const res = await api.getProposals(trip.id);
      setProposals(res.proposals || []);
      if (res.voting_deadline) {
        setVotingDeadline(res.voting_deadline);
      }
    } catch (err) {
      console.error('Failed to fetch proposals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, [trip.id]);

  // Handle voting
  const handleVote = async (proposalId: number, voteType: VoteType) => {
    try {
      setIsSubmittingVote(proposalId);
      const res = await api.voteProposal(proposalId, voteType, user?.name || 'Fellow Traveler');
      setProposals(prev => prev.map(p => (p.id === proposalId ? res.proposal : p)));
    } catch (err: any) {
      console.error('Vote failed:', err);
    } finally {
      setIsSubmittingVote(null);
    }
  };

  // Handle deadline update
  const handleSaveDeadline = async () => {
    if (!newDeadlineDate) return;
    try {
      const res = await api.setVotingDeadline(trip.id, newDeadlineDate);
      setVotingDeadline(res.deadline);
      setProposals(res.proposals);
      setIsDeadlineModalOpen(false);
      onTripUpdated({ ...trip, voting_deadline: res.deadline });
      setSuccessMessage('Voting deadline updated successfully.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update deadline');
    }
  };

  // Handle new proposal submission
  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProposal.title.trim() || !newProposal.place.trim()) return;

    try {
      const res = await api.proposeActivity(trip.id, {
        ...newProposal,
        proposer_name: user?.name || 'Explorer',
        cost_per_person: Number(newProposal.cost_per_person),
      });
      setProposals(res.proposals);
      setIsProposeModalOpen(false);
      setNewProposal({
        title: '',
        place: '',
        cost_per_person: 500,
        category: 'sightseeing',
        description: '',
        stop_id: trip.stops?.[0]?.id || undefined,
      });
      setSuccessMessage(`Proposal "${newProposal.title}" added to the board!`);
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to submit proposal');
    }
  };

  // Open accept modal with defaults
  const handleOpenAcceptModal = (proposal: ActivityProposal) => {
    setProposalToAccept(proposal);
    const stop = trip.stops?.find(s => s.id === proposal.stop_id) || trip.stops?.[0];
    if (stop) {
      setSelectedStopId(stop.id);
      setSelectedDate(stop.start_date || trip.start_date);
    }
    setPartySize(trip.members && trip.members.length > 0 ? trip.members.length : 1);
  };

  // Confirm accept proposal into itinerary
  const handleConfirmAccept = async () => {
    if (!proposalToAccept) return;
    try {
      setIsAccepting(true);
      const res = await api.acceptProposal(proposalToAccept.id, {
        stop_id: selectedStopId,
        date: selectedDate,
        time_slot: selectedTimeSlot,
        party_size: partySize,
      });

      // Update proposals list and trip state
      setProposals(prev =>
        prev.map(p => (p.id === proposalToAccept.id ? { ...p, status: 'accepted' } : p))
      );
      onTripUpdated(res.trip);
      setProposalToAccept(null);
      setSuccessMessage(`"${proposalToAccept.title}" added to itinerary with budget tracked!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to accept proposal into itinerary');
    } finally {
      setIsAccepting(false);
    }
  };

  // Filter and sort proposals
  const filteredProposals = proposals
    .filter(p => {
      if (filter === 'open') return p.status === 'open';
      if (filter === 'accepted') return p.status === 'accepted';
      return true;
    })
    .sort((a, b) => {
      if (filter === 'top') {
        return (b.score || 0) - (a.score || 0);
      }
      return (b.score || 0) - (a.score || 0); // default sorted by score
    });

  // Calculate deadline status
  const deadlineDate = votingDeadline ? new Date(votingDeadline) : null;
  const isExpired = deadlineDate ? new Date() > deadlineDate : false;
  const daysLeft = deadlineDate
    ? Math.max(0, Math.ceil((deadlineDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  // Budget calculations
  const totalSpent = trip.total_spent || 0;
  const budgetTotal = trip.budget_total || 50000;
  const remainingBudget = Math.max(0, budgetTotal - totalSpent);

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-amber-100/40 via-sky-100/30 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
              <Vote className="w-3.5 h-3.5 text-amber-600" />
              <span>Collaborative Trip Voting Board</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif-heading text-slate-900">
              Activity Voting for {trip.name}
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl">
              Propose places, restaurants, and excursions. Trip members vote <strong className="text-emerald-700">Yes</strong>, <strong className="text-slate-700">Maybe</strong>, or <strong className="text-rose-700">No</strong>. The group owner can instantly add top-voted picks straight to the day-by-day itinerary with exact budget impact analysis.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsProposeModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/20 flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Propose Activity</span>
            </button>

            {isOwnerOrEditor && (
              <button
                onClick={() => setIsDeadlineModalOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>{votingDeadline ? 'Change Deadline' : 'Set Deadline'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Voting Deadline Notice Bar */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3 text-xs">
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Voting Deadline:</span>
            {votingDeadline ? (
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  isExpired
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : daysLeft !== null && daysLeft <= 2
                    ? 'bg-amber-100 text-amber-900 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                }`}>
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {isExpired
                      ? 'Voting Closed'
                      : daysLeft === 0
                      ? 'Closes Today!'
                      : daysLeft === 1
                      ? '1 day remaining'
                      : `${daysLeft} days remaining (${new Date(votingDeadline).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })})`}
                  </span>
                </span>
              </div>
            ) : (
              <span className="text-slate-400 italic">No deadline set yet. Anyone can still cast votes.</span>
            )}
          </div>

          <div className="flex items-center space-x-4 text-xs text-slate-600">
            <div>
              <span className="text-slate-400">Total Proposals:</span>{' '}
              <strong className="text-slate-800 font-bold">{proposals.length}</strong>
            </div>
            <div>
              <span className="text-slate-400">Accepted:</span>{' '}
              <strong className="text-emerald-700 font-bold">
                {proposals.filter(p => p.status === 'accepted').length}
              </strong>
            </div>
            <div>
              <span className="text-slate-400">Trip Budget:</span>{' '}
              <strong className="text-slate-800 font-bold">₹{budgetTotal.toLocaleString('en-IN')}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          {onGoToItinerary && (
            <button
              onClick={onGoToItinerary}
              className="text-emerald-700 hover:text-emerald-900 underline font-bold"
            >
              View in Schedule →
            </button>
          )}
        </div>
      )}

      {/* Filter and Sorter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm text-xs">
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-slate-400 font-medium px-2 flex items-center space-x-1">
            <Filter className="w-3 h-3" />
            <span>Filter:</span>
          </span>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              filter === 'all' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All ({proposals.length})
          </button>
          <button
            onClick={() => setFilter('top')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center space-x-1 ${
              filter === 'top' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-3 h-3" />
            <span>Top Voted</span>
          </button>
          <button
            onClick={() => setFilter('open')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              filter === 'open' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Open for Votes ({proposals.filter(p => p.status === 'open').length})
          </button>
          <button
            onClick={() => setFilter('accepted')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              filter === 'accepted' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Added to Trip ({proposals.filter(p => p.status === 'accepted').length})
          </button>
        </div>

        <div className="text-slate-500 text-[11px] px-2">
          Sorted by net approval score (Yes minus No)
        </div>
      </div>

      {/* Proposals Grid */}
      {isLoading ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200">
          <div className="w-10 h-10 border-3 border-sky-600/30 border-t-sky-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">Loading voting board...</p>
        </div>
      ) : filteredProposals.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-4">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto text-amber-600">
            <Vote className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">No proposals found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Be the first traveler to propose a must-visit sunset spot, food walk, or day trip for the group to vote on!
            </p>
          </div>
          <button
            onClick={() => setIsProposeModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md cursor-pointer"
          >
            + Propose First Activity
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredProposals.map(proposal => {
            const yes = proposal.yesCount || 0;
            const maybe = proposal.maybeCount || 0;
            const no = proposal.noCount || 0;
            const totalVotes = yes + maybe + no;
            const netScore = proposal.score !== undefined ? proposal.score : yes - no;
            const isAccepted = proposal.status === 'accepted';
            const costTotalEst = proposal.cost_per_person * (trip.members?.length || 1);

            return (
              <div
                key={proposal.id}
                className={`bg-white rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between ${
                  isAccepted
                    ? 'border-emerald-200 bg-gradient-to-b from-emerald-50/20 to-white shadow-sm'
                    : 'border-slate-200 hover:shadow-md'
                }`}
              >
                <div>
                  {/* Top Bar: Category badge & Acceptance Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-slate-100 text-slate-700">
                        {proposal.category}
                      </span>
                      {proposal.stop_city_name && (
                        <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-sky-700">
                          <MapPin className="w-3 h-3 text-sky-500" />
                          <span>{proposal.stop_city_name}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {isAccepted ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>In Itinerary</span>
                        </span>
                      ) : (
                        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          netScore > 0
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : netScore < 0
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          <span>Score: {netScore > 0 ? `+${netScore}` : netScore}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Place */}
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    {proposal.title}
                  </h3>
                  <div className="flex items-center space-x-1.5 text-xs text-slate-500 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{proposal.place}</span>
                  </div>

                  {proposal.description && (
                    <p className="text-xs text-slate-600 mt-2.5 line-clamp-2 leading-relaxed">
                      "{proposal.description}"
                    </p>
                  )}

                  {/* Cost & Proposer metadata */}
                  <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Cost per Person</span>
                      <strong className="text-slate-900 font-extrabold text-sm">
                        ₹{proposal.cost_per_person.toLocaleString('en-IN')}
                      </strong>
                      <span className="text-[10px] text-slate-500 ml-1">
                        (~₹{costTotalEst.toLocaleString('en-IN')} for {trip.members?.length || 1} travelers)
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Proposed By</span>
                      <span className="font-semibold text-slate-700">{proposal.proposer_name}</span>
                    </div>
                  </div>

                  {/* Voting Distribution Bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{totalVotes} vote{totalVotes === 1 ? '' : 's'} cast</span>
                      <div className="flex items-center space-x-3 text-[11px] font-semibold">
                        <span className="text-emerald-700">{yes} Yes</span>
                        <span className="text-amber-700">{maybe} Maybe</span>
                        <span className="text-rose-700">{no} No</span>
                      </div>
                    </div>

                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                      {totalVotes > 0 ? (
                        <>
                          <div
                            style={{ width: `${(yes / totalVotes) * 100}%` }}
                            className="bg-emerald-500 transition-all duration-300"
                            title={`Yes: ${yes}`}
                          />
                          <div
                            style={{ width: `${(maybe / totalVotes) * 100}%` }}
                            className="bg-amber-400 transition-all duration-300"
                            title={`Maybe: ${maybe}`}
                          />
                          <div
                            style={{ width: `${(no / totalVotes) * 100}%` }}
                            className="bg-rose-400 transition-all duration-300"
                            title={`No: ${no}`}
                          />
                        </>
                      ) : (
                        <div className="w-full bg-slate-200" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  {/* Voting Buttons */}
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleVote(proposal.id, 'yes')}
                      disabled={isSubmittingVote === proposal.id || isExpired}
                      className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                        proposal.userVote === 'yes'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                      } disabled:opacity-50`}
                      title="Vote Yes"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>Yes</span>
                    </button>

                    <button
                      onClick={() => handleVote(proposal.id, 'maybe')}
                      disabled={isSubmittingVote === proposal.id || isExpired}
                      className={`flex-1 sm:flex-none px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                        proposal.userVote === 'maybe'
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                      } disabled:opacity-50`}
                      title="Vote Maybe"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Maybe</span>
                    </button>

                    <button
                      onClick={() => handleVote(proposal.id, 'no')}
                      disabled={isSubmittingVote === proposal.id || isExpired}
                      className={`flex-1 sm:flex-none px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                        proposal.userVote === 'no'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
                      } disabled:opacity-50`}
                      title="Vote No"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                      <span>No</span>
                    </button>
                  </div>

                  {/* 1-Tap Add to Itinerary Button */}
                  {!isAccepted && isOwnerOrEditor && (
                    <button
                      onClick={() => handleOpenAcceptModal(proposal)}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Add to Itinerary</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD TO ITINERARY & BUDGET IMPACT ANALYSIS
          ========================================================================= */}
      {proposalToAccept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[92vh] flex flex-col">
            <div className="p-6 bg-gradient-to-r from-emerald-700 to-teal-800 text-white relative">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-200 block">
                1-Tap Itinerary Addition & Budget Impact
              </span>
              <h2 className="text-xl font-bold font-serif-heading mt-1">
                {proposalToAccept.title}
              </h2>
              <div className="flex items-center space-x-2 text-xs text-white/80 mt-1">
                <MapPin className="w-3.5 h-3.5 text-amber-300" />
                <span>{proposalToAccept.place}</span>
                <span>•</span>
                <span>Category: {proposalToAccept.category}</span>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
              {/* Stop & Scheduling Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Target Trip Destination / Stop</label>
                  <select
                    value={selectedStopId}
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      setSelectedStopId(id);
                      const stop = trip.stops?.find(s => s.id === id);
                      if (stop?.start_date) setSelectedDate(stop.start_date);
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold text-slate-800 focus:outline-sky-500"
                  >
                    {trip.stops && trip.stops.length > 0 ? (
                      trip.stops.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.city_name}, {s.country}
                        </option>
                      ))
                    ) : (
                      <option value={0}>Main Trip Timeline</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold text-slate-800 focus:outline-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Time of Day</label>
                  <select
                    value={selectedTimeSlot}
                    onChange={(e) => setSelectedTimeSlot(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold text-slate-800 focus:outline-sky-500"
                  >
                    <option value="morning">Morning (09:00 - 13:00)</option>
                    <option value="afternoon">Afternoon (13:00 - 17:00)</option>
                    <option value="evening">Evening (17:00 - 21:00)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Travel Party Size</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={partySize}
                    onChange={(e) => setPartySize(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold text-slate-800 focus:outline-sky-500"
                  />
                </div>
              </div>

              {/* BUDGET IMPACT CARD */}
              {(() => {
                const activityTotal = proposalToAccept.cost_per_person * partySize;
                const newTotalSpent = totalSpent + activityTotal;
                const newRemaining = budgetTotal - newTotalSpent;
                const currentPct = Math.min(100, Math.round((totalSpent / budgetTotal) * 100));
                const newPct = Math.min(100, Math.round((newTotalSpent / budgetTotal) * 100));
                const isOverBudget = newTotalSpent > budgetTotal;

                return (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 font-bold text-slate-900 text-xs">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                        <span>Real-Time Budget Impact Analysis</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
                        ₹{proposalToAccept.cost_per_person} × {partySize} person{partySize > 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Before vs After comparison numbers */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Activity Cost</span>
                        <strong className="text-emerald-700 text-sm font-black">
                          +₹{activityTotal.toLocaleString('en-IN')}
                        </strong>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">New Total Spent</span>
                        <strong className="text-slate-900 text-sm font-black">
                          ₹{newTotalSpent.toLocaleString('en-IN')}
                        </strong>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Remaining</span>
                        <strong className={`text-sm font-black ${isOverBudget ? 'text-rose-600' : 'text-slate-900'}`}>
                          ₹{newRemaining.toLocaleString('en-IN')}
                        </strong>
                      </div>
                    </div>

                    {/* Progress Bar comparison */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                        <span>Current Budget Used: {currentPct}%</span>
                        <span className={isOverBudget ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}>
                          After Adding: {newPct}%
                        </span>
                      </div>
                      <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden flex">
                        <div
                          style={{ width: `${Math.min(100, currentPct)}%` }}
                          className="bg-sky-600"
                        />
                        <div
                          style={{ width: `${Math.min(100 - currentPct, newPct - currentPct)}%` }}
                          className={`${isOverBudget ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}
                        />
                      </div>
                    </div>

                    {isOverBudget && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                        <span>Warning: Adding this item will exceed total trip budget by ₹{(newTotalSpent - budgetTotal).toLocaleString('en-IN')}.</span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end space-x-2">
              <button
                onClick={() => setProposalToAccept(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={isAccepting}
                onClick={handleConfirmAccept}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                {isAccepting ? (
                  <span>Adding to Itinerary...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirm & Add to Schedule</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: PROPOSE NEW ACTIVITY
          ========================================================================= */}
      {isProposeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-sky-700 to-indigo-800 text-white">
              <h2 className="text-xl font-bold font-serif-heading">Propose an Activity</h2>
              <p className="text-xs text-sky-100 mt-1">
                Pitch an exciting stop, dish, or experience for fellow trip members to vote on.
              </p>
            </div>

            <form onSubmit={handleCreateProposal} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Activity Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunset Boat Ride at Mandovi River"
                  value={newProposal.title}
                  onChange={(e) => setNewProposal({ ...newProposal, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 font-medium text-slate-800 focus:outline-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Place / Venue *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Panaji Jetty, Goa"
                    value={newProposal.place}
                    onChange={(e) => setNewProposal({ ...newProposal, place: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 font-medium text-slate-800 focus:outline-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Cost Per Person (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="50"
                    value={newProposal.cost_per_person}
                    onChange={(e) => setNewProposal({ ...newProposal, cost_per_person: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 font-medium text-slate-800 focus:outline-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Category</label>
                  <select
                    value={newProposal.category}
                    onChange={(e) => setNewProposal({ ...newProposal, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold text-slate-800 focus:outline-sky-500"
                  >
                    <option value="sightseeing">Sightseeing</option>
                    <option value="food">Food & Dining</option>
                    <option value="adventure">Adventure & Outdoors</option>
                    <option value="culture">Culture & Heritage</option>
                    <option value="relaxation">Relaxation & Spa</option>
                    <option value="shopping">Shopping</option>
                    <option value="transport">Transport / Scenic</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">City / Stop Destination</label>
                  <select
                    value={newProposal.stop_id || ''}
                    onChange={(e) => setNewProposal({ ...newProposal, stop_id: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold text-slate-800 focus:outline-sky-500"
                  >
                    <option value="">General Trip</option>
                    {trip.stops?.map(s => (
                      <option key={s.id} value={s.id}>{s.city_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Why should the group go? (Pitch)</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Stunning sunset views with live Goan folk music, included snacks, and highly rated on Google (4.8★)."
                  value={newProposal.description}
                  onChange={(e) => setNewProposal({ ...newProposal, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 font-medium text-slate-800 focus:outline-sky-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsProposeModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Post to Voting Board
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: SET VOTING DEADLINE (OWNER ONLY)
          ========================================================================= */}
      {isDeadlineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4 text-xs">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-bold text-slate-900 font-serif-heading">Set Voting Deadline</h3>
            </div>
            <p className="text-slate-500">
              Pick the cutoff date when voting will freeze so the group can finalize reservations on time.
            </p>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Deadline Date</label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={newDeadlineDate}
                onChange={(e) => setNewDeadlineDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-bold text-slate-800 focus:outline-sky-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsDeadlineModalOpen(false)}
                className="px-3.5 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDeadline}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                Save Deadline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
