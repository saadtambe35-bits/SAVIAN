import React from 'react';
import {
  Activity,
  Cpu,
  Clock,
  Radio,
  Wifi,
  WifiOff,
  GitCommit,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StatusBarProps {
  isConnected?: boolean;
  onToggleConnection?: () => void;
  activeSessionId?: string | null;
  lastSolveTime?: string | null;
  solveDurationSec?: number | null;
  optimalityGap?: number | null;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  isConnected = true,
  onToggleConnection,
  activeSessionId = 'SOLV-2026-BPL-2061',
  lastSolveTime = '19:42:08 IST',
  solveDurationSec = 1.8,
  optimalityGap = 0.0,
}) => {
  return (
    <footer
      id="system-status-bar"
      className="sticky bottom-0 z-30 flex h-9 w-full items-center justify-between border-t border-white/80 bg-[#FAF7F0]/85 px-4 text-xs text-stone-600 backdrop-blur-xl font-mono select-none shadow-[0_-4px_20px_rgba(160,148,130,0.08)] specular-sheen"
    >
      {/* Left: Connection Status Indicator */}
      <div className="flex items-center space-x-4">
        <button
          type="button"
          onClick={onToggleConnection}
          className="flex items-center space-x-2 group focus:outline-none cursor-pointer"
          title={isConnected ? 'Connected to Railway Control Hub' : 'Disconnected'}
        >
          <span className="relative flex h-2 w-2">
            {isConnected ? (
              <>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500 led-glow-emerald" />
              </>
            ) : (
              <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500 led-glow-rose" />
            )}
          </span>

          <span
            className={cn(
              'text-[10px] font-bold tracking-wider transition-colors',
              isConnected ? 'text-emerald-900 font-extrabold' : 'text-rose-700 font-extrabold'
            )}
          >
            {isConnected ? 'HUB CONNECTED' : 'OFFLINE'}
          </span>

          {isConnected ? (
            <Wifi className="h-3 w-3 text-[#078A68]" />
          ) : (
            <WifiOff className="h-3 w-3 text-rose-500" />
          )}
        </button>

        <span className="text-stone-300 hidden sm:inline">|</span>

        {/* Corridor Section */}
        <div className="hidden sm:flex items-center space-x-1.5 text-stone-600 text-[11px]">
          <Radio className="h-3 w-3 text-emerald-600" />
          <span>WCR/BPL: BINA - ET (152.4 KM)</span>
        </div>
      </div>

      {/* Center: Current Solve Session ID */}
      <div className="flex items-center space-x-2 text-[11px]">
        <div className="flex items-center space-x-1.5 neumorphic-inset rounded-lg px-2.5 py-0.5">
          <Cpu className="h-3 w-3 text-stone-500" />
          <span className="text-stone-500 font-sans text-[10px] uppercase font-bold">SESSION:</span>
          {activeSessionId ? (
            <span className="text-stone-800 font-bold tracking-tight">
              {activeSessionId}
            </span>
          ) : (
            <span className="text-stone-400 italic">No Active Session</span>
          )}
        </div>
      </div>

      {/* Right: Last Solve Metrics */}
      <div className="flex items-center space-x-3 text-[11px]">
        {lastSolveTime && (
          <div className="flex items-center space-x-1.5 text-stone-600">
            <Clock className="h-3 w-3 text-stone-400" />
            <span className="hidden md:inline text-stone-500 font-sans text-[10px]">LAST SOLVE:</span>
            <span className="text-stone-800 font-medium">{lastSolveTime}</span>
            {solveDurationSec !== null && (
              <span className="text-emerald-800 text-[10px] font-bold">
                ({solveDurationSec}s)
              </span>
            )}
          </div>
        )}

        <span className="text-stone-300 hidden md:inline">|</span>

        {optimalityGap !== null && (
          <div className="hidden lg:flex items-center space-x-1 text-[10px] text-stone-600">
            <GitCommit className="h-2.5 w-2.5 text-stone-400" />
            <span>Gap: {optimalityGap.toFixed(2)}%</span>
          </div>
        )}

        <span className="text-stone-300 hidden md:inline">|</span>

        <div className="hidden xl:flex items-center space-x-1 text-[10px] text-stone-500">
          <Activity className="h-3 w-3 text-emerald-600" />
          <span>12ms ping</span>
        </div>
      </div>
    </footer>
  );
};
