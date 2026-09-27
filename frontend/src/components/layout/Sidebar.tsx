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

      {/* Sidebar container - Luminous Frosted Mint Glass (Fixed on desktop, drawer on mobile) */}
      <aside
        style={{
          backgroundColor: 'rgba(228, 240, 235, 0.4)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] transition-transform duration-300 ease-in-out lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Card (Top) with Bholu Mascot */}
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.65)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.05)',
          }}
          className="mx-3.5 mt-2.5 p-2.5 rounded-2xl border border-white/40 hover:border-white/70 hover:bg-white/[0.80] transition-all shrink-0"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              {/* Elevated squircle holding mascot */}
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-white/80 p-1 border border-white/60 overflow-hidden shadow-2xs">
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
              className="rounded-xl p-1 text-stone-400 hover:bg-white/60 hover:text-stone-700 lg:hidden cursor-pointer"
              onClick={onCloseMobile}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Corridor Metadata Pill */}
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.65)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.05)',
          }}
          className="mx-3.5 mt-2 mb-2 px-3.5 py-2.5 rounded-2xl border border-white/40 hover:border-white/70 hover:bg-white/[0.80] transition-all shrink-0"
        >
          <div className="flex items-center justify-between text-[11px] font-semibold text-stone-800">
            <span className="flex items-center gap-1.5 text-stone-900 font-mono font-bold">
              <Radio className="h-3 w-3 text-[#078A68] animate-pulse" />
              {t('bina_et_section') || 'BINA – ET SECTION'}
            </span>
            <span className="font-mono text-emerald-950 text-[10px] bg-emerald-100/90 px-1.5 py-0.5 rounded-md border border-emerald-300/80 font-bold shadow-2xs">
              WCR / BPL
            </span>
          </div>
          <div className="mt-0.5 flex items-center justify-between text-[10px] text-stone-700 font-medium font-mono">
            <span>152.4 km • Double Track</span>
            <span className="text-emerald-900 flex items-center gap-1 font-bold">
              <ShieldCheck className="h-3 w-3 text-emerald-600" /> Kavach SIL-4
            </span>
          </div>
        </div>

        {/* Navigation - Perfectly proportioned to fill available space */}
        <nav className="flex-1 flex flex-col justify-between px-3.5 py-1 min-h-0 overflow-hidden">
          <div className="px-1 pb-1 text-[9.5px] font-bold uppercase tracking-wider text-stone-600 font-mono">
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
                style={{
                  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.65)',
                  boxShadow: isActive
                    ? '0 8px 32px 0 rgba(31, 38, 135, 0.08), inset 0 1px 1px 0 rgba(255, 255, 255, 0.9)'
                    : '0 8px 32px 0 rgba(31, 38, 135, 0.05)',
                  borderLeft: isActive ? '4px solid #078A68' : '1px solid rgba(255, 255, 255, 0.4)',
                  borderTop: isActive ? '1px solid rgba(7, 138, 104, 0.4)' : '1px solid rgba(255, 255, 255, 0.4)',
                  borderRight: isActive ? '1px solid rgba(7, 138, 104, 0.4)' : '1px solid rgba(255, 255, 255, 0.4)',
                  borderBottom: isActive ? '1px solid rgba(7, 138, 104, 0.4)' : '1px solid rgba(255, 255, 255, 0.4)',
                }}
                className={cn(
                  'group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-[13.5px] transition-all duration-200 cursor-pointer',
                  isActive
                    ? 'text-emerald-950 font-bold scale-[1.01]'
                    : 'hover:bg-white/[0.85] text-stone-800 hover:text-stone-950 font-semibold'
                )}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={cn(
                      'h-4 w-4 transition-colors',
                      isActive ? 'text-[#078A68]' : 'text-stone-700 group-hover:text-stone-950'
                    )}
                  />
                  <span
                    className={cn(
                      'tracking-tight font-sans',
                      isActive ? 'text-emerald-950 font-bold' : 'text-stone-800 group-hover:text-stone-950 font-semibold'
                    )}
                  >
                    {t(item.key) || item.label}
                  </span>
                </div>

                {item.badge && (
                  <span
                    className={cn(
                      'text-[9.5px] px-2 py-0.5 rounded-[7px] font-mono font-bold shadow-2xs',
                      isActive
                        ? 'bg-[#078A68] text-white shadow-xs'
                        : String(item.badge).includes('Clash') || String(item.badge).includes('Alert')
                        ? 'cockpit-dark-rose'
                        : 'bg-white/90 text-stone-800 border border-white/80'
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
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.65)',
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.05)',
            }}
            className="rounded-2xl p-2.5 text-xs space-y-1.5 border border-white/40 hover:border-white/70 hover:bg-white/[0.80] transition-all"
          >
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
