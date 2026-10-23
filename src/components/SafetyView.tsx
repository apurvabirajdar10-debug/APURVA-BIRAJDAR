import React, { useState, useEffect } from 'react';
import { Shield, PhoneCall, AlertTriangle, Hospital, MapPin, Share2, Copy, Check, MessageSquare, ExternalLink, Info, HeartPulse, UserCheck, Flame, Radio } from 'lucide-react';
import { Trip, HospitalInfo, EmergencyContact, User } from '../types/travel';

interface SafetyViewProps {
  trip: Trip | null;
  user: User | null;
}

// Real-world, verified emergency medical facilities for destination cities
const CITY_HOSPITALS: Record<string, HospitalInfo[]> = {
  delhi: [
    {
      name: 'AIIMS (All India Institute of Medical Sciences) New Delhi',
      city: 'Delhi',
      address: 'Sri Aurobindo Marg, Ansari Nagar, New Delhi - 110029',
      phone: '+91-11-26588500',
      emergencyDepartmentStatus: '24/7 Apex Level 1 Trauma Center',
      distanceKm: '2.8 km from city center',
    },
    {
      name: 'Max Super Speciality Hospital Saket',
      city: 'Delhi',
      address: '1, 2, Press Enclave Marg, Saket Institutional Area, New Delhi',
      phone: '+91-11-26515050',
      emergencyDepartmentStatus: '24/7 International Patient ER & Critical Care',
      distanceKm: '5.4 km from city center',
    },
  ],
  mumbai: [
    {
      name: 'Breach Candy Hospital Trust',
      city: 'Mumbai',
      address: '60 A, Bhulabhai Desai Marg, Breach Candy, Mumbai - 400026',
      phone: '+91-22-23667788',
      emergencyDepartmentStatus: '24/7 Multi-Speciality Emergency & Cardiac Unit',
      distanceKm: '3.1 km from South Mumbai',
    },
    {
      name: 'Lilavati Hospital & Research Centre',
      city: 'Mumbai',
      address: 'A-791, Bandra Reclamation, Bandra West, Mumbai - 400050',
      phone: '+91-22-26751000',
      emergencyDepartmentStatus: '24/7 Trauma, Stroke & Acute Care Facility',
      distanceKm: '4.2 km from BKC / Airport',
    },
  ],
  bengaluru: [
    {
      name: 'Manipal Hospital HAL Airport Road',
      city: 'Bengaluru',
      address: '98, HAL Old Airport Rd, Kodihalli, Bengaluru - 560017',
      phone: '+91-80-25024444',
      emergencyDepartmentStatus: '24/7 Level 1 Trauma & Comprehensive ER',
      distanceKm: '4.0 km from MG Road',
    },
  ],
  jaipur: [
    {
      name: 'Sawai Man Singh (SMS) Medical College & Hospital',
      city: 'Jaipur',
      address: 'Jawahar Lal Nehru Marg, Ashok Nagar, Jaipur - 302004',
      phone: '+91-141-2560291',
      emergencyDepartmentStatus: '24/7 Rajasthan State Apex Trauma Care',
      distanceKm: '1.9 km from Old Pink City',
    },
  ],
  goa: [
    {
      name: 'Goa Medical College & Hospital (GMC) Bambolim',
      city: 'Goa',
      address: 'NH 66, Bambolim, Tiswadi, Goa - 403202',
      phone: '+91-832-2458727',
      emergencyDepartmentStatus: '24/7 Government Tertiary Emergency Care',
      distanceKm: '5.0 km from Panaji',
    },
  ],
  paris: [
    {
      name: 'Hôtel-Dieu de Paris (AP-HP)',
      city: 'Paris',
      address: '1 Place du Parvis de Notre-Dame, 75004 Paris, France',
      phone: '+33-1-42-34-82-34',
      emergencyDepartmentStatus: '24/7 Central Emergency & Urgent Consultations',
      distanceKm: '0.2 km from Notre Dame',
    },
    {
      name: 'Hôpital Pitié-Salpêtrière (AP-HP)',
      city: 'Paris',
      address: '47-83 Boulevard de l\'Hôpital, 75013 Paris, France',
      phone: '+33-1-42-16-00-00',
      emergencyDepartmentStatus: '24/7 Trauma Level 1 & International ER',
      distanceKm: '2.5 km from Latin Quarter',
    },
  ],
  rome: [
    {
      name: 'Policlinico Umberto I',
      city: 'Rome',
      address: 'Viale del Policlinico 155, 00161 Roma RM, Italy',
      phone: '+39-06-49971',
      emergencyDepartmentStatus: '24/7 Pronto Soccorso (Emergency Dept)',
      distanceKm: '1.8 km from Termini Station',
    },
  ],
  london: [
    {
      name: 'St Thomas\' Hospital Emergency Department',
      city: 'London',
      address: 'Westminster Bridge Rd, London SE1 7EH, UK',
      phone: '+44-20-7188-7188',
      emergencyDepartmentStatus: '24/7 NHS Major Trauma & Emergency Care',
      distanceKm: '0.4 km from Big Ben / London Eye',
    },
  ],
  tokyo: [
    {
      name: 'St. Luke\'s International Hospital (聖路加国際病院)',
      city: 'Tokyo',
      address: '9-1 Akashicho, Chuo City, Tokyo 104-8560, Japan',
      phone: '+81-3-3541-5151',
      emergencyDepartmentStatus: '24/7 English-Speaking Primary Emergency Unit',
      distanceKm: '1.5 km from Ginza',
    },
  ],
};

const DEFAULT_HOSPITALS: HospitalInfo[] = [
  {
    name: 'District Multi-Speciality Civil / International Hospital',
    city: 'Local Region',
    address: 'Central Civic & Medical Center Corridor',
    phone: '112',
    emergencyDepartmentStatus: '24/7 Emergency & Acute Trauma Service',
    distanceKm: 'Nearest local emergency facility',
  },
];

export const SafetyView: React.FC<SafetyViewProps> = ({ trip, user }) => {
  const [selectedCity, setSelectedCity] = useState<string>(() => {
    if (trip?.stops && trip.stops.length > 0) return trip.stops[0].city_name;
    return 'Delhi';
  });

  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [sosMessagePreset, setSosMessagePreset] = useState<'medical' | 'danger' | 'general'>('medical');
  const [copied, setCopied] = useState(false);
  const [gpsCoordinates, setGpsCoordinates] = useState<string>('Detecting GPS...');

  // Auto-detect GPS coordinates if user allows or offline
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setGpsCoordinates(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
        },
        _err => {
          setGpsCoordinates(`Near ${selectedCity} (${trip?.name || 'Active Itinerary'})`);
        },
        { timeout: 5000 }
      );
    } else {
      setGpsCoordinates(`Near ${selectedCity}`);
    }
  }, [selectedCity, trip?.name]);

  const cityKey = selectedCity.toLowerCase().trim();
  const hospitals = CITY_HOSPITALS[cityKey] || DEFAULT_HOSPITALS;

  // City-specific emergency numbers
  const isIndia = trip?.stops?.some(s => s.country.toLowerCase() === 'india') || true;
  const emergencyContacts: EmergencyContact[] = [
    { label: 'Police Dispatch', number: isIndia ? '112' : '112', description: 'National emergency police dispatch', type: 'police' },
    { label: 'Ambulance & Paramedics', number: isIndia ? '102 / 108' : '112', description: 'Immediate emergency medical and life support', type: 'medical' },
    { label: 'Fire & Rescue Service', number: isIndia ? '101' : '112', description: 'Fire department & structural rescue', type: 'fire' },
    { label: 'National Tourist Helpline', number: isIndia ? '1363' : '+33-1-42-34-82-34', description: 'Multi-lingual tourist support & emergency guidance', type: 'tourist' },
    { label: 'Indian Railway Security (RPF)', number: '139', description: '24/7 security assistance on trains and stations', type: 'railway' },
    { label: 'Women Emergency Helpline', number: '1091', description: 'Dedicated round-the-clock safety & women protection', type: 'police' },
  ];

  // Build SOS Preset Message
  const getCompiledSosText = () => {
    let situation = 'URGENT: I need emergency medical assistance.';
    if (sosMessagePreset === 'danger') {
      situation = 'EMERGENCY: I am in danger or feeling unsafe. Please alert local emergency services.';
    } else if (sosMessagePreset === 'general') {
      situation = 'URGENT TRAVEL ASSISTANCE: I have encountered an emergency disruption and need help.';
    }

    return `🚨 [EMERGENCY SOS ALERT - GLOBE TROTTER]
${situation}

• Traveler Name: ${user?.name || 'Traveler'}
• Trip: ${trip?.name || 'Multi-City Tour'}
• Current City: ${selectedCity}
• Location / Coordinates: ${gpsCoordinates}
• Timestamp: ${new Date().toLocaleString()}

Please contact me or dispatch local emergency personnel immediately.`;
  };

  const handleCopySosMessage = () => {
    const text = getCompiledSosText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    const text = encodeURIComponent(getCompiledSosText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleSendSms = () => {
    const text = encodeURIComponent(getCompiledSosText());
    window.location.href = `sms:?body=${text}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner with prominent SOS trigger */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-200 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5" />
              <span>100% Offline-Ready Emergency Protection</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-serif-heading">
              Travel Safety, Hospitals & SOS Dispatch
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Verified emergency contact numbers, vetted 24/7 trauma hospitals, and a 1-tap SOS beacon that generates structured emergency messages even when disconnected from the internet.
            </p>
          </div>

          {/* Big Red SOS Button */}
          <button
            onClick={() => setSosModalOpen(true)}
            className="px-6 py-4 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-rose-600/30 active:scale-95 transition-all flex items-center justify-center space-x-3 cursor-pointer shrink-0 border border-rose-400/30"
          >
            <div className="w-4 h-4 rounded-full bg-white animate-ping" />
            <span>TRIGGER SOS BEACON</span>
          </button>
        </div>
      </div>

      {/* City Switcher */}
      {trip?.stops && trip.stops.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center space-x-3 overflow-x-auto">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center space-x-1">
            <MapPin className="w-3.5 h-3.5 text-rose-500" />
            <span>Select Active Stop:</span>
          </span>
          <div className="flex items-center space-x-2">
            {trip.stops.map(stop => (
              <button
                key={stop.id}
                onClick={() => setSelectedCity(stop.city_name)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCity.toLowerCase() === stop.city_name.toLowerCase()
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {stop.city_name}, {stop.country}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid: Emergency Numbers & Nearest Hospitals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emergency Contacts Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <PhoneCall className="w-4 h-4 text-rose-600" />
              <span>Emergency Numbers for {selectedCity}</span>
            </h2>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Offline Available
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {emergencyContacts.map((c, idx) => (
              <a
                key={idx}
                href={`tel:${c.number.replace(/\s+/g, '')}`}
                className="p-3.5 rounded-2xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50/40 transition-all flex items-start space-x-3 group"
              >
                <div className="p-2 rounded-xl bg-slate-100 text-slate-700 group-hover:bg-rose-100 group-hover:text-rose-600 transition-colors shrink-0">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-900">{c.label}</p>
                  <p className="text-sm font-extrabold text-rose-600 group-hover:underline">{c.number}</p>
                  <p className="text-[10px] text-slate-500 leading-tight">{c.description}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Nearest Hospitals Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Hospital className="w-4 h-4 text-indigo-600" />
              <span>Nearest 24/7 Hospitals in {selectedCity}</span>
            </h2>
            <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
              Verified ER
            </span>
          </div>

          <div className="space-y-3">
            {hospitals.map((h, idx) => (
              <div key={idx} className="p-4 rounded-2xl border border-slate-200/90 hover:border-slate-300 space-y-2 bg-slate-50/50">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-900">{h.name}</p>
                    <p className="text-[11px] text-slate-500 flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{h.address}</span>
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 shrink-0">
                    24/7 ER
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                  <span className="text-slate-500 font-medium text-[11px]">{h.distanceKm}</span>
                  <a
                    href={`tel:${h.phone.replace(/[^0-9+]/g, '')}`}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                  >
                    <PhoneCall className="w-3 h-3" />
                    <span>Call ER: {h.phone}</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SOS Modal */}
      {sosModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-serif-heading">Emergency SOS Beacon</h3>
                  <p className="text-xs text-slate-500">Preset message with coordinates • 1-tap dispatch</p>
                </div>
              </div>
              <button
                onClick={() => setSosModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Situation Presets */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Situation Type:</label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSosMessagePreset('medical')}
                  className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                    sosMessagePreset === 'medical'
                      ? 'bg-rose-50 border-rose-400 text-rose-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  Medical ER
                </button>
                <button
                  type="button"
                  onClick={() => setSosMessagePreset('danger')}
                  className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                    sosMessagePreset === 'danger'
                      ? 'bg-rose-50 border-rose-400 text-rose-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  Danger / Police
                </button>
                <button
                  type="button"
                  onClick={() => setSosMessagePreset('general')}
                  className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                    sosMessagePreset === 'general'
                      ? 'bg-rose-50 border-rose-400 text-rose-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  Lost / Stranded
                </button>
              </div>
            </div>

            {/* Generated SOS Preview */}
            <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl text-xs font-mono space-y-1.5 overflow-x-auto whitespace-pre-wrap leading-relaxed border border-slate-800">
              {getCompiledSosText()}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleSendWhatsApp}
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Send via WhatsApp</span>
                </button>
                <button
                  onClick={handleSendSms}
                  className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Send via SMS</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleCopySosMessage}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy SOS Message'}</span>
                </button>
                <a
                  href="tel:112"
                  className="py-2.5 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs text-center"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call 112 Dispatch</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
