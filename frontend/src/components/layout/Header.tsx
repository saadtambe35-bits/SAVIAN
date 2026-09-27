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
          <div className="flex items-center space-x-1.5 rounded-full border border-stone-200/80 bg-white/90 backdrop-blur-md px-2.5 py-0.5 text-[9.5px] font-semibold text-stone-700 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-stone-400" />
            <span className="tracking-wide font-mono">🔘 SOLVER IDLE</span>
          </div>
        );
    }
  };

  const currentScenarioMeta = PRESET_SCENARIOS[currentScenario] || PRESET_SCENARIOS['standard'];

  return (
    <header className="sticky top-0 z-30 px-3 sm:px-6 pt-3 pb-1 select-none">
      {/* Floating AeroSkin Frosted Header Card */}
      <div className="rounded-2xl border border-stone-200/80 bg-white/90 backdrop-blur-xl shadow-xs px-3.5 py-2 flex items-center justify-between gap-3 specular-sheen">
        {/* Left Area: Hamburger + Title */}
        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="rounded-xl p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-800 lg:hidden cursor-pointer"
            aria-label="Open sidebar menu"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5">
              <span
                key={title}
                className="text-[15px] font-extrabold tracking-tight text-stone-900 font-sans whitespace-nowrap"
              >
                {t(title)}
              </span>
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 led-glow-emerald animate-pulse" />
            </div>
            <span className="hidden xl:inline-block px-1.5 py-0.5 rounded-md bg-stone-100/90 text-stone-600 text-[10px] font-mono font-semibold border border-stone-200/70">
              BINA – ET
            </span>
          </div>
        </div>

        {/* Center: Live Railway Radio Dispatch & Railway Board ROI Audit Breakdown */}
        <div className="hidden md:flex items-center gap-2.5 min-w-0">
          <div
            onClick={() => setDispatchIndex((prev) => (prev + 1) % LIVE_DISPATCH_MESSAGES.length)}
            className="flex items-center gap-2 rounded-xl bg-stone-50/90 hover:bg-stone-100/90 px-3 py-1 border border-stone-200/70 shadow-2xs cursor-pointer transition-all max-w-xs lg:max-w-sm xl:max-w-md min-w-0"
            title="Click to cycle live corridor dispatches"
          >
            <div className="flex items-center gap-1 text-[#078A68] shrink-0 font-mono text-[9.5px] font-bold">
              <Radio className="h-3 w-3 animate-pulse text-[#078A68]" />
              <span className="hidden lg:inline">DISPATCH:</span>
            </div>
            <span className="truncate text-xs font-mono font-medium text-stone-700 hover:text-stone-950 transition-colors">
              {LIVE_DISPATCH_MESSAGES[dispatchIndex]}
            </span>
          </div>

          {/* Railway Board ROI Audit Breakdown Interactive Pill */}
          <div className="hidden xl:flex items-center shrink-0">
            <RoiTicker compact />
          </div>
        </div>

        {/* Right Controls Area */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          {/* Vernacular Language Switcher */}
          <div className="hidden sm:flex items-center">
            <LanguageToggle />
          </div>

          {/* Live IST Clock Pill */}
          <div className="hidden sm:flex items-center space-x-1 rounded-full border border-stone-200/80 bg-white/90 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-mono text-stone-800 shadow-2xs">
            <Clock className="h-3 w-3 text-stone-400 animate-spin" style={{ animationDuration: '60s' }} />
            <span className="font-extrabold text-[10px] tracking-wide">{currentTime || '19:42:00 IST'}</span>
          </div>

          {/* CRIS Ping Latency Pill - High Contrast Cockpit Dark Chip with Breathing Aura & Rolling Digits */}
          <div
            className="hidden lg:flex items-center space-x-1 rounded-[7px] cockpit-dark-chip px-1.5 py-0.5 text-xs font-mono shadow-2xs aura-breathe-emerald tactile-spring cursor-default"
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
              className="flex items-center space-x-1 rounded-full border border-stone-200/80 bg-white/90 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-semibold text-stone-800 hover:bg-white shadow-2xs transition-all cursor-pointer"
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
              <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-stone-200 bg-white/95 backdrop-blur-xl p-2.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
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
                'flex items-center space-x-1.5 rounded-full px-2 py-0.5 transition-all border text-[10px] font-semibold shadow-2xs cursor-pointer',
                chaosMode
                  ? 'bg-amber-100/90 border-amber-300 text-amber-900 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                  : 'bg-white/90 border-stone-200/80 text-stone-700 hover:bg-white'
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
              className="relative rounded-xl p-1.5 text-stone-700 transition-colors hover:bg-white hover:text-stone-950 focus:outline-none shadow-2xs border border-stone-200/80 bg-white/90 backdrop-blur-md cursor-pointer"
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
              <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-stone-200 bg-white/95 backdrop-blur-xl p-3.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
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
                  <div className="rounded-xl skin-glass-sub p-2.5 text-xs border border-stone-200/80">
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

                  <div className="rounded-xl skin-glass-sub p-2.5 text-xs border border-stone-200/80">
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
    </header>
  );
};

