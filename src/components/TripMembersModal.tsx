import React, { useState } from 'react';
import { X, UserPlus, Users, Copy, Check, Mail, Shield, Trash2, Link as LinkIcon, AlertCircle, Sparkles } from 'lucide-react';
import { Trip, TripMember } from '../types/travel';
import { api } from '../lib/api';

interface TripMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  onTripUpdated: (updatedTrip: Trip) => void;
}

export const TripMembersModal: React.FC<TripMembersModalProps> = ({
  isOpen,
  onClose,
  trip,
  onTripUpdated,
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('editor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const members = trip.members || [];
  const inviteCode = trip.invite_code || 'GT-TRIP';
  const shareUrl = `${window.location.origin}/?join=${inviteCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.inviteTripMember(trip.id, {
        email: email.trim(),
        name: name.trim() || undefined,
        role,
      });

      setSuccess(`Invited ${email.trim()} to the trip!`);
      setEmail('');
      setName('');
      
      // Refresh trip
      const refreshed = await api.getTrip(trip.id);
      onTripUpdated(refreshed.trip);
    } catch (err: any) {
      setError(err.message || 'Failed to invite member');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!confirm('Are you sure you want to remove this member from the trip?')) return;
    try {
      await api.removeTripMember(trip.id, memberId);
      const refreshed = await api.getTrip(trip.id);
      onTripUpdated(refreshed.trip);
    } catch (err: any) {
      alert(err.message || 'Failed to remove member');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold font-serif-heading">Trip Collaborators & Members</h2>
              </div>
              <p className="text-xs text-white/80 mt-0.5">
                Invite friends and co-travelers to view, edit, and split expenses on {trip.name}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Shareable Invite Link Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-sky-50/60 to-purple-50/60 border border-indigo-100/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <LinkIcon className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-indigo-950">Shareable Invite Link</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-indigo-100/80 text-[10px] font-mono font-bold text-indigo-700">
                Code: {inviteCode}
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              Anyone with this link can join this trip as a collaborator to edit the itinerary and log shared expenses.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs text-slate-700 font-mono truncate focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Invite Form */}
          <form onSubmit={handleInvite} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <UserPlus className="w-3.5 h-3.5 text-sky-600" />
              <span>Invite New Member by Email</span>
            </h3>

            {error && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
                <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{success}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="friend@traveler.com"
                    required
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Name (Optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sarah Chen"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center space-x-2">
                <label className="text-xs text-slate-600 font-medium">Role:</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                >
                  <option value="editor">Editor (Can edit stops & split expenses)</option>
                  <option value="viewer">Viewer (Read-only)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-60"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{loading ? 'Sending...' : 'Send Invite'}</span>
              </button>
            </div>
          </form>

          {/* Members List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Current Trip Members ({members.length})
              </h3>
              <span className="text-[11px] text-slate-500">All members can collaborate</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {members.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                  No members added yet. Share your invite link or enter an email above.
                </div>
              ) : (
                members.map((m, idx) => {
                  const isOwner = m.role === 'owner' || m.user_id === trip.user_id;
                  const initials = (m.name || m.email || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

                  return (
                    <div
                      key={m.id || idx}
                      className="p-3 rounded-2xl bg-white border border-slate-200 flex items-center justify-between hover:border-slate-300 transition-colors shadow-xs"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                          {m.photo_url ? (
                            <img src={m.photo_url} alt={m.name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{initials}</span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-900">{m.name}</span>
                            {isOwner && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                                Owner
                              </span>
                            )}
                            {!isOwner && (
                              <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-medium capitalize">
                                {m.role}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500">{m.email}</span>
                        </div>
                      </div>

                      {!isOwner && m.id && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(m.id!)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 flex items-center space-x-1">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Shared edits sync in real time across sessions.</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
