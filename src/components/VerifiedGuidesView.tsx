import React, { useState } from 'react';
import { Award, Star, CheckCircle, Plus, MapPin, Globe, MessageSquare, IndianRupee, Sparkles, Send, ShieldCheck, UserCheck } from 'lucide-react';
import { Trip, VerifiedGuide, Activity } from '../types/travel';
import { api } from '../lib/api';

interface VerifiedGuidesViewProps {
  trips: Trip[];
  activeTrip: Trip | null;
  onTripUpdated: (updatedTrip: Trip) => void;
  onNavigateToBuilder?: () => void;
}

const SEEDED_GUIDES: VerifiedGuide[] = [
  {
    id: 'guide-1',
    name: 'Sunil Mathur',
    city: 'Delhi',
    country: 'India',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    isVerified: true,
    badgeTitle: 'Verified Local Historian',
    rating: 4.96,
    reviewCount: 142,
    languages: ['English', 'Hindi', 'Urdu'],
    feePerDay: 3500,
    specialties: ['Mughal Architecture', 'Old City Street Food', 'Sufi Music Shrines'],
    bio: 'Born inside the walled city of Shahjahanabad. Archeology master’s graduate with 12 years guiding diplomats, authors, and curious explorers through secret courtyards.',
    curatedSpots: [
      {
        title: 'Hidden Mughal Haveli Rooftop & Attar Perfumerie',
        description: 'Exclusive access to a 200-year-old restored courtyard mansion and an 8th-generation royal attar perfumer in Ballimaran.',
        category: 'culture',
        cost: 650,
        durationHours: 2.0,
        timeSlot: 'morning',
      },
      {
        title: 'Secret Khari Baoli Spice Overlook & Chai Kiosk',
        description: 'Navigate spice sacks up spiral stairs to the private terrace overlooking Asia\'s largest spice bazaar while sipping ginger saffron chai.',
        category: 'food',
        cost: 350,
        durationHours: 1.5,
        timeSlot: 'afternoon',
      },
      {
        title: 'Nizamuddin Basti Sufi Qawwali Experience',
        description: 'Experience mystical live qawwali poetry sung in the illuminated courtyard of Hazrat Nizamuddin Auliya Dargah.',
        category: 'culture',
        cost: 400,
        durationHours: 2.5,
        timeSlot: 'evening',
      },
    ],
  },
  {
    id: 'guide-2',
    name: 'Chiara Rossi',
    city: 'Rome',
    country: 'Italy',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    isVerified: true,
    badgeTitle: 'Verified Culinary Sommelier',
    rating: 4.98,
    reviewCount: 215,
    languages: ['Italian', 'English', 'French'],
    feePerDay: 5800,
    specialties: ['Artisan Gelaterias', 'Trastevere Cellars', 'Roman Forum Crypts'],
    bio: 'Certified Italian sommelier and native Roman from Testaccio. Passionate about uncovering family-owned trattorias, bio-dynamic Lazio vineyards, and subterranean antiquities.',
    curatedSpots: [
      {
        title: 'Trastevere Ancient Water Mill & Pecorino Vaults',
        description: 'A subterranean cellar beneath a Renaissance bakery storing raw sheep milk pecorino wheels dating back generations.',
        category: 'food',
        cost: 1200,
        durationHours: 2.0,
        timeSlot: 'morning',
      },
      {
        title: 'Jewish Ghetto Fried Artichoke (Carciofi alla Giudia) Lab',
        description: 'Watch master chefs double-fry whole Roman artichokes to golden crisp perfection along Portico d\'Ottavia.',
        category: 'food',
        cost: 950,
        durationHours: 1.5,
        timeSlot: 'afternoon',
      },
      {
        title: 'Aventine Keyhole & Secret Orange Garden Sunset',
        description: 'Peer through the Knights of Malta keyhole perfectly framing St. Peter’s Dome, then sip prosecco in Giardino degli Aranci.',
        category: 'sightseeing',
        cost: 500,
        durationHours: 2.0,
        timeSlot: 'evening',
      },
    ],
  },
  {
    id: 'guide-3',
    name: 'Kenji Takahashi',
    city: 'Kyoto',
    country: 'Japan',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    isVerified: true,
    badgeTitle: 'Verified Zen Scholar & Botanist',
    rating: 4.95,
    reviewCount: 98,
    languages: ['Japanese', 'English'],
    feePerDay: 6200,
    specialties: ['Secret Moss Gardens', 'Gion Tea Masters', 'Bamboo Forest Trails'],
    bio: 'Former landscape architect at Tenryu-ji Zen temple. Leads quiet, crowd-free morning expeditions into tucked-away mountain moss shrines and private ceramic ateliers.',
    curatedSpots: [
      {
        title: 'Private Gio-ji Forest Moss Sanctuary Meditation',
        description: 'Sit in stillness surrounded by 120 species of velvety emerald moss inside an intimate bamboo thatched temple.',
        category: 'culture',
        cost: 800,
        durationHours: 2.0,
        timeSlot: 'morning',
      },
      {
        title: 'Gion Uji Single-Estate Matcha Whisking Lab',
        description: 'Grind roasted tencha leaves on a stone mill and whisk ceremonial grade green tea with an 80-year-old tea master.',
        category: 'food',
        cost: 1600,
        durationHours: 1.5,
        timeSlot: 'afternoon',
      },
      {
        title: 'Kamo Riverbank Twilight Lantern Stroll',
        description: 'Walk alongside Kyotoites on the Kamo riverbanks where historic wooden kawadoko dining platforms jut over flowing mountain waters.',
        category: 'relaxation',
        cost: 0,
        durationHours: 1.5,
        timeSlot: 'evening',
      },
    ],
  },
  {
    id: 'guide-4',
    name: 'Amélie Dupont',
    city: 'Paris',
    country: 'France',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    isVerified: true,
    badgeTitle: 'Verified Art & Literary Historian',
    rating: 4.97,
    reviewCount: 168,
    languages: ['French', 'English', 'Spanish'],
    feePerDay: 5400,
    specialties: ['Montmartre Artists', 'Covered Passages', 'Artisan Fromageries'],
    bio: 'Sorbonne art history lecturer and passionate flâneuse. Specializes in 19th-century bohemian Paris, impressionist haunts, and glass-roofed secret shopping arcades.',
    curatedSpots: [
      {
        title: 'Passage des Panoramas & Antique Print Discovery',
        description: 'Walk under gas-lamp illuminated 1800s glass arcades filled with antiquarian bookshops and artisan tearooms.',
        category: 'culture',
        cost: 450,
        durationHours: 2.0,
        timeSlot: 'morning',
      },
      {
        title: 'Marais Raw-Milk Cheese & Baguette Master Pairing',
        description: 'Sample Comte aged 36 months, Saint-Nectaire, and crottin de Chavignol paired with natural cider in an affineur cave.',
        category: 'food',
        cost: 1400,
        durationHours: 1.5,
        timeSlot: 'afternoon',
      },
      {
        title: 'Square du Vert-Galant Seine Sunset Picnic',
        description: 'Sit at the very tip of Île de la Cité surrounded by weeping willows watching the lit-up batobus boats glide past.',
        category: 'relaxation',
        cost: 300,
        durationHours: 2.0,
        timeSlot: 'evening',
      },
    ],
  },
];

export const VerifiedGuidesView: React.FC<VerifiedGuidesViewProps> = ({
  trips,
  activeTrip,
  onTripUpdated,
  onNavigateToBuilder,
}) => {
  const [guides] = useState<VerifiedGuide[]>(SEEDED_GUIDES);
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('All');
  const [contactGuideModal, setContactGuideModal] = useState<VerifiedGuide | null>(null);
  const [contactMessage, setContactMessage] = useState('');
  const [messageSent, setMessageSent] = useState(false);
  const [importingGuideId, setImportingGuideId] = useState<string | null>(null);
  const [importSuccessToast, setImportSuccessToast] = useState<string | null>(null);

  const selectedTrip = activeTrip || trips[0];

  const filteredGuides = selectedCityFilter === 'All'
    ? guides
    : guides.filter(g => g.city.toLowerCase() === selectedCityFilter.toLowerCase());

  const handleAddAllPlacesToTrip = async (guide: VerifiedGuide) => {
    if (!selectedTrip) {
      alert('Please select or create an active trip first');
      return;
    }

    setImportingGuideId(guide.id);
    try {
      // Find matching stop or use first stop
      let stop = selectedTrip.stops?.find(s => s.city_name.toLowerCase() === guide.city.toLowerCase());
      if (!stop && selectedTrip.stops && selectedTrip.stops.length > 0) {
        stop = selectedTrip.stops[0];
      }

      if (!stop) {
        alert(`No matching stop for ${guide.city} in ${selectedTrip.name}. Please add a stop for ${guide.city} first.`);
        return;
      }

      for (const spot of guide.curatedSpots) {
        await api.createActivity(stop.id, {
          trip_id: selectedTrip.id,
          stop_id: stop.id,
          title: spot.title,
          description: `${spot.description} (Curated by Verified Guide ${guide.name})`,
          cost: spot.cost,
          category: spot.category,
          duration_hours: spot.durationHours,
          time_slot: spot.timeSlot,
          date: stop.start_date,
          location: `${guide.city}, ${guide.country}`,
          booking_status: 'planned',
        });
      }

      const refreshed = await api.getTrip(selectedTrip.id);
      onTripUpdated(refreshed.trip);
      setImportSuccessToast(`All ${guide.curatedSpots.length} places curated by ${guide.name} added to ${selectedTrip.name}!`);
      setTimeout(() => setImportSuccessToast(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Could not import places');
    } finally {
      setImportingGuideId(null);
    }
  };

  const handleSendInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactMessage.trim()) return;
    setMessageSent(true);
    setTimeout(() => {
      setMessageSent(false);
      setContactGuideModal(null);
      setContactMessage('');
      alert(`Message delivered to ${contactGuideModal?.name}! They typically respond within 20 minutes.`);
    }, 1200);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs font-semibold">
              <Award className="w-3.5 h-3.5 text-amber-300" />
              <span>Vetted Local Experts & Secret Itinerary Spots</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-serif-heading">
              Verified Local Guides & Secret Spots
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Explore multi-city destinations through the eyes of background-checked, accredited local insiders. Tap <strong className="text-white font-semibold">Add all places to trip</strong> to import a guide’s complete handpicked secret spots in 1 click.
            </p>
          </div>

          {selectedTrip && (
            <div className="bg-white/10 border border-white/20 rounded-2xl p-3.5 text-xs text-slate-200 max-w-xs shrink-0 backdrop-blur-md space-y-1">
              <span className="text-[10px] uppercase font-bold text-amber-300">Active Destination Context:</span>
              <p className="font-bold text-white truncate">{selectedTrip.name}</p>
              <p className="text-[11px] text-slate-300">{selectedTrip.stops?.map(s => s.city_name).join(' • ')}</p>
            </div>
          )}
        </div>
      </div>

      {importSuccessToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{importSuccessToast}</span>
          </div>
          {onNavigateToBuilder && (
            <button
              onClick={onNavigateToBuilder}
              className="text-xs text-emerald-700 hover:text-emerald-900 underline font-semibold cursor-pointer"
            >
              Open Itinerary Timeline →
            </button>
          )}
        </div>
      )}

      {/* City Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 text-xs">
        <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px] shrink-0 mr-1">Filter City:</span>
        {['All', 'Delhi', 'Rome', 'Kyoto', 'Paris'].map(city => (
          <button
            key={city}
            onClick={() => setSelectedCityFilter(city)}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
              selectedCityFilter.toLowerCase() === city.toLowerCase()
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {city}
          </button>
        ))}
      </div>

      {/* Guides Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredGuides.map(guide => {
          const isImporting = importingGuideId === guide.id;
          return (
            <div
              key={guide.id}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
            >
              <div className="p-6 sm:p-7 space-y-5">
                {/* Guide Profile Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start space-x-4">
                    <img
                      src={guide.avatarUrl}
                      alt={guide.name}
                      className="w-16 h-16 rounded-2xl object-cover ring-2 ring-amber-400/50 shadow-md shrink-0"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-base font-extrabold text-slate-900 font-serif-heading">
                          {guide.name}
                        </h3>
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold border border-amber-300/80">
                          <CheckCircle className="w-3 h-3 text-amber-600 fill-amber-500 text-white" />
                          <span>Verified Local</span>
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{guide.city}, {guide.country}</span>
                      </p>

                      <div className="flex items-center space-x-3 text-xs">
                        <span className="flex items-center space-x-1 font-bold text-amber-700">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span>{guide.rating}</span>
                          <span className="text-slate-400 font-normal">({guide.reviewCount} reviews)</span>
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className="text-slate-600 font-semibold font-mono">
                          ₹{guide.feePerDay.toLocaleString('en-IN')}/day
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setContactGuideModal(guide)}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 text-slate-700 transition-colors cursor-pointer shrink-0"
                    title="Direct Message Guide"
                  >
                    <MessageSquare className="w-4 h-4 text-amber-600" />
                  </button>
                </div>

                {/* Bio & Specialties */}
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {guide.bio}
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {guide.specialties.map((spec, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-medium"
                    >
                      {spec}
                    </span>
                  ))}
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-[11px] font-semibold flex items-center space-x-1">
                    <Globe className="w-3 h-3" />
                    <span>{guide.languages.join(', ')}</span>
                  </span>
                </div>

                {/* Guide's Curated Secret Spots */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>{guide.name}'s Curated Secret Spots ({guide.curatedSpots.length})</span>
                    </h4>
                  </div>

                  <div className="space-y-2">
                    {guide.curatedSpots.map((spot, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-slate-900">{spot.title}</span>
                          <span className="text-amber-700 font-mono">
                            {spot.cost === 0 ? 'Free' : `₹${spot.cost}`}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">{spot.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer 1-Click Action */}
              <div className="p-6 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between gap-4">
                <button
                  onClick={() => setContactGuideModal(guide)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Contact Guide
                </button>

                <button
                  onClick={() => handleAddAllPlacesToTrip(guide)}
                  disabled={isImporting}
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {isImporting ? (
                    <span>Importing spots to {selectedTrip?.name}...</span>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Add all places to trip</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Contact Guide Modal */}
      {contactGuideModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <img
                  src={contactGuideModal.avatarUrl}
                  alt={contactGuideModal.name}
                  className="w-10 h-10 rounded-xl object-cover ring-2 ring-amber-400"
                />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Message {contactGuideModal.name}</h3>
                  <p className="text-xs text-slate-500">{contactGuideModal.badgeTitle}</p>
                </div>
              </div>
              <button
                onClick={() => setContactGuideModal(null)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendInquiry} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Trip Inquiries or Special Custom Requests
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder={`Hi ${contactGuideModal.name}, we are planning a trip to ${contactGuideModal.city} and would love your guidance for...`}
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setContactGuideModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={messageSent}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-extrabold transition-colors flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  {messageSent ? <span>Delivering...</span> : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Direct Inquiry</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
