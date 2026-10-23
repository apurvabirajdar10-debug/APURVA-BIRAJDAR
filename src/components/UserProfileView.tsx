import React, { useState } from 'react';
import { User, Trip } from '../types/travel';
import { api } from '../lib/api';
import { User as UserIcon, Mail, Globe, IndianRupee, Image as ImageIcon, Heart, Trash2, Plus, Download, Check, AlertCircle, Compass, Shield } from 'lucide-react';

interface UserProfileViewProps {
  user: User;
  trips: Trip[];
  onUserUpdated: (user: User) => void;
  onLogout: () => void;
  onExploreDestination: (city: string) => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
];

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  user,
  trips,
  onUserUpdated,
  onLogout,
  onExploreDestination,
}) => {
  const [name, setName] = useState(user.name);
  const [photoUrl, setPhotoUrl] = useState(user.photo_url || AVATAR_PRESETS[0]);
  const [language, setLanguage] = useState(user.language || 'en');
  const [currency, setCurrency] = useState(user.currency || 'USD');

  // Saved destinations parsed from JSON text or array
  const initialSaved = Array.isArray(user.saved_destinations)
    ? user.saved_destinations
    : (typeof user.saved_destinations === 'string' ? JSON.parse(user.saved_destinations || '[]') : []);

  const [savedDestinations, setSavedDestinations] = useState<string[]>(initialSaved);
  const [newDestInput, setNewDestInput] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(null);

    if (!name.trim()) {
      setNameError('Full name cannot be left blank.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.updateProfile({
        name: name.trim(),
        photo_url: photoUrl,
        language,
        currency,
        saved_destinations: savedDestinations,
      });
      onUserUpdated(res.user);
      showToast('Profile updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAddDestination = () => {
    if (!newDestInput.trim()) return;
    if (!savedDestinations.includes(newDestInput.trim())) {
      const updated = [...savedDestinations, newDestInput.trim()];
      setSavedDestinations(updated);
      setNewDestInput('');
    }
  };

  const handleRemoveDestination = (dest: string) => {
    const updated = savedDestinations.filter(d => d !== dest);
    setSavedDestinations(updated);
  };

  const handleExportData = () => {
    const exportObject = {
      user: {
        name: user.name,
        email: user.email,
        language: user.language,
        currency: user.currency,
      },
      trips,
      exportedAt: new Date().toISOString(),
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObject, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `globetrotter_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Itineraries exported as JSON!');
  };

  // Stats
  const totalStops = trips.reduce((acc, t) => acc + (t.destinations_count || t.stops?.length || 0), 0);
  const totalBudget = trips.reduce((acc, t) => acc + (t.budget_total || 0), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-2.5 rounded-2xl shadow-xl flex items-center space-x-2 text-xs font-semibold animate-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Profile Hero Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center gap-6">
        <div className="relative">
          <img
            src={photoUrl}
            alt={name}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover ring-4 ring-sky-100 shadow-md"
          />
          <div className="absolute -bottom-2 -right-2 p-1.5 rounded-xl bg-sky-600 text-white shadow-sm">
            <Compass className="w-4 h-4" />
          </div>
        </div>

        <div className="flex-1 text-center sm:text-left space-y-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h1 className="text-2xl font-bold font-serif-heading text-slate-900">{name}</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold uppercase tracking-wide self-center sm:self-auto">
              Globe Trotter Explorer
            </span>
          </div>
          <p className="text-xs text-slate-500">{user.email}</p>

          {/* Mini Stats Ribbon */}
          <div className="pt-3 flex flex-wrap justify-center sm:justify-start gap-4 text-xs font-semibold text-slate-700">
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Trips</span>
              <span>{trips.length} Planned</span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Cities</span>
              <span>{totalStops} Stops</span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Managed Budget</span>
              <span className="text-emerald-600">${totalBudget.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors cursor-pointer self-center sm:self-start"
        >
          Sign Out
        </button>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveProfile} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-6">
        <h2 className="text-lg font-bold font-serif-heading text-slate-900 border-b border-slate-100 pb-3">
          Traveler Settings & Preferences
        </h2>

        {/* Name & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center space-x-1.5">
              <UserIcon className="w-3.5 h-3.5 text-sky-600" />
              <span>Full Name *</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (e.target.value.trim()) setNameError(null);
              }}
              className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm transition-all font-medium ${
                nameError
                  ? 'border-rose-400 focus:ring-2 focus:ring-rose-500/20 text-rose-900 bg-rose-50/20'
                  : 'border-slate-200 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-800'
              }`}
            />
            {nameError && (
              <p className="text-xs text-rose-600 font-medium mt-1 flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{nameError}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center space-x-1.5">
              <Mail className="w-3.5 h-3.5 text-sky-600" />
              <span>Email Address</span>
            </label>
            <input
              type="email"
              disabled
              value={user.email}
              className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-500 font-medium cursor-not-allowed"
            />
          </div>
        </div>

        {/* Avatar Preset Picker */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center space-x-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
            <span>Profile Photo Preset or Custom URL</span>
          </label>
          <div className="flex items-center space-x-3 mb-2">
            {AVATAR_PRESETS.map((pUrl, i) => (
              <button
                type="button"
                key={i}
                onClick={() => setPhotoUrl(pUrl)}
                className={`w-12 h-12 rounded-2xl overflow-hidden border-2 transition-all ${
                  photoUrl === pUrl ? 'border-sky-600 ring-2 ring-sky-600/30 scale-105' : 'border-slate-200 opacity-70 hover:opacity-100'
                }`}
              >
                <img src={pUrl} alt="Avatar" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
          <input
            type="text"
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
            placeholder="Custom photo URL..."
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
          />
        </div>

        {/* Currency & Language */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center space-x-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
              <span>Preferred Currency</span>
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-semibold"
            >
              <option value="INR">INR (₹ - Indian Rupee)</option>
              <option value="USD">USD ($ - United States Dollar)</option>
              <option value="EUR">EUR (€ - Euro)</option>
              <option value="GBP">GBP (£ - British Pound)</option>
              <option value="JPY">JPY (¥ - Japanese Yen)</option>
              <option value="CAD">CAD ($ - Canadian Dollar)</option>
              <option value="AUD">AUD ($ - Australian Dollar)</option>
              <option value="CHF">CHF (CHF - Swiss Franc)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center space-x-1.5">
              <Globe className="w-3.5 h-3.5 text-sky-600" />
              <span>Language Preference</span>
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-semibold"
            >
              <option value="en">English (US / UK)</option>
              <option value="es">Español (Spanish)</option>
              <option value="fr">Français (French)</option>
              <option value="de">Deutsch (German)</option>
              <option value="ja">日本語 (Japanese)</option>
              <option value="it">Italiano (Italian)</option>
            </select>
          </div>
        </div>

        {/* Saved Destinations Wishlist */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <label className="block text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>Saved Wishlist Destinations ({savedDestinations.length})</span>
          </label>

          {/* Chips */}
          <div className="flex flex-wrap gap-2">
            {savedDestinations.map((dest) => (
              <span
                key={dest}
                className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-medium flex items-center space-x-2 group hover:bg-sky-50 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => onExploreDestination(dest.split(',')[0].trim())}
                  className="hover:text-sky-600 transition-colors"
                  title="Explore activities in this city"
                >
                  {dest}
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveDestination(dest)}
                  className="text-slate-400 hover:text-rose-600"
                  title="Remove from wishlist"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          {/* Add destination input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newDestInput}
              onChange={(e) => setNewDestInput(e.target.value)}
              placeholder="e.g. Barcelona, Spain"
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
            />
            <button
              type="button"
              onClick={handleAddDestination}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add to Wishlist</span>
            </button>
          </div>
        </div>

        {/* Submit Save */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-sky-600/20 active:scale-95 transition-all cursor-pointer"
          >
            {saving ? 'Saving Changes...' : 'Save Profile Settings'}
          </button>
        </div>
      </form>

      {/* Account & Data Management Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-slate-900 font-serif-heading">
          Data Management & Account Safety
        </h3>
        <p className="text-xs text-slate-500">
          All your trips, stops, activities, and expenses are persistently stored in your relational database. You can export a snapshot anytime.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleExportData}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center space-x-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export Trip Itineraries (JSON)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
