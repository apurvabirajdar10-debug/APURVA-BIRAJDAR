import React, { useState, useMemo } from 'react';
import { Plus, Sparkles, MapPin, Calendar, Clock, IndianRupee, ArrowUp, ArrowDown, Trash2, Edit3, Train, Plane, Car, Bus, Ship, Check, AlertCircle, ChevronDown, ChevronUp, Eye, Compass, BookOpen, X, Globe, RotateCcw, ArrowRight, CheckCircle2, Users, Calculator } from 'lucide-react';
import { Trip, Stop, Activity } from '../types/travel';
import { api } from '../lib/api';
import { DestinationScopeModal } from './DestinationScopeModal';
import { ExpenseSplitterModal } from './ExpenseSplitterModal';
import { GLOBE_CITIES, GlobeCity } from '../data/globeCities';
import { getDistributedAttractionsForCity, CuratedAttraction, getCuratedAttractionsForCity } from '../data/cityAttractions';

interface ItineraryBuilderViewProps {
  trip: Trip;
  onTripUpdated: (updatedTrip: Trip) => void;
  onOpenOptimizer: () => void;
  onViewItinerary: () => void;
  onOpenCatalogSearch: (cityHint?: string) => void;
  onOpenMembers?: () => void;
}

export const ItineraryBuilderView: React.FC<ItineraryBuilderViewProps> = ({
  trip,
  onTripUpdated,
  onOpenOptimizer,
  onViewItinerary,
  onOpenCatalogSearch,
  onOpenMembers,
}) => {
  const [showAddStopModal, setShowAddStopModal] = useState(false);
  const [stopToEdit, setStopToEdit] = useState<Stop | null>(null);
  const [showExpenseSplitterModal, setShowExpenseSplitterModal] = useState(false);

  // Scope selection state: 'national' vs 'international'
  const [scopeModalOpen, setScopeModalOpen] = useState(false);
  const [currentScope, setCurrentScope] = useState<'national' | 'international'>('national');

  const [activeStopForActivity, setActiveStopForActivity] = useState<Stop | null>(null);
  const [activityToEdit, setActivityToEdit] = useState<Activity | null>(null);

  // Activity Modal Tab: 'form' vs 'browse'
  const [activityModalTab, setActivityModalTab] = useState<'form' | 'browse'>('form');
  const [browseCategoryFilter, setBrowseCategoryFilter] = useState<string>('all');
  const [browseSearchQuery, setBrowseSearchQuery] = useState<string>('');
  const [browseSelectedDate, setBrowseSelectedDate] = useState<string>('');
  const [activityAddedToast, setActivityAddedToast] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stop Form State & Inline Validation
  const [cityName, setCityName] = useState('');
  const [country, setCountry] = useState('');
  const [stopStartDate, setStopStartDate] = useState('');
  const [stopEndDate, setStopEndDate] = useState('');
  const [transportMode, setTransportMode] = useState<string>('train');
  const [transportNotes, setTransportNotes] = useState('');
  const [stopNotes, setStopNotes] = useState('');

  const [cityNameError, setCityNameError] = useState<string | null>(null);
  const [countryError, setCountryError] = useState<string | null>(null);
  const [stopStartDateError, setStopStartDateError] = useState<string | null>(null);
  const [stopEndDateError, setStopEndDateError] = useState<string | null>(null);

  // Activity Form State & Inline Validation
  const [actTitle, setActTitle] = useState('');
  const [actDate, setActDate] = useState('');
  const [actTimeSlot, setActTimeSlot] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [actCategory, setActCategory] = useState<'sightseeing' | 'food' | 'culture' | 'adventure' | 'relaxation' | 'shopping' | 'transport'>('sightseeing');
  const [actCost, setActCost] = useState<number | string>(0);
  const [actDuration, setActDuration] = useState<number | string>(2);
  const [actLocation, setActLocation] = useState('');
  const [actDescription, setActDescription] = useState('');
  const [actBookingStatus, setActBookingStatus] = useState<'planned' | 'booked' | 'optional'>('planned');

  const [actTitleError, setActTitleError] = useState<string | null>(null);
  const [actDateError, setActDateError] = useState<string | null>(null);

  const INDIAN_CITIES_SET = new Set([
    'delhi', 'new delhi', 'mumbai', 'bombay', 'bengaluru', 'bangalore', 'jaipur', 'goa',
    'kolkata', 'calcutta', 'chennai', 'madras', 'hyderabad', 'pune', 'udaipur', 'varanasi',
    'manali', 'agra', 'kochi', 'cochin', 'kerala', 'shimla', 'amritsar', 'ahmedabad',
    'chandigarh', 'mysuru', 'mysore', 'ooty', 'rishikesh', 'jodhpur', 'jaisalmer', 'lucknow',
    'surat', 'kanpur', 'nagpur', 'indore', 'bhopal', 'patna', 'vadodara', 'ghaziabad'
  ]);

  const handleStartAddStop = () => {
    setScopeModalOpen(true);
  };

  const handleScopeSelected = (scope: 'national' | 'international') => {
    setCurrentScope(scope);
    setScopeModalOpen(false);
    openAddStopModal(undefined, scope);
  };

  const openAddStopModal = (existing?: Stop, scopeParam?: 'national' | 'international') => {
    setError(null);
    setCityNameError(null);
    setCountryError(null);
    setStopStartDateError(null);
    setStopEndDateError(null);

    const effectiveScope = existing
      ? (existing.country.trim().toLowerCase() === 'india' ? 'national' : 'international')
      : (scopeParam || currentScope);

    setCurrentScope(effectiveScope);

    if (existing) {
      setStopToEdit(existing);
      setCityName(existing.city_name);
      setCountry(existing.country);
      setStopStartDate(existing.start_date);
      setStopEndDate(existing.end_date);
      setTransportMode(existing.transport_mode || 'train');
      setTransportNotes(existing.transport_notes || '');
      setStopNotes(existing.notes || '');
    } else {
      setStopToEdit(null);
      setCityName('');
      setCountry(effectiveScope === 'national' ? 'India' : '');
      const lastStop = trip.stops && trip.stops.length > 0 ? trip.stops[trip.stops.length - 1] : null;
      setStopStartDate(lastStop ? lastStop.end_date : trip.start_date);
      setStopEndDate(lastStop ? lastStop.end_date : trip.end_date);
      setTransportMode(effectiveScope === 'national' ? 'train' : 'flight');
      setTransportNotes('');
      setStopNotes('');
    }
    setShowAddStopModal(true);
  };

  const validateStopForm = (): boolean => {
    let valid = true;
    setCityNameError(null);
    setCountryError(null);
    setStopStartDateError(null);
    setStopEndDateError(null);
    setError(null);

    const cleanCity = cityName.trim().toLowerCase();
    const cleanCountry = country.trim().toLowerCase();

    if (!cityName.trim()) {
      setCityNameError('City name cannot be left blank.');
      valid = false;
    }
    if (!country.trim()) {
      setCountryError('Country cannot be left blank.');
      valid = false;
    }

    // Strict Scope Filtering Rules
    if (currentScope === 'national') {
      if (cleanCountry !== 'india') {
        setCountryError("National scope is restricted exclusively to destinations within India. Country must be 'India'.");
        valid = false;
      }
    } else if (currentScope === 'international') {
      if (cleanCountry === 'india' || INDIAN_CITIES_SET.has(cleanCity)) {
        setCountryError("International scope excludes destinations in India. Please choose an international destination or switch scope to National.");
        valid = false;
      }
    }

    if (!stopStartDate) {
      setStopStartDateError('Arrival date is required.');
      valid = false;
    }
    if (!stopEndDate) {
      setStopEndDateError('Departure date is required.');
      valid = false;
    } else if (stopStartDate && new Date(stopEndDate) < new Date(stopStartDate)) {
      setStopEndDateError('Departure date cannot precede arrival date.');
      valid = false;
    }
    return valid;
  };

  const handleSaveStop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStopForm()) return;

    setLoading(true);
    try {
      if (stopToEdit) {
        const res = await api.updateStop(stopToEdit.id, {
          city_name: cityName.trim(),
          country: country.trim(),
          start_date: stopStartDate,
          end_date: stopEndDate,
          transport_mode: transportMode as any,
          transport_notes: transportNotes.trim(),
          notes: stopNotes.trim(),
        });
        onTripUpdated(res.trip);
      } else {
        const res = await api.addStop(trip.id, {
          city_name: cityName.trim(),
          country: country.trim(),
          start_date: stopStartDate,
          end_date: stopEndDate,
          transport_mode: transportMode as any,
          transport_notes: transportNotes.trim(),
          notes: stopNotes.trim(),
        });
        onTripUpdated(res.trip);
      }
      setShowAddStopModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save stop');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStop = async (stopId: number) => {
    if (!confirm('Are you sure you want to remove this city and all of its scheduled activities?')) return;
    try {
      await api.deleteStop(stopId);
      const res = await api.getTrip(trip.id);
      onTripUpdated(res.trip);
    } catch (err: any) {
      alert(err.message || 'Failed to delete stop');
    }
  };

  const handleMoveStop = async (currentIndex: number, direction: 'up' | 'down') => {
    if (!trip.stops) return;
    const newStops = [...trip.stops];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= newStops.length) return;

    const temp = newStops[currentIndex];
    newStops[currentIndex] = newStops[targetIndex];
    newStops[targetIndex] = temp;

    const orderedIds = newStops.map(s => s.id);
    try {
      const res = await api.reorderStops(trip.id, orderedIds);
      onTripUpdated(res.trip);
    } catch (err: any) {
      alert(err.message || 'Failed to reorder stops');
    }
  };

  // Activity handlers
  const openAddActivityModal = (stop: Stop, existing?: Activity, initialTab: 'form' | 'browse' = 'form') => {
    setActiveStopForActivity(stop);
    setActivityModalTab(initialTab);
    setBrowseCategoryFilter('all');
    setBrowseSearchQuery('');
    setBrowseSelectedDate(stop.start_date);
    setActivityAddedToast(null);
    setError(null);
    setActTitleError(null);
    setActDateError(null);

    if (existing) {
      setActivityToEdit(existing);
      setActTitle(existing.title);
      setActDate(existing.date);
      setActTimeSlot(existing.time_slot);
      setActCategory(existing.category);
      setActCost(existing.cost);
      setActDuration(existing.duration_hours);
      setActLocation(existing.location || '');
      setActDescription(existing.description || '');
      setActBookingStatus(existing.booking_status);
    } else {
      setActivityToEdit(null);
      setActTitle('');
      setActDate(stop.start_date);
      setActTimeSlot('morning');
      setActCategory('sightseeing');
      setActCost(0);
      setActDuration(2);
      setActLocation(stop.city_name);
      setActDescription('');
      setActBookingStatus('planned');
    }
  };

  // Curated list for the currently inspected stop
  const curatedAttractionsForActiveStop = useMemo(() => {
    if (!activeStopForActivity) return [];
    const raw = getCuratedAttractionsForCity(activeStopForActivity.city_name, activeStopForActivity.country);
    return raw.filter(item => {
      if (browseCategoryFilter !== 'all' && item.category !== browseCategoryFilter) {
        return false;
      }
      if (browseSearchQuery.trim()) {
        const q = browseSearchQuery.toLowerCase().trim();
        return (
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [activeStopForActivity, browseCategoryFilter, browseSearchQuery]);

  const handleAddCuratedActivity = async (attraction: CuratedAttraction) => {
    if (!activeStopForActivity) return;
    setLoading(true);
    try {
      const res = await api.addActivity(trip.id, {
        stop_id: activeStopForActivity.id,
        title: attraction.title,
        description: attraction.description,
        date: browseSelectedDate || activeStopForActivity.start_date,
        time_slot: attraction.time_slot,
        category: attraction.category as any,
        cost: attraction.cost,
        duration_hours: attraction.duration_hours,
        location: attraction.location || activeStopForActivity.city_name,
        booking_status: 'planned',
      });
      onTripUpdated(res.trip);
      setActivityAddedToast(`Added "${attraction.title}" to ${activeStopForActivity.city_name}!`);
      setTimeout(() => setActivityAddedToast(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to add activity');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomizeCuratedActivity = (attraction: CuratedAttraction) => {
    setActTitle(attraction.title);
    setActDescription(attraction.description);
    setActCategory(attraction.category as any);
    setActCost(attraction.cost);
    setActDuration(attraction.duration_hours);
    setActLocation(attraction.location || activeStopForActivity?.city_name || '');
    setActTimeSlot(attraction.time_slot);
    setActDate(browseSelectedDate || activeStopForActivity?.start_date || '');
    setActivityModalTab('form');
  };

  const validateActivityForm = (): boolean => {
    let valid = true;
    setActTitleError(null);
    setActDateError(null);
    setError(null);

    if (!actTitle.trim()) {
      setActTitleError('Activity title cannot be left blank.');
      valid = false;
    }
    if (!actDate) {
      setActDateError('Scheduled date is required.');
      valid = false;
    }
    return valid;
  };

  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateActivityForm() || !activeStopForActivity) return;

    setLoading(true);
    try {
      if (activityToEdit) {
        const res = await api.updateActivity(activityToEdit.id, {
          title: actTitle.trim(),
          description: actDescription.trim(),
          date: actDate,
          time_slot: actTimeSlot,
          category: actCategory,
          cost: Number(actCost) || 0,
          duration_hours: Number(actDuration) || 2,
          location: actLocation.trim(),
          booking_status: actBookingStatus,
        });
        onTripUpdated(res.trip);
      } else {
        const res = await api.addActivity(trip.id, {
          stop_id: activeStopForActivity.id,
          title: actTitle.trim(),
          description: actDescription.trim(),
          date: actDate,
          time_slot: actTimeSlot,
          category: actCategory,
          cost: Number(actCost) || 0,
          duration_hours: Number(actDuration) || 2,
          location: actLocation.trim(),
          booking_status: actBookingStatus,
        });
        onTripUpdated(res.trip);
      }
      setActiveStopForActivity(null);
      setActivityToEdit(null);
    } catch (err: any) {
      setError(err.message || 'Failed to save activity');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteActivity = async (activityId: number) => {
    try {
      await api.deleteActivity(activityId);
      const res = await api.getTrip(trip.id);
      onTripUpdated(res.trip);
    } catch (err: any) {
      alert(err.message || 'Failed to delete activity');
    }
  };

  const getTransportIcon = (mode: string) => {
    switch (mode) {
      case 'flight': return <Plane className="w-3.5 h-3.5" />;
      case 'car': return <Car className="w-3.5 h-3.5" />;
      case 'bus': return <Bus className="w-3.5 h-3.5" />;
      case 'ferry': return <Ship className="w-3.5 h-3.5" />;
      default: return <Train className="w-3.5 h-3.5" />;
    }
  };

  const stops = trip.stops || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Trip Header Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-md bg-sky-100 text-sky-800 text-[10px] font-bold uppercase tracking-wide">
              Itinerary Builder
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {stops.length} Cities • {trip.start_date} to {trip.end_date}
            </span>
          </div>
          <h1 className="text-2xl font-bold font-serif-heading text-slate-900 mt-1">
            {trip.name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Arrange your stops, configure transport connections, and schedule activities per city.
          </p>
        </div>

        {/* Builder Toolbar Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenMembers && (
            <button
              onClick={onOpenMembers}
              className="px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200/80 shadow-2xs flex items-center space-x-1.5 transition-all cursor-pointer"
              title="Invite or manage trip collaborators"
            >
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Trip Members ({trip.members?.length || 1})</span>
            </button>
          )}
          <button
            onClick={() => setShowExpenseSplitterModal(true)}
            className="min-h-[44px] px-3.5 py-2.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/80 text-xs font-semibold shadow-2xs flex items-center space-x-1.5 transition-all cursor-pointer"
            title="Open Expense Splitter for this itinerary"
          >
            <Calculator className="w-4 h-4 text-emerald-600" />
            <span>Expense Splitter</span>
          </button>
          <button
            onClick={onOpenOptimizer}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-xs font-semibold shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span>AI Optimize Route</span>
          </button>
          <button
            onClick={handleStartAddStop}
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Stop / City</span>
          </button>
          <button
            onClick={onViewItinerary}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Eye className="w-4 h-4 text-slate-600" />
            <span>View Timeline</span>
          </button>
        </div>
      </div>

      {/* Main Stops Sequence List */}
      <div className="space-y-6">
        {stops.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-4">
            <MapPin className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No stops added yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Add your first destination city to start scheduling arrival dates, booking stays, and planning daily activities.
            </p>
            <button
              onClick={handleStartAddStop}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
            >
              Add First City
            </button>
          </div>
        ) : (
          stops.map((stop, index) => {
            const isFirst = index === 0;
            const isLast = index === stops.length - 1;
            const activities = stop.activities || [];

            return (
              <div key={stop.id} className="relative">
                {/* Transit Connector between cities */}
                {!isFirst && (
                  <div className="flex items-center space-x-3 my-2 px-8">
                    <div className="h-6 w-0.5 bg-sky-300 mx-auto"></div>
                    <div className="px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-[11px] font-medium flex items-center space-x-1.5 shadow-2xs">
                      {getTransportIcon(stop.transport_mode)}
                      <span className="capitalize">{stop.transport_mode}</span>
                      {stop.transport_notes && (
                        <span className="text-slate-500 text-[10px] truncate max-w-[200px]">
                          • {stop.transport_notes}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Stop Card */}
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:border-sky-300 transition-all overflow-hidden">
                  {/* Stop Header */}
                  <div className="p-5 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-2xl bg-sky-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                        {index + 1}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-bold text-slate-900 font-serif-heading">
                            {stop.city_name}, <span className="text-sm font-normal text-slate-600">{stop.country}</span>
                          </h3>
                        </div>
                        <p className="text-xs text-slate-500 flex items-center space-x-1.5 mt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-sky-600" />
                          <span>{stop.start_date} to {stop.end_date}</span>
                          {stop.notes && <span>• {stop.notes}</span>}
                        </p>
                      </div>
                    </div>

                    {/* Stop Header Actions */}
                    <div className="flex items-center space-x-1.5 self-end sm:self-auto">
                      {/* Reorder Buttons */}
                      <div className="flex items-center bg-slate-100 rounded-xl p-0.5 mr-1">
                        <button
                          onClick={() => handleMoveStop(index, 'up')}
                          disabled={isFirst}
                          className="p-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 transition-colors cursor-pointer"
                          title="Move stop earlier"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveStop(index, 'down')}
                          disabled={isLast}
                          className="p-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 transition-colors cursor-pointer"
                          title="Move stop later"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => openAddStopModal(stop)}
                        className="p-2 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-colors cursor-pointer"
                        title="Edit Stop Details"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteStop(stop.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Delete Stop"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Stop Activities Section */}
                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Activities in {stop.city_name}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                          {activities.length} planned
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openAddActivityModal(stop, undefined, 'browse')}
                          className="px-2.5 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-bold flex items-center space-x-1 transition-colors cursor-pointer shadow-2xs"
                          title={`Browse curated activities & popular sights in ${stop.city_name}`}
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>Browse</span>
                        </button>
                        <button
                          onClick={() => openAddActivityModal(stop, undefined, 'form')}
                          className="px-3 py-1.5 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 text-[11px] font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3 text-sky-600" />
                          <span>Add Activity</span>
                        </button>
                      </div>
                    </div>

                    {/* Activity Cards Grid */}
                    {activities.length === 0 ? (
                      <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-1">
                        <p className="text-xs text-slate-500">No activities scheduled yet for {stop.city_name}.</p>
                        <button
                          onClick={() => openAddActivityModal(stop)}
                          className="text-xs font-semibold text-sky-600 hover:underline cursor-pointer"
                        >
                          + Add sight or reservation
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {activities.map((act) => (
                          <div
                            key={act.id}
                            className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-sky-300 shadow-2xs transition-all flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-start justify-between">
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold uppercase text-slate-600 tracking-wider">
                                  {act.time_slot}
                                </span>
                                <span className="text-xs font-bold text-emerald-600">
                                  {act.cost > 0 ? `₹${act.cost.toLocaleString('en-IN')}` : 'Free'}
                                </span>
                              </div>

                              <h4 className="font-bold text-xs text-slate-900 mt-2 line-clamp-1">
                                {act.title}
                              </h4>
                              {act.description && (
                                <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                                  {act.description}
                                </p>
                              )}
                            </div>

                            <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                              <span className="capitalize">{act.category} • {act.duration_hours}h</span>
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => openAddActivityModal(stop, act)}
                                  className="p-1 hover:text-sky-600 rounded cursor-pointer"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteActivity(act.id)}
                                  className="p-1 hover:text-rose-600 rounded cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Stop Modal with Clean Inline Red Errors */}
      {showAddStopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-sm text-slate-900 font-serif-heading">
                {stopToEdit ? 'Edit City Stop' : 'Add City Stop to Itinerary'}
              </h3>
              <button
                onClick={() => setShowAddStopModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStop} noValidate className="p-5 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Scope Status Banner with Quick Switcher */}
              <div className={`p-3 rounded-2xl border flex items-center justify-between ${
                currentScope === 'national'
                  ? 'bg-gradient-to-r from-amber-50 to-orange-50/60 border-amber-200'
                  : 'bg-gradient-to-r from-sky-50 to-indigo-50/60 border-sky-200'
              }`}>
                <div className="flex items-center space-x-2">
                  <span className="text-xl">{currentScope === 'national' ? '🇮🇳' : '🌐'}</span>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className={`text-xs font-bold ${currentScope === 'national' ? 'text-amber-950' : 'text-sky-950'}`}>
                        {currentScope === 'national' ? 'National (India) Destination' : 'International Destination'}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${
                        currentScope === 'national'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-sky-100 text-sky-800 border-sky-300'
                      }`}>
                        {currentScope === 'national' ? 'Domestic Only' : 'Overseas Only'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {currentScope === 'national'
                        ? 'Suggestions and auto-scheduled sights are restricted exclusively to destinations within India.'
                        : 'Suggestions and auto-scheduled sights are restricted exclusively to international destinations.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowAddStopModal(false);
                    setScopeModalOpen(true);
                  }}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer shadow-2xs whitespace-nowrap ml-2 ${
                    currentScope === 'national'
                      ? 'bg-white hover:bg-amber-100/60 text-amber-900 border-amber-200'
                      : 'bg-white hover:bg-sky-100/60 text-sky-900 border-sky-200'
                  }`}
                >
                  Change Scope
                </button>
              </div>

              {/* Scoped Quick Pick City Chips */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Quick Suggestion ({currentScope === 'national' ? 'Top Indian Hubs' : 'Global Capitals'}):</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">Click to auto-fill</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(currentScope === 'national'
                    ? [
                        { name: 'New Delhi', country: 'India' },
                        { name: 'Mumbai', country: 'India' },
                        { name: 'Jaipur', country: 'India' },
                        { name: 'Goa', country: 'India' },
                        { name: 'Bengaluru', country: 'India' },
                        { name: 'Udaipur', country: 'India' },
                        { name: 'Varanasi', country: 'India' },
                        { name: 'Kochi', country: 'India' },
                        { name: 'Manali', country: 'India' },
                        { name: 'Agra', country: 'India' },
                      ]
                    : [
                        { name: 'Paris', country: 'France' },
                        { name: 'Tokyo', country: 'Japan' },
                        { name: 'London', country: 'United Kingdom' },
                        { name: 'Rome', country: 'Italy' },
                        { name: 'Zurich', country: 'Switzerland' },
                        { name: 'Barcelona', country: 'Spain' },
                        { name: 'Dubai', country: 'United Arab Emirates' },
                        { name: 'New York', country: 'United States' },
                        { name: 'Bangkok', country: 'Thailand' },
                        { name: 'Singapore', country: 'Singapore' },
                      ]
                  ).map((c) => (
                    <button
                      type="button"
                      key={c.name}
                      onClick={() => {
                        setCityName(c.name);
                        setCountry(c.country);
                        setCityNameError(null);
                        setCountryError(null);
                      }}
                      className={`text-[11px] px-2.5 py-1 rounded-xl border transition-all cursor-pointer font-medium ${
                        cityName.toLowerCase() === c.name.toLowerCase()
                          ? currentScope === 'national'
                            ? 'bg-amber-500 text-white border-amber-500 font-bold shadow-2xs'
                            : 'bg-sky-600 text-white border-sky-600 font-bold shadow-2xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    City Name *
                  </label>
                  <input
                    type="text"
                    value={cityName}
                    onChange={(e) => {
                      setCityName(e.target.value);
                      if (e.target.value.trim()) setCityNameError(null);
                    }}
                    placeholder={currentScope === 'national' ? 'e.g. Jaipur' : 'e.g. Florence'}
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs text-slate-800 focus:outline-none transition-all ${
                      cityNameError
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-500/20 bg-rose-50/20 text-rose-900'
                        : 'border-slate-200 focus:ring-2 focus:ring-sky-500/20'
                    }`}
                  />
                  {cityNameError && (
                    <p className="text-xs text-rose-600 font-medium mt-1">
                      {cityNameError}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Country *</span>
                    {currentScope === 'national' && (
                      <span className="text-[10px] text-amber-700 font-bold">India only</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => {
                      setCountry(e.target.value);
                      if (e.target.value.trim()) setCountryError(null);
                    }}
                    placeholder={currentScope === 'national' ? 'India' : 'e.g. Italy'}
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs text-slate-800 focus:outline-none transition-all ${
                      countryError
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-500/20 bg-rose-50/20 text-rose-900'
                        : 'border-slate-200 focus:ring-2 focus:ring-sky-500/20'
                    }`}
                  />
                  {countryError && (
                    <p className="text-xs text-rose-600 font-medium mt-1">
                      {countryError}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Arrival Date *
                  </label>
                  <input
                    type="date"
                    value={stopStartDate}
                    onChange={(e) => {
                      setStopStartDate(e.target.value);
                      if (e.target.value) setStopStartDateError(null);
                      if (stopEndDate && new Date(stopEndDate) >= new Date(e.target.value)) {
                        setStopEndDateError(null);
                      }
                    }}
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs text-slate-800 focus:outline-none transition-all ${
                      stopStartDateError
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-500/20 bg-rose-50/20 text-rose-900'
                        : 'border-slate-200 focus:ring-2 focus:ring-sky-500/20'
                    }`}
                  />
                  {stopStartDateError && (
                    <p className="text-xs text-rose-600 font-medium mt-1">
                      {stopStartDateError}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Departure Date *
                  </label>
                  <input
                    type="date"
                    value={stopEndDate}
                    onChange={(e) => {
                      setStopEndDate(e.target.value);
                      if (e.target.value) {
                        if (stopStartDate && new Date(e.target.value) < new Date(stopStartDate)) {
                          setStopEndDateError('Departure date cannot precede arrival date.');
                        } else {
                          setStopEndDateError(null);
                        }
                      }
                    }}
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs text-slate-800 focus:outline-none transition-all ${
                      stopEndDateError
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-500/20 bg-rose-50/20 text-rose-900'
                        : 'border-slate-200 focus:ring-2 focus:ring-sky-500/20'
                    }`}
                  />
                  {stopEndDateError && (
                    <p className="text-xs text-rose-600 font-medium mt-1">
                      {stopEndDateError}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Transit Mode to this City
                  </label>
                  <select
                    value={transportMode}
                    onChange={(e) => setTransportMode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium"
                  >
                    <option value="flight">Flight (Air)</option>
                    <option value="train">Train (High-Speed / Regional)</option>
                    <option value="car">Car (Rental / Drive)</option>
                    <option value="bus">Bus / Coach</option>
                    <option value="ferry">Ferry / Boat</option>
                    <option value="none">None (Starting Point)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Transit Notes
                  </label>
                  <input
                    type="text"
                    value={transportNotes}
                    onChange={(e) => setTransportNotes(e.target.value)}
                    placeholder="e.g. Eurostar 2h 15m from Paris"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Accommodation / Neighborhood Notes
                </label>
                <input
                  type="text"
                  value={stopNotes}
                  onChange={(e) => setStopNotes(e.target.value)}
                  placeholder="e.g. Hotel near Santa Maria Novella station"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddStopModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
                >
                  {stopToEdit ? 'Update Stop' : 'Add Stop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Activity Modal with 'Browse' Experiences & Form Modes */}
      {activeStopForActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-sm text-slate-900 font-serif-heading truncate">
                    {activityToEdit ? 'Edit Activity' : `Add Activity in ${activeStopForActivity.city_name}`}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold shrink-0">
                    {activeStopForActivity.country}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Stop duration: {activeStopForActivity.start_date} to {activeStopForActivity.end_date}
                </p>
              </div>

              {/* Browse vs Form Toggle Button Bar */}
              <div className="flex items-center space-x-3 shrink-0">
                <div className="flex bg-slate-200/80 p-0.5 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setActivityModalTab('form')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                      activityModalTab === 'form'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Custom Form</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivityModalTab('browse')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                      activityModalTab === 'browse'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                        : 'text-slate-700 hover:text-slate-900 font-medium'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-800" />
                    <span>Browse</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    setActiveStopForActivity(null);
                    setActivityToEdit(null);
                  }}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Success Toast */}
            {activityAddedToast && (
              <div className="p-3 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between px-5 animate-in slide-in-from-top-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{activityAddedToast}</span>
                </div>
                <button
                  onClick={() => setActivityAddedToast(null)}
                  className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* TAB 1: BROWSE EXPERIENCES (Curated & Popular Attractions for Destination) */}
            {activityModalTab === 'browse' && (
              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                {/* Intro banner with Quick Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-sky-500/10 to-indigo-500/10 border border-amber-200/70">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-1.5 text-amber-900 font-bold text-xs">
                      <Compass className="w-4 h-4 text-amber-600" />
                      <span>Curated Experiences for {activeStopForActivity.city_name}</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Explore handpicked top sights, dining trails, and culture. Click 'Add to Itinerary' for instant scheduling.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <label className="text-[11px] font-bold text-slate-700 shrink-0">Schedule Date:</label>
                    <input
                      type="date"
                      value={browseSelectedDate}
                      min={activeStopForActivity.start_date}
                      max={activeStopForActivity.end_date}
                      onChange={(e) => setBrowseSelectedDate(e.target.value)}
                      className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 shadow-2xs focus:outline-none"
                    />
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                  {/* Category Pills */}
                  <div className="flex flex-wrap gap-1">
                    {(['all', 'sightseeing', 'culture', 'food', 'adventure', 'relaxation', 'shopping'] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setBrowseCategoryFilter(cat)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize transition-all cursor-pointer ${
                          browseCategoryFilter === cat
                            ? 'bg-slate-900 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Search query */}
                  <div className="relative sm:w-56 shrink-0">
                    <input
                      type="text"
                      value={browseSearchQuery}
                      onChange={(e) => setBrowseSearchQuery(e.target.value)}
                      placeholder={`Search ${activeStopForActivity.city_name}...`}
                      className="w-full pl-3 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    {browseSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setBrowseSearchQuery('')}
                        className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Curated Attractions Grid */}
                {curatedAttractionsForActiveStop.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <p className="text-xs text-slate-500">
                      No matching curated experiences found for your filter.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setBrowseCategoryFilter('all');
                        setBrowseSearchQuery('');
                      }}
                      className="text-xs font-bold text-sky-600 hover:underline cursor-pointer"
                    >
                      Clear search filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {curatedAttractionsForActiveStop.map((attraction, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-amber-400 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center space-x-1.5">
                              <span
                                className={`px-2 py-0.5 rounded-md font-bold uppercase text-[9px] tracking-wider ${
                                  attraction.category === 'sightseeing'
                                    ? 'bg-sky-100 text-sky-800'
                                    : attraction.category === 'food'
                                    ? 'bg-amber-100 text-amber-800'
                                    : attraction.category === 'culture'
                                    ? 'bg-purple-100 text-purple-800'
                                    : attraction.category === 'adventure'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : attraction.category === 'relaxation'
                                    ? 'bg-teal-100 text-teal-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {attraction.category}
                              </span>
                              <span className="text-slate-500 font-medium capitalize">
                                • {attraction.time_slot}
                              </span>
                            </div>

                            <span className="font-extrabold text-emerald-700">
                              {attraction.cost > 0 ? `₹${attraction.cost.toLocaleString('en-IN')}` : 'Free'}
                            </span>
                          </div>

                          <h4 className="font-bold text-xs text-slate-900 leading-snug">
                            {attraction.title}
                          </h4>

                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                            {attraction.description}
                          </p>

                          <div className="flex items-center space-x-2 text-[10px] text-slate-400 pt-1">
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{attraction.duration_hours} hrs</span>
                            </span>
                            {attraction.location && (
                              <>
                                <span>•</span>
                                <span className="flex items-center space-x-1 truncate max-w-[150px]">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  <span>{attraction.location}</span>
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => handleCustomizeCuratedActivity(attraction)}
                            className="text-[11px] font-semibold text-slate-600 hover:text-sky-600 flex items-center space-x-1 cursor-pointer transition-colors"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Customize</span>
                          </button>

                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => handleAddCuratedActivity(attraction)}
                            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center space-x-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add to Itinerary</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: MANUAL FORM MODE */}
            {activityModalTab === 'form' && (
              <form onSubmit={handleSaveActivity} noValidate className="p-5 space-y-3.5 overflow-y-auto flex-1">
                {error && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* 'Browse' suggestion banner right inside the form view */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-amber-50 via-sky-50 to-indigo-50 border border-amber-200/80 shadow-2xs">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        Need activity ideas for {activeStopForActivity.city_name}?
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Browse curated sights, gastronomy tours, and experiences with 1-click addition.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActivityModalTab('browse')}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer shrink-0"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Browse</span>
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Activity Title *
                  </label>
                  <input
                    type="text"
                    value={actTitle}
                    onChange={(e) => {
                      setActTitle(e.target.value);
                      if (e.target.value.trim()) setActTitleError(null);
                    }}
                    placeholder="e.g. Uffizi Gallery Guided Tour"
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs text-slate-800 font-medium focus:outline-none transition-all ${
                      actTitleError
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-500/20 bg-rose-50/20 text-rose-900'
                        : 'border-slate-200 focus:ring-2 focus:ring-sky-500/20'
                    }`}
                  />
                  {actTitleError && (
                    <p className="text-xs text-rose-600 font-medium mt-1">
                      {actTitleError}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={actDate}
                      min={activeStopForActivity.start_date}
                      max={activeStopForActivity.end_date}
                      onChange={(e) => {
                        setActDate(e.target.value);
                        if (e.target.value) setActDateError(null);
                      }}
                      className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs text-slate-800 focus:outline-none transition-all ${
                        actDateError
                          ? 'border-rose-400 focus:ring-2 focus:ring-rose-500/20 bg-rose-50/20 text-rose-900'
                          : 'border-slate-200 focus:ring-2 focus:ring-sky-500/20'
                      }`}
                    />
                    {actDateError && (
                      <p className="text-xs text-rose-600 font-medium mt-1">
                        {actDateError}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Time Slot
                    </label>
                    <select
                      value={actTimeSlot}
                      onChange={(e) => setActTimeSlot(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium"
                    >
                      <option value="morning">Morning (8am - 12pm)</option>
                      <option value="afternoon">Afternoon (12pm - 5pm)</option>
                      <option value="evening">Evening (5pm - late)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Category
                    </label>
                    <select
                      value={actCategory}
                      onChange={(e) => setActCategory(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium"
                    >
                      <option value="sightseeing">Sightseeing</option>
                      <option value="culture">Culture & Museums</option>
                      <option value="food">Food & Dining</option>
                      <option value="adventure">Adventure</option>
                      <option value="relaxation">Relaxation</option>
                      <option value="shopping">Shopping</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Cost (INR - ₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={actCost}
                      onChange={(e) => setActCost(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Duration (Hours)
                    </label>
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={actDuration}
                      onChange={(e) => setActDuration(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Location / Neighborhood
                    </label>
                    <input
                      type="text"
                      value={actLocation}
                      onChange={(e) => setActLocation(e.target.value)}
                      placeholder="e.g. Piazza della Signoria"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Booking Status
                    </label>
                    <select
                      value={actBookingStatus}
                      onChange={(e) => setActBookingStatus(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                    >
                      <option value="planned">Planned (Need to book)</option>
                      <option value="booked">Booked & Confirmed</option>
                      <option value="optional">Optional / If Time Permits</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Description / Tips
                  </label>
                  <textarea
                    rows={2}
                    value={actDescription}
                    onChange={(e) => setActDescription(e.target.value)}
                    placeholder="Ticket entrance time, dress code, or restaurant recommendations..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 resize-none"
                  />
                </div>

                <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActivityModalTab('browse')}
                    className="text-xs text-amber-700 hover:text-amber-800 font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Browse {activeStopForActivity.city_name} ideas</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveStopForActivity(null);
                        setActivityToEdit(null);
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
                    >
                      {activityToEdit ? 'Save Changes' : 'Schedule Activity'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Initial Scope Selection Modal: National (India) vs International */}
      <DestinationScopeModal
        isOpen={scopeModalOpen}
        onSelectScope={handleScopeSelected}
        onClose={() => setScopeModalOpen(false)}
        title="Where are you traveling?"
        description="Choose whether to add a National (India) or International destination to your itinerary."
      />

      {/* Expense Splitter Modal */}
      <ExpenseSplitterModal
        isOpen={showExpenseSplitterModal}
        onClose={() => setShowExpenseSplitterModal(false)}
        trip={trip}
      />
    </div>
  );
};
