import React, { useState } from 'react';
import { Heart, Plus, MapPin, Volume2, VolumeX, Sparkles, Compass, Share2, Check, Clock, IndianRupee, Tag, ChevronDown } from 'lucide-react';
import { Trip, TravelReel, Activity } from '../types/travel';
import { api } from '../lib/api';

interface ReelFeedViewProps {
  trips: Trip[];
  activeTrip: Trip | null;
  onTripUpdated: (updatedTrip: Trip) => void;
  onNavigateToBuilder?: () => void;
}

const SEEDED_REELS: TravelReel[] = [
  {
    id: 'reel-1',
    title: 'Hidden Sunset Cliff & Wave Breakers in North Goa',
    city: 'Goa',
    country: 'India',
    locationName: 'Ozran Beach Hidden Cove, Vagator',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80',
    description: 'Tucked behind the red laterite cliffs of Vagator lies a secret crescent cove where local fishermen anchor and waves crash against basalt tidepools during twilight.',
    tags: ['Sunset Vibe', 'Hidden Gem', 'Coastal Walk'],
    category: 'relaxation',
    cost: 0,
    durationHours: 2.0,
    likes: 1420,
  },
  {
    id: 'reel-2',
    title: 'Secret Midnight Ramen & Lantern Alleys of Omoide Yokocho',
    city: 'Tokyo',
    country: 'Japan',
    locationName: 'Memory Lane, Shinjuku',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
    description: 'Narrow post-war alleyways illuminated by paper lanterns, grilling yakitori skewers over binchotan charcoal and steaming tonkotsu broth until 3 AM.',
    tags: ['Street Food', 'Nightlife', 'Authentic'],
    category: 'food',
    cost: 1400,
    durationHours: 2.5,
    likes: 2890,
  },
  {
    id: 'reel-3',
    title: 'Subterranean Mithras Sanctuary & Ancient Basilica Crypts',
    city: 'Rome',
    country: 'Italy',
    locationName: 'San Clemente Underground Excavations',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80',
    description: 'Descend 3 distinct historical layers: a 12th-century upper basilica, a 4th-century forgotten church, and a 1st-century Roman pagan sanctuary where underground river water still rushes.',
    tags: ['Archaeology', 'Crypts', 'Heritage'],
    category: 'culture',
    cost: 950,
    durationHours: 2.0,
    likes: 3105,
  },
  {
    id: 'reel-4',
    title: 'High Altitude Magnetic Hill & Indus-Zanskar Sangam Vista',
    city: 'Leh Ladakh',
    country: 'India',
    locationName: 'Nimmu Confluence, Ladakh',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?auto=format&fit=crop&w=1200&q=80',
    description: 'Witness the dramatic turquoise waters of the Indus River meet the muddy glacial waters of the Zanskar in a breathtaking gorge flanked by barren Himalayan peaks.',
    tags: ['Himalayas', 'Adventure', 'Panoramic'],
    category: 'adventure',
    cost: 1800,
    durationHours: 3.5,
    likes: 4210,
  },
  {
    id: 'reel-5',
    title: 'Floating Dawn Aarti & Boat Ride on Varanasi Ghats',
    city: 'Varanasi',
    country: 'India',
    locationName: 'Assi Ghat to Dashashwamedh',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1200&q=80',
    description: 'Rowing past 3,000-year-old stone steps at 5:30 AM as temple bells chime, marigold flower diyas float along the river, and morning ragas echo in the mist.',
    tags: ['Spiritual', 'Sunrise', 'Historic'],
    category: 'culture',
    cost: 500,
    durationHours: 2.0,
    likes: 5640,
  },
  {
    id: 'reel-6',
    title: 'Alpine Cogwheel Ascent to Mount Pilatus Dragon Peak',
    city: 'Lucerne',
    country: 'Switzerland',
    locationName: 'Alpnachstad to Pilatus Kulm (48% Gradient)',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1200&q=80',
    description: 'The steepest cogwheel railway in the world crawling past sheer limestone cliffs and alpine pastures into sea-of-clouds panoramas over Lake Lucerne.',
    tags: ['Alpine Rail', 'Scenic Views', 'Bucketlist'],
    category: 'adventure',
    cost: 4200,
    durationHours: 4.0,
    likes: 2780,
  },
];

export const ReelFeedView: React.FC<ReelFeedViewProps> = ({
  trips,
  activeTrip,
  onTripUpdated,
  onNavigateToBuilder,
}) => {
  const [reels, setReels] = useState<TravelReel[]>(SEEDED_REELS);
  const [likedReelIds, setLikedReelIds] = useState<Record<string, boolean>>({});
  const [muted, setMuted] = useState(true);
  const [selectedReelForTrip, setSelectedReelForTrip] = useState<TravelReel | null>(null);
  const [targetTripId, setTargetTripId] = useState<number>(activeTrip?.id || (trips[0]?.id || 0));
  const [targetStopId, setTargetStopId] = useState<number | undefined>(activeTrip?.stops?.[0]?.id);
  const [timeSlot, setTimeSlot] = useState<'morning' | 'afternoon' | 'evening'>('afternoon');
  const [addingToTrip, setAddingToTrip] = useState(false);
  const [addSuccessToast, setAddSuccessToast] = useState<string | null>(null);

  const handleToggleLike = (id: string) => {
    const isLiked = !!likedReelIds[id];
    setLikedReelIds(prev => ({ ...prev, [id]: !isLiked }));
    setReels(prev => prev.map(r => r.id === id ? { ...r, likes: r.likes + (isLiked ? -1 : 1) } : r));
  };

  const selectedTripObj = trips.find(t => t.id === targetTripId) || activeTrip;

  const handleConfirmAddToTrip = async () => {
    if (!selectedReelForTrip || !selectedTripObj) return;
    setAddingToTrip(true);

    try {
      const stop = selectedTripObj.stops?.find(s => s.id === targetStopId) || selectedTripObj.stops?.[0];
      const dateToUse = stop ? stop.start_date : selectedTripObj.start_date;

      // Add activity to trip
      const newAct: Partial<Activity> = {
        trip_id: selectedTripObj.id,
        stop_id: stop ? stop.id : 0,
        title: selectedReelForTrip.title,
        description: selectedReelForTrip.description,
        cost: selectedReelForTrip.cost,
        category: selectedReelForTrip.category,
        duration_hours: selectedReelForTrip.durationHours,
        location: selectedReelForTrip.locationName,
        time_slot: timeSlot,
        date: dateToUse,
        booking_status: 'planned',
      };

      if (stop) {
        await api.createActivity(stop.id, newAct);
        const refreshed = await api.getTrip(selectedTripObj.id);
        onTripUpdated(refreshed.trip);
      }

      setAddSuccessToast(`Added "${selectedReelForTrip.title}" to ${selectedTripObj.name}!`);
      setSelectedReelForTrip(null);
      setTimeout(() => setAddSuccessToast(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Could not add to trip');
    } finally {
      setAddingToTrip(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-violet-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-400/30 text-violet-200 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Explore Vertical Visual Reels & Curated Sights</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-serif-heading">
              Travel Reel Feed & Spot Discovery
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Immerse yourself in authentic destination moments, secret alleyways, sunset lookouts, and culinary masterclasses. Found a spot you love? Tap <strong className="text-white font-semibold">+ Add to Trip</strong> to weave it directly into your itinerary schedule.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => setMuted(!muted)}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer flex items-center space-x-2 text-xs font-semibold"
            >
              {muted ? <VolumeX className="w-4 h-4 text-slate-300" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              <span>{muted ? 'Sound Muted' : 'Sound Active'}</span>
            </button>
          </div>
        </div>
      </div>

      {addSuccessToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{addSuccessToast}</span>
          </div>
          {onNavigateToBuilder && (
            <button
              onClick={onNavigateToBuilder}
              className="text-xs text-emerald-700 hover:text-emerald-900 underline font-semibold cursor-pointer"
            >
              View in Itinerary Builder →
            </button>
          )}
        </div>
      )}

      {/* Reel Feed Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reels.map(reel => {
          const isLiked = !!likedReelIds[reel.id];
          return (
            <div
              key={reel.id}
              className="group bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
            >
              {/* Media Container with Image / Video simulation */}
              <div className="relative aspect-[4/5] bg-slate-900 overflow-hidden">
                <img
                  src={reel.mediaUrl}
                  alt={reel.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                {/* Floating Tags */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                  <span className="px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold border border-white/20">
                    📍 {reel.city}, {reel.country}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-violet-600/90 text-white text-[10px] font-semibold">
                    {reel.category}
                  </span>
                </div>

                {/* Like Button */}
                <button
                  onClick={() => handleToggleLike(reel.id)}
                  className="absolute top-3 right-3 p-2.5 rounded-full bg-slate-900/70 backdrop-blur-md text-white hover:scale-110 active:scale-95 transition-all z-10 cursor-pointer"
                  title="Like Reel"
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : 'text-white'}`} />
                </button>

                {/* Bottom Overlay Info on Media */}
                <div className="absolute bottom-3 left-3 right-3 text-white space-y-1.5 z-10">
                  <p className="text-[11px] text-slate-300 font-medium flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                    <span className="truncate">{reel.locationName}</span>
                  </p>
                  <h3 className="text-sm font-bold leading-snug drop-shadow-sm line-clamp-2">
                    {reel.title}
                  </h3>
                </div>
              </div>

              {/* Card Footer Content */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {reel.description}
                </p>

                {/* Meta details & tags */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{reel.durationHours} hrs</span>
                      </span>
                      <span className="flex items-center space-x-1 font-semibold text-slate-800 font-mono">
                        {reel.cost === 0 ? 'Free Entry' : `₹${reel.cost.toLocaleString('en-IN')}`}
                      </span>
                    </div>
                    <span className="text-[11px] text-rose-600 font-bold flex items-center space-x-1">
                      <Heart className="w-3 h-3 fill-rose-500" />
                      <span>{reel.likes}</span>
                    </span>
                  </div>

                  {/* Add to Trip CTA */}
                  <button
                    onClick={() => {
                      setSelectedReelForTrip(reel);
                      if (activeTrip) {
                        setTargetTripId(activeTrip.id);
                        if (activeTrip.stops && activeTrip.stops.length > 0) {
                          setTargetStopId(activeTrip.stops[0].id);
                        }
                      }
                    }}
                    className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add to Trip Itinerary</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add To Trip Selector Modal */}
      {selectedReelForTrip && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-serif-heading">
                  Add Spot to Itinerary
                </h3>
                <p className="text-xs text-slate-500 line-clamp-1">{selectedReelForTrip.title}</p>
              </div>
              <button
                onClick={() => setSelectedReelForTrip(null)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Trip selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Trip</label>
                <select
                  value={targetTripId}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setTargetTripId(id);
                    const t = trips.find(trip => trip.id === id);
                    if (t?.stops && t.stops.length > 0) {
                      setTargetStopId(t.stops[0].id);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-800"
                >
                  {trips.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Stop selector */}
              {selectedTripObj?.stops && selectedTripObj.stops.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City Stop</label>
                  <select
                    value={targetStopId}
                    onChange={(e) => setTargetStopId(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-800"
                  >
                    {selectedTripObj.stops.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.city_name} ({s.start_date})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Time slot selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Time of Day</label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {(['morning', 'afternoon', 'evening'] as const).map(slot => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setTimeSlot(slot)}
                      className={`py-2 rounded-xl border font-bold capitalize transition-all cursor-pointer ${
                        timeSlot === slot
                          ? 'bg-sky-50 border-sky-400 text-sky-700'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setSelectedReelForTrip(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAddToTrip}
                disabled={addingToTrip}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                {addingToTrip ? <span>Adding...</span> : <span>Confirm & Add</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
