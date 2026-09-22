import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { BlockDemand } from '@/types';
import { MOCK_STATIONS } from '@/data/mockData';

type DemandFormData = Omit<BlockDemand, 'id'>;

const EMPTY_FORM: DemandFormData = {
  demand_code: '',
  source_system: 'TMS',
  department: 'P_WAY',
  section_from: '',
  section_to: '',
  start_km: 0,
  end_km: 0,
  requested_date: new Date().toISOString().slice(0, 10),
  requested_start_minutes: 60,
  requested_end_minutes: 240,
  required_minutes: 120,
  activity_description: '',
  machinery_type: '',
  machinery_id: '',
  status: 'PROPOSED',
  trust_score: 80,
  severity_tier: 'MEDIUM',
  priority_weight: 5.0,
  power_block_required: false,
  disconnection_required: false,
};

interface DemandFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingDemand: BlockDemand | null;
  onSubmit: (data: DemandFormData) => void;
  isLoading?: boolean;
}

export const DemandForm: React.FC<DemandFormProps> = ({
  open,
  onOpenChange,
  editingDemand,
  onSubmit,
  isLoading,
}) => {
  const [form, setForm] = useState<DemandFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingDemand) {
      const { id: _, ...rest } = editingDemand;
      setForm(rest);
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
  }, [editingDemand, open]);

  const set = <K extends keyof DemandFormData>(key: K, value: DemandFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.demand_code.trim()) errs.demand_code = 'Required';
    if (!form.section_from) errs.section_from = 'Required';
    if (!form.section_to) errs.section_to = 'Required';
    if (form.section_from === form.section_to && form.section_from)
      errs.section_to = 'Must differ from origin';
    if (form.start_km >= form.end_km)
      errs.end_km = 'End km must be greater than start km';
    if (!form.activity_description.trim()) errs.activity_description = 'Required';
    if (form.required_minutes <= 0) errs.required_minutes = 'Must be > 0';
    if (form.requested_start_minutes >= form.requested_end_minutes)
      errs.requested_end_minutes = 'End must be after start';
    else if (form.required_minutes > (form.requested_end_minutes - form.requested_start_minutes))
      errs.required_minutes = 'Required duration exceeds requested window';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isLoading) return;
    if (!validate()) return;
    try {
      setIsSubmitting(true);
      await onSubmit(form);
    } finally {
      setIsSubmitting(false);
    }
  };

  const minutesToHHMM = (m: number) => {
    const h = Math.floor(m / 60) % 24;
    const mm = m % 60;
    return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  };

  const hhmmToMinutes = (s: string) => {
    const [h, m] = s.split(':').map(Number);
    return h * 60 + m;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-slate-950 border-slate-800 text-slate-100 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">
            {editingDemand ? 'Edit Block Demand' : 'New Block Demand'}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {editingDemand
              ? `Editing ${editingDemand.demand_code}`
              : 'Create a new maintenance block demand for scheduling'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Row 1: Code + Source + Department */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] text-slate-400 uppercase font-bold">Demand Code</Label>
              <Input
                value={form.demand_code}
                onChange={(e) => set('demand_code', e.target.value)}
                placeholder="TMS-2026-XXX"
                className="bg-slate-900 border-slate-800 text-xs font-mono"
              />
              {errors.demand_code && (
                <span className="text-[10px] text-red-400">{errors.demand_code}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] text-slate-400 uppercase font-bold">Source System</Label>
              <Select value={form.source_system} onValueChange={(v) => set('source_system', v as BlockDemand['source_system'])}>
                <SelectTrigger className="bg-slate-900 border-slate-800 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="TMS">TMS (P-Way)</SelectItem>
                  <SelectItem value="SMMS">SMMS (OHE)</SelectItem>
                  <SelectItem value="TDMS">TDMS (S&T)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] text-slate-400 uppercase font-bold">Department</Label>
              <Select value={form.department} onValueChange={(v) => set('department', v as BlockDemand['department'])}>
                <SelectTrigger className="bg-slate-900 border-slate-800 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="P_WAY">P. Way</SelectItem>
                  <SelectItem value="OHE">OHE</SelectItem>
                  <SelectItem value="S_AND_T">S&T</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Section From/To */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] text-slate-400 uppercase font-bold">Section From</Label>
              <Select value={form.section_from} onValueChange={(v) => set('section_from', v)}>
                <SelectTrigger className="bg-slate-900 border-slate-800 text-xs font-mono">
                  <SelectValue placeholder="Select station" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {MOCK_STATIONS.map((st) => (
                    <SelectItem key={st.code} value={st.code}>
                      {st.code} — {st.name} (km {st.distance_km})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.section_from && (
                <span className="text-[10px] text-red-400">{errors.section_from}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] text-slate-400 uppercase font-bold">Section To</Label>
              <Select value={form.section_to} onValueChange={(v) => set('section_to', v)}>
                <SelectTrigger className="bg-slate-900 border-slate-800 text-xs font-mono">
                  <SelectValue placeholder="Select station" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {MOCK_STATIONS.map((st) => (
                    <SelectItem key={st.code} value={st.code}>
                      {st.code} — {st.name} (km {st.distance_km})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.section_to && (
                <span className="text-[10px] text-red-400">{errors.section_to}</span>
              )}
            </div>
          </div>

          {/* Row 3: KM range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] text-slate-400 uppercase font-bold">Start KM</Label>
              <Input
                type="number"
                step="0.1"
                value={form.start_km}
                onChange={(e) => set('start_km', parseFloat(e.target.value) || 0)}
                className="bg-slate-900 border-slate-800 text-xs font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] text-slate-400 uppercase font-bold">End KM</Label>
              <Input
                type="number"
                step="0.1"
                value={form.end_km}
                onChange={(e) => set('end_km', parseFloat(e.target.value) || 0)}
                className="bg-slate-900 border-slate-800 text-xs font-mono"
              />
            </div>
          </div>

          {/* Row 4: Time window + Duration */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] text-slate-400 uppercase font-bold">Start Time</Label>
              <Input
                type="time"
                value={minutesToHHMM(form.requested_start_minutes)}
                onChange={(e) => set('requested_start_minutes', hhmmToMinutes(e.target.value))}
                className="bg-slate-900 border-slate-800 text-xs font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] text-slate-400 uppercase font-bold">End Time</Label>
              <Input
                type="time"
                value={minutesToHHMM(form.requested_end_minutes)}
                onChange={(e) => set('requested_end_minutes', hhmmToMinutes(e.target.value))}
                className="bg-slate-900 border-slate-800 text-xs font-mono"
              />
              {errors.requested_end_minutes && (
                <span className="text-[10px] text-red-400">{errors.requested_end_minutes}</span>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] text-slate-400 uppercase font-bold">Duration (min)</Label>
              <Input
                type="number"
                value={form.required_minutes}
                onChange={(e) => set('required_minutes', parseInt(e.target.value) || 0)}
                className="bg-slate-900 border-slate-800 text-xs font-mono"
              />
              {errors.required_minutes && (
                <span className="text-[10px] text-red-400">{errors.required_minutes}</span>
              )}
            </div>
          </div>

          {/* Row 5: Activity description */}
          <div className="space-y-1.5">
            <Label className="text-[11px] text-slate-400 uppercase font-bold">Activity Description</Label>
            <Input
              value={form.activity_description}
              onChange={(e) => set('activity_description', e.target.value)}
              placeholder="BCM Ballast Cleaning Machine deep screening…"
              className="bg-slate-900 border-slate-800 text-xs"
            />
            {errors.activity_description && (
              <span className="text-[10px] text-red-400">{errors.activity_description}</span>
            )}
          </div>

          {/* Row 6: Severity + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] text-slate-400 uppercase font-bold">Severity</Label>
              <Select value={form.severity_tier} onValueChange={(v) => set('severity_tier', v as BlockDemand['severity_tier'])}>
                <SelectTrigger className="bg-slate-900 border-slate-800 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="CRITICAL">🔴 Critical</SelectItem>
                  <SelectItem value="HIGH">🟠 High</SelectItem>
                  <SelectItem value="MEDIUM">🟡 Medium</SelectItem>
                  <SelectItem value="LOW">⚪ Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] text-slate-400 uppercase font-bold">Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v as BlockDemand['status'])}>
                <SelectTrigger className="bg-slate-900 border-slate-800 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="PROPOSED">Proposed</SelectItem>
                  <SelectItem value="REVIEWED">Reviewed</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="EXECUTED">Executed</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 7: Machinery + Priority */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] text-slate-400 uppercase font-bold">Machinery Type</Label>
              <Input
                value={form.machinery_type || ''}
                onChange={(e) => set('machinery_type', e.target.value)}
                placeholder="BCM-Plasser"
                className="bg-slate-900 border-slate-800 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] text-slate-400 uppercase font-bold">Machine ID</Label>
              <Input
                value={form.machinery_id || ''}
                onChange={(e) => set('machinery_id', e.target.value)}
                placeholder="BCM-902"
                className="bg-slate-900 border-slate-800 text-xs font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] text-slate-400 uppercase font-bold">Priority Weight</Label>
              <Input
                type="number"
                step="0.1"
                value={form.priority_weight}
                onChange={(e) => set('priority_weight', parseFloat(e.target.value) || 0)}
                className="bg-slate-900 border-slate-800 text-xs font-mono"
              />
            </div>
          </div>

          {/* Row 8: Toggles */}
          <div className="flex flex-wrap gap-4 pt-1">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={form.power_block_required}
                onChange={(e) => set('power_block_required', e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-blue-600"
              />
              Power Block Required
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={form.disconnection_required}
                onChange={(e) => set('disconnection_required', e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-blue-600"
              />
              OHE Disconnection Required
            </label>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-700 text-slate-400 hover:text-white text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
            >
              {isLoading || isSubmitting ? 'Saving…' : editingDemand ? 'Update Demand' : 'Create Demand'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
