import React, { useState, useMemo, useCallback } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Clock,
  UserCheck,
  Users,
  CheckCircle2,
  Train,
  MapPin,
  Timer,
  FastForward,
  Radio,
  Search,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

/**
 * LINE CLEAR (SAVIAN) - Indian Railways AI Operations Cockpit
 * CrewDutyGuard.tsx: GR/SR 10-Hour Pilot Running Duty Compliance & Dynamic Relief Dispatch
 */

export interface CrewDutyRecord {
  trainId: string;
  trainName: string;
  pilotId: string;
  pilotName: string;
  dutyStartTime: string;
  cumulativeHours: number;
  thresholdHours: number;
  reliefStation: string;
}

export interface CrewDutyGuardProps {
  records?: CrewDutyRecord[];
  onDispatchRelief?: (trainId: string) => void;
}

export type DutyStatus = 'NORMAL' | 'WARNING' | 'CRITICAL_VIOLATION';

// Authentic Indian Railways Corridor Operational Crew Baseline Fixtures
const DEFAULT_CREW_RECORDS: CrewDutyRecord[] = [
  {
    trainId: 'BOXN-9021',
    trainName: 'Coal Rake BOXN-9021 (Loaded 4,200T)',
    pilotId: 'LP-WCR-4482',
    pilotName: 'Rajendra K. Sharma (Sr. LP)',
    dutyStartTime: '04:30 IST',
    cumulativeHours: 9.75, // 9h 45m -> WARNING
    thresholdHours: 10.0,
    reliefStation: 'Bhopal Jn (Km 89.2)',
  },
  {
    trainId: 'BLC-4018',
    trainName: 'Container Express BLC-4018 (Double Stack)',
    pilotId: 'LP-NCR-3190',
    pilotName: 'Amit Verma (LP Goods)',
    dutyStartTime: '04:00 IST',
    cumulativeHours: 10.25, // 10h 15m -> CRITICAL_VIOLATION
    thresholdHours: 10.0,
    reliefStation: 'Bina Jn (Km 142.6)',
  },
  {
    trainId: 'BTPN-6612',
    trainName: 'POL Tanker BTPN-6612 (IOCL Siding)',
    pilotId: 'LP-NR-5511',
    pilotName: 'Harpreet Singh (LP Goods)',
    dutyStartTime: '06:45 IST',
    cumulativeHours: 7.5, // 7h 30m -> NORMAL
    thresholdHours: 10.0,
    reliefStation: 'Itarsi Jn (Km 18.4)',
  },
  {
    trainId: 'BRNA-8104',
    trainName: 'Steel Coil Rake BRNA-8104 (SAIL)',
    pilotId: 'LP-WCR-2894',
    pilotName: 'S. K. Yadav (Sr. LP)',
    dutyStartTime: '05:30 IST',
    cumulativeHours: 8.8, // 8h 48m -> NORMAL (Approaching Warning)
    thresholdHours: 10.0,
    reliefStation: 'Vidisha (Km 54.0)',
  },
];

// Helper to format decimal hours into "Xh Ym"
function formatHours(decimalHours: number): string {
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);
  return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
}

// Compute Duty Status based on Indian Railways GR/SR
function getDutyStatus(hours: number): DutyStatus {
  if (hours >= 10.0) return 'CRITICAL_VIOLATION';
  if (hours >= 9.0) return 'WARNING';
  return 'NORMAL';
}

export const CrewDutyGuard: React.FC<CrewDutyGuardProps> = ({
  records: incomingRecords,
  onDispatchRelief,
}) => {
  const records = useMemo(() => {
    return incomingRecords && incomingRecords.length > 0
      ? incomingRecords
      : DEFAULT_CREW_RECORDS;
  }, [incomingRecords]);

  // Local mitigation states (trainId -> state)
  const [dispatchedReliefs, setDispatchedReliefs] = useState<Record<string, boolean>>({});
  const [advancedWindows, setAdvancedWindows] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'WARNINGS_ONLY' | 'COMPLIANT'>('ALL');

  // Handle Dispatch Relief action
  const handleDispatchRelief = useCallback(
    (trainId: string) => {
      setDispatchedReliefs((prev) => ({ ...prev, [trainId]: true }));
      if (onDispatchRelief) {
        onDispatchRelief(trainId);
      }
    },
    [onDispatchRelief]
  );

  // Handle Advance Block Window action
  const handleAdvanceBlock = useCallback((trainId: string) => {
    setAdvancedWindows((prev) => ({ ...prev, [trainId]: true }));
  }, []);

  // Summary counts
  const summary = useMemo(() => {
    let normal = 0;
    let warning = 0;
    let critical = 0;
    records.forEach((r) => {
      const status = getDutyStatus(r.cumulativeHours);
      if (status === 'CRITICAL_VIOLATION') critical++;
      else if (status === 'WARNING') warning++;
      else normal++;
    });
    return { normal, warning, critical, total: records.length };
  }, [records]);

  // Filtered list
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const status = getDutyStatus(rec.cumulativeHours);
      const matchesSearch =
        rec.trainId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.trainName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.pilotId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.pilotName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.reliefStation.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (filterTab === 'WARNINGS_ONLY') {
        return status === 'WARNING' || status === 'CRITICAL_VIOLATION';
      }
      if (filterTab === 'COMPLIANT') {
        return status === 'NORMAL';
      }
      return true;
    });
  }, [records, searchQuery, filterTab]);

  // Find priority alert train (focus on BOXN-9021 or the highest violation)
  const priorityAlertRecord = useMemo(() => {
    const boxn = records.find((r) => r.trainId === 'BOXN-9021');
    if (boxn && (getDutyStatus(boxn.cumulativeHours) !== 'NORMAL')) {
      return boxn;
    }
    return records.find((r) => getDutyStatus(r.cumulativeHours) !== 'NORMAL') || null;
  }, [records]);

  return (
    <div className="w-full max-w-5xl mx-auto font-sans text-stone-900">
      
      {/* Outer Cockpit Container */}
      <div className="relative overflow-hidden rounded-2xl border border-[#ded9cb] bg-[#faf8f3] shadow-lg shadow-stone-900/10">
        
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#e5dfd3] bg-[#f4efe4] px-5 py-3.5 gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 border border-amber-300 text-amber-800 shadow-sm">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold tracking-tight text-stone-900 font-mono">
                  CREW DUTY GUARD (GR/SR 10-HR COMPLIANCE)
                </h2>
                <span className="rounded-md bg-stone-200/80 border border-stone-300 px-1.5 py-0.5 text-[10px] font-mono text-stone-700 font-semibold">
                  HOER SEC. 130
                </span>
              </div>
              <p className="text-xs text-stone-500 font-medium">
                Statutory Running Duty Ceiling • Loop Detention Protection • Active Relief Dispatch
              </p>
            </div>
          </div>

          {/* Aggregate Telemetry Status Pills */}
          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-[#ded8c9] text-stone-700 shadow-sm">
              <Users className="w-3.5 h-3.5 text-stone-500" />
              <span className="font-semibold">{summary.total} CREWS</span>
            </span>

            {summary.critical > 0 && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 animate-pulse font-bold shadow-sm">
                <span className="h-2 w-2 rounded-full bg-rose-600" />
                {summary.critical} CRITICAL
              </span>
            )}

            {summary.warning > 0 && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 font-semibold shadow-sm">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                {summary.warning} AT RISK
              </span>
            )}

            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 font-semibold shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              {summary.normal} NORMAL
            </span>
          </div>
        </div>

        {/* 🚨 ADVISORY ALERT BANNER (For WARNING or CRITICAL VIOLATION trains) */}
        {priorityAlertRecord && (
          <div className="border-b border-amber-200 bg-amber-50/70 p-4 sm:p-5 relative overflow-hidden">
            {/* Ambient Alert Glow */}
            <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-amber-400/15 blur-xl" />

            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Alert Text Details */}
              <div className="space-y-1.5 max-w-3xl">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500 text-stone-950 tracking-wide uppercase shadow-sm">
                    <AlertTriangle className="w-3 h-3" />
                    DISPATCH ADVISORY ALERT
                  </span>
                  <span className="text-xs text-amber-900/80 font-mono font-medium">
                    Loop Detention Threat: Over-Duty Stabling Risk
                  </span>
                </div>

                <div className="text-xs sm:text-sm text-stone-800 font-mono leading-relaxed">
                  <span className="text-amber-800 font-bold">🚨 CREW DUTY LIMIT ALERT:</span>{' '}
                  Loco Pilot <strong className="text-stone-900 underline decoration-amber-500/50">{priorityAlertRecord.pilotId}</strong> on{' '}
                  <strong className="text-stone-900">{priorityAlertRecord.trainName}</strong> has reached{' '}
                  <strong className="text-amber-900 bg-amber-200/70 px-1.5 py-0.5 rounded border border-amber-300 font-bold">
                    {formatHours(priorityAlertRecord.cumulativeHours)}
                  </strong>{' '}
                  continuous duty. Loop wait exceeds safe limit.
                </div>

                <p className="text-[11px] text-stone-600 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-amber-700" />
                  <span>
                    Scheduled Relief Station:{' '}
                    <strong className="text-stone-900">{priorityAlertRecord.reliefStation}</strong>
                  </span>
                  <span className="text-stone-400">•</span>
                  <span>Section Threshold: {priorityAlertRecord.thresholdHours.toFixed(1)} hrs Legal Ceiling</span>
                </p>
              </div>

              {/* Actionable Mitigation Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-shrink-0">
                {/* Action 1: Advance Block Window */}
                <button
                  type="button"
                  onClick={() => handleAdvanceBlock(priorityAlertRecord.trainId)}
                  disabled={advancedWindows[priorityAlertRecord.trainId]}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold font-mono flex items-center justify-center gap-1.5 transition-all duration-200 border ${
                    advancedWindows[priorityAlertRecord.trainId]
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 cursor-default'
                      : 'bg-white hover:bg-[#f2ede4] text-stone-700 border-[#ded8c9] shadow-sm cursor-pointer'
                  }`}
                  title="Prioritize section signals to clear train before 10h threshold"
                >
                  <FastForward className="w-3.5 h-3.5 text-stone-500" />
                  {advancedWindows[priorityAlertRecord.trainId] ? (
                    <span>Block Window Advanced (-35m)</span>
                  ) : (
                    <span>Advance Block Window by 35 mins</span>
                  )}
                </button>

                {/* Action 2: Dispatch Relief Crew */}
                <button
                  type="button"
                  onClick={() => handleDispatchRelief(priorityAlertRecord.trainId)}
                  disabled={dispatchedReliefs[priorityAlertRecord.trainId]}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono flex items-center justify-center gap-1.5 transition-all duration-200 border cursor-pointer ${
                    dispatchedReliefs[priorityAlertRecord.trainId]
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-800 cursor-default shadow-sm'
                      : 'bg-amber-500 hover:bg-amber-400 text-stone-950 border-amber-400 shadow-md shadow-amber-900/20 hover:scale-[1.02]'
                  }`}
                  title={`Deploy standby Loco Pilot crew to ${priorityAlertRecord.reliefStation}`}
                >
                  <UserCheck className="w-4 h-4" />
                  {dispatchedReliefs[priorityAlertRecord.trainId] ? (
                    <span className="flex items-center gap-1 text-emerald-800 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Relief Dispatched (ETA 12 mins)
                    </span>
                  ) : (
                    <span>Dispatch Relief Crew to {priorityAlertRecord.reliefStation.split(' ')[0]}</span>
                  )}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-b border-[#e5dfd3] bg-[#f7f4ec] px-5 py-3 gap-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setFilterTab('ALL')}
              className={`px-3 py-1 rounded-xl text-xs font-mono transition-colors cursor-pointer ${
                filterTab === 'ALL'
                  ? 'bg-white text-stone-900 font-bold border border-[#ded8c9] shadow-sm'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              All Corridor Trains ({records.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('WARNINGS_ONLY')}
              className={`px-3 py-1 rounded-xl text-xs font-mono transition-colors flex items-center gap-1 cursor-pointer ${
                filterTab === 'WARNINGS_ONLY'
                  ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300 shadow-sm'
                  : 'text-stone-500 hover:text-amber-800'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-amber-700" />
              Duty Alerts ({summary.warning + summary.critical})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('COMPLIANT')}
              className={`px-3 py-1 rounded-xl text-xs font-mono transition-colors cursor-pointer ${
                filterTab === 'COMPLIANT'
                  ? 'bg-emerald-100 text-emerald-900 font-bold border border-emerald-300 shadow-sm'
                  : 'text-stone-500 hover:text-emerald-800'
              }`}
            >
              Compliant (&lt;9h) ({summary.normal})
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search train, pilot ID, station..."
              className="w-full bg-white border border-[#ded8c9] rounded-xl pl-8 pr-3 py-1.5 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-emerald-700 font-mono transition-colors shadow-sm"
            />
          </div>
        </div>

        {/* Corridor Pilot Duty Monitor Table / Cards */}
        <div className="p-4 sm:p-5 space-y-3.5 bg-[#faf8f3]">
          {filteredRecords.length === 0 ? (
            <div className="text-center py-10 text-stone-400 font-mono text-xs">
              No train crews match the selected filter criteria.
            </div>
          ) : (
            filteredRecords.map((record) => {
              const status = getDutyStatus(record.cumulativeHours);
              const percentage = Math.min(100, (record.cumulativeHours / record.thresholdHours) * 100);
              const isReliefDispatched = dispatchedReliefs[record.trainId];
              const isBlockAdvanced = advancedWindows[record.trainId];

              // Color configs based on GR/SR status
              const statusConfig = {
                NORMAL: {
                  badge: 'bg-emerald-50 border-emerald-200 text-emerald-800',
                  badgeLabel: 'NORMAL DUTY',
                  border: 'border-[#ded8c9] bg-white hover:bg-[#faf8f3] shadow-sm',
                  progressBar: 'bg-emerald-600',
                  accentText: 'text-emerald-800 font-bold',
                  hazardStrobe: '',
                },
                WARNING: {
                  badge: 'bg-amber-50 border-amber-300 text-amber-800 font-bold animate-pulse',
                  badgeLabel: 'WARNING (9.0h - 9.9h)',
                  border: 'border-amber-300 bg-[#fffdf9] shadow-sm hover:bg-[#fffcf5]',
                  progressBar: 'bg-amber-500',
                  accentText: 'text-amber-800 font-bold',
                  hazardStrobe: '',
                },
                CRITICAL_VIOLATION: {
                  badge: 'bg-rose-50 border-rose-300 text-rose-800 font-bold animate-pulse',
                  badgeLabel: 'CRITICAL VIOLATION (≥10.0h)',
                  border: 'border-rose-300 bg-[#fffafa] shadow-sm hover:bg-[#fff5f5]',
                  progressBar: 'bg-rose-600',
                  accentText: 'text-rose-800 font-bold',
                  hazardStrobe: 'ring-1 ring-rose-400/40',
                },
              }[status];

              return (
                <div
                  key={record.trainId}
                  className={`rounded-2xl border ${statusConfig.border} ${statusConfig.hazardStrobe} p-4 transition-all duration-200`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    
                    {/* Left: Train & Pilot Details */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      
                      {/* Top Header Row */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-sm text-stone-900 flex items-center gap-1.5">
                          <Train className="w-4 h-4 text-stone-500" />
                          {record.trainId}
                        </span>
                        <span className="text-stone-400 text-xs font-mono">•</span>
                        <span className="text-xs text-stone-600 font-medium truncate">
                          {record.trainName}
                        </span>
                        
                        {/* Status Badge */}
                        <span
                          className={`ml-auto sm:ml-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono border ${statusConfig.badge}`}
                        >
                          {status === 'NORMAL' && <CheckCircle2 className="w-3 h-3 text-emerald-700" />}
                          {status === 'WARNING' && <AlertTriangle className="w-3 h-3 text-amber-700" />}
                          {status === 'CRITICAL_VIOLATION' && <AlertCircle className="w-3 h-3 text-rose-700" />}
                          {statusConfig.badgeLabel}
                        </span>

                        {isReliefDispatched && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-50 border border-emerald-300 text-emerald-800 font-semibold shadow-sm">
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                            Relief Dispatched (ETA 12 mins)
                          </span>
                        )}

                        {isBlockAdvanced && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-stone-100 border border-stone-300 text-stone-700 font-semibold">
                            <FastForward className="w-3 h-3 text-stone-600" />
                            Window Advanced (-35m)
                          </span>
                        )}
                      </div>

                      {/* Pilot ID & Sign-on details */}
                      <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-stone-500 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span>Loco Pilot:</span>
                          <span className="text-stone-800 font-semibold">{record.pilotName}</span>
                          <span className="text-[10px] text-stone-700 bg-[#f4efe4] px-1.5 py-0.5 rounded border border-[#ded8c9] font-medium">
                            {record.pilotId}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-stone-500">
                          <Clock className="w-3 h-3 text-stone-400" />
                          <span>Sign-On: {record.dutyStartTime}</span>
                        </div>
                        <div className="flex items-center gap-1 text-stone-500">
                          <MapPin className="w-3 h-3 text-stone-400" />
                          <span>Relief Siding: <strong className="text-stone-800">{record.reliefStation}</strong></span>
                        </div>
                      </div>

                    </div>

                    {/* Middle: Visual Running Duty Gauge */}
                    <div className="w-full lg:w-72 flex-shrink-0 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-stone-500 flex items-center gap-1">
                          <Timer className="w-3 h-3 text-stone-400" />
                          Running Duty:
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className={`text-base font-bold ${statusConfig.accentText}`}>
                            {formatHours(record.cumulativeHours)}
                          </span>
                          <span className="text-stone-400 text-[11px]">/ 10h 00m limit</span>
                        </div>
                      </div>

                      {/* Progress Bar with 9h and 10h milestone markers */}
                      <div className="relative h-2 w-full rounded-full bg-[#eee9dc] border border-[#ded8c9] overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${statusConfig.progressBar}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      {/* Milestone Indicators */}
                      <div className="flex items-center justify-between text-[10px] font-mono text-stone-500">
                        <span>0h (Sign-On)</span>
                        <span className="text-amber-800 font-medium">9.0h (Warning)</span>
                        <span className="text-rose-800 font-bold">10.0h (Legal Limit)</span>
                      </div>
                    </div>

                    {/* Right: Dispatch Mitigation Buttons (for Warning / Critical) */}
                    {(status === 'WARNING' || status === 'CRITICAL_VIOLATION') && (
                      <div className="flex items-center gap-2 flex-shrink-0 lg:border-l lg:border-[#e5dfd3] lg:pl-4">
                        {!isReliefDispatched ? (
                          <button
                            type="button"
                            onClick={() => handleDispatchRelief(record.trainId)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 transition-all duration-150 flex items-center gap-1.5 shadow-sm shadow-amber-900/20 hover:scale-[1.02] cursor-pointer"
                            title={`Dispatch relief pilot crew to ${record.reliefStation}`}
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            Dispatch Relief
                          </button>
                        ) : (
                          <div className="text-right">
                            <span className="text-[11px] font-mono text-emerald-800 flex items-center gap-1 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                              Relief En-Route
                            </span>
                            <span className="text-[10px] text-stone-500 font-mono">
                              ETA 12m to {record.reliefStation.split(' ')[0]}
                            </span>
                          </div>
                        )}

                        {!isBlockAdvanced && (
                          <button
                            type="button"
                            onClick={() => handleAdvanceBlock(record.trainId)}
                            className="px-3 py-1.5 rounded-xl text-xs font-mono text-stone-700 hover:text-stone-900 bg-white hover:bg-[#eae4d5] border border-[#ded8c9] transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
                            title="Advance block window by 35m to prevent loop wait"
                          >
                            <FastForward className="w-3 h-3 text-stone-500" />
                            Advance Block
                          </button>
                        )}
                      </div>
                    )}

                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer: Statutory Rule Documentation & Operational Notes */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#e5dfd3] bg-[#f4efe4] px-5 py-3 text-[11px] text-stone-500 font-mono">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span>Indian Railways GR/SR Rule 3.48 & HOER (Hours of Employment and Period of Rest).</span>
          </div>
          <div className="text-stone-600 font-medium">
            Automated Siding Loop Protection • Section Speed Harmonization Active
          </div>
        </div>

      </div>

    </div>
  );
};

export default CrewDutyGuard;
