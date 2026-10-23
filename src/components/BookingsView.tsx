import React, { useState, useMemo, useEffect } from 'react';
import {
  Train,
  Bus,
  Plane,
  Car,
  Hotel,
  Ticket,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  Star,
  Users,
  CreditCard,
  Luggage,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  Compass,
  AlertTriangle,
  QrCode,
  Download,
  Share2,
  Check,
  Landmark,
  Building2,
  Trees,
  FerrisWheel,
  Bike,
  RefreshCw,
  Info,
  Shield,
  Key,
  ArrowLeftRight,
  FileText
} from 'lucide-react';
import { Trip, Activity, Stop } from '../types/travel';
import { api } from '../lib/api';
import { BookingImportModal } from './BookingImportModal';

interface BookingsViewProps {
  trips: Trip[];
  activeTrip: Trip | null;
  onSelectTrip: (trip: Trip) => void;
  onTripUpdated?: (trip: Trip) => void;
}

export interface ConfirmedBooking {
  id: string;
  type: 'train' | 'bus' | 'flight' | 'vehicle' | 'stay' | 'attraction';
  title: string;
  subtitle: string;
  bookingRef: string;
  travelDate: string;
  origin?: string;
  destination: string;
  amount: number;
  passengersOrGuests: string;
  status: 'Confirmed' | 'Completed';
  categoryLabel: string;
  details: Record<string, string>;
  qrData?: string;
}

// Major Indian Railway Stations with Station Codes
const IRCTC_STATIONS = [
  { code: 'NDLS', name: 'New Delhi', city: 'Delhi' },
  { code: 'CSMT', name: 'Chhatrapati Shivaji Maharaj Terminus', city: 'Mumbai' },
  { code: 'MMCT', name: 'Mumbai Central', city: 'Mumbai' },
  { code: 'SBC', name: 'KSR Bengaluru City', city: 'Bengaluru' },
  { code: 'HWH', name: 'Howrah Junction', city: 'Kolkata' },
  { code: 'MAS', name: 'MGR Chennai Central', city: 'Chennai' },
  { code: 'PNBE', name: 'Patna Junction', city: 'Patna' },
  { code: 'ADI', name: 'Ahmedabad Junction', city: 'Ahmedabad' },
  { code: 'JP', name: 'Jaipur Junction', city: 'Jaipur' },
  { code: 'MAO', name: 'Madgaon Junction', city: 'Goa' },
  { code: 'SVDK', name: 'Shri Mata Vaishno Devi Katra', city: 'Katra / Jammu' },
  { code: 'BSB', name: 'Varanasi Junction', city: 'Varanasi' },
  { code: 'GKP', name: 'Gorakhpur Junction', city: 'Gorakhpur' },
  { code: 'PUNE', name: 'Pune Junction', city: 'Pune' },
  { code: 'CDG', name: 'Chandigarh Junction', city: 'Chandigarh' },
  { code: 'BPL', name: 'Bhopal Junction', city: 'Bhopal' },
  { code: 'HYB', name: 'Hyderabad Deccan', city: 'Hyderabad' },
  { code: 'LKO', name: 'Lucknow Charbagh', city: 'Lucknow' },
  { code: 'ERS', name: 'Ernakulam Junction (South)', city: 'Kochi' },
  { code: 'UDZ', name: 'Udaipur City', city: 'Udaipur' }
];

export const BookingsView: React.FC<BookingsViewProps> = ({
  trips,
  activeTrip,
  onSelectTrip,
  onTripUpdated,
}) => {
  // Main Subsections: 'travel' | 'stay' | 'attractions' | 'my-bookings'
  const [activeSubSection, setActiveSubSection] = useState<'travel' | 'stay' | 'attractions' | 'my-bookings'>('travel');

  // Travelling sub-tabs: 'train' | 'bus' | 'flight' | 'vehicle'
  const [travelTab, setTravelTab] = useState<'train' | 'bus' | 'flight' | 'vehicle'>('train');

  // Vehicle sub-toggle: 'cars' | 'bikes'
  const [vehicleType, setVehicleType] = useState<'cars' | 'bikes'>('cars');

  // Confirmed bookings repository
  const [confirmedBookings, setConfirmedBookings] = useState<ConfirmedBooking[]>([
    {
      id: 'BK-1049',
      type: 'train',
      title: '12952 / MUMBAI RAJDHANI EXPRESS',
      subtitle: 'Coach B3, Berth 27 (Lower Berth) • 3A Tier',
      bookingRef: '241-8934102',
      travelDate: '2026-06-12',
      origin: 'New Delhi (NDLS)',
      destination: 'Mumbai Central (MMCT)',
      amount: 1875,
      passengersOrGuests: '1 Adult (Alex Morgan)',
      status: 'Confirmed',
      categoryLabel: 'IRCTC Indian Railways',
      details: {
        'Train No & Name': '12952 / MUMBAI RAJDHANI',
        'PNR Number': '241-8934102',
        'Departure': '16:55 (NDLS)',
        'Arrival': '08:35 (MMCT)',
        'Quota': 'General (GN)',
        'Class': 'AC 3 Tier (3A)',
        'Coach / Berth': 'B3 - 27 (LB)',
        'Charting Status': 'CHART NOT PREPARED'
      }
    },
    {
      id: 'BK-1050',
      type: 'vehicle',
      title: 'Mahindra Thar 4x4 Convertible Rental',
      subtitle: 'Self-Drive • Free 250 km/day • Keyless Bluetooth Pickup',
      bookingRef: 'GA-RENT-77190',
      travelDate: '2026-06-15',
      origin: 'Goa Hub (Dabolim Airport)',
      destination: 'Goa',
      amount: 3900,
      passengersOrGuests: 'Alex Morgan',
      status: 'Confirmed',
      categoryLabel: 'Vehicle Rental',
      details: {
        'Assigned Plate': 'GA 03 AB 4912',
        'Vehicle Model': 'Mahindra Thar 4x4 Hardtop Diesel',
        'Pickup Location': 'Goa Dabolim Airport Hub Counter 4',
        'Security Deposit': '₹0 (Verified Profile)',
        'Fuel Policy': 'Full to Full'
      }
    }
  ]);

  // Modal states for reservation flows
  const [activeReservationModal, setActiveReservationModal] = useState<any | null>(null);
  const [activeTicketVoucher, setActiveTicketVoucher] = useState<ConfirmedBooking | null>(null);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [addToTripExpensesChecked, setAddToTripExpensesChecked] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Sync bookings from backend when activeTrip changes
  useEffect(() => {
    if (!activeTrip) return;
    async function loadBackendBookings() {
      try {
        const res = await api.getBookings(activeTrip!.id);
        if (res.bookings && res.bookings.length > 0) {
          const mapped: ConfirmedBooking[] = res.bookings.map((b: any) => ({
            id: b.id || `BK-${Math.floor(1000 + Math.random() * 9000)}`,
            type: (b.type === 'hotel' ? 'stay' : b.type === 'rental_car' ? 'vehicle' : b.type) || 'train',
            title: b.title || `${b.provider} Booking`,
            subtitle: `${b.location || 'Confirmed Route'} • Ref: ${b.confirmation_number}`,
            bookingRef: b.confirmation_number,
            travelDate: b.start_date,
            origin: b.origin || b.location,
            destination: b.destination || b.location,
            amount: b.amount || 0,
            passengersOrGuests: b.passenger_or_guest_name || 'Trip Member',
            status: 'Confirmed',
            categoryLabel: `${b.provider || 'Verified'} Voucher`,
            details: {
              'Confirmation Number': b.confirmation_number,
              'Provider / Carrier': b.provider,
              'Dates': `${b.start_date}${b.end_date ? ` to ${b.end_date}` : ''}`,
              'Location / Station': b.location,
              'Seat / Room': b.seat_or_room || 'Assigned',
              'Special Notes': b.notes || 'Verified with Travel Concierge'
            },
            qrData: `GT-${b.confirmation_number}|${b.amount}|${b.start_date}`
          }));

          setConfirmedBookings(prev => {
            const existingRefs = new Set(prev.map(p => p.bookingRef));
            const newItems = mapped.filter(m => !existingRefs.has(m.bookingRef));
            return [...newItems, ...prev];
          });
        }
      } catch (err) {
        console.warn('Could not load backend bookings:', err);
      }
    }
    loadBackendBookings();
  }, [activeTrip?.id]);

  // User's itinerary destination cities (derived from activeTrip)
  const itineraryCities = useMemo(() => {
    if (!activeTrip || !activeTrip.stops || activeTrip.stops.length === 0) {
      return ['Delhi', 'Mumbai', 'Goa', 'Jaipur', 'Bengaluru'];
    }
    return activeTrip.stops.map(s => s.city_name);
  }, [activeTrip]);

  const defaultOrigin = activeTrip?.stops?.[0]?.city_name || 'Delhi';
  const defaultDestination = activeTrip?.stops?.[1]?.city_name || activeTrip?.stops?.[0]?.city_name || 'Mumbai';

  /* ==========================================================================
     1. IRCTC TRAIN BOOKING STATE & AUTHENTIC RAILWAY SIMULATION
     ========================================================================== */
  const [irctcSearch, setIrctcSearch] = useState({
    from: defaultOrigin === 'Delhi' ? 'New Delhi (NDLS)' : defaultOrigin,
    to: defaultDestination === 'Mumbai' ? 'Mumbai Central (MMCT)' : defaultDestination,
    date: activeTrip?.start_date || '2026-06-12',
    travelClass: 'ALL',
    quota: 'GN', // GN: General, TQ: Tatkal, PT: Premium Tatkal, LD: Ladies, SS: Sr. Citizen
  });

  const [pnrSearchInput, setPnrSearchInput] = useState('');
  const [pnrSearchResult, setPnrSearchResult] = useState<any | null>(null);

  // Train selected class state: maps trainId -> chosen class string ('SL' | '3A' | '2A' | '1A' | 'CC' | 'EC' | '3E')
  const [selectedTrainClassMap, setSelectedTrainClassMap] = useState<Record<string, string>>({
    'tr-1': '3A',
    'tr-2': 'CC',
    'tr-3': '2A',
    'tr-4': 'SL',
    'tr-5': '3A'
  });

  // Authentic Indian Railways Trains Database
  const irctcTrainsList = useMemo(() => {
    return [
      {
        id: 'tr-1',
        trainNo: '12952',
        trainName: 'MUMBAI RAJDHANI EXPRESS',
        fromStation: 'NDLS',
        fromName: 'New Delhi',
        toStation: 'MMCT',
        toName: 'Mumbai Central',
        departTime: '16:55',
        arriveTime: '08:35',
        duration: '15h 40m',
        distanceKm: 1386,
        runsOn: [true, true, true, true, true, true, true], // M T W T F S S
        trainType: 'RAJDHANI',
        classes: [
          { code: '3A', name: 'AC 3 Tier', fare: 1875, status: 'AVAILABLE-0048', statusType: 'avail', updateMins: '2m ago' },
          { code: '2A', name: 'AC 2 Tier', fare: 2680, status: 'RAC 14 / RAC 8', statusType: 'rac', updateMins: '5m ago' },
          { code: '1A', name: 'AC First Class', fare: 4450, status: 'AVAILABLE-0006', statusType: 'avail', updateMins: '1m ago' },
        ],
        pantryAvailable: true,
        punctuality: '98% on time',
        haltsCount: 6,
      },
      {
        id: 'tr-2',
        trainNo: '20901',
        trainName: 'VANDE BHARAT EXPRESS',
        fromStation: 'MMCT',
        fromName: 'Mumbai Central',
        toStation: 'GNC',
        toName: 'Gandhinagar Capital',
        departTime: '06:00',
        arriveTime: '12:25',
        duration: '06h 25m',
        distanceKm: 522,
        runsOn: [true, true, true, true, true, true, false], // Excludes Sunday
        trainType: 'VANDE BHARAT',
        classes: [
          { code: 'CC', name: 'AC Chair Car', fare: 1420, status: 'AVAILABLE-0112', statusType: 'avail', updateMins: 'Just now' },
          { code: 'EC', name: 'Executive Chair Car', fare: 2580, status: 'AVAILABLE-0018', statusType: 'avail', updateMins: '3m ago' },
        ],
        pantryAvailable: true,
        punctuality: '99% on time',
        haltsCount: 5,
      },
      {
        id: 'tr-3',
        trainNo: '12002',
        trainName: 'BHOPAL SHATABDI EXPRESS',
        fromStation: 'NDLS',
        fromName: 'New Delhi',
        toStation: 'RKMP',
        toName: 'Rani Kamlapati (Bhopal)',
        departTime: '06:00',
        arriveTime: '14:40',
        duration: '08h 40m',
        distanceKm: 708,
        runsOn: [true, true, true, true, true, true, true],
        trainType: 'SHATABDI',
        classes: [
          { code: 'CC', name: 'AC Chair Car', fare: 1285, status: 'AVAILABLE-0082', statusType: 'avail', updateMins: '8m ago' },
          { code: 'EC', name: 'Executive Class', fare: 2340, status: 'AVAILABLE-0012', statusType: 'avail', updateMins: '4m ago' },
        ],
        pantryAvailable: true,
        punctuality: '96% on time',
        haltsCount: 8,
      },
      {
        id: 'tr-4',
        trainNo: '12138',
        trainName: 'PUNJAB MAIL',
        fromStation: 'NDLS',
        fromName: 'New Delhi',
        toStation: 'CSMT',
        toName: 'Mumbai CSMT',
        departTime: '05:15',
        arriveTime: '07:35',
        duration: '26h 20m',
        distanceKm: 1541,
        runsOn: [true, true, true, true, true, true, true],
        trainType: 'SUPERFAST',
        classes: [
          { code: 'SL', name: 'Sleeper Class', fare: 690, status: 'AVAILABLE-0142', statusType: 'avail', updateMins: '12m ago' },
          { code: '3E', name: '3 AC Economy', fare: 1640, status: 'AVAILABLE-0064', statusType: 'avail', updateMins: '6m ago' },
          { code: '3A', name: 'AC 3 Tier', fare: 1790, status: 'WL 34 / WL 18', statusType: 'wl', updateMins: '15m ago' },
          { code: '2A', name: 'AC 2 Tier', fare: 2590, status: 'AVAILABLE-0022', statusType: 'avail', updateMins: '10m ago' },
        ],
        pantryAvailable: true,
        punctuality: '91% on time',
        haltsCount: 28,
      },
      {
        id: 'tr-5',
        trainNo: '22692',
        trainName: 'BANGALORE RAJDHANI EXPRESS',
        fromStation: 'NZM',
        fromName: 'Hazrat Nizamuddin',
        toStation: 'SBC',
        toName: 'KSR Bengaluru',
        departTime: '20:45',
        arriveTime: '05:20',
        duration: '32h 35m',
        distanceKm: 2365,
        runsOn: [true, true, true, true, true, true, true],
        trainType: 'RAJDHANI',
        classes: [
          { code: '3A', name: 'AC 3 Tier', fare: 2890, status: 'AVAILABLE-0034', statusType: 'avail', updateMins: '3m ago' },
          { code: '2A', name: 'AC 2 Tier', fare: 4120, status: 'RAC 06 / RAC 04', statusType: 'rac', updateMins: '5m ago' },
          { code: '1A', name: 'AC First Class', fare: 6980, status: 'AVAILABLE-0004', statusType: 'avail', updateMins: '2m ago' },
        ],
        pantryAvailable: true,
        punctuality: '97% on time',
        haltsCount: 14,
      }
    ];
  }, []);

  const handleSwapTrainStations = () => {
    setIrctcSearch(prev => ({
      ...prev,
      from: prev.to,
      to: prev.from
    }));
  };

  const handleCheckPnr = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = pnrSearchInput.trim();
    if (!clean) return;

    // Check if matches existing booking or demo PNR
    const existing = confirmedBookings.find(b => b.bookingRef === clean || b.bookingRef.includes(clean));
    if (existing) {
      setPnrSearchResult({
        pnr: existing.bookingRef,
        trainNo: existing.details['Train No & Name'] || '12952 / MUMBAI RAJDHANI',
        dateOfJourney: existing.travelDate,
        from: existing.origin || 'NDLS',
        to: existing.destination || 'MMCT',
        quota: existing.details['Quota'] || 'GN',
        className: existing.details['Class'] || '3A',
        charting: existing.details['Charting Status'] || 'CHART NOT PREPARED',
        passengers: [
          { no: 1, bookingStatus: 'CNF', currentStatus: existing.details['Coach / Berth'] || 'B3 - 27 (LB)' }
        ]
      });
    } else {
      setPnrSearchResult({
        pnr: clean.length === 10 ? `${clean.slice(0, 3)}-${clean.slice(3)}` : clean,
        trainNo: '12952 / MUMBAI RAJDHANI EXP',
        dateOfJourney: irctcSearch.date,
        from: 'NDLS (New Delhi)',
        to: 'MMCT (Mumbai Central)',
        quota: 'General (GN)',
        className: 'AC 3 Tier (3A)',
        charting: 'CHART NOT PREPARED',
        passengers: [
          { no: 1, bookingStatus: 'CNF / B4 / 32 / LB', currentStatus: 'CNF (Confirmed)' }
        ]
      });
    }
  };

  /* ==========================================================================
     2. FLIGHTS REALISTIC MULTI-OPTION INTERFACE
     ========================================================================== */
  const [flightSearch, setFlightSearch] = useState({
    from: 'DEL - Delhi (Indira Gandhi Intl)',
    to: 'BOM - Mumbai (Chhatrapati Shivaji Intl)',
    date: activeTrip?.start_date || '2026-06-12',
    cabinClass: 'Economy',
    fareType: 'saver'
  });

  const flightRoutes = [
    {
      id: 'fl-1',
      airline: 'IndiGo',
      flightNo: '6E-2041',
      fromCode: 'DEL',
      fromAirport: 'Delhi Terminal 1D',
      toCode: 'BOM',
      toAirport: 'Mumbai Terminal 2',
      departTime: '06:15 AM',
      arriveTime: '08:25 AM',
      duration: '2h 10m',
      stops: 'Non-stop',
      fares: {
        saver: { price: 4850, baggage: '15 kg Check-in • 7 kg Cabin', seats: 4, refund: 'Standard cancellation fee' },
        flexi: { price: 5850, baggage: '15 kg Check-in • 7 kg Cabin', seats: 12, refund: 'Free date change + Free Hot Meal + Seat Choice' },
        super6E: { price: 8900, baggage: '25 kg Check-in • 8 kg Cabin', seats: 2, refund: 'Free XL Seat + Fast Forward Check-in + Gourmet Meal' }
      },
      onTimeScore: '96% On-Time'
    },
    {
      id: 'fl-2',
      airline: 'Air India',
      flightNo: 'AI-805 (Boeing 787 Dreamliner)',
      fromCode: 'DEL',
      fromAirport: 'Delhi Terminal 3',
      toCode: 'BOM',
      toAirport: 'Mumbai Terminal 2',
      departTime: '08:00 AM',
      arriveTime: '10:15 AM',
      duration: '2h 15m',
      stops: 'Non-stop',
      fares: {
        saver: { price: 5400, baggage: '20 kg Check-in • 7 kg Cabin', seats: 8, refund: 'Complimentary Hot Meal Included' },
        flexi: { price: 6600, baggage: '25 kg Check-in • 8 kg Cabin', seats: 6, refund: 'Zero change fee up to 24 hrs' },
        super6E: { price: 14500, baggage: '35 kg Check-in • 10 kg Cabin', seats: 3, refund: 'Business Class Lie-flat Suites' }
      },
      onTimeScore: '93% On-Time'
    },
    {
      id: 'fl-3',
      airline: 'Akasa Air',
      flightNo: 'QP-1342 (Boeing 737 MAX)',
      fromCode: 'DEL',
      fromAirport: 'Delhi Terminal 2',
      toCode: 'BOM',
      toAirport: 'Mumbai Terminal 1',
      departTime: '11:45 AM',
      arriveTime: '02:00 PM',
      duration: '2h 15m',
      stops: 'Non-stop',
      fares: {
        saver: { price: 4250, baggage: '15 kg Check-in • 7 kg Cabin', seats: 2, refund: 'Cafe Akasa menu add-on' },
        flexi: { price: 5100, baggage: '15 kg Check-in • 7 kg Cabin', seats: 9, refund: 'Priority boarding + Choice of seat' },
        super6E: { price: 7400, baggage: '25 kg Check-in • 8 kg Cabin', seats: 5, refund: 'Flexible cancellation' }
      },
      onTimeScore: '97% On-Time'
    }
  ];

  /* ==========================================================================
     3. BUS REALISTIC MULTI-OPTION INTERFACE WITH SEAT BERTH MAP
     ========================================================================== */
  const [busSearch, setBusSearch] = useState({
    from: defaultOrigin === 'Delhi' ? 'Delhi' : defaultOrigin,
    to: defaultDestination === 'Mumbai' ? 'Mumbai' : defaultDestination,
    date: activeTrip?.start_date || '2026-06-12',
    busType: 'All Types'
  });

  const busRoutes = [
    {
      id: 'bus-1',
      operator: 'IntrCity SmartBus',
      vehicleModel: 'Volvo 9600 Multi-Axle AC Sleeper (2+1)',
      boardingPoint: 'Kashmere Gate Metro Gate 5 (19:30)',
      droppingPoint: 'Borivali West Gokul Hotel (08:15)',
      departTime: '07:30 PM',
      arriveTime: '08:15 AM',
      duration: '12h 45m',
      rating: 4.85,
      reviewCount: 3410,
      amenities: ['GPS Live Tracking', 'Type-C USB Charging', 'Sanitized Blanket', 'Mineral Water', 'Emergency SOS'],
      berthsAvailable: 8,
      singleSleeperFare: 1450,
      doubleSleeperFare: 1250,
      berthLayout: [
        { id: 'L1', deck: 'lower', type: 'single', status: 'available', isWomen: false },
        { id: 'L2', deck: 'lower', type: 'double', status: 'booked', isWomen: true },
        { id: 'L3', deck: 'lower', type: 'single', status: 'available', isWomen: false },
        { id: 'L4', deck: 'lower', type: 'double', status: 'available', isWomen: false },
        { id: 'U1', deck: 'upper', type: 'single', status: 'available', isWomen: false },
        { id: 'U2', deck: 'upper', type: 'double', status: 'booked', isWomen: false },
        { id: 'U3', deck: 'upper', type: 'single', status: 'available', isWomen: true },
        { id: 'U4', deck: 'upper', type: 'double', status: 'available', isWomen: false }
      ]
    },
    {
      id: 'bus-2',
      operator: 'Zingbus Electric & Premier',
      vehicleModel: 'Mercedes-Benz Super High-Deck AC (2+2)',
      boardingPoint: 'Anand Vihar ISBT Zingbus Lounge (21:00)',
      droppingPoint: 'Sion Circle Main Highway (09:45)',
      departTime: '09:00 PM',
      arriveTime: '09:45 AM',
      duration: '12h 45m',
      rating: 4.75,
      reviewCount: 1890,
      amenities: ['Zero Carbon Emission', 'Air Purification', 'Reading Lamp', 'Water Bottle'],
      berthsAvailable: 14,
      singleSleeperFare: 1190,
      doubleSleeperFare: 1050,
      berthLayout: []
    },
    {
      id: 'bus-3',
      operator: 'KSRTC / VRL Travels Premium Class',
      vehicleModel: 'Scania Metrolink Multi-Axle Semi-Sleeper',
      boardingPoint: 'Majestic Bus Station Platform 4 (20:15)',
      droppingPoint: 'Central Bus Terminal (06:30)',
      departTime: '08:15 PM',
      arriveTime: '06:30 AM',
      duration: '10h 15m',
      rating: 4.8,
      reviewCount: 4200,
      amenities: ['CCTV Surveillance', 'Speed Governor 80 km/h', 'Punctual Dispatch'],
      berthsAvailable: 6,
      singleSleeperFare: 1350,
      doubleSleeperFare: 1150,
      berthLayout: []
    }
  ];

  /* ==========================================================================
     4. CAR & BIKE REAL-TIME REGIONAL FLEET AVAILABILITY
     ========================================================================== */
  const [vehiclePickupCity, setVehiclePickupCity] = useState<string>(
    activeTrip?.stops?.[0]?.city_name || 'Goa'
  );

  // Dynamically tailor authentic fleet based on regional geography of the destination!
  const regionalVehicleFleet = useMemo(() => {
    const loc = vehiclePickupCity.toLowerCase().trim();

    // REGION A: GOA / BEACH / COASTAL
    if (loc.includes('goa') || loc.includes('kochi') || loc.includes('kerala')) {
      return {
        regionBadge: 'Goa & Coastal Special Fleet',
        hubInfo: 'Hubs at Goa Dabolim Airport, Mopa GOX Airport & Panjim Ferry Wharf',
        cars: [
          {
            id: 'car-goa-1',
            name: 'Mahindra Thar 4x4 Convertible',
            category: 'cars',
            tag: 'Top Pick for Goa Beaches',
            type: '4x4 Open-Top SUV • 4 Seats',
            transmission: 'Manual 4WD',
            fuel: 'Diesel • 15 km/l',
            pricePerDay: 3900,
            securityDeposit: 0,
            freeKms: '250 km/day included',
            extraKmCharge: '₹11/km',
            availabilityStatus: '4 units available in North Goa & Dabolim Airport Hub',
            image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80',
            rating: 4.92,
            tripsCount: 420
          },
          {
            id: 'car-goa-2',
            name: 'Maruti Suzuki Jimny 4x4 Alpha',
            category: 'cars',
            tag: 'Compact Beach Offroader',
            type: 'Compact 4WD SUV • 4 Seats',
            transmission: 'Automatic',
            fuel: 'Petrol • 16 km/l',
            pricePerDay: 2900,
            securityDeposit: 0,
            freeKms: '300 km/day included',
            extraKmCharge: '₹9/km',
            availabilityStatus: '3 units available at Mopa International Airport',
            image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
            rating: 4.88,
            tripsCount: 290
          },
          {
            id: 'car-goa-3',
            name: 'Hyundai Creta SX(O) Sunroof',
            category: 'cars',
            tag: 'Family Comfort Cruiser',
            type: 'Mid-size SUV • 5 Seats',
            transmission: 'Automatic (IVT)',
            fuel: 'Petrol • 17 km/l',
            pricePerDay: 2600,
            securityDeposit: 0,
            freeKms: 'Unlimited km option available',
            extraKmCharge: '₹10/km',
            availabilityStatus: '6 units available with hotel doorstep delivery',
            image: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=600&q=80',
            rating: 4.85,
            tripsCount: 510
          }
        ],
        bikes: [
          {
            id: 'bike-goa-1',
            name: 'Royal Enfield Classic 350 Stealth',
            category: 'bikes',
            tag: 'Iconic Goa Cruiser',
            type: 'Cruiser Motorcycle • Dual Disc ABS',
            transmission: '5-Speed Manual',
            fuel: 'Petrol • 36 km/l',
            pricePerDay: 850,
            securityDeposit: 500,
            freeKms: 'Unlimited Kms',
            extraKmCharge: 'None',
            availabilityStatus: '8 units available at Calangute & Baga beach hubs',
            image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80',
            rating: 4.95,
            tripsCount: 890
          },
          {
            id: 'bike-goa-2',
            name: 'Honda Activa 6G / Dio 125',
            category: 'bikes',
            tag: 'Easy Beach Hopping',
            type: 'Automatic Scooter • Underseat Storage',
            transmission: 'CVT Automatic',
            fuel: 'Petrol • 48 km/l',
            pricePerDay: 450,
            securityDeposit: 0,
            freeKms: 'Unlimited Kms',
            extraKmCharge: 'None',
            availabilityStatus: '15 units available across all North/South Goa hubs',
            image: 'https://images.unsplash.com/photo-1597687210367-a4915552d890?auto=format&fit=crop&w=600&q=80',
            rating: 4.75,
            tripsCount: 1250
          },
          {
            id: 'bike-goa-3',
            name: 'Yamaha Aerox 155 Liquid-Cooled',
            category: 'bikes',
            tag: 'Performance Maxi-Scooter',
            type: 'Maxi Scooter • ABS',
            transmission: 'Automatic',
            fuel: 'Petrol • 42 km/l',
            pricePerDay: 750,
            securityDeposit: 500,
            freeKms: 'Unlimited Kms',
            extraKmCharge: 'None',
            availabilityStatus: '2 units left in Panjim Central',
            image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=600&q=80',
            rating: 4.9,
            tripsCount: 180
          }
        ]
      };
    }

    // REGION B: HILLS / MANALI / SHIMLA / LADAKH / UTTARAKHAND
    if (loc.includes('manali') || loc.includes('shimla') || loc.includes('rishikesh') || loc.includes('ladakh') || loc.includes('kashmir')) {
      return {
        regionBadge: 'Himalayan Mountain Fleet',
        hubInfo: 'Hubs at Mall Road Manali, Bhuntar Airport & Dehradun Jolly Grant',
        cars: [
          {
            id: 'car-hill-1',
            name: 'Mahindra Scorpio-N 4x4 4XPLOR',
            category: 'cars',
            tag: 'High Altitude Snow & Terrain Master',
            type: 'Rugged 7-Seater 4WD SUV',
            transmission: '6-Speed Automatic',
            fuel: 'Diesel • 14 km/l',
            pricePerDay: 4500,
            securityDeposit: 2000,
            freeKms: '250 km/day included',
            extraKmCharge: '₹12/km',
            availabilityStatus: '2 units available in Old Manali with Snow Chains',
            image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80',
            rating: 4.95,
            tripsCount: 310
          },
          {
            id: 'car-hill-2',
            name: 'Toyota Fortuner 4x4 Sigma 4',
            category: 'cars',
            tag: 'Unmatched Hill Climbing Power',
            type: 'Full-size 7-Seater Premium SUV',
            transmission: 'Automatic 4x4',
            fuel: 'Diesel',
            pricePerDay: 6200,
            securityDeposit: 5000,
            freeKms: '300 km/day included',
            extraKmCharge: '₹18/km',
            availabilityStatus: '1 unit available at Chandigarh / Manali delivery',
            image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
            rating: 4.98,
            tripsCount: 195
          }
        ],
        bikes: [
          {
            id: 'bike-hill-1',
            name: 'Royal Enfield Himalayan 450 Adv',
            category: 'bikes',
            tag: 'Official Mountain Explorer',
            type: 'Adventure Tourer • TFT Tripper Navigation',
            transmission: '6-Speed with Slipper Clutch',
            fuel: 'Petrol • Dual ABS',
            pricePerDay: 1450,
            securityDeposit: 2000,
            freeKms: '250 km/day included',
            extraKmCharge: '₹8/km',
            availabilityStatus: '5 units available with Saddle Stays & USB Charger',
            image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=600&q=80',
            rating: 4.96,
            tripsCount: 640
          },
          {
            id: 'bike-hill-2',
            name: 'KTM 390 Adventure Spoke Wheel',
            category: 'bikes',
            tag: 'Rally Bred Agility',
            type: 'Off-Road Motorcycle • Traction Control',
            transmission: '6-Speed Quickshifter',
            fuel: 'Petrol',
            pricePerDay: 1650,
            securityDeposit: 2500,
            freeKms: '250 km/day included',
            extraKmCharge: '₹9/km',
            availabilityStatus: '2 units available in Mall Road Hub',
            image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80',
            rating: 4.9,
            tripsCount: 220
          }
        ]
      };
    }

    // REGION C: METROPOLITAN / GENERAL (Delhi, Mumbai, Bengaluru, Jaipur, etc.)
    return {
      regionBadge: `${vehiclePickupCity} Metro & Highway Fleet`,
      hubInfo: `Hubs located at ${vehiclePickupCity} Airport Terminal, Railway Station & Downtown`,
      cars: [
        {
          id: 'car-metro-1',
          name: 'Toyota Innova Crysta 2.4Z (7-Seater)',
          category: 'cars',
          tag: 'King of Highway Cruising',
          type: 'Premium MPV • 7 Captain Seats',
          transmission: 'Automatic',
          fuel: 'Diesel • 15 km/l',
          pricePerDay: 3600,
          securityDeposit: 0,
          freeKms: '300 km/day included',
          extraKmCharge: '₹11/km',
          availabilityStatus: `5 units ready for pickup at ${vehiclePickupCity} Airport Hub`,
          image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
          rating: 4.94,
          tripsCount: 780
        },
        {
          id: 'car-metro-2',
          name: 'Maruti Suzuki Swift Dzire ZXi+',
          category: 'cars',
          tag: 'Smart Economy Sedan',
          type: 'Compact Sedan • 5 Seats',
          transmission: 'Automatic (AGS)',
          fuel: 'Petrol • 22 km/l',
          pricePerDay: 1650,
          securityDeposit: 0,
          freeKms: '300 km/day included',
          extraKmCharge: '₹8/km',
          availabilityStatus: `8 units ready across ${vehiclePickupCity} metro stations`,
          image: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=600&q=80',
          rating: 4.79,
          tripsCount: 920
        },
        {
          id: 'car-metro-3',
          name: 'Tata Nexon EV Long Range',
          category: 'cars',
          tag: 'Green Urban Electric',
          type: 'Electric Compact SUV • 465 km Range',
          transmission: 'Automatic EV',
          fuel: 'Electric (Free Fast Charging included)',
          pricePerDay: 2800,
          securityDeposit: 0,
          freeKms: 'Unlimited City Kms',
          extraKmCharge: 'None',
          availabilityStatus: 'Keyless unlock via Bluetooth ready in 15 mins',
          image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80',
          rating: 4.88,
          tripsCount: 340
        }
      ],
      bikes: [
        {
          id: 'bike-metro-1',
          name: 'Royal Enfield Hunter 350 Dapper',
          category: 'bikes',
          tag: 'Urban Retro Roadster',
          type: 'Roadster Motorcycle • Dual ABS',
          transmission: '5-Speed Manual',
          fuel: 'Petrol • 38 km/l',
          pricePerDay: 800,
          securityDeposit: 500,
          freeKms: 'Unlimited Kms',
          extraKmCharge: 'None',
          availabilityStatus: `6 units available at ${vehiclePickupCity} Central`,
          image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80',
          rating: 4.9,
          tripsCount: 480
        },
        {
          id: 'bike-metro-2',
          name: 'Ather 450X Gen 3 Smart Electric',
          category: 'bikes',
          tag: 'Warp Mode High Speed EV',
          type: 'Smart EV Scooter • Touchscreen Google Maps',
          transmission: 'Automatic EV',
          fuel: 'Electric • 146 km Range',
          pricePerDay: 550,
          securityDeposit: 0,
          freeKms: 'Unlimited Kms',
          extraKmCharge: 'None',
          availabilityStatus: 'Available at all Ather Grid charging stations',
          image: 'https://images.unsplash.com/photo-1597687210367-a4915552d890?auto=format&fit=crop&w=600&q=80',
          rating: 4.86,
          tripsCount: 390
        }
      ]
    };
  }, [vehiclePickupCity]);

  /* ==========================================================================
     STAY & ATTRACTION DATA (Preserved and Harmonized)
     ========================================================================== */
  const [stayCityFilter, setStayCityFilter] = useState<string>('All');
  const [stayTypeFilter, setStayTypeFilter] = useState<string>('All');
  const [staySortBy, setStaySortBy] = useState<'price-asc' | 'price-desc' | 'rating'>('price-asc');
  const [stayMaxPrice, setStayMaxPrice] = useState<number>(25000);

  const rawAccommodations = [
    {
      id: 'st-1',
      name: 'Highway Star Express Motel & Suites',
      type: 'Motel',
      city: 'Delhi',
      location: 'Suburban Ring Road • Free Parking',
      pricePerNight: 1050,
      rating: 4.2,
      perks: ['Free Parking', '24/7 Check-in', 'Free Breakfast Snack'],
      tag: 'Cheapest Stay'
    },
    {
      id: 'st-2',
      name: 'Backpacker Central Pods & Hostel',
      type: 'Hostel / Budget Stay',
      city: 'Mumbai',
      location: 'Near Marine Lines • 200m to Station',
      pricePerNight: 1290,
      rating: 4.6,
      perks: ['Privacy Pods', 'Free High-Speed Wi-Fi', 'Keycard Access'],
      tag: 'Backpacker Choice'
    },
    {
      id: 'st-3',
      name: 'Colaba Heritage Boutique Hotel (4★)',
      type: 'Boutique Hotel',
      city: 'Mumbai',
      location: 'Near Gateway of India',
      pricePerNight: 4800,
      rating: 4.8,
      perks: ['Marble Bath', 'Complimentary Breakfast', 'Concierge Service'],
      tag: 'Prime Location'
    },
    {
      id: 'st-4',
      name: 'Taj Palace & Resort (5★ Luxury)',
      type: 'Luxury Resort',
      city: 'Delhi',
      location: 'Diplomatic Enclave',
      pricePerNight: 14500,
      rating: 4.95,
      perks: ['Fine Dining', 'Luxury Spa', 'Chauffeur Transfer'],
      tag: 'Ultra Luxury'
    }
  ];

  const processedStays = useMemo(() => {
    return rawAccommodations
      .filter((stay) => {
        if (stayCityFilter !== 'All' && stay.city !== stayCityFilter) return false;
        if (stay.pricePerNight > stayMaxPrice) return false;
        return true;
      })
      .sort((a, b) => {
        if (staySortBy === 'price-asc') return a.pricePerNight - b.pricePerNight;
        if (staySortBy === 'price-desc') return b.pricePerNight - a.pricePerNight;
        if (staySortBy === 'rating') return b.rating - a.rating;
        return a.pricePerNight - b.pricePerNight;
      });
  }, [stayCityFilter, staySortBy, stayMaxPrice]);

  /* ==========================================================================
     RESERVATION FLOW & CONFIRMATION
     ========================================================================== */
  const handleOpenReservation = (bookingType: string, itemData: any, extraMeta?: any) => {
    setActiveReservationModal({
      type: bookingType,
      item: itemData,
      passengers: 1,
      passengerName: 'Alex Morgan',
      contactEmail: 'alex@globetrotter.io',
      contactPhone: '+91 98765 43210',
      travelDate: itemData.date || activeTrip?.start_date || '2026-06-12',
      // IRCTC specific fields
      irctcUserId: 'alex_travels',
      berthPreference: 'Lower Berth (LB)',
      mealPreference: 'Veg Meal',
      seniorCitizen: false,
      travelInsurance: true,
      autoUpgradation: true,
      selectedClass: extraMeta?.selectedClass || itemData.classes?.[0]?.code || '3A',
      selectedClassName: extraMeta?.selectedClassName || itemData.classes?.[0]?.name || 'AC 3 Tier',
      // Flight specific
      flightFareType: extraMeta?.fareType || 'saver',
      flightSeatPref: 'Window Seat',
      // Vehicle specific
      pickupHub: itemData.availabilityStatus?.split('available in')?.[1]?.trim() || `${vehiclePickupCity} Airport Hub`,
      drivingLicenseNo: 'DL-0420190018429'
    });
  };

  const handleConfirmReservation = async () => {
    if (!activeReservationModal) return;
    setIsSubmittingBooking(true);

    const {
      type,
      item,
      passengerName,
      contactEmail,
      contactPhone,
      travelDate,
      passengers,
      selectedClass,
      selectedClassName,
      berthPreference,
      mealPreference,
      drivingLicenseNo,
      pickupHub,
      flightFareType,
      flightSeatPref
    } = activeReservationModal;

    let costTotal = 0;
    let titleStr = '';
    let subtitleStr = '';
    let bookingRef = '';
    let categoryLabel = '';
    const detailsMap: Record<string, string> = {
      'Primary Passenger': passengerName,
      'Contact Email': contactEmail,
      'Contact Phone': contactPhone,
      'Travel Date': travelDate,
    };

    if (type === 'train') {
      const clsObj = item.classes?.find((c: any) => c.code === selectedClass) || item.classes?.[0];
      const fare = clsObj ? clsObj.fare : (item.price || 1875);
      costTotal = fare * (passengers || 1);
      // Realistic 10-digit Indian Railways PNR
      bookingRef = `${Math.floor(200 + Math.random() * 800)}-${Math.floor(1000000 + Math.random() * 9000000)}`;
      titleStr = `${item.trainNo} / ${item.trainName}`;
      const coachLetter = selectedClass === '1A' ? 'H1' : selectedClass === '2A' ? 'A2' : selectedClass === '3E' ? 'M1' : selectedClass === 'SL' ? 'S4' : selectedClass === 'CC' ? 'C3' : selectedClass === 'EC' ? 'E1' : 'B3';
      const berthNo = Math.floor(1 + Math.random() * 72);
      subtitleStr = `Coach ${coachLetter}, Berth ${berthNo} (${berthPreference}) • ${selectedClass} Tier`;
      categoryLabel = 'IRCTC Indian Railways';
      detailsMap['PNR Number'] = bookingRef;
      detailsMap['Train Number & Name'] = `${item.trainNo} / ${item.trainName}`;
      detailsMap['Class & Quota'] = `${selectedClassName} (${selectedClass}) • ${irctcSearch.quota}`;
      detailsMap['Seat / Berth Status'] = `CNF (Confirmed) • Coach ${coachLetter}, Berth ${berthNo}`;
      detailsMap['Meal Preference'] = mealPreference;
      detailsMap['Charting Status'] = 'CHART NOT PREPARED';
      detailsMap['IRCTC Transaction ID'] = `TXN-${Math.floor(10000000 + Math.random() * 90000000)}`;
    } else if (type === 'flight') {
      const fareObj = item.fares?.[flightFareType] || item.fares?.saver;
      costTotal = (fareObj ? fareObj.price : item.price || 4850) * (passengers || 1);
      bookingRef = `6E-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      titleStr = `${item.airline} ${item.flightNo}`;
      subtitleStr = `${item.fromAirport} → ${item.toAirport} • ${flightSeatPref}`;
      categoryLabel = 'Domestic Airline';
      detailsMap['Airline PNR'] = bookingRef;
      detailsMap['Flight Route'] = `${item.fromCode} → ${item.toCode} (${item.duration})`;
      detailsMap['Baggage'] = fareObj?.baggage || '15 kg Check-in';
      detailsMap['Seat Allocation'] = `14F (${flightSeatPref})`;
      detailsMap['Terminal Gate'] = 'Terminal 3, Gate 14';
    } else if (type === 'bus') {
      costTotal = (item.singleSleeperFare || item.price || 1250) * (passengers || 1);
      bookingRef = `BUS-${Math.floor(100000 + Math.random() * 900000)}`;
      titleStr = `${item.operator} • ${item.vehicleModel}`;
      subtitleStr = `Berth L4 (Single Sleeper) • ${item.boardingPoint}`;
      categoryLabel = 'Intercity Bus';
      detailsMap['Bus Ticket Ref'] = bookingRef;
      detailsMap['Operator'] = item.operator;
      detailsMap['Boarding Point'] = item.boardingPoint;
      detailsMap['Dropping Point'] = item.droppingPoint;
      detailsMap['Emergency Contact'] = '+91 99887 76655';
    } else if (type === 'vehicle') {
      costTotal = item.pricePerDay || 2500;
      bookingRef = `VEH-${Math.floor(100000 + Math.random() * 900000)}`;
      titleStr = `${item.name} (${item.type})`;
      subtitleStr = `Pickup at ${pickupHub} • Plate Assigned`;
      categoryLabel = 'Rental Vehicle';
      detailsMap['Assigned Plate'] = `${vehiclePickupCity.substring(0, 2).toUpperCase()} 01 CZ ${Math.floor(1000 + Math.random() * 9000)}`;
      detailsMap['License Verified'] = drivingLicenseNo;
      detailsMap['Pickup Hub'] = pickupHub;
      detailsMap['Free Distance'] = item.freeKms || '250 km/day included';
      detailsMap['Security Deposit'] = `₹${item.securityDeposit || 0} (Refundable)`;
    } else {
      costTotal = item.pricePerNight || item.price || 1500;
      bookingRef = `STAY-${Math.floor(100000 + Math.random() * 900000)}`;
      titleStr = item.name;
      subtitleStr = `${item.location} • Confirmed Room`;
      categoryLabel = 'Hotel Stay';
      detailsMap['Booking Ref'] = bookingRef;
      detailsMap['Stay Category'] = item.type;
    }

    const newBooking: ConfirmedBooking = {
      id: 'BK-' + Math.floor(1000 + Math.random() * 9000),
      type: type as any,
      title: titleStr,
      subtitle: subtitleStr,
      bookingRef: bookingRef,
      travelDate: travelDate,
      origin: item.fromName || item.from || vehiclePickupCity,
      destination: item.toName || item.to || vehiclePickupCity,
      amount: costTotal,
      passengersOrGuests: `${passengers || 1} Traveler (${passengerName})`,
      status: 'Confirmed',
      categoryLabel: categoryLabel,
      details: detailsMap,
      qrData: `GT-${bookingRef}|${costTotal}|${travelDate}`
    };

    // If activeTrip exists and user checked "Add to Trip Expenses"
    if (activeTrip && addToTripExpensesChecked) {
      try {
        await api.addExpense(activeTrip.id, {
          title: `Booking: ${titleStr.substring(0, 45)}`,
          category: type === 'stay' ? 'stay' : 'transport',
          amount: costTotal,
          currency: 'INR',
          date: travelDate,
          paid_by: passengerName,
          notes: `Confirmed Ref: ${bookingRef}. Synced with travel concierge.`
        });
        const fresh = await api.getTrip(activeTrip.id);
        if (onTripUpdated) onTripUpdated(fresh.trip);
      } catch (e) {
        console.warn('Could not auto-add booking expense:', e);
      }
    }

    setConfirmedBookings(prev => [newBooking, ...prev]);
    setIsSubmittingBooking(false);
    setActiveReservationModal(null);
    setActiveTicketVoucher(newBooking);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header & Concierge Summary Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold mb-3 border border-sky-400/30">
              <Ticket className="w-3.5 h-3.5" />
              <span>Official Travel & Reservations Concierge</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-serif-heading tracking-tight text-white">
              Reservations & Bookings Hub
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Authentic multi-modal booking system: IRCTC Indian Railways ticketing with live seat availability, structured flight & bus reservations, and regionally optimized vehicle rentals.
            </p>
          </div>

          {/* Active Trip Selector / Sync Indicator */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 shrink-0 min-w-[260px]">
            <div className="text-[11px] uppercase tracking-wider text-amber-300 font-bold mb-1.5 flex items-center justify-between">
              <span>Target Trip Itinerary</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            {activeTrip ? (
              <div>
                <p className="text-sm font-bold text-white truncate max-w-[220px]">{activeTrip.name}</p>
                <div className="flex items-center space-x-2 text-xs text-slate-300 mt-1">
                  <MapPin className="w-3 h-3 text-sky-400" />
                  <span>{activeTrip.stops?.length || 0} destinations connected</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-300">No trip selected. Defaulting to major national transit hubs.</p>
            )}

            {trips.length > 1 && (
              <div className="mt-3 pt-2.5 border-t border-white/10">
                <select
                  value={activeTrip?.id || ''}
                  onChange={(e) => {
                    const found = trips.find(t => t.id === Number(e.target.value));
                    if (found) onSelectTrip(found);
                  }}
                  className="w-full text-xs bg-slate-900/80 text-white rounded-lg px-2.5 py-1.5 border border-white/20 focus:outline-none"
                >
                  {trips.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Primary Sub-section Navigation Tabs */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap gap-2 sm:gap-3">
          <button
            onClick={() => setActiveSubSection('travel')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeSubSection === 'travel'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30 ring-2 ring-sky-300'
                : 'bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white'
            }`}
          >
            <Train className="w-4 h-4" />
            <span>1. Transit & Bookings</span>
          </button>

          <button
            onClick={() => setActiveSubSection('stay')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeSubSection === 'stay'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 ring-2 ring-amber-300 font-extrabold'
                : 'bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white'
            }`}
          >
            <Hotel className="w-4 h-4" />
            <span>2. Stays & Lodging</span>
          </button>

          <button
            onClick={() => setActiveSubSection('my-bookings')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeSubSection === 'my-bookings'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-300'
                : 'bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>3. Confirmed Vouchers ({confirmedBookings.length})</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="ml-auto px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 hover:brightness-105 transition-all flex items-center space-x-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-indigo-950" />
            <span>Import Booking / Voucher (AI Parser)</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          SUB-SECTION 1: TRAVELLING TRANSIT MODES (Train, Bus, Flight, Car/Bike)
          ========================================================================= */}
      {activeSubSection === 'travel' && (
        <div className="space-y-6">
          {/* Sub-tabs for the 4 travel transit modes */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5 flex-1">
              <button
                onClick={() => setTravelTab('train')}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  travelTab === 'train'
                    ? 'bg-sky-700 text-white shadow-sm ring-1 ring-sky-500'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Train className="w-4 h-4 text-amber-300" />
                <span>IRCTC Train Bookings</span>
              </button>

              <button
                onClick={() => setTravelTab('flight')}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  travelTab === 'flight'
                    ? 'bg-sky-700 text-white shadow-sm ring-1 ring-sky-500'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Plane className="w-4 h-4 text-sky-300" />
                <span>Flight Bookings</span>
              </button>

              <button
                onClick={() => setTravelTab('bus')}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  travelTab === 'bus'
                    ? 'bg-sky-700 text-white shadow-sm ring-1 ring-sky-500'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Bus className="w-4 h-4 text-emerald-300" />
                <span>Bus Bookings</span>
              </button>

              <button
                onClick={() => setTravelTab('vehicle')}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  travelTab === 'vehicle'
                    ? 'bg-sky-700 text-white shadow-sm ring-1 ring-sky-500'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Car className="w-4 h-4 text-amber-300" />
                <span>Regional Car / Bike Rentals</span>
              </button>
            </div>

            {travelTab === 'vehicle' && (
              <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 shrink-0">
                <button
                  onClick={() => setVehicleType('cars')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    vehicleType === 'cars' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Cars & SUVs
                </button>
                <button
                  onClick={() => setVehicleType('bikes')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    vehicleType === 'bikes' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Bikes & Scooters
                </button>
              </div>
            )}
          </div>

          {/* =========================================================================
              1. OFFICIAL IRCTC TICKET BOOKING SYSTEM SIMULATION
              ========================================================================= */}
          {travelTab === 'train' && (
            <div className="space-y-6">
              {/* IRCTC Branding & PNR Quick Status Bar */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0b2545] to-[#134074] text-white border border-[#134074] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                    <Train className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-sm tracking-wide text-white uppercase">IRCTC e-Ticketing System</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
                        Live CRIS Feed
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Official Indian Railways seat availability, quota reservation & instant PNR generation
                    </p>
                  </div>
                </div>

                {/* PNR Status Lookup Widget */}
                <form onSubmit={handleCheckPnr} className="flex items-center space-x-2 bg-white/10 backdrop-blur-md p-1.5 rounded-xl border border-white/20">
                  <input
                    type="text"
                    value={pnrSearchInput}
                    onChange={(e) => setPnrSearchInput(e.target.value)}
                    placeholder="Enter 10-Digit PNR..."
                    className="px-3 py-1 bg-transparent text-xs text-white placeholder:text-slate-300 focus:outline-none w-44 font-mono font-bold"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Check PNR
                  </button>
                </form>
              </div>

              {/* PNR Result Popover if queried */}
              {pnrSearchResult && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-slate-900 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 flex items-center space-x-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>PNR Query Result for: <strong className="font-mono">{pnrSearchResult.pnr}</strong></span>
                    </span>
                    <button
                      onClick={() => setPnrSearchResult(null)}
                      className="text-xs text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                    <div><span className="text-slate-500 block text-[10px]">Train</span><strong>{pnrSearchResult.trainNo}</strong></div>
                    <div><span className="text-slate-500 block text-[10px]">Date</span><strong>{pnrSearchResult.dateOfJourney}</strong></div>
                    <div><span className="text-slate-500 block text-[10px]">Class & Quota</span><strong>{pnrSearchResult.className} ({pnrSearchResult.quota})</strong></div>
                    <div><span className="text-slate-500 block text-[10px]">Status</span><span className="text-emerald-700 font-extrabold">{pnrSearchResult.passengers[0]?.currentStatus}</span></div>
                  </div>
                </div>
              )}

              {/* IRCTC Search Form */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-end">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      From Station / City
                    </label>
                    <input
                      type="text"
                      value={irctcSearch.from}
                      onChange={(e) => setIrctcSearch({ ...irctcSearch, from: e.target.value })}
                      placeholder="e.g. New Delhi (NDLS)"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700 uppercase">To Station / City</label>
                      <button
                        type="button"
                        onClick={handleSwapTrainStations}
                        className="text-[10px] text-sky-600 hover:text-sky-800 font-bold flex items-center space-x-0.5 cursor-pointer"
                        title="Swap stations"
                      >
                        <ArrowLeftRight className="w-3 h-3" />
                        <span>Swap</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={irctcSearch.to}
                      onChange={(e) => setIrctcSearch({ ...irctcSearch, to: e.target.value })}
                      placeholder="e.g. Mumbai Central (MMCT)"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Date of Journey</label>
                    <input
                      type="date"
                      value={irctcSearch.date}
                      onChange={(e) => setIrctcSearch({ ...irctcSearch, date: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Quota Selection</label>
                    <select
                      value={irctcSearch.quota}
                      onChange={(e) => setIrctcSearch({ ...irctcSearch, quota: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    >
                      <option value="GN">GENERAL (GN)</option>
                      <option value="TQ">TATKAL (TQ)</option>
                      <option value="PT">PREMIUM TATKAL (PT)</option>
                      <option value="LD">LADIES (LD)</option>
                      <option value="SS">LOWER BERTH / SR. CITIZEN (SS)</option>
                    </select>
                  </div>

                  <div>
                    <button
                      type="button"
                      className="w-full py-2.5 px-4 bg-[#0b2545] hover:bg-[#134074] text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5 text-amber-400" />
                      <span>Search Trains</span>
                    </button>
                  </div>
                </div>

                {/* Quick Station Badges */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-[10px]">
                  <span className="text-slate-400 font-semibold">Popular Junctions:</span>
                  {IRCTC_STATIONS.slice(0, 8).map(st => (
                    <button
                      key={st.code}
                      onClick={() => setIrctcSearch(prev => ({ ...prev, to: `${st.name} (${st.code})` }))}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer font-medium"
                    >
                      {st.city} ({st.code})
                    </button>
                  ))}
                </div>
              </div>

              {/* Trains Search Results List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-600 font-medium px-1">
                  <span>
                    Trains on route: <strong>{irctcSearch.from} → {irctcSearch.to}</strong> on <strong>{irctcSearch.date}</strong>
                  </span>
                  <span className="text-emerald-700 font-bold flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Live IRCTC Seat Matrix</span>
                  </span>
                </div>

                {irctcTrainsList.map((train) => {
                  const chosenClassCode = selectedTrainClassMap[train.id] || train.classes[0].code;
                  const chosenClassObj = train.classes.find(c => c.code === chosenClassCode) || train.classes[0];

                  return (
                    <div
                      key={train.id}
                      className="bg-white rounded-3xl p-5 border border-slate-200 hover:border-sky-400 transition-all shadow-sm hover:shadow-md space-y-4"
                    >
                      {/* Train Header: No, Name, Type, Runs on */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                        <div className="flex items-center space-x-2.5">
                          <span className="px-2.5 py-1 rounded-lg bg-[#0b2545] text-amber-300 font-mono font-black text-xs tracking-wider">
                            {train.trainNo}
                          </span>
                          <div>
                            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                              {train.trainName}
                            </h3>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {train.trainType} • Halts: {train.haltsCount} • {train.distanceKm} km
                            </span>
                          </div>
                        </div>

                        {/* Runs on week schedule indicator */}
                        <div className="flex items-center space-x-1 text-[10px]">
                          <span className="text-slate-500 font-semibold mr-1">Runs On:</span>
                          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                            <span
                              key={idx}
                              className={`w-5 h-5 rounded-full flex items-center justify-center font-bold ${
                                train.runsOn[idx]
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-slate-300'
                              }`}
                            >
                              {day}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Train Timings & Duration */}
                      <div className="flex items-center justify-between sm:justify-start sm:space-x-10 text-xs py-1">
                        <div>
                          <p className="text-xl font-black text-slate-900 font-mono">{train.departTime}</p>
                          <p className="text-xs font-bold text-slate-800">{train.fromStation}</p>
                          <p className="text-[11px] text-slate-500">{train.fromName}</p>
                        </div>

                        <div className="flex flex-col items-center">
                          <span className="text-[10px] text-slate-500 font-semibold">{train.duration}</span>
                          <div className="w-24 sm:w-32 h-0.5 bg-slate-300 relative my-1">
                            <div className="w-2 h-2 rounded-full bg-[#0b2545] absolute -top-0.75 right-0" />
                          </div>
                          <span className="text-[10px] text-emerald-700 font-bold">{train.punctuality}</span>
                        </div>

                        <div>
                          <p className="text-xl font-black text-slate-900 font-mono">{train.arriveTime}</p>
                          <p className="text-xs font-bold text-slate-800">{train.toStation}</p>
                          <p className="text-[11px] text-slate-500">{train.toName}</p>
                        </div>
                      </div>

                      {/* IRCTC Class Options Grid with Live Availability Statuses */}
                      <div>
                        <div className="text-[11px] font-bold text-slate-700 mb-2 flex items-center justify-between">
                          <span>Select Travel Class:</span>
                          <span className="text-[10px] text-slate-400">Quota: {irctcSearch.quota}</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5">
                          {train.classes.map((cls) => {
                            const isSelected = chosenClassCode === cls.code;
                            return (
                              <button
                                key={cls.code}
                                type="button"
                                onClick={() =>
                                  setSelectedTrainClassMap(prev => ({ ...prev, [train.id]: cls.code }))
                                }
                                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
                                  isSelected
                                    ? 'border-sky-600 bg-sky-50/70 shadow-xs ring-2 ring-sky-500/20'
                                    : 'border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-slate-100/70'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-mono font-black text-xs text-slate-900">{cls.code}</span>
                                  <span className="font-extrabold text-xs text-slate-900">₹{cls.fare.toLocaleString('en-IN')}</span>
                                </div>
                                <p className="text-[10px] text-slate-500 font-medium truncate">{cls.name}</p>

                                <div className="mt-2 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                                  <span
                                    className={`text-[10px] font-extrabold ${
                                      cls.statusType === 'avail'
                                        ? 'text-emerald-700'
                                        : cls.statusType === 'rac'
                                        ? 'text-amber-700'
                                        : 'text-rose-700'
                                    }`}
                                  >
                                    {cls.status}
                                  </span>
                                  <span className="text-[9px] text-slate-400">{cls.updateMins}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Book Action Footer */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="text-xs">
                          <span className="text-slate-500">Selected Class: </span>
                          <strong className="text-slate-900">{chosenClassObj.name} ({chosenClassCode})</strong>
                          <span className="text-slate-400 font-medium"> • ₹{chosenClassObj.fare.toLocaleString('en-IN')} (incl. GST)</span>
                        </div>

                        <button
                          onClick={() => handleOpenReservation('train', train, {
                            selectedClass: chosenClassCode,
                            selectedClassName: chosenClassObj.name
                          })}
                          className="px-5 py-2.5 bg-[#0b2545] hover:bg-[#134074] text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center space-x-1.5 cursor-pointer"
                        >
                          <span>Book IRCTC Ticket</span>
                          <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =========================================================================
              2. FLIGHT BOOKINGS (Structured Multi-Option Interface)
              ========================================================================= */}
          {travelTab === 'flight' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-end">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Origin Airport</label>
                  <input
                    type="text"
                    value={flightSearch.from}
                    onChange={(e) => setFlightSearch({ ...flightSearch, from: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Destination Airport</label>
                  <input
                    type="text"
                    value={flightSearch.to}
                    onChange={(e) => setFlightSearch({ ...flightSearch, to: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Departure Date</label>
                  <input
                    type="date"
                    value={flightSearch.date}
                    onChange={(e) => setFlightSearch({ ...flightSearch, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <button className="w-full py-2.5 px-4 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center space-x-1.5 cursor-pointer">
                    <Search className="w-3.5 h-3.5" />
                    <span>Search Flights</span>
                  </button>
                </div>
              </div>

              {/* Flights List with Multi-Fare Cards */}
              <div className="space-y-4">
                {flightRoutes.map((flight) => (
                  <div key={flight.id} className="bg-white rounded-3xl p-5 border border-slate-200 hover:border-sky-400 transition-all shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-black text-sm border border-sky-100">
                          ✈️
                        </div>
                        <div>
                          <h3 className="text-base font-extrabold text-slate-900">{flight.airline}</h3>
                          <span className="text-xs font-mono font-bold text-slate-500">{flight.flightNo} • {flight.onTimeScore}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6 text-xs text-slate-600">
                        <div>
                          <p className="text-lg font-black text-slate-900 font-mono">{flight.departTime}</p>
                          <p className="text-[11px] text-slate-500">{flight.fromCode} ({flight.fromAirport})</p>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] text-slate-500 font-semibold">{flight.duration}</span>
                          <div className="w-20 h-0.5 bg-slate-300 relative my-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-sky-600 absolute -top-0.5 right-0" />
                          </div>
                          <span className="text-[10px] text-emerald-600 font-bold">{flight.stops}</span>
                        </div>
                        <div>
                          <p className="text-lg font-black text-slate-900 font-mono">{flight.arriveTime}</p>
                          <p className="text-[11px] text-slate-500">{flight.toCode} ({flight.toAirport})</p>
                        </div>
                      </div>
                    </div>

                    {/* Multi-Tier Fares (Saver, Flexi Plus, Super 6E) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-slate-900 uppercase">Saver Fare</span>
                            <span className="text-sm font-extrabold text-slate-900">₹{flight.fares.saver.price.toLocaleString('en-IN')}</span>
                          </div>
                          <p className="text-[10px] text-slate-500">{flight.fares.saver.baggage}</p>
                          <span className="text-[10px] text-amber-700 font-bold block mt-1">{flight.fares.saver.seats} seats remaining</span>
                        </div>
                        <button
                          onClick={() => handleOpenReservation('flight', flight, { fareType: 'saver' })}
                          className="mt-3 w-full py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          Select Saver
                        </button>
                      </div>

                      <div className="p-3 rounded-2xl bg-sky-50/60 border border-sky-200 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-sky-900 uppercase">Flexi Plus</span>
                            <span className="text-sm font-extrabold text-sky-900">₹{flight.fares.flexi.price.toLocaleString('en-IN')}</span>
                          </div>
                          <p className="text-[10px] text-slate-600 font-medium">Free Seat + Free Hot Meal + Date Change</p>
                          <span className="text-[10px] text-emerald-700 font-bold block mt-1">Instant Confirmation</span>
                        </div>
                        <button
                          onClick={() => handleOpenReservation('flight', flight, { fareType: 'flexi' })}
                          className="mt-3 w-full py-1.5 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          Select Flexi Plus
                        </button>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-slate-900 uppercase">Business / 6E</span>
                            <span className="text-sm font-extrabold text-slate-900">₹{flight.fares.super6E.price.toLocaleString('en-IN')}</span>
                          </div>
                          <p className="text-[10px] text-slate-500">{flight.fares.super6E.baggage}</p>
                          <span className="text-[10px] text-purple-700 font-bold block mt-1">Priority Fast Track</span>
                        </div>
                        <button
                          onClick={() => handleOpenReservation('flight', flight, { fareType: 'super6E' })}
                          className="mt-3 w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          Select Premium
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================================
              3. BUS BOOKINGS (Structured Interface with Berth Map & Operator Timings)
              ========================================================================= */}
          {travelTab === 'bus' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-end">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">From City</label>
                  <input
                    type="text"
                    value={busSearch.from}
                    onChange={(e) => setBusSearch({ ...busSearch, from: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">To City</label>
                  <input
                    type="text"
                    value={busSearch.to}
                    onChange={(e) => setBusSearch({ ...busSearch, to: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Date of Journey</label>
                  <input
                    type="date"
                    value={busSearch.date}
                    onChange={(e) => setBusSearch({ ...busSearch, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <button className="w-full py-2.5 px-4 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center space-x-1.5 cursor-pointer">
                    <Search className="w-3.5 h-3.5" />
                    <span>Search Buses</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {busRoutes.map((bus) => (
                  <div key={bus.id} className="bg-white rounded-3xl p-5 border border-slate-200 hover:border-sky-400 transition-all shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-base font-extrabold text-slate-900">{bus.operator}</h3>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200 flex items-center space-x-1">
                            <Star className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                            <span>{bus.rating} ({bus.reviewCount})</span>
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">{bus.vehicleModel}</p>
                      </div>

                      <div className="flex items-center space-x-6 text-xs text-slate-600">
                        <div>
                          <p className="text-lg font-black text-slate-900 font-mono">{bus.departTime}</p>
                          <p className="text-[11px] text-slate-500 truncate max-w-[140px]">{bus.boardingPoint}</p>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] text-slate-500 font-semibold">{bus.duration}</span>
                          <div className="w-20 h-0.5 bg-slate-300 relative my-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-sky-600 absolute -top-0.5 right-0" />
                          </div>
                        </div>
                        <div>
                          <p className="text-lg font-black text-slate-900 font-mono">{bus.arriveTime}</p>
                          <p className="text-[11px] text-slate-500 truncate max-w-[140px]">{bus.droppingPoint}</p>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Berth & Amenities Bar */}
                    <div className="flex flex-wrap gap-1.5 text-[10px] pt-1">
                      {bus.amenities.map((am, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                          ✓ {am}
                        </span>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-amber-700 font-bold block">{bus.berthsAvailable} berths left</span>
                        <span className="text-lg font-black text-slate-900">₹{bus.singleSleeperFare.toLocaleString('en-IN')}</span>
                        <span className="text-[10px] text-slate-500"> / single sleeper</span>
                      </div>

                      <button
                        onClick={() => handleOpenReservation('bus', bus)}
                        className="px-5 py-2.5 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                      >
                        Select Berths & Book →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================================
              4. REGIONAL VEHICLE RENTALS (Real-Time Regional Availability)
              ========================================================================= */}
          {travelTab === 'vehicle' && (
            <div className="space-y-6">
              {/* Regional Hub Selector Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-sky-500/10 to-indigo-500/10 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                      {regionalVehicleFleet.regionBadge}
                    </span>
                    <span className="text-xs font-extrabold text-slate-900">Real-Time Regional Fleet</span>
                  </div>
                  <p className="text-xs text-slate-600">{regionalVehicleFleet.hubInfo}</p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <label className="text-xs font-bold text-slate-700 shrink-0">Destination Hub:</label>
                  <select
                    value={vehiclePickupCity}
                    onChange={(e) => setVehiclePickupCity(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none shadow-2xs"
                  >
                    <option value="Goa">Goa (Coastal & Beaches)</option>
                    <option value="Manali">Manali / Himachal (Mountains & Snow)</option>
                    <option value="Delhi">Delhi / NCR (North Hubs)</option>
                    <option value="Bengaluru">Bengaluru (South Tech & Hills)</option>
                    <option value="Mumbai">Mumbai (Coastal Metropolis)</option>
                    <option value="Jaipur">Jaipur (Rajasthan Heritage)</option>
                  </select>
                </div>
              </div>

              {/* Regional Vehicle Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {(vehicleType === 'cars' ? regionalVehicleFleet.cars : regionalVehicleFleet.bikes).map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative h-44 bg-slate-100 overflow-hidden">
                        <img
                          src={vehicle.image}
                          alt={vehicle.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-3 left-3 px-2.5 py-1 bg-slate-900/80 backdrop-blur-md rounded-lg text-white text-[10px] font-bold">
                          {vehicle.type}
                        </div>
                        <div className="absolute top-3 right-3 px-2 py-1 bg-amber-400 text-slate-950 rounded-lg text-[10px] font-bold flex items-center space-x-1 shadow-sm">
                          <Star className="w-3 h-3 fill-slate-950" />
                          <span>{vehicle.rating}</span>
                        </div>
                      </div>

                      <div className="p-4 space-y-2.5">
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-bold inline-block">
                          {vehicle.tag}
                        </span>
                        <h4 className="text-base font-extrabold text-slate-900 leading-snug">{vehicle.name}</h4>

                        <div className="flex items-center space-x-3 text-xs text-slate-500 font-medium">
                          <span>{vehicle.transmission}</span>
                          <span>•</span>
                          <span>{vehicle.fuel}</span>
                        </div>

                        {/* Regional Availability Status Badge */}
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold flex items-center space-x-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{vehicle.availabilityStatus}</span>
                        </div>

                        <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px] text-slate-600">
                          <p>✓ {vehicle.freeKms} • Extra: {vehicle.extraKmCharge}</p>
                          <p>✓ Security Deposit: ₹{vehicle.securityDeposit} (Zero-deductible available)</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 pt-2 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Daily Tariff</span>
                        <span className="text-xl font-black text-slate-900">
                          ₹{vehicle.pricePerDay.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium"> / day</span>
                      </div>

                      <button
                        onClick={() => handleOpenReservation('vehicle', vehicle)}
                        className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                      >
                        Reserve Now →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          SUB-SECTION 2: STAY / ACCOMMODATION (SORTED CHEAPEST TO MOST EXPENSIVE)
          ========================================================================= */}
      {activeSubSection === 'stay' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Verified Accommodations</h3>
              <p className="text-xs text-slate-500">
                Sorted automatically from <strong className="text-emerald-700">cheapest to most luxury</strong> rates.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-semibold">Destination:</span>
              <select
                value={stayCityFilter}
                onChange={(e) => setStayCityFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              >
                <option value="All">All Cities</option>
                <option value="Delhi">Delhi</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Goa">Goa</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {processedStays.map((st) => (
              <div key={st.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-between space-y-3">
                <div>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                    {st.tag}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-2">{st.name}</h4>
                  <p className="text-xs text-slate-500">{st.location}</p>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-base font-black text-slate-900">₹{st.pricePerNight.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-slate-400"> / night</span>
                  </div>
                  <button
                    onClick={() => handleOpenReservation('stay', st)}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold"
                  >
                    Reserve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-SECTION 3: MY CONFIRMED BOOKINGS
          ========================================================================= */}
      {activeSubSection === 'my-bookings' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Active Bookings & Electronic Passes</h3>
              <p className="text-xs text-slate-500">Access your official IRCTC ticket slips, airline boarding passes, and rental vouchers</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              {confirmedBookings.length} Confirmed
            </span>
          </div>

          {confirmedBookings.map((b) => (
            <div key={b.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#0b2545] text-amber-300 flex items-center justify-center shrink-0">
                  {b.type === 'train' && <Train className="w-6 h-6" />}
                  {b.type === 'flight' && <Plane className="w-6 h-6" />}
                  {b.type === 'bus' && <Bus className="w-6 h-6" />}
                  {b.type === 'vehicle' && <Car className="w-6 h-6" />}
                  {b.type === 'stay' && <Hotel className="w-6 h-6" />}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                      {b.status}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-700">Ref: {b.bookingRef}</span>
                    <span className="text-xs text-slate-400">• {b.categoryLabel}</span>
                  </div>
                  <h4 className="text-base font-extrabold text-slate-900 mt-1">{b.title}</h4>
                  <p className="text-xs text-slate-500">{b.subtitle}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Date: {b.travelDate} • {b.passengersOrGuests}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 border-t md:border-t-0 pt-3 md:pt-0">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Amount Paid</span>
                  <span className="text-lg font-black text-slate-900">₹{b.amount.toLocaleString('en-IN')}</span>
                </div>
                <button
                  onClick={() => setActiveTicketVoucher(b)}
                  className="px-4 py-2 bg-[#0b2545] hover:bg-[#134074] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5 text-amber-300" />
                  <span>View Pass</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =========================================================================
          RESERVATION CHECKOUT MODAL (Detailed IRCTC / Airline / Vehicle Flow)
          ========================================================================= */}
      {activeReservationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-[#0b2545] to-[#134074] text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-amber-300 block">
                  {activeReservationModal.type === 'train' ? 'IRCTC Electronic Reservation Checkout' : 'Express Booking Gateway'}
                </span>
                <h3 className="text-base font-extrabold tracking-tight">
                  {activeReservationModal.item.trainName || activeReservationModal.item.name || activeReservationModal.item.airline || activeReservationModal.item.operator}
                </h3>
              </div>
              <button
                onClick={() => setActiveReservationModal(null)}
                className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Summary Card */}
              <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block text-[10px]">Booking For</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {activeReservationModal.type === 'train'
                      ? `${activeReservationModal.selectedClassName} (${activeReservationModal.selectedClass}) • ${irctcSearch.quota}`
                      : activeReservationModal.type === 'flight'
                      ? `${activeReservationModal.item.airline} (${activeReservationModal.flightFareType.toUpperCase()})`
                      : activeReservationModal.item.name}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[10px]">Travel Date</span>
                  <span className="font-bold text-slate-800">{activeReservationModal.travelDate}</span>
                </div>
              </div>

              {/* IRCTC USER ID VERIFICATION (If train) */}
              {activeReservationModal.type === 'train' && (
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">IRCTC User ID Verification *</label>
                    <span className="text-emerald-700 font-extrabold text-[10px] flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>CRIS Account Verified</span>
                    </span>
                  </div>
                  <input
                    type="text"
                    value={activeReservationModal.irctcUserId}
                    onChange={(e) => setActiveReservationModal({ ...activeReservationModal, irctcUserId: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800"
                  />
                </div>
              )}

              {/* PASSENGER DETAILS FORM */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Primary Passenger Name *</label>
                  <input
                    type="text"
                    value={activeReservationModal.passengerName}
                    onChange={(e) => setActiveReservationModal({ ...activeReservationModal, passengerName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Contact Email</label>
                    <input
                      type="email"
                      value={activeReservationModal.contactEmail}
                      onChange={(e) => setActiveReservationModal({ ...activeReservationModal, contactEmail: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mobile (for SMS & PNR alerts)</label>
                    <input
                      type="text"
                      value={activeReservationModal.contactPhone}
                      onChange={(e) => setActiveReservationModal({ ...activeReservationModal, contactPhone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    />
                  </div>
                </div>

                {/* Train Specific: Berth & Meal Choices */}
                {activeReservationModal.type === 'train' && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Berth Preference</label>
                      <select
                        value={activeReservationModal.berthPreference}
                        onChange={(e) => setActiveReservationModal({ ...activeReservationModal, berthPreference: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                      >
                        <option>Lower Berth (LB)</option>
                        <option>Middle Berth (MB)</option>
                        <option>Upper Berth (UB)</option>
                        <option>Side Lower (SL)</option>
                        <option>Side Upper (SU)</option>
                        <option>No Preference</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Food / Catering Choice</label>
                      <select
                        value={activeReservationModal.mealPreference}
                        onChange={(e) => setActiveReservationModal({ ...activeReservationModal, mealPreference: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                      >
                        <option>Veg Meal</option>
                        <option>Non-Veg Meal</option>
                        <option>Jain Meal</option>
                        <option>No Food Required</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Flight Specific: Seat Preference */}
                {activeReservationModal.type === 'flight' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Seat Preference</label>
                    <select
                      value={activeReservationModal.flightSeatPref}
                      onChange={(e) => setActiveReservationModal({ ...activeReservationModal, flightSeatPref: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    >
                      <option>Window Seat</option>
                      <option>Aisle Seat</option>
                      <option>Extra Legroom (Front Row)</option>
                    </select>
                  </div>
                )}

                {/* Vehicle Specific: Driving License & Pickup Hub */}
                {activeReservationModal.type === 'vehicle' && (
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Driving License Number *</label>
                      <input
                        type="text"
                        value={activeReservationModal.drivingLicenseNo}
                        onChange={(e) => setActiveReservationModal({ ...activeReservationModal, drivingLicenseNo: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800"
                      />
                      <span className="text-[10px] text-emerald-600 font-bold block mt-1">✓ Instant DL check passed with Sarathi Parivahan</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Pickup Hub</label>
                      <input
                        type="text"
                        value={activeReservationModal.pickupHub}
                        onChange={(e) => setActiveReservationModal({ ...activeReservationModal, pickupHub: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                      />
                    </div>
                  </div>
                )}

                {/* Sync to Trip Expenses Checkbox */}
                {activeTrip && (
                  <div className="pt-2">
                    <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={addToTripExpensesChecked}
                        onChange={(e) => setAddToTripExpensesChecked(e.target.checked)}
                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                      <span>Auto-record this fare into '{activeTrip.name}' budget & expenses</span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Fare</span>
                <span className="text-xl font-black text-slate-900">
                  ₹{(
                    activeReservationModal.type === 'train'
                      ? (activeReservationModal.item.classes?.find((c: any) => c.code === activeReservationModal.selectedClass)?.fare || 1875)
                      : activeReservationModal.type === 'flight'
                      ? (activeReservationModal.item.fares?.[activeReservationModal.flightFareType]?.price || 4850)
                      : activeReservationModal.item.pricePerDay || activeReservationModal.item.pricePerNight || activeReservationModal.item.singleSleeperFare || 2500
                  ).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveReservationModal(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  disabled={isSubmittingBooking}
                  onClick={handleConfirmReservation}
                  className="px-5 py-2.5 bg-[#0b2545] hover:bg-[#134074] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingBooking ? 'Issuing Ticket...' : 'Confirm & Generate Ticket →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          DIGITAL E-TICKET & IRCTC ERS PASS PREVIEW MODAL
          ========================================================================= */}
      {activeTicketVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[92vh] flex flex-col">
            {/* Header with Railway / Booking styling */}
            <div className="bg-gradient-to-r from-[#0b2545] to-[#134074] p-5 text-white text-center relative shrink-0">
              <button
                onClick={() => setActiveTicketVoucher(null)}
                className="absolute top-4 right-4 p-1 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>

              <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-amber-300 block">
                {activeTicketVoucher.type === 'train' ? 'IRCTC Electronic Reservation Slip (ERS)' : 'Verified Booking Voucher'}
              </span>
              <h3 className="text-lg font-black font-serif-heading mt-0.5">
                {activeTicketVoucher.title}
              </h3>
              <p className="text-xs text-white/80 mt-0.5">
                PNR / Reference: <strong className="font-mono text-amber-300">{activeTicketVoucher.bookingRef}</strong>
              </p>
            </div>

            {/* Ticket Slip Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Status</span>
                  <span className="text-emerald-700 font-black flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    <span>CNF / Confirmed</span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Travel Date</span>
                  <span className="text-slate-900 font-bold">{activeTicketVoucher.travelDate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Primary Traveler</span>
                  <span className="text-slate-900 font-bold">{activeTicketVoucher.passengersOrGuests}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Amount Paid</span>
                  <span className="text-slate-900 font-black text-sm">
                    ₹{activeTicketVoucher.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Key Details Grid */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                {Object.entries(activeTicketVoucher.details).map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">{k}:</span>
                    <strong className="text-slate-900 font-mono text-right truncate max-w-[220px]">{v}</strong>
                  </div>
                ))}
              </div>

              {/* Dynamic QR Code */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col items-center justify-center space-y-2 text-center">
                <div className="w-28 h-28 bg-white p-2 rounded-xl shadow-inner border border-slate-300 flex items-center justify-center">
                  <QrCode className="w-24 h-24 text-slate-900" />
                </div>
                <p className="text-[10px] font-mono text-slate-500">
                  SCAN FOR TTE / CONDUCTOR VERIFICATION • REF #{activeTicketVoucher.bookingRef}
                </p>
              </div>

              <div className="text-[11px] text-slate-500 text-center">
                Valid photo identity card (Aadhaar / Voter ID / Passport / Driving License) required during journey.
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center space-x-2 shrink-0">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 px-3 bg-[#0b2545] hover:bg-[#134074] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-amber-300" />
                <span>Print / Download E-Ticket</span>
              </button>
              <button
                onClick={() => setActiveTicketVoucher(null)}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Booking Import Modal */}
      <BookingImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        activeTrip={activeTrip}
        onBookingSaved={(freshTrip) => {
          if (onTripUpdated) onTripUpdated(freshTrip);
        }}
      />
    </div>
  );
};
