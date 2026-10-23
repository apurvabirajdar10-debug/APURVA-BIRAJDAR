import React, { useState } from 'react';
import {
  FileText,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Ticket,
  Plane,
  Train,
  Hotel,
  Car,
  Calendar,
  MapPin,
  IndianRupee,
  ShieldCheck,
  Check,
  ArrowRight,
  ClipboardPaste
} from 'lucide-react';
import { Trip, BookingExtraction } from '../types/travel';
import { api } from '../lib/api';

interface BookingImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTrip: Trip | null;
  onBookingSaved?: (updatedTrip: Trip) => void;
}

const SAMPLE_CONFIRMATIONS = [
  {
    label: 'IndiGo Flight Confirmation',
    type: 'flight',
    text: `IndiGo Booking Confirmation
PNR: 6E-8492 | Booking Reference: 6E-DEL-GOI-992
Passenger: Alex Morgan
Flight: 6E-2134 (Airbus A320)
Date: 18 October 2026
Departure: 06:15 AM from Indira Gandhi International Airport (DEL), Terminal 2
Arrival: 08:50 AM at Goa Dabolim International Airport (GOI)
Seat: 14B (Standard)
Total Amount Paid: INR 5,450 (Includes taxes & baggage 15kg)`
  },
  {
    label: 'IRCTC Train Ticket (Rajdhani)',
    type: 'train',
    text: `IRCTC Electronic Reservation Slip (ERS)
PNR: 241-8934102 | Train No & Name: 12952 / MUMBAI RAJDHANI EXPRESS
Quota: General (GN) | Class: AC 3 Tier (3A)
From: NEW DELHI (NDLS) | To: MUMBAI CENTRAL (MMCT)
Date of Journey: 12 June 2026 | Scheduled Dep: 16:55 Hrs
Passenger 1: Alex Morgan, Age 32, Male, Status: CNF / Coach B3 / Berth 27 (Lower Berth)
Ticket Fare: Rs 1,875.00
Transaction ID: 10000492819034`
  },
  {
    label: 'Taj Holiday Village Resort Booking',
    type: 'hotel',
    text: `Taj Holiday Village Resort & Spa, Goa
Booking Confirmation Number: TAJ-GA-90241
Guest Name: Alex Morgan
Check-in: 15 June 2026 (From 02:00 PM)
Check-out: 18 June 2026 (Until 12:00 PM)
Room Type: Deluxe Sea-facing Cottage with Garden Patio
Location: Sinquerim, Candolim, Goa 403515
Rate Summary: 3 Nights @ INR 6,100/night
Total Paid: INR 18,300 (Inclusive of Buffet Breakfast & GST)`
  }
];

export const BookingImportModal: React.FC<BookingImportModalProps> = ({
  isOpen,
  onClose,
  activeTrip,
  onBookingSaved,
}) => {
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');
  const [confirmationText, setConfirmationText] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);

  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  // Extracted booking editable state
  const [extractedData, setExtractedData] = useState<BookingExtraction | null>(null);

  // Attachment options
  const [selectedStopId, setSelectedStopId] = useState<number>(activeTrip?.stops?.[0]?.id || 0);
  const [addToTimeline, setAddToTimeline] = useState<boolean>(true);
  const [addToExpenses, setAddToExpenses] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // File upload reader
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFileBase64(result);
    };
    reader.readAsDataURL(file);
  };

  // Perform Gemini extraction
  const handleRunExtraction = async () => {
    if (inputMode === 'text' && !confirmationText.trim()) {
      setExtractError('Please paste confirmation text or pick one of the sample tickets.');
      return;
    }
    if (inputMode === 'file' && !fileBase64) {
      setExtractError('Please select a PDF or image file first.');
      return;
    }

    try {
      setIsExtracting(true);
      setExtractError(null);

      const payload = inputMode === 'text'
        ? { text: confirmationText }
        : {
            pdfBase64: fileBase64 || undefined,
            mimeType: selectedFile?.type || 'application/pdf',
            fileName: selectedFile?.name
          };

      const res = await api.extractBooking(payload);
      setExtractedData(res.extraction);
    } catch (err: any) {
      console.error('Extraction failed:', err);
      setExtractError(err.message || 'Failed to parse booking with Gemini AI. Please check format.');
    } finally {
      setIsExtracting(false);
    }
  };

  // Save extracted booking
  const handleSaveBooking = async () => {
    if (!extractedData || !activeTrip) return;

    try {
      setIsSaving(true);
      const res = await api.saveBookingToTimeline({
        trip_id: activeTrip.id,
        stop_id: selectedStopId || undefined,
        booking: extractedData,
        add_to_expenses: addToExpenses,
        add_to_timeline: addToTimeline,
      });

      setSaveSuccessMessage('Booking successfully imported to trip & timeline!');
      if (onBookingSaved) {
        onBookingSaved(res.trip);
      }
      setTimeout(() => {
        onClose();
        setSaveSuccessMessage(null);
        setExtractedData(null);
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Failed to save booking');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-indigo-900 via-sky-900 to-indigo-950 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2 text-amber-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>AI Booking & Voucher Parser</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold font-serif-heading">
            Import Booking to {activeTrip?.name || 'Trip'}
          </h2>
          <p className="text-xs text-sky-100 mt-1 max-w-xl">
            Paste an airline email, train ticket confirmation, or hotel voucher (or upload a PDF). Gemini extracts the confirmation number, travel dates, provider, and fare as structured data.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {saveSuccessMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{saveSuccessMessage}</span>
            </div>
          )}

          {!extractedData ? (
            <div className="space-y-4">
              {/* Input Mode Selector */}
              <div className="flex border-b border-slate-200 pb-2 space-x-4">
                <button
                  type="button"
                  onClick={() => setInputMode('text')}
                  className={`pb-1 font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                    inputMode === 'text'
                      ? 'border-b-2 border-sky-600 text-sky-700'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span>Paste Confirmation Text</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInputMode('file')}
                  className={`pb-1 font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                    inputMode === 'file'
                      ? 'border-b-2 border-sky-600 text-sky-700'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload PDF / Voucher</span>
                </button>
              </div>

              {/* Sample Ticket Shortcuts */}
              {inputMode === 'text' && (
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    Or click a sample to try immediately:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {SAMPLE_CONFIRMATIONS.map((sample, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setConfirmationText(sample.text)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-sky-50 hover:border-sky-200 border border-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1"
                      >
                        {sample.type === 'flight' && <Plane className="w-3 h-3 text-sky-600" />}
                        {sample.type === 'train' && <Train className="w-3 h-3 text-amber-600" />}
                        {sample.type === 'hotel' && <Hotel className="w-3 h-3 text-emerald-600" />}
                        <span>{sample.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {inputMode === 'text' ? (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Booking Confirmation Email or Text
                  </label>
                  <textarea
                    rows={8}
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    placeholder="Paste the confirmation email, SMS, or voucher text here... (e.g. IndiGo, IRCTC, Booking.com, Airbnb, MakeMyTrip)"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-2xl bg-slate-50 font-mono text-xs text-slate-800 focus:outline-sky-500 focus:bg-white"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-slate-300 rounded-3xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                    <input
                      type="file"
                      accept=".pdf,image/png,image/jpeg,image/webp"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-800">
                      {selectedFile ? selectedFile.name : 'Click or drag a PDF or image voucher'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Supports IRCTC ticket PDFs, airline boarding passes, and hotel vouchers
                    </p>
                  </div>
                </div>
              )}

              {extractError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{extractError}</span>
                </div>
              )}

              <button
                type="button"
                disabled={isExtracting}
                onClick={handleRunExtraction}
                className="w-full py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-sky-600/20 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isExtracting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Gemini AI is parsing your booking...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Extract Booking with Gemini AI →</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* EDITABLE EXTRACTED BOOKING CARD */
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center space-x-2 text-emerald-900 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Gemini Successfully Extracted Booking Details</span>
                </div>
                <button
                  type="button"
                  onClick={() => setExtractedData(null)}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  Parse Another
                </button>
              </div>

              {/* Editable Fields Grid */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Booking Type</label>
                    <select
                      value={extractedData.type}
                      onChange={(e) => setExtractedData({ ...extractedData, type: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold text-slate-800"
                    >
                      <option value="flight">Flight</option>
                      <option value="train">Train</option>
                      <option value="hotel">Hotel / Stay</option>
                      <option value="rental_car">Car / Vehicle</option>
                      <option value="bus">Bus</option>
                      <option value="activity">Attraction / Activity</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Provider / Carrier</label>
                    <input
                      type="text"
                      value={extractedData.provider}
                      onChange={(e) => setExtractedData({ ...extractedData, provider: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Confirmation / PNR</label>
                    <input
                      type="text"
                      value={extractedData.confirmation_number}
                      onChange={(e) => setExtractedData({ ...extractedData, confirmation_number: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-mono font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Title / Route Summary</label>
                  <input
                    type="text"
                    value={extractedData.title}
                    onChange={(e) => setExtractedData({ ...extractedData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Start Date</label>
                    <input
                      type="date"
                      value={extractedData.start_date}
                      onChange={(e) => setExtractedData({ ...extractedData, start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">End Date</label>
                    <input
                      type="date"
                      value={extractedData.end_date || ''}
                      onChange={(e) => setExtractedData({ ...extractedData, end_date: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Total Amount (₹)</label>
                    <input
                      type="number"
                      value={extractedData.amount}
                      onChange={(e) => setExtractedData({ ...extractedData, amount: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-black text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Location / Hub</label>
                    <input
                      type="text"
                      value={extractedData.location}
                      onChange={(e) => setExtractedData({ ...extractedData, location: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Passenger / Guest Name</label>
                    <input
                      type="text"
                      value={extractedData.passenger_or_guest_name || ''}
                      onChange={(e) => setExtractedData({ ...extractedData, passenger_or_guest_name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Seat / Berth / Room</label>
                    <input
                      type="text"
                      value={extractedData.seat_or_room || ''}
                      onChange={(e) => setExtractedData({ ...extractedData, seat_or_room: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Notes</label>
                  <input
                    type="text"
                    value={extractedData.notes || ''}
                    onChange={(e) => setExtractedData({ ...extractedData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-700"
                  />
                </div>
              </div>

              {/* Target Stop & Sync Options */}
              {activeTrip && (
                <div className="p-4 bg-sky-50 border border-sky-100 rounded-2xl space-y-3">
                  <span className="font-bold text-sky-900 text-xs block">
                    Save to {activeTrip.name}
                  </span>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Attach to Stop</label>
                    <select
                      value={selectedStopId}
                      onChange={(e) => setSelectedStopId(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold text-slate-800"
                    >
                      <option value={0}>General Trip Timeline</option>
                      {activeTrip.stops?.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.city_name}, {s.country} ({s.start_date} - {s.end_date})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <label className="flex items-center space-x-2 cursor-pointer font-medium text-slate-800">
                      <input
                        type="checkbox"
                        checked={addToTimeline}
                        onChange={(e) => setAddToTimeline(e.target.checked)}
                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                      <span>Add as an activity item in the daily itinerary timeline</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer font-medium text-slate-800">
                      <input
                        type="checkbox"
                        checked={addToExpenses}
                        onChange={(e) => setAddToExpenses(e.target.checked)}
                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                      <span>Record ₹{extractedData.amount} automatically into trip budget & expenses</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 cursor-pointer"
          >
            Cancel
          </button>

          {extractedData && (
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveBooking}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save to Bookings & Timeline'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
