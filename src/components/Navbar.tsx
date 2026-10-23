import React, { useState } from 'react';
import { Compass, Sparkles, Plus, MapPin, Calendar, IndianRupee, User as UserIcon, LogOut, Menu, X, ChevronDown, ListFilter, Globe2, Ticket } from 'lucide-react';
import { User, Trip } from '../types/travel';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  user: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenCreateTrip: () => void;
  onOpenAIAssistant: () => void;
  activeTrip: Trip | null;
  onSelectTrip: (trip: Trip | null) => void;
  allTrips: Trip[];
  scope?: 'national' | 'international';
  onScopeChange?: (scope: 'national' | 'international') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  user,
  onOpenAuth,
  onLogout,
  onOpenCreateTrip,
  onOpenAIAssistant,
  activeTrip,
  onSelectTrip,
  allTrips,
  scope = 'national',
  onScopeChange,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tripDropdownOpen, setTripDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className="flex items-center space-x-2.5 text-left group focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-amber-500 p-0.5 shadow-md shadow-sky-600/20 group-hover:scale-105 transition-transform duration-200">
                <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                  <Compass className="w-5 h-5 text-sky-600 group-hover:rotate-45 transition-transform duration-300" />
                </div>
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-sky-600 transition-colors">
                  Globe<span className="text-sky-600">Trotter</span>
                </span>
                <span className="block text-[10px] uppercase tracking-wider text-slate-500 font-medium -mt-1">
                  Multi-City Travel Planner
                </span>
              </div>
            </button>

            {/* Active trip quick switcher badge if in trip sub-views */}
            {activeTrip && (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setTripDropdownOpen(!tripDropdownOpen)}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 text-xs font-medium hover:bg-sky-100 transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-sky-600" />
                  <span className="max-w-[140px] truncate">{activeTrip.name}</span>
                  <ChevronDown className="w-3 h-3 text-sky-600" />
                </button>

                {tripDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-100">
                      Switch Active Trip
                    </div>
                    <div className="max-h-60 overflow-y-auto py-1">
                      {allTrips.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => {
                            onSelectTrip(t);
                            setTripDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                            t.id === activeTrip.id ? 'bg-sky-50/70 font-semibold text-sky-700' : 'text-slate-700'
                          }`}
                        >
                          <span className="truncate">{t.name}</span>
                          <span className="text-[10px] text-slate-600 font-normal ml-2 shrink-0">
                            {t.stops?.length || 0} stops
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'dashboard'
                  ? 'text-sky-600 bg-sky-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentTab('trips')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'trips'
                  ? 'text-sky-600 bg-sky-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              My Trips
            </button>

            {/* Trip-specific navigation items if a trip is active */}
            {activeTrip && (
              <>
                <div className="h-4 w-px bg-slate-200 mx-1" />
                <button
                  onClick={() => setCurrentTab('builder')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                    currentTab === 'builder'
                      ? 'text-sky-600 bg-sky-50 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Stops & Builder</span>
                </button>
                <button
                  onClick={() => setCurrentTab('itinerary')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                    currentTab === 'itinerary'
                      ? 'text-sky-600 bg-sky-50 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Itinerary Schedule</span>
                </button>
                <button
                  onClick={() => setCurrentTab('budget')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                    currentTab === 'budget'
                      ? 'text-sky-600 bg-sky-50 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <IndianRupee className="w-3.5 h-3.5" />
                  <span>Budget & Costs</span>
                </button>
              </>
            )}

            <div className="h-4 w-px bg-slate-200 mx-1" />
            <button
              onClick={() => setCurrentTab('search')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                currentTab === 'search'
                  ? 'text-sky-600 bg-sky-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Globe2 className="w-3.5 h-3.5 text-sky-600" />
              <span>Browse Global Catalog</span>
            </button>
            <button
              onClick={() => setCurrentTab('bookings')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                currentTab === 'bookings'
                  ? 'text-sky-600 bg-sky-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Ticket className="w-3.5 h-3.5 text-amber-500" />
              <span>Bookings</span>
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center space-x-2.5">
            {/* Global Scope Switcher Pill */}
            {onScopeChange && (
              <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => onScopeChange('national')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center space-x-1 ${
                    scope === 'national'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Filter to destinations within India"
                >
                  <span>🇮🇳</span>
                  <span className="hidden xl:inline">National (India)</span>
                  <span className="xl:hidden">India</span>
                </button>
                <button
                  type="button"
                  onClick={() => onScopeChange('international')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center space-x-1 ${
                    scope === 'international'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Filter to international destinations outside India"
                >
                  <span>🌐</span>
                  <span className="hidden xl:inline">International</span>
                  <span className="xl:hidden">Global</span>
                </button>
              </div>
            )}

            {/* AI Assistant Quick Trigger */}
            <button
              onClick={onOpenAIAssistant}
              className="group flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-semibold shadow-sm shadow-indigo-500/20 hover:shadow-md hover:from-violet-500 hover:to-indigo-500 transition-all active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 group-hover:rotate-12 transition-transform" />
              <span>AI Assistant</span>
            </button>

            {/* Plan New Trip CTA */}
            <button
              onClick={onOpenCreateTrip}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm shadow-sky-600/20 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Trip</span>
            </button>

            {/* User Profile or Login */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none"
                >
                  <img
                    src={user.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'}
                    alt={user.name}
                    className="w-8 h-8 rounded-lg object-cover ring-2 ring-slate-200"
                  />
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden md:block" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-800">{user.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setCurrentTab('bookings');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2 transition-colors text-left"
                    >
                      <Ticket className="w-3.5 h-3.5 text-amber-500" />
                      <span>Bookings Concierge</span>
                    </button>
                    <button
                      onClick={() => {
                        setCurrentTab('profile');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2 transition-colors text-left"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                      <span>Profile & Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        onLogout();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center space-x-2 transition-colors text-left"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-500" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-3.5 py-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors border border-sky-200"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex items-center space-x-2 lg:hidden">
            <button
              onClick={onOpenAIAssistant}
              className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
              title="AI Assistant"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-3">
          {/* Scope Selector Mobile */}
          {onScopeChange && (
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block px-1">
                Destination Filter Scope
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    onScopeChange('national');
                    setMobileMenuOpen(false);
                  }}
                  className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                    scope === 'national'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  <span>🇮🇳</span>
                  <span>National (India)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onScopeChange('international');
                    setMobileMenuOpen(false);
                  }}
                  className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                    scope === 'international'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  <span>🌐</span>
                  <span>International</span>
                </button>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <button
              onClick={() => {
                setCurrentTab('dashboard');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Dashboard
            </button>
            <button
              onClick={() => {
                setCurrentTab('trips');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              My Trips
            </button>
            {activeTrip && (
              <>
                <button
                  onClick={() => {
                    setCurrentTab('builder');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 flex items-center space-x-2"
                >
                  <MapPin className="w-4 h-4 text-sky-600" />
                  <span>Stops & Builder ({activeTrip.name})</span>
                </button>
                <button
                  onClick={() => {
                    setCurrentTab('itinerary');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 flex items-center space-x-2"
                >
                  <Calendar className="w-4 h-4 text-sky-600" />
                  <span>Itinerary Schedule</span>
                </button>
                <button
                  onClick={() => {
                    setCurrentTab('budget');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 flex items-center space-x-2"
                >
                  <IndianRupee className="w-4 h-4 text-sky-600" />
                  <span>Budget & Costs</span>
                </button>
              </>
            )}
            <button
              onClick={() => {
                setCurrentTab('search');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Browse Global Catalog & 3D Globe
            </button>
            <button
              onClick={() => {
                setCurrentTab('bookings');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 flex items-center space-x-2"
            >
              <Ticket className="w-4 h-4 text-amber-500" />
              <span>Bookings (Transit, Stays & Attractions)</span>
            </button>
            <button
              onClick={() => {
                setCurrentTab('profile');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Profile & Preferences
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <button
              onClick={() => {
                onOpenCreateTrip();
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Plan New Trip</span>
            </button>
            {user ? (
              <button
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2 px-4 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-sm font-medium flex items-center justify-center space-x-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out ({user.name})</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  onOpenAuth();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2 px-4 border border-sky-600 text-sky-600 rounded-xl text-sm font-semibold"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
