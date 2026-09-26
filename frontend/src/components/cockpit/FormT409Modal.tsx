import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Printer,
  X,
  FileCheck,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BlockDemand } from '@/types';
import { formatMinutesToTime } from '@/lib/utils';

interface FormT409ModalProps {
  demand: BlockDemand | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (demand: BlockDemand) => void;
}

export const FormT409Modal: React.FC<FormT409ModalProps> = ({
  demand,
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !demand) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleConfirmAndIssue = () => {
    onConfirm(demand);
    onClose();
  };

  const authNumber = `WCR/BPL/LC-2026/${demand.id.toString().slice(-4)}`;
  const kavachHash = `0x${demand.id.toString(16).padStart(8, 'a')}7e9f4c32b104d88e61a`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-md animate-in fade-in p-3 sm:p-6 flex items-start sm:items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-2xl max-h-[92vh] flex flex-col my-auto rounded-3xl bg-[#FAF7F2]/95 backdrop-blur-2xl border border-stone-200/80 shadow-2xl p-5 sm:p-6 text-stone-800 skin-glass-elevated"
        >
          {/* Header Bar */}
          <div className="shrink-0 flex items-start justify-between border-b border-stone-200/60 pb-3">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 border border-emerald-300/40 flex items-center justify-center text-emerald-800 shadow-xs">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 font-mono">
                  Indian Railways Statutory Authority
                </span>
                <h2 className="text-base font-black text-stone-900 tracking-tight font-sans">
                  FORM T/409 — LINE-CLEAR & CAUTION ORDER
                </h2>
                <p className="text-[11px] text-stone-500 font-medium">
                  Rule 4.09 & 4.10 GR/SR • West Central Railway • Bhopal Operating Division
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Certificate Body (Parchment Paper Styling) */}
          <div className="flex-1 overflow-y-auto my-3 pr-1 space-y-4 rounded-2xl border border-[#ded7c8] bg-[#f9f7ef] p-4 sm:p-5 shadow-inner">
            {/* Seal & Metadata Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e5dfd2] pb-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  Authority Token No.
                </span>
                <div className="font-mono font-black text-stone-900 text-sm">{authNumber}</div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  Issue Validity Window
                </span>
                <div className="font-mono font-bold text-emerald-800">
                  {formatMinutesToTime(demand.requested_start_minutes)} – {formatMinutesToTime(demand.requested_end_minutes)} IST ({demand.required_minutes}m)
                </div>
              </div>
            </div>

            {/* Block Parameters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white/80 p-3 rounded-xl border border-stone-200/80">
                <span className="text-[10px] uppercase font-bold text-stone-400 font-mono">
                  Corridor Block Section
                </span>
                <div className="font-bold text-stone-900 mt-0.5">
                  {demand.section_from} ⇄ {demand.section_to}
                </div>
                <div className="text-[11px] text-stone-500 font-mono">
                  Chainage: km {demand.start_km} – km {demand.end_km}
                </div>
              </div>

              <div className="bg-white/80 p-3 rounded-xl border border-stone-200/80">
                <span className="text-[10px] uppercase font-bold text-stone-400 font-mono">
                  Department & Machinery
                </span>
                <div className="font-bold text-stone-900 mt-0.5">
                  {demand.department} • {demand.machinery_type}
                </div>
                <div className="text-[11px] text-stone-500 font-mono">
                  Machine ID: {demand.machinery_id || 'BCM-08'}
                </div>
              </div>
            </div>

            {/* Description Note */}
            <div className="bg-white/80 p-3 rounded-xl border border-stone-200/80 text-xs">
              <span className="text-[10px] uppercase font-bold text-stone-400 font-mono">
                Authorized Maintenance Occupation
              </span>
              <p className="mt-1 font-medium text-stone-800 leading-relaxed">
                {demand.activity_description}
              </p>
            </div>

            {/* Safety Interlocking Checklist Verified */}
            <div className="space-y-2 pt-2 border-t border-[#e5dfd2]">
              <span className="text-[11px] font-black uppercase text-stone-700 tracking-wider flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-emerald-600" />
                Kavach SIL-4 Safety & Interlocking Token
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-900 p-2 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Traction OHE Isolated</span>
                </div>

                <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-900 p-2 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Kavach 1200m Buffer</span>
                </div>

                <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-900 p-2 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Points Clamped & Padlocked</span>
                </div>
              </div>
            </div>

            {/* Cryptographic Hash Bar */}
            <div className="bg-stone-900 text-emerald-400 p-2.5 rounded-xl font-mono text-[10px] flex items-center justify-between shadow-inner">
              <span className="truncate">Kavach Hash: {kavachHash}</span>
              <span className="text-stone-400 uppercase font-bold ml-2 shrink-0">SIL-4 Verified</span>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-stone-200/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="w-full sm:w-auto text-xs font-semibold rounded-xl border-[#dcd4c6] bg-white text-stone-700 hover:bg-stone-100"
            >
              <Printer className="mr-1.5 h-3.5 w-3.5 text-stone-500" />
              Print / Save Authority PDF
            </Button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="w-full sm:w-auto text-xs text-stone-500 hover:text-stone-800"
              >
                Cancel
              </Button>

              <Button
                type="button"
                variant="railway"
                size="sm"
                onClick={handleConfirmAndIssue}
                className="w-full sm:w-auto text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md"
              >
                <FileCheck className="mr-1.5 h-4 w-4" />
                Issue SIL-4 Line-Clear Token
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
