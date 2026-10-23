import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Calendar,
  IndianRupee,
  Image as ImageIcon,
  Sparkles,
  Check,
  AlertCircle,
  Globe,
  MapPin,
  Navigation,
  PlaneTakeoff,
  Calculator,
  Building,
  Ticket,
  ArrowRight,
  LocateFixed,
  Train,
  Car,
  Compass,
  Plus,
  Minus,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { Trip } from '../types/travel';
import { api } from '../lib/api';
import { GLOBE_CITIES, GlobeCity } from '../data/globeCities';

interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTripCreated: (trip: Trip) => void;
  tripToEdit?: Trip | null;
}

const PRESET_COVERS = [
  { label: 'European Architecture', url: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Tokyo Skyline & Mount Fuji', url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Italian Coastal Village', url: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Swiss Alpine Panorama', url: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Tropical Island Paradise', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80' },
  { label: 'New York City Lights', url: 'https://images.unsplash.com/photo-1485872299829-c673f5194813?auto=format&fit=crop&w=1200&q=80' },
];

// Comprehensive city coordinates & tier registry for accurate distance & cost calculation
interface CityGeoInfo {
  name: string;
  country: string;
  lat: number;
  lng: number;
  tier: 'luxury' | 'western_high' | 'moderate' | 'budget_intl' | 'domestic_india';
}

const CITY_COORDINATES: Record<string, CityGeoInfo> = {
  // Indian Cities
  'new delhi': { name: 'New Delhi', country: 'India', lat: 28.6139, lng: 77.2090, tier: 'domestic_india' },
  'delhi': { name: 'Delhi', country: 'India', lat: 28.6139, lng: 77.2090, tier: 'domestic_india' },
  'mumbai': { name: 'Mumbai', country: 'India', lat: 19.0760, lng: 72.8777, tier: 'domestic_india' },
  'bengaluru': { name: 'Bengaluru', country: 'India', lat: 12.9716, lng: 77.5946, tier: 'domestic_india' },
  'bangalore': { name: 'Bengaluru', country: 'India', lat: 12.9716, lng: 77.5946, tier: 'domestic_india' },
  'jaipur': { name: 'Jaipur', country: 'India', lat: 26.9124, lng: 75.7873, tier: 'domestic_india' },
  'goa': { name: 'Goa', country: 'India', lat: 15.2993, lng: 74.1240, tier: 'domestic_india' },
  'kolkata': { name: 'Kolkata', country: 'India', lat: 22.5726, lng: 88.3639, tier: 'domestic_india' },
  'chennai': { name: 'Chennai', country: 'India', lat: 13.0827, lng: 80.2707, tier: 'domestic_india' },
  'hyderabad': { name: 'Hyderabad', country: 'India', lat: 17.3850, lng: 78.4867, tier: 'domestic_india' },
  'kochi': { name: 'Kochi', country: 'India', lat: 9.9312, lng: 76.2673, tier: 'domestic_india' },
  'kerala': { name: 'Kerala', country: 'India', lat: 9.9312, lng: 76.2673, tier: 'domestic_india' },
  'agra': { name: 'Agra', country: 'India', lat: 27.1767, lng: 78.0081, tier: 'domestic_india' },
  'varanasi': { name: 'Varanasi', country: 'India', lat: 25.3176, lng: 82.9739, tier: 'domestic_india' },
  'udaipur': { name: 'Udaipur', country: 'India', lat: 24.5854, lng: 73.7125, tier: 'domestic_india' },
  'manali': { name: 'Manali', country: 'India', lat: 32.2432, lng: 77.1892, tier: 'domestic_india' },
  'shimla': { name: 'Shimla', country: 'India', lat: 31.1048, lng: 77.1734, tier: 'domestic_india' },
  'amritsar': { name: 'Amritsar', country: 'India', lat: 31.6340, lng: 74.8723, tier: 'domestic_india' },
  'pune': { name: 'Pune', country: 'India', lat: 18.5204, lng: 73.8567, tier: 'domestic_india' },

  // International Cities
  'paris': { name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522, tier: 'western_high' },
  'london': { name: 'London', country: 'United Kingdom', lat: 51.5074, lng: -0.1278, tier: 'western_high' },
  'rome': { name: 'Rome', country: 'Italy', lat: 41.9028, lng: 12.4964, tier: 'moderate' },
  'barcelona': { name: 'Barcelona', country: 'Spain', lat: 41.3879, lng: 2.1699, tier: 'moderate' },
  'zurich': { name: 'Zurich', country: 'Switzerland', lat: 47.3769, lng: 8.5417, tier: 'luxury' },
  'amsterdam': { name: 'Amsterdam', country: 'Netherlands', lat: 52.3676, lng: 4.9041, tier: 'western_high' },
  'berlin': { name: 'Berlin', country: 'Germany', lat: 52.5200, lng: 13.4050, tier: 'moderate' },
  'vienna': { name: 'Vienna', country: 'Austria', lat: 48.2082, lng: 16.3738, tier: 'moderate' },
  'prague': { name: 'Prague', country: 'Czech Republic', lat: 50.0755, lng: 14.4378, tier: 'moderate' },
  'tokyo': { name: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503, tier: 'western_high' },
  'kyoto': { name: 'Kyoto', country: 'Japan', lat: 35.0116, lng: 135.7681, tier: 'moderate' },
  'bangkok': { name: 'Bangkok', country: 'Thailand', lat: 13.7563, lng: 100.5018, tier: 'budget_intl' },
  'phuket': { name: 'Phuket', country: 'Thailand', lat: 7.8804, lng: 98.3923, tier: 'budget_intl' },
  'singapore': { name: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198, tier: 'western_high' },
  'dubai': { name: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708, tier: 'moderate' },
  'bali': { name: 'Bali', country: 'Indonesia', lat: -8.4095, lng: 115.1889, tier: 'budget_intl' },
  'denpasar': { name: 'Bali', country: 'Indonesia', lat: -8.4095, lng: 115.1889, tier: 'budget_intl' },
  'new york': { name: 'New York', country: 'United States', lat: 40.7128, lng: -74.0060, tier: 'luxury' },
  'los angeles': { name: 'Los Angeles', country: 'United States', lat: 34.0522, lng: -118.2437, tier: 'luxury' },
  'san francisco': { name: 'San Francisco', country: 'United States', lat: 37.7749, lng: -122.4194, tier: 'luxury' },
  'sydney': { name: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093, tier: 'western_high' },
  'cairo': { name: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357, tier: 'budget_intl' },
  'cape town': { name: 'Cape Town', country: 'South Africa', lat: -33.9249, lng: 18.4241, tier: 'moderate' },
  'rio': { name: 'Rio de Janeiro', country: 'Brazil', lat: -22.9068, lng: -43.1729, tier: 'moderate' },
  'rio de janeiro': { name: 'Rio de Janeiro', country: 'Brazil', lat: -22.9068, lng: -43.1729, tier: 'moderate' },
  'seoul': { name: 'Seoul', country: 'South Korea', lat: 37.5665, lng: 126.9780, tier: 'moderate' },
  'hong kong': { name: 'Hong Kong', country: 'Hong Kong', lat: 22.3193, lng: 114.1694, tier: 'western_high' },
  'kuala lumpur': { name: 'Kuala Lumpur', country: 'Malaysia', lat: 3.1390, lng: 101.6869, tier: 'budget_intl' },
  'hanoi': { name: 'Hanoi', country: 'Vietnam', lat: 21.0285, lng: 105.8542, tier: 'budget_intl' },
  'vietnam': { name: 'Vietnam', country: 'Vietnam', lat: 21.0285, lng: 105.8542, tier: 'budget_intl' },
  'kathmandu': { name: 'Kathmandu', country: 'Nepal', lat: 27.7172, lng: 85.3240, tier: 'budget_intl' },
  'colombo': { name: 'Colombo', country: 'Sri Lanka', lat: 6.9271, lng: 79.8612, tier: 'budget_intl' },
  'male': { name: 'Maldives', country: 'Maldives', lat: 4.1755, lng: 73.5093, tier: 'luxury' },
  'maldives': { name: 'Maldives', country: 'Maldives', lat: 4.1755, lng: 73.5093, tier: 'luxury' },
  'athens': { name: 'Athens', country: 'Greece', lat: 37.9838, lng: 23.7275, tier: 'moderate' },
  'istanbul': { name: 'Istanbul', country: 'Turkey', lat: 41.0082, lng: 28.9784, tier: 'moderate' },
};

// Haversine formula to compute great-circle distance between two coordinates
function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Resolver for city name string to coordinates
function resolveCityCoordinates(cityStr: string): { lat: number; lng: number; tier: CityGeoInfo['tier']; name: string; country: string } {
  const cleaned = cityStr.toLowerCase().trim();
  const firstPart = cleaned.split(',')[0].trim();

  // 1. Direct dictionary match
  if (CITY_COORDINATES[firstPart]) {
    return CITY_COORDINATES[firstPart];
  }

  // 2. Substring match against dictionary
  for (const [key, val] of Object.entries(CITY_COORDINATES)) {
    if (cleaned.includes(key) || key.includes(firstPart)) {
      return val;
    }
  }

  // 3. Fallback based on text heuristics
  const isIndian = cleaned.includes('india') || cleaned.includes('in');
  if (isIndian) {
    return { name: cityStr, country: 'India', lat: 20.5937, lng: 78.9629, tier: 'domestic_india' };
  }

  // General international fallback
  return { name: cityStr, country: 'International', lat: 45.0, lng: 10.0, tier: 'moderate' };
}

export const CreateTripModal: React.FC<CreateTripModalProps> = ({
  isOpen,
  onClose,
  onTripCreated,
  tripToEdit,
}) => {
  const isEditing = Boolean(tripToEdit);

  const [name, setName] = useState(tripToEdit?.name || '');
  const [startDate, setStartDate] = useState(tripToEdit?.start_date || '');
  const [endDate, setEndDate] = useState(tripToEdit?.end_date || '');
  const [description, setDescription] = useState(tripToEdit?.description || '');
  const [budgetTotal, setBudgetTotal] = useState<number | string>(tripToEdit?.budget_total ?? 75000);
  const [coverImage, setCoverImage] = useState(tripToEdit?.cover_image || PRESET_COVERS[0].url);
  const [customCoverUrl, setCustomCoverUrl] = useState('');
  const [isPublic, setIsPublic] = useState(tripToEdit?.is_public ?? false);
  const [loading, setLoading] = useState(false);

  // Explicit Origin (From) and Destination (To) routing state
  const [originCity, setOriginCity] = useState('New Delhi, India');
  const [destinationCity, setDestinationCity] = useState('Paris, France');
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);

  // Travel style preference for calculation (Budget, Balanced, Luxury)
  const [travelStyle, setTravelStyle] = useState<'budget' | 'balanced' | 'luxury'>('balanced');

  // Manual duration control (days) - auto-synced with start and end date
  const [manualDays, setManualDays] = useState<number>(5);

  // Field-specific validation errors for clean inline text in red
  const [nameError, setNameError] = useState<string | null>(null);
  const [startDateError, setStartDateError] = useState<string | null>(null);
  const [endDateError, setEndDateError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Keyboard Escape listener to ensure instant exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Auto-detect user's location on open
  useEffect(() => {
    if (isOpen && !locationDetected) {
      detectUserLocation();
    }
  }, [isOpen]);

  // Set default initial dates if not editing
  useEffect(() => {
    if (isOpen && !startDate) {
      const today = new Date();
      const inTwoWeeks = new Date(today);
      inTwoWeeks.setDate(today.getDate() + 14);

      const inTwoWeeksPlusFive = new Date(inTwoWeeks);
      inTwoWeeksPlusFive.setDate(inTwoWeeks.getDate() + 5);

      const sStr = inTwoWeeks.toISOString().split('T')[0];
      const eStr = inTwoWeeksPlusFive.toISOString().split('T')[0];

      setStartDate(sStr);
      setEndDate(eStr);
      setManualDays(6);
    }
  }, [isOpen]);

  const detectUserLocation = () => {
    setDetectingLocation(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          let detected = 'New Delhi, India';
          if (tz.includes('Kolkata') || tz.includes('Calcutta') || tz.includes('India')) {
            detected = 'New Delhi, India';
          } else if (tz.includes('London')) {
            detected = 'London, United Kingdom';
          } else if (tz.includes('New_York')) {
            detected = 'New York, United States';
          } else if (tz.includes('Tokyo')) {
            detected = 'Tokyo, Japan';
          } else if (tz.includes('Paris') || tz.includes('Berlin')) {
            detected = 'Paris, France';
          } else if (tz.includes('Singapore')) {
            detected = 'Singapore';
          } else {
            detected = tz.split('/')[1]?.replace(/_/g, ' ') || 'New Delhi, India';
          }
          setOriginCity(detected);
          setLocationDetected(true);
          setDetectingLocation(false);
        },
        () => {
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          const detectedCity = tz.includes('Kolkata')
            ? 'Mumbai, India'
            : tz.split('/')[1]?.replace(/_/g, ' ') || 'New Delhi, India';
          setOriginCity(detectedCity);
          setLocationDetected(true);
          setDetectingLocation(false);
        },
        { timeout: 4000 }
      );
    } else {
      setDetectingLocation(false);
    }
  };

  // Synchronize duration days from dates
  useEffect(() => {
    if (startDate && endDate) {
      const diff = Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 3600 * 24)) + 1;
      if (diff > 0) {
        setManualDays(diff);
      }
    }
  }, [startDate, endDate]);

  // Adjust duration with stepper and update End Date accordingly
  const handleAdjustDuration = (newDays: number) => {
    if (newDays < 1) return;
    setManualDays(newDays);
    if (startDate) {
      const base = new Date(startDate);
      base.setDate(base.getDate() + newDays - 1);
      setEndDate(base.toISOString().split('T')[0]);
      setEndDateError(null);
    }
  };

  // Comprehensive distance & route based calculation logic
  const routeCalculation = useMemo(() => {
    const originGeo = resolveCityCoordinates(originCity);
    const destGeo = resolveCityCoordinates(destinationCity);

    // Great circle geodesic distance in kilometers
    const distanceKm = calculateHaversineDistanceKm(
      originGeo.lat,
      originGeo.lng,
      destGeo.lat,
      destGeo.lng
    );

    const isDomestic =
      (originGeo.country === 'India' && destGeo.country === 'India') ||
      (originGeo.country === destGeo.country && originGeo.country !== 'International');

    // Determine realistic transit mode and cost based on distance and route type
    let transitModeLabel = 'Flight';
    let transitCost = 0;
    let travelTimeEst = '8 - 10 hrs';

    if (isDomestic) {
      if (distanceKm <= 400) {
        transitModeLabel = 'Express Train / Road Highway';
        travelTimeEst = `${Math.max(2, Math.round(distanceKm / 70))} hrs`;
        // ~₹4.5 per km + reservation fee
        transitCost = Math.round(distanceKm * 4.5 + 600);
      } else if (distanceKm <= 1200) {
        transitModeLabel = 'Vande Bharat / Fast Express Rail or Domestic Air';
        travelTimeEst = '4 - 14 hrs';
        transitCost = Math.round(Math.min(6800, distanceKm * 3.8 + 1200));
      } else {
        transitModeLabel = 'Domestic Non-Stop Air Route';
        travelTimeEst = '2.5 - 3.5 hrs flight';
        transitCost = Math.round(5500 + (distanceKm - 1200) * 1.8);
      }
    } else {
      // International routes
      if (distanceKm <= 3500) {
        transitModeLabel = 'Short-Haul International Air';
        travelTimeEst = '4 - 6 hrs flight';
        transitCost = Math.round(16000 + distanceKm * 2.8);
      } else if (distanceKm <= 7500) {
        transitModeLabel = 'Long-Haul International Direct Flight';
        travelTimeEst = '8 - 12 hrs flight';
        transitCost = Math.round(36000 + (distanceKm - 3500) * 2.6);
      } else {
        transitModeLabel = 'Ultra Long-Haul Transcontinental Flight';
        travelTimeEst = '14 - 18+ hrs flight';
        transitCost = Math.round(62000 + (distanceKm - 7500) * 2.4);
      }
    }

    // Accommodation (Stay) rates based on destination tier and style
    const nights = Math.max(1, manualDays - 1);
    let baseNightRate = 4500;

    switch (destGeo.tier) {
      case 'luxury':
        baseNightRate = 11500;
        break;
      case 'western_high':
        baseNightRate = 7800;
        break;
      case 'moderate':
        baseNightRate = 5200;
        break;
      case 'budget_intl':
        baseNightRate = 2800;
        break;
      case 'domestic_india':
        baseNightRate = 2600;
        break;
    }

    // Daily Activities & Sightseeing rates
    let baseDayActivityRate = 2200;
    switch (destGeo.tier) {
      case 'luxury':
        baseDayActivityRate = 4200;
        break;
      case 'western_high':
        baseDayActivityRate = 3200;
        break;
      case 'moderate':
        baseDayActivityRate = 2400;
        break;
      case 'budget_intl':
        baseDayActivityRate = 1500;
        break;
      case 'domestic_india':
        baseDayActivityRate = 1200;
        break;
    }

    // Travel style multipliers
    let styleMultiplier = 1.0;
    if (travelStyle === 'budget') styleMultiplier = 0.65;
    if (travelStyle === 'luxury') styleMultiplier = 1.85;

    const finalTransit = Math.round(transitCost * (travelStyle === 'luxury' ? 1.5 : travelStyle === 'budget' ? 0.8 : 1.0));
    const finalNightRate = Math.round(baseNightRate * styleMultiplier);
    const finalStay = Math.round(nights * finalNightRate);
    const finalDayActivityRate = Math.round(baseDayActivityRate * styleMultiplier);
    const finalActivities = Math.round(manualDays * finalDayActivityRate);

    const totalCost = finalTransit + finalStay + finalActivities;

    return {
      distanceKm,
      isDomestic,
      transitModeLabel,
      travelTimeEst,
      nights,
      finalNightRate,
      finalDayActivityRate,
      transitCost: finalTransit,
      stayCost: finalStay,
      activitiesCost: finalActivities,
      totalCost,
      originName: originGeo.name,
      destName: destGeo.name,
    };
  }, [originCity, destinationCity, manualDays, travelStyle]);

  const handleApplyEstimatedBudget = () => {
    setBudgetTotal(routeCalculation.totalCost);
  };

  const handleCustomPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setCoverImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = (): boolean => {
    let isValid = true;
    setNameError(null);
    setStartDateError(null);
    setEndDateError(null);
    setGeneralError(null);

    if (!name.trim()) {
      setNameError('Trip title cannot be left blank.');
      isValid = false;
    }

    if (!startDate) {
      setStartDateError('Start date is required.');
      isValid = false;
    }

    if (!endDate) {
      setEndDateError('End date is required.');
      isValid = false;
    } else if (startDate && new Date(endDate) < new Date(startDate)) {
      setEndDateError('End date cannot be earlier than the start date.');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      const routeNotes = `From: ${originCity} → To: ${destinationCity} (${routeCalculation.distanceKm} km)`;
      const finalDescription = description.trim()
        ? `${description.trim()}\n\n[Route: ${routeNotes}]`
        : `[Route: ${routeNotes}]`;

      if (isEditing && tripToEdit) {
        const res = await api.updateTrip(tripToEdit.id, {
          name: name.trim(),
          start_date: startDate,
          end_date: endDate,
          description: finalDescription,
          cover_image: coverImage,
          budget_total: Number(budgetTotal) || routeCalculation.totalCost,
          is_public: isPublic,
        });
        onTripCreated(res.trip);
      } else {
        const res = await api.createTrip({
          name: name.trim(),
          start_date: startDate,
          end_date: endDate,
          description: finalDescription,
          cover_image: coverImage,
          budget_total: Number(budgetTotal) || routeCalculation.totalCost,
          is_public: isPublic,
        });

        // Automatically provision initial destination stop if user specified a destination
        if (res.trip && destinationCity.trim()) {
          try {
            const cityNameOnly = destinationCity.split(',')[0].trim();
            const countryOnly = destinationCity.split(',')[1]?.trim() || 'Global';
            await api.addStop(res.trip.id, {
              city_name: cityNameOnly,
              country: countryOnly,
              start_date: startDate,
              end_date: endDate,
              transport_mode: routeCalculation.isDomestic ? 'train' : 'flight',
              transport_notes: `Travel from origin ${originCity} (~${routeCalculation.distanceKm} km • ${routeCalculation.travelTimeEst})`,
            });
            const refreshed = await api.getTrip(res.trip.id);
            onTripCreated(refreshed.trip);
          } catch (e) {
            onTripCreated(res.trip);
          }
        } else {
          onTripCreated(res.trip);
        }
      }
      onClose();
    } catch (err: any) {
      setGeneralError(err.message || 'Failed to save trip. Please check your entries.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    // Outer overlay: clicking outside the modal directly triggers onClose() to ensure easy exiting
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
    >
      {/* Modal Container: stopPropagation prevents backdrop clicks from inside the modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden my-4 max-h-[92vh] flex flex-col"
      >
        {/* Sticky Header with Title and Prominent Exit Buttons */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div>
            <div className="flex items-center space-x-2">
              <Compass className="w-5 h-5 text-sky-600" />
              <h2 className="text-xl font-bold text-slate-900 font-serif-heading">
                {isEditing ? 'Edit Trip Itinerary' : 'Plan a New Trip'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Select origin and destination to calculate real-distance transit, stays, and activities.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {/* Clear, explicit text Cancel button right in the header for instant exit */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              Exit (Esc)
            </button>

            {/* Prominent Cross Button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 rounded-xl transition-colors cursor-pointer"
              title="Close (Esc)"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <form id="create-trip-form" onSubmit={handleSubmit} noValidate className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {generalError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Trip Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Trip Title *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (e.target.value.trim()) setNameError(null);
              }}
              placeholder="e.g. Grand Tour: Paris to Italian Riviera"
              className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none transition-all font-medium ${
                nameError
                  ? 'border-rose-400 focus:ring-2 focus:ring-rose-500/20 text-rose-900 bg-rose-50/20'
                  : 'border-slate-200 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-900'
              }`}
            />
            {nameError && (
              <p className="text-xs text-rose-600 font-medium mt-1 flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{nameError}</span>
              </p>
            )}
          </div>

          {/* Explicit 'From' (Origin) and 'To' (Destination) Routing */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50/90 via-indigo-50/40 to-slate-50 border border-sky-100 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-950 flex items-center space-x-1.5 uppercase tracking-wider">
                <Navigation className="w-3.5 h-3.5 text-sky-600" />
                <span>Route Itinerary (From & To)</span>
              </span>
              <button
                type="button"
                onClick={detectUserLocation}
                disabled={detectingLocation}
                className="text-[11px] font-semibold text-sky-700 hover:text-sky-800 flex items-center space-x-1 bg-white px-2.5 py-1 rounded-lg border border-sky-200 shadow-2xs hover:bg-sky-50 transition-colors cursor-pointer"
              >
                <LocateFixed className={`w-3 h-3 ${detectingLocation ? 'animate-spin text-sky-600' : 'text-sky-600'}`} />
                <span>{detectingLocation ? 'Detecting...' : locationDetected ? 'Location Detected' : 'Detect My Location'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* FROM / ORIGIN */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center space-x-1">
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  <span>From (Starting Origin)</span>
                </label>
                <input
                  type="text"
                  value={originCity}
                  onChange={(e) => setOriginCity(e.target.value)}
                  placeholder="e.g. New Delhi, India"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  <span className="text-[10px] text-slate-400">Quick:</span>
                  {['New Delhi', 'Mumbai', 'Bengaluru', 'London', 'New York'].map((city) => (
                    <button
                      type="button"
                      key={city}
                      onClick={() => setOriginCity(`${city}`)}
                      className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                        originCity.toLowerCase().includes(city.toLowerCase())
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold'
                          : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>

              {/* TO / DESTINATION */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center space-x-1">
                  <PlaneTakeoff className="w-3 h-3 text-sky-600" />
                  <span>To (Destination Hub)</span>
                </label>
                <input
                  type="text"
                  value={destinationCity}
                  onChange={(e) => setDestinationCity(e.target.value)}
                  placeholder="e.g. Paris, France"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  <span className="text-[10px] text-slate-400">Popular:</span>
                  {['Paris', 'Tokyo', 'Rome', 'Goa', 'Dubai', 'Bali', 'Zurich'].map((city) => (
                    <button
                      type="button"
                      key={city}
                      onClick={() => setDestinationCity(`${city}`)}
                      className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                        destinationCity.toLowerCase().includes(city.toLowerCase())
                          ? 'bg-sky-50 text-sky-700 border-sky-300 font-bold'
                          : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Interactive Duration & Travel Style Control for Instant Real-Time Cost Recalculation */}
            <div className="pt-2 border-t border-sky-100/80 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold text-slate-600">Trip Length:</span>
                <div className="inline-flex items-center space-x-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => handleAdjustDuration(manualDays - 1)}
                    disabled={manualDays <= 1}
                    className="p-0.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded disabled:opacity-30 cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-bold text-slate-800 min-w-[50px] text-center">
                    {manualDays} {manualDays === 1 ? 'Day' : 'Days'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAdjustDuration(manualDays + 1)}
                    className="p-0.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">
                  ({routeCalculation.nights} {routeCalculation.nights === 1 ? 'Night' : 'Nights'})
                </span>
              </div>

              {/* Style tier selector: Budget | Balanced | Luxury */}
              <div className="flex items-center space-x-1 bg-white p-0.5 rounded-lg border border-slate-200 text-[10px] font-semibold">
                {(['budget', 'balanced', 'luxury'] as const).map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setTravelStyle(style)}
                    className={`px-2 py-0.5 rounded-md capitalize transition-colors cursor-pointer ${
                      travelStyle === style
                        ? 'bg-sky-600 text-white font-bold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* Realistic Dynamic Estimated Cost Calculation Summary Card */}
            <div className="p-4 bg-white rounded-xl border border-sky-200/80 shadow-sm space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-1 border-b border-slate-100 pb-2">
                <div className="flex items-center space-x-1.5">
                  <Calculator className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-900">
                    Route & Distance Cost Breakdown
                  </span>
                </div>
                <span className="text-xs font-extrabold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
                  Total: ₹{routeCalculation.totalCost.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Distance and Transit Route Badge */}
              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg">
                <div className="flex items-center space-x-1">
                  <Navigation className="w-3.5 h-3.5 text-sky-600" />
                  <span>
                    Distance: <strong className="text-slate-800">{routeCalculation.distanceKm.toLocaleString('en-IN')} km</strong>
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-slate-600">
                  <span className="text-slate-400">•</span>
                  <span>{routeCalculation.transitModeLabel}</span>
                  <span className="text-slate-400">•</span>
                  <span className="font-medium text-slate-700">~{routeCalculation.travelTimeEst}</span>
                </div>
              </div>

              {/* 3 Clear Category Blocks: Transit, Stays, Activities */}
              <div className="grid grid-cols-3 gap-2 text-center">
                {/* 1. Transit Cost */}
                <div className="p-2.5 bg-sky-50/60 border border-sky-100 rounded-xl flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-sky-800 font-semibold block uppercase tracking-wider">
                      1. Transit
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 block mt-0.5">
                      ₹{routeCalculation.transitCost.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1 block">
                    {routeCalculation.distanceKm} km route
                  </span>
                </div>

                {/* 2. Stay Cost */}
                <div className="p-2.5 bg-indigo-50/60 border border-indigo-100 rounded-xl flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-indigo-800 font-semibold block uppercase tracking-wider">
                      2. Stays ({routeCalculation.nights}N)
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 block mt-0.5">
                      ₹{routeCalculation.stayCost.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1 block">
                    ~₹{routeCalculation.finalNightRate.toLocaleString('en-IN')}/night
                  </span>
                </div>

                {/* 3. Activities & Sightseeing */}
                <div className="p-2.5 bg-amber-50/60 border border-amber-100 rounded-xl flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-amber-800 font-semibold block uppercase tracking-wider">
                      3. Sightseeing ({manualDays}D)
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 block mt-0.5">
                      ₹{routeCalculation.activitiesCost.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1 block">
                    ~₹{routeCalculation.finalDayActivityRate.toLocaleString('en-IN')}/day
                  </span>
                </div>
              </div>

              {/* One-click Action to apply to target budget */}
              <button
                type="button"
                onClick={handleApplyEstimatedBudget}
                className="w-full py-2 px-3 bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-700 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer active:scale-98"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Apply ₹{routeCalculation.totalCost.toLocaleString('en-IN')} as Target Budget</span>
              </button>
            </div>
          </div>

          {/* Date range with inline validation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-sky-600" />
                <span>Start Date *</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (e.target.value) setStartDateError(null);
                  if (endDate && new Date(endDate) >= new Date(e.target.value)) {
                    setEndDateError(null);
                  }
                }}
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none transition-all ${
                  startDateError
                    ? 'border-rose-400 focus:ring-2 focus:ring-rose-500/20 text-rose-900 bg-rose-50/20'
                    : 'border-slate-200 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-800'
                }`}
              />
              {startDateError && (
                <p className="text-xs text-rose-600 font-medium mt-1 flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{startDateError}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-sky-600" />
                <span>End Date *</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  if (e.target.value) {
                    if (startDate && new Date(e.target.value) < new Date(startDate)) {
                      setEndDateError('End date cannot be earlier than start date.');
                    } else {
                      setEndDateError(null);
                    }
                  }
                }}
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none transition-all ${
                  endDateError
                    ? 'border-rose-400 focus:ring-2 focus:ring-rose-500/20 text-rose-900 bg-rose-50/20'
                    : 'border-slate-200 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-800'
                }`}
              />
              {endDateError && (
                <p className="text-xs text-rose-600 font-medium mt-1 flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{endDateError}</span>
                </p>
              )}
            </div>
          </div>

          {/* Schedule Duration summary */}
          {manualDays > 0 && !endDateError && (
            <div className="px-3.5 py-2 rounded-xl bg-sky-50/70 border border-sky-100 flex items-center justify-between text-xs text-sky-900">
              <span className="font-semibold">Calculated Itinerary Schedule:</span>
              <span className="font-bold">
                {manualDays} Days / {routeCalculation.nights} Nights
              </span>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Trip Description & Travel Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Overview of travel companions, main milestones, or bucket list sights..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-800 transition-all resize-none"
            />
          </div>

          {/* Target Budget Goal */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                <span className="font-bold text-emerald-600 text-sm">₹</span>
                <span>Target Budget Goal (INR - ₹) *</span>
              </label>
              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Powers Budget Meter
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-base select-none">
                ₹
              </span>
              <input
                type="number"
                min="0"
                step="500"
                value={budgetTotal}
                onChange={(e) => setBudgetTotal(e.target.value)}
                placeholder="75000"
                className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 font-bold"
              />
            </div>

            {/* Quick preset chips */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10px] font-semibold text-slate-600">Quick set:</span>
              {[25000, 50000, 75000, 100000, 200000].map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setBudgetTotal(preset)}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                    Number(budgetTotal) === preset
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  ₹{preset.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>

          {/* Cover Photo Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center space-x-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span>Cover Photo</span>
            </label>

            {/* Presets Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
              {PRESET_COVERS.map((preset) => (
                <button
                  type="button"
                  key={preset.url}
                  onClick={() => setCoverImage(preset.url)}
                  className={`group relative h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    coverImage === preset.url
                      ? 'border-sky-600 ring-2 ring-sky-600/30 scale-102'
                      : 'border-transparent opacity-75 hover:opacity-100'
                  }`}
                >
                  <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                  {coverImage === preset.url && (
                    <div className="absolute inset-0 bg-sky-600/30 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white drop-shadow" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Custom URL or file input */}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Or paste custom image URL..."
                value={customCoverUrl}
                onChange={(e) => {
                  setCustomCoverUrl(e.target.value);
                  if (e.target.value.startsWith('http')) {
                    setCoverImage(e.target.value);
                  }
                }}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              <label className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl cursor-pointer text-center transition-colors">
                <span>Upload File</span>
                <input type="file" accept="image/*" onChange={handleCustomPhotoUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* Public Shareability Toggle */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Globe className="w-4 h-4 text-sky-600" />
              <div>
                <p className="text-xs font-semibold text-slate-800">Public Shared Itinerary</p>
                <p className="text-[11px] text-slate-500">Allow friends to view and copy this trip with a shareable URL</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600"></div>
            </label>
          </div>
        </form>

        {/* Sticky Pinned Footer with Cancel and Submit - ALWAYS visible without needing to scroll */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/90 backdrop-blur-xs flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            Cancel & Exit
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="submit"
              form="create-trip-form"
              disabled={loading}
              className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/20 active:scale-98 transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>{isEditing ? 'Save Changes' : 'Create & Build Itinerary'}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
