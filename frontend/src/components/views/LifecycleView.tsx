import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitBranch,
  FileCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  X,
  Clock,
  ShieldCheck,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { BlockDemand } from '@/types';
import { MOCK_DEMANDS } from '@/data/mockData';
import { formatMinutesToTime } from '@/lib/utils';
import { FormT409Modal } from '@/components/cockpit/FormT409Modal';
import { GeofenceSafetyLock } from '@/components/safety/GeofenceSafetyLock';

interface LifecycleViewProps {
  demands?: BlockDemand[];
  onUpdateDemand?: (demand: BlockDemand) => void;
}

export const LifecycleView: React.FC<LifecycleViewProps> = ({
  demands: propDemands,
  onUpdateDemand,
}) => {
  const [localDemands, setLocalDemands] = useState<BlockDemand[]>(MOCK_DEMANDS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [tokenModalDemand, setTokenModalDemand] = useState<BlockDemand | null>(null);

  const demands = propDemands || localDemands;

  const stages: Array<{
    key: BlockDemand['status'];
    label: string;
    desc: string;
    next?: BlockDemand['status'];
    prev?: BlockDemand['status'];
    actionLabel?: string;
  }> = [
    {
      key: 'PROPOSED',
      label: '1. Proposed',
      desc: 'Depot / Field Input',
      next: 'REVIEWED',
      actionLabel: 'Review →',
    },
    {
      key: 'REVIEWED',
      label: '2. Reviewed',
      desc: 'Engineering Branch',
      prev: 'PROPOSED',
      next: 'APPROVED',
      actionLabel: 'Approve →',
    },
    {
      key: 'APPROVED',
      label: '3. Approved',
      desc: 'Sr. DOM / Traffic',
      prev: 'REVIEWED',
      next: 'EXECUTED',
      actionLabel: 'Line-Clear →',
    },
    {
      key: 'EXECUTED',
      label: '4. Executed',
      desc: 'SM Line-Clear Active',
      prev: 'APPROVED',
      next: 'CLOSED',
      actionLabel: 'Handover & Close →',
    },
    {
      key: 'CLOSED',
      label: '5. Closed',
      desc: 'Handover & TSR Done',
      prev: 'EXECUTED',
    },
  ];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleMoveStage = (demand: BlockDemand, targetStage: BlockDemand['status']) => {
    if (targetStage === 'EXECUTED') {
      // Trigger official Indian Railways Form T/409 Line-Clear Authority Modal
      setTokenModalDemand(demand);
      return;
    }

    const updated = { ...demand, status: targetStage };
    if (onUpdateDemand) {
      onUpdateDemand(updated);
    } else {
      setLocalDemands((prev) => prev.map((d) => (d.id === demand.id ? updated : d)));
    }
    showToast(`Demand ${demand.demand_code} moved to ${targetStage}!`);
  };

  const handleConfirmLineClear = (demand: BlockDemand) => {
    const updated = { ...demand, status: 'EXECUTED' as const };
    if (onUpdateDemand) {
      onUpdateDemand(updated);
    } else {
      setLocalDemands((prev) => prev.map((d) => (d.id === demand.id ? updated : d)));
    }
    showToast(`Authority Form T/409 Token issued for ${demand.demand_code}! Line-Clear granted.`);
  };

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

      {/* Header Bar */}
      <div className="skin-glass-card skin-glass-elevated specular-sheen rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3.5">
          <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-800 border border-emerald-300/40 shadow-xs">
            <GitBranch className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900 tracking-tight font-sans">
              Indian Railways Block Lifecycle Workflow
            </h2>
            <p className="text-xs text-stone-500 font-medium">
              Interactive Governance Pipeline: Click buttons to advance maintenance blocks from field depot to Station Master Line-Clear execution
            </p>
          </div>
        </div>

        <div className="cockpit-dark-chip flex items-center space-x-2 text-xs font-mono text-stone-200">
          <span className="h-2 w-2 rounded-full bg-emerald-400 led-glow-emerald" />
          <span className="font-semibold">FOIS & ICMS Live Sync</span>
        </div>
      </div>

      {/* Kanban / Stage Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stages.map((stage) => {
          const items = demands.filter((d) => d.status === stage.key);

          return (
            <div
              key={stage.key}
              className="skin-glass-card rounded-2xl p-3.5 flex flex-col min-h-[460px] border border-stone-200 shadow-sm"
            >
              {/* Stage Header */}
              <div className="pb-3 border-b border-stone-200/60 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black text-stone-900">
                    {stage.label}
                  </span>
                  <span className="cockpit-dark-chip text-[10px] font-mono font-bold text-emerald-300">
                    {items.length}
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 font-medium">{stage.desc}</p>
              </div>

              {/* Cards Container */}
              <div className="mt-3 flex-1 space-y-2.5 overflow-y-auto pr-0.5">
                <AnimatePresence mode="popLayout">
                  {items.length > 0 ? (
                    items.map((demand) => (
                      <motion.div
                        layout
                        key={demand.id}
                        initial={{ opacity: 0, scale: 0.9, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.85, x: 25 }}
                        transition={{ duration: 0.28, ease: 'easeOut' }}
                        className="rounded-xl skin-glass-sub p-3 space-y-2 border border-stone-200 hover:border-emerald-500/60 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-start">
                            <span className="font-mono text-xs font-black text-stone-900">
                              {demand.demand_code}
                            </span>
                            {/* Pastel Department Pill */}
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                                demand.department === 'P_WAY'
                                  ? 'bg-sky-50 text-sky-800 border-sky-200'
                                  : demand.department === 'OHE'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                              }`}
                            >
                              {demand.department}
                            </span>
                          </div>

                          <p className="text-[11px] text-stone-700 line-clamp-2 font-medium leading-relaxed">
                            {demand.activity_description}
                          </p>

                          <div className="text-[10px] font-mono text-stone-500 flex justify-between pt-1.5 border-t border-stone-200/50 font-medium">
                            <span className="text-stone-700 font-semibold">{demand.section_from}–{demand.section_to}</span>
                            <span className="cockpit-dark-chip text-[9px] font-bold text-emerald-300">
                              {formatMinutesToTime(demand.requested_start_minutes)}
                            </span>
                          </div>
                        </div>

                        {/* Stage Action Controls */}
                        <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-1.5 text-[10px]">
                          {stage.prev ? (
                            <button
                              type="button"
                              onClick={() => handleMoveStage(demand, stage.prev!)}
                              className="text-stone-400 hover:text-stone-700 px-1.5 py-1 rounded-lg hover:bg-stone-100 flex items-center font-bold transition-all"
                              title={`Move back to ${stage.prev}`}
                            >
                              <ArrowLeft className="h-3 w-3 mr-0.5" />
                            </button>
                          ) : (
                            <span />
                          )}

                          {stage.next ? (
                            <button
                              type="button"
                              onClick={() => handleMoveStage(demand, stage.next!)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-lg flex items-center space-x-1 shadow-sm transition-all transform active:scale-95 ml-auto"
                            >
                              <span>{stage.actionLabel}</span>
                            </button>
                          ) : (
                            <span className="text-[9px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200 ml-auto flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-purple-600" />
                              Archived
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center h-36 text-center text-stone-400 text-xs"
                    >
                      <FileCheck className="h-6 w-6 mb-1 text-stone-300" />
                      <span>No active blocks in {stage.key.toLowerCase()}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>

      {/* IoT NavIC/GPS Track Clearance Geofenced Safety Interlock */}
      <div className="pt-2">
        <GeofenceSafetyLock />
      </div>

      {/* Official Indian Railways Form T/409 Line-Clear Authority Modal */}
      <FormT409Modal
        demand={tokenModalDemand}
        isOpen={!!tokenModalDemand}
        onClose={() => setTokenModalDemand(null)}
        onConfirm={handleConfirmLineClear}
      />
    </div>
  );
};


