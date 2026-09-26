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
    accentClass: 'text-amber-700',
    badgeClass: 'bg-amber-50 border-amber-300 text-amber-800 font-bold',
    borderClass: 'border-amber-300/80 bg-white hover:bg-[#fffdfa] shadow-sm',
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
    accentClass: 'text-emerald-800',
    badgeClass: 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold',
    borderClass: 'border-[#ded8c9] bg-white hover:bg-[#faf8f3] shadow-sm',
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
    accentClass: 'text-rose-700',
    badgeClass: 'bg-rose-50 border-rose-300 text-rose-800 font-bold animate-pulse',
    borderClass: 'border-rose-300 bg-[#fffafa] shadow-sm hover:bg-[#fff5f5]',
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
            accentClass: 'text-orange-700',
            badgeClass: 'bg-orange-50 border-orange-300 text-orange-800 animate-pulse font-bold',
            borderClass: 'border-orange-300 bg-[#fffaf5] shadow-sm',
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
    <div className="w-full max-w-5xl mx-auto font-sans text-stone-900">
      
      {/* Outer Cockpit Container */}
      <div className="relative overflow-hidden rounded-2xl skin-glass-card skin-glass-elevated specular-sheen">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-200/60 bg-white/40 px-5 py-3.5 gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-300/40 text-amber-800 shadow-xs">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold tracking-tight text-stone-900 font-mono">
                  DEPARTMENTAL TRUST MATRIX (DISCIPLINE ENGINE)
                </h2>
                <span className="cockpit-dark-chip text-[10px] font-mono text-stone-300">
                  CP-SAT SOLVER WEIGHTED
                </span>
              </div>
              <p className="text-xs text-stone-500 font-medium">
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
                className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 transition-all flex items-center gap-1.5 shadow-sm shadow-amber-900/20 hover:scale-[1.02] cursor-pointer"
                title="Simulate a 45-minute overstay by S&T to test automatic AI penalty de-rating"
              >
                <Flame className="w-3.5 h-3.5 text-stone-950" />
                <span>Simulate 45m Block Overstay (S&T)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleResetSimulation}
                className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium text-stone-700 hover:text-stone-900 bg-white hover:bg-[#eae4d5] border border-[#ded8c9] transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
                <span>Reset Simulation</span>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DEPARTMENTAL SCOREBOARD CARDS */}
        {/* ========================================================================= */}
        <div className="p-5 sm:p-6 border-b border-[#e5dfd3] bg-[#faf8f3] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-600">
              Corridor Historical Trust Scores & Solver Scheduling Tiers
            </h3>
            <span className="text-[11px] font-mono text-stone-500">
              Threshold for Daytime Priority: ≥ 85.0%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {departments.map((dept) => {
              const IconComp = dept.icon;
              return (
                <div
                  key={dept.code}
                  className={`rounded-2xl border ${dept.borderClass} p-4 space-y-3 transition-all duration-300`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-[#f4efe4] border border-[#ded8c9]">
                        <IconComp className={`w-5 h-5 ${dept.accentClass}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-sm text-stone-900">
                            {dept.code}
                          </span>
                          {dept.penaltyActive && (
                            <span className="h-2 w-2 rounded-full bg-rose-600 animate-ping" />
                          )}
                        </div>
                        <p className="text-[11px] text-stone-500 truncate max-w-[170px]">
                          {dept.category}
                        </p>
                      </div>
                    </div>

                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${dept.badgeClass}`}>
                      {dept.tierLabel}
                    </span>
                  </div>

                  {/* Trust Score Percentage Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-stone-500">Historical Trust Score:</span>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-xl font-extrabold ${dept.accentClass}`}>
                          {dept.trustScore.toFixed(1)}%
                        </span>
                        {dept.trustScore >= 85 ? (
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5 text-rose-700" />
                        )}
                      </div>
                    </div>

                    {/* Visual Progress Bar with 85% marker */}
                    <div className="relative h-2 w-full rounded-full bg-[#eee9dc] border border-[#ded8c9] overflow-hidden">
                      <div
                        className={`h-full transition-all duration-700 ${
                          dept.trustScore >= 90
                            ? 'bg-amber-500'
                            : dept.trustScore >= 85
                            ? 'bg-emerald-600'
                            : dept.trustScore >= 75
                            ? 'bg-orange-500'
                            : 'bg-rose-600'
                        }`}
                        style={{ width: `${dept.trustScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Quantitative Track Record */}
                  <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
                    <div className="p-2 rounded-xl bg-[#f7f4ec] border border-[#e5dfd3]">
                      <div className="text-stone-500 text-[10px] font-semibold">BLOCKS</div>
                      <div className="text-stone-800 font-bold mt-0.5">{dept.totalBlocks}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-[#f7f4ec] border border-[#e5dfd3]">
                      <div className="text-stone-500 text-[10px] font-semibold">OVERRUNS</div>
                      <div className={`font-bold mt-0.5 ${dept.overrunCount > 10 ? 'text-rose-700' : 'text-stone-800'}`}>
                        {dept.overrunCount}
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-[#f7f4ec] border border-[#e5dfd3]">
                      <div className="text-stone-500 text-[10px] font-semibold">AVG OVER</div>
                      <div className="text-stone-800 font-bold mt-0.5">{dept.avgOverrunMinutes}m</div>
                    </div>
                  </div>

                  {/* CP-SAT Weight Rating */}
                  <div className="text-[11px] font-mono text-stone-500 flex items-center justify-between border-t border-[#e5dfd3] pt-2">
                    <span>Solver Priority Weight:</span>
                    <span className="text-stone-800 font-bold">W = {dept.priorityWeight.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SMART PENALTY RULE EXPLANATION (AI CP-SAT SOLVER CONSTRAINTS) */}
        {/* ========================================================================= */}
        <div className="p-5 sm:p-6 border-b border-[#e5dfd3] bg-[#f9f7f2] space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-stone-700 uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-amber-700" />
            <span>Automated AI Scheduling Penalty Consequences (CP-SAT Queue)</span>
          </div>

          {/* OHE Penalty Callout Banner */}
          <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-rose-800 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
                ACTIVE DISCIPLINE PENALTY: OHE DEPARTMENT (TRUST SCORE 68.4%)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-100 border border-rose-300 text-rose-800 font-bold">
                NIGHT SHADOW ONLY
              </span>
            </div>

            <p className="text-xs text-stone-800 font-mono leading-relaxed">
              &quot;OHE department is mathematically downgraded in the CP-SAT solver priority queue. Future daytime block requests are restricted; OHE work is forced into night shadow windows (01:00–04:30) until trust score exceeds 85%.&quot;
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-stone-600 pt-1">
              <span>↳ Corridor Traffic Impact: Avoided 14 peak daytime express train loops.</span>
              <span>↳ Recovery Requirement: 12 consecutive on-time blocks (+1.4% trust gain per clean block).</span>
            </div>
          </div>

          {/* S&T Simulation Dynamic Alert (if triggered) */}
          {isSimulatedOverstay && sntRecord && (
            <div className="rounded-2xl border border-orange-200 bg-orange-50/80 p-4 space-y-2 shadow-sm animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-orange-800 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-700" />
                  SIMULATED PENALTY ENFORCED: S&T DEPARTMENT DE-RATED
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-100 border border-orange-300 text-orange-800 font-bold">
                  TIER DEGRADED
                </span>
              </div>

              <p className="text-xs text-stone-800 font-mono leading-relaxed">
                A 45-minute overstay on Vidisha Ghat dropped S&T from <strong className="text-emerald-800">88.5%</strong> to{' '}
                <strong className="text-orange-800">76.4%</strong>. S&T daytime block allotment ceiling is immediately clamped to a maximum of 60 minutes.
              </p>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* AUDIT LOG HISTORY TABLE */}
        {/* ========================================================================= */}
        <div className="p-5 sm:p-6 space-y-3 bg-[#faf8f3]">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-emerald-700" />
              <span>Immutable Corridor Block Duration Audit Log</span>
            </h3>
            <span className="text-[11px] font-mono text-stone-400">
              Recorded via FOIS Digital Siding Clearing Interlock
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#ded8c9] bg-white shadow-sm">
            <table className="w-full text-left text-xs font-mono">
              <thead className="border-b border-[#e5dfd3] bg-[#f4efe4] text-[11px] text-stone-600 uppercase font-semibold">
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
              <tbody className="divide-y divide-[#e5dfd3]">
                {auditLogs.map((log) => {
                  const statusStyle = {
                    COMPLIANT: {
                      badge: 'bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold',
                      icon: CheckCircle2,
                      label: 'COMPLIANT',
                    },
                    MINOR_OVERRUN: {
                      badge: 'bg-amber-50 border-amber-200 text-amber-800 font-semibold',
                      icon: Clock,
                      label: 'MINOR OVERRUN',
                    },
                    SEVERE_PENALTY: {
                      badge: 'bg-rose-50 border-rose-300 text-rose-800 animate-pulse font-bold',
                      icon: XCircle,
                      label: 'PENALIZED',
                    },
                  }[log.status];

                  const IconStatus = statusStyle.icon;

                  return (
                    <tr key={log.id} className="hover:bg-[#faf8f3] transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-bold text-stone-900">{log.id}</div>
                        <div className="text-[10px] text-stone-400">{log.timestamp}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-bold text-emerald-800">
                        {log.departmentCode}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-stone-800">{log.blockType}</div>
                        <div className="text-[10px] text-stone-400">{log.locationKm}</div>
                      </td>
                      <td className="px-4 py-3 text-right text-stone-500 whitespace-nowrap">
                        {log.grantedDurationMins}m
                      </td>
                      <td className="px-4 py-3 text-right text-stone-900 font-bold whitespace-nowrap">
                        {log.actualDurationMins}m
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap font-bold">
                        <span
                          className={
                            log.varianceMins > 15
                              ? 'text-rose-700'
                              : log.varianceMins > 0
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                          }
                        >
                          {log.varianceMins > 0 ? `+${log.varianceMins}m` : `${log.varianceMins}m`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] border ${statusStyle.badge}`}
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#e5dfd3] bg-[#f4efe4] px-5 py-3 text-[11px] text-stone-500 font-mono">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>Ministry of Railways Integrated Block Management System (IBMS) Validated.</span>
          </div>
          <div className="text-stone-600 font-medium">
            CP-SAT Solver Objective: Minimize Corridor Total Passenger Minutes of Delay (TPMD)
          </div>
        </div>

      </div>

    </div>
  );
};

export default DepartmentTrustMatrix;
