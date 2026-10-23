import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  IndianRupee,
  MapPin,
  List,
  Eye,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Train,
  Plane,
  Car,
  Bus,
  Ship,
  Tag,
  CheckCircle2,
  Printer,
  Trash2,
  FileDown,
  Share2,
  Copy,
  Check,
  X,
  Compass,
  AlertCircle,
  Building,
  Ticket
} from 'lucide-react';
import { Trip, Stop, Activity } from '../types/travel';
import { api } from '../lib/api';

interface ItineraryDisplayViewProps {
  trip: Trip;
  onTripUpdated?: (updatedTrip: Trip) => void;
  onOpenOptimizer: () => void;
  onOpenBuilder: () => void;
  onOpenChat: () => void;
}

export const ItineraryDisplayView: React.FC<ItineraryDisplayViewProps> = ({
  trip,
  onTripUpdated,
  onOpenOptimizer,
  onOpenBuilder,
  onOpenChat,
}) => {
  const [viewMode, setViewMode] = useState<'timeline' | 'calendar' | 'list'>('timeline');
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('all');
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [deletingActivityId, setDeletingActivityId] = useState<number | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Generate an array of all distinct dates across the trip
  const stops = trip.stops || [];
  const start = new Date(trip.start_date);
  const end = new Date(trip.end_date);

  const allDates: string[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    allDates.push(cur.toISOString().split('T')[0]);
    cur.setDate(cur.getDate() + 1);
  }

  // Map each date to stop and scheduled activities
  const rawDayPlan = allDates.map((dateStr) => {
    // Find active stop for this date
    const activeStop = stops.find(s => dateStr >= s.start_date && dateStr <= s.end_date) || stops[0] || null;

    // Activities for this date across all stops
    const dayActivities: Activity[] = [];
    stops.forEach(s => {
      s.activities?.forEach(act => {
        if (act.date === dateStr) {
          dayActivities.push(act);
        }
      });
    });

    const dayCost = dayActivities.reduce((acc, a) => acc + (a.cost || 0), 0);

    return {
      date: dateStr,
      stop: activeStop,
      activities: dayActivities,
      totalCost: dayCost,
    };
  });

  // Filter out and remove empty, unallocated, or idle days where no activities are scheduled.
  // The day-by-day itinerary and calendar timeline only show active, meaningful travel days in a continuous, optimized sequence.
  const activeDaysOnly = rawDayPlan.filter(d => d.activities.length > 0);
  // Fallback to days with stops only if no activities have been scheduled anywhere yet
  const effectiveDays = activeDaysOnly.length > 0 ? activeDaysOnly : rawDayPlan.filter(d => Boolean(d.stop));

  // Renumber the active days sequentially in a continuous, optimized 1, 2, 3... sequence
  const dayPlan = effectiveDays.map((d, idx) => ({
    ...d,
    dayNumber: idx + 1,
  }));

  const toggleDay = (dateStr: string) => {
    setExpandedDays(prev => ({
      ...prev,
      [dateStr]: prev[dateStr] === false ? true : false,
    }));
  };

  const isDayExpanded = (dateStr: string) => expandedDays[dateStr] !== false; // default true

  const toggleAll = (expand: boolean) => {
    const updated: Record<string, boolean> = {};
    dayPlan.forEach(d => {
      updated[d.date] = expand;
    });
    setExpandedDays(updated);
  };

  const filteredDays = dayPlan.filter(d => {
    if (selectedCityFilter === 'all') return true;
    return d.stop?.city_name === selectedCityFilter;
  });

  const formatDateHeader = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getTimeSlotBadge = (slot: string) => {
    switch (slot) {
      case 'morning':
        return <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">Morning</span>;
      case 'afternoon':
        return <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 text-[10px] font-bold uppercase">Afternoon</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-bold uppercase">Evening</span>;
    }
  };

  // Activity Delete / Remove Handler (Requirement 3)
  const handleDeleteActivity = async (activityId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to remove this activity from your itinerary?')) return;

    try {
      setDeletingActivityId(activityId);
      await api.deleteActivity(activityId);
      // Instantly refresh trip to recalculate day's timeline and total cost calculations
      const res = await api.getTrip(trip.id);
      if (onTripUpdated) {
        onTripUpdated(res.trip);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete activity');
    } finally {
      setDeletingActivityId(null);
    }
  };

  // Extract Route Origin / Destination from description or stops
  const routeMatch = trip.description?.match(/\[Route: (.*?)\]/);
  const routeString = routeMatch ? routeMatch[1] : stops.length > 0 ? `${stops.map(s => s.city_name).join(' ➔ ')}` : 'Custom Route';

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/?share=${trip.public_slug}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopySummaryText = () => {
    let text = `✈️ ITINERARY: ${trip.name.toUpperCase()}\n`;
    text += `📅 Dates: ${trip.start_date} to ${trip.end_date} (${dayPlan.length} Active Days)\n`;
    text += `📍 Route: ${routeString}\n`;
    text += `💰 Estimated Budget: ₹${(trip.budget_total || 0).toLocaleString('en-IN')}\n\n`;
    text += `DAY-BY-DAY SCHEDULE:\n`;

    dayPlan.forEach((d) => {
      text += `\nDay ${d.dayNumber}: ${formatDateHeader(d.date)} [${d.stop?.city_name || 'Destination'}] - Total: ₹${d.totalCost.toLocaleString('en-IN')}\n`;
      if (d.activities.length === 0) {
        text += `  • Leisure exploration & transit\n`;
      } else {
        d.activities.forEach(a => {
          text += `  • [${a.time_slot.toUpperCase()}] ${a.title} (₹${a.cost.toLocaleString('en-IN')}) - ${a.duration_hours}h\n`;
        });
      }
    });

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const totalCalculatedActivitiesCost = dayPlan.reduce((acc, d) => acc + d.totalCost, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-md bg-sky-100 text-sky-800 text-[10px] font-bold uppercase tracking-wide">
              Itinerary View & Calendar
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {dayPlan.length} Active Days • {stops.length} Cities
            </span>
          </div>
          <h1 className="text-2xl font-bold font-serif-heading text-slate-900 mt-1">
            {trip.name} Schedule
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Continuous sequence of active travel days with scheduled time blocks, locations, and instant ₹ INR cost metrics.
          </p>
        </div>

        {/* View Mode Switcher, Export to PDF, and Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Prominent Export to PDF / Share Button (Requirement 5) */}
          <button
            onClick={() => setShowExportModal(true)}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer"
            title="Export to PDF or Share complete Trip Itinerary"
          >
            <FileDown className="w-4 h-4 text-sky-400" />
            <span>Export to PDF / Share</span>
          </button>

          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                viewMode === 'timeline'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5 text-sky-600" />
              <span>Timeline</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span>Calendar</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5 text-emerald-600" />
              <span>List</span>
            </button>
          </div>

          <button
            onClick={onOpenOptimizer}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI Optimizer</span>
          </button>

          <button
            onClick={onOpenChat}
            className="px-3.5 py-2 rounded-xl bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200 text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
            <span>Chat Assistant</span>
          </button>
        </div>
      </div>

      {/* Sub-toolbar: City Filter & Expand/Collapse */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
        {/* City Filter Chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mr-1">
            Filter:
          </span>
          <button
            onClick={() => setSelectedCityFilter('all')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
              selectedCityFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Cities
          </button>
          {stops.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedCityFilter(s.city_name)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
                selectedCityFilter === s.city_name
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s.city_name}
            </button>
          ))}
        </div>

        {/* Expand / Collapse & Fast Print Controls */}
        <div className="flex items-center space-x-2 self-end sm:self-auto text-xs text-slate-500 font-medium">
          <button
            onClick={() => toggleAll(true)}
            className="hover:text-slate-900 transition-colors cursor-pointer"
          >
            Expand All
          </button>
          <span>•</span>
          <button
            onClick={() => toggleAll(false)}
            className="hover:text-slate-900 transition-colors cursor-pointer"
          >
            Collapse All
          </button>
          <span>•</span>
          <button
            onClick={() => setShowExportModal(true)}
            className="hover:text-sky-600 flex items-center space-x-1 cursor-pointer font-semibold text-sky-700"
            title="Export / Print Itinerary PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print PDF</span>
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: VERTICAL EXPANDABLE TIMELINE */}
      {viewMode === 'timeline' && (
        <div className="space-y-6 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-slate-200/80 before:z-0">
          {filteredDays.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 text-slate-500">
              No active days found for this city.
            </div>
          ) : (
            filteredDays.map((day) => {
              const isExpanded = isDayExpanded(day.date);
              const isCityFirstDay = day.stop?.start_date === day.date;

              return (
                <div key={day.date} className="relative z-10 pl-12">
                  {/* Day Marker Dot on Left Line */}
                  <div
                    onClick={() => toggleDay(day.date)}
                    className="absolute left-2.5 top-5 -translate-x-1/2 w-6 h-6 rounded-full bg-white border-2 border-sky-600 shadow-sm flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                  >
                    <span className="text-[10px] font-bold text-sky-700">{day.dayNumber}</span>
                  </div>

                  {/* Day Card */}
                  <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:border-sky-300 transition-all overflow-hidden">
                    {/* Day Header */}
                    <div
                      onClick={() => toggleDay(day.date)}
                      className="p-4 bg-slate-50/70 hover:bg-slate-50 border-b border-slate-100 flex items-center justify-between cursor-pointer select-none transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-bold text-slate-900">
                              Day {day.dayNumber} • {formatDateHeader(day.date)}
                            </span>
                            {day.stop && (
                              <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[11px] font-bold flex items-center space-x-1">
                                <MapPin className="w-3 h-3" />
                                <span>{day.stop.city_name}</span>
                              </span>
                            )}
                            {isCityFirstDay && day.stop && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                                Arrival in {day.stop.city_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="text-right text-xs">
                          <span className="font-semibold text-slate-700">
                            {day.activities.length} {day.activities.length === 1 ? 'activity' : 'activities'}
                          </span>
                          {day.totalCost > 0 && (
                            <span className="ml-2 font-bold text-emerald-600">
                              ₹{day.totalCost.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                        <div className="p-1 rounded-lg hover:bg-slate-200 transition-colors">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-500" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-500" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Day Expanded Activities Timeline Content */}
                    {isExpanded && (
                      <div className="p-5 space-y-3">
                        {day.activities.length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-500 italic bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                            Free leisure day in {day.stop?.city_name || 'destination'}. No scheduled activities booked.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {day.activities.map((act) => (
                              <div
                                key={act.id}
                                className="p-4 rounded-2xl border border-slate-100 bg-white hover:border-slate-300 shadow-2xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                              >
                                <div className="flex items-start space-x-3">
                                  <div className="shrink-0 mt-0.5">
                                    {getTimeSlotBadge(act.time_slot)}
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-sm text-slate-900 leading-snug">
                                      {act.title}
                                    </h4>
                                    {act.description && (
                                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                                        {act.description}
                                      </p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-slate-500">
                                      {act.location && (
                                        <span className="flex items-center space-x-1">
                                          <MapPin className="w-3 h-3 text-slate-400" />
                                          <span>{act.location}</span>
                                        </span>
                                      )}
                                      <span>•</span>
                                      <span className="flex items-center space-x-1">
                                        <Clock className="w-3 h-3 text-slate-400" />
                                        <span>{act.duration_hours} hrs</span>
                                      </span>
                                      <span>•</span>
                                      <span className="capitalize">{act.category}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2.5 self-end sm:self-center shrink-0">
                                  {act.booking_status === 'booked' && (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                                      Confirmed
                                    </span>
                                  )}
                                  <span className="text-sm font-bold text-emerald-600 bg-emerald-50/80 px-2.5 py-1 rounded-xl">
                                    {act.cost > 0 ? `₹${act.cost.toLocaleString('en-IN')}` : 'Free'}
                                  </span>

                                  {/* Interactive Trash / Remove Activity Button (Requirement 3) */}
                                  <button
                                    onClick={(e) => handleDeleteActivity(act.id, e)}
                                    disabled={deletingActivityId === act.id}
                                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer opacity-80 group-hover:opacity-100"
                                    title="Remove this scheduled activity"
                                    aria-label="Delete Activity"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW MODE 2: CALENDAR GRID */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredDays.map((day) => (
              <div
                key={day.date}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-sky-300 transition-all flex flex-col justify-between min-h-[190px]"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                    <span className="text-xs font-bold text-slate-800">
                      Day {day.dayNumber}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {formatDateHeader(day.date)}
                    </span>
                  </div>

                  {day.stop && (
                    <div className="mt-2 text-xs font-bold text-sky-700 flex items-center space-x-1">
                      <MapPin className="w-3 h-3" />
                      <span>{day.stop.city_name}</span>
                    </div>
                  )}

                  {/* Activity Titles with Quick Remove */}
                  <div className="mt-2 space-y-1.5">
                    {day.activities.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">No activities</p>
                    ) : (
                      day.activities.map(act => (
                        <div
                          key={act.id}
                          className="p-1.5 rounded-lg bg-white border border-slate-100 text-[11px] font-medium text-slate-700 flex items-center justify-between group"
                          title={act.title}
                        >
                          <span className="truncate mr-1 font-medium">
                            {act.title} (₹{act.cost.toLocaleString('en-IN')})
                          </span>
                          <button
                            onClick={(e) => handleDeleteActivity(act.id, e)}
                            className="p-0.5 text-slate-300 hover:text-rose-500 opacity-60 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
                            title="Remove"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-2 mt-3 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">{day.activities.length} sights</span>
                  <span className="font-bold text-emerald-600">₹{day.totalCost.toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW MODE 3: COMPACT LIST TABLE */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
                <tr>
                  <th className="py-3 px-4">Day & Date</th>
                  <th className="py-3 px-4">City</th>
                  <th className="py-3 px-4">Time Slot</th>
                  <th className="py-3 px-4">Activity Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Cost (₹)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDays.flatMap((day) => {
                  if (day.activities.length === 0) {
                    return (
                      <tr key={day.date} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          Day {day.dayNumber} ({formatDateHeader(day.date)})
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">{day.stop?.city_name || '-'}</td>
                        <td colSpan={5} className="py-3 px-4 text-slate-400 italic">
                          Leisure / Transit day
                        </td>
                        <td className="py-3 px-4 text-center">-</td>
                      </tr>
                    );
                  }

                  return day.activities.map((act, actIdx) => (
                    <tr key={act.id} className="hover:bg-slate-50/50">
                      {actIdx === 0 ? (
                        <td rowSpan={day.activities.length} className="py-3 px-4 font-semibold text-slate-800 align-top border-r border-slate-100">
                          Day {day.dayNumber} ({formatDateHeader(day.date)})
                        </td>
                      ) : null}
                      {actIdx === 0 ? (
                        <td rowSpan={day.activities.length} className="py-3 px-4 text-slate-700 font-medium align-top border-r border-slate-100">
                          {day.stop?.city_name || '-'}
                        </td>
                      ) : null}
                      <td className="py-3 px-4 capitalize font-medium text-slate-600">{act.time_slot}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{act.title}</td>
                      <td className="py-3 px-4 capitalize text-slate-500">{act.category}</td>
                      <td className="py-3 px-4 font-semibold text-emerald-600">
                        {act.cost > 0 ? `₹${act.cost.toLocaleString('en-IN')}` : 'Free'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          act.booking_status === 'booked' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {act.booking_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={(e) => handleDeleteActivity(act.id, e)}
                          disabled={deletingActivityId === act.id}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove Activity"
                        >
                          <Trash2 className="w-3.5 h-3.5 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EXPORT TO PDF & SHARE ITINERARY MODAL (Requirement 5) */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-400/30">
                  <FileDown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-serif-heading text-white">
                    Official Itinerary Document & PDF Export
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Clean, printable travel dossier with day-by-day stops, budget breakdown, and booking notes.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-sm"
                  title="Print or Save as PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Quick Actions Bar */}
            <div className="p-3 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold flex items-center space-x-1.5 transition-all cursor-pointer shadow-2xs"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copiedLink ? 'Share Link Copied!' : 'Copy Shareable Link'}</span>
                </button>

                <button
                  onClick={handleCopySummaryText}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold flex items-center space-x-1.5 transition-all cursor-pointer shadow-2xs"
                >
                  {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copiedSummary ? 'Summary Text Copied!' : 'Copy Text Overview'}</span>
                </button>
              </div>

              <span className="text-[11px] text-slate-500 font-medium">
                Tip: Use your browser’s “Save as PDF” option in the print window.
              </span>
            </div>

            {/* Document Printable Preview Area */}
            <div id="printable-itinerary-doc" className="p-6 md:p-8 overflow-y-auto space-y-6 bg-white text-slate-900">
              {/* Document Letterhead */}
              <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                      Globe Trotter • Travel Itinerary Dossier
                    </span>
                  </div>
                  <h1 className="text-3xl font-extrabold font-serif-heading text-slate-900 mt-2">
                    {trip.name}
                  </h1>
                  <p className="text-xs text-slate-600 mt-1 max-w-xl">
                    {trip.description?.replace(/\[Route: .*?\]/, '').trim() || 'Custom curated multi-city itinerary generated via Globe Trotter platform.'}
                  </p>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <div className="text-xs font-bold uppercase text-slate-400">Duration & Dates</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {trip.start_date} ➔ {trip.end_date}
                  </div>
                  <div className="text-xs text-sky-700 font-semibold mt-0.5">
                    {dayPlan.length} Active Days • {stops.length} Cities
                  </div>
                </div>
              </div>

              {/* Route & Destination Overview */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Journey Origin ➔ Destination Routing
                  </span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                    {routeString}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Budget</span>
                    <span className="font-bold text-slate-900 text-sm">₹{(trip.budget_total || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="h-6 w-px bg-slate-200" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Scheduled</span>
                    <span className="font-bold text-emerald-600 text-sm">₹{(trip.total_spent || totalCalculatedActivitiesCost).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Day-By-Day Continuous Breakdown */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center justify-between">
                  <span>Day-by-Day Complete Itinerary Breakdown</span>
                  <span className="text-xs font-normal text-slate-500">Only Active Travel Days</span>
                </h3>

                <div className="space-y-4">
                  {dayPlan.map((day) => (
                    <div key={day.date} className="p-4 rounded-2xl border border-slate-200/90 bg-white space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center space-x-2">
                          <span className="px-2.5 py-1 rounded-xl bg-sky-600 text-white text-xs font-bold">
                            Day {day.dayNumber}
                          </span>
                          <span className="font-bold text-sm text-slate-900">
                            {formatDateHeader(day.date)}
                          </span>
                          {day.stop && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                              📍 {day.stop.city_name}, {day.stop.country}
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-bold text-emerald-600">
                          Day Est: ₹{day.totalCost.toLocaleString('en-IN')}
                        </span>
                      </div>

                      {/* Activities for Day */}
                      {day.activities.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">Leisure day / Transit connections</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {day.activities.map(act => (
                            <div key={act.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-2 text-xs">
                              <div>
                                <div className="flex items-center space-x-1.5 mb-1">
                                  {getTimeSlotBadge(act.time_slot)}
                                  <span className="text-[11px] text-slate-500 font-medium">• {act.duration_hours}h</span>
                                </div>
                                <span className="font-bold text-slate-900 block">{act.title}</span>
                                {act.location && (
                                  <span className="text-[11px] text-slate-500 block mt-0.5">{act.location}</span>
                                )}
                              </div>
                              <span className="font-bold text-emerald-600 text-xs shrink-0">
                                {act.cost > 0 ? `₹${act.cost.toLocaleString('en-IN')}` : 'Free'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Booking Notes & Advisory Section */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-xs text-amber-900 space-y-1.5">
                <div className="font-bold flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-700" />
                  <span>Important Traveler Advisory & Notes</span>
                </div>
                <p className="leading-relaxed text-[11px] text-amber-800">
                  Please arrive at least 45 minutes prior to scheduled museum or tour slots with valid photo identification.
                  Carry local currency and international cards. Keep booking confirmation QR codes readily accessible on mobile.
                </p>
              </div>

              {/* Document Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
                <span>Generated by Globe Trotter AI Build</span>
                <span>Ref: {trip.public_slug} • Printed {new Date().toLocaleDateString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
