import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Cpu,
  GitBranch,
  Settings,
  Train,
  X,
  Radio,
  ShieldCheck,
  Box,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/i18n/LanguageContext';

export type NavItemKey = 'dashboard' | 'marey' | 'demands' | 'solver' | 'lifecycle' | 'digitaltwin' | 'discipline' | 'settings';

interface SidebarProps {
  activeNav: NavItemKey;
  onSelectNav: (key: NavItemKey) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  demandCount?: number;
  activeClashes?: number;
}

interface NavItemConfig {
  key: NavItemKey;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'railway' | 'purple';
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeNav,
  onSelectNav,
  mobileOpen,
  onCloseMobile,
  demandCount = 5,
  activeClashes = 0,
}) => {
  const { t } = useTranslation();
  const navItems: NavItemConfig[] = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      key: 'marey',
      label: 'Marey Chart',
      icon: Train,
      badge: 'D3 Live',
      badgeVariant: 'railway',
    },
    {
      key: 'demands',
      label: 'Demands',
      icon: FileText,
      badge: demandCount > 0 ? demandCount : undefined,
      badgeVariant: 'warning',
    },
    {
      key: 'solver',
      label: 'Solver',
      icon: Cpu,
      badge: activeClashes > 0 ? `${activeClashes} clashes` : 'AI',
      badgeVariant: activeClashes > 0 ? 'destructive' : 'railway',
    },
    {
      key: 'lifecycle',
      label: 'Lifecycle',
      icon: GitBranch,
    },
    {
      key: 'digitaltwin',
      label: '3D Yard Twin',
      icon: Box,
      badge: '3D Twin',
      badgeVariant: 'railway',
    },
    {
      key: 'discipline',
      label: 'Discipline Matrix',
      icon: Award,
      badge: 'Trust',
      badgeVariant: 'warning',
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-stone-900/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container - AeroSkin Glass (Fixed on desktop, drawer on mobile) */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white/50 lg:bg-[#F8F5EE]/50 backdrop-blur-xl border-r border-white/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.85),_4px_0_24px_rgba(0,0,0,0.05)] transition-transform duration-300 ease-in-out lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Card (Top) with Bholu Mascot - Matching bina block style */}
        <div className="mx-3.5 mt-2.5 p-2.5 rounded-2xl bg-white/95 border border-stone-200 shadow-xs hover:border-emerald-500/60 transition-all shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              {/* Elevated squircle holding mascot */}
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-stone-100/90 p-1 border border-stone-200/80 overflow-hidden shadow-2xs">
                <img
                  src="/bholu.jpg"
                  alt="Bholu the Guard Elephant"
                  className="h-full w-full object-contain object-center scale-105"
                  onError={(e) => {
                    // Fallback to train icon if image missing
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-[15px] tracking-tight text-stone-900 font-sans">
                    Line-Clear
                  </span>
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 led-glow-emerald animate-pulse" />
                </div>
                <p className="text-[9.5px] tracking-wider uppercase font-semibold text-stone-500 font-mono">
                  IR BLOCK SCHEDULING AI
                </p>
              </div>
            </div>

            {/* Close button on mobile */}
            <button
              type="button"
              className="rounded-xl p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 lg:hidden cursor-pointer"
              onClick={onCloseMobile}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Corridor Metadata Pill (Matching bina block style) */}
        <div className="mx-3.5 mt-2 mb-2 px-3.5 py-2.5 rounded-2xl bg-white/95 border border-stone-200 shadow-xs hover:border-emerald-500/60 transition-all shrink-0">
          <div className="flex items-center justify-between text-[11px] font-semibold text-stone-800">
            <span className="flex items-center gap-1.5 text-stone-800 font-mono font-bold">
              <Radio className="h-3 w-3 text-[#078A68] animate-pulse" />
              {t('bina_et_section') || 'BINA – ET SECTION'}
            </span>
            <span className="font-mono text-emerald-900 text-[10px] bg-emerald-100/90 px-1.5 py-0.5 rounded-md border border-emerald-300/80 font-bold shadow-2xs">
              WCR / BPL
            </span>
          </div>
          <div className="mt-0.5 flex items-center justify-between text-[10px] text-stone-600 font-medium font-mono">
            <span>152.4 km • Double Track</span>
            <span className="text-emerald-800 flex items-center gap-1 font-semibold">
              <ShieldCheck className="h-3 w-3 text-emerald-600" /> Kavach SIL-4
            </span>
          </div>
        </div>

        {/* Navigation - Perfectly proportioned to fill available space */}
        <nav className="flex-1 flex flex-col justify-between px-3.5 py-1 min-h-0 overflow-hidden">
          <div className="px-1 pb-1 text-[9.5px] font-bold uppercase tracking-wider text-stone-700 font-mono">
            {t('navigation') || 'Navigation'}
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.key;

            return (
              <button
                key={item.key}
                id={`nav-${item.key}`}
                type="button"
                onClick={() => {
                  onSelectNav(item.key);
                  onCloseMobile();
                }}
                className={cn(
                  'group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-[13.5px] transition-all duration-200 cursor-pointer',
                  isActive
                    ? 'border-l-4 border-l-[#078A68] bg-[#ECFDF5] text-emerald-950 font-bold border border-emerald-500/40 shadow-xs'
                    : 'bg-white/55 hover:bg-white/85 text-stone-800 hover:text-stone-950 border border-white/80 hover:border-stone-200/80 shadow-2xs font-semibold backdrop-blur-md'
                )}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={cn(
                      'h-4 w-4 transition-colors',
                      isActive ? 'text-[#078A68]' : 'text-stone-700 group-hover:text-stone-950'
                    )}
                  />
                  <span>{t(item.key) || item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={cn(
                      'text-[9.5px] px-2 py-0.5 rounded-[7px] font-mono font-bold shadow-2xs',
                      isActive
                        ? 'bg-[#078A68] text-white'
                        : String(item.badge).includes('Clash') || String(item.badge).includes('Alert')
                        ? 'cockpit-dark-rose'
                        : 'bg-white text-stone-800 border border-stone-200/80'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Diagnostics - Harmonious, proportional gap */}
        <div className="mx-3.5 mb-2.5 mt-2 shrink-0">
          <div className="rounded-2xl bg-white/95 p-2.5 text-xs space-y-1.5 border border-stone-200 shadow-xs hover:border-emerald-500/60 transition-all">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-stone-600 font-medium">Solver Engine</span>
              <span className="cockpit-dark-chip text-[10px] font-bold px-2 py-0.5 rounded-[7px] aura-breathe-emerald tactile-spring cursor-default">
                CP-SAT 9.8
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-stone-600 font-medium">Headway Guard</span>
              <span className="text-stone-800 font-bold">7 min (Normal)</span>
            </div>
          </div>
          <div className="mt-1.5 text-center text-[9.5px] text-stone-500 font-mono">
            Indian Railways • AI DSS v1.0
          </div>
        </div>
      </aside>
    </>
  );
};
