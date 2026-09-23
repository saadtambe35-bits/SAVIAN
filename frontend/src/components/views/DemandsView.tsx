import React, { useState } from 'react';
import {
  FileText,
  Search,
  PowerOff,
  Plus,
  Clock,
  CheckCircle2,
  ShieldCheck,
  X,
  Layers,
  Sparkles,
  AlertTriangle,
  Check,
  Trash2,
  Mic,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BlockDemand } from '@/types';
import { MOCK_DEMANDS, MOCK_STATIONS } from '@/data/mockData';
import { formatMinutesToTime } from '@/lib/utils';
import { FormT409Modal } from '@/components/cockpit/FormT409Modal';
import { VoiceDispatchModal } from '@/components/voice/VoiceDispatchModal';

interface DemandsViewProps {
  demands?: BlockDemand[];
  onAddDemand?: (demand: BlockDemand) => void;
  onUpdateDemand?: (demand: BlockDemand) => void;
  onDeleteDemand?: (id: number) => void;
}

export const DemandsView: React.FC<DemandsViewProps> = ({
  demands: propDemands,
  onAddDemand,
  onUpdateDemand,
  onDeleteDemand,
}) => {
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [localDemands, setLocalDemands] = useState<BlockDemand[]>(MOCK_DEMANDS);
  
  const demands = propDemands || localDemands;
  const [selectedDemand, setSelectedDemand] = useState<BlockDemand | null>(demands[0] || null);

  // Modals state
  const [showNewDemandModal, setShowNewDemandModal] = useState(false);
  const [showCoalignModal, setShowCoalignModal] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showFormT409, setShowFormT409] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Demand Form state
  const [formSource, setFormSource] = useState<'TMS' | 'SMMS' | 'TDMS'>('TMS');
  const [formDept, setFormDept] = useState<'P_WAY' | 'OHE' | 'S_AND_T'>('P_WAY');
  const [formFrom, setFormFrom] = useState('BINA');
  const [formTo, setFormTo] = useState('KIKA');
  const [formStartKm, setFormStartKm] = useState('2.5');
  const [formEndKm, setFormEndKm] = useState('8.0');
  const [formStartTime, setFormStartTime] = useState('02:00');
  const [formEndTime, setFormEndTime] = useState('04:30');
  const [formDuration, setFormDuration] = useState('150');
  const [formDesc, setFormDesc] = useState('');
  const [formMachinery, setFormMachinery] = useState('BCM Ballast Cleaner');
  const [formPowerBlock, setFormPowerBlock] = useState(true);
  const [formDisconnection, setFormDisconnection] = useState(true);
  const [formSeverity, setFormSeverity] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');

  // Safety Checklist state
  const [safetyChecklist, setSafetyChecklist] = useState({
    tractionCutoff: true,
    kavachBuffer: true,
    axleCounterShunt: false,
    pointsPadlocked: true,
    trainSeparationGuard: true,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCreateDemand = (e: React.FormEvent) => {
    e.preventDefault();
    const [startH, startM] = formStartTime.split(':').map(Number);
    const [endH, endM] = formEndTime.split(':').map(Number);
    const startMinutes = (startH || 0) * 60 + (startM || 0);
    const endMinutes = (endH || 0) * 60 + (endM || 0);

    const randomNum = Math.floor(100 + Math.random() * 900);
    const newDemand: BlockDemand = {
      id: Date.now(),
      demand_code: `${formSource}-2026-${randomNum}`,
      source_system: formSource,
      department: formDept,
      section_from: formFrom,
      section_to: formTo,
      start_km: parseFloat(formStartKm) || 0,
      end_km: parseFloat(formEndKm) || 10,
      requested_date: new Date().toISOString().split('T')[0],
      requested_start_minutes: startMinutes,
      requested_end_minutes: endMinutes,
      required_minutes: parseInt(formDuration, 10) || 120,
      activity_description: formDesc || `${formMachinery} maintenance occupation on ${formFrom}-${formTo}`,
      machinery_type: formMachinery,
      machinery_id: `${formMachinery.slice(0, 3).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`,
      status: 'PROPOSED',
      trust_score: 92,
      severity_tier: formSeverity,
      priority_weight: formSeverity === 'CRITICAL' ? 9.5 : formSeverity === 'HIGH' ? 8.0 : 6.0,
      power_block_required: formPowerBlock,
      disconnection_required: formDisconnection,
    };

    if (onAddDemand) {
      onAddDemand(newDemand);
    } else {
      setLocalDemands((prev) => [newDemand, ...prev]);
    }

    setSelectedDemand(newDemand);
    setShowNewDemandModal(false);
    setFormDesc('');
    showToast(`Demand ${newDemand.demand_code} submitted successfully! Added to Proposed pipeline.`);
  };

  const handleConfirmCoalignment = () => {
    if (!selectedDemand) return;
    const updated = {
      ...selectedDemand,
      status: 'APPROVED' as const,
      activity_description: `${selectedDemand.activity_description} [Co-aligned Shadow Window]`,
    };
    if (onUpdateDemand) {
      onUpdateDemand(updated);
    }
    setSelectedDemand(updated);
    setShowCoalignModal(false);
    showToast(`Shadow window harmonized for ${selectedDemand.demand_code}! Saved 2.0h corridor downtime.`);
  };

  const handleConfirmSafetyClearance = () => {
    if (!selectedDemand) return;
    const updated = {
      ...selectedDemand,
      status: 'APPROVED' as const,
    };
    if (onUpdateDemand) {
      onUpdateDemand(updated);
    }
    setSelectedDemand(updated);
    setShowSafetyModal(false);
    showToast(`Kavach SIL-4 Line-Clear safety token issued for ${selectedDemand.demand_code}! Ready for SM execution.`);
  };

  const handleConfirmFormT409 = (demand: BlockDemand) => {
    const updated = {
      ...demand,
      status: 'APPROVED' as const,
    };
    if (onUpdateDemand) {
      onUpdateDemand(updated);
    }
    setSelectedDemand(updated);
    setShowFormT409(false);
    showToast(`Authority Form T/409 Token issued for ${demand.demand_code}! Ready for Station Master execution.`);
  };

  const handleDeleteDemand = (id: number, code: string) => {
    if (onDeleteDemand) {
      onDeleteDemand(id);
    } else {
      setLocalDemands((prev) => prev.filter((d) => d.id !== id));
    }
    if (selectedDemand?.id === id) {
      const remaining = demands.filter((d) => d.id !== id);
      setSelectedDemand(remaining[0] || null);
    }
    showToast(`Demand ${code} withdrawn and removed from corridor schedule.`);
  };

  const filteredDemands = demands.filter((demand) => {
    const matchesDept = selectedDept === 'ALL' || demand.department === selectedDept;
    const matchesStatus =
      selectedStatus === 'ALL' ||
      (selectedStatus === 'CRITICAL' && demand.severity_tier === 'CRITICAL') ||
      (selectedStatus === 'HIGH' && demand.severity_tier === 'HIGH') ||
      (selectedStatus === 'APPROVED' && demand.status === 'APPROVED') ||
      (selectedStatus === 'PROPOSED' && demand.status === 'PROPOSED');
    const matchesSearch =
      demand.demand_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      demand.activity_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      demand.section_from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      demand.section_to.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 relative">
      {/* Toast feedback */}
      {toastMessage && (
        <div className="fixed bottom-12 right-6 z-50 bg-stone-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 border border-stone-700 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-stone-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header controls bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 neumorphic-card rounded-2xl p-5">
        <div className="flex items-center space-x-3.5">
          <div className="rounded-xl bg-amber-100 p-2.5 text-amber-800 border border-amber-200/70 shadow-sm">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900 tracking-tight font-sans">
              Maintenance Block Demands
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Aggregated from TMS (P-Way), SMMS (OHE), and TDMS (S&T) for Bina–Itarsi Section
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Department Filters */}
          <div className="flex bg-[#ede9df] border border-[#dcd4c6] rounded-xl p-1 shadow-inner">
            {['ALL', 'P_WAY', 'OHE', 'S_AND_T'].map((dept) => (
              <button
                key={dept}
                type="button"
                onClick={() => setSelectedDept(dept)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  selectedDept === dept
                    ? 'bg-white text-stone-900 shadow-sm border border-stone-200/60'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {dept === 'P_WAY' ? 'P-Way' : dept === 'S_AND_T' ? 'S&T' : dept}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowVoiceModal(true)}
              className="text-xs font-bold border-cyan-500/40 bg-cyan-50/90 hover:bg-cyan-100 text-cyan-950 rounded-xl shadow-sm transition-all transform active:scale-95 flex items-center gap-1.5"
              title="Voice Dispatch Assistant (BHOLU)"
            >
              <Mic className="h-3.5 w-3.5 text-cyan-600 animate-pulse" />
              <span>Voice Dispatch</span>
            </Button>

            <Button
              variant="railway"
              size="sm"
              onClick={() => setShowNewDemandModal(true)}
              className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-[0_3px_10px_rgba(16,185,129,0.3)] transition-all transform active:scale-95"
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              New Demand
            </Button>
          </div>
        </div>
      </div>

      {/* Search Input Bar & Status Filter Pills */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by demand code, station, machinery, or activity description..."
            className="w-full rounded-2xl border border-[rgba(225,220,210,0.85)] bg-[#fbf9f4] pl-11 pr-4 py-3 text-xs font-medium text-stone-800 placeholder-stone-400 shadow-[inset_2px_2px_5px_rgba(180,170,155,0.15),inset_-2px_-2px_5px_rgba(255,255,255,0.8)] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200/50"
          />
        </div>

        {/* Status Filter Pills Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mr-1">Status:</span>
            {[
              { id: 'ALL', label: 'All Status' },
              { id: 'CRITICAL', label: 'Critical Tier' },
              { id: 'HIGH', label: 'High Priority' },
              { id: 'PROPOSED', label: 'Proposed' },
              { id: 'APPROVED', label: 'Approved' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setSelectedStatus(st.id)}
                className={`px-3 py-1 rounded-xl font-bold transition-all text-xs border ${
                  selectedStatus === st.id
                    ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                    : 'bg-[#ede9df] text-stone-600 border-[#dcd4c6] hover:text-stone-900 hover:bg-[#e4ded2]'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <div className="text-xs text-stone-500 font-semibold font-mono">
            Showing {filteredDemands.length} of {demands.length} demands
          </div>
        </div>
      </div>

      {/* Main Demands Grid / Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Demands List (2 Columns) */}
        <div className="lg:col-span-2 space-y-3.5">
          {filteredDemands.length > 0 ? (
            filteredDemands.map((demand) => {
              const isSelected = selectedDemand?.id === demand.id;

              return (
                <div
                  key={demand.id}
                  onClick={() => setSelectedDemand(demand)}
                  className={`cursor-pointer rounded-2xl p-4 transition-all duration-200 ${
                    isSelected
                      ? 'neumorphic-card ring-2 ring-emerald-500/80 shadow-[0_8px_20px_rgba(16,185,129,0.15)] bg-white'
                      : 'neumorphic-card neumorphic-card-hover'
                  }`}
                >
                  {/* Header Row: ID, Department Pill, Severity Pill, Time Capsule */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm font-black text-stone-900 tracking-tight">
                        {demand.demand_code}
                      </span>
                      {/* Pastel Category Pill */}
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                          demand.department === 'P_WAY'
                            ? 'bg-sky-100/90 text-sky-800 border-sky-300/80'
                            : demand.department === 'OHE'
                            ? 'bg-amber-100/90 text-amber-800 border-amber-300/80'
                            : 'bg-indigo-100/90 text-indigo-800 border-indigo-300/80'
                        }`}
                      >
                        {demand.department}
                      </span>
                      {/* Pastel Severity Pill */}
                      <span
                        className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                          demand.severity_tier === 'CRITICAL'
                            ? 'bg-rose-100/90 text-rose-700 border-rose-300/80'
                            : demand.severity_tier === 'HIGH'
                            ? 'bg-rose-50 text-rose-600 border-rose-200'
                            : 'bg-stone-100 text-stone-600 border-stone-200'
                        }`}
                      >
                        {demand.severity_tier}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200">
                        {demand.status}
                      </span>
                    </div>

                    {/* Time Range Capsule & Withdraw Action */}
                    <div className="flex items-center space-x-2 self-end sm:self-auto">
                      <div className="bg-white/95 border border-stone-200/90 px-3 py-1 rounded-full shadow-sm font-mono text-xs font-extrabold text-stone-800">
                        {formatMinutesToTime(demand.requested_start_minutes)} – {formatMinutesToTime(demand.requested_end_minutes)}
                      </div>
                      <button
                        type="button"
                        title="Withdraw demand from corridor"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDemand(demand.id, demand.demand_code);
                        }}
                        className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Description Body */}
                  <p className="mt-2.5 text-xs text-stone-700 font-medium leading-relaxed">
                    {demand.activity_description}
                  </p>

                  {/* Bottom Row: Section km, Duration & Trust */}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-[#ebe6dc] text-[11px]">
                    <div className="flex items-center space-x-3 text-stone-500 font-medium">
                      <span>
                        Section: <strong className="text-stone-800 font-semibold">{demand.section_from} – {demand.section_to}</strong> (km {demand.start_km} – {demand.end_km})
                      </span>
                      {demand.power_block_required && (
                        <span className="flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200">
                          <PowerOff className="h-3 w-3" /> Power Block
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 font-mono">
                      <span className="text-stone-500 font-medium">
                        Duration: <strong className="text-stone-800">{demand.required_minutes}m</strong>
                      </span>
                      <span className="text-emerald-700 font-black text-[12px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Trust: {demand.trust_score}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="neumorphic-card rounded-2xl p-12 text-center text-stone-400 text-xs">
              No matching demands found for search filter.
            </div>
          )}
        </div>

        {/* Selected Demand Detail Card (1 Column Inspector) */}
        <div className="neumorphic-card rounded-2xl p-5 space-y-4 h-fit sticky top-20 bg-[#fbf9f4]">
          {selectedDemand ? (
            <>
              <div className="flex items-center justify-between pb-3 border-b border-[#e8e2d4]">
                <div>
                  <h3 className="text-sm font-extrabold text-stone-900 font-mono">
                    {selectedDemand.demand_code}
                  </h3>
                  <span className="text-xs text-stone-500 font-medium">Demand Inspector</span>
                </div>
                <span className="text-[11px] font-bold bg-sky-100 text-sky-800 px-2.5 py-0.5 rounded-full border border-sky-300">
                  {selectedDemand.department}
                </span>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="text-stone-400 uppercase text-[10px] font-extrabold tracking-wider">
                    Activity Description
                  </span>
                  <p className="mt-1 text-stone-800 font-semibold leading-relaxed">
                    {selectedDemand.activity_description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-[#e8e2d4]">
                  <div>
                    <span className="text-stone-400 uppercase text-[10px] font-extrabold tracking-wider">
                      Section
                    </span>
                    <p className="font-mono text-stone-800 font-bold">
                      {selectedDemand.section_from} – {selectedDemand.section_to}
                    </p>
                  </div>
                  <div>
                    <span className="text-stone-400 uppercase text-[10px] font-extrabold tracking-wider">
                      Chainage Range
                    </span>
                    <p className="font-mono text-stone-700 font-medium">
                      KM {selectedDemand.start_km} – {selectedDemand.end_km}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-[#e8e2d4]">
                  <div>
                    <span className="text-stone-400 uppercase text-[10px] font-extrabold tracking-wider">
                      Requested Slot
                    </span>
                    <p className="font-mono text-emerald-700 font-extrabold">
                      {formatMinutesToTime(selectedDemand.requested_start_minutes)} – {formatMinutesToTime(selectedDemand.requested_end_minutes)}
                    </p>
                  </div>
                  <div>
                    <span className="text-stone-400 uppercase text-[10px] font-extrabold tracking-wider">
                      Duration Required
                    </span>
                    <p className="font-mono text-stone-800 font-bold">
                      {selectedDemand.required_minutes} Minutes
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-[#e8e2d4]">
                  <div>
                    <span className="text-stone-400 uppercase text-[10px] font-extrabold tracking-wider">
                      Machinery
                    </span>
                    <p className="text-stone-700 font-medium">
                      {selectedDemand.machinery_type || 'Manual Gang'}
                    </p>
                  </div>
                  <div>
                    <span className="text-stone-400 uppercase text-[10px] font-extrabold tracking-wider">
                      Machine ID
                    </span>
                    <p className="font-mono text-stone-700 font-medium">
                      {selectedDemand.machinery_id || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Historical Trust Score Box */}
                <div className="rounded-xl bg-[#ede9df] p-3.5 border border-[#ded6c7] space-y-2 shadow-inner">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-stone-600 font-medium">Historical Trust Score</span>
                    <span className="font-mono font-black text-emerald-700">
                      {selectedDemand.trust_score}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[#dcd4c6] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${selectedDemand.trust_score}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-stone-500 leading-tight">
                    Calculated from past execution adherence, machine readiness, and punctual handover record.
                  </p>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <Button
                    variant="railway"
                    size="sm"
                    onClick={() => setShowCoalignModal(true)}
                    className="w-full text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all"
                  >
                    <Layers className="mr-1.5 h-3.5 w-3.5" />
                    Co-align Shadow Window
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFormT409(true)}
                    className="w-full text-xs font-semibold rounded-xl border-[#dcd4c6] bg-white text-stone-700 hover:bg-[#f5f3ec] transition-all"
                  >
                    <ShieldCheck className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                    Inspect Form T/409 Authority
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteDemand(selectedDemand.id, selectedDemand.demand_code)}
                    className="w-full text-xs font-semibold rounded-xl border-rose-200 bg-rose-50/60 text-rose-700 hover:bg-rose-100 hover:border-rose-300 transition-all"
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5 text-rose-600" />
                    Withdraw / Delete Demand
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-stone-400 text-xs font-medium">
              Select a block demand to inspect parameters
            </div>
          )}
        </div>
      </div>

      {/* Modal 1: New Demand Creation */}
      {showNewDemandModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl rounded-3xl border border-[#dcd6c8] bg-[#fbf9f4] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#e8e2d4]">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">Submit New Block Demand</h3>
                  <p className="text-xs text-stone-500">Add maintenance block request to corridor scheduler</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewDemandModal(false)}
                className="rounded-xl p-1.5 text-stone-400 hover:bg-[#ece6da] hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDemand} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 font-bold mb-1">Source System</label>
                  <select
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value as any)}
                    className="w-full rounded-xl border border-[#d8d0be] bg-white p-2 text-stone-800 font-semibold"
                  >
                    <option value="TMS">TMS (Track Management System)</option>
                    <option value="SMMS">SMMS (OHE / Traction)</option>
                    <option value="TDMS">TDMS (Signal & Telecom)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-600 font-bold mb-1">Department</label>
                  <select
                    value={formDept}
                    onChange={(e) => setFormDept(e.target.value as any)}
                    className="w-full rounded-xl border border-[#d8d0be] bg-white p-2 text-stone-800 font-semibold"
                  >
                    <option value="P_WAY">P-Way (Permanent Way)</option>
                    <option value="OHE">OHE (Overhead Equipment)</option>
                    <option value="S_AND_T">S&T (Signals & Telecom)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-stone-600 font-bold mb-1">From Station</label>
                  <select
                    value={formFrom}
                    onChange={(e) => setFormFrom(e.target.value)}
                    className="w-full rounded-xl border border-[#d8d0be] bg-white p-2 text-stone-800 font-semibold font-mono"
                  >
                    {MOCK_STATIONS.map((s) => (
                      <option key={s.code} value={s.code}>{s.code} - {s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-stone-600 font-bold mb-1">To Station</label>
                  <select
                    value={formTo}
                    onChange={(e) => setFormTo(e.target.value)}
                    className="w-full rounded-xl border border-[#d8d0be] bg-white p-2 text-stone-800 font-semibold font-mono"
                  >
                    {MOCK_STATIONS.map((s) => (
                      <option key={s.code} value={s.code}>{s.code} - {s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-stone-600 font-bold mb-1">Start Km</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formStartKm}
                    onChange={(e) => setFormStartKm(e.target.value)}
                    className="w-full rounded-xl border border-[#d8d0be] bg-white p-2 text-stone-800 font-semibold font-mono"
                  />
                </div>

                <div>
                  <label className="block text-stone-600 font-bold mb-1">End Km</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formEndKm}
                    onChange={(e) => setFormEndKm(e.target.value)}
                    className="w-full rounded-xl border border-[#d8d0be] bg-white p-2 text-stone-800 font-semibold font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-600 font-bold mb-1">Requested Start</label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full rounded-xl border border-[#d8d0be] bg-white p-2 text-stone-800 font-semibold font-mono"
                  />
                </div>

                <div>
                  <label className="block text-stone-600 font-bold mb-1">Requested End</label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full rounded-xl border border-[#d8d0be] bg-white p-2 text-stone-800 font-semibold font-mono"
                  />
                </div>

                <div>
                  <label className="block text-stone-600 font-bold mb-1">Duration (min)</label>
                  <input
                    type="number"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    className="w-full rounded-xl border border-[#d8d0be] bg-white p-2 text-stone-800 font-semibold font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 font-bold mb-1">Machinery / Gang</label>
                  <input
                    type="text"
                    value={formMachinery}
                    onChange={(e) => setFormMachinery(e.target.value)}
                    placeholder="e.g. BCM-Plasser, Tower Wagon..."
                    className="w-full rounded-xl border border-[#d8d0be] bg-white p-2 text-stone-800 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-stone-600 font-bold mb-1">Severity Tier</label>
                  <select
                    value={formSeverity}
                    onChange={(e) => setFormSeverity(e.target.value as any)}
                    className="w-full rounded-xl border border-[#d8d0be] bg-white p-2 text-stone-800 font-semibold"
                  >
                    <option value="CRITICAL">CRITICAL (Emergency / Safety)</option>
                    <option value="HIGH">HIGH (Scheduled P-Way / OHE)</option>
                    <option value="MEDIUM">MEDIUM (Standard Overhaul)</option>
                    <option value="LOW">LOW (Routine Inspection)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-600 font-bold mb-1">Activity Description</label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Describe maintenance scope (e.g. Deep ballast cleaning, contact wire replacement, switch overhaul)..."
                  className="w-full rounded-xl border border-[#d8d0be] bg-white p-2 text-stone-800 font-medium placeholder-stone-400"
                />
              </div>

              <div className="flex items-center space-x-6 pt-1">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formPowerBlock}
                    onChange={(e) => setFormPowerBlock(e.target.checked)}
                    className="rounded border-[#d8d0be] text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <span className="text-stone-700 font-semibold">Traction Power Block Required (25kV)</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formDisconnection}
                    onChange={(e) => setFormDisconnection(e.target.checked)}
                    className="rounded border-[#d8d0be] text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <span className="text-stone-700 font-semibold">S&T Disconnection Required</span>
                </label>
              </div>

              <div className="pt-3 border-t border-[#e8e2d4] flex justify-end space-x-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewDemandModal(false)}
                  className="rounded-xl border-[#d8d0be] bg-white text-stone-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="railway"
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Submit Block Demand
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Shadow Window Co-alignment */}
      {showCoalignModal && selectedDemand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-[#dcd6c8] bg-[#fbf9f4] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e8e2d4]">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">Shadow Block Co-alignment Engine</h3>
                  <p className="text-xs text-stone-500">Harmonize secondary demands under primary possession</p>
                </div>
              </div>
              <button
                onClick={() => setShowCoalignModal(false)}
                className="rounded-xl p-1.5 text-stone-400 hover:bg-[#ece6da] hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-xl bg-emerald-50 p-3.5 border border-emerald-200">
                <div className="flex justify-between items-center text-emerald-900 font-bold">
                  <span>Candidate Primary Possession</span>
                  <Badge className="bg-emerald-600 text-white">Zero Extra Downtime</Badge>
                </div>
                <p className="mt-1 text-stone-700 font-medium">
                  {selectedDemand.demand_code} ({selectedDemand.department}) on section {selectedDemand.section_from}–{selectedDemand.section_to}
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-stone-700">Eligible Co-alignment Windows in Same Corridor:</span>
                <div className="rounded-xl bg-white p-3 border border-stone-200 space-y-1.5 shadow-sm">
                  <div className="flex justify-between font-mono font-bold text-stone-900">
                    <span>SMMS-2026-114 (OHE Tower Wagon)</span>
                    <span className="text-emerald-700">+2.0 hrs saved</span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Nests contact wire maintenance during primary P-Way track possession. Shares common 25kV traction power shutdown.
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-[#ede9df] p-3 border border-[#ded6c7] text-[11px] text-stone-600 space-y-1">
                <div className="font-bold text-stone-800">Savings Summary:</div>
                <div>• Corridor Downtime Reduction: <strong>120 Minutes (2.0 hrs)</strong></div>
                <div>• Passenger Train Paths Protected: <strong>2 Trains (12002 Shatabdi & Shan-e-Bhopal)</strong></div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCoalignModal(false)}
                  className="rounded-xl border-[#d8d0be] bg-white text-stone-700"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmCoalignment}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Harmonize & Lock Co-alignment
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Kavach SIL-4 Safety Clearance Inspector */}
      {showSafetyModal && selectedDemand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-[#dcd6c8] bg-[#fbf9f4] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e8e2d4]">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-teal-100 text-teal-800">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">Kavach SIL-4 & Station Master Clearance</h3>
                  <p className="text-xs text-stone-500">Verification checklist for Line-Clear dispatch</p>
                </div>
              </div>
              <button
                onClick={() => setShowSafetyModal(false)}
                className="rounded-xl p-1.5 text-stone-400 hover:bg-[#ece6da] hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="font-semibold text-stone-700">
                Safety Protocol Verification for <span className="font-mono font-bold text-stone-900">{selectedDemand.demand_code}</span>:
              </div>

              <div className="space-y-2">
                {[
                  {
                    key: 'tractionCutoff',
                    label: '25kV AC Traction Power Cutoff Verified',
                    desc: 'OHE feeder circuit breaker tripped, isolator clamped and earthed at both ends.',
                  },
                  {
                    key: 'kavachBuffer',
                    label: 'Kavach Automatic Braking Distance (1,200m) Set',
                    desc: 'Temporary Speed Restriction (TSR) broadcasted via trackside RFID and radio balise.',
                  },
                  {
                    key: 'axleCounterShunt',
                    label: 'Axle Counter & Track Circuit Shunt Clearance Confirmed',
                    desc: 'Section occupation sensor calibrated for maintenance trolley entry.',
                  },
                  {
                    key: 'pointsPadlocked',
                    label: 'Turnout Points & Crossings Padlocked in Normal Align',
                    desc: 'Mechanical cotter pin and key interlocked in Station Master cabin.',
                  },
                  {
                    key: 'trainSeparationGuard',
                    label: 'Headway Guard: >45min Buffer to Following Passenger Express',
                    desc: 'Next scheduled passage (12002 Shatabdi) cleared outside block zone.',
                  },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-start space-x-3 p-2.5 rounded-xl bg-white border border-stone-200 cursor-pointer hover:bg-stone-50"
                  >
                    <input
                      type="checkbox"
                      checked={(safetyChecklist as any)[item.key]}
                      onChange={(e) =>
                        setSafetyChecklist({ ...safetyChecklist, [item.key]: e.target.checked })
                      }
                      className="mt-0.5 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <div>
                      <div className="font-bold text-stone-900">{item.label}</div>
                      <div className="text-[11px] text-stone-500 mt-0.5 leading-tight">{item.desc}</div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowSafetyModal(false)}
                  className="rounded-xl border-[#d8d0be] bg-white text-stone-700"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmSafetyClearance}
                  className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold"
                >
                  Issue Digital Line-Clear Token (SM Sign-Off)
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Indian Railways Form T/409 Line-Clear Authority Modal */}
      <FormT409Modal
        demand={selectedDemand}
        isOpen={showFormT409}
        onClose={() => setShowFormT409(false)}
        onConfirm={handleConfirmFormT409}
      />

      {/* BHOLU-Style NLP Voice Dispatch Modal */}
      <VoiceDispatchModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        onSubmitDemand={(extracted) => {
          setFormFrom(extracted.sectionFrom || 'BINA');
          setFormTo(extracted.sectionTo || 'MABA');
          setFormDept(extracted.department || 'P_WAY');
          setFormStartTime(extracted.startTime || '14:00');
          setFormEndTime(extracted.endTime || '16:30');
          setShowVoiceModal(false);
          setShowNewDemandModal(true);
          showToast(`Voice entities extracted: ${extracted.workDescription}`);
        }}
      />
    </div>
  );
};


