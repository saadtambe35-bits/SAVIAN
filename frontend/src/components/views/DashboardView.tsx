import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Layers,
  Sparkles,
  TrendingDown,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  CheckCircle2,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BlockDemand, SolverResult } from '@/types';
import { MOCK_DEMANDS, MOCK_SOLVER_RESULT } from '@/data/mockData';
import { formatMinutesToTime } from '@/lib/utils';
import { TrackStripMap } from '@/components/cockpit/TrackStripMap';
import { WeatherTsrEngine } from '@/components/weather/WeatherTsrEngine';
import { useTranslation } from '@/i18n/LanguageContext';
import { RollingNumber } from '@/components/common/RollingNumber';

interface DashboardViewProps {
  chaosMode: boolean;
  onRunSolver: () => void;
  solverStatus: 'idle' | 'solving' | 'done';
  onNavigate: (view: 'dashboard' | 'demands' | 'solver' | 'lifecycle' | 'settings') => void;
  demands?: BlockDemand[];
  solverResult?: SolverResult;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  chaosMode,
  onRunSolver,
  solverStatus,
  onNavigate,
  demands = MOCK_DEMANDS,
  solverResult = MOCK_SOLVER_RESULT,
}) => {
  const { t } = useTranslation();
  const criticalCount = demands.filter((d) => d.severity_tier === 'CRITICAL').length;
  const reviewedCount = demands.filter((d) => d.status === 'REVIEWED').length;
  const approvedCount = demands.filter((d) => d.status === 'APPROVED').length;

  const totalShadowSaved = solverResult.xai?.shadow_detections?.reduce(
    (acc, s) => acc + s.time_saved_hours,
    0
  ) || 3.5;

  const [activeIncident, setActiveIncident] = useState<{
    id: string;
    label: string;
    title: string;
    location: string;
    tsr: string;
  } | null>(null);

  const handleReoptimize = () => {
    setActiveIncident(null);
    onRunSolver();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Disruption Simulator Banner with smooth drop-down Framer Motion transition & looping amber glow */}
      <AnimatePresence>
        {chaosMode && (
          <motion.div
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-amber-300/80 bg-gradient-to-r from-amber-100/90 via-[#fcfbf7] to-amber-50/80 p-4 shadow-[0_6px_20px_rgba(245,158,11,0.18)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3.5">
                  <div className="rounded-2xl bg-amber-200/90 p-2.5 text-amber-800 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] border border-amber-300">
                    <Zap className="h-5 w-5 animate-bounce text-amber-900" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-950 font-sans">
                      Corridor Disruption Simulator Active (Chaos Mode)
                    </h3>
                    <p className="text-xs text-amber-800/90 font-medium">
                      Simulating freight train slowdown, speed restrictions, and sudden P-Way emergency tamping demands.
                    </p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: '0 4px 14px rgba(180,83,9,0.35)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleReoptimize}
                  disabled={solverStatus === 'solving'}
                  className={`inline-flex items-center justify-center text-xs font-bold bg-gradient-to-r from-amber-700 to-amber-800 text-white px-4 py-2 rounded-xl shadow-[0_3px_10px_rgba(180,83,9,0.25)] shrink-0 border border-amber-900/40 ${
                    activeIncident ? 'ring-2 ring-rose-500 animate-pulse' : ''
                  }`}
                >
                  <Play className="mr-1.5 h-3.5 w-3.5 fill-current" />
                  {t('reoptimize') || 'Re-optimize Corridor'}
                </motion.button>
              </div>

              {/* Interactive Realistic Railway Incident Injector Chips */}
              <div className="mt-3 pt-3 border-t border-amber-200/80 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-[10px] font-bold uppercase text-amber-900 font-mono mr-1">
                    Inject Field Incident:
                  </span>
                  {[
                    {
                      id: 'ohe',
                      label: '⚡ OHE Wire Snag (MDDP)',
                      title: 'OHE Pantograph Entanglement at Mandideep',
                      location: 'MDDP (km 114.2)',
                      tsr: 'Power Cut / Diesel Haulage Only',
                    },
                    {
                      id: 'fracture',
                      label: '🛤️ USFD Rail Fracture (BNS)',
                      title: 'Ultrasonic Flaw Detector Fracture at Vidisha',
                      location: 'BNS (km 61.9)',
                      tsr: 'TSR 20 km/h Imposed',
                    },
                    {
                      id: 'point',
                      label: '🚨 Point Clashing (BINA)',
                      title: 'Facing Point Lock Clashing at Bina Yard',
                      location: 'BINA (km 8.0)',
                      tsr: 'Platform 3 Blocked',
                    },
                  ].map((inc) => (
                    <button
                      key={inc.id}
                      type="button"
                      onClick={() => setActiveIncident(inc)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all border ${
                        activeIncident?.id === inc.id
                          ? 'bg-amber-950 text-amber-100 border-amber-950 shadow-sm'
                          : 'bg-white/80 hover:bg-white text-amber-900 border-amber-300 shadow-xs'
                      }`}
                    >
                      {inc.label}
                    </button>
                  ))}
                </div>

                {activeIncident && (
                  <div className="flex items-center gap-2 text-xs text-rose-900 font-bold bg-rose-100/90 px-3 py-1 rounded-xl border border-rose-300 animate-pulse">
                    <span>🚨 {activeIncident.title} • {activeIncident.tsr}</span>
                    <button
                      type="button"
                      onClick={() => setActiveIncident(null)}
                      className="text-rose-500 hover:text-rose-900 ml-1 font-extrabold"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero KPI Cards (4 Grid Columns) - Neumorphic with count-up & hover elevation */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Demands -> Navigates to Demands */}
        <motion.div
          whileHover={{ y: -3 }}
          onClick={() => onNavigate('demands')}
          title="Click to manage and review corridor demands"
          className="skin-glass-card skin-glass-elevated specular-sheen glass-specular-shimmer tactile-spring group cursor-pointer rounded-2xl p-4 flex flex-col justify-between transition-all hover:border-sky-400/50 hover:shadow-[0_12px_28px_-6px_rgba(14,165,233,0.18)]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">{t('total_demands')}</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="rounded-xl bg-sky-500/10 p-2 text-sky-700 border border-sky-300/40 shadow-xs group-hover:scale-105 transition-transform backdrop-blur-xs">
              <Activity className="h-4 w-4 text-sky-600" />
            </div>
          </div>

          <div className="mt-2.5 flex items-end justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black tracking-tight text-stone-900 font-mono">
                  <RollingNumber value={demands.length} />
                </span>
                <span className="cockpit-dark-chip text-[10px] font-mono font-bold border-sky-500/40 aura-breathe-sky" style={{ animationDelay: '0s' }}>
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-400 led-glow-sky" />
                  <span className="text-[#38bdf8]">Active Demands</span>
                </span>
              </div>
              <div className="mt-2 text-[11px] text-stone-500 font-medium">
                Critical: <strong className="text-rose-600">{criticalCount}</strong> &nbsp;Reviewed: <strong>{reviewedCount}</strong> &nbsp;Approved: <strong className="text-emerald-700">{approvedCount}</strong>
              </div>
            </div>

            {/* Blue SVG Sparkline */}
            <svg className="w-16 h-8 text-sky-600 flex-shrink-0 self-end overflow-visible drop-shadow-xs" viewBox="0 0 70 30" fill="none">
              <path
                d="M 6 22 Q 20 8, 36 19 T 62 10"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="62" cy="10" r="3" fill="currentColor" />
            </svg>
          </div>
        </motion.div>

        {/* Card 2: Shadow Block Savings -> Navigates to Solver */}
        <motion.div
          whileHover={{ y: -3 }}
          onClick={() => onNavigate('solver')}
          title="Click to view shadow block optimization cockpit"
          className="skin-glass-card skin-glass-elevated specular-sheen glass-specular-shimmer tactile-spring group cursor-pointer rounded-2xl p-4 flex flex-col justify-between transition-all hover:border-emerald-400/50 hover:shadow-[0_12px_28px_-6px_rgba(7,138,104,0.18)]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">{t('shadow_savings')}</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-700 border border-emerald-300/40 shadow-xs group-hover:scale-105 transition-transform backdrop-blur-xs">
              <Layers className="h-4 w-4 text-emerald-600" />
            </div>
          </div>

          <div className="mt-2.5 flex items-end justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black tracking-tight text-emerald-800 font-mono">
                  <RollingNumber value={totalShadowSaved} suffix=" hrs" />
                </span>
                <span className="cockpit-dark-chip text-[10px] font-mono font-bold text-emerald-300 border-emerald-500/30 aura-breathe-emerald" style={{ animationDelay: '0s' }}>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 led-glow-emerald" />
                  <RollingNumber value={solverResult.shadow_merges} suffix=" Merges" />
                </span>
              </div>
              <p className="mt-2 text-[11px] text-stone-500 font-medium leading-tight">
                Co-aligning OHE & S&T under P-Way possessions
              </p>
            </div>

            {/* Emerald SVG Sparkline */}
            <svg className="w-16 h-8 text-emerald-600 flex-shrink-0 self-end overflow-visible drop-shadow-xs" viewBox="0 0 70 30" fill="none">
              <path
                d="M 6 24 Q 22 22, 38 14 T 62 8"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="62" cy="8" r="3" fill="currentColor" />
            </svg>
          </div>
        </motion.div>

        {/* Card 3: Train Delay Impact -> Navigates to Solver */}
        <motion.div
          whileHover={{ y: -3 }}
          onClick={() => onNavigate('solver')}
          title="Click to view train punctuality & delay reasoning"
          className="skin-glass-card skin-glass-elevated specular-sheen glass-specular-shimmer tactile-spring group cursor-pointer rounded-2xl p-4 flex flex-col justify-between transition-all hover:border-indigo-400/50 hover:shadow-[0_12px_28px_-6px_rgba(99,102,241,0.18)]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">{t('train_delay_impact')}</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="rounded-xl bg-indigo-500/10 p-2 text-indigo-700 border border-indigo-300/40 shadow-xs group-hover:scale-105 transition-transform backdrop-blur-xs">
              <TrendingDown className="h-4 w-4 text-indigo-600" />
            </div>
          </div>

          <div className="mt-2.5 flex items-end justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black tracking-tight text-stone-900 font-mono">
                  <RollingNumber value={5.2} suffix=" min" />
                </span>
                <span className="cockpit-dark-chip whitespace-nowrap flex-shrink-0 text-[10px] font-mono font-bold border-violet-500/40 aura-breathe-violet" style={{ animationDelay: '0s' }}>
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400 led-glow-violet" />
                  <span className="text-[#a78bfa]">-62% vs manual</span>
                </span>
              </div>
              <p className="mt-2 text-[11px] text-stone-500 font-medium leading-tight">
                Punctuality preserved across passenger slots
              </p>
            </div>

            {/* Indigo SVG Sparkline */}
            <svg className="w-16 h-8 text-indigo-600 flex-shrink-0 self-end overflow-visible drop-shadow-xs" viewBox="0 0 70 30" fill="none">
              <path
                d="M 6 10 Q 20 24, 38 15 T 62 20"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="62" cy="20" r="3" fill="currentColor" />
            </svg>
          </div>
        </motion.div>

        {/* Card 4: Kavach Commissioned -> Navigates to Settings */}
        <motion.div
          whileHover={{ y: -3 }}
          onClick={() => onNavigate('settings')}
          title="Click to view Kavach safety parameters"
          className="skin-glass-card skin-glass-elevated specular-sheen glass-specular-shimmer tactile-spring group cursor-pointer rounded-2xl p-4 flex flex-col justify-between transition-all border-rose-300/30 hover:border-rose-400/60 hover:shadow-[0_12px_28px_-6px_rgba(244,63,94,0.22)]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">{t('kavach_commissioned')}</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="rounded-xl bg-rose-500/10 p-2 text-rose-700 border border-rose-300/40 shadow-xs group-hover:scale-105 transition-transform backdrop-blur-xs">
              <ShieldCheck className="h-4 w-4 text-rose-500" />
            </div>
          </div>

          <div className="mt-2.5 flex items-end justify-between gap-2">
            <div className="min-w-0">
              {/* Row 1: big number + ARMED chip side by side */}
              <div className="flex items-center gap-2">
                <span className="text-3xl font-black tracking-tight text-rose-800 font-mono">
                  <RollingNumber value={98.7} suffix=" km" />
                </span>
                {/* ARMED chip — rose/red, synced to shared chip-breathe clock */}
                <span className="cockpit-dark-chip text-[10px] font-mono font-bold border-rose-500/40 aura-breathe-rose" style={{ animationDelay: '0s' }}>
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400 led-glow-rose" />
                  <span className="text-[#fb7185]">ARMED</span>
                </span>
              </div>
              {/* Row 2: out-of target km in muted text */}
              <span className="text-xs text-stone-400 font-mono font-semibold">/ 152.4 km</span>
              <p className="mt-1.5 text-[11px] text-stone-500 font-medium leading-tight">
                Dynamic braking model active on 8 stations
              </p>
            </div>

            {/* Rose SVG Sparkline */}
            <svg className="w-16 h-8 text-rose-500 flex-shrink-0 self-end overflow-visible drop-shadow-xs" viewBox="0 0 70 30" fill="none">
              <path
                d="M 6 20 Q 22 7, 40 17 T 62 10"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="62" cy="10" r="3" fill="currentColor" />
            </svg>
          </div>
        </motion.div>
      </div>

      {/* Centerpiece: Bina–Itarsi Strip Map */}
      <TrackStripMap />

      {/* Dynamic IMD Weather Radar & TSR Engine */}
      <div className="pt-1">
        <WeatherTsrEngine />
      </div>

      {/* Bottom Operational Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Card (2/3 width) - Granted Maintenance Blocks */}
        <div className="lg:col-span-2 skin-glass-card specular-sheen rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200/60">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-700 border border-emerald-300/40">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 font-sans tracking-tight">
                  Granted Maintenance Blocks
                </h3>
                <p className="text-[11px] text-stone-500">Live corridor possession authorizations</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('demands')}
              className="text-xs text-stone-700 bg-white/60 hover:bg-white border-stone-300/60 rounded-xl font-bold transition-all shadow-xs"
            >
              View All Demands ↗
            </Button>
          </div>

          <div className="space-y-3">
            {demands.slice(0, 3).map((demand) => (
              <div
                key={demand.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl skin-glass-sub p-3.5 border border-stone-200 hover:border-emerald-500/60 shadow-xs hover:shadow-md transition-all gap-3 group"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-stone-900">
                      {demand.demand_code}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-sky-50 text-sky-800 border-sky-300 font-bold"
                    >
                      {demand.department}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-rose-50 text-rose-800 border-rose-300 font-bold"
                    >
                      {demand.severity_tier}
                    </Badge>
                  </div>
                  <p className="text-xs text-stone-700 font-medium">
                    {demand.activity_description}
                  </p>
                  <p className="text-[11px] text-stone-500 font-mono">
                    Section: {demand.section_from} – {demand.section_to} (km {demand.start_km} – {demand.end_km})
                  </p>
                </div>

                <div className="flex sm:flex-col items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-stone-200/50">
                  <div className="font-mono text-xs text-stone-900 font-bold bg-white/90 px-3 py-1 rounded-lg shadow-xs border border-stone-200/70">
                    {formatMinutesToTime(demand.requested_start_minutes)} – {formatMinutesToTime(demand.requested_end_minutes)}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-1 font-medium">
                    Duration: <span className="text-stone-800 font-mono font-bold">{demand.required_minutes}m</span>
                  </div>
                  <div className="text-[10px] text-emerald-700 font-mono font-bold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Trust: {demand.trust_score}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Card (1/3 width) - AI Conflict Reasoning (XAI) */}
        <div className="skin-glass-card specular-sheen rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200/60">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-700 border border-emerald-300/40">
                <Sparkles className="h-4 w-4 text-emerald-600" />
              </div>
              <h3 className="text-sm font-bold text-stone-900 font-sans tracking-tight">
                AI Conflict Reasoning (XAI)
              </h3>
            </div>
            <span className="cockpit-dark-chip text-[10px] font-mono font-bold text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 led-glow-emerald" />
              CP-SAT
            </span>
          </div>

          <div className="space-y-3">
            {MOCK_SOLVER_RESULT.xai.conflict_resolutions.map((res, idx) => (
              <div
                key={idx}
                className="rounded-xl skin-glass-sub p-3 space-y-1.5 hover:border-amber-400/40 transition-all"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-stone-900">
                    {res.block_id}
                  </span>
                  <span className="cockpit-dark-amber text-[10px] font-bold">
                    {res.shifted_minutes > 0 ? `+${res.shifted_minutes}m shift` : `${res.shifted_minutes}m shift`}
                  </span>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed font-medium">
                  {res.reason}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-2 space-y-2.5">
            <div className="text-xs font-bold text-stone-700">
              Constraint Satisfaction Breakdown
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <div className="flex justify-between text-[11px] text-stone-600 mb-1 font-semibold">
                  <span>Train Punctuality Priority</span>
                  <span className="font-mono font-bold text-emerald-700">87.6%</span>
                </div>
                <div className="h-2 w-full bg-stone-200/50 rounded-full overflow-hidden skin-glass-inset">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full w-[87.6%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-stone-600 mb-1 font-semibold">
                  <span>Shadow Opportunity Harvest</span>
                  <span className="font-mono font-bold text-sky-700">92.0%</span>
                </div>
                <div className="h-2 w-full bg-stone-200/50 rounded-full overflow-hidden skin-glass-inset">
                  <div className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full w-[92%]" />
                </div>
              </div>
            </div>
          </div>

          <Button
            className="w-full text-xs bg-stone-900 hover:bg-stone-800 text-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.15)] font-bold py-2.5 transition-all"
            onClick={() => onNavigate('solver')}
          >
            Launch AI Solver Console
          </Button>
        </div>
      </div>
    </div>
  );
};
