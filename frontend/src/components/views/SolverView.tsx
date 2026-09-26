import React, { useState } from 'react';
import {
  Cpu,
  Play,
  Layers,
  Sparkles,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SolverResult, TelemetryEvent } from '@/types';
import { MOCK_SOLVER_RESULT, MOCK_TELEMETRY } from '@/data/mockData';
import { CrewDutyGuard } from '@/components/crew/CrewDutyGuard';

interface SolverViewProps {
  solverStatus: 'idle' | 'solving' | 'done';
  onRunSolver: () => void;
  solverResult?: SolverResult;
  telemetryData?: TelemetryEvent[];
  solvingPhase?: string;
  solvingProgress?: number;
}

export const SolverView: React.FC<SolverViewProps> = ({
  solverStatus,
  onRunSolver,
  solverResult = MOCK_SOLVER_RESULT,
  telemetryData = MOCK_TELEMETRY,
  solvingPhase = 'Phase 2: CP-SAT Boolean Headway Formulation...',
  solvingProgress = 65,
}) => {
  const [highlightedTrain, setHighlightedTrain] = useState<string | null>(null);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner Control Cockpit */}
      <div className="skin-glass-card skin-glass-elevated specular-sheen rounded-2xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-800 border border-emerald-300/40 shadow-xs">
                <Cpu className="h-5 w-5" />
              </div>
              <h2 className="text-base font-bold text-stone-900 tracking-tight font-sans">
                OR-Tools CP-SAT Block Scheduling Engine
              </h2>
            </div>
            <p className="text-xs text-stone-500 font-medium">
              Mixed Integer Programming • Multi-Objective Pareto Frontier • Kavach Braking Distance Constraints
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="railway"
              size="default"
              onClick={onRunSolver}
              disabled={solverStatus === 'solving'}
              className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-[0_4px_12px_rgba(7,138,104,0.35)] transition-all transform active:scale-95"
            >
              {solverStatus === 'solving' ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin text-white" />
                  Solving CP-SAT...
                </>
              ) : (
                <>
                  <Play className="mr-1.5 h-4 w-4 fill-current text-white" />
                  Run AI Optimization
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Live Solving Stage Visualizer (Shown when solving) */}
        {solverStatus === 'solving' && (
          <div className="mt-4 rounded-xl skin-glass-sub border border-amber-300/90 p-3.5 space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-900">
              <span className="flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-600" />
                {solvingPhase}
              </span>
              <span>{Math.round(solvingProgress)}%</span>
            </div>
            <div className="h-2 w-full bg-amber-200/50 rounded-full overflow-hidden skin-glass-inset">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-600 rounded-full transition-all duration-300"
                style={{ width: `${solvingProgress}%` }}
              />
            </div>
            <p className="text-[10px] text-amber-800/80 font-medium">
              Formulating Boolean intervals, enforcing Kavach SIL-4 1,200m headway safety distance, and finding global optimum.
            </p>
          </div>
        )}

        {/* Solver Metrics Strip - AeroSkin Glass & Dark Cockpit Chips */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4 border-t border-stone-200/60">
          <div className="rounded-xl skin-glass-sub p-3 space-y-1 border border-stone-200 shadow-xs hover:border-emerald-500/60 transition-all">
            <span className="text-[10px] uppercase font-bold text-stone-400 font-mono">Solve Status</span>
            <div className="mt-1 flex items-center space-x-1.5">
              <span
                className={`h-2 w-2 rounded-full ${
                  solverStatus === 'solving'
                    ? 'bg-amber-400 led-glow-amber'
                    : 'bg-emerald-400 led-glow-emerald'
                }`}
              />
              <span className="text-xs font-black text-stone-900 font-mono">
                {solverStatus === 'solving' ? 'SOLVING' : solverResult.status}
              </span>
            </div>
          </div>

          <div className="rounded-xl skin-glass-sub p-3 space-y-1 border border-stone-200 shadow-xs hover:border-emerald-500/60 transition-all">
            <span className="text-[10px] uppercase font-bold text-stone-400 font-mono">Optimality Gap</span>
            <div className="mt-1 text-xs font-black text-sky-700 font-mono">
              {solverStatus === 'solving'
                ? `${Math.max(0, 14.8 - (solvingProgress / 100) * 14.8).toFixed(2)}%`
                : `${solverResult.optimality_gap.toFixed(2)}%`}
            </div>
          </div>

          <div className="rounded-xl skin-glass-sub p-3 space-y-1 border border-stone-200 shadow-xs hover:border-emerald-500/60 transition-all">
            <span className="text-[10px] uppercase font-bold text-stone-400 font-mono">Wall Time</span>
            <div className="mt-1 text-xs font-black text-stone-900 font-mono">
              {solverStatus === 'solving'
                ? `${((solvingProgress / 100) * 2.2).toFixed(2)}s`
                : `${solverResult.wall_time_sec}s`}
            </div>
          </div>

          <div className="rounded-xl skin-glass-sub p-3 space-y-1 border border-stone-200 shadow-xs hover:border-emerald-500/60 transition-all">
            <span className="text-[10px] uppercase font-bold text-stone-400 font-mono">Objective Value</span>
            <div className="mt-1 text-xs font-black text-indigo-700 font-mono">
              {solverResult.objective_value}
            </div>
          </div>

          <div className="rounded-xl skin-glass-sub p-3 space-y-1 border border-stone-200 shadow-xs hover:border-emerald-500/60 transition-all">
            <span className="text-[10px] uppercase font-bold text-stone-400 font-mono">Shadow Merges</span>
            <div className="mt-1 text-xs font-black text-emerald-700 font-mono">
              {solverResult.shadow_merges} Blocks
            </div>
          </div>

          <div className="rounded-xl skin-glass-sub p-3 space-y-1 border border-stone-200 shadow-xs hover:border-emerald-500/60 transition-all">
            <span className="text-[10px] uppercase font-bold text-stone-400 font-mono">Clashes Detected</span>
            <div className="mt-1 text-xs font-black text-stone-700 font-mono">
              {solverResult.clashes_detected}
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Explainable AI & Telemetry Iterations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Col: XAI Conflict Resolutions & Shadow Merges */}
        <div className="skin-glass-card specular-sheen rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200/60">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-800 border border-emerald-300/40">
                <Sparkles className="h-4 w-4 text-emerald-600" />
              </div>
              <h3 className="text-sm font-bold text-stone-900 font-sans tracking-tight">
                Explainable AI (XAI) Decisions
              </h3>
            </div>
            {highlightedTrain && (
              <span className="cockpit-dark-amber text-[10px] font-bold">
                Filtered: {highlightedTrain.split('_')[0]}
              </span>
            )}
          </div>

          {/* Conflict Resolutions */}
          <div>
            <span className="text-xs font-bold text-stone-600">
              Resolved Schedule Shifts & Rationale
            </span>
            <div className="mt-2.5 space-y-2.5">
              {solverResult.xai.conflict_resolutions.map((res, i) => {
                const isMatchingHighlighted =
                  highlightedTrain &&
                  (res.reason.includes(highlightedTrain.split('_')[0]) ||
                    res.block_id.includes(highlightedTrain.split('_')[0]));

                return (
                  <div
                    key={i}
                    className={`rounded-xl border p-3.5 text-xs space-y-1.5 shadow-xs transition-all duration-200 ${
                      isMatchingHighlighted
                        ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-400'
                        : 'skin-glass-sub border-stone-200/80'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-extrabold text-stone-900">
                        {res.block_id}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          res.shifted_minutes > 0
                            ? 'bg-amber-50 text-amber-900 border-amber-300'
                            : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                        }`}
                      >
                        {res.shifted_minutes > 0 ? `+${res.shifted_minutes} min` : `${res.shifted_minutes} min`}
                      </span>
                    </div>
                    <p className="text-stone-600 text-[11px] leading-relaxed font-medium">
                      {res.reason}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Shadow Block Merges */}
          <div className="pt-3 border-t border-stone-200/60">
            <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-emerald-600" />
              Harmonized Shadow Blocks (Zero Additional Corridor Cost)
            </span>
            <div className="mt-2.5 space-y-2">
              {solverResult.xai.shadow_detections.map((shadow, idx) => (
                <div
                  key={idx}
                  className="rounded-xl skin-glass-sub border border-emerald-300/40 p-3.5 text-xs shadow-xs"
                >
                  <div className="flex justify-between items-center font-mono text-[11px]">
                    <span className="text-stone-800 font-bold">{shadow.primary}</span>
                    <span className="text-emerald-800 font-extrabold bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-300">
                      Saved: {shadow.time_saved_hours}h
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-stone-600 font-medium">
                    Shadowed block: <span className="text-emerald-800 font-mono font-bold">{shadow.shadow}</span> nested inside primary track occupation window.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Solver Convergence & Telemetry Events */}
        <div className="skin-glass-card specular-sheen rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200/60">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-800 border border-emerald-300/40">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
              <h3 className="text-sm font-bold text-stone-900 font-sans tracking-tight">
                Convergence Telemetry Stream
              </h3>
            </div>
            <span className="cockpit-dark-chip font-mono text-xs text-stone-300">
              Branch & Bound
            </span>
          </div>

          {/* Telemetry Progress Visualizer */}
          <div className="space-y-3">
            <p className="text-xs text-stone-500 font-medium">
              Real-time objective relaxation bound tightening towards global optimum:
            </p>

            <div className="rounded-xl skin-glass-sub p-3.5 space-y-3">
              {telemetryData
                .filter((_, idx) => {
                  if (solverStatus !== 'solving') return true;
                  const threshold = [15, 35, 55, 75, 95][idx] || 0;
                  return solvingProgress >= threshold;
                })
                .map((event, i, arr) => {
                  const gap = Math.abs(event.objective_cost - event.best_bound);
                  const progressPct = Math.max(10, 100 - (gap / event.objective_cost) * 100);
                  const isLatest = solverStatus === 'solving' && i === arr.length - 1;

                  return (
                    <div
                      key={event.iteration}
                      className={`space-y-1 transition-all duration-300 ${
                        isLatest ? 'bg-amber-100/60 p-2 rounded-lg border border-amber-300' : ''
                      }`}
                    >
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-stone-600 font-bold flex items-center gap-1">
                          {isLatest && <span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-ping" />}
                          Iter #{event.iteration}
                        </span>
                        <span className="text-stone-700 font-semibold">Cost: {event.objective_cost.toFixed(1)}</span>
                        <span className="text-sky-800 font-semibold">Bound: {event.best_bound.toFixed(1)}</span>
                        <span className="text-emerald-700 font-black">{event.time_sec}s</span>
                      </div>
                      <div className="h-2 w-full bg-stone-200/50 rounded-full overflow-hidden skin-glass-inset">
                        <div
                          className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, progressPct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Train Slot Adjustments Preview - Clickable to Cross-Highlight */}
          <div className="pt-3 border-t border-stone-200/60">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-bold text-stone-700">
                Punctuality Schedule Impact (Bhopal Section)
              </span>
              <span className="text-[10px] text-stone-400">Click train to inspect rationale</span>
            </div>

            <div className="space-y-2">
              {Object.entries(solverResult.train_schedules).map(([train, sched]) => {
                const isSelected = highlightedTrain === train;

                return (
                  <div
                    key={train}
                    onClick={() => setHighlightedTrain(isSelected ? null : train)}
                    className={`flex items-center justify-between text-xs px-3 py-2 rounded-xl border font-mono shadow-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500'
                        : 'skin-glass-sub border-stone-200/80 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <span className="text-stone-800 font-bold truncate max-w-[200px]">{train}</span>
                      {isSelected && (
                        <span className="text-[9px] font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded-[7px]">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-stone-500 font-medium">
                        {Math.floor(sched.start / 60)}:{String(sched.start % 60).padStart(2, '0')}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          sched.delay === 0
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {sched.delay === 0 ? 'ON TIME' : `+${sched.delay}m`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Indian Railways 10-Hour Loco Pilot Duty Guard Module */}
      <div className="pt-2">
        <CrewDutyGuard />
      </div>
    </div>
  );
};


