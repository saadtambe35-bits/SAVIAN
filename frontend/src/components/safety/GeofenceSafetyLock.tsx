import React, { useState, useMemo } from 'react';
import {
  Lock,
  Unlock,
  ShieldAlert,
  ShieldCheck,
  AlertOctagon,
  MapPin,
  Users,
  User,
  Radio,
  Zap,
  CheckCircle2,
  Sliders,
  Compass,
  BatteryCharging,
  Key,
} from 'lucide-react';

/**
 * LINE CLEAR (SAVIAN) - Indian Railways AI Operations Cockpit
 * GeofenceSafetyLock.tsx: IoT Track Clearance Gauge Interlock & NavIC Digital Flagging
 */

export interface GeofenceSafetyLockProps {
  blockSection?: {
    startKm: number;
    endKm: number;
    sectionName: string;
  };
  onLineClearAuthorized?: () => void;
}

// Authentic Indian Railways Maintenance Section Baseline
const DEFAULT_SECTION = {
  startKm: 45.0,
  endKm: 48.5,
  sectionName: 'Down Line • Bina - Bhopal Corridor (Section Km 45.000 - Km 48.500)',
};

export const GeofenceSafetyLock: React.FC<GeofenceSafetyLockProps> = ({
  blockSection: incomingSection,
  onLineClearAuthorized,
}) => {
  const section = useMemo(() => ({
    ...DEFAULT_SECTION,
    ...incomingSection,
  }), [incomingSection]);

  // Track coordinates for the visual strip: range Km 44.0 to Km 50.0
  const minTrackKm = 44.0;
  const maxTrackKm = 50.0;
  const totalTrackRange = maxTrackKm - minTrackKm;

  // SSE (Senior Section Engineer) interactive GPS coordinate
  const [sseKm, setSseKm] = useState<number>(46.2);

  // Gang No. 4 static GPS coordinate (cleared at Km 49.100)
  const gangKm = 49.1;

  // Cryptographic authorization state
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [authCertificate, setAuthCertificate] = useState<string | null>(null);

  // Determine if SSE or Gang is inside the hazard zone
  const isSseInHazard = sseKm >= section.startKm && sseKm <= section.endKm;
  const isGangInHazard = gangKm >= section.startKm && gangKm <= section.endKm;
  const isHazardZoneOccupied = isSseInHazard || isGangInHazard;

  // Calculate percentage positions along track strip
  const hazardStartPct = ((section.startKm - minTrackKm) / totalTrackRange) * 100;
  const hazardEndPct = ((section.endKm - minTrackKm) / totalTrackRange) * 100;
  const hazardWidthPct = hazardEndPct - hazardStartPct;

  const ssePositionPct = Math.max(0, Math.min(100, ((sseKm - minTrackKm) / totalTrackRange) * 100));
  const gangPositionPct = Math.max(0, Math.min(100, ((gangKm - minTrackKm) / totalTrackRange) * 100));

  // Handler for authorizing Line Clear
  const handleAuthorizeLineClear = () => {
    if (isHazardZoneOccupied) return;

    const token = `LC-WCR-${Math.floor(100000 + Math.random() * 900000)}-${Date.now().toString().slice(-4)}`;
    setAuthCertificate(token);
    setIsAuthorized(true);

    if (onLineClearAuthorized) {
      onLineClearAuthorized();
    }
  };

  // Reset authorization if crew moves back into hazard zone
  const handleSliderChange = (newKm: number) => {
    setSseKm(newKm);
    if (newKm >= section.startKm && newKm <= section.endKm) {
      setIsAuthorized(false);
      setAuthCertificate(null);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto font-sans text-stone-900">
      
      {/* Outer Cockpit Card */}
      <div className="relative overflow-hidden rounded-2xl skin-glass-card skin-glass-elevated specular-sheen">
        
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-200/60 bg-white/40 px-5 py-3.5 gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors shadow-xs ${
                isHazardZoneOccupied
                  ? 'bg-rose-500/10 border-rose-300/40 text-rose-700'
                  : 'bg-emerald-500/10 border-emerald-300/40 text-emerald-800'
              }`}
            >
              {isHazardZoneOccupied ? (
                <Lock className="h-5 w-5" />
              ) : (
                <Unlock className="h-5 w-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold tracking-tight text-stone-900 font-mono">
                  GEOFENCE SAFETY INTERLOCK (RULE 4.09 GR/SR)
                </h2>
                <span
                  className={`cockpit-dark-chip text-[10px] font-mono font-bold ${
                    isHazardZoneOccupied
                      ? 'cockpit-dark-rose animate-pulse'
                      : 'text-emerald-300'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${isHazardZoneOccupied ? 'bg-rose-400 led-glow-rose' : 'bg-emerald-400 led-glow-emerald'}`} />
                  {isHazardZoneOccupied ? 'RELAY INTERLOCK INHIBITED' : 'INTERLOCK ENERGIZED & CLEAR'}
                </span>
              </div>
              <p className="text-xs text-stone-500 font-mono mt-0.5">
                {section.sectionName}
              </p>
            </div>
          </div>

          {/* NavIC Satellite Lock Badge */}
          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span className="cockpit-dark-chip flex items-center gap-1.5 text-stone-300">
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              <span>NavIC RTK: ±0.3m</span>
            </span>
            <span className="cockpit-dark-chip flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className={isHazardZoneOccupied ? 'text-rose-400 font-bold' : 'text-emerald-300 font-bold'}>
                OHE 25kV: {isHazardZoneOccupied ? 'POWER OFF' : 'PERMITTED'}
              </span>
            </span>
          </div>
        </div>

        {/* ⛔ CRITICAL SAFETY INTERLOCK BANNER */}
        {isHazardZoneOccupied ? (
          <div className="border-b border-rose-200 bg-rose-50/90 p-4 sm:p-5 relative overflow-hidden">
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-rose-600 text-white tracking-wide uppercase shadow-sm">
                    <AlertOctagon className="w-3 h-3" />
                    LINE CLEAR HARD INHIBITED
                  </span>
                  <span className="text-xs font-mono font-semibold text-rose-700">
                    Track Clearance Gauge Intrusion Detected
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-stone-900 font-mono font-medium leading-relaxed">
                  ⛔ SAFETY INTERLOCK ACTIVE: Crew GPS active within clearance gauge at{' '}
                  <strong className="text-rose-700 font-bold underline decoration-rose-400">
                    Km {sseKm.toFixed(3)}
                  </strong>
                  . Line Clear strictly inhibited under Rule 4.09 GR/SR.
                </p>

                <p className="text-[11px] text-stone-600 font-mono">
                  Station Master Block Instrument is electrically isolated until all trackmen and SSE are certified outside Km 45.000 – Km 48.500.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-100 border border-rose-300 text-rose-800 text-xs font-mono font-bold shadow-sm">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>BLOCK COLLAR LOCKED</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="border-b border-emerald-200 bg-emerald-50/90 p-4 relative overflow-hidden">
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-emerald-600 text-white tracking-wide uppercase shadow-sm">
                    <CheckCircle2 className="w-3 h-3" />
                    TRACK CLEARANCE GAUGE VACATED
                  </span>
                  <span className="text-xs font-mono font-semibold text-emerald-800">
                    All maintenance personnel outside Km 45.000 - 48.500
                  </span>
                </div>
                <p className="text-xs text-stone-700 font-mono">
                  Digital interlock released. Station Master may now authorize Line Clear & 25kV OHE traction restoration.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-xl shadow-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>SAFE FOR TRAFFIC</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CORRIDOR GEOFENCE VISUALIZER (Interactive Track Strip) */}
        {/* ========================================================================= */}
        <div className="p-5 sm:p-6 space-y-4 border-b border-[#e5dfd3] bg-[#faf8f3]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
                <span>Down Line Track Clearance Gauge Visualizer</span>
                <span className="text-[10px] text-stone-500 font-normal">(Km 44.000 to Km 50.000)</span>
              </h3>
            </div>
            
            {/* Legend */}
            <div className="flex items-center gap-3 text-[11px] font-mono text-stone-600">
              <span className="flex items-center gap-1">
                <span className="h-2 w-3 rounded-sm bg-emerald-500/40 border border-emerald-600" />
                <span>Safe Zone (&lt;45 or &gt;48.5)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-3 rounded-sm bg-red-500/40 border border-red-600" />
                <span>Hazard Block (45.0 – 48.5)</span>
              </span>
            </div>
          </div>

          {/* Visual Track Bed Strip */}
          <div className="relative py-8 px-2">
            
            {/* Twin Steel Rails SVG Background */}
            <div className="relative h-12 w-full rounded-xl bg-slate-950 border border-slate-800/90 overflow-hidden shadow-[inset_0_2px_10px_rgba(0,0,0,0.7)] flex items-center">
              
              {/* Railroad Wooden/Concrete Sleepers (Ties) repeated pattern */}
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(90deg, #64748b 0px, #64748b 2px, transparent 2px, transparent 18px)',
                }}
              />

              {/* Two parallel steel rails */}
              <div className="absolute top-2.5 left-0 right-0 h-1 bg-slate-600 shadow-sm" />
              <div className="absolute bottom-2.5 left-0 right-0 h-1 bg-slate-600 shadow-sm" />

              {/* Safe Clearance Zone 1: Km 44.0 - 45.0 */}
              <div
                className="absolute top-0 bottom-0 bg-emerald-500/10 border-r border-emerald-500/30 flex items-center justify-center"
                style={{ left: '0%', width: `${hazardStartPct}%` }}
              >
                <span className="text-[10px] font-mono text-emerald-400 font-semibold opacity-60">
                  SAFE ZONE
                </span>
              </div>

              {/* Red Hazard Maintenance Block: Km 45.0 - 48.5 */}
              <div
                className="absolute top-0 bottom-0 bg-red-500/20 border-x-2 border-red-500/80 flex items-center justify-center transition-all duration-300"
                style={{
                  left: `${hazardStartPct}%`,
                  width: `${hazardWidthPct}%`,
                }}
              >
                {/* Diagonal hazard stripes */}
                <div
                  className="absolute inset-0 opacity-15 pointer-events-none"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(45deg, #ef4444 0px, #ef4444 10px, transparent 10px, transparent 20px)',
                  }}
                />
                <span className="relative text-[11px] font-mono text-red-300 font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-red-950/70 border border-red-500/40">
                  ⚠️ ACTIVE MAINTENANCE BLOCK (Km 45.000 - 48.500)
                </span>
              </div>

              {/* Safe Clearance Zone 2: Km 48.5 - 50.0 */}
              <div
                className="absolute top-0 bottom-0 bg-emerald-500/10 border-l border-emerald-500/30 flex items-center justify-center"
                style={{ left: `${hazardEndPct}%`, right: '0%' }}
              >
                <span className="text-[10px] font-mono text-emerald-400 font-semibold opacity-60">
                  SAFE ZONE
                </span>
              </div>

              {/* Gang No. 4 Marker (static at Km 49.100) */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 transition-all duration-300"
                style={{ left: `${gangPositionPct}%` }}
                title="Gang No. 4 (6 Trackmen) - Cleared at Km 49.100"
              >
                <div className="relative group cursor-pointer">
                  <div className="flex items-center justify-center h-7 w-7 rounded-full bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/50 border-2 border-white">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-30 bg-slate-900 border border-slate-700 text-[10px] font-mono px-2 py-1 rounded-[7px] shadow-xl whitespace-nowrap text-emerald-300">
                    Gang No. 4 (Km 49.100 - Cleared)
                  </div>
                </div>
              </div>

              {/* SSE S. K. Verma Marker (Interactive at sseKm) */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-30 transition-all duration-150"
                style={{ left: `${ssePositionPct}%` }}
                title={`SSE S. K. Verma at Km ${sseKm.toFixed(3)} (${isSseInHazard ? 'Inside Gauge' : 'Cleared'})`}
              >
                <div className="relative group cursor-pointer">
                  <div
                    className={`flex items-center justify-center h-8 w-8 rounded-full border-2 border-white shadow-xl transition-all ${
                      isSseInHazard
                        ? 'bg-red-600 text-white shadow-red-500/60 animate-bounce'
                        : 'bg-emerald-500 text-slate-950 shadow-emerald-500/50'
                    }`}
                  >
                    <User className="w-4 h-4" />
                  </div>
                  {/* Floating Indicator */}
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-[10px] font-mono px-2 py-0.5 rounded-[7px] shadow-xl whitespace-nowrap">
                    <span className={isSseInHazard ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                      SSE: Km {sseKm.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Kilometer Markers along Track Bottom */}
            <div className="relative flex justify-between mt-2 text-[10px] font-mono text-stone-500 px-1 font-semibold">
              <span>Km 44.0</span>
              <span className="text-rose-700 font-bold">Km 45.0 (Block In)</span>
              <span>Km 46.0</span>
              <span>Km 47.0</span>
              <span>Km 48.0</span>
              <span className="text-rose-700 font-bold">Km 48.5 (Block Out)</span>
              <span>Km 50.0</span>
            </div>
          </div>

          {/* Interactive GPS Coordinate Slider */}
          <div className="rounded-xl border border-[#ded8c9] bg-white p-4 space-y-3 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-mono text-stone-800">
                <Sliders className="w-4 h-4 text-emerald-700" />
                <span className="font-semibold">Simulate SSE S. K. Verma GPS Coordinate:</span>
                <span className="font-bold text-stone-900 bg-[#f7f4ec] px-2 py-0.5 rounded-lg border border-[#ded8c9]">
                  Km {sseKm.toFixed(3)}
                </span>
              </div>

              {/* Quick Jump Simulator Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSliderChange(46.2)}
                  className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 transition-colors shadow-sm cursor-pointer"
                >
                  Jump to Hazard (Km 46.200)
                </button>
                <button
                  type="button"
                  onClick={() => handleSliderChange(49.2)}
                  className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 transition-colors shadow-sm cursor-pointer"
                >
                  Clear Outside Gauge (Km 49.200)
                </button>
              </div>
            </div>

            {/* Native Slider Control */}
            <div className="space-y-1">
              <input
                type="range"
                min={44.0}
                max={50.0}
                step={0.05}
                value={sseKm}
                onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-700"
                aria-label="SSE S. K. Verma GPS position slider"
              />
              <div className="flex justify-between text-[10px] font-mono text-stone-500">
                <span>Km 44.000</span>
                <span className="text-amber-800 font-semibold">Move slider past Km 48.500 to unlock Station Master authorization</span>
                <span>Km 50.000</span>
              </div>
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* LIVE FIELD CREW TELEMETRY CARDS */}
        {/* ========================================================================= */}
        <div className="p-5 sm:p-6 border-b border-[#e5dfd3] bg-[#faf8f3] space-y-3">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-600">
            Field Personnel IoT Telemetry & Satellite Geofence Status
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            
            {/* Card 1: SSE S. K. Verma */}
            <div
              className={`rounded-xl border p-4 transition-all duration-300 shadow-sm ${
                isSseInHazard
                  ? 'border-rose-300 bg-rose-50/70 shadow-rose-900/5'
                  : 'border-[#ded8c9] bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl border shadow-sm ${
                      isSseInHazard
                        ? 'bg-rose-100 border-rose-300 text-rose-700'
                        : 'bg-emerald-100 border-emerald-300 text-emerald-800'
                    }`}
                  >
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 font-mono">
                      SSE S. K. Verma
                    </h4>
                    <p className="text-xs text-stone-500">
                      Senior Section Engineer (P-Way, Bhopal Div)
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold border shadow-sm ${
                    isSseInHazard
                      ? 'bg-rose-100 border-rose-300 text-rose-800 animate-pulse'
                      : 'bg-emerald-100 border-emerald-300 text-emerald-800'
                  }`}
                >
                  {isSseInHazard ? '⚠️ INSIDE TRACK GAUGE' : '✅ CLEARED GAUGE'}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] font-mono">
                <div className="p-2.5 rounded-lg bg-[#f7f4ec] border border-[#ded8c9]">
                  <div className="text-stone-500 text-[10px] uppercase font-semibold">CURRENT GPS</div>
                  <div className="text-stone-900 font-bold mt-0.5">Km {sseKm.toFixed(3)}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#f7f4ec] border border-[#ded8c9]">
                  <div className="text-stone-500 text-[10px] uppercase font-semibold">DEVICE</div>
                  <div className="text-emerald-800 font-bold mt-0.5">NavIC IRNSS</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#f7f4ec] border border-[#ded8c9]">
                  <div className="text-stone-500 text-[10px] uppercase font-semibold flex items-center gap-1">
                    <BatteryCharging className="w-3 h-3 text-emerald-700" />
                    BATTERY
                  </div>
                  <div className="text-emerald-800 font-bold mt-0.5">88% (Online)</div>
                </div>
              </div>
            </div>

            {/* Card 2: Gang No. 4 (6 Trackmen) */}
            <div className="rounded-xl border border-[#ded8c9] bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border bg-emerald-100 border-emerald-300 text-emerald-800 shadow-sm">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 font-mono">
                      Gang No. 4 (6 Trackmen)
                    </h4>
                    <p className="text-xs text-stone-500">
                      Keyman, Mate & Track Maintainers
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-emerald-100 border border-emerald-300 text-emerald-800 shadow-sm">
                  ✅ CLEARED GAUGE
                </span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] font-mono">
                <div className="p-2.5 rounded-lg bg-[#f7f4ec] border border-[#ded8c9]">
                  <div className="text-stone-500 text-[10px] uppercase font-semibold">CURRENT GPS</div>
                  <div className="text-stone-900 font-bold mt-0.5">Km {gangKm.toFixed(3)}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#f7f4ec] border border-[#ded8c9]">
                  <div className="text-stone-500 text-[10px] uppercase font-semibold">SAFETY BAND</div>
                  <div className="text-emerald-800 font-bold mt-0.5">RFID + GPS Hub</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#f7f4ec] border border-[#ded8c9]">
                  <div className="text-stone-500 text-[10px] uppercase font-semibold flex items-center gap-1">
                    <Radio className="w-3 h-3 text-emerald-700" />
                    LINK
                  </div>
                  <div className="text-emerald-800 font-bold mt-0.5">Telemetry OK</div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* HARDWARE INTERLOCK ENFORCEMENT & AUTHORIZATION ACTION */}
        {/* ========================================================================= */}
        <div className="p-5 sm:p-6 bg-[#f5f0e6]/60 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#e5dfd3]">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-700" />
                Station Master Cryptographic Block Authorization
              </span>
            </div>
            <p className="text-xs text-stone-500 leading-relaxed font-mono">
              Issuance generates a SHA-256 digital authority token registered in FOIS & Block Proving Axle Counter (BPAC) relay circuits.
            </p>
          </div>

          {/* Authorization Button */}
          <div className="w-full sm:w-auto">
            {isHazardZoneOccupied ? (
              <button
                type="button"
                disabled
                className="w-full sm:w-auto px-5 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider bg-stone-200 border border-stone-300 text-stone-400 cursor-not-allowed flex items-center justify-center gap-2 shadow-none"
                title="Line Clear cannot be authorized while personnel are inside track clearance gauge"
              >
                <Lock className="w-4 h-4 text-rose-500" />
                <span>AUTHORIZE LINE CLEAR & POWER RESTORATION</span>
              </button>
            ) : isAuthorized ? (
              <div className="flex items-center gap-2 bg-emerald-100 border border-emerald-300 px-4 py-2.5 rounded-xl text-emerald-900 font-mono text-xs font-bold shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>LINE CLEAR GRANTED: {authCertificate}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleAuthorizeLineClear}
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider bg-emerald-800 hover:bg-emerald-700 text-white border border-emerald-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                <span>AUTHORIZE LINE CLEAR & POWER RESTORATION</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer Audit Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#faf8f3] px-5 py-3 text-[11px] text-stone-500 font-mono">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-emerald-700" />
            <span>CRIS Section Corridor: Bhopal (BPL) - Bina (BINA) Down Fast Track.</span>
          </div>
          <div className="text-stone-500">
            RDSO Specification No. RDSO/SPN/TC/105/2020 Rev 1.0 Compliant
          </div>
        </div>

      </div>

    </div>
  );
};

export default GeofenceSafetyLock;
