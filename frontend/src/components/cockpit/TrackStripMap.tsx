import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Radio } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StationNode {
  code: string;
  shortCode: string;
  name: string;
  km: number;
  topKm: string;
  status: 'green' | 'amber' | 'blue' | 'rose';
}

export const STRIP_STATIONS: StationNode[] = [
  { code: 'BINA', shortCode: 'BINA', name: 'Bina Jn', km: 0, topKm: '0.0', status: 'green' },
  { code: 'KIKA', shortCode: 'KIKA', name: 'Kurwai Kethora', km: 8.4, topKm: '15.0', status: 'amber' },
  { code: 'MABA', shortCode: 'MABA', name: 'Mandi Bamora', km: 19.8, topKm: '25.0', status: 'green' },
  { code: 'BAQ', shortCode: 'BAQ', name: 'Ganj Basoda', km: 31.1, topKm: '35.0', status: 'green' },
  { code: 'GLG', shortCode: 'GLG', name: 'Gulabganj', km: 45.7, topKm: '45.0', status: 'blue' },
  { code: 'BHS', shortCode: 'BHS', name: 'Vidisha', km: 61.9, topKm: '51.0', status: 'blue' },
  { code: 'SCI', shortCode: 'SCI', name: 'Sanchi', km: 72.4, topKm: '75.0', status: 'blue' },
  { code: 'BPL', shortCode: 'BPL', name: 'Bhopal Jn', km: 92.2, topKm: '92.0', status: 'green' },
  { code: 'RKMP', shortCode: 'RKMP', name: 'Rani Kamlapati', km: 99.0, topKm: '99.0', status: 'green' },
  { code: 'MDDP', shortCode: 'MDDP', name: 'Mandideep', km: 114.2, topKm: '100.0', status: 'rose' },
  { code: 'ODG', shortCode: 'ODG', name: 'Obaidullaganj', km: 125.0, topKm: '125.0', status: 'rose' },
  { code: 'BKA', shortCode: 'BKA', name: 'Barkhera (Ghat)', km: 139.5, topKm: '139.0', status: 'rose' },
  { code: 'ET', shortCode: 'ET', name: 'Itarsi Jn', km: 155.4, topKm: '155.0', status: 'green' },
];

// Persistent session start timestamp to ensure the train position stays continuous across navigation
const SESSION_START_TIME = typeof window !== 'undefined' 
  ? (window as any).__STRIP_TRAIN_SESSION_START || ((window as any).__STRIP_TRAIN_SESSION_START = Date.now())
  : Date.now();

const TOTAL_LOOP_SECONDS = 480; // 240s one-way, 480s round trip

export const TrackStripMap: React.FC = () => {
  const [trainLeftPct, setTrainLeftPct] = useState<number>(1);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [activeStationIndex, setActiveStationIndex] = useState(0);

  useEffect(() => {
    // Continuously compute train position and station index based on wall-clock elapsed time
    const updatePosition = () => {
      const elapsedSeconds = ((Date.now() - SESSION_START_TIME) / 1000) % TOTAL_LOOP_SECONDS;
      const halfLoop = TOTAL_LOOP_SECONDS / 2; // 240s

      let progress: number; // 0 to 1
      let flipped: boolean;

      if (elapsedSeconds < halfLoop) {
        // Forward: BINA (1%) -> ET (89%)
        progress = elapsedSeconds / halfLoop;
        flipped = false;
        // Station index forward (0 to 12)
        const stIndex = Math.min(
          STRIP_STATIONS.length - 1,
          Math.floor((elapsedSeconds / halfLoop) * STRIP_STATIONS.length)
        );
        setActiveStationIndex(stIndex);
      } else {
        // Return: ET (89%) -> BINA (1%)
        progress = 1 - (elapsedSeconds - halfLoop) / halfLoop;
        flipped = true;
        // Station index return (12 down to 0)
        const stIndex = Math.max(
          0,
          STRIP_STATIONS.length - 1 - Math.floor(((elapsedSeconds - halfLoop) / halfLoop) * STRIP_STATIONS.length)
        );
        setActiveStationIndex(stIndex);
      }

      // Exact position between 1% and 89%
      const currentPos = 1 + progress * (89 - 1);
      setTrainLeftPct(currentPos);
      setIsFlipped(flipped);
    };

    // Run immediately upon mounting so there is zero jump
    updatePosition();

    // High refresh rate (60fps) for silky smooth continuous motion
    const interval = setInterval(updatePosition, 50);
    return () => clearInterval(interval);
  }, []);

  const currentStation = STRIP_STATIONS[activeStationIndex] || STRIP_STATIONS[0];
  // 30 km/h TSR applies strictly between BINA and KIKA (active OHE block possession km 2.5-6.8)
  // Once train clears KIKA (activeStationIndex >= 2: MABA, BAQ, etc.), speed returns to normal 130 km/h
  const isTsrZone = activeStationIndex === 0 || activeStationIndex === 1;
  const currentSpeed = isTsrZone ? 30 : 130;

  return (
    <div className="neumorphic-card neumorphic-card-hover rounded-2xl p-5 space-y-4">
      {/* Header with Title and Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e8e4d8] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-emerald-600 animate-pulse" />
            <h2 className="text-sm font-extrabold tracking-tight text-stone-900 font-sans">
              BINA – ITARSI SECTION STRIP MAP (152.4 KM)
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            West Central Railway • Bhopal Division • Real-time block locations & Kavach safety status
          </p>
        </div>

        {/* Legend matching reference colors */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-stone-600">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#9bd8b5] border border-[#68b88d]" />
            <span>Commissioned</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#9fd5e8] border border-[#6cb6d1]" />
            <span>In Trials</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#f3b2a3] border border-[#d98574]" />
            <span>Not Equipped</span>
          </div>
          <div className="flex items-center gap-1.5 border-l border-stone-200 pl-3">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-mono text-stone-600 font-bold">CTC Signal Block</span>
          </div>
        </div>
      </div>

      {/* Schematic Linear Track Container (Full Width Responsive - No Scrollbar) */}
      <div className="relative pt-24 pb-8 px-2 sm:px-6 w-full">
        {/* HORIZONTAL SLIM TELEMETRY PILL BAR - Positioned in the blank space at the top */}
        <div className="absolute top-0 left-0 right-0 flex justify-center z-20 px-4">
          <div className="flex flex-wrap items-center gap-3 sm:gap-5 rounded-full border border-stone-200/90 bg-white/95 px-5 py-1.5 shadow-[0_6px_16px_rgba(180,170,155,0.22)] backdrop-blur-md">
            {/* Station & Chainage Pill */}
            <div className="flex items-center gap-2 notranslate" translate="no">
              <span className="font-extrabold text-stone-900 text-xs font-mono">
                {currentStation.code}
              </span>
              <span className="text-[10px] font-mono bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-bold">
                {currentStation.km} km
              </span>
            </div>

            <div className="h-3 w-[1px] bg-stone-200 hidden sm:block" />

            {/* Live Section */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-stone-400 font-medium text-[11px]">Live:</span>
              <span className="font-bold text-stone-900 font-mono text-[11px] notranslate" translate="no">{currentStation.code}</span>
            </div>

            <div className="h-3 w-[1px] bg-stone-200 hidden sm:block" />

            {/* Train ID */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-stone-400 font-medium text-[11px]">Train:</span>
              <span className="font-bold text-emerald-700 font-mono text-[11px]">12155 Exp</span>
            </div>

            <div className="h-3 w-[1px] bg-stone-200 hidden sm:block" />

            {/* Speed Metric */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-stone-400 font-medium text-[11px]">Speed:</span>
              <span className={`font-mono font-black text-[11px] ${isTsrZone ? 'text-amber-700 font-extrabold' : 'text-stone-900'}`}>
                {currentSpeed} km/h
              </span>
              {isTsrZone ? (
                <span className="text-[9px] bg-amber-100 text-amber-900 border border-amber-300 font-extrabold px-1.5 py-0.5 rounded-full animate-pulse notranslate" translate="no">
                  ⚠ TSR 30km/h
                </span>
              ) : (
                <span className="text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold px-1.5 py-0.5 rounded-full notranslate" translate="no">
                  Normal
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Active Block Maintenance Safety Envelope between BINA and KIKA */}
        <div className="absolute top-[135px] left-[3%] w-[11%] h-[24px] rounded-lg border border-dashed border-amber-500 bg-amber-300/25 flex items-center justify-center z-5 shadow-[0_0_12px_rgba(245,158,11,0.3)] animate-pulse pointer-events-none notranslate" translate="no">
          <span className="text-[8px] font-mono font-black text-amber-950 bg-amber-100/90 px-1 py-0.5 rounded shadow-xs border border-amber-300 whitespace-nowrap">
            ⚠ BLOCK km 2.5-6.8 (OHE CUT)
          </span>
        </div>

        {/* 3 Continuous Track Lines running horizontally across stations */}
        {/* Top Rail */}
        <div className="absolute top-[138px] left-5 right-5 h-[2px] bg-[#cbc5b4] z-0" />
        {/* Middle Track Line with Colored Safety Status Segments */}
        <div className="absolute top-[145px] left-5 right-5 h-[4px] z-0 rounded-full flex overflow-hidden shadow-inner">
          <div className="w-[30%] h-full bg-[#82cda4]/75" /> {/* Green section */}
          <div className="w-[30%] h-full bg-[#81cde6]/75" /> {/* Blue section */}
          <div className="w-[28%] h-full bg-[#f0a999]/75" /> {/* Rose section */}
          <div className="w-[12%] h-full bg-[#82cda4]/75" /> {/* Green end */}
        </div>
        {/* Bottom Rail */}
        <div className="absolute top-[154px] left-5 right-5 h-[2px] bg-[#cbc5b4] z-0" />

        {/* Animated Train Locomotive Moving Along 3 Track Lines (Persistent Wall-Clock Continuous Loop) */}
        <div
          className="absolute top-[131px] z-30 flex flex-col items-center pointer-events-none transition-[left] duration-75 ease-linear"
          style={{ left: `${trainLeftPct}%` }}
        >
          {/* Realistic Train Engine Moving Directly On The 3 Track Lines */}
          {/* Natively points RIGHT when moving forward (scaleX: 1) and MIRRORS to point LEFT when moving backward (scaleX: -1) */}
          <div
            className="relative flex items-center transition-transform duration-300"
            style={{ transform: isFlipped ? 'scaleX(-1)' : 'scaleX(1)' }}
          >
            {/* Soft Luminescent Trail behind train (always behind train's rear) */}
            <div className="absolute right-full mr-1 flex items-center gap-1 opacity-80 pointer-events-none">
              <span className="h-1.5 w-6 rounded-full bg-gradient-to-r from-transparent to-cyan-300 animate-pulse" />
              <span className="h-1 w-3 rounded-full bg-cyan-200" />
            </div>

            {/* Sleek Aerodynamic Vande Bharat Train Engine Sprite - Natively Facing RIGHT (nose at x=90) */}
            <div className="relative z-10 filter drop-shadow-[0_2px_5px_rgba(0,0,0,0.22)]">
              <svg
                className="w-[76px] h-[30px]"
                viewBox="0 0 96 38"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Roof Pantograph */}
                <path d="M40 8 L32 2 L24 8 M34 2 L22 2" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
                {/* Main Train Body - Sleek Aerodynamic Nose on the RIGHT (x=90) */}
                <path
                  d="M10 33 H86 C89 33 90 30 90 30 C90 30 86 10 66 9 H10 C5 9 1 14 1 20 V30 C1 32 3 33 5 33 Z"
                  fill="url(#train_silver_body)"
                  stroke="#94a3b8"
                  strokeWidth="1"
                />
                {/* Aerodynamic Windshield facing RIGHT */}
                <path
                  d="M86 25 C84 16 78 13 70 12 L62 12 L63 25 Z"
                  fill="#0f172a"
                  stroke="#1e293b"
                  strokeWidth="0.8"
                />
                <path d="M84 22 C82 17 77 14 71 13" stroke="#38bdf8" strokeWidth="1" strokeLinecap="round" opacity="0.9" />
                {/* Passenger Windows */}
                <rect x="18" y="15" width="9" height="7" rx="1.5" fill="#0f172a" />
                <rect x="30" y="15" width="9" height="7" rx="1.5" fill="#0f172a" />
                <rect x="42" y="15" width="9" height="7" rx="1.5" fill="#0f172a" />
                <rect x="54" y="15" width="9" height="7" rx="1.5" fill="#0f172a" />
                {/* Green Livery Stripe */}
                <path d="M1 26 H88 V30 H1 Z" fill="#10b981" />
                <path d="M1 24 H86 V26 H1 Z" fill="#059669" />
                {/* Headlight on the RIGHT nose */}
                <circle cx="88" cy="28" r="2" fill="#fef08a" />
                <circle cx="88" cy="28" r="1" fill="#ffffff" />
                {/* Wheels / Bogies directly touching track */}
                <circle cx="19" cy="33" r="3" fill="#334155" stroke="#64748b" strokeWidth="1" />
                <circle cx="28" cy="33" r="3" fill="#334155" stroke="#64748b" strokeWidth="1" />
                <circle cx="62" cy="33" r="3" fill="#334155" stroke="#64748b" strokeWidth="1" />
                <circle cx="71" cy="33" r="3" fill="#334155" stroke="#64748b" strokeWidth="1" />
                <defs>
                  <linearGradient id="train_silver_body" x1="96" y1="9" x2="0" y2="33" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#f8fafc" />
                    <stop offset="0.5" stopColor="#e2e8f0" />
                    <stop offset="1" stopColor="#cbd5e1" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>
        {/* Station Nodes Layout (Evenly Spaced Across Full Width) */}
        <div className="relative z-10 flex justify-between items-start w-full">
          {STRIP_STATIONS.map((st, idx) => {
            const isGreen = st.status === 'green';
            const isAmber = st.status === 'amber';
            const isBlue = st.status === 'blue';
            const isRose = st.status === 'rose';

            // Authentic 3-Aspect Automatic Block Signaling logic
            const stationDist = Math.abs(idx - activeStationIndex);
            const signalState: 'RED' | 'YELLOW' | 'GREEN' =
              stationDist === 0 ? 'RED' : stationDist === 1 ? 'YELLOW' : 'GREEN';

            return (
              <div
                key={st.code}
                className="flex flex-col items-center group cursor-pointer"
              >
                {/* Chainage KM label & Miniature Signal Post */}
                <div className="flex flex-col items-center mb-1.5 space-y-0.5">
                  <span className="text-[10px] font-mono font-bold text-stone-500">
                    {st.topKm}
                  </span>

                  {/* Authentic 3-Aspect Railway Signal Post */}
                  <div
                    className="flex items-center gap-1 bg-stone-900/90 px-1.5 py-0.5 rounded-full border border-stone-700/80 shadow-xs"
                    title={`Signal at ${st.code}: ${
                      signalState === 'RED'
                        ? 'RED / Block Occupied'
                        : signalState === 'YELLOW'
                        ? 'YELLOW / Approaching Caution'
                        : 'GREEN / Line-Clear'
                    }`}
                  >
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full transition-all duration-300',
                        signalState === 'RED'
                          ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-pulse'
                          : 'bg-stone-800 opacity-40'
                      )}
                    />
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full transition-all duration-300',
                        signalState === 'YELLOW'
                          ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24] animate-pulse'
                          : 'bg-stone-800 opacity-40'
                      )}
                    />
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full transition-all duration-300',
                        signalState === 'GREEN'
                          ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                          : 'bg-stone-800 opacity-40'
                      )}
                    />
                  </div>
                </div>

                {/* Circular Station Disk Sitting Directly on Track */}
                <div className="relative flex items-center justify-center">
                  {currentStation.code === st.code && (
                    <span className="absolute h-14 w-14 rounded-full bg-emerald-400/40 animate-ping pointer-events-none z-0" />
                  )}
                  <div
                    className={cn(
                      'flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border-[2.5px] text-[10px] sm:text-[11px] font-extrabold font-mono transition-transform duration-200 group-hover:scale-110 shadow-sm z-10 notranslate select-none',
                      isGreen && 'border-[#75be96] bg-[#a8e0c0] text-[#14482e]',
                      isAmber && 'border-[#e0aa6d] bg-[#f9cf9c] text-[#6d3e0c]',
                      isBlue && 'border-[#76bdd6] bg-[#aee2f4] text-[#124d63]',
                      isRose && 'border-[#df9182] bg-[#f7bfb4] text-[#67251a]',
                      currentStation.code === st.code && 'ring-2 ring-emerald-500 ring-offset-2'
                    )}
                    translate="no"
                  >
                    {st.shortCode}
                  </div>
                </div>

                {/* Station Code Below */}
                <span className="text-[11px] font-extrabold text-stone-900 mt-2 font-mono notranslate" translate="no">
                  {st.code}
                </span>
                {/* KM below code */}
                <span className="text-[10px] text-stone-500 font-mono font-semibold notranslate" translate="no">
                  {st.km}k
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

