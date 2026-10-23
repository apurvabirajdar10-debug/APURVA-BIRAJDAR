import React, { useState } from 'react';
import { Plus, Sparkles, MapPin, Calendar, IndianRupee, ArrowRight, Compass, ShieldAlert, Award, Globe2, ChevronRight, PieChart, Sparkle, Navigation, Layers, ShieldCheck, CheckCircle2, SlidersHorizontal } from 'lucide-react';
import { Trip, User } from '../types/travel';
import { BudgetMeter } from './BudgetMeter';
import { DestinationScopeModal } from './DestinationScopeModal';

interface DashboardViewProps {
  user: User | null;
  trips: Trip[];
  onOpenCreateTrip: () => void;
  onOpenAIAssistant: () => void;
  onSelectTrip: (trip: Trip, targetTab?: string) => void;
  onExploreDestination: (city: string, scope?: 'national' | 'international') => void;
  activeScope?: 'national' | 'international';
  onScopeChange?: (scope: 'national' | 'international') => void;
}

const NATIONAL_RECOMMENDED_DESTINATIONS = [
  {
    city: 'Jaipur',
    country: 'India',
    tag: 'Royal Heritage',
    image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=600&q=80',
    description: 'Amber Fort hilltop ramparts, Hawa Mahal palace of winds, gemstone bazaars, and royal thali feasts.',
  },
  {
    city: 'Goa',
    country: 'India',
    tag: 'Coastal Paradise',
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80',
    description: 'Golden sandy beaches, vibrant sunset watersports, Old Goa Portuguese churches, and beachside shacks.',
  },
  {
    city: 'Manali',
    country: 'India',
    tag: 'Himalayan Retreat',
    image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=600&q=80',
    description: 'Solang Valley tandem paragliding, snow-clad Pir Panjal panoramas, and bohemian riverside cedar cafes.',
  },
  {
    city: 'Udaipur',
    country: 'India',
    tag: 'City of Lakes',
    image: 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=600&q=80',
    description: 'Lake Pichola sunset boat cruises, floating island marble palaces, and ornate City Palace courtyards.',
  },
  {
    city: 'Varanasi',
    country: 'India',
    tag: 'Spiritual Ghats',
    image: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=600&q=80',
    description: 'Dawn boat rides on holy River Ganga, synchronized evening Ganga Aarti, and sacred heritage alleyways.',
  },
  {
    city: 'Kochi',
    country: 'India',
    tag: 'Spice Coast',
    image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=600&q=80',
    description: 'Cantilevered Chinese fishing nets, colonial Fort Kochi villas, and serene Alleppey houseboat day cruises.',
  },
];

const INTERNATIONAL_RECOMMENDED_DESTINATIONS = [
  {
    city: 'Paris',
    country: 'France',
    tag: 'Culture & Romance',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80',
    description: 'Iconic landmarks, world-class art at the Louvre, and charming bohemian cafes.',
  },
  {
    city: 'Tokyo',
    country: 'Japan',
    tag: 'Modern & Tradition',
    image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80',
    description: 'Neon skylines, ancient Senso-ji shrine, Shinkansen rail hubs, and Michelin dining.',
  },
  {
    city: 'Rome',
    country: 'Italy',
    tag: 'Ancient History',
    image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=600&q=80',
    description: 'Walk through the Colosseum, toss a coin in Trevi, and savor authentic cacio e pepe.',
  },
  {
    city: 'Zurich',
    country: 'Switzerland',
    tag: 'Alpine Luxury',
    image: 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?auto=format&fit=crop&w=600&q=80',
    description: 'Crystal lake waters, scenic mountain rail gateways, and historic Old Town alleys.',
  },
  {
    city: 'London',
    country: 'United Kingdom',
    tag: 'Royal Heritage',
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=600&q=80',
    description: 'Tower of London & Crown Jewels, West End musical theater, and Sky Garden sunrise panoramas.',
  },
  {
    city: 'Barcelona',
    country: 'Spain',
    tag: 'Gaudí Architecture',
    image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=600&q=80',
    description: 'Sagrada Familia towers, mosaic Park Güell panoramas, and Gothic Quarter tapas crawls.',
  },
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  trips,
  onOpenCreateTrip,
  onOpenAIAssistant,
  onSelectTrip,
  onExploreDestination,
  activeScope,
  onScopeChange,
}) => {
  const [internalScope, setInternalScope] = useState<'national' | 'international'>(activeScope || 'national');
  const scope = activeScope || internalScope;
  const [scopeModalOpen, setScopeModalOpen] = useState(false);

  // Aggregate stats across user's trips
  const totalTrips = trips.length;
  const totalStops = trips.reduce((acc, t) => acc + (t.destinations_count || t.stops?.length || 0), 0);
  const totalBudget = trips.reduce((acc, t) => acc + (t.budget_total || 0), 0);
  const totalSpent = trips.reduce((acc, t) => acc + (t.total_spent || 0), 0);
  const budgetPercent = totalBudget > 0 ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Welcome Header */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 text-white p-6 sm:p-10 shadow-xl border border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-500/15 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-sky-300 mb-4">
            <Compass className="w-3.5 h-3.5" />
            <span>Next Generation Multi-City Planning</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-serif-heading text-white">
            Welcome back, {user ? user.name.split(' ')[0] : 'Traveler'}!
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
            Craft day-by-day multi-city routes, track live budgets, and let our AI concierge optimize travel pacing and reservations.
          </p>

          {/* Quick Buttons in Hero */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenCreateTrip}
              className="px-5 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-sky-500/25 active:scale-95 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Plan New Trip</span>
            </button>
            <button
              onClick={onOpenAIAssistant}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-600/25 active:scale-95 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>AI Trip Assistant</span>
            </button>
            <button
              type="button"
              onClick={() => setScopeModalOpen(true)}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/15 backdrop-blur-md active:scale-95 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <span>{scope === 'national' ? '🇮🇳' : '🌐'}</span>
              <span>Scope: {scope === 'national' ? 'National (India)' : 'International'}</span>
            </button>
          </div>
        </div>

        {/* Floating Quick Stats Badges */}
        <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-xs">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Planned Trips</span>
            <p className="text-xl sm:text-2xl font-bold text-white mt-0.5">{totalTrips}</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-xs">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Cities on Route</span>
            <p className="text-xl sm:text-2xl font-bold text-sky-400 mt-0.5">{totalStops}</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-xs">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Total Budget</span>
            <p className="text-xl sm:text-2xl font-bold text-emerald-400 mt-0.5">₹{totalBudget.toLocaleString('en-IN')}</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-xs">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Total Expenses</span>
            <p className="text-xl sm:text-2xl font-bold text-amber-400 mt-0.5">₹{totalSpent.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      {/* Prominent Action Cards Section: Plan New Trip & Ask AI Assistant */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Plan New Trip */}
        <div
          onClick={onOpenCreateTrip}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpenCreateTrip(); }}
          className="group relative bg-white hover:bg-gradient-to-br hover:from-white hover:to-sky-50/50 rounded-3xl p-6 sm:p-7 border-2 border-slate-200/90 hover:border-sky-500 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/25 group-hover:scale-105 transition-transform duration-300">
                <Plus className="w-7 h-7 stroke-[2.5]" />
              </div>
              <span className="px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-xs font-bold uppercase tracking-wider">
                Manual Builder
              </span>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif-heading group-hover:text-sky-600 transition-colors">
                Plan New Trip
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                Build a tailored multi-city itinerary from scratch. Set exact dates, add city stops with rail/flight transit modes, schedule morning/evening activities, and track daily spending.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium flex items-center space-x-1">
                <MapPin className="w-3 h-3 text-sky-500" />
                <span>Multi-City Stops</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium flex items-center space-x-1">
                <Calendar className="w-3 h-3 text-sky-500" />
                <span>Day-by-Day Timeline</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium flex items-center space-x-1">
                <IndianRupee className="w-3 h-3 text-emerald-500" />
                <span>Budget Tracking</span>
              </span>
            </div>
          </div>

          <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Interactive Form with Full Validation
            </span>
            <div className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold group-hover:bg-sky-700 transition-colors shadow-xs">
              <span>Start Planning</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Card 2: Ask AI Assistant */}
        <div
          onClick={onOpenAIAssistant}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpenAIAssistant(); }}
          className="group relative bg-white hover:bg-gradient-to-br hover:from-white hover:to-violet-50/50 rounded-3xl p-6 sm:p-7 border-2 border-slate-200/90 hover:border-violet-500 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/25 group-hover:scale-105 transition-transform duration-300">
                <Sparkles className="w-7 h-7 text-amber-300 animate-pulse-glow" />
              </div>
              <span className="px-3 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200 text-xs font-bold uppercase tracking-wider flex items-center space-x-1">
                <Sparkle className="w-3 h-3 text-violet-500" />
                <span>Gemini 3.8 Flash AI</span>
              </span>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif-heading group-hover:text-violet-600 transition-colors">
                Ask AI Assistant
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                Type your dream destination, travel duration, party style, and budget preferences in plain language. Our AI concierge instantly designs a complete, balanced multi-city itinerary.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <span className="px-2.5 py-1 rounded-lg bg-violet-50 text-violet-800 text-xs font-medium flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-violet-600" />
                <span>Natural Language Input</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-violet-50 text-violet-800 text-xs font-medium flex items-center space-x-1">
                <Layers className="w-3 h-3 text-violet-600" />
                <span>Curated Day Plans</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-violet-50 text-violet-800 text-xs font-medium flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>1-Click Save to Database</span>
              </span>
            </div>
          </div>

          <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Live Preview & Immediate Saving
            </span>
            <div className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-semibold group-hover:from-violet-500 group-hover:to-indigo-500 transition-colors shadow-xs">
              <span>Launch AI Planner</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Recent Trips + Budget Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Recent Trips */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-serif-heading">Your Active & Planned Trips</h2>
              <p className="text-xs text-slate-500">Multi-city itineraries saved in your relational database</p>
            </div>
            <button
              onClick={onOpenCreateTrip}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center space-x-1 cursor-pointer"
            >
              <span>+ Add Trip</span>
            </button>
          </div>

          {trips.length === 0 ? (
            <div className="p-10 rounded-3xl border border-dashed border-slate-300 text-center bg-white space-y-3">
              <Compass className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-semibold text-slate-700 text-sm">No trips planned yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Start your first adventure manually or ask our AI assistant to craft a tailored schedule.
              </p>
              <button
                onClick={onOpenCreateTrip}
                className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-semibold hover:bg-sky-700 shadow-sm cursor-pointer"
              >
                Plan First Trip
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {trips.map((trip) => {
                const spent = trip.total_spent || 0;
                const budget = trip.budget_total || 0;
                const percent = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
                const stopsCount = trip.destinations_count || trip.stops?.length || 0;

                return (
                  <div
                    key={trip.id}
                    className="group bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col"
                  >
                    {/* Cover Image banner */}
                    <div className="relative h-44 overflow-hidden">
                      <img
                        src={trip.cover_image}
                        alt={trip.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                      {/* Badges on image */}
                      <div className="absolute top-3 left-3 flex items-center space-x-1.5">
                        <span className="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-[10px] font-semibold flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-sky-400" />
                          <span>{stopsCount} {stopsCount === 1 ? 'Stop' : 'Stops'}</span>
                        </span>
                        {trip.is_public && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/80 backdrop-blur-md text-white text-[9px] font-bold uppercase">
                            Public
                          </span>
                        )}
                      </div>

                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <h3 className="font-bold text-base leading-tight drop-shadow font-serif-heading">
                          {trip.name}
                        </h3>
                        <p className="text-[11px] text-slate-200 mt-0.5 flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-sky-300" />
                          <span>{trip.start_date} → {trip.end_date}</span>
                        </p>
                      </div>
                    </div>

                    {/* Content Body */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                      {/* Cities chips */}
                      {trip.stops && trip.stops.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {trip.stops.slice(0, 4).map((s, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium"
                            >
                              {s.city_name}
                            </span>
                          ))}
                          {trip.stops.length > 4 && (
                            <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-medium">
                              +{trip.stops.length - 4} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Budget Mini Progress with Green, Yellow, Red States */}
                      <div className="space-y-1.5 pt-1 border-t border-slate-100">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-medium">Budget: ₹{budget.toLocaleString('en-IN')}</span>
                          <div className="flex items-center space-x-1">
                            <span className={`w-2 h-2 rounded-full ${
                              spent > budget && budget > 0
                                ? 'bg-rose-500 animate-pulse'
                                : percent >= 80
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`} />
                            <span className={`text-[10px] font-bold ${
                              spent > budget && budget > 0
                                ? 'text-rose-600'
                                : percent >= 80
                                ? 'text-amber-700'
                                : 'text-emerald-700'
                            }`}>
                              {spent > budget && budget > 0
                                ? 'Over Budget'
                                : percent >= 80
                                ? 'Near Limit'
                                : 'In Budget'}
                            </span>
                          </div>
                        </div>

                        {/* Visual 3-State Progress Bar */}
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden p-0.5">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              spent > budget && budget > 0
                                ? 'bg-rose-500 shadow-sm shadow-rose-500/50'
                                : percent >= 80
                                ? 'bg-amber-500 shadow-sm shadow-amber-500/50'
                                : 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>

                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>₹{spent.toLocaleString('en-IN')} spent</span>
                          <span>{percent}% utilized</span>
                        </div>
                      </div>

                      {/* Action Links with direct Budget Meter button */}
                      <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => onSelectTrip(trip, 'builder')}
                          className="py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold text-center transition-colors cursor-pointer"
                        >
                          Stops
                        </button>
                        <button
                          onClick={() => onSelectTrip(trip, 'budget')}
                          className="py-1.5 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold text-center transition-colors cursor-pointer flex items-center justify-center space-x-0.5"
                        >
                          <IndianRupee className="w-3 h-3 text-emerald-600" />
                          <span>Budget</span>
                        </button>
                        <button
                          onClick={() => onSelectTrip(trip, 'itinerary')}
                          className="py-1.5 px-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold text-center transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                        >
                          <span>Plan</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column (1 Col): Budget Highlights & Overbudget Monitor */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 font-serif-heading">Budget Highlights</h3>
              <PieChart className="w-4 h-4 text-sky-600" />
            </div>

            {/* Overall Portfolio Budget Meter with Green, Yellow, Red States */}
            <div className={`p-4 rounded-2xl border space-y-2 transition-all ${
              budgetPercent > 100
                ? 'bg-rose-50/70 border-rose-200'
                : budgetPercent >= 80
                ? 'bg-amber-50/70 border-amber-200'
                : 'bg-emerald-50/70 border-emerald-200'
            }`}>
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="flex items-center space-x-1.5 text-slate-700">
                  <span className={`w-2 h-2 rounded-full ${
                    budgetPercent > 100
                      ? 'bg-rose-500 animate-pulse'
                      : budgetPercent >= 80
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`} />
                  <span>Portfolio Budget Meter</span>
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border bg-white shadow-2xs ${
                  budgetPercent > 100
                    ? 'text-rose-700 border-rose-300'
                    : budgetPercent >= 80
                    ? 'text-amber-800 border-amber-300'
                    : 'text-emerald-700 border-emerald-300'
                }`}>
                  {budgetPercent > 100 ? 'Over Budget' : budgetPercent >= 80 ? 'About to Exceed' : 'In Budget'} ({budgetPercent}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    budgetPercent > 100
                      ? 'bg-rose-500 shadow-xs shadow-rose-500/50'
                      : budgetPercent >= 80
                      ? 'bg-amber-500 shadow-xs shadow-amber-500/50'
                      : 'bg-emerald-500 shadow-xs shadow-emerald-500/50'
                  }`}
                  style={{ width: `${Math.min(100, budgetPercent)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
                <span>Spent: ₹{totalSpent.toLocaleString('en-IN')}</span>
                <span>Target: ₹{totalBudget.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Featured Active Trip Budget Meter */}
            {trips.length > 0 && (
              <BudgetMeter
                trip={trips[0]}
                onOpenSetBudget={() => onSelectTrip(trips[0], 'budget')}
                compact={true}
              />
            )}

            {/* Quick Trip Cost Health List */}
            <div className="space-y-2.5">
              <span className="text-[11px] uppercase font-semibold text-slate-500 tracking-wider">
                Trip Breakdown
              </span>
              {trips.slice(0, 3).map((t) => {
                const isOver = (t.total_spent || 0) > (t.budget_total || 0) && (t.budget_total || 0) > 0;
                return (
                  <div
                    key={t.id}
                    onClick={() => onSelectTrip(t, 'budget')}
                    className="p-3 rounded-xl bg-white border border-slate-100 hover:border-sky-300 transition-colors flex items-center justify-between cursor-pointer group"
                  >
                    <div>
                      <h4 className="text-xs font-semibold text-slate-800 group-hover:text-sky-600 transition-colors">
                        {t.name}
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        Budget: ₹{(t.budget_total || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-bold ${isOver ? 'text-rose-600' : 'text-slate-800'}`}>
                        ₹{(t.total_spent || 0).toLocaleString('en-IN')}
                      </span>
                      {isOver && (
                        <p className="text-[9px] font-bold text-rose-500 uppercase">Over Limit</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Optimizer Callout */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-sky-600 text-white shadow-md space-y-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span className="text-xs font-bold uppercase tracking-wider">AI Travel Advantage</span>
            </div>
            <h4 className="font-serif-heading font-bold text-base leading-snug">
              Smart Itinerary Pacing & Rail Sequencing
            </h4>
            <p className="text-xs text-white/80 leading-relaxed">
              Our intelligent engine checks intercity transit times and balances packed sightseeing days with relaxed cafe mornings.
            </p>
            <button
              onClick={onOpenAIAssistant}
              className="w-full py-2.5 rounded-xl bg-white text-indigo-700 font-semibold text-xs hover:bg-white/90 shadow-sm transition-all cursor-pointer"
            >
              Generate AI Itinerary
            </button>
          </div>
        </div>
      </div>

      {/* Recommended Destinations Grid */}
      <div className="space-y-4 pt-4 border-t border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-slate-900 font-serif-heading">Recommended Destinations</h2>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                scope === 'national'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-sky-100 text-sky-900 border border-sky-300'
              }`}>
                {scope === 'national' ? '🇮🇳 India Exclusive' : '🌐 International'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {scope === 'national'
                ? 'Curated heritage forts, spiritual ghats, backwaters, and coastal hubs across India'
                : 'Top global metropolitan centers, European capitals, and scenic international getaways'}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {/* Scope Switcher Pill */}
            <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => {
                  setInternalScope('national');
                  onScopeChange?.('national');
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
                  scope === 'national'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🇮🇳</span>
                <span>National (India)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setInternalScope('international');
                  onScopeChange?.('international');
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
                  scope === 'international'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🌐</span>
                <span>International</span>
              </button>
            </div>

            <button
              onClick={() => onExploreDestination('', scope)}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center space-x-1 cursor-pointer px-2 py-1.5 rounded-lg hover:bg-sky-50"
            >
              <span>View In Catalog</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(scope === 'national' ? NATIONAL_RECOMMENDED_DESTINATIONS : INTERNATIONAL_RECOMMENDED_DESTINATIONS).map((dest) => (
            <div
              key={dest.city}
              onClick={() => onExploreDestination(dest.city, scope)}
              className="group relative rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer h-64 flex flex-col justify-end p-5 border border-slate-200"
            >
              <img
                src={dest.image}
                alt={dest.city}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

              <div className="relative z-10 text-white">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  scope === 'national'
                    ? 'bg-amber-500/80 text-white'
                    : 'bg-sky-500/80 text-white'
                }`}>
                  {dest.tag}
                </span>
                <h3 className="text-xl font-bold font-serif-heading mt-2">
                  {dest.city}, <span className="text-sm font-normal text-slate-300">{dest.country}</span>
                </h3>
                <p className="text-xs text-slate-200 line-clamp-2 mt-1 leading-normal opacity-90">
                  {dest.description}
                </p>
                <div className="mt-3 flex items-center text-xs font-semibold text-sky-300 group-hover:text-sky-200 space-x-1">
                  <span>Explore attractions & stays</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Destination Scope Selection Modal */}
      <DestinationScopeModal
        isOpen={scopeModalOpen}
        onClose={() => setScopeModalOpen(false)}
        initialScope={scope}
        onSelectScope={(selected) => {
          setInternalScope(selected);
          onScopeChange?.(selected);
          setScopeModalOpen(false);
        }}
        title="Choose Destination Scope"
        description="Choose whether to explore destinations across India or international getaways across the world."
      />
    </div>
  );
};

