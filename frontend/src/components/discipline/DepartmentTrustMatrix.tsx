import React, { useState, useMemo, useCallback } from 'react';
import {
  Award,
  ShieldAlert,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Flame,
  RotateCcw,
  FileText,
  Zap,
  Train,
  Cpu,
} from 'lucide-react';

/**
 * LINE CLEAR (SAVIAN) - Indian Railways AI Operations Cockpit
 * DepartmentTrustMatrix.tsx: Departmental Discipline Gamification, Trust Scores & CP-SAT Solver Priority
 */

export interface DepartmentTrustMatrixProps {
  onDepartmentPenaltyApplied?: (deptCode: string, penaltyRule: string) => void;
}

export interface DepartmentRecord {
  code: string;
  name: string;
  category: string;
  trustScore: number;
  tier: 'GOLD' | 'SILVER' | 'PROBATION' | 'UNDER_REVIEW';
  tierLabel: string;
  totalBlocks: number;
  overrunCount: number;
  avgOverrunMinutes: number;
  priorityWeight: number; // CP-SAT solver weight (0.0 to 1.0)
  icon: typeof Train;
  accentClass: string;
  badgeClass: string;
  borderClass: string;
  penaltyActive: boolean;
}

export interface BlockAuditLog {
  id: string;
  timestamp: string;
  departmentCode: string;
  blockType: string;
  locationKm: string;
  grantedDurationMins: number;
  actualDurationMins: number;
  varianceMins: number;
  status: 'COMPLIANT' | 'MINOR_OVERRUN' | 'SEVERE_PENALTY';
}

const INITIAL_DEPARTMENTS: DepartmentRecord[] = [
  {
    code: 'P-WAY',
    name: 'Permanent Way (Track Engineering)',
    category: 'Track Machine & Rail Maintenance',
    trustScore: 94.2,
    tier: 'GOLD',
    tierLabel: 'Gold / High Priority',
    totalBlocks: 142,
    overrunCount: 4,
    avgOverrunMinutes: 8,
    priorityWeight: 1.0,
    icon: Train,
    accentClass: 'text-amber-400',
    badgeClass: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    borderClass: 'border-amber-500/40 hover:border-amber-500/70',
    penaltyActive: false,
  },
  {
    code: 'S&T',
    name: 'Signal & Telecommunication',
    category: 'Point Machines, Axle Counters & Interlocking',
    trustScore: 88.5,
    tier: 'SILVER',
    tierLabel: 'Silver / Standard Priority',
    totalBlocks: 96,
    overrunCount: 8,
    avgOverrunMinutes: 14,
    priorityWeight: 0.85,
    icon: Cpu,
    accentClass: 'text-cyan-400',
    badgeClass: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
    borderClass: 'border-cyan-500/40 hover:border-cyan-500/70',
    penaltyActive: false,
  },
  {
    code: 'OHE',
    name: 'Overhead Electrical Traction (TRD)',
    category: '25kV Catenary, Cantilever & Sub-Stations',
    trustScore: 68.4,
    tier: 'PROBATION',
    tierLabel: 'Probation / Penalty Active',
    totalBlocks: 74,
    overrunCount: 21,
    avgOverrunMinutes: 36,
    priorityWeight: 0.45,
    icon: Zap,
    accentClass: 'text-red-400',
    badgeClass: 'bg-red-500/20 border-red-500/50 text-red-300 animate-pulse',
    borderClass: 'border-red-500/50 hover:border-red-500/80 shadow-lg shadow-red-950/30',
    penaltyActive: true,
  },
];

const INITIAL_AUDIT_LOGS: BlockAuditLog[] = [
  {
    id: 'LOG-8812',
    timestamp: 'Today 05:40 IST',
    departmentCode: 'P-WAY',
    blockType: 'CSM Tamping Machine Alignment',
    locationKm: 'Km 46.200 - 47.800',
    grantedDurationMins: 120,
    actualDurationMins: 124,
    varianceMins: 4,
    status: 'COMPLIANT',
  },
  {
    id: 'LOG-8809',
    timestamp: 'Today 03:15 IST',
    departmentCode: 'OHE',
    blockType: 'Dropper & Isolator Maintenance',
    locationKm: 'Km 52.400 - 54.000',
    grantedDurationMins: 90,
    actualDurationMins: 135,
    varianceMins: 45,
    status: 'SEVERE_PENALTY',
  },
  {
    id: 'LOG-8804',
    timestamp: 'Yesterday 14:20 IST',
    departmentCode: 'S&T',
    blockType: 'Point Machine 104-B Testing',
    locationKm: 'Bhopal North Yard',
    grantedDurationMins: 60,
    actualDurationMins: 68,
    varianceMins: 8,
    status: 'MINOR_OVERRUN',
  },
  {
    id: 'LOG-8798',
    timestamp: 'Yesterday 10:00 IST',
    departmentCode: 'P-WAY',
    blockType: 'Ultrasonic Flaw Detection (USFD)',
    locationKm: 'Km 78.000 - 82.500',
    grantedDurationMins: 180,
    actualDurationMins: 175,
    varianceMins: -5,
    status: 'COMPLIANT',
  },
];

export const DepartmentTrustMatrix: React.FC<DepartmentTrustMatrixProps> = ({
  onDepartmentPenaltyApplied,
}) => {
  const [departments, setDepartments] = useState<DepartmentRecord[]>(INITIAL_DEPARTMENTS);
  const [auditLogs, setAuditLogs] = useState<BlockAuditLog[]>(INITIAL_AUDIT_LOGS);
  const [isSimulatedOverstay, setIsSimulatedOverstay] = useState<boolean>(false);

  // Trigger interactive 45m overstay simulation for S&T
  const handleSimulateSntOverstay = useCallback(() => {
    setIsSimulatedOverstay(true);

    // Update S&T metrics
    setDepartments((prev) =>
      prev.map((dept) => {
        if (dept.code === 'S&T') {
          const newScore = 76.4; // Drops from 88.5% to 76.4% (< 85% threshold)
          return {
            ...dept,
            trustScore: newScore,
            tier: 'UNDER_REVIEW',
            tierLabel: 'Under Review / Penalty Triggered',
            overrunCount: dept.overrunCount + 1,
            avgOverrunMinutes: Math.round((dept.avgOverrunMinutes * dept.overrunCount + 45) / (dept.overrunCount + 1)),
            priorityWeight: 0.60,
            badgeClass: 'bg-orange-500/20 border-orange-500/50 text-orange-300 animate-pulse',
            borderClass: 'border-orange-500/60 bg-orange-950/10 shadow-lg shadow-orange-950/40',
            penaltyActive: true,
          };
        }
        return dept;
      })
    );

    // Prepend new simulated audit log entry
    const newLog: BlockAuditLog = {
      id: `LOG-SIM-${Date.now().toString().slice(-4)}`,
      timestamp: 'Just Now (Simulated)',
      departmentCode: 'S&T',
      blockType: 'Axle Counter Dual-Card Commissioning',
      locationKm: 'Vidisha Ghat (Km 54.0)',
      grantedDurationMins: 60,
      actualDurationMins: 105,
      varianceMins: 45,
      status: 'SEVERE_PENALTY',
    };

    setAuditLogs((prev) => [newLog, ...prev]);

    if (onDepartmentPenaltyApplied) {
      onDepartmentPenaltyApplied(
        'S&T',
        'Trust score dropped to 76.4%. Daytime block ceiling restricted to 60m; priority weight de-rated to 0.60.'
      );
    }
  }, [onDepartmentPenaltyApplied]);

  // Reset simulation back to initial authentic state
  const handleResetSimulation = useCallback(() => {
    setIsSimulatedOverstay(false);
    setDepartments(INITIAL_DEPARTMENTS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
  }, []);

  const sntRecord = useMemo(() => {
    return departments.find((d) => d.code === 'S&T');
  }, [departments]);

  return (
    <div className="w-full max-w-5xl mx-auto font-sans text-slate-100">
      
      {/* Outer Cockpit Container */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900/95 backdrop-blur-md shadow-2xl shadow-black/60">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 bg-slate-950/70 px-5 py-3.5 gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold tracking-tight text-white font-mono">
                  DEPARTMENTAL TRUST MATRIX (DISCIPLINE ENGINE)
                </h2>
                <span className="rounded bg-slate-800 border border-slate-700 px-1.5 py-0.5 text-[10px] font-mono text-cyan-300">
                  CP-SAT SOLVER WEIGHTED
                </span>
              </div>
              <p className="text-xs text-slate-400">
                P-Way • S&T • OHE Block Overstay Governance & Mathematical Priority Penalties
              </p>
            </div>
          </div>

          {/* Action Simulator Controls */}
          <div className="flex items-center gap-2">
            {!isSimulatedOverstay ? (
              <button
                type="button"
                onClick={handleSimulateSntOverstay}
                className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all flex items-center gap-1.5 shadow-md shadow-amber-950/40 hover:scale-[1.02] cursor-pointer"
                title="Simulate a 45-minute overstay by S&T to test automatic AI penalty de-rating"
              >
                <Flame className="w-3.5 h-3.5 text-red-950" />
                <span>Simulate 45m Block Overstay (S&T)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleResetSimulation}
                className="px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                <span>Reset Simulation</span>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DEPARTMENTAL SCOREBOARD CARDS */}
        {/* ========================================================================= */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-950/40 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Corridor Historical Trust Scores & Solver Scheduling Tiers
            </h3>
            <span className="text-[11px] font-mono text-slate-500">
              Threshold for Daytime Priority: ≥ 85.0%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {departments.map((dept) => {
              const IconComp = dept.icon;
              return (
                <div
                  key={dept.code}
                  className={`rounded-xl border ${dept.borderClass} bg-slate-800/40 p-4 space-y-3 transition-all duration-300`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-700/60">
                        <IconComp className={`w-5 h-5 ${dept.accentClass}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-sm text-slate-100">
                            {dept.code}
                          </span>
                          {dept.penaltyActive && (
                            <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate max-w-[170px]">
                          {dept.category}
                        </p>
                      </div>
                    </div>

                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${dept.badgeClass}`}>
                      {dept.tierLabel}
                    </span>
                  </div>

                  {/* Trust Score Percentage Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">Historical Trust Score:</span>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-xl font-extrabold ${dept.accentClass}`}>
                          {dept.trustScore.toFixed(1)}%
                        </span>
                        {dept.trustScore >= 85 ? (
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                        )}
                      </div>
                    </div>

                    {/* Visual Progress Bar with 85% marker */}
                    <div className="relative h-2 w-full rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-700 ${
                          dept.trustScore >= 90
                            ? 'bg-amber-400'
                            : dept.trustScore >= 85
                            ? 'bg-cyan-400'
                            : dept.trustScore >= 75
                            ? 'bg-orange-400'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${dept.trustScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Quantitative Track Record */}
                  <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
                    <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                      <div className="text-slate-500 text-[10px]">BLOCKS</div>
                      <div className="text-slate-200 font-bold mt-0.5">{dept.totalBlocks}</div>
                    </div>
                    <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                      <div className="text-slate-500 text-[10px]">OVERRUNS</div>
                      <div className={`font-bold mt-0.5 ${dept.overrunCount > 10 ? 'text-red-400' : 'text-slate-200'}`}>
                        {dept.overrunCount}
                      </div>
                    </div>
                    <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                      <div className="text-slate-500 text-[10px]">AVG OVER</div>
                      <div className="text-slate-200 font-bold mt-0.5">{dept.avgOverrunMinutes}m</div>
                    </div>
                  </div>

                  {/* CP-SAT Weight Rating */}
                  <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between border-t border-slate-800 pt-2">
                    <span className="text-slate-500">Solver Priority Weight:</span>
                    <span className="text-slate-200 font-bold">W = {dept.priorityWeight.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SMART PENALTY RULE EXPLANATION (AI CP-SAT SOLVER CONSTRAINTS) */}
        {/* ========================================================================= */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-900/80 space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Automated AI Scheduling Penalty Consequences (CP-SAT Queue)</span>
          </div>

          {/* OHE Penalty Callout Banner */}
          <div className="rounded-xl border border-red-500/40 bg-gradient-to-r from-red-950/40 via-slate-900/90 to-red-950/20 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-red-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                ACTIVE DISCIPLINE PENALTY: OHE DEPARTMENT (TRUST SCORE 68.4%)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 border border-red-500/50 text-red-200 font-semibold">
                NIGHT SHADOW ONLY
              </span>
            </div>

            <p className="text-xs text-slate-300 font-mono leading-relaxed">
              &quot;OHE department is mathematically downgraded in the CP-SAT solver priority queue. Future daytime block requests are restricted; OHE work is forced into night shadow windows (01:00–04:30) until trust score exceeds 85%.&quot;
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-slate-400 pt-1">
              <span>↳ Corridor Traffic Impact: Avoided 14 peak daytime express train loops.</span>
              <span>↳ Recovery Requirement: 12 consecutive on-time blocks (+1.4% trust gain per clean block).</span>
            </div>
          </div>

          {/* S&T Simulation Dynamic Alert (if triggered) */}
          {isSimulatedOverstay && sntRecord && (
            <div className="rounded-xl border border-orange-500/50 bg-orange-950/20 p-4 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-orange-300 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  SIMULATED PENALTY ENFORCED: S&T DEPARTMENT DE-RATED
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-950 border border-orange-500/50 text-orange-200 font-semibold">
                  TIER DEGRADED
                </span>
              </div>

              <p className="text-xs text-slate-300 font-mono leading-relaxed">
                A 45-minute overstay on Vidisha Ghat dropped S&T from <strong className="text-cyan-400">88.5%</strong> to{' '}
                <strong className="text-orange-400">76.4%</strong>. S&T daytime block allotment ceiling is immediately clamped to a maximum of 60 minutes.
              </p>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* AUDIT LOG HISTORY TABLE */}
        {/* ========================================================================= */}
        <div className="p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>Immutable Corridor Block Duration Audit Log</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-500">
              Recorded via FOIS Digital Siding Clearing Interlock
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/50">
            <table className="w-full text-left text-xs font-mono">
              <thead className="border-b border-slate-800 bg-slate-900/80 text-[11px] text-slate-400 uppercase">
                <tr>
                  <th className="px-4 py-2.5">Log ID / Time</th>
                  <th className="px-4 py-2.5">Dept</th>
                  <th className="px-4 py-2.5">Maintenance Scope & Location</th>
                  <th className="px-4 py-2.5 text-right">Granted</th>
                  <th className="px-4 py-2.5 text-right">Actual</th>
                  <th className="px-4 py-2.5 text-right">Variance</th>
                  <th className="px-4 py-2.5 text-center">Compliance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {auditLogs.map((log) => {
                  const statusStyle = {
                    COMPLIANT: {
                      badge: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
                      icon: CheckCircle2,
                      label: 'COMPLIANT',
                    },
                    MINOR_OVERRUN: {
                      badge: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
                      icon: Clock,
                      label: 'MINOR OVERRUN',
                    },
                    SEVERE_PENALTY: {
                      badge: 'bg-red-500/20 border-red-500/50 text-red-300 animate-pulse font-bold',
                      icon: XCircle,
                      label: 'PENALIZED',
                    },
                  }[log.status];

                  const IconStatus = statusStyle.icon;

                  return (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-bold text-slate-200">{log.id}</div>
                        <div className="text-[10px] text-slate-500">{log.timestamp}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-bold text-cyan-300">
                        {log.departmentCode}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-200">{log.blockType}</div>
                        <div className="text-[10px] text-slate-500">{log.locationKm}</div>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-400 whitespace-nowrap">
                        {log.grantedDurationMins}m
                      </td>
                      <td className="px-4 py-3 text-right text-slate-200 font-bold whitespace-nowrap">
                        {log.actualDurationMins}m
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap font-bold">
                        <span
                          className={
                            log.varianceMins > 15
                              ? 'text-red-400'
                              : log.varianceMins > 0
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }
                        >
                          {log.varianceMins > 0 ? `+${log.varianceMins}m` : `${log.varianceMins}m`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border ${statusStyle.badge}`}
                        >
                          <IconStatus className="w-3 h-3" />
                          {statusStyle.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800 bg-slate-950 px-5 py-3 text-[11px] text-slate-500 font-mono">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ministry of Railways Integrated Block Management System (IBMS) Validated.</span>
          </div>
          <div className="text-slate-400">
            CP-SAT Solver Objective: Minimize Corridor Total Passenger Minutes of Delay (TPMD)
          </div>
        </div>

      </div>

    </div>
  );
};

export default DepartmentTrustMatrix;
