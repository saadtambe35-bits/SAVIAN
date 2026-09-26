import React, { useState, useMemo, useEffect } from 'react';
import {
  CloudRain,
  CloudFog,
  Sun,
  Gauge,
  Clock,
  ShieldAlert,
  CheckCircle2,
  Activity,
  Radio,
  FileText,
  Sliders,
  Sparkles,
} from 'lucide-react';

/**
 * LINE CLEAR (SAVIAN) - Indian Railways AI Operations Cockpit
 * WeatherTsrEngine.tsx: IMD Atmospheric Ingestion, Braking Friction & Dynamic TSR Headway Matrix
 */

export interface WeatherTsrEngineProps {
  onTsrChange?: (tsrKmH: number, headwayMins: number, scenarioName: string) => void;
}

export interface StationWeatherTelemetry {
  stationCode: string;
  stationName: string;
  kmPosition: string;
  conditionName: string;
  temperatureC: number;
  visibilityM: number;
  rainfallMmHr: number;
  brakingFrictionMu: number; // Adhesion coefficient mu (0.15 - 0.35)
  weatherType: 'CLEAR' | 'RAIN' | 'FOG';
  imdAlertLevel: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
}

export interface ScenarioPreset {
  id: string;
  title: string;
  scenarioName: string;
  maxSpeedKmH: number;
  tsrSpeedKmH: number;
  headwayMinutes: number;
  brakingDistanceMultiplier: number;
  cautionOrderCode: string;
  description: string;
  stations: StationWeatherTelemetry[];
}

// Authentic Indian Railways Weather Scenarios & Engineering Benchmarks
const SCENARIOS: ScenarioPreset[] = [
  {
    id: 'STANDARD',
    title: 'Standard Operations',
    scenarioName: 'Clear Skies (High-Speed Corridor Baseline)',
    maxSpeedKmH: 130,
    tsrSpeedKmH: 130,
    headwayMinutes: 7,
    brakingDistanceMultiplier: 1.0,
    cautionOrderCode: 'CO-NORMAL-SEC-01',
    description: 'Dry ballast, optimal rail-wheel adhesion (µ = 0.32). Max permissible section speed 130 km/h.',
    stations: [
      {
        stationCode: 'BINA',
        stationName: 'Bina Jn',
        kmPosition: 'Km 142.6',
        conditionName: 'Clear Skies',
        temperatureC: 28,
        visibilityM: 8000,
        rainfallMmHr: 0,
        brakingFrictionMu: 0.33,
        weatherType: 'CLEAR',
        imdAlertLevel: 'GREEN',
      },
      {
        stationCode: 'BAQ',
        stationName: 'Vidisha Ghat',
        kmPosition: 'Km 54.0',
        conditionName: 'Fair Weather',
        temperatureC: 29,
        visibilityM: 7500,
        rainfallMmHr: 0,
        brakingFrictionMu: 0.31,
        weatherType: 'CLEAR',
        imdAlertLevel: 'GREEN',
      },
      {
        stationCode: 'BPL',
        stationName: 'Bhopal Jn',
        kmPosition: 'Km 0.0',
        conditionName: 'Clear Sunshine',
        temperatureC: 30,
        visibilityM: 8500,
        rainfallMmHr: 0,
        brakingFrictionMu: 0.34,
        weatherType: 'CLEAR',
        imdAlertLevel: 'GREEN',
      },
    ],
  },
  {
    id: 'CLOUDBURST',
    title: 'Bhopal Cloudburst',
    scenarioName: 'Severe Monsoon Inundation (Rain > 50mm/hr)',
    maxSpeedKmH: 130,
    tsrSpeedKmH: 45,
    headwayMinutes: 12,
    brakingDistanceMultiplier: 1.45,
    cautionOrderCode: 'TSR-T409-MONSOON-BPL',
    description: 'Torrential downpour with rail surface aquaplaning risk. Wheel-rail adhesion degraded to µ = 0.18.',
    stations: [
      {
        stationCode: 'BINA',
        stationName: 'Bina Jn',
        kmPosition: 'Km 142.6',
        conditionName: 'Overcast Skies',
        temperatureC: 24,
        visibilityM: 4000,
        rainfallMmHr: 12,
        brakingFrictionMu: 0.27,
        weatherType: 'CLEAR',
        imdAlertLevel: 'YELLOW',
      },
      {
        stationCode: 'BAQ',
        stationName: 'Vidisha Ghat',
        kmPosition: 'Km 54.0',
        conditionName: 'Monsoon Downpour',
        temperatureC: 22,
        visibilityM: 900,
        rainfallMmHr: 62,
        brakingFrictionMu: 0.18,
        weatherType: 'RAIN',
        imdAlertLevel: 'RED',
      },
      {
        stationCode: 'BPL',
        stationName: 'Bhopal Jn',
        kmPosition: 'Km 0.0',
        conditionName: 'Severe Cloudburst',
        temperatureC: 21,
        visibilityM: 650,
        rainfallMmHr: 65,
        brakingFrictionMu: 0.16,
        weatherType: 'RAIN',
        imdAlertLevel: 'RED',
      },
    ],
  },
  {
    id: 'FOG',
    title: 'Ghat Dense Fog',
    scenarioName: 'Radiation Fog (Visibility < 200m / Rule 3.61 GR/SR)',
    maxSpeedKmH: 130,
    tsrSpeedKmH: 30,
    headwayMinutes: 15,
    brakingDistanceMultiplier: 1.65,
    cautionOrderCode: 'TSR-T409-FOG-GHAT',
    description: 'Severe winter thermal inversion in hill section. Sighting distance of Warner/Home signals obscured below 150m.',
    stations: [
      {
        stationCode: 'BINA',
        stationName: 'Bina Jn',
        kmPosition: 'Km 142.6',
        conditionName: 'Moderate Mist',
        temperatureC: 13,
        visibilityM: 1100,
        rainfallMmHr: 0,
        brakingFrictionMu: 0.26,
        weatherType: 'CLEAR',
        imdAlertLevel: 'YELLOW',
      },
      {
        stationCode: 'BAQ',
        stationName: 'Vidisha Ghat',
        kmPosition: 'Km 54.0',
        conditionName: 'Dense Valley Fog',
        temperatureC: 10,
        visibilityM: 120,
        rainfallMmHr: 0,
        brakingFrictionMu: 0.21,
        weatherType: 'FOG',
        imdAlertLevel: 'RED',
      },
      {
        stationCode: 'BPL',
        stationName: 'Bhopal Jn',
        kmPosition: 'Km 0.0',
        conditionName: 'Dense Radiation Fog',
        temperatureC: 11,
        visibilityM: 150,
        rainfallMmHr: 0,
        brakingFrictionMu: 0.22,
        weatherType: 'FOG',
        imdAlertLevel: 'ORANGE',
      },
    ],
  },
];

export const WeatherTsrEngine: React.FC<WeatherTsrEngineProps> = ({
  onTsrChange,
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('CLOUDBURST');

  const currentScenario = useMemo(() => {
    return SCENARIOS.find((s) => s.id === selectedScenarioId) || SCENARIOS[0];
  }, [selectedScenarioId]);

  // Notify parent on TSR changes
  useEffect(() => {
    if (onTsrChange) {
      onTsrChange(
        currentScenario.tsrSpeedKmH,
        currentScenario.headwayMinutes,
        currentScenario.scenarioName
      );
    }
  }, [currentScenario, onTsrChange]);

  const isTsrActive = currentScenario.tsrSpeedKmH < currentScenario.maxSpeedKmH;

  return (
    <div className="w-full max-w-5xl mx-auto font-sans text-stone-900">
      
      {/* Outer Cockpit Frame */}
      <div className="relative overflow-hidden rounded-2xl skin-glass-card skin-glass-elevated specular-sheen transition-all">
        
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-200/60 bg-white/40 px-5 py-3.5 gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors shadow-xs ${
                isTsrActive
                  ? 'bg-amber-500/10 border-amber-300/40 text-amber-800'
                  : 'bg-emerald-500/10 border-emerald-300/40 text-emerald-800'
              }`}
            >
              {currentScenario.id === 'CLOUDBURST' ? (
                <CloudRain className="h-5 w-5 text-sky-700" />
              ) : currentScenario.id === 'FOG' ? (
                <CloudFog className="h-5 w-5 text-amber-700" />
              ) : (
                <Sun className="h-5 w-5 text-emerald-700" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold tracking-tight text-stone-900 font-mono">
                  WEATHER TSR & HEADWAY ENGINE (IMD AUTOMATED INGESTION)
                </h2>
                <span
                  className={`cockpit-dark-chip text-[10px] font-mono font-bold ${
                    isTsrActive
                      ? 'cockpit-dark-amber animate-pulse'
                      : 'text-emerald-300'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${isTsrActive ? 'bg-amber-400 led-glow-amber' : 'bg-emerald-400 led-glow-emerald'}`} />
                  {isTsrActive ? 'TSR SPEED RESTRICTION ENFORCED' : 'SECTION CLEAR • FULL LINE SPEED'}
                </span>
              </div>
              <p className="text-xs text-stone-500 font-medium">
                Rule 4.08 & 3.61 GR/SR • Automatic Adhesion Calculation • Dynamic Headway Widening
              </p>
            </div>
          </div>

          {/* IMD Satellite Sync Indicator */}
          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span className="cockpit-dark-chip flex items-center gap-1.5 text-stone-300">
              <Radio className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
              <span>IMD INSAT-3DR: LIVE</span>
            </span>
            <span className="cockpit-dark-chip flex items-center gap-1.5 text-emerald-300 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>RADAR 60s</span>
            </span>
          </div>
        </div>

        {/* One-Click Scenario Preset Buttons Bar */}
        <div className="p-4 sm:p-5 border-b border-stone-200/60 bg-stone-50/50">
          <div className="flex items-center gap-2 mb-2 text-xs font-mono text-stone-500 font-bold">
            <Sliders className="w-4 h-4 text-emerald-700" />
            <span className="uppercase tracking-wider">Atmospheric Simulation Presets:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {SCENARIOS.map((scenario) => {
              const isSelected = scenario.id === selectedScenarioId;
              return (
                <button
                  key={scenario.id}
                  type="button"
                  onClick={() => setSelectedScenarioId(scenario.id)}
                  className={`px-3.5 py-3 rounded-xl text-left transition-all duration-200 border cursor-pointer ${
                    isSelected
                      ? 'bg-white border-2 border-emerald-700 shadow-md ring-1 ring-emerald-600/20 text-stone-900'
                      : 'bg-[#f0ebe0] hover:bg-white/80 border-[#ded7c8] text-stone-600 hover:text-stone-900 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-stone-900">
                      {scenario.title}
                    </span>
                    {scenario.id === 'STANDARD' && <Sun className="w-4 h-4 text-emerald-600" />}
                    {scenario.id === 'CLOUDBURST' && <CloudRain className="w-4 h-4 text-sky-600" />}
                    {scenario.id === 'FOG' && <CloudFog className="w-4 h-4 text-amber-600" />}
                  </div>

                  <div className="mt-1.5 flex items-center gap-2 text-[11px] font-mono">
                    <span className="text-stone-600">
                      TSR: <strong className="text-stone-900">{scenario.tsrSpeedKmH} km/h</strong>
                    </span>
                    <span className="text-stone-400">•</span>
                    <span className="text-stone-600">
                      Headway: <strong className="text-emerald-800">{scenario.headwayMinutes}m</strong>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Mathematical Impacts & Speedometer Display */}
        <div className="p-5 sm:p-6 border-b border-[#e5dfd3] bg-[#faf8f3]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Metric 1: Temporary Speed Restriction (TSR) Gauge */}
            <div className="rounded-xl border border-[#ded8c9] bg-white/90 p-4 space-y-2 shadow-sm">
              <div className="flex items-center justify-between text-xs font-mono text-stone-500 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-amber-600" />
                  MANDATORY TSR SPEED CAP
                </span>
                <span className="text-[10px] bg-[#f0ebe0] px-1.5 py-0.5 rounded border border-[#ded8c9] text-stone-700">
                  {currentScenario.cautionOrderCode}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span
                  className={`text-3xl sm:text-4xl font-extrabold font-mono tracking-tight ${
                    isTsrActive ? 'text-amber-700' : 'text-emerald-700'
                  }`}
                >
                  {currentScenario.tsrSpeedKmH}
                </span>
                <span className="text-xs font-mono text-stone-500 font-bold">km/h</span>
                <span className="text-[11px] font-mono text-stone-400 line-through ml-auto">
                  130 km/h Max
                </span>
              </div>

              {/* Progress bar visual for speed cap */}
              <div className="space-y-1">
                <div className="h-2 w-full rounded-full bg-stone-200 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isTsrActive ? 'bg-amber-500' : 'bg-emerald-600'
                    }`}
                    style={{ width: `${(currentScenario.tsrSpeedKmH / currentScenario.maxSpeedKmH) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-stone-400 font-semibold">
                  <span>0 km/h</span>
                  <span>Enforced Speed Restriction</span>
                  <span>130 km/h</span>
                </div>
              </div>
            </div>

            {/* Metric 2: Dynamic Headway Buffer */}
            <div className="rounded-xl border border-[#ded8c9] bg-white/90 p-4 space-y-2 shadow-sm">
              <div className="flex items-center justify-between text-xs font-mono text-stone-500 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-sky-700" />
                  HEADWAY SAFETY BUFFER
                </span>
                <span className="text-[10px] text-sky-900 bg-sky-100 px-1.5 py-0.5 rounded border border-sky-300 font-bold">
                  WIDENED +{currentScenario.headwayMinutes - 7}m
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-sky-800">
                  {currentScenario.headwayMinutes}
                </span>
                <span className="text-xs font-mono text-stone-500 font-bold">minutes</span>
                <span className="text-[11px] font-mono text-stone-500 ml-auto">
                  Normal: 7 mins
                </span>
              </div>

              <p className="text-[11px] text-stone-600 font-mono leading-relaxed">
                Prevents phantom stop-and-go waves by spacing consecutive rakes across signal blocks.
              </p>
            </div>

            {/* Metric 3: Emergency Braking Distance (EBD) Multiplier */}
            <div className="rounded-xl border border-[#ded8c9] bg-white/90 p-4 space-y-2 shadow-sm">
              <div className="flex items-center justify-between text-xs font-mono text-stone-500 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-700" />
                  BRAKING DISTANCE MULTIPLIER
                </span>
                <span className="text-[10px] text-stone-700 bg-[#f0ebe0] px-1.5 py-0.5 rounded border border-[#ded8c9] font-bold">
                  EBD PHYSICS
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-stone-900">
                  {currentScenario.brakingDistanceMultiplier.toFixed(2)}×
                </span>
                <span className="text-xs font-mono text-stone-500 font-bold">nominal distance</span>
              </div>

              <p className="text-[11px] text-stone-600 font-mono leading-relaxed">
                Adhesion coefficient degradation requires {Math.round((currentScenario.brakingDistanceMultiplier - 1) * 100)}% extended track stopping length for 4,000T rakes.
              </p>
            </div>

          </div>
        </div>

        {/* Live Weather Telemetry Cards for Key Stations */}
        <div className="p-5 sm:p-6 space-y-3 bg-[#f7f3ea]">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              Corridor Weather Radar Stations (Bina - Vidisha - Bhopal)
            </h3>
            <span className="text-[11px] font-mono text-stone-500">
              Live Sensor Ingestion: 3 Stations Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {currentScenario.stations.map((station) => {
              const alertColor = {
                GREEN: 'bg-emerald-100 border-emerald-300 text-emerald-800',
                YELLOW: 'bg-amber-100 border-amber-300 text-amber-800',
                ORANGE: 'bg-orange-100 border-orange-300 text-orange-800',
                RED: 'bg-rose-100 border-rose-300 text-rose-800 animate-pulse',
              }[station.imdAlertLevel];

              return (
                <div
                  key={station.stationCode}
                  className="rounded-xl border border-[#ded8c9] bg-white/95 p-4 transition-all hover:border-[#cfc7b4] shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-sm text-stone-900">
                          {station.stationName}
                        </span>
                        <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-[#f0ebe0] text-stone-700 border border-[#ded8c9] font-bold">
                          {station.stationCode}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-stone-500">{station.kmPosition}</span>
                    </div>

                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${alertColor}`}>
                      IMD {station.imdAlertLevel}
                    </span>
                  </div>

                  {/* Atmospheric Snapshot */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="p-2 rounded-lg bg-[#f7f4ec] border border-[#e5dfd3]">
                      <div className="text-stone-400 text-[10px] font-bold">VISIBILITY</div>
                      <div className={`font-bold mt-0.5 ${station.visibilityM < 200 ? 'text-rose-700' : 'text-stone-800'}`}>
                        {station.visibilityM.toLocaleString('en-IN')} m
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-[#f7f4ec] border border-[#e5dfd3]">
                      <div className="text-stone-400 text-[10px] font-bold">RAINFALL</div>
                      <div className={`font-bold mt-0.5 ${station.rainfallMmHr > 50 ? 'text-sky-700' : 'text-stone-800'}`}>
                        {station.rainfallMmHr} mm/h
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-[#f7f4ec] border border-[#e5dfd3]">
                      <div className="text-stone-400 text-[10px] font-bold">RAIL ADHESION (µ)</div>
                      <div className={`font-bold mt-0.5 ${station.brakingFrictionMu < 0.20 ? 'text-amber-700' : 'text-emerald-700'}`}>
                        {station.brakingFrictionMu.toFixed(2)}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-[#f7f4ec] border border-[#e5dfd3]">
                      <div className="text-stone-400 text-[10px] font-bold">AMBIENT TEMP</div>
                      <div className="text-stone-800 font-bold mt-0.5">{station.temperatureC}°C</div>
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-stone-600 flex items-center gap-1.5 font-medium">
                    {station.weatherType === 'RAIN' ? (
                      <CloudRain className="w-3.5 h-3.5 text-sky-600" />
                    ) : station.weatherType === 'FOG' ? (
                      <CloudFog className="w-3.5 h-3.5 text-amber-600" />
                    ) : (
                      <Sun className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                    <span>{station.conditionName}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mandatory TSR Order Banner */}
        <div className="p-4 sm:p-5 bg-[#f4efe4] border-t border-[#e5dfd3] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 shadow-sm flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-stone-900 flex items-center gap-2">
                <span>FORM T/409 CAUTION ORDER TRANSMITTED TO SECTION CONTROLLER</span>
                <span className="text-[10px] text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300 font-bold">
                  DIGITALLY SIGNED
                </span>
              </div>
              <p className="text-[11px] text-stone-600 font-mono mt-0.5">
                Target Speed: <strong className="text-amber-800">{currentScenario.tsrSpeedKmH} km/h</strong> • Headway Buffer: <strong className="text-sky-800">{currentScenario.headwayMinutes} mins</strong> • {currentScenario.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-stone-600 font-semibold flex-shrink-0">
            <ShieldAlert className="w-4 h-4 text-emerald-700" />
            <span>Kavach / TCAS Synced</span>
          </div>
        </div>

      </div>

    </div>
  );
};

export default WeatherTsrEngine;
