import React from 'react';
import {
  Settings,
  Shield,
  Sliders,
  Database,
  Save,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const SettingsView: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl">
      {/* Settings Header */}
      <div className="skin-glass-card skin-glass-elevated specular-sheen rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3.5">
          <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-800 border border-emerald-300/40 shadow-xs">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900 tracking-tight font-sans">
              Corridor & Solver System Configuration
            </h2>
            <p className="text-xs text-stone-500 font-medium">
              Bhopal Division (BPL) • West Central Railway (WCR) • Kavach Safety Rules
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs font-semibold rounded-xl border-stone-300/70 bg-white/70 text-stone-700 hover:bg-white shadow-xs"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Reset Defaults
          </Button>
          <Button
            variant="railway"
            size="sm"
            className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-[0_3px_10px_rgba(7,138,104,0.3)]"
          >
            <Save className="mr-1.5 h-3.5 w-3.5" />
            Save Configuration
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Kavach Headway Rules */}
        <div className="skin-glass-card specular-sheen rounded-2xl p-5 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-stone-200/60">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-800 border border-emerald-300/40">
              <Shield className="h-4 w-4 text-emerald-600" />
            </div>
            <h3 className="text-sm font-bold text-stone-900 font-sans tracking-tight">
              Kavach Headway & Safety Bounds
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between items-center text-stone-700 font-semibold mb-1">
                <span>Commissioned Kavach Headway Buffer</span>
                <span className="cockpit-dark-chip text-[10px] font-mono text-emerald-300 font-extrabold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 led-glow-emerald" />
                  5 minutes
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-medium leading-relaxed">
                Minimum train following interval when on-board and trackside Kavach RFID tags are active.
              </p>
            </div>

            <div className="pt-2.5 border-t border-stone-200/60">
              <div className="flex justify-between items-center text-stone-700 font-semibold mb-1">
                <span>In-Trials Kavach Headway Buffer</span>
                <span className="cockpit-dark-chip text-[10px] font-mono text-sky-300 font-extrabold">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-400 led-glow-sky" />
                  7 minutes
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-medium leading-relaxed">
                Conservative braking margin during field validation trials.
              </p>
            </div>

            <div className="pt-2.5 border-t border-stone-200/60">
              <div className="flex justify-between items-center text-stone-700 font-semibold mb-1">
                <span>Non-Equipped Conventional Signal Spacing</span>
                <span className="cockpit-dark-amber text-[10px] font-mono font-extrabold">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 led-glow-amber" />
                  10 minutes
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-medium leading-relaxed">
                Standard double distant / 4-aspect automatic signaling headway.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Solver Objective Weighting */}
        <div className="skin-glass-card specular-sheen rounded-2xl p-5 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-stone-200/60">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-800 border border-emerald-300/40">
              <Sliders className="h-4 w-4 text-emerald-600" />
            </div>
            <h3 className="text-sm font-bold text-stone-900 font-sans tracking-tight">
              Solver Multi-Objective Weights
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between text-stone-700 font-semibold mb-1">
                <span>Train Punctuality Delay Penalty</span>
                <span className="font-mono text-sky-700 font-extrabold">Weight: 10.0</span>
              </div>
              <div className="h-2 w-full bg-stone-200/50 rounded-full overflow-hidden skin-glass-inset">
                <div className="h-full bg-sky-500 rounded-full w-[100%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-stone-700 font-semibold mb-1">
                <span>Block Time Deviation Penalty</span>
                <span className="font-mono text-sky-700 font-extrabold">Weight: 4.5</span>
              </div>
              <div className="h-2 w-full bg-stone-200/50 rounded-full overflow-hidden skin-glass-inset">
                <div className="h-full bg-sky-500 rounded-full w-[45%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-stone-700 font-semibold mb-1">
                <span>Shadow Block Consolidation Bonus</span>
                <span className="font-mono text-emerald-700 font-extrabold">Bonus: +8.0</span>
              </div>
              <div className="h-2 w-full bg-stone-200/50 rounded-full overflow-hidden skin-glass-inset">
                <div className="h-full bg-emerald-500 rounded-full w-[80%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-stone-700 font-semibold mb-1">
                <span>Speed Debt (Permanent PSR Cost)</span>
                <span className="font-mono text-amber-700 font-extrabold">Weight: 6.0</span>
              </div>
              <div className="h-2 w-full bg-stone-200/50 rounded-full overflow-hidden skin-glass-inset">
                <div className="h-full bg-amber-500 rounded-full w-[60%]" />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Data Feeds & Integration Health */}
        <div className="skin-glass-card specular-sheen rounded-2xl p-5 space-y-4 md:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200/60">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-800 border border-emerald-300/40">
                <Database className="h-4 w-4 text-emerald-600" />
              </div>
              <h3 className="text-sm font-bold text-stone-900 font-sans tracking-tight">
                CRIS & Railway Integration Endpoints
              </h3>
            </div>
            <span className="cockpit-dark-chip text-[10px] font-mono text-emerald-300 font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 led-glow-emerald" />
              ALL SYSTEMS HEALTHY
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="rounded-xl skin-glass-sub p-3.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-stone-900">TMS (Track)</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 led-glow-emerald" />
              </div>
              <p className="text-stone-500 text-[11px] font-medium">Syncing P-Way Demands</p>
              <p className="text-[10px] font-mono text-stone-400 font-semibold">Latency: 18ms</p>
            </div>

            <div className="rounded-xl skin-glass-sub p-3.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-stone-900">SMMS (OHE)</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 led-glow-emerald" />
              </div>
              <p className="text-stone-500 text-[11px] font-medium">Traction & Tower Wagons</p>
              <p className="text-[10px] font-mono text-stone-400 font-semibold">Latency: 24ms</p>
            </div>

            <div className="rounded-xl skin-glass-sub p-3.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-stone-900">TDMS (S&T)</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 led-glow-emerald" />
              </div>
              <p className="text-stone-500 text-[11px] font-medium">Interlocking & Point Machines</p>
              <p className="text-[10px] font-mono text-stone-400 font-semibold">Latency: 14ms</p>
            </div>

            <div className="rounded-xl skin-glass-sub p-3.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-stone-900">COA & ICMS</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 led-glow-emerald" />
              </div>
              <p className="text-stone-500 text-[11px] font-medium">Live Section Train Telemetry</p>
              <p className="text-[10px] font-mono text-stone-400 font-semibold">Latency: 32ms</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
