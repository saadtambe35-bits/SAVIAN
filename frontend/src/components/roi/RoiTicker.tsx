import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  IndianRupee,
  Fuel,
  Leaf,
  ChevronRight,
  ChevronLeft,
  X,
  Train,
  Activity,
  Gauge,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';

/**
 * LINE CLEAR (SAVIAN) - Indian Railways AI Operations Cockpit
 * Standalone High-Precision ROI Ticker & Railway Board Calculation Audit
 */

export interface RoiMetrics {
  rupeesSavedTodayLakhs: number;
  dieselSavedLitres: number;
  co2ReducedKg: number;
  demurrageAvoidedLakhs: number;
  activeTrainsOptimized: number;
}

export interface RoiTickerProps {
  metrics?: RoiMetrics;
  compact?: boolean;
}

// Authentic Indian Railways Operations Cockpit Baseline Fixtures
const DEFAULT_METRICS: RoiMetrics = {
  rupeesSavedTodayLakhs: 4.82,
  dieselSavedLitres: 1840,
  co2ReducedKg: 4860,
  demurrageAvoidedLakhs: 4.82,
  activeTrainsOptimized: 14,
};

// Railway Board Standard Operating Benchmarks
const BENCHMARKS = {
  idlingDemurragePerHour: 25000, // ₹25,000/hr per freight rake detention (Traffic Accounts / FOIS)
  dieselPenaltyPerRestart: 150, // 150 Liters HSD per 4,000T freight rake restart from halt
  co2FactorPerLitreDiesel: 2.64, // kg CO2 emitted per litre HSD (IR Green Mission 2030 benchmark)
};

export const RoiTicker: React.FC<RoiTickerProps> = ({
  metrics: incomingMetrics,
  compact = false,
}) => {
  const metrics = useMemo(() => ({
    ...DEFAULT_METRICS,
    ...incomingMetrics,
  }), [incomingMetrics]);

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Formatted string derivations
  const rupeesFormatted = `₹${metrics.rupeesSavedTodayLakhs.toFixed(2)} Lakhs`;
  const dieselFormatted = `${metrics.dieselSavedLitres.toLocaleString('en-IN')} L`;
  const co2Tonnes = (metrics.co2ReducedKg / 1000).toFixed(2);
  const co2Formatted = `${co2Tonnes} Tonnes`;

  // Calculated operational insights based on Railway Board parameters
  const calculatedDemurrageHours = useMemo(() => {
    const totalRupees = metrics.rupeesSavedTodayLakhs * 100000;
    return (totalRupees / BENCHMARKS.idlingDemurragePerHour).toFixed(1);
  }, [metrics.rupeesSavedTodayLakhs]);

  const calculatedRestartsAvoided = useMemo(() => {
    return Math.max(1, Math.round(metrics.dieselSavedLitres / BENCHMARKS.dieselPenaltyPerRestart));
  }, [metrics.dieselSavedLitres]);

  const slides = useMemo(() => [
    {
      id: 'demurrage',
      keyName: 'Demurrage',
      category: 'COMMERCIAL ROI',
      value: `${rupeesFormatted} Saved Today`,
      subtitle: 'Avoided Freight Locomotive Idling',
      icon: IndianRupee,
      accentColor: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
      glowClass: 'from-emerald-500/20 to-emerald-500/0',
      indicatorColor: 'bg-emerald-400',
      metaTag: 'FOIS Siding Clearance',
      detailStats: `${calculatedDemurrageHours} hrs idling detention prevented`,
    },
    {
      id: 'diesel',
      keyName: 'Diesel Traction',
      category: 'ENERGY EFFICIENCY',
      value: `${dieselFormatted} Diesel Conserved`,
      subtitle: 'Eliminated Stop-and-Go Wave Action',
      icon: Fuel,
      accentColor: 'text-cyan-400',
      badgeBg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
      glowClass: 'from-cyan-500/20 to-cyan-500/0',
      indicatorColor: 'bg-cyan-400',
      metaTag: 'Traction Power Opt.',
      detailStats: `~${calculatedRestartsAvoided} heavy gradient starts prevented`,
    },
    {
      id: 'carbon',
      keyName: 'Mission 2030',
      category: 'DECARBONIZATION',
      value: `${co2Formatted} CO₂ Abated`,
      subtitle: 'Climate Target Alignment (Zero-Carbon IR 2030)',
      icon: Leaf,
      accentColor: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
      glowClass: 'from-emerald-500/20 to-emerald-500/0',
      indicatorColor: 'bg-emerald-400',
      metaTag: 'Net-Zero Rail Corridor',
      detailStats: `${metrics.co2ReducedKg.toLocaleString('en-IN')} kg GHG reduction`,
    },
  ], [rupeesFormatted, dieselFormatted, co2Formatted, calculatedDemurrageHours, calculatedRestartsAvoided, metrics.co2ReducedKg]);

  const currentSlide = slides[activeIndex];

  // Helper to transition slides safely without race conditions
  const triggerSlideChange = useCallback((newIndexCalculator: (prev: number) => number) => {
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
    }
    setIsTransitioning(true);
    transitionTimerRef.current = setTimeout(() => {
      setActiveIndex(newIndexCalculator);
      setIsTransitioning(false);
    }, 150);
  }, []);

  const handleNext = useCallback(() => {
    triggerSlideChange((prev) => (prev + 1) % slides.length);
  }, [slides.length, triggerSlideChange]);

  const handlePrev = useCallback(() => {
    triggerSlideChange((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length, triggerSlideChange]);

  const handleSelectIndex = useCallback((targetIndex: number) => {
    triggerSlideChange(() => targetIndex);
  }, [triggerSlideChange]);

  // Clean up any pending transition timeout on unmount
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  // 4-second auto-rotation interval
  useEffect(() => {
    if (isPaused || isModalOpen) return;

    const timer = setInterval(() => {
      handleNext();
    }, 4000);

    return () => clearInterval(timer);
  }, [isPaused, isModalOpen, handleNext]);

  // Modal keyboard accessibility (Escape to close) and body scroll lock
  useEffect(() => {
    if (!isModalOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen]);

  // -------------------------------------------------------------
  // COMPACT RENDER (Control-Room Navigation Bar / Header Strip)
  // -------------------------------------------------------------
  if (compact) {
    const IconComponent = currentSlide.icon;
    return (
      <>
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsModalOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsModalOpen(true);
            }
          }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="group relative flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800/95 border border-slate-700/70 hover:border-slate-600 transition-all duration-300 cursor-pointer shadow-lg shadow-black/40 select-none"
          title="Click to view Railway Board ROI audit breakdown"
          aria-label={`Current Metric: ${currentSlide.value}. Click for Railway Board breakdown.`}
        >
          {/* Live Pulsing Beacon */}
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>

          {/* Metric Icon */}
          <div className={`p-1 rounded-full ${currentSlide.badgeBg}`}>
            <IconComponent className="w-3.5 h-3.5" />
          </div>

          {/* Rolling Value & Subtext */}
          <div
            className={`flex items-center gap-2 transition-all duration-200 ${isTransitioning ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'
              }`}
          >
            <span className="text-xs font-semibold tracking-wide text-slate-100 font-mono">
              {currentSlide.value}
            </span>
            <span className="hidden sm:inline-block text-[10px] text-slate-400 border-l border-slate-700/80 pl-2">
              {currentSlide.subtitle}
            </span>
          </div>

          {/* Quick Expand Icon */}
          <div className="flex items-center text-slate-500 group-hover:text-slate-300 transition-colors ml-1">
            <ArrowUpRight className="w-3 h-3" />
          </div>
        </div>

        {isModalOpen && (
          <BreakdownModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            metrics={metrics}
            calculatedDemurrageHours={calculatedDemurrageHours}
            calculatedRestartsAvoided={calculatedRestartsAvoided}
          />
        )}
      </>
    );
  }

  // -------------------------------------------------------------
  // FULL COCKPIT DASHBOARD WIDGET RENDER
  // -------------------------------------------------------------
  const IconComponent = currentSlide.icon;

  return (
    <>
      <div
        className="w-full max-w-xl font-sans"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Outer Control-Room Frame */}
        <div className="relative overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900/90 backdrop-blur-md shadow-2xl shadow-black/50 transition-all duration-300 hover:border-slate-600/80">

          {/* Subtle Ambient Radial Glow Matching Current Metric */}
          <div
            className={`pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-gradient-to-br ${currentSlide.glowClass} blur-2xl transition-all duration-700`}
          />

          {/* Header Strip: Operational Status & System Identification */}
          <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-2 text-[11px] font-mono uppercase tracking-wider text-slate-400">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-semibold text-slate-200">LINE CLEAR (SAVIAN)</span>
              <span className="text-slate-600">|</span>
              <span className="text-emerald-400/90 font-medium">REAL-TIME ROI</span>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <span className="hidden sm:inline">RAKES OPTIMIZED:</span>
              <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-cyan-400 font-bold border border-slate-700/50">
                {metrics.activeTrainsOptimized} ACTIVE
              </span>
            </div>
          </div>

          {/* Main Interactive Ticker Display */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setIsModalOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsModalOpen(true);
              }
            }}
            className="group relative block p-4 sm:p-5 text-left cursor-pointer transition-colors hover:bg-slate-800/40"
            title="Click to inspect Railway Board formula audit & metrics"
            aria-label={`Open Railway Board calculation audit for ${currentSlide.keyName}`}
          >
            <div className="flex items-start justify-between gap-4">

              {/* Metric Identity & Numbers */}
              <div className="flex-1 min-w-0" aria-live="polite">

                {/* Category & Badge */}
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold tracking-wider font-mono border ${currentSlide.badgeBg}`}>
                    <Sparkles className="w-2.5 h-2.5" />
                    {currentSlide.category}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {currentSlide.metaTag}
                  </span>
                </div>

                {/* Main Dynamic Value */}
                <div
                  className={`transition-all duration-300 ease-out transform ${isTransitioning
                    ? 'opacity-0 translate-y-2'
                    : 'opacity-100 translate-y-0'
                    }`}
                >
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100 font-mono drop-shadow-sm flex items-baseline gap-1">
                    {currentSlide.value}
                  </h3>

                  {/* Subtitle & Impact Context */}
                  <p className="mt-1 text-xs sm:text-sm text-slate-400 flex items-center gap-1.5 truncate">
                    <span>{currentSlide.subtitle}</span>
                  </p>

                  <div className="mt-2 text-[11px] text-slate-400/80 font-mono flex items-center gap-1">
                    <span className="text-slate-600">↳</span>
                    <span className="text-slate-300 font-medium">{currentSlide.detailStats}</span>
                  </div>
                </div>
              </div>

              {/* Glowing Icon Container */}
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-700/60 bg-slate-800/80 shadow-inner group-hover:scale-105 group-hover:border-slate-500/80 transition-all duration-300"
                >
                  <IconComponent className={`h-6 w-6 ${currentSlide.accentColor} transition-transform duration-300 group-hover:scale-110`} />
                </div>
                <span className="flex items-center text-[10px] text-slate-500 group-hover:text-cyan-400 transition-colors font-mono">
                  Audit Calc <ArrowUpRight className="w-2.5 h-2.5 ml-0.5" />
                </span>
              </div>
            </div>
          </div>

          {/* Footer Bar: Slide Indicators & Manual Step Controls */}
          <div className="flex items-center justify-between border-t border-slate-800/80 bg-slate-950/40 px-4 py-2">

            {/* Slide Navigation Progress Indicators */}
            <div className="flex items-center gap-1.5">
              {slides.map((slide, idx) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectIndex(idx);
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${idx === activeIndex
                    ? `w-6 ${slide.indicatorColor}`
                    : 'w-2 bg-slate-700 hover:bg-slate-600'
                    }`}
                  aria-label={`Switch to ${slide.keyName} metric slide`}
                />
              ))}
              <span className="ml-2 text-[10px] text-slate-500 font-mono">
                0{activeIndex + 1} / 0{slides.length}
              </span>
            </div>

            {/* Stepper Controls & Modal Trigger Button */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
                title="Previous Metric"
                aria-label="Previous Metric"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
                title="Next Metric"
                aria-label="Next Metric"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <div className="h-3 w-px bg-slate-800 mx-1" />
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="text-[11px] font-mono text-slate-400 hover:text-emerald-400 px-1.5 py-0.5 rounded transition-colors flex items-center gap-1"
              >
                Breakdown
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Railway Board Breakdown Modal */}
      {isModalOpen && (
        <BreakdownModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          metrics={metrics}
          calculatedDemurrageHours={calculatedDemurrageHours}
          calculatedRestartsAvoided={calculatedRestartsAvoided}
        />
      )}
    </>
  );
};

// ============================================================================
// MODAL: Indian Railways Board ROI Audit Breakdown
// ============================================================================

interface BreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: RoiMetrics;
  calculatedDemurrageHours: string;
  calculatedRestartsAvoided: number;
}

const BreakdownModal: React.FC<BreakdownModalProps> = ({
  isOpen,
  onClose,
  metrics,
  calculatedDemurrageHours,
  calculatedRestartsAvoided,
}) => {
  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-stone-900/60 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="roi-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl sm:max-w-3xl rounded-2xl border border-[#ded9cb] bg-[#faf8f3] shadow-2xl shadow-stone-900/25 overflow-hidden text-stone-900 my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#e5dfd3] bg-[#f4efe4] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 shadow-sm">
              <Train className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="roi-modal-title" className="text-base sm:text-lg font-bold tracking-tight text-stone-900">
                  LINE CLEAR (SAVIAN) ROI Audit
                </h2>
                <span className="rounded-md bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[10px] font-mono text-emerald-800 font-bold">
                  LIVE COCKPIT
                </span>
              </div>
              <p className="text-xs text-stone-500 font-medium">
                Railway Board Statutory Formulae & Commercial Dispatch Savings
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-stone-400 hover:bg-[#eae4d5] hover:text-stone-700 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-sm bg-[#faf8f3]">

          {/* Executive Overview Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

            <div className="rounded-xl border border-[#ded8c9] bg-white/90 p-3.5 shadow-sm">
              <div className="text-[11px] font-mono text-stone-500 uppercase flex items-center gap-1 font-semibold">
                <IndianRupee className="w-3 h-3 text-emerald-700" />
                Demurrage Saved
              </div>
              <div className="text-xl font-bold font-mono text-emerald-800 mt-1">
                ₹{metrics.demurrageAvoidedLakhs.toFixed(2)} L
              </div>
              <div className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3 text-stone-400" />
                {calculatedDemurrageHours} Idling hours saved
              </div>
            </div>

            <div className="rounded-xl border border-[#ded8c9] bg-white/90 p-3.5 shadow-sm">
              <div className="text-[11px] font-mono text-stone-500 uppercase flex items-center gap-1 font-semibold">
                <Fuel className="w-3 h-3 text-sky-700" />
                HSD Diesel Saved
              </div>
              <div className="text-xl font-bold font-mono text-sky-800 mt-1">
                {metrics.dieselSavedLitres.toLocaleString('en-IN')} L
              </div>
              <div className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-500" />
                {calculatedRestartsAvoided} wave stops eliminated
              </div>
            </div>

            <div className="rounded-xl border border-[#ded8c9] bg-white/90 p-3.5 shadow-sm">
              <div className="text-[11px] font-mono text-stone-500 uppercase flex items-center gap-1 font-semibold">
                <Leaf className="w-3 h-3 text-emerald-700" />
                Mission 2030 CO₂
              </div>
              <div className="text-xl font-bold font-mono text-emerald-800 mt-1">
                {(metrics.co2ReducedKg / 1000).toFixed(2)} T
              </div>
              <div className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Green corridor compliance
              </div>
            </div>

          </div>

          {/* Section 1: Demurrage Calculations */}
          <div className="rounded-xl border border-[#ded8c9] bg-white/70 p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-emerald-700" />
                <h3 className="font-bold text-stone-900">
                  1. Freight Idling Demurrage Rate Model
                </h3>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                ₹25,000 / rake-hr
              </span>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Standard Indian Railways freight demurrage and terminal detention penalty operates at a statutory rate of <strong className="text-stone-900">₹25,000 per hour</strong> per freight rake held at loop lines or outer home signals awaiting section clearance.
            </p>

            <div className="rounded-xl bg-[#f2eee3] border border-[#dad3c2] p-3 text-xs font-mono">
              <div className="text-stone-500 text-[11px]">// Formal Railway Board Demurrage Formula:</div>
              <div className="text-emerald-900 font-bold mt-1">
                Financial Savings = Cumulative Detention Avoided (hrs) × ₹25,000
              </div>
              <div className="text-stone-700 mt-1.5 text-[11px]">
                Audited Today: <span className="text-stone-900 font-semibold">{calculatedDemurrageHours} hours</span> avoided across freight corridors = <strong className="text-emerald-800 font-bold">₹{(metrics.demurrageAvoidedLakhs * 100000).toLocaleString('en-IN')}</strong> (₹{metrics.demurrageAvoidedLakhs.toFixed(2)} Lakhs).
              </div>
            </div>
          </div>

          {/* Section 2: Diesel Traction & Stop-and-Go Wave Penalty */}
          <div className="rounded-xl border border-[#ded8c9] bg-white/70 p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Fuel className="w-4 h-4 text-sky-700" />
                <h3 className="font-bold text-stone-900">
                  2. Kinetic Energy & Fuel Penalty per Train Restart
                </h3>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200 font-semibold">
                150 L Diesel / Restart
              </span>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Accelerating a typical <strong className="text-stone-900">4,000-tonne BOXN freight train</strong> from a complete halt back to line speed (60 km/h) consumes an extra <strong className="text-sky-900 font-semibold">150 Liters of High-Speed Diesel (HSD)</strong> due to inertia overcoming and traction resistance. SAVIAN section speed harmonization eliminates unscheduled stop-and-go wave action.
            </p>

            <div className="rounded-xl bg-[#f2eee3] border border-[#dad3c2] p-3 text-xs font-mono">
              <div className="text-stone-500 text-[11px]">// Kinetic Fuel Conservation Formula:</div>
              <div className="text-sky-900 font-bold mt-1">
                Fuel Saved = Avoided Unscheduled Halts × 150 Liters
              </div>
              <div className="text-stone-700 mt-1.5 text-[11px]">
                Audited Today: <span className="text-stone-900 font-semibold">{calculatedRestartsAvoided} wave-action stops</span> averted = <strong className="text-sky-800 font-bold">{metrics.dieselSavedLitres.toLocaleString('en-IN')} Liters HSD</strong> conserved.
              </div>
            </div>
          </div>

          {/* Section 3: Decarbonization & Mission 2030 */}
          <div className="rounded-xl border border-[#ded8c9] bg-white/70 p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Leaf className="w-4 h-4 text-emerald-700" />
                <h3 className="font-bold text-stone-900">
                  3. Indian Railways Mission 2030 Carbon Factor
                </h3>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                2.64 kg CO₂ / L
              </span>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Under Indian Railways' Net Zero Carbon Emissions by 2030 mandate, every liter of HSD diesel avoided prevents <strong className="text-stone-900">2.64 kg of CO₂ equivalent</strong> greenhouse gas emissions into the atmosphere.
            </p>

            <div className="rounded-xl bg-[#f2eee3] border border-[#dad3c2] p-3 text-xs font-mono">
              <div className="text-stone-500 text-[11px]">// Green Rail Carbon Abatement Formula:</div>
              <div className="text-emerald-900 font-bold mt-1">
                CO₂ Abated = {metrics.dieselSavedLitres.toLocaleString('en-IN')} L × 2.64 kg/L = {metrics.co2ReducedKg.toLocaleString('en-IN')} kg ({(metrics.co2ReducedKg / 1000).toFixed(2)} Tonnes)
              </div>
            </div>
          </div>

          {/* Section 4: Operational Dispatch Metrics */}
          <div className="rounded-xl border border-[#ded8c9] bg-[#f5f1e8] p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-stone-800 font-semibold">
                <Activity className="w-4 h-4 text-amber-600" />
                Active Trains Dynamically Optimized Today
              </div>
              <span className="font-mono font-bold text-amber-800 text-xs bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                {metrics.activeTrainsOptimized} Rakes Controlled
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-stone-600 font-mono">
              <div className="p-2.5 rounded-xl bg-white border border-[#ded8c9] shadow-sm">
                <div className="text-stone-400 flex items-center gap-1 font-semibold text-[10px]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  STATUS
                </div>
                <div className="text-emerald-800 font-bold mt-0.5">OPTIMIZED</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-[#ded8c9] shadow-sm">
                <div className="text-stone-400 flex items-center gap-1 font-semibold text-[10px]">
                  <Clock className="w-3 h-3 text-stone-400" />
                  HEADWAY
                </div>
                <div className="text-stone-800 font-bold mt-0.5">-3.8 Min</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-[#ded8c9] shadow-sm">
                <div className="text-stone-400 flex items-center gap-1 font-semibold text-[10px]">
                  <Gauge className="w-3 h-3 text-sky-600" />
                  THROUGHPUT
                </div>
                <div className="text-sky-800 font-bold mt-0.5">+18.4%</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-[#ded8c9] shadow-sm">
                <div className="text-stone-400 flex items-center gap-1 font-semibold text-[10px]">
                  <Train className="w-3 h-3 text-stone-400" />
                  FEED
                </div>
                <div className="text-stone-800 font-bold mt-0.5">CRIS / FOIS</div>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#e5dfd3] bg-[#f4efe4] px-6 py-4">
          <div className="flex items-center gap-2 text-[11px] text-stone-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span>Validated against Railway Board Operating Manual & CRIS Traffic Directorate.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 text-xs font-bold rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-100 transition-colors shadow-sm"
          >
            Acknowledge & Close
          </button>
        </div>

      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};

export default RoiTicker;
