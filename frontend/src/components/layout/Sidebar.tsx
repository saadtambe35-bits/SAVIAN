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

      {/* Sidebar container - AeroSkin Glass */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#F8F5EE]/92 backdrop-blur-2xl border-r border-white/80 shadow-[4px_0_30px_rgba(160,148,130,0.12)] transition-transform duration-300 ease-in-out lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Card (Top) with Bholu Mascot */}
        <div className="p-4 border-b border-white/70 bg-white/40 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3.5">
              {/* Elevated squircle holding mascot */}
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl skin-glass-elevated p-1.5 border-white/95 overflow-hidden">
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
                  <span className="font-extrabold text-base tracking-tight text-stone-900 font-sans">
                    Line-Clear
                  </span>
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 led-glow-emerald animate-pulse" />
                </div>
                <p className="text-[10px] tracking-wider uppercase font-semibold text-stone-500 font-mono">
                  IR BLOCK SCHEDULING AI
                </p>
              </div>
            </div>

            {/* Close button on mobile */}
            <button
              type="button"
              className="rounded-xl p-1.5 text-stone-400 hover:bg-white/80 hover:text-stone-700 lg:hidden cursor-pointer"
              onClick={onCloseMobile}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Corridor Metadata Pill (Inset Container) */}
        <div className="mx-3.5 mt-3.5 mb-1 px-3 py-2 rounded-xl skin-glass-sub border border-stone-200 shadow-xs hover:border-emerald-500/60 transition-all">
          <div className="flex items-center justify-between text-[11px] font-semibold text-stone-800">
            <span className="flex items-center gap-1.5 text-stone-800 font-mono">
              <Radio className="h-3 w-3 text-[#078A68] animate-pulse" />
              {t('bina_et_section') || 'BINA – ET SECTION'}
            </span>
            <span className="font-mono text-emerald-900 text-[10px] bg-emerald-100/90 px-1.5 py-0.5 rounded-md border border-emerald-300/80 font-bold shadow-2xs">
              WCR / BPL
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] text-stone-600 font-medium font-mono">
            <span>152.4 km • Double Track</span>
            <span className="text-emerald-800 flex items-center gap-1 font-semibold">
              <ShieldCheck className="h-3 w-3 text-emerald-600" /> Kavach SIL-4
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 px-3 py-3 overflow-y-auto">
          <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-stone-400 font-mono">
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
                  'group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer',
                  isActive
                    ? 'border-l-4 border-l-[#078A68] bg-[#ECFDF5]/90 text-emerald-950 font-bold shadow-2xs'
                    : 'text-stone-600 hover:bg-white/70 hover:text-stone-900'
                )}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={cn(
                      'h-4 w-4 transition-colors',
                      isActive ? 'text-[#078A68]' : 'text-stone-400 group-hover:text-stone-700'
                    )}
                  />
                  <span>{t(item.key) || item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={cn(
                      'text-[10px] px-2 py-0.5 rounded-[7px] font-mono font-bold shadow-2xs',
                      isActive
                        ? 'bg-[#078A68] text-white'
                        : String(item.badge).includes('Clash') || String(item.badge).includes('Alert')
                        ? 'cockpit-dark-rose'
                        : 'bg-white/80 text-stone-700 border border-stone-200'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Diagnostics (Inset Box) */}
        <div className="p-3.5 border-t border-white/70 bg-white/30 backdrop-blur-md">
          <div className="rounded-xl skin-glass-sub p-3 text-xs space-y-1.5 border border-stone-200 shadow-xs hover:border-emerald-500/60 transition-all">
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
          <div className="mt-2 text-center text-[10px] text-stone-500 font-mono">
            Indian Railways • AI DSS v1.0
          </div>
        </div>
      </aside>
    </>
  );
};
