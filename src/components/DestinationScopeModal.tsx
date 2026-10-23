import React from 'react';
import { Globe, MapPin, Compass, ArrowRight, X, Sparkles, Building2, Trees, Landmark } from 'lucide-react';

interface DestinationScopeModalProps {
  isOpen: boolean;
  onSelectScope: (scope: 'national' | 'international') => void;
  onClose?: () => void;
  initialScope?: 'national' | 'international';
  title?: string;
  subtitle?: string;
  description?: string;
}

export const DestinationScopeModal: React.FC<DestinationScopeModalProps> = ({
  isOpen,
  onSelectScope,
  onClose,
  initialScope,
  title = 'Where are you traveling?',
  subtitle,
  description,
}) => {
  const displaySubtitle = description || subtitle || 'Choose your destination scope to discover tailored cities, routes, and experiences.';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-slate-50">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-md bg-sky-100 text-sky-800 text-[10px] font-bold uppercase tracking-wider">
                Destination Scope
              </span>
              <span className="text-xs text-slate-500 font-medium">Step 1 of 2</span>
            </div>
            <h2 className="text-xl font-bold font-serif-heading text-slate-900 mt-1">
              {title}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {displaySubtitle}
            </p>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Close"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Two Distinct Selection Cards */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* OPTION 1: NATIONAL (INDIA) */}
          <button
            type="button"
            onClick={() => onSelectScope('national')}
            className={`group relative text-left p-5 rounded-2xl border-2 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between ${
              initialScope === 'national'
                ? 'border-amber-500 bg-gradient-to-b from-amber-50/70 via-white to-orange-50/40 ring-2 ring-amber-400/40 shadow-sm'
                : 'border-amber-200/90 hover:border-amber-500 bg-gradient-to-b from-amber-50/50 via-white to-orange-50/30'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center text-2xl shadow-sm group-hover:scale-105 transition-transform">
                  🇮🇳
                </div>
                <div className="flex items-center space-x-1.5">
                  {initialScope === 'national' && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                      Active Filter
                    </span>
                  )}
                  <span className="px-2.5 py-1 rounded-full bg-amber-100/80 text-amber-900 text-[11px] font-bold border border-amber-200/60">
                    Domestic (India)
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-amber-800 transition-colors font-serif-heading">
                  National (India)
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Explore royal heritage forts in Rajasthan, tranquil Kerala backwaters, majestic Himalayan valleys, and sacred riverside ghats.
                </p>
              </div>

              {/* Sample Destinations */}
              <div className="pt-2 border-t border-amber-100/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block mb-1.5">
                  Top Destinations Included:
                </span>
                <div className="flex flex-wrap gap-1 text-[11px] text-slate-700">
                  <span className="bg-white px-2 py-0.5 rounded-md border border-amber-200/70 font-medium">New Delhi</span>
                  <span className="bg-white px-2 py-0.5 rounded-md border border-amber-200/70 font-medium">Mumbai</span>
                  <span className="bg-white px-2 py-0.5 rounded-md border border-amber-200/70 font-medium">Jaipur</span>
                  <span className="bg-white px-2 py-0.5 rounded-md border border-amber-200/70 font-medium">Goa</span>
                  <span className="bg-white px-2 py-0.5 rounded-md border border-amber-200/70 font-medium">Bengaluru</span>
                  <span className="bg-white px-2 py-0.5 rounded-md border border-amber-200/70 font-medium">Udaipur</span>
                  <span className="bg-white px-2 py-0.5 rounded-md border border-amber-200/70 font-medium">Varanasi</span>
                  <span className="bg-white px-2 py-0.5 rounded-md border border-amber-200/70 font-medium">Manali</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-amber-100 flex items-center justify-between text-xs font-bold text-amber-800 group-hover:text-amber-900">
              <span>Select National Itinerary</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* OPTION 2: INTERNATIONAL */}
          <button
            type="button"
            onClick={() => onSelectScope('international')}
            className={`group relative text-left p-5 rounded-2xl border-2 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between ${
              initialScope === 'international'
                ? 'border-sky-500 bg-gradient-to-b from-sky-50/70 via-white to-indigo-50/40 ring-2 ring-sky-400/40 shadow-sm'
                : 'border-sky-200/90 hover:border-sky-500 bg-gradient-to-b from-sky-50/50 via-white to-indigo-50/30'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center text-xl shadow-sm group-hover:scale-105 transition-transform">
                  <Globe className="w-6 h-6" />
                </div>
                <div className="flex items-center space-x-1.5">
                  {initialScope === 'international' && (
                    <span className="px-2 py-0.5 rounded-full bg-sky-600 text-white text-[10px] font-bold">
                      Active Filter
                    </span>
                  )}
                  <span className="px-2.5 py-1 rounded-full bg-sky-100/80 text-sky-900 text-[11px] font-bold border border-sky-200/60">
                    Global Capitals
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-sky-800 transition-colors font-serif-heading">
                  International
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Discover European grand capitals, futuristic Japanese skylines, Swiss Alpine vistas, desert wonders, and iconic overseas sights.
                </p>
              </div>

              {/* Sample Destinations */}
              <div className="pt-2 border-t border-sky-100/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 block mb-1.5">
                  Top Destinations Included:
                </span>
                <div className="flex flex-wrap gap-1 text-[11px] text-slate-700">
                  <span className="bg-white px-2 py-0.5 rounded-md border border-sky-200/70 font-medium">Paris</span>
                  <span className="bg-white px-2 py-0.5 rounded-md border border-sky-200/70 font-medium">Tokyo</span>
                  <span className="bg-white px-2 py-0.5 rounded-md border border-sky-200/70 font-medium">London</span>
                  <span className="bg-white px-2 py-0.5 rounded-md border border-sky-200/70 font-medium">Rome</span>
                  <span className="bg-white px-2 py-0.5 rounded-md border border-sky-200/70 font-medium">Zurich</span>
                  <span className="bg-white px-2 py-0.5 rounded-md border border-sky-200/70 font-medium">Barcelona</span>
                  <span className="bg-white px-2 py-0.5 rounded-md border border-sky-200/70 font-medium">Dubai</span>
                  <span className="bg-white px-2 py-0.5 rounded-md border border-sky-200/70 font-medium">New York</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-sky-100 flex items-center justify-between text-xs font-bold text-sky-800 group-hover:text-sky-900">
              <span>Select International Itinerary</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>

        {/* Footer info notice */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-500">
          All city suggestions, interactive map pins, and attraction recommendations will automatically adapt to your chosen scope. You can switch between National and International anytime.
        </div>
      </div>
    </div>
  );
};
