import React, { useState, useEffect } from 'react';
import { X, MapPin, Calendar, Plane, Train, Car, Bus, Ship, Check, Plus, AlertCircle, Sparkles } from 'lucide-react';
import { Trip } from '../types/travel';
import { GlobeCity } from '../data/globeCities';
import { api } from '../lib/api';

interface AddCityToTripModalProps {
  city: GlobeCity;
  trips: Trip[];
  onClose: () => void;
  onTripUpdated: (updatedTrip: Trip) => void;
  onOpenCreateTrip: () => void;
}

export const AddCityToTripModal: React.FC<AddCityToTripModalProps> = ({
  city,
  trips,
  onClose,
  onTripUpdated,
  onOpenCreateTrip,
}) => {
  const [selectedTripId, setSelectedTripId] = useState<number | ''>(trips[0]?.id || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [transportMode, setTransportMode] = useState<'flight' | 'train' | 'car' | 'bus' | 'ferry'>('flight');
  const [transportNotes, setTransportNotes] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedSights, setSelectedSights] = useState<string[]>(city.topSights.slice(0, 2));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentTrip = trips.find(t => t.id === Number(selectedTripId));

  useEffect(() => {
    if (currentTrip) {
      // Suggest dates based on existing stops count
      const existingStopsCount = currentTrip.stops?.length || 0;
      const tripStart = new Date(currentTrip.start_date);
      const stopStart = new Date(tripStart);
      stopStart.setDate(tripStart.getDate() + existingStopsCount * 3);
      const stopEnd = new Date(stopStart);
      stopEnd.setDate(stopStart.getDate() + 3);

      const fmt = (d: Date) => d.toISOString().split('T')[0];
      setStartDate(fmt(stopStart));
      setEndDate(fmt(stopEnd));
      setTransportNotes(`Arrival transit to ${city.name}`);
    }
  }, [selectedTripId, currentTrip, city.name]);

  const toggleSight = (sight: string) => {
    setSelectedSights(prev =>
      prev.includes(sight) ? prev.filter(s => s !== sight) : [...prev, sight]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedTripId) {
      setError('Please select a target trip.');
      return;
    }
    if (!startDate || !endDate) {
      setError('Please provide arrival and departure dates.');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError('Departure date cannot precede arrival date.');
      return;
    }

    setLoading(true);
    try {
      // 1. Add city stop to itinerary
      const stopRes = await api.addStop(Number(selectedTripId), {
        city_name: city.name,
        country: city.country,
        start_date: startDate,
        end_date: endDate,
        transport_mode: transportMode,
        transport_notes: transportNotes.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      let updatedTrip = stopRes.trip;

      // 2. Automatically attach any selected signature sights as activities
      if (selectedSights.length > 0 && stopRes.stop) {
        for (let i = 0; i < selectedSights.length; i++) {
          const sightTitle = selectedSights[i];
          const timeSlot = i === 0 ? 'morning' : (i === 1 ? 'afternoon' : 'evening');
          try {
            const actRes = await api.addActivity(Number(selectedTripId), {
              stop_id: stopRes.stop.id,
              title: sightTitle,
              description: `Signature experience in ${city.name} added from 3D Globe Explorer.`,
              date: startDate,
              time_slot: timeSlot,
              category: 'sightseeing',
              cost: Math.round(city.averageCostPerDayINR * 0.25),
              duration_hours: 2.5,
              location: `${city.name}, ${city.country}`,
              booking_status: 'planned',
            });
            updatedTrip = actRes.trip;
          } catch (actErr) {
            console.warn('Failed to add sight activity:', actErr);
          }
        }
      }

      onTripUpdated(updatedTrip);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add city to trip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Banner with City Image */}
        <div className="relative h-32 w-full overflow-hidden shrink-0">
          <img
            src={city.image}
            alt={city.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
          
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
            <div>
              <div className="flex items-center space-x-1.5 text-xs text-sky-400 font-semibold mb-0.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>{city.country}</span>
              </div>
              <h2 className="text-xl font-bold text-white font-serif-heading">
                Add {city.name} to Itinerary
              </h2>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/90 text-white backdrop-blur-md shadow-sm">
              ~₹{city.averageCostPerDayINR.toLocaleString('en-IN')}/day
            </span>
          </div>
        </div>

        {/* Modal Form */}
        <div className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {trips.length === 0 ? (
            <div className="py-6 text-center space-y-3">
              <p className="text-xs text-slate-600">
                You don't have any trips created yet. Create a trip first to add {city.name} as a stop!
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCreateTrip();
                }}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                Create a Trip First
              </button>
            </div>
          ) : (
            <form onSubmit={handleSave} noValidate className="space-y-4">
              {/* Trip Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Target Trip Itinerary *
                </label>
                <select
                  value={selectedTripId}
                  onChange={(e) => setSelectedTripId(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                >
                  {trips.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.start_date} → {t.end_date})
                    </option>
                  ))}
                </select>
              </div>

              {/* Transit Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-sky-600" />
                    <span>Arrival Date *</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-sky-600" />
                    <span>Departure Date *</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Transport Mode */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Arrival Transit Mode to {city.name}
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { id: 'flight', label: 'Flight', icon: Plane },
                    { id: 'train', label: 'Train', icon: Train },
                    { id: 'car', label: 'Drive', icon: Car },
                    { id: 'bus', label: 'Bus', icon: Bus },
                    { id: 'ferry', label: 'Ferry', icon: Ship },
                  ].map((mode) => {
                    const Icon = mode.icon;
                    const isActive = transportMode === mode.id;
                    return (
                      <button
                        type="button"
                        key={mode.id}
                        onClick={() => setTransportMode(mode.id as any)}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          isActive
                            ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <Icon className="w-4 h-4 mx-auto mb-1" />
                        <span className="block text-[10px] font-semibold">{mode.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Transport Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Transit Notes (Terminal, Rail line, Flight No.)
                </label>
                <input
                  type="text"
                  value={transportNotes}
                  onChange={(e) => setTransportNotes(e.target.value)}
                  placeholder="e.g. Express rail connection from airport"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              {/* Signature Sights Auto-Attach */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Auto-Attach Signature Experiences</span>
                  </span>
                  <span className="text-[10px] text-slate-600 font-normal">Optional</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {city.topSights.map((sight) => {
                    const isSelected = selectedSights.includes(sight);
                    return (
                      <button
                        type="button"
                        key={sight}
                        onClick={() => toggleSight(sight)}
                        className={`p-2 rounded-xl border text-left text-[11px] font-medium flex items-center space-x-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-sky-50 border-sky-300 text-sky-900 shadow-2xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 border ${
                          isSelected ? 'bg-sky-600 border-sky-600 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5" />}
                        </div>
                        <span className="truncate">{sight}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 shadow-sm flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span>Adding to Trip...</span>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Add {city.name} to Trip</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
