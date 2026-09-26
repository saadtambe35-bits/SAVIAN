import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { MareyChart } from '@/components/marey/MareyChart';
import { CORRIDOR_STATIONS, MOCK_TRAIN_SCHEDULES, MOCK_MAINTENANCE_BLOCKS } from '@/data/mareyData';
import { formatMinutesToHHMM } from '@/components/marey/MareyTooltip';
import {
  Activity,
  AlertTriangle,
  Layers,
  X,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface MareyViewProps {
  chaosMode: boolean;
  onChaosModeChange?: (chaos: boolean) => void;
}

export const MareyView: React.FC<MareyViewProps> = ({
  chaosMode,
  onChaosModeChange,
}) => {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  const selectedBlock = MOCK_MAINTENANCE_BLOCKS.find(
    (b) => b.block_id === selectedBlockId
  );

  const clashingBlocksCount = MOCK_MAINTENANCE_BLOCKS.filter((b) => b.has_clash).length;
  const shadowBlocksCount = MOCK_MAINTENANCE_BLOCKS.filter((b) => b.is_shadow).length;

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Top Banner if Chaos Mode Active */}
      {chaosMode && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 shadow-sm text-rose-900">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="rounded-xl bg-rose-100 p-2 text-rose-700 border border-rose-300 shadow-sm">
                <AlertTriangle className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-900 flex items-center gap-2">
                  Corridor Conflict Simulation (Chaos Mode Active)
                  <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] text-rose-800 border border-rose-300 font-bold">
                    {clashingBlocksCount} Critical Clashes Detected
                  </span>
                </h3>
                <p className="text-xs text-rose-800/80 font-medium">
                  Observe pulsing red borders with glowing shadows on blocks overlapping active train paths (BHS–DWG Passenger conflict & BKA–BNI Ghat OHE conflict).
                </p>
              </div>
            </div>
            {onChaosModeChange && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onChaosModeChange(false)}
                className="border-rose-300 bg-white text-rose-800 hover:bg-rose-100 font-bold rounded-xl shrink-0 cursor-pointer shadow-sm"
              >
                Disable Chaos Mode
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Corridor Summary Pills - AeroSkin Glass with Dark Cockpit Accents */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="skin-glass-card skin-glass-elevated specular-sheen rounded-2xl p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Total Route Span</span>
            <span className="cockpit-dark-chip text-[9px] font-mono font-bold text-stone-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 led-glow-emerald" />
              LIVE
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-stone-900 mt-1 tracking-tight">231.5 KM</div>
          <div className="text-[10px] text-stone-500 font-mono mt-0.5">BINA Jn (0.0 km) → ET Jn (231.5 km)</div>
        </div>

        <div className="skin-glass-card skin-glass-elevated specular-sheen rounded-2xl p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Corridor Stations</span>
            <span className="cockpit-dark-chip text-[9px] font-mono font-bold text-emerald-300">
              26 Blocks
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-emerald-800 mt-1 tracking-tight">27 Stations</div>
          <div className="text-[10px] text-stone-500 font-mono mt-0.5">26 Contiguous Block Sections</div>
        </div>

        <div className="skin-glass-card skin-glass-elevated specular-sheen rounded-2xl p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Scheduled Trains</span>
            <span className="cockpit-dark-chip text-[9px] font-mono font-bold text-sky-300">
              IR Timetable
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-stone-900 mt-1 tracking-tight">12 Paths</div>
          <div className="text-[10px] text-stone-500 font-mono mt-0.5">Rajdhani, VB, Exp, Mail, Freight</div>
        </div>

        <div className="skin-glass-card skin-glass-elevated specular-sheen rounded-2xl p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Possessions</span>
            <span className="cockpit-dark-chip text-[9px] font-mono font-bold text-amber-300">
              {shadowBlocksCount} Shadow
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-stone-900 mt-1 tracking-tight">
            8 Blocks
          </div>
          <div className="text-[10px] text-stone-500 font-mono mt-0.5">P-Way, OHE, S&T Integrated</div>
        </div>
      </div>

      {/* Primary Marey Chart Component */}
      <MareyChart
        stations={CORRIDOR_STATIONS}
        trains={MOCK_TRAIN_SCHEDULES}
        blocks={MOCK_MAINTENANCE_BLOCKS}
        chaosMode={chaosMode}
        onBlockClick={(blockId: string) => setSelectedBlockId(blockId)}
        height={760}
      />

      {/* Selected Block Inspection Drawer / Modal */}
      {selectedBlock &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-md overflow-y-auto"
            onClick={() => setSelectedBlockId(null)}
          >
            <div
              className="relative w-full max-w-lg rounded-3xl border border-stone-200/80 bg-[#FAF7F2]/95 backdrop-blur-2xl p-5 shadow-2xl animate-in zoom-in-95 duration-150 text-stone-900 my-auto skin-glass-elevated"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-stone-200/60 pb-3.5 bg-white/40 -mx-5 -mt-5 p-5 rounded-t-3xl">
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-300/40 text-amber-700 shadow-xs">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-mono text-base font-bold text-stone-900">
                        {selectedBlock.demand_code}
                      </h3>
                      <Badge
                        variant={
                          selectedBlock.department === 'P_WAY'
                            ? 'railway'
                            : selectedBlock.department === 'OHE'
                            ? 'warning'
                            : 'info'
                        }
                      >
                        {selectedBlock.department}
                      </Badge>
                    </div>
                    <div className="font-mono text-xs text-stone-500 font-medium">
                      Block ID: {selectedBlock.block_id}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBlockId(null)}
                  className="rounded-xl p-1.5 text-stone-400 hover:bg-stone-200/60 hover:text-stone-700 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="my-4 space-y-3.5 text-xs text-stone-700">
                {/* Clash or Shadow Alerts */}
                {selectedBlock.has_clash && (
                  <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-900 shadow-sm">
                    <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 animate-pulse" />
                    <div>
                      <span className="font-bold">Schedule Clash Detected:</span> In Chaos Mode, this maintenance possession conflicts with scheduled passenger/freight paths. Optimization solver recommended to shift window by +15 min.
                    </div>
                  </div>
                )}

                {selectedBlock.is_shadow && (
                  <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-900 shadow-sm">
                    <Layers className="h-5 w-5 text-emerald-700 shrink-0" />
                    <div>
                      <span className="font-bold">Shadow Co-utilization Window:</span> Granted under parent possession{' '}
                      <span className="font-mono text-emerald-800 font-bold">{selectedBlock.shadow_parent_id}</span>, saving 2.0 hours of track occupation.
                    </div>
                  </div>
                )}

                {/* Grid Specs */}
                <div className="grid grid-cols-2 gap-2.5 rounded-xl bg-white border border-[#ded8c9] p-3.5 font-mono shadow-sm">
                  <div>
                    <span className="text-[10px] text-stone-500 block uppercase font-semibold">Time Window</span>
                    <span className="text-sm font-bold text-amber-800">
                      {formatMinutesToHHMM(selectedBlock.start_minutes)} → {formatMinutesToHHMM(selectedBlock.end_minutes)}
                    </span>
                    <span className="text-[10px] text-stone-400 block mt-0.5">
                      Duration: {selectedBlock.end_minutes - selectedBlock.start_minutes} minutes
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-500 block uppercase font-semibold">Corridor Section</span>
                    <span className="text-sm font-bold text-stone-900">
                      Km {selectedBlock.start_km.toFixed(1)} → {selectedBlock.end_km.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-stone-400 block mt-0.5">
                      {selectedBlock.section_from && selectedBlock.section_to
                        ? `${selectedBlock.section_from} – ${selectedBlock.section_to}`
                        : 'Main Line Double Track'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-500 block uppercase font-semibold">Status</span>
                    <span className="text-xs font-bold text-emerald-700">
                      {selectedBlock.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-500 block uppercase font-semibold">Machinery Assigned</span>
                    <span className="text-xs text-stone-800 font-medium truncate block">
                      {selectedBlock.machinery_type || 'Track Crew Unit'}
                    </span>
                  </div>
                </div>

                {/* Activity Description */}
                {selectedBlock.activity_description && (
                  <div>
                    <div className="text-[11px] font-semibold text-stone-600 mb-1">
                      Activity Description:
                    </div>
                    <div className="rounded-xl bg-[#f7f4ec] p-3 text-stone-700 border border-[#e5dfd3] text-[11px] leading-relaxed">
                      {selectedBlock.activity_description}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 border-t border-[#e5dfd3] pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedBlockId(null)}
                  className="rounded-xl border-[#ded8c9] bg-white text-stone-700 hover:bg-[#eae4d5] cursor-pointer shadow-sm"
                >
                  Close
                </Button>
                <Button
                  variant="railway"
                  size="sm"
                  onClick={() => {
                    alert(`Caution Order T/409 generated for ${selectedBlock.demand_code} at Km ${selectedBlock.start_km} - ${selectedBlock.end_km}`);
                  }}
                  className="rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-sm"
                >
                  <FileText className="mr-1.5 h-3.5 w-3.5" />
                  Issue T/409 Caution Order
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

