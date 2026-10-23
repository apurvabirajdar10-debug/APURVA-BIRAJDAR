import React, { useState, useEffect } from 'react';
import { X, Sparkles, MapPin, Calendar, IndianRupee, Clock, ArrowRight, CheckCircle2, AlertCircle, Compass, Train, Plane, RefreshCw, AlertTriangle, RotateCcw } from 'lucide-react';
import { api } from '../lib/api';
import { AIItineraryPlan, Trip } from '../types/travel';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTripSaved: (trip: Trip) => void;
  initialScope?: 'national' | 'international';
}

const NATIONAL_INSPIRATION_CHIPS = [
  { label: 'Golden Triangle', desc: 'Delhi, Agra & Jaipur royal heritage forts (7 days)', target: 'Delhi, Agra, and Jaipur, India' },
  { label: 'Kerala Backwaters', desc: 'Kochi, Munnar hills & Alleppey houseboats (6 days)', target: 'Kochi, Munnar, and Alleppey, India' },
  { label: 'Goa Coastal Serenity', desc: 'North & South Goa beaches, Old Goa forts (5 days)', target: 'Goa, India' },
  { label: 'Himachal Mountain Trail', desc: 'Manali, Solang Valley & Shimla (7 days)', target: 'Manali and Shimla, Himachal Pradesh, India' },
];

const INTERNATIONAL_INSPIRATION_CHIPS = [
  { label: 'Italy & Switzerland', desc: 'Milan, Lake Como, Zurich, Swiss Alps (8 days)', target: 'Switzerland and Italy' },
  { label: 'Japan Highlights', desc: 'Tokyo, Kyoto, Osaka bullet train tour (10 days)', target: 'Tokyo, Kyoto, and Osaka, Japan' },
  { label: 'Iberian Discovery', desc: 'Madrid, Seville, Lisbon, Porto (11 days)', target: 'Spain and Portugal' },
  { label: 'Nordic Cap', desc: 'Copenhagen, Stockholm, Oslo fjords (7 days)', target: 'Scandinavia (Denmark, Sweden, Norway)' },
];

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  onTripSaved,
  initialScope = 'national',
}) => {
  const [scope, setScope] = useState<'national' | 'international'>(initialScope);
  const [destination, setDestination] = useState('');
  const [duration, setDuration] = useState(8);
  const [budgetLevel, setBudgetLevel] = useState<'Budget' | 'Moderate' | 'Luxury'>('Moderate');
  const [interests, setInterests] = useState('');
  const [travelParty, setTravelParty] = useState('Couple');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0]
  );

  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [destinationError, setDestinationError] = useState<string | null>(null);
  const [generatedPlan, setGeneratedPlan] = useState<AIItineraryPlan | null>(null);
  const [saving, setSaving] = useState(false);

  // Dynamic loading phase messages
  useEffect(() => {
    let interval: any;
    if (loading) {
      setLoadingStage(0);
      interval = setInterval(() => {
        setLoadingStage((prev) => (prev + 1) % 4);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  if (!isOpen) return null;

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setDestinationError(null);
    setError(null);

    if (!destination.trim()) {
      setDestinationError('Destination or travel region is required.');
      return;
    }

    setLoading(true);

    // Timeout safety controller (30 seconds)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI generation timed out. The model took longer than expected.')), 30000)
    );

    try {
      const scopeInstruction = scope === 'national'
        ? `[STRICT CONSTRAINT: Every city, transit stop, and attraction MUST be inside India. Do NOT include any destination outside India.]`
        : `[STRICT CONSTRAINT: Every city, transit stop, and attraction MUST be outside India (International destination). Do NOT include Indian cities.]`;

      const fetchPromise = api.generateItinerary({
        destination: `${destination.trim()} ${scopeInstruction}`,
        duration_days: Number(duration),
        budget_level: budgetLevel,
        interests: interests.trim(),
        travel_party: travelParty,
        start_date: startDate,
      });

      const res = (await Promise.race([fetchPromise, timeoutPromise])) as { itinerary: AIItineraryPlan };
      setGeneratedPlan(res.itinerary);
    } catch (err: any) {
      setError(err.message || 'Failed to generate itinerary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToDatabase = async () => {
    if (!generatedPlan) return;
    setSaving(true);
    setError(null);

    try {
      // 1. Create main trip
      const tripRes = await api.createTrip({
        name: generatedPlan.name,
        start_date: generatedPlan.stops[0]?.start_date || startDate,
        end_date: generatedPlan.stops[generatedPlan.stops.length - 1]?.end_date || startDate,
        description: generatedPlan.description,
        cover_image: generatedPlan.cover_image || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80',
        budget_total: generatedPlan.estimated_budget,
        is_public: true,
      });

      const newTripId = tripRes.trip.id;

      // 2. Insert each stop and its activities
      for (let i = 0; i < generatedPlan.stops.length; i++) {
        const s = generatedPlan.stops[i];
        const stopRes = await api.addStop(newTripId, {
          city_name: s.city_name,
          country: s.country,
          order_index: i,
          start_date: s.start_date,
          end_date: s.end_date,
          transport_mode: s.transport_mode || 'flight',
          transport_notes: s.transport_notes || '',
        });

        const stopId = stopRes.stop.id;

        // Insert activities
        if (s.activities && s.activities.length > 0) {
          for (const act of s.activities) {
            await api.addActivity(newTripId, {
              stop_id: stopId,
              title: act.title,
              description: act.description,
              date: act.date,
              time_slot: act.time_slot,
              category: act.category,
              cost: act.cost,
              duration_hours: act.duration_hours,
              location: act.location,
            });
          }
        }
      }

      // Fetch the full trip with nested relations
      const finalRes = await api.getTrip(newTripId);
      onTripSaved(finalRes.trip);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save generated trip to database.');
    } finally {
      setSaving(false);
    }
  };

  const loadingMessages = [
    'Analyzing optimal city sequence & transit routes...',
    'Curating landmark experiences & cultural dining...',
    'Balancing activity pacing & daily schedules...',
    'Finalizing cost projections & local tips...',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <Sparkles className="w-6 h-6 text-amber-300 animate-pulse-glow" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold font-serif-heading">AI Travel Concierge</h2>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-semibold tracking-wide uppercase">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-xs text-white/80 mt-0.5">
                Describe your dream journey in natural language and receive an interconnected multi-city itinerary.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* STATE 1: LOADING SPINNER WITH STATUS TEXT */}
          {loading && (
            <div className="py-16 px-4 text-center space-y-6 animate-in fade-in duration-300">
              {/* Multi-ring clean animated spinner */}
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-violet-100 animate-pulse" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-violet-600 border-r-indigo-500 animate-spin" />
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-600 to-sky-500 flex items-center justify-center shadow-md">
                  <Compass className="w-5 h-5 text-white animate-spin" />
                </div>
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-lg font-bold text-slate-900 font-serif-heading tracking-wide">
                  AI is crafting your custom travel plan
                </h3>
                <p className="text-xs font-semibold text-violet-700 bg-violet-50 py-1.5 px-4 rounded-full inline-block border border-violet-100">
                  {loadingMessages[loadingStage]}
                </p>
                <p className="text-xs text-slate-500 pt-1">
                  Connecting destinations, timing high-speed rail & flights, and estimating realistic budgets for your journey.
                </p>
              </div>

              {/* Progress Bar Animation */}
              <div className="w-64 h-1.5 bg-slate-100 rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-gradient-to-r from-violet-600 to-sky-500 rounded-full animate-pulse-glow" style={{ width: '85%' }} />
              </div>
            </div>
          )}

          {/* STATE 2: GRACEFUL ERROR / FALLBACK STATE WITH TRY AGAIN BUTTON */}
          {!loading && error && (
            <div className="p-6 rounded-3xl bg-rose-50/70 border-2 border-rose-200 text-center space-y-4 my-4 animate-in fade-in">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-rose-900">
                  Unable to complete itinerary generation
                </h3>
                <p className="text-xs text-rose-700 max-w-md mx-auto">
                  {error}
                </p>
                <p className="text-[11px] text-slate-500 pt-1">
                  Your inputs have been preserved. You can try again immediately or adjust your travel requirements.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Adjust Requirements
                </button>
                <button
                  type="button"
                  onClick={() => handleGenerate()}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-rose-600/20 active:scale-95 transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </button>
              </div>
            </div>
          )}

          {/* STATE 3: INPUT FORM */}
          {!loading && !error && !generatedPlan && (
            <form onSubmit={handleGenerate} className="space-y-4">
              {/* Dual Scope Selection Screen / Buttons */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Destination Scope *
                </label>
                <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setScope('national');
                      setDestination('');
                      setDestinationError(null);
                    }}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                      scope === 'national'
                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25 ring-2 ring-amber-400/50'
                        : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                    }`}
                  >
                    <span className="text-base">🇮🇳</span>
                    <span>National (India)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setScope('international');
                      setDestination('');
                      setDestinationError(null);
                    }}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                      scope === 'international'
                        ? 'bg-sky-600 text-white shadow-md shadow-sky-600/25 ring-2 ring-sky-400/50'
                        : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                    }`}
                  >
                    <span className="text-base">🌐</span>
                    <span>International</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 px-1">
                  {scope === 'national'
                    ? 'Generates journeys restricted exclusively within India (heritage forts, backwaters, mountain circuits, coastal hubs).'
                    : 'Generates journeys strictly outside India (European rail tours, Asian metropolitan routes, Americas).'}
                </p>
              </div>

              {/* Quick inspiration chips based on active scope */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {scope === 'national' ? 'Popular Indian Route Inspirations' : 'Popular International Inspirations'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(scope === 'national' ? NATIONAL_INSPIRATION_CHIPS : INTERNATIONAL_INSPIRATION_CHIPS).map((chip) => (
                    <button
                      type="button"
                      key={chip.label}
                      onClick={() => {
                        setDestination(chip.target);
                        setInterests(chip.desc);
                        setDestinationError(null);
                      }}
                      className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-violet-50 hover:border-violet-200 text-left transition-all text-xs group cursor-pointer"
                    >
                      <p className="font-semibold text-slate-800 group-hover:text-violet-700">{chip.label}</p>
                      <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{chip.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Destination with inline validation */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-violet-600" />
                  <span>
                    {scope === 'national'
                      ? 'Which Indian regions or cities would you like to visit? *'
                      : 'Which international countries or cities would you like to visit? *'}
                  </span>
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => {
                    setDestination(e.target.value);
                    if (e.target.value.trim()) setDestinationError(null);
                  }}
                  placeholder={
                    scope === 'national'
                      ? 'e.g. Rajasthan Heritage Tour (Jaipur, Udaipur, Jodhpur), or Kerala Backwaters'
                      : 'e.g. Switzerland & Northern Italy, or Japan Cherry Blossom Route'
                  }
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none transition-all font-medium ${
                    destinationError
                      ? 'border-rose-400 focus:ring-2 focus:ring-rose-500/20 text-rose-900 bg-rose-50/30'
                      : 'border-slate-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-900'
                  }`}
                />
                {destinationError && (
                  <p className="text-xs text-rose-600 font-medium mt-1 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{destinationError}</span>
                  </p>
                )}
              </div>

              {/* Duration & Start Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-violet-600" />
                    <span>Duration (Days)</span>
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="30"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value, 10) || 7)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Target Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                    <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Budget Level</span>
                  </label>
                  <select
                    value={budgetLevel}
                    onChange={(e) => setBudgetLevel(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium"
                  >
                    <option value="Budget">Budget (₹ - Smart & Scrappy)</option>
                    <option value="Moderate">Moderate (₹₹ - Balanced Comfort)</option>
                    <option value="Luxury">Luxury (₹₹₹ - Premium Experiences)</option>
                  </select>
                </div>
              </div>

              {/* Travel Party & Interests */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Travel Group
                  </label>
                  <select
                    value={travelParty}
                    onChange={(e) => setTravelParty(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium"
                  >
                    <option value="Solo">Solo Traveler</option>
                    <option value="Couple">Couple / Romantic</option>
                    <option value="Family">Family with Kids</option>
                    <option value="Friends">Group of Friends</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Interests & Preferences
                  </label>
                  <input
                    type="text"
                    value={interests}
                    onChange={(e) => setInterests(e.target.value)}
                    placeholder="e.g. artisan bakeries, high-speed rail, contemporary art, relaxing pace"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-600 hover:from-violet-500 hover:to-sky-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-500/25 active:scale-98 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Generate Multi-City Itinerary with AI</span>
                </button>
              </div>
            </form>
          )}

          {/* STATE 4: REVIEW & SAVE ITINERARY PREVIEW */}
          {!loading && generatedPlan && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Trip Overview Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-50 to-sky-50 border border-violet-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-serif-heading">
                    {generatedPlan.name}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5 max-w-xl">
                    {generatedPlan.description}
                  </p>
                </div>
                <div className="flex items-center space-x-2 bg-white px-3.5 py-2 rounded-xl shadow-sm border border-slate-200 text-xs font-semibold text-slate-700 shrink-0">
                  <span className="font-bold text-emerald-600">₹</span>
                  <span>Est. Budget: ₹{generatedPlan.estimated_budget?.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Stops & Activities Preview */}
              <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                {generatedPlan.stops.map((stop, sIdx) => (
                  <div key={sIdx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center">
                          {sIdx + 1}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900">
                          {stop.city_name}, {stop.country}
                        </h4>
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        {stop.start_date} → {stop.end_date}
                      </div>
                    </div>

                    {stop.transport_notes && (
                      <div className="mt-2 text-xs text-indigo-700 flex items-center space-x-1.5 font-medium bg-indigo-50/80 px-2.5 py-1 rounded-lg">
                        <Train className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Transit ({stop.transport_mode}): {stop.transport_notes}</span>
                      </div>
                    )}

                    {/* Activities List */}
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {stop.activities.map((act, aIdx) => (
                        <div key={aIdx} className="p-2.5 bg-white rounded-xl border border-slate-100 shadow-2xs">
                          <div className="flex items-start justify-between">
                            <span className="text-xs font-semibold text-slate-800 line-clamp-1">{act.title}</span>
                            <span className="text-[11px] font-bold text-emerald-600 ml-1 shrink-0">₹{act.cost?.toLocaleString('en-IN')}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{act.description}</p>
                          <div className="flex items-center space-x-2 mt-1.5 text-[10px] text-slate-400 font-medium">
                            <span className="capitalize text-violet-600">{act.time_slot}</span>
                            <span>•</span>
                            <span>{act.duration_hours}h</span>
                            <span>•</span>
                            <span className="capitalize">{act.category}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setGeneratedPlan(null)}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Adjust Parameters</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={saving}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveToDatabase}
                    disabled={saving}
                    className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-sky-600/20 active:scale-98 transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Saving to Database...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Save Directly to My Trips</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
