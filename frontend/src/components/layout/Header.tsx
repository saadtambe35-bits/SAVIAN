import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Bell,
  CheckCircle2,
  Clock,
  Loader2,
  Flame,
  Shield,
  AlertTriangle,
  Zap,
  Radio,
  ChevronDown,
  Database,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PRESET_SCENARIOS } from '@/data/mockData';
import { RoiTicker } from '@/components/roi/RoiTicker';
import { LanguageToggle, useTranslation } from '@/i18n/LanguageContext';
import { RollingNumber } from '@/components/common/RollingNumber';

export type SolverStatusType = 'idle' | 'solving' | 'done';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenMobileSidebar: () => void;
  chaosMode?: boolean;
  onChaosModeChange?: (chaos: boolean) => void;
  chaosToggleSlot?: React.ReactNode;
  solverStatus?: SolverStatusType;
  onRunSolver?: () => void;
  unreadAlertCount?: number;
  currentScenario?: string;
  onSelectScenario?: (scenarioId: string) => void;
}

const LIVE_DISPATCH_MESSAGES = [
  '12002 Shatabdi Exp departed Bhopal Jn on schedule (PF-1)',
  'Kavach SIL-4 Radio Ping verified: BINA-KIKA UP Track normal (RSSI -64dBm)',
  'OHE Inspection Tower Car TW-44 staging at Kurwai Kethora',
  'TMS Gang 14 reporting readiness for BINA-KIKA deep screening',
  'CRIS COA-FOIS synchronizer: 0ms latency detected, 13 blocks live',
  '20805 AP Express cleared Vidisha loop with green signal aspect',
];

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onOpenMobileSidebar,
  chaosMode = false,
  onChaosModeChange,
  chaosToggleSlot,
  solverStatus = 'idle',
  unreadAlertCount = 3,
  currentScenario = 'standard',
  onSelectScenario,
}) => {
  const { t } = useTranslation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [alertsCount, setAlertsCount] = useState(unreadAlertCount);
  const [showScenarioMenu, setShowScenarioMenu] = useState(false);

  // Click outside to close dropdowns
  const scenarioMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (scenarioMenuRef.current && !scenarioMenuRef.current.contains(target)) {
        setShowScenarioMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setShowNotifications(false);
      }
    };

    if (showScenarioMenu || showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showScenarioMenu, showNotifications]);

  // Live IST Clock
  const [currentTime, setCurrentTime] = useState<string>('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format as IST HH:mm:ss
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}:${seconds} IST`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Dynamic CRIS Latency Heartbeat
  const [crisLatency, setCrisLatency] = useState<number>(32);
  useEffect(() => {
    const latencyTimer = setInterval(() => {
      // Fluctuate between 28ms and 42ms
      setCrisLatency(Math.floor(28 + Math.random() * 14));
    }, 4500);
    return () => clearInterval(latencyTimer);
  }, []);

  // Live Radio Dispatch Feed index
  const [dispatchIndex, setDispatchIndex] = useState<number>(0);
  useEffect(() => {
    const dispatchTimer = setInterval(() => {
      setDispatchIndex((prev) => (prev + 1) % LIVE_DISPATCH_MESSAGES.length);
    }, 6500);
    return () => clearInterval(dispatchTimer);
  }, []);

  // Metallic Pill Badge
  const renderSolverBadge = () => {
    switch (solverStatus) {
      case 'solving':
        return (
          <div className="flex items-center space-x-1.5 rounded-full border border-amber-300/80 bg-amber-50/90 backdrop-blur-md px-2 py-0.5 text-[9.5px] font-semibold text-amber-900 shadow-2xs animate-pulse">
            <Loader2 className="h-3 w-3 animate-spin text-amber-600" />
            <span className="tracking-wide font-mono">SOLVING...</span>
          </div>
        );
      case 'done':
        return (
          <div className="flex items-center space-x-1.5 rounded-full border border-emerald-300/80 bg-emerald-50/90 backdrop-blur-md px-2 py-0.5 text-[9.5px] font-semibold text-emerald-900 shadow-2xs">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            <span className="tracking-wide font-mono">OPTIMAL</span>
          </div>
        );
      case 'idle':
      default:
        return (
          <div className="flex items-center space-x-1.5 rounded-full border border-white/90 bg-white/70 backdrop-blur-md px-2 py-0.5 text-[9.5px] font-semibold text-stone-600 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-stone-400" />
            <span className="tracking-wide font-mono">🔘 SOLVER IDLE</span>
          </div>
        );
    }
  };

  const currentScenarioMeta = PRESET_SCENARIOS[currentScenario] || PRESET_SCENARIOS['standard'];

  return (
    <header className="sticky top-0 z-30 flex flex-col border-b border-white/80 bg-[#FAF7F0]/85 backdrop-blur-xl shadow-[0_4px_20px_rgba(160,148,130,0.08)] specular-sheen">
      {/* Primary Header Row */}
      <div className="flex h-16 w-full items-center justify-between px-3 sm:px-4">
        {/* Left Area: Hamburger + Title */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="rounded-xl p-1.5 text-stone-500 hover:bg-white/70 hover:text-stone-800 lg:hidden cursor-pointer"
            aria-label="Open sidebar menu"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="flex items-center space-x-1.5 shrink-0">
            <h1 className="text-sm font-bold tracking-tight text-stone-900 sm:text-base whitespace-nowrap">
              {t(title)}
            </h1>
            {subtitle && (
              <div className="hidden xl:flex flex-col justify-center border-l border-stone-300/80 pl-1.5 text-[8.5px] leading-[10px] font-medium text-stone-500 whitespace-nowrap shrink-0">
                {t(subtitle).length > 25 ? (
                  <>
                    <span>{t(subtitle).split(' ').slice(0, 3).join(' ')}</span>
                    <span>{t(subtitle).split(' ').slice(3).join(' ')}</span>
                  </>
                ) : (
                  <span>{t(subtitle)}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Center Ticker Slot: Live Demurrage & Carbon ROI */}
        <div className="hidden xl:flex items-center justify-center shrink-0 mx-0.5">
          <RoiTicker compact />
        </div>

        {/* Right Controls Area */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          {/* Vernacular Language Switcher */}
          <div className="hidden sm:flex items-center">
            <LanguageToggle />
          </div>

          {/* Live IST Clock Pill */}
          <div className="hidden sm:flex items-center space-x-1 rounded-full border border-white/90 bg-white/80 backdrop-blur-md px-2 py-0.5 text-[10px] font-mono text-stone-800 shadow-2xs">
            <Clock className="h-3 w-3 text-stone-400 animate-spin" style={{ animationDuration: '60s' }} />
            <span className="font-extrabold text-[10px] tracking-wide">{currentTime || '19:42:00 IST'}</span>
          </div>

          {/* CRIS Ping Latency Pill - High Contrast Cockpit Dark Chip with Breathing Aura & Rolling Digits */}
          <div
            className="hidden md:flex items-center space-x-1 rounded-[7px] cockpit-dark-chip px-1.5 py-0.5 text-xs font-mono shadow-2xs aura-breathe-emerald tactile-spring cursor-default"
            title="Centre for Railway Information Systems (CRIS) Live Heartbeat"
          >
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 led-glow-emerald" />
            </span>
            <span className="text-[8.5px] font-bold tracking-normal inline-flex items-center gap-0.5 whitespace-nowrap">
              <span>CRIS</span>
              <RollingNumber value={crisLatency} suffix="ms" />
            </span>
          </div>

          {/* Scenario Switcher Dropdown */}
          <div className="relative" ref={scenarioMenuRef}>
            <button
              type="button"
              onClick={() => setShowScenarioMenu(!showScenarioMenu)}
              className="flex items-center space-x-1 rounded-full border border-white/90 bg-white/70 backdrop-blur-md px-2 py-0.5 text-[10px] font-semibold text-stone-700 hover:bg-white shadow-2xs transition-all cursor-pointer"
              title="Switch demo scenarios"
            >
              <Database className="h-3 w-3 text-emerald-700" />
              <span className="hidden lg:inline text-[10px] font-bold">Scenario:</span>
              <span className="text-[10px] font-extrabold text-stone-900 truncate max-w-[80px]">
                {currentScenarioMeta.badge}
              </span>
              <ChevronDown className="h-2.5 w-2.5 text-stone-500" />
            </button>

            {showScenarioMenu && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-stone-200 bg-[#FAF7F0] p-2.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-500 border-b border-stone-200/70 font-mono">
                  Select Railway Scenario
                </div>
                <div className="mt-1 space-y-1">
                  {Object.values(PRESET_SCENARIOS).map((scen) => (
                    <button
                      key={scen.id}
                      type="button"
                      onClick={() => {
                        onSelectScenario?.(scen.id);
                        setShowScenarioMenu(false);
                      }}
                      className={cn(
                        'w-full text-left p-2 rounded-xl text-xs transition-colors flex flex-col space-y-0.5 cursor-pointer',
                        scen.id === currentScenario
                          ? 'bg-emerald-100/90 text-emerald-900 font-bold border border-emerald-300'
                          : 'hover:bg-stone-200/50 text-stone-700'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{scen.name}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white border border-stone-200 font-mono">
                          {scen.demands.length} blocks
                        </span>
                      </div>
                      <span className="text-[10px] text-stone-500 font-normal line-clamp-1">
                        {scen.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Chaos / Order Toggle Slot */}
          {chaosToggleSlot ? (
            chaosToggleSlot
          ) : (
            <button
              type="button"
              onClick={() => onChaosModeChange?.(!chaosMode)}
              className={cn(
                'flex items-center space-x-1.5 rounded-full px-2 py-0.5 transition-all border text-[10px] font-semibold shadow-sm',
                chaosMode
                  ? 'bg-amber-100/80 border-amber-300 text-amber-900 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                  : 'bg-[#f0ece3] border-[#d8d3c5] text-stone-600 hover:bg-[#eae5d9]'
              )}
              title="Toggle Corridor Disruption Simulator"
            >
              <Flame
                className={cn(
                  'h-3 w-3',
                  chaosMode ? 'text-amber-600 animate-pulse' : 'text-stone-400'
                )}
              />
              <span className="font-mono text-[10px] tracking-wide hidden sm:inline">
                {chaosMode ? 'CHAOS' : 'ORDER'}
              </span>
              <div
                className={cn(
                  'w-6 h-3.5 rounded-full p-0.5 transition-colors duration-200 flex items-center',
                  chaosMode ? 'bg-amber-600 justify-end' : 'bg-stone-300 justify-start'
                )}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-white shadow-sm" />
              </div>
            </button>
          )}

          {/* Solver Status Capsule */}
          <div id="solver-status-container" className="flex items-center">
            {renderSolverBadge()}
          </div>

          {/* Notification Bell with red unread badge */}
          <div className="relative" ref={notificationsRef}>
            <button
              id="notification-bell-btn"
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative rounded-xl p-1.5 text-stone-600 transition-colors hover:bg-white/80 hover:text-stone-900 focus:outline-none shadow-2xs border border-white/80 bg-white/60 backdrop-blur-md cursor-pointer"
              aria-label="View notifications"
            >
              <Bell className="h-3.5 w-3.5" />
              {alertsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[8.5px] font-bold text-white shadow-sm ring-2 ring-white animate-pulse">
                  {alertsCount}
                </span>
              )}
            </button>

            {/* Notifications Flyout */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-stone-200 bg-[#FAF7F0] p-3.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-2.5 border-b border-stone-200/60">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-stone-800 font-mono">
                    <Zap className="h-3.5 w-3.5 text-[#078A68]" />
                    <span>Rail Corridor Alerts</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-emerald-50/90 text-emerald-800 border-emerald-300 font-mono">
                    BPL Section
                  </Badge>
                </div>

                <div className="mt-2.5 space-y-2 max-h-64 overflow-y-auto pr-1">
                  <div className="rounded-xl skin-glass-sub p-2.5 text-xs border border-white/80">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-amber-800 font-mono">
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 text-amber-600" /> P-Way Urgent Demand
                      </span>
                      <span className="text-stone-400 text-[10px]">2m ago</span>
                    </div>
                    <p className="mt-1 text-stone-600 text-[11px] leading-relaxed">
                      TMS-2026-089 requested urgent tamping block at BINA-KIKA km 8.4-12.0.
                    </p>
                  </div>

                  <div className="rounded-xl skin-glass-sub p-2.5 text-xs border border-white/80">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-800 font-mono">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Shadow Block Opportunity
                      </span>
                      <span className="text-stone-400 text-[10px]">12m ago</span>
                    </div>
                    <p className="mt-1 text-stone-600 text-[11px] leading-relaxed">
                      OHE annual inspection merged into P-Way primary block. Saved 90 min corridor downtime.
                    </p>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-stone-200/60 flex justify-between items-center text-[10px] text-stone-400 font-mono">
                  <span>Auto-sync with COA & ICMS</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAlertsCount(0);
                      setShowNotifications(false);
                    }}
                    className="text-[#078A68] font-bold hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Slim Live Operations Radio Ticker Bar */}
      <div className="flex items-center space-x-2 bg-white/40 backdrop-blur-md border-t border-white/70 px-4 sm:px-6 py-1 text-[11px] text-stone-700 font-mono overflow-hidden select-none">
        <div className="flex items-center space-x-1.5 shrink-0 text-emerald-800 font-bold pr-2 border-r border-stone-300/60">
          <Radio className="h-3 w-3 text-[#078A68] animate-pulse" />
          <span className="uppercase text-[10px] tracking-wider">LIVE RAILWAY DISPATCH:</span>
        </div>
        <div
          onClick={() => setDispatchIndex((prev) => (prev + 1) % LIVE_DISPATCH_MESSAGES.length)}
          className="truncate cursor-pointer hover:text-stone-900 transition-all font-medium"
          title="Click to cycle live dispatches"
        >
          {LIVE_DISPATCH_MESSAGES[dispatchIndex]}
        </div>
        <span className="ml-auto text-[10px] text-stone-400 shrink-0 font-sans hidden sm:inline">
          Click ticker to step
        </span>
      </div>
    </header>
  );
};

