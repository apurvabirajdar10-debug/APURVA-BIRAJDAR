import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Filter, MapPin, IndianRupee, Clock, Star, Plus, Check, Compass, AlertCircle, X, ChevronDown, CheckCircle2, Globe2, Layers, LayoutGrid, Sparkles, Globe, SlidersHorizontal, ArrowRight, Eye, Navigation } from 'lucide-react';
import { CatalogItem, Trip, Stop } from '../types/travel';
import { api } from '../lib/api';
import { Interactive3DGlobe } from './Interactive3DGlobe';
import { AddCityToTripModal } from './AddCityToTripModal';
import { DestinationScopeModal } from './DestinationScopeModal';
import { GlobeCity, GLOBE_CITIES } from '../data/globeCities';
import { getDistributedAttractionsForCity, CuratedAttraction } from '../data/cityAttractions';

interface CatalogSearchViewProps {
  trips: Trip[];
  onActivityAddedToTrip: (updatedTrip: Trip) => void;
  initialQuery?: string;
  onOpenCreateTrip: () => void;
  initialScope?: 'national' | 'international';
  onScopeChange?: (scope: 'national' | 'international') => void;
}

export const CatalogSearchView: React.FC<CatalogSearchViewProps> = ({
  trips,
  onActivityAddedToTrip,
  initialQuery = '',
  onOpenCreateTrip,
  initialScope = 'national',
  onScopeChange,
}) => {
  const [scope, setScope] = useState<'national' | 'international'>(initialScope);
  const [scopeModalOpen, setScopeModalOpen] = useState(false);

  const [query, setQuery] = useState(initialQuery);
  const [country, setCountry] = useState('all');
  const [category, setCategory] = useState('all');
  const [costIndex, setCostIndex] = useState('all');
  const [maxDuration, setMaxDuration] = useState<number>(5);

  const [items, setItems] = useState<CatalogItem[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 3D Globe & View Layout State
  const [viewMode, setViewMode] = useState<'split' | 'globe' | 'cards'>('split');
  const [selectedCityForAdd, setSelectedCityForAdd] = useState<GlobeCity | null>(null);
  const [activeGlobeCity, setActiveGlobeCity] = useState<string>(
    initialQuery || (initialScope === 'national' ? 'New Delhi' : 'Paris')
  );

  // Dedicated Search Bar for 3D Globe with Auto-Suggest
  const [citySearchInput, setCitySearchInput] = useState<string>('');
  const [showCityDropdown, setShowCityDropdown] = useState<boolean>(false);
  const citySearchContainerRef = useRef<HTMLDivElement>(null);

  // Close city search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (citySearchContainerRef.current && !citySearchContainerRef.current.contains(e.target as Node)) {
        setShowCityDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered city suggestions for the dedicated search bar
  const filteredCitySuggestions = useMemo(() => {
    const q = citySearchInput.toLowerCase().trim();
    const scopeCities = GLOBE_CITIES.filter(c => c.scope === scope);
    if (!q) {
      return scopeCities.slice(0, 8);
    }
    return scopeCities.filter(c => {
      return c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q);
    }).slice(0, 8);
  }, [citySearchInput, scope]);

  // Curated Must-Watch places dynamically loaded for the active 3D globe city
  const mustWatchPlaces = useMemo(() => {
    const currentCityObj = GLOBE_CITIES.find(c => c.name.toLowerCase() === activeGlobeCity.toLowerCase());
    const cityCountry = currentCityObj?.country || (scope === 'national' ? 'India' : '');
    return getDistributedAttractionsForCity(activeGlobeCity, cityCountry, 4);
  }, [activeGlobeCity, scope]);

  // "Add to Trip" Modal State
  const [selectedItemToAdd, setSelectedItemToAdd] = useState<CatalogItem | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<number | ''>('');
  const [selectedStopId, setSelectedStopId] = useState<number | ''>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [adding, setAdding] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleScopeChange = (newScope: 'national' | 'international') => {
    setScope(newScope);
    setScopeModalOpen(false);
    setCountry('all');
    setQuery('');
    setCitySearchInput('');
    const defaultCity = newScope === 'national' ? 'New Delhi' : 'Paris';
    setActiveGlobeCity(defaultCity);
    onScopeChange?.(newScope);
    setToastMessage(`Switched destination scope to ${newScope === 'national' ? 'National (India)' : 'International'}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleGlobeSelectCity = (cityName: string) => {
    setActiveGlobeCity(cityName);
    setCitySearchInput(cityName);
    setShowCityDropdown(false);
    setQuery(cityName);
    setCountry('all');
    setToastMessage(`Smoothly pointing 3D Globe to ${cityName}. Other markers cleared.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleGlobeAddCity = (city: GlobeCity) => {
    setSelectedCityForAdd(city);
  };

  const handleAddMustWatchToTrip = (place: CuratedAttraction) => {
    const matched = GLOBE_CITIES.find(c => c.name.toLowerCase() === activeGlobeCity.toLowerCase());
    const itemToAdd: CatalogItem = {
      id: String(Date.now()),
      city_name: activeGlobeCity,
      country: matched?.country || (scope === 'national' ? 'India' : 'International'),
      title: place.title,
      description: place.description,
      category: place.category,
      cost: Math.round(place.cost / 85),
      cost_index: place.cost > 5000 ? 'luxury' : place.cost > 2000 ? 'moderate' : 'budget',
      duration_hours: place.duration_hours,
      popularity: 95,
      recommended_time: place.time_slot,
      rating: 4.9,
      image_url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=600&q=80',
    };
    openAddToTripModal(itemToAdd);
  };

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.searchCatalog({
        scope,
        query: query.trim() || undefined,
        country: country !== 'all' ? country : undefined,
        category: category !== 'all' ? category : undefined,
        cost_index: costIndex !== 'all' ? costIndex : undefined,
        max_duration: maxDuration < 5 ? maxDuration : undefined,
      });
      setItems(res.items);
      setCountries(res.countries);
    } catch (err: any) {
      setError(err.message || 'Failed to search catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [scope, country, category, costIndex, maxDuration]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchItems();
  };

  const openAddToTripModal = (item: CatalogItem) => {
    setSelectedItemToAdd(item);
    setSelectedTimeSlot(item.recommended_time);

    // Pick first trip if available
    if (trips.length > 0) {
      const firstTrip = trips[0];
      setSelectedTripId(firstTrip.id);

      // Check if any stop matches item city
      const matchingStop = firstTrip.stops?.find(s => s.city_name.toLowerCase() === item.city_name.toLowerCase());
      if (matchingStop) {
        setSelectedStopId(matchingStop.id);
        setSelectedDate(matchingStop.start_date);
      } else if (firstTrip.stops && firstTrip.stops.length > 0) {
        setSelectedStopId(firstTrip.stops[0].id);
        setSelectedDate(firstTrip.stops[0].start_date);
      } else {
        setSelectedStopId('');
        setSelectedDate(firstTrip.start_date);
      }
    } else {
      setSelectedTripId('');
      setSelectedStopId('');
    }
  };

  const handleTripChange = (tripId: number) => {
    setSelectedTripId(tripId);
    const chosenTrip = trips.find(t => t.id === tripId);
    if (chosenTrip && chosenTrip.stops && chosenTrip.stops.length > 0) {
      const matchingStop = chosenTrip.stops.find(s =>
        s.city_name.toLowerCase() === selectedItemToAdd?.city_name.toLowerCase()
      );
      const chosenStop = matchingStop || chosenTrip.stops[0];
      setSelectedStopId(chosenStop.id);
      setSelectedDate(chosenStop.start_date);
    } else {
      setSelectedStopId('');
      if (chosenTrip) setSelectedDate(chosenTrip.start_date);
    }
  };

  const handleConfirmAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemToAdd || !selectedTripId) return;

    setAdding(true);
    try {
      const targetTrip = trips.find(t => t.id === Number(selectedTripId));
      let stopId = selectedStopId;

      // If no stop exists, automatically create a stop for this city!
      if (!stopId && targetTrip) {
        const newStopRes = await api.addStop(targetTrip.id, {
          city_name: selectedItemToAdd.city_name,
          country: selectedItemToAdd.country,
          start_date: targetTrip.start_date,
          end_date: targetTrip.end_date,
          transport_mode: 'flight',
        });
        stopId = newStopRes.stop.id;
      }

      const res = await api.addActivity(Number(selectedTripId), {
        stop_id: Number(stopId),
        title: selectedItemToAdd.title,
        description: selectedItemToAdd.description,
        date: selectedDate || targetTrip?.start_date || '2026-06-10',
        time_slot: selectedTimeSlot,
        category: selectedItemToAdd.category,
        cost: Math.round(selectedItemToAdd.cost * 85),
        duration_hours: selectedItemToAdd.duration_hours,
        location: `${selectedItemToAdd.city_name}, ${selectedItemToAdd.country}`,
        booking_status: 'planned',
      });

      onActivityAddedToTrip(res.trip);
      setSelectedItemToAdd(null);
      setToastMessage(`Added "${selectedItemToAdd.title}" to ${targetTrip?.name}!`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to add activity to trip');
    } finally {
      setAdding(false);
    }
  };

  const currentChosenTrip = trips.find(t => t.id === Number(selectedTripId));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-2.5 rounded-2xl shadow-xl flex items-center space-x-2 text-xs font-semibold animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header with 3D Globe View Switcher */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-bold uppercase tracking-wide">
              Global Discovery
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {items.length} {scope === 'national' ? 'Indian (National) Experiences' : 'International Experiences'}
            </span>
          </div>
          <h1 className="text-2xl font-bold font-serif-heading text-slate-900 mt-1">
            Destination & City Discovery
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Spin the 3D globe to discover live hotspots, inspect city pins, and attach destinations or sights directly to your travel itinerary.
          </p>
        </div>

        {/* View Mode Switcher Pills */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
              viewMode === 'split'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-sky-600" />
            <span>Split Explorer</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('globe')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
              viewMode === 'globe'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>3D Globe Only</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-slate-600" />
            <span>Card Catalog</span>
          </button>
        </div>
      </div>

      {/* Prominent Two-Option Destination Scope Selector Banner */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center text-xl shadow-xs">
            {scope === 'national' ? '🇮🇳' : '🌐'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Destination Scope:
              </span>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                scope === 'national'
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-sky-100 text-sky-900 border-sky-300'
              }`}>
                {scope === 'national' ? 'National (India Only)' : 'International (Outside India)'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {scope === 'national'
                ? 'All city suggestions, 3D globe pins, and recommended spots are restricted exclusively to India.'
                : 'Showing cities and destinations outside of India across Europe, Asia, Americas, and worldwide.'}
            </p>
          </div>
        </div>

        {/* Two Distinct Switcher Buttons */}
        <div className="flex items-center space-x-2 self-start md:self-auto">
          <div className="inline-flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => handleScopeChange('national')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                scope === 'national'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🇮🇳</span>
              <span>National (India)</span>
            </button>
            <button
              type="button"
              onClick={() => handleScopeChange('international')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                scope === 'international'
                  ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🌐</span>
              <span>International</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setScopeModalOpen(true)}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition-colors cursor-pointer"
            title="Open Scope Selection Dialog"
          >
            <SlidersHorizontal className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* 3D Globe Visualization with Dedicated City Search & Must-Watch Places */}
      {(viewMode === 'split' || viewMode === 'globe') && (
        <div className="space-y-4">
          {/* Dedicated Search Bar for 3D Globe */}
          <div ref={citySearchContainerRef} className="relative z-20">
            <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 p-3 sm:p-4 rounded-3xl border border-slate-700/80 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center shrink-0">
                  <Globe2 className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white tracking-wide uppercase flex items-center space-x-1.5">
                    <span>3D Globe Search & Navigator</span>
                    <span className="px-1.5 py-0.2 rounded bg-sky-500/30 text-[9px] text-sky-200">Point Marker</span>
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Search any destination to smoothly rotate the globe, clear previous markers, and reveal must-watch places.
                  </p>
                </div>
              </div>

              {/* Dedicated Search Input */}
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-sky-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={citySearchInput}
                  onChange={(e) => {
                    setCitySearchInput(e.target.value);
                    setShowCityDropdown(true);
                  }}
                  onFocus={() => setShowCityDropdown(true)}
                  placeholder={
                    scope === 'national'
                      ? 'Search city (e.g. Jaipur, Goa, Manali, Varanasi)...'
                      : 'Search city (e.g. Paris, Tokyo, London, Rome)...'
                  }
                  className="w-full pl-10 pr-8 py-2 bg-slate-800/90 border border-slate-600/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 font-medium"
                />
                {citySearchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setCitySearchInput('');
                      setShowCityDropdown(false);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Auto-suggest dropdown */}
                {showCityDropdown && filteredCitySuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-30 max-h-56 overflow-y-auto">
                    <div className="px-3 py-1.5 bg-slate-950 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      Matching {scope === 'national' ? 'Indian' : 'Global'} Destinations
                    </div>
                    {filteredCitySuggestions.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleGlobeSelectCity(c.name)}
                        className={`w-full px-3.5 py-2.5 text-left text-xs flex items-center justify-between border-b border-slate-800/40 transition-colors cursor-pointer ${
                          c.name.toLowerCase() === activeGlobeCity.toLowerCase()
                            ? 'bg-sky-950/80 text-sky-300 font-bold'
                            : 'text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-3.5 h-3.5 text-sky-400" />
                          <span>{c.name}</span>
                          <span className="text-[10px] text-slate-400 font-normal">({c.country})</span>
                        </div>
                        <span className="text-[10px] text-amber-400 font-semibold flex items-center space-x-1">
                          <span>Focus Globe</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Interactive 3D Globe with Isolated Marker */}
          <Interactive3DGlobe
            onSelectCity={handleGlobeSelectCity}
            onAddCityToTrip={handleGlobeAddCity}
            selectedCityName={activeGlobeCity}
            scope={scope}
            onScopeChange={handleScopeChange}
            onOpenScopeModal={() => setScopeModalOpen(true)}
            isolateSelectedMarker={true}
          />

          {/* Curated Must-Watch Places for that Selected City */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1">
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    <span>Curated Must-Watch Places</span>
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    {activeGlobeCity}
                  </span>
                </div>
                <h3 className="text-xl font-bold font-serif-heading text-slate-900 mt-1">
                  Must-Watch Attractions & Sights in {activeGlobeCity}
                </h3>
                <p className="text-xs text-slate-500">
                  Carefully verified cultural monuments, heritage sites, and experiences specifically for {activeGlobeCity}. Add directly into your trip itinerary with one click.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    const matched = GLOBE_CITIES.find(c => c.name.toLowerCase() === activeGlobeCity.toLowerCase());
                    if (matched) setSelectedCityForAdd(matched);
                  }}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add {activeGlobeCity} as Trip Stop</span>
                </button>
              </div>
            </div>

            {/* Must-Watch Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {mustWatchPlaces.map((place, idx) => (
                <div
                  key={idx}
                  className="group bg-slate-50/80 hover:bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-sky-300 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-sky-100 text-sky-800">
                        {place.category}
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        {place.cost > 0 ? `₹${place.cost.toLocaleString('en-IN')}` : 'Free Entry'}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors leading-snug">
                        {place.title}
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-3 leading-relaxed">
                        {place.description}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 text-[11px] text-slate-500 pt-1">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{place.duration_hours}h</span>
                      </span>
                      <span>•</span>
                      <span className="capitalize">{place.time_slot}</span>
                      <span>•</span>
                      <span className="truncate max-w-[100px]">{place.location}</span>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-[10px] text-amber-700 font-bold uppercase flex items-center space-x-1">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <span>Must-Watch</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddMustWatchToTrip(place)}
                      className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1 cursor-pointer active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to Trip</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search & Multi-Filters Toolbar (Hidden in 3D Globe Only mode) */}
      {viewMode !== 'globe' && (
        <>
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    scope === 'national'
                      ? 'Search destinations in India (e.g. Jaipur, Goa, Manali, Udaipur, Kochi)...'
                      : 'Search international destinations (e.g. Paris, Tokyo, London, Rome, Zurich)...'
                  }
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm cursor-pointer"
              >
                Search
              </button>
            </form>

            {/* Scoped Quick City Suggestions Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>{scope === 'national' ? 'Indian Hubs:' : 'Global Hubs:'}</span>
              </span>
              {(scope === 'national'
                ? ['All India', 'New Delhi', 'Mumbai', 'Jaipur', 'Goa', 'Bengaluru', 'Udaipur', 'Varanasi', 'Kochi', 'Manali', 'Agra']
                : ['All Destinations', 'Paris', 'Tokyo', 'London', 'Rome', 'Zurich', 'Barcelona', 'New York', 'Dubai', 'Bangkok', 'Sydney']
              ).map((cityName) => {
                const isAll = cityName.startsWith('All');
                const isCurrent = (isAll && !query) || query.toLowerCase() === cityName.toLowerCase();
                return (
                  <button
                    type="button"
                    key={cityName}
                    onClick={() => {
                      if (isAll) {
                        setQuery('');
                        setCountry('all');
                      } else {
                        setQuery(cityName);
                        setCountry('all');
                        setActiveGlobeCity(cityName);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer text-[11px] ${
                      isCurrent
                        ? scope === 'national'
                          ? 'bg-amber-500 text-white font-bold shadow-2xs'
                          : 'bg-sky-600 text-white font-bold shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {cityName}
                  </button>
                );
              })}
            </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs">
          {/* Country */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Country
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium"
            >
              <option value="all">All Countries</option>
              {countries.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Activity Category */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Activity Type
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium"
            >
              <option value="all">All Categories</option>
              <option value="sightseeing">Sightseeing</option>
              <option value="culture">Culture & Museums</option>
              <option value="food">Food & Dining</option>
              <option value="adventure">Nature & Adventure</option>
              <option value="relaxation">Relaxation & Wellness</option>
            </select>
          </div>

          {/* Cost Index */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Cost Index
            </label>
            <select
              value={costIndex}
              onChange={(e) => setCostIndex(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium"
            >
              <option value="all">All Price Ranges</option>
              <option value="budget">Budget (Free to Low - under ₹2,500)</option>
              <option value="moderate">Moderate (Mid-Range - ₹2,500 to ₹7,500)</option>
              <option value="luxury">Luxury (Premium - over ₹7,500)</option>
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1 flex items-center justify-between">
              <span>Max Duration</span>
              <span className="text-sky-600 font-bold">{maxDuration >= 5 ? 'Any' : `${maxDuration}h`}</span>
            </label>
            <input
              type="range"
              min="1.5"
              max="5"
              step="0.5"
              value={maxDuration}
              onChange={(e) => setMaxDuration(parseFloat(e.target.value))}
              className="w-full accent-sky-600 cursor-pointer mt-2"
            />
          </div>
        </div>
      </div>

      {/* Catalog Results Grid */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-sky-600/30 border-t-sky-600 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Searching destination database...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-3">
          <Compass className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-700">No activities match your filters</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your price range, duration slider, or searching for other global destinations.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Photo Banner */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                  {/* Top badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-sky-400" />
                      <span>{item.city_name}, {item.country}</span>
                    </span>

                    <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-bold flex items-center space-x-1 shadow-xs">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span>{item.popularity}/100</span>
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <span className="px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-[10px] font-semibold uppercase tracking-wider text-white">
                      {item.category}
                    </span>
                    <h3 className="text-base font-bold font-serif-heading leading-tight mt-1 drop-shadow">
                      {item.title}
                    </h3>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 space-y-3">
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.duration_hours}h duration</span>
                    </span>
                    <span className="capitalize font-medium text-slate-700">
                      Best: {item.recommended_time}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Cost & Add to Trip CTA */}
              <div className="p-4 pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-600 block">Est. Cost</span>
                  <div className="flex items-baseline space-x-1.5">
                    <span className="text-sm font-bold text-emerald-600">
                      {item.cost > 0 ? `₹${item.cost.toLocaleString('en-IN')}` : 'Free Entrance'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => openAddToTripModal(item)}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs flex items-center space-x-1.5 active:scale-95 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to Trip</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )}

      {/* "Add to Trip" Configuration Modal */}
      {selectedItemToAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-sm text-slate-900 font-serif-heading">
                  Add to Itinerary
                </h3>
                <p className="text-xs text-slate-500 truncate max-w-[260px]">
                  {selectedItemToAdd.title} • {selectedItemToAdd.cost > 0 ? `₹${Math.round(selectedItemToAdd.cost * 85).toLocaleString('en-IN')}` : 'Free Entrance'}
                </p>
              </div>
              <button
                onClick={() => setSelectedItemToAdd(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {trips.length === 0 ? (
              <div className="p-6 text-center space-y-3">
                <p className="text-xs text-slate-600">You don't have any trips created yet.</p>
                <button
                  onClick={() => {
                    setSelectedItemToAdd(null);
                    onOpenCreateTrip();
                  }}
                  className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-semibold"
                >
                  Create a Trip First
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirmAddActivity} className="p-5 space-y-4">
                {/* Select Trip */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Target Trip *
                  </label>
                  <select
                    value={selectedTripId}
                    onChange={(e) => handleTripChange(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold"
                  >
                    {trips.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.start_date})</option>
                    ))}
                  </select>
                </div>

                {/* Select Stop within Trip */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select City Stop
                  </label>
                  {currentChosenTrip?.stops && currentChosenTrip.stops.length > 0 ? (
                    <select
                      value={selectedStopId}
                      onChange={(e) => {
                        const sId = Number(e.target.value);
                        setSelectedStopId(sId);
                        const found = currentChosenTrip.stops?.find(s => s.id === sId);
                        if (found) setSelectedDate(found.start_date);
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium"
                    >
                      {currentChosenTrip.stops.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.city_name}, {s.country} ({s.start_date} to {s.end_date})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs text-sky-700 bg-sky-50 p-2.5 rounded-xl border border-sky-100">
                      A new stop for <strong>{selectedItemToAdd.city_name}</strong> will automatically be created in this trip.
                    </p>
                  )}
                </div>

                {/* Scheduled Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Scheduled Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Time Slot
                    </label>
                    <select
                      value={selectedTimeSlot}
                      onChange={(e) => setSelectedTimeSlot(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium"
                    >
                      <option value="morning">Morning</option>
                      <option value="afternoon">Afternoon</option>
                      <option value="evening">Evening</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedItemToAdd(null)}
                    className="px-3.5 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={adding}
                    className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-1.5 cursor-pointer"
                  >
                    {adding ? (
                      <span>Adding...</span>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Confirm & Add</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 3D Globe Direct Add City Stop Modal */}
      {selectedCityForAdd && (
        <AddCityToTripModal
          city={selectedCityForAdd}
          trips={trips}
          onClose={() => setSelectedCityForAdd(null)}
          onTripUpdated={(updatedTrip) => {
            onActivityAddedToTrip(updatedTrip);
            setToastMessage(`Added ${selectedCityForAdd.name} to itinerary!`);
            setTimeout(() => setToastMessage(null), 3500);
          }}
          onOpenCreateTrip={onOpenCreateTrip}
        />
      )}

      {/* Destination Scope Selection Modal: National (India) vs International */}
      <DestinationScopeModal
        isOpen={scopeModalOpen}
        onSelectScope={handleScopeChange}
        onClose={() => setScopeModalOpen(false)}
        title="Where are you traveling?"
        subtitle="Choose whether to explore destinations within National (India) or International destinations."
      />
    </div>
  );
};
