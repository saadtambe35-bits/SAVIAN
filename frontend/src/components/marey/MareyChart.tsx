// frontend/src/components/marey/MareyChart.tsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { Station, TrainSchedule, MaintenanceBlock, TooltipEntity, TrainType, BlockDepartment } from '@/types/marey';
import { MareyTrainLines } from './MareyTrainLines';
import { MareyBlockBands } from './MareyBlockBands';
import { MareyTooltip, formatMinutesToHHMM } from './MareyTooltip';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Zap,
  Train,
  Wrench,
  Clock,
} from 'lucide-react';

export interface MareyChartProps {
  stations: Station[];
  trains: TrainSchedule[];
  blocks: MaintenanceBlock[];
  chaosMode: boolean;
  onBlockClick: (blockId: string) => void;
  width?: number;
  height?: number;
  className?: string;
}

const DEFAULT_MARGIN = { top: 40, right: 60, bottom: 50, left: 100 };

export const MareyChart: React.FC<MareyChartProps> = ({
  stations,
  trains,
  blocks,
  chaosMode,
  onBlockClick,
  width: customWidth,
  height: customHeight = 780,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Responsive width detection
  const [containerWidth, setContainerWidth] = useState<number>(customWidth || 1200);
  useEffect(() => {
    if (customWidth) {
      setContainerWidth(customWidth);
      return;
    }
    const updateSize = () => {
      if (containerRef.current) {
        const measured = containerRef.current.clientWidth;
        if (measured > 0) setContainerWidth(measured);
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [customWidth]);

  const width = containerWidth;
  const height = customHeight;
  const margin = DEFAULT_MARGIN;

  const innerWidth = Math.max(width - margin.left - margin.right, 300);
  const innerHeight = Math.max(height - margin.top - margin.bottom, 300);

  // Maximum corridor distance (default 231.5 km for Bina - Itarsi)
  const maxDistanceKm = useMemo(() => {
    if (!stations.length) return 231.5;
    return Math.max(...stations.map((s) => s.distance_km), 231.5);
  }, [stations]);

  // Base D3 scales
  const baseScaleX = useMemo(() => {
    return d3.scaleLinear().domain([0, 1440]).range([0, innerWidth]);
  }, [innerWidth]);

  const baseScaleY = useMemo(() => {
    return d3.scaleLinear().domain([0, maxDistanceKm]).range([0, innerHeight]);
  }, [maxDistanceKm, innerHeight]);

  // Station Code -> Distance (km) lookup map
  const stationMap = useMemo(() => {
    const map = new Map<string, number>();
    stations.forEach((st) => {
      map.set(st.code, st.distance_km);
    });
    return map;
  }, [stations]);

  // D3 Zoom State
  const [zoomTransform, setZoomTransform] = useState<d3.ZoomTransform>(d3.zoomIdentity);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Interactive filters
  const [selectedTrainTypes, setSelectedTrainTypes] = useState<Set<TrainType>>(
    new Set<TrainType>(['RAJDHANI', 'VANDE_BHARAT', 'EXPRESS', 'MAIL', 'PASSENGER', 'FREIGHT'])
  );

  // Live moving corridor current time (ticking every second)
  const [liveCorridorMinute, setLiveCorridorMinute] = useState<number>(() => {
    const now = new Date();
    return (now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60) % 1440;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setLiveCorridorMinute((now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60) % 1440);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const [selectedDepartments, setSelectedDepartments] = useState<Set<BlockDepartment>>(
    new Set<BlockDepartment>(['P_WAY', 'OHE', 'S_AND_T'])
  );

  // Hover and Tooltip state
  const [hoveredEntity, setHoveredEntity] = useState<TooltipEntity | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredTrainNumber, setHoveredTrainNumber] = useState<string | null>(null);
  const [cursorMinute, setCursorMinute] = useState<number | null>(null);

  // Rescaled scales during zoom
  const currentScaleX = useMemo(() => {
    return zoomTransform.rescaleX(baseScaleX);
  }, [zoomTransform, baseScaleX]);

  const currentScaleY = useMemo(() => {
    return zoomTransform.rescaleY(baseScaleY);
  }, [zoomTransform, baseScaleY]);

  // Attach D3 Zoom Behavior to SVG
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.8, 8])
      .translateExtent([
        [-margin.left, -margin.top],
        [width + margin.right, height + margin.bottom],
      ])
      .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        setZoomTransform(event.transform);
      });

    zoomBehaviorRef.current = zoom;
    d3.select(svgEl).call(zoom);

    return () => {
      d3.select(svgEl).on('.zoom', null);
    };
  }, [width, height, margin]);

  // Zoom control helpers
  const handleZoomIn = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(250).call(zoomBehaviorRef.current.scaleBy, 1.3);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(250).call(zoomBehaviorRef.current.scaleBy, 1 / 1.3);
    }
  };

  const handleResetZoom = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
    }
  };

  // Filtered dataset
  const filteredTrains = useMemo(() => {
    return trains.filter((t) => selectedTrainTypes.has(t.train_type));
  }, [trains, selectedTrainTypes]);

  const filteredBlocks = useMemo(() => {
    return blocks.filter((b) => selectedDepartments.has(b.department));
  }, [blocks, selectedDepartments]);

  // 15-minute minor time marks (0, 15, 30, ...)
  const minorTimeMarks = useMemo(() => {
    const marks: number[] = [];
    for (let m = 0; m <= 1440; m += 15) {
      if (m % 60 !== 0) marks.push(m);
    }
    return marks;
  }, []);

  // 60-minute major time marks (00:00 to 24:00)
  const majorTimeMarks = useMemo(() => {
    const marks: number[] = [];
    for (let m = 0; m <= 1440; m += 60) {
      marks.push(m);
    }
    return marks;
  }, []);

  // Track cursor position for crosshair & time tooltip
  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = e.clientX - rect.left - margin.left;
    const minute = Math.round(currentScaleX.invert(relX));
    if (minute >= 0 && minute <= 1440) {
      setCursorMinute(minute);
    } else {
      setCursorMinute(null);
    }
  };

  const handleSvgMouseLeave = () => {
    setCursorMinute(null);
  };

  const toggleTrainType = (type: TrainType) => {
    setSelectedTrainTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        if (next.size > 1) next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const toggleDepartment = (dept: BlockDepartment) => {
    setSelectedDepartments((prev) => {
      const next = new Set(prev);
      if (next.has(dept)) {
        if (next.size > 1) next.delete(dept);
      } else {
        next.add(dept);
      }
      return next;
    });
  };

  const clashingBlocksCount = useMemo(() => {
    return blocks.filter((b) => b.has_clash).length;
  }, [blocks]);

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col rounded-2xl border border-[#ded9cb] bg-[#faf8f3] p-4 shadow-lg shadow-stone-900/10 select-none ${className}`}
    >
      {/* Top Header & Interactive Toolbar */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-[#e5dfd3] pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100/80 border border-emerald-300 text-emerald-800 shadow-sm">
            <Train className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight text-stone-900 font-mono">
                Corridor Stringline Diagram (Marey Chart)
              </h3>
              <span className="rounded-lg bg-stone-200/80 px-2 py-0.5 font-mono text-[10px] text-stone-700 border border-stone-300">
                231.5 km · 27 Stations · 24h
              </span>
              {chaosMode && (
                <span className="flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-300 shadow-sm animate-pulse">
                  <Zap className="h-3 w-3 fill-current text-rose-600" />
                  Chaos Mode Active ({clashingBlocksCount} Clashes)
                </span>
              )}
            </div>
            <p className="text-[11px] text-stone-500 font-mono mt-0.5">
              X-Axis: Time (00:00 - 24:00) · Y-Axis: Bina Jn (0.0k) → Itarsi Jn (231.5k) · Lower layer: Blocks · Upper layer: Train paths
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Cursor Time Pill */}
          {cursorMinute !== null && (
            <div className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-1 text-xs font-mono font-bold text-emerald-800 border border-[#ded8c9] shadow-sm">
              <Clock className="h-3.5 w-3.5 text-emerald-700" />
              <span>{formatMinutesToHHMM(cursorMinute)}</span>
            </div>
          )}

          {/* Zoom Controls */}
          <div className="flex items-center rounded-xl border border-[#ded8c9] bg-white p-1 shadow-sm gap-0.5">
            <button
              onClick={handleZoomIn}
              title="Zoom In (or Mouse Wheel)"
              className="rounded-lg p-1.5 text-stone-600 hover:bg-[#eae4d5] hover:text-stone-900 transition-colors cursor-pointer"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleZoomOut}
              title="Zoom Out (or Mouse Wheel)"
              className="rounded-lg p-1.5 text-stone-600 hover:bg-[#eae4d5] hover:text-stone-900 transition-colors cursor-pointer"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              title="Reset Zoom & Pan"
              className="rounded-lg p-1.5 text-stone-600 hover:bg-[#eae4d5] hover:text-stone-900 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1 text-[11px]">
        {/* Train Type Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-stone-600 font-bold mr-1 flex items-center gap-1 font-mono text-[11px]">
            <Train className="h-3.5 w-3.5 text-stone-500" /> Trains:
          </span>
          {(
            [
              { type: 'RAJDHANI', label: 'Rajdhani', color: '#ef4444' },
              { type: 'VANDE_BHARAT', label: 'Vande Bharat', color: '#f97316' },
              { type: 'EXPRESS', label: 'Express', color: '#3b82f6' },
              { type: 'MAIL', label: 'Mail', color: '#8b5cf6' },
              { type: 'PASSENGER', label: 'Passenger', color: '#06b6d4' },
              { type: 'FREIGHT', label: 'Freight', color: '#6b7280' },
            ] as const
          ).map((item) => {
            const active = selectedTrainTypes.has(item.type);
            return (
              <button
                key={item.type}
                onClick={() => toggleTrainType(item.type)}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 transition-all border font-mono text-[10px] cursor-pointer ${
                  active
                    ? 'bg-white text-stone-800 border-[#ded8c9] shadow-sm font-bold'
                    : 'bg-[#eee9dc]/60 text-stone-400 border-[#ded8c9]/50 hover:text-stone-600'
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full ring-1 ring-black/10"
                  style={{ backgroundColor: active ? item.color : '#a8a29e' }}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Maintenance Department Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-stone-600 font-bold mr-1 flex items-center gap-1 font-mono text-[11px]">
            <Wrench className="h-3.5 w-3.5 text-stone-500" /> Blocks:
          </span>
          {(
            [
              { dept: 'P_WAY', label: 'P-Way', color: '#f59e0b' },
              { dept: 'OHE', label: 'OHE', color: '#3b82f6' },
              { dept: 'S_AND_T', label: 'S&T', color: '#10b981' },
            ] as const
          ).map((item) => {
            const active = selectedDepartments.has(item.dept);
            return (
              <button
                key={item.dept}
                onClick={() => toggleDepartment(item.dept)}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 transition-all border font-mono text-[10px] cursor-pointer ${
                  active
                    ? 'bg-white text-stone-800 border-[#ded8c9] shadow-sm font-bold'
                    : 'bg-[#eee9dc]/60 text-stone-400 border-[#ded8c9]/50 hover:text-stone-600'
                }`}
              >
                <span
                  className="h-2 w-2 rounded-sm ring-1 ring-black/10"
                  style={{ backgroundColor: active ? item.color : '#a8a29e' }}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="relative overflow-hidden rounded-xl border border-slate-800/90 bg-slate-950 shadow-[inset_0_2px_12px_rgba(0,0,0,0.6)]">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="cursor-crosshair overflow-visible select-none"
          onMouseMove={handleSvgMouseMove}
          onMouseLeave={handleSvgMouseLeave}
        >
          <defs>
            {/* Plot area clip-path */}
            <clipPath id="marey-plot-area-clip">
              <rect x={0} y={0} width={innerWidth} height={innerHeight} />
            </clipPath>

            {/* Red pulsing glow filter for chaos clashes */}
            <filter id="marey-clash-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="glowBlur" />
              <feMerge>
                <feMergeNode in="glowBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Linear background gradient */}
            <linearGradient id="marey-bg-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#020617" />
              <stop offset="100%" stopColor="#0b0f19" />
            </linearGradient>
          </defs>

          {/* Main Chart Inner Group */}
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Background Rect */}
            <rect
              x={0}
              y={0}
              width={innerWidth}
              height={innerHeight}
              fill="url(#marey-bg-gradient)"
              stroke="#1e293b"
              strokeWidth={1}
            />

            {/* LAYER 1: Background Gridlines (Time vertical lines & Station horizontal lines) */}
            <g className="marey-gridlines" clipPath="url(#marey-plot-area-clip)">
              {/* 15-minute minor vertical gridlines */}
              {minorTimeMarks.map((min) => {
                const x = currentScaleX(min);
                if (x < 0 || x > innerWidth) return null;
                return (
                  <line
                    key={`min-${min}`}
                    x1={x}
                    y1={0}
                    x2={x}
                    y2={innerHeight}
                    stroke="#1e293b"
                    strokeWidth={0.8}
                    strokeOpacity={0.45}
                  />
                );
              })}

              {/* 60-minute major vertical gridlines */}
              {majorTimeMarks.map((min) => {
                const x = currentScaleX(min);
                if (x < 0 || x > innerWidth) return null;
                return (
                  <line
                    key={`maj-${min}`}
                    x1={x}
                    y1={0}
                    x2={x}
                    y2={innerHeight}
                    stroke="#334155"
                    strokeWidth={1}
                    strokeOpacity={0.7}
                  />
                );
              })}

              {/* 27 Station horizontal reference lines (dashed, slate-700) */}
              {stations.map((st) => {
                const y = currentScaleY(st.distance_km);
                if (y < 0 || y > innerHeight) return null;
                const isKeyStation = ['BINA', 'BHS', 'BPL', 'RKMP', 'ET'].includes(st.code);

                return (
                  <line
                    key={`st-line-${st.code}`}
                    x1={0}
                    y1={y}
                    x2={innerWidth}
                    y2={y}
                    stroke={isKeyStation ? '#475569' : '#334155'}
                    strokeWidth={isKeyStation ? 1.2 : 0.8}
                    strokeDasharray={isKeyStation ? '4 3' : '3 3'}
                    strokeOpacity={isKeyStation ? 0.9 : 0.6}
                  />
                );
              })}
            </g>

            {/* LAYER 2: Zoomable Plot Layer for Data (Blocks lower z-order, Trains higher z-order) */}
            <g
              id="marey-zoom-content"
              clipPath="url(#marey-plot-area-clip)"
              className="marey-zoom-layer"
            >
              {/* 2A: Maintenance Block Bands (BEHIND train lines) */}
              <MareyBlockBands
                blocks={filteredBlocks}
                xScale={currentScaleX}
                yScale={currentScaleY}
                chaosMode={chaosMode}
                onBlockClick={onBlockClick}
                onHoverBlock={(block, pos) => {
                  if (block && pos) {
                    setHoveredEntity({ type: 'block', block });
                    setTooltipPos(pos);
                  } else {
                    setHoveredEntity(null);
                    setTooltipPos(null);
                  }
                }}
              />

              {/* 2B: Train Schedule Lines (ON TOP of block bands) */}
              <MareyTrainLines
                trains={filteredTrains}
                xScale={currentScaleX}
                yScale={currentScaleY}
                stationMap={stationMap}
                hoveredTrainNumber={hoveredTrainNumber}
                onHoverTrain={(train, pos, hoveredStation) => {
                  if (train && pos) {
                    setHoveredTrainNumber(train.train_number);
                    setHoveredEntity({ type: 'train', train, hoveredStation });
                    setTooltipPos(pos);
                  } else {
                    setHoveredTrainNumber(null);
                    setHoveredEntity(null);
                    setTooltipPos(null);
                  }
                }}
              />

              {/* Current Cursor Time vertical crosshair */}
              {cursorMinute !== null && (
                <line
                  x1={currentScaleX(cursorMinute)}
                  y1={0}
                  x2={currentScaleX(cursorMinute)}
                  y2={innerHeight}
                  stroke="#06b6d4"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                  strokeOpacity={0.6}
                  pointerEvents="none"
                />
              )}

              {/* LIVE MOVING CORRIDOR CURRENT-TIME LINE */}
              {(() => {
                const liveX = currentScaleX(liveCorridorMinute);
                if (liveX < 0 || liveX > innerWidth) return null;
                return (
                  <g className="live-corridor-clock-indicator pointer-events-none z-30">
                    <line
                      x1={liveX}
                      y1={0}
                      x2={liveX}
                      y2={innerHeight}
                      stroke="#10b981"
                      strokeWidth={2}
                      strokeDasharray="4 2"
                      strokeOpacity={0.85}
                    />
                    {/* Top flag capsule */}
                    <rect
                      x={liveX - 32}
                      y={-22}
                      width={64}
                      height={18}
                      rx={5}
                      fill="#059669"
                      stroke="#34d399"
                      strokeWidth={1}
                    />
                    <text
                      x={liveX}
                      y={-10}
                      fill="#ffffff"
                      fontSize={9}
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {formatMinutesToHHMM(Math.floor(liveCorridorMinute))} IST
                    </text>
                    {/* Bottom pulse beacon */}
                    <circle cx={liveX} cy={innerHeight} r={3.5} fill="#34d399" />
                    <circle cx={liveX} cy={innerHeight} r={7} fill="#34d399" opacity={0.4} className="animate-ping" />
                  </g>
                );
              })()}
            </g>

            {/* LAYER 3: Station Labels on Left (Y-Axis) */}
            <g className="marey-station-labels" pointerEvents="none">
              {stations.map((st) => {
                const y = currentScaleY(st.distance_km);
                if (y < -15 || y > innerHeight + 15) return null;
                const isKeyStation = ['BINA', 'BHS', 'BPL', 'RKMP', 'ET'].includes(st.code);

                return (
                  <g key={`lbl-${st.code}`}>
                    {/* Station marker tick dot */}
                    <circle
                      cx={0}
                      cy={y}
                      r={isKeyStation ? 2.5 : 1.5}
                      fill={isKeyStation ? '#38bdf8' : '#64748b'}
                    />

                    {/* Station Chainage (km) */}
                    <text
                      x={-48}
                      y={y + 3.5}
                      fill="#64748b"
                      fontSize={8.5}
                      fontFamily="monospace"
                      textAnchor="end"
                      className="select-none"
                    >
                      {st.distance_km.toFixed(1)}k
                    </text>

                    {/* Station Code */}
                    <text
                      x={-6}
                      y={y + 3.5}
                      fill={isKeyStation ? '#f8fafc' : '#94a3b8'}
                      fontSize={isKeyStation ? 10.5 : 9}
                      fontWeight={isKeyStation ? 'bold' : '500'}
                      fontFamily="monospace"
                      textAnchor="end"
                      className="select-none tracking-tight"
                    >
                      {st.code}
                    </text>
                  </g>
                );
              })}

              {/* Y-Axis Title at top left */}
              <text
                x={-8}
                y={-14}
                fill="#94a3b8"
                fontSize={9.5}
                fontWeight="bold"
                textAnchor="end"
                className="select-none"
              >
                STATION / KM
              </text>
            </g>

            {/* LAYER 4: Bottom Time Grid Labels (X-Axis) */}
            <g className="marey-time-labels" transform={`translate(0, ${innerHeight})`} pointerEvents="none">
              {/* Bottom Axis Baseline */}
              <line x1={0} y1={0} x2={innerWidth} y2={0} stroke="#334155" strokeWidth={1} />

              {majorTimeMarks.map((min) => {
                const x = currentScaleX(min);
                if (x < -20 || x > innerWidth + 20) return null;
                const isMidnight = min === 0 || min === 1440;

                return (
                  <g key={`time-lbl-${min}`} transform={`translate(${x}, 0)`}>
                    {/* Tick mark */}
                    <line x1={0} y1={0} x2={0} y2={6} stroke="#475569" strokeWidth={1} />

                    {/* HH:MM Label */}
                    <text
                      x={0}
                      y={20}
                      fill={isMidnight ? '#38bdf8' : '#94a3b8'}
                      fontSize={10}
                      fontFamily="monospace"
                      fontWeight={isMidnight ? 'bold' : 'normal'}
                      textAnchor="middle"
                      className="select-none"
                    >
                      {formatMinutesToHHMM(min)}
                    </text>
                  </g>
                );
              })}

              {/* X-Axis Title */}
              <text
                x={innerWidth / 2}
                y={38}
                fill="#64748b"
                fontSize={9.5}
                fontWeight="600"
                textAnchor="middle"
                className="select-none uppercase tracking-wider"
              >
                Time of Day (15-Minute Grid · Indian Standard Time)
              </text>
            </g>

            {/* Right Margin Chainage indicators for quick glance */}
            <g className="marey-right-axis" transform={`translate(${innerWidth}, 0)`} pointerEvents="none">
              <line x1={0} y1={0} x2={0} y2={innerHeight} stroke="#334155" strokeWidth={1} />
              {stations
                .filter((s) => ['BINA', 'BHS', 'BPL', 'RKMP', 'ET'].includes(s.code))
                .map((st) => {
                  const y = currentScaleY(st.distance_km);
                  return (
                    <text
                      key={`rt-${st.code}`}
                      x={8}
                      y={y + 3.5}
                      fill="#64748b"
                      fontSize={9}
                      fontFamily="monospace"
                      className="select-none"
                    >
                      {st.name.replace(' Junction', ' Jn')}
                    </text>
                  );
                })}
            </g>
          </g>
        </svg>

        {/* Floating Tooltip Component */}
        <MareyTooltip
          entity={hoveredEntity}
          position={tooltipPos}
          containerRef={containerRef}
        />
      </div>

      {/* Bottom Chart Footer / Legend & Shortcuts */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-1 text-[11px] font-mono text-stone-500">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-red-500 inline-block rounded-full" /> Rajdhani (2.5px)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-orange-500 inline-block rounded-full" /> Vande Bharat (2.5px)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-blue-500 inline-block rounded-full" /> Express (1.8px)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-purple-500 inline-block rounded-full" /> Mail (1.8px)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-cyan-500 inline-block rounded-full" /> Passenger (1.2px)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-stone-400 inline-block rounded-full" /> Freight (1.2px)
          </span>
        </div>

        <div className="flex items-center gap-3 text-stone-400">
          <span>Scroll to zoom · Drag to pan · Hover line/block for details</span>
        </div>
      </div>
    </div>
  );
};
