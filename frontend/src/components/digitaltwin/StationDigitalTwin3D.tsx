import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  RotateCw,
  ZoomIn,
  ZoomOut,
  Sun,
  Moon,
  Zap,
  ZapOff,
  ShieldAlert,
  ShieldCheck,
  Compass,
  Train,
  Play,
  Pause,
} from 'lucide-react';

/**
 * LINE CLEAR (SAVIAN) - Indian Railways AI Operations Cockpit
 * StationDigitalTwin3D.tsx: High-Performance 60fps Canvas 2.5D Isometric Station Digital Twin
 * Zero External Dependencies (Pure Canvas2D + Math Projection)
 */

export interface StationDigitalTwin3DProps {
  isBlockActive?: boolean;
  isPowerIsolated?: boolean;
  selectedStation?: string;
}

export const StationDigitalTwin3D: React.FC<StationDigitalTwin3DProps> = ({
  isBlockActive: incomingBlockActive,
  isPowerIsolated: incomingPowerIsolated,
  selectedStation = 'Bhopal Junction Yard (BPL)',
}) => {
  // Component State
  const [isBlockActive, setIsBlockActive] = useState<boolean>(incomingBlockActive ?? true);
  const [isPowerIsolated, setIsPowerIsolated] = useState<boolean>(incomingPowerIsolated ?? false);
  const [isNightMode, setIsNightMode] = useState<boolean>(true);
  const [isTrainMoving, setIsTrainMoving] = useState<boolean>(true);

  // Sync with incoming props if changed externally
  useEffect(() => {
    if (incomingBlockActive !== undefined) setIsBlockActive(incomingBlockActive);
  }, [incomingBlockActive]);

  useEffect(() => {
    if (incomingPowerIsolated !== undefined) setIsPowerIsolated(incomingPowerIsolated);
  }, [incomingPowerIsolated]);

  // Viewport transformation controls
  const [zoom, setZoom] = useState<number>(1.0);
  const [rotationAngle, setRotationAngle] = useState<number>(0); // degrees
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Train animation coordinate along Track 1 (UP Main)
  const trainPosRef = useRef<number>(-350);

  // Pulse animation timer for hazard glow
  const pulseTimerRef = useRef<number>(0);

  // -------------------------------------------------------------
  // ISOMETRIC 3D PROJECTION MATH
  // -------------------------------------------------------------
  const projectIso = useCallback(
    (x: number, y: number, z: number, angleDeg: number, zoomLevel: number, panOffset: { x: number; y: number }, originX: number, originY: number) => {
      const rad = (angleDeg * Math.PI) / 180;
      const cosA = Math.cos(rad);
      const sinA = Math.sin(rad);

      // Rotate around Z axis
      const rx = x * cosA - y * sinA;
      const ry = x * sinA + y * cosA;

      // Isometric projection: 30-degree isometric slant
      const isoX = (rx - ry) * 0.866025 * zoomLevel + originX + panOffset.x;
      const isoY = (rx + ry) * 0.5 * zoomLevel - z * zoomLevel + originY + panOffset.y;

      return { x: isoX, y: isoY };
    },
    []
  );

  // -------------------------------------------------------------
  // 60FPS CANVAS RENDERING ENGINE
  // -------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      // Handle retina high-DPI scaling
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const dpr = window.devicePixelRatio || 1;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Origin at center of canvas
      const originX = width / 2;
      const originY = height / 2 + 30;

      // Update train movement
      if (isTrainMoving) {
        trainPosRef.current += 1.8;
        if (trainPosRef.current > 420) {
          trainPosRef.current = -420;
        }
      }

      // Update pulse glow
      pulseTimerRef.current += 0.04;
      const pulseVal = 0.6 + 0.4 * Math.sin(pulseTimerRef.current * 3);

      // Projection helper bound to current viewport
      const toScreen = (x: number, y: number, z: number) =>
        projectIso(x, y, z, rotationAngle, zoom, pan, originX, originY);

      // 1. Background Fill
      if (isNightMode) {
        const bgGradient = ctx.createLinearGradient(0, 0, width, height);
        bgGradient.addColorStop(0, '#020617'); // slate-950
        bgGradient.addColorStop(1, '#090d1a');
        ctx.fillStyle = bgGradient;
      } else {
        const bgGradient = ctx.createLinearGradient(0, 0, width, height);
        bgGradient.addColorStop(0, '#0f172a');
        bgGradient.addColorStop(1, '#1e293b');
        ctx.fillStyle = bgGradient;
      }
      ctx.fillRect(0, 0, width, height);

      // 2. Isometric Ground Yard Surface & Grid
      const groundRadius = 380;
      const p1 = toScreen(-groundRadius, -groundRadius, 0);
      const p2 = toScreen(groundRadius, -groundRadius, 0);
      const p3 = toScreen(groundRadius, groundRadius, 0);
      const p4 = toScreen(-groundRadius, groundRadius, 0);

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.closePath();

      ctx.fillStyle = isNightMode ? '#0b1120' : '#141e33';
      ctx.fill();
      ctx.strokeStyle = isNightMode ? '#1e293b' : '#334155';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Subtle isometric grid lines
      ctx.strokeStyle = isNightMode ? 'rgba(30, 41, 59, 0.4)' : 'rgba(51, 65, 85, 0.4)';
      for (let g = -320; g <= 320; g += 80) {
        const ga1 = toScreen(-320, g, 0);
        const ga2 = toScreen(320, g, 0);
        ctx.beginPath();
        ctx.moveTo(ga1.x, ga1.y);
        ctx.lineTo(ga2.x, ga2.y);
        ctx.stroke();
      }

      // 3. Station Platform (Alongside Loop Siding & Track 1)
      const platformY = -140;
      const platLength = 340;
      const platWidth = 50;
      const platHeight = 14;

      const platTop1 = toScreen(-platLength, platformY - platWidth, platHeight);
      const platTop2 = toScreen(platLength, platformY - platWidth, platHeight);
      const platTop3 = toScreen(platLength, platformY, platHeight);
      const platTop4 = toScreen(-platLength, platformY, platHeight);

      // Platform Side Faces
      const platBot3 = toScreen(platLength, platformY, 0);
      const platBot4 = toScreen(-platLength, platformY, 0);

      ctx.beginPath();
      ctx.moveTo(platTop4.x, platTop4.y);
      ctx.lineTo(platTop3.x, platTop3.y);
      ctx.lineTo(platBot3.x, platBot3.y);
      ctx.lineTo(platBot4.x, platBot4.y);
      ctx.closePath();
      ctx.fillStyle = isNightMode ? '#1e293b' : '#334155';
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.stroke();

      // Platform Top Deck
      ctx.beginPath();
      ctx.moveTo(platTop1.x, platTop1.y);
      ctx.lineTo(platTop2.x, platTop2.y);
      ctx.lineTo(platTop3.x, platTop3.y);
      ctx.lineTo(platTop4.x, platTop4.y);
      ctx.closePath();
      ctx.fillStyle = isNightMode ? '#334155' : '#475569';
      ctx.fill();
      ctx.strokeStyle = '#64748b';
      ctx.stroke();

      // Yellow tactile edge safety strip
      const edgeA = toScreen(-platLength, platformY - 2, platHeight);
      const edgeB = toScreen(platLength, platformY - 2, platHeight);
      ctx.beginPath();
      ctx.moveTo(edgeA.x, edgeA.y);
      ctx.lineTo(edgeB.x, edgeB.y);
      ctx.strokeStyle = '#eab308'; // Amber-500
      ctx.lineWidth = 2 * zoom;
      ctx.stroke();

      // Station Canopy Shelters (Glass & Steel Arches)
      for (let canopyX = -200; canopyX <= 200; canopyX += 130) {
        const postBot = toScreen(canopyX, platformY - 25, platHeight);
        const postTop = toScreen(canopyX, platformY - 25, platHeight + 35);

        ctx.beginPath();
        ctx.moveTo(postBot.x, postBot.y);
        ctx.lineTo(postTop.x, postTop.y);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2.5 * zoom;
        ctx.stroke();

        // Canopy Roof
        const r1 = toScreen(canopyX - 45, platformY - platWidth - 5, platHeight + 38);
        const r2 = toScreen(canopyX + 45, platformY - platWidth - 5, platHeight + 38);
        const r3 = toScreen(canopyX + 45, platformY + 5, platHeight + 34);
        const r4 = toScreen(canopyX - 45, platformY + 5, platHeight + 34);

        ctx.beginPath();
        ctx.moveTo(r1.x, r1.y);
        ctx.lineTo(r2.x, r2.y);
        ctx.lineTo(r3.x, r3.y);
        ctx.lineTo(r4.x, r4.y);
        ctx.closePath();
        ctx.fillStyle = isNightMode ? 'rgba(56, 189, 248, 0.25)' : 'rgba(14, 165, 233, 0.4)';
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Station Enamel Signboard
      const signX = 0;
      const signY = platformY - 25;
      const sBot = toScreen(signX, signY, platHeight + 38);
      const sTop = toScreen(signX, signY, platHeight + 52);
      ctx.beginPath();
      ctx.moveTo(sBot.x, sBot.y);
      ctx.lineTo(sTop.x, sTop.y);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.stroke();

      const signBox1 = toScreen(signX - 45, signY, platHeight + 52);
      const signBox2 = toScreen(signX + 45, signY, platHeight + 52);
      const signBox3 = toScreen(signX + 45, signY, platHeight + 42);
      const signBox4 = toScreen(signX - 45, signY, platHeight + 42);

      ctx.beginPath();
      ctx.moveTo(signBox1.x, signBox1.y);
      ctx.lineTo(signBox2.x, signBox2.y);
      ctx.lineTo(signBox3.x, signBox3.y);
      ctx.lineTo(signBox4.x, signBox4.y);
      ctx.closePath();
      ctx.fillStyle = '#facc15'; // IR Classic Enamel Yellow
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Signboard text
      ctx.font = `bold ${Math.max(8, 9 * zoom)}px monospace`;
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      const signCenter = toScreen(signX, signY, platHeight + 48);
      ctx.fillText('BHOPAL JN', signCenter.x, signCenter.y);

      // -------------------------------------------------------------
      // 4. PARALLEL TRACKS DEFINITION
      // Track 1 (UP Main Line): y = -60
      // Track 2 (DOWN Main Line): y = 20
      // Track 3 (Loop Siding): y = 100
      // -------------------------------------------------------------
      const trackDefs = [
        { id: 1, name: 'Track 1 (UP Main)', y: -60, isMaintenance: false },
        { id: 2, name: 'Track 2 (DOWN Main)', y: 20, isMaintenance: true },
        { id: 3, name: 'Track 3 (Loop Siding)', y: 100, isMaintenance: false },
      ];

      trackDefs.forEach((trk) => {
        const trackY = trk.y;
        const trackStart = -350;
        const trackEnd = 350;
        const sleeperSpacing = 16;
        const railHalfGauge = 7;

        // Ballast bed polygon under the track
        const b1 = toScreen(trackStart, trackY - 14, 0);
        const b2 = toScreen(trackEnd, trackY - 14, 0);
        const b3 = toScreen(trackEnd, trackY + 14, 0);
        const b4 = toScreen(trackStart, trackY + 14, 0);

        ctx.beginPath();
        ctx.moveTo(b1.x, b1.y);
        ctx.lineTo(b2.x, b2.y);
        ctx.lineTo(b3.x, b3.y);
        ctx.lineTo(b4.x, b4.y);
        ctx.closePath();

        // Pulsing Neon Red on Track 2 when maintenance block is active
        if (trk.isMaintenance && isBlockActive) {
          ctx.fillStyle = `rgba(239, 68, 68, ${0.15 + 0.2 * pulseVal})`;
          ctx.fill();
          ctx.strokeStyle = `rgba(239, 68, 68, ${0.7 + 0.3 * pulseVal})`;
          ctx.lineWidth = 2 * zoom;
          ctx.stroke();
        } else {
          ctx.fillStyle = isNightMode ? '#1e293b' : '#334155';
          ctx.fill();
        }

        // Concrete Sleepers (Cross-ties)
        for (let sx = trackStart; sx <= trackEnd; sx += sleeperSpacing) {
          const s1 = toScreen(sx, trackY - 12, 1);
          const s2 = toScreen(sx, trackY + 12, 1);

          ctx.beginPath();
          ctx.moveTo(s1.x, s1.y);
          ctx.lineTo(s2.x, s2.y);
          ctx.strokeStyle = isNightMode ? '#475569' : '#64748b';
          ctx.lineWidth = 2.5 * zoom;
          ctx.stroke();
        }

        // Twin Parallel Steel Rails
        [-railHalfGauge, railHalfGauge].forEach((offsetY) => {
          const rStart = toScreen(trackStart, trackY + offsetY, 4);
          const rEnd = toScreen(trackEnd, trackY + offsetY, 4);

          ctx.beginPath();
          ctx.moveTo(rStart.x, rStart.y);
          ctx.lineTo(rEnd.x, rEnd.y);
          ctx.strokeStyle = trk.isMaintenance && isBlockActive ? '#f87171' : '#cbd5e1';
          ctx.lineWidth = 2 * zoom;
          ctx.stroke();
        });
      });

      // -------------------------------------------------------------
      // 5. TRACK 2 ACTIVE HAZARD LOCKOUT (Barriers & Cones)
      // -------------------------------------------------------------
      if (isBlockActive) {
        const hazardX = 0;
        const hazardY = 20;

        // Striped Hazard Barriers across Track 2
        for (let bx = -60; bx <= 60; bx += 40) {
          const bBase = toScreen(bx, hazardY - 14, 4);
          const bTop = toScreen(bx, hazardY + 14, 18);

          // Diagonal Hazard Tape Bar
          const h1 = toScreen(bx, hazardY - 14, 10);
          const h2 = toScreen(bx, hazardY + 14, 10);
          ctx.beginPath();
          ctx.moveTo(h1.x, h1.y);
          ctx.lineTo(h2.x, h2.y);
          ctx.strokeStyle = '#eab308'; // Amber
          ctx.lineWidth = 4 * zoom;
          ctx.stroke();

          // Barrier post
          ctx.beginPath();
          ctx.moveTo(bBase.x, bBase.y);
          ctx.lineTo(bTop.x, bTop.y);
          ctx.strokeStyle = '#ef4444'; // Red
          ctx.lineWidth = 2 * zoom;
          ctx.stroke();
        }

        // Floating Neon 3D Safety Hologram Tag
        const tagPos = toScreen(hazardX, hazardY, 36);
        ctx.font = `bold ${Math.max(9, 10 * zoom)}px monospace`;
        ctx.textAlign = 'center';

        // Background pill
        const text = '⛔ TRACK 2 UNDER MAINTENANCE BLOCK';
        const metrics = ctx.measureText(text);
        const pw = metrics.width + 16;
        const ph = 20;

        ctx.fillStyle = `rgba(153, 27, 27, ${0.85 + 0.15 * pulseVal})`;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(tagPos.x - pw / 2, tagPos.y - ph / 2, pw, ph, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, tagPos.x, tagPos.y + 4);
      }

      // -------------------------------------------------------------
      // 6. TRACK 3: Stationary Freight Rake (BOXN Coal Wagons)
      // -------------------------------------------------------------
      const freightY = 100;
      for (let wagonIdx = -2; wagonIdx <= 1; wagonIdx++) {
        const wx = wagonIdx * 80 + 30;
        const wLen = 70;
        const wWidth = 20;
        const wHeight = 18;

        // Wagon Body Bottom & Top
        const wb3 = toScreen(wx + wLen / 2, freightY + wWidth / 2, 6);
        const wb4 = toScreen(wx - wLen / 2, freightY + wWidth / 2, 6);

        const wt1 = toScreen(wx - wLen / 2, freightY - wWidth / 2, 6 + wHeight);
        const wt2 = toScreen(wx + wLen / 2, freightY - wWidth / 2, 6 + wHeight);
        const wt3 = toScreen(wx + wLen / 2, freightY + wWidth / 2, 6 + wHeight);
        const wt4 = toScreen(wx - wLen / 2, freightY + wWidth / 2, 6 + wHeight);

        // Wagon Front & Side Faces
        ctx.beginPath();
        ctx.moveTo(wb4.x, wb4.y);
        ctx.lineTo(wb3.x, wb3.y);
        ctx.lineTo(wt3.x, wt3.y);
        ctx.lineTo(wt4.x, wt4.y);
        ctx.closePath();
        ctx.fillStyle = '#78350f'; // Oxide red / Rust freight livery
        ctx.fill();
        ctx.strokeStyle = '#451a03';
        ctx.stroke();

        // Top Coal Surface
        ctx.beginPath();
        ctx.moveTo(wt1.x, wt1.y);
        ctx.lineTo(wt2.x, wt2.y);
        ctx.lineTo(wt3.x, wt3.y);
        ctx.lineTo(wt4.x, wt4.y);
        ctx.closePath();
        ctx.fillStyle = '#1c1917'; // Coal chunks
        ctx.fill();
        ctx.strokeStyle = '#44403c';
        ctx.stroke();
      }

      // -------------------------------------------------------------
      // 7. TRACK 1: Animated Vande Bharat Express (Blue/White Livery)
      // -------------------------------------------------------------
      const trainX = trainPosRef.current;
      const trainY = -60;
      const trainLength = 120;
      const trainWidth = 18;
      const trainHeight = 22;

      // 3D Coach Geometry
      const t1 = toScreen(trainX - trainLength / 2, trainY - trainWidth / 2, 6 + trainHeight);
      const t2 = toScreen(trainX + trainLength / 2, trainY - trainWidth / 2, 6 + trainHeight);
      const t3 = toScreen(trainX + trainLength / 2, trainY + trainWidth / 2, 6 + trainHeight);
      const t4 = toScreen(trainX - trainLength / 2, trainY + trainWidth / 2, 6 + trainHeight);

      const b3 = toScreen(trainX + trainLength / 2, trainY + trainWidth / 2, 6);
      const b4 = toScreen(trainX - trainLength / 2, trainY + trainWidth / 2, 6);

      // Side Wall (Facing Viewer)
      ctx.beginPath();
      ctx.moveTo(b4.x, b4.y);
      ctx.lineTo(b3.x, b3.y);
      ctx.lineTo(t3.x, t3.y);
      ctx.lineTo(t4.x, t4.y);
      ctx.closePath();
      ctx.fillStyle = '#f8fafc'; // Vande Bharat White
      ctx.fill();
      ctx.strokeStyle = '#0284c7'; // Blue stripe trim
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Signature Royal Blue Window Band
      const wSideB4 = toScreen(trainX - trainLength / 2 + 5, trainY + trainWidth / 2 + 0.2, 12);
      const wSideB3 = toScreen(trainX + trainLength / 2 - 10, trainY + trainWidth / 2 + 0.2, 12);
      const wSideT3 = toScreen(trainX + trainLength / 2 - 10, trainY + trainWidth / 2 + 0.2, 20);
      const wSideT4 = toScreen(trainX - trainLength / 2 + 5, trainY + trainWidth / 2 + 0.2, 20);

      ctx.beginPath();
      ctx.moveTo(wSideB4.x, wSideB4.y);
      ctx.lineTo(wSideB3.x, wSideB3.y);
      ctx.lineTo(wSideT3.x, wSideT3.y);
      ctx.lineTo(wSideT4.x, wSideT4.y);
      ctx.closePath();
      ctx.fillStyle = '#0369a1'; // Deep Vande Bharat Blue
      ctx.fill();

      // Illuminated warm coach passenger windows
      for (let wx = trainX - trainLength / 2 + 15; wx <= trainX + trainLength / 2 - 25; wx += 22) {
        const winP = toScreen(wx, trainY + trainWidth / 2 + 0.5, 14);
        ctx.fillStyle = '#fef08a'; // Warm interior glow
        ctx.fillRect(winP.x - 3 * zoom, winP.y - 4 * zoom, 7 * zoom, 5 * zoom);
      }

      // Aerodynamic Tapered Nose (Front Engine)
      const noseTip = toScreen(trainX + trainLength / 2 + 18, trainY, 9);
      ctx.beginPath();
      ctx.moveTo(b3.x, b3.y);
      ctx.lineTo(noseTip.x, noseTip.y);
      ctx.lineTo(t3.x, t3.y);
      ctx.closePath();
      ctx.fillStyle = '#0284c7';
      ctx.fill();

      // Roof Surface
      ctx.beginPath();
      ctx.moveTo(t1.x, t1.y);
      ctx.lineTo(t2.x, t2.y);
      ctx.lineTo(t3.x, t3.y);
      ctx.lineTo(t4.x, t4.y);
      ctx.closePath();
      ctx.fillStyle = '#e2e8f0';
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.stroke();

      // Diamond Roof Pantograph touching OHE wire
      const pantoBase = toScreen(trainX - 20, trainY, 6 + trainHeight);
      const pantoTop = toScreen(trainX - 10, trainY, 6 + trainHeight + 22);

      ctx.beginPath();
      ctx.moveTo(pantoBase.x, pantoBase.y);
      ctx.lineTo(pantoTop.x, pantoTop.y);
      ctx.strokeStyle = isPowerIsolated ? '#64748b' : '#38bdf8';
      ctx.lineWidth = 2 * zoom;
      ctx.stroke();

      // -------------------------------------------------------------
      // 8. OVERHEAD OHE TRACTION CANTILEVER GANTRIES & WIRES
      // -------------------------------------------------------------
      const oheMasts = [-240, -80, 80, 240];
      const wireHeight = 52;

      // Draw Gantries
      oheMasts.forEach((gx) => {
        const mastLeftBot = toScreen(gx, -100, 0);
        const mastLeftTop = toScreen(gx, -100, wireHeight + 12);

        const mastRightBot = toScreen(gx, 130, 0);
        const mastRightTop = toScreen(gx, 130, wireHeight + 12);

        // Left & Right Steel Lattice Columns
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2.5 * zoom;
        ctx.beginPath();
        ctx.moveTo(mastLeftBot.x, mastLeftBot.y);
        ctx.lineTo(mastLeftTop.x, mastLeftTop.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(mastRightBot.x, mastRightBot.y);
        ctx.lineTo(mastRightTop.x, mastRightTop.y);
        ctx.stroke();

        // Horizontal Bridge Beam Across All 3 Tracks
        ctx.beginPath();
        ctx.moveTo(mastLeftTop.x, mastLeftTop.y);
        ctx.lineTo(mastRightTop.x, mastRightTop.y);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3 * zoom;
        ctx.stroke();

        // Cantilever Insulators
        trackDefs.forEach((trk) => {
          const insulTop = toScreen(gx, trk.y, wireHeight + 12);
          const insulBot = toScreen(gx, trk.y, wireHeight);
          ctx.beginPath();
          ctx.moveTo(insulTop.x, insulTop.y);
          ctx.lineTo(insulBot.x, insulBot.y);
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 2 * zoom;
          ctx.stroke();
        });
      });

      // Longitudinal Overhead Wires (Catenary & Contact Cable)
      trackDefs.forEach((trk) => {
        const wStart = toScreen(-350, trk.y, wireHeight);
        const wEnd = toScreen(350, trk.y, wireHeight);

        ctx.beginPath();
        ctx.moveTo(wStart.x, wStart.y);
        ctx.lineTo(wEnd.x, wEnd.y);

        if (isPowerIsolated) {
          // Power Cut / Dead Grey Wire
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 1.5 * zoom;
        } else {
          // Energized 25kV Electric Cyan Glow
          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth = 2 * zoom;
          ctx.shadowColor = '#06b6d4';
          ctx.shadowBlur = 8;
        }
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset blur
      });

      // OHE Power Isolation Warning Tag
      if (isPowerIsolated) {
        const oheTagPos = toScreen(0, 20, wireHeight + 22);
        ctx.font = `bold ${Math.max(9, 10 * zoom)}px monospace`;
        ctx.textAlign = 'center';
        const text = '⚡ OHE 25kV POWER CUT / TRACTION ISOLATED';
        const pw = ctx.measureText(text).width + 16;
        const ph = 20;

        ctx.fillStyle = 'rgba(30, 41, 59, 0.95)';
        ctx.strokeStyle = '#f59e0b'; // Amber Warning
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(oheTagPos.x - pw / 2, oheTagPos.y - ph / 2, pw, ph, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fbbf24';
        ctx.fillText(text, oheTagPos.x, oheTagPos.y + 4);
      }

      // -------------------------------------------------------------
      // 9. MINIATURE 3D SIGNAL POSTS & ASPECT LIGHTS
      // -------------------------------------------------------------
      trackDefs.forEach((trk) => {
        const sigX = 140;
        const sigY = trk.y + 16;
        const sBase = toScreen(sigX, sigY, 0);
        const sHead = toScreen(sigX, sigY, 28);

        // Mast pole
        ctx.beginPath();
        ctx.moveTo(sBase.x, sBase.y);
        ctx.lineTo(sHead.x, sHead.y);
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2 * zoom;
        ctx.stroke();

        // Signal Head Box
        const isRed = trk.isMaintenance ? isBlockActive : false;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(sHead.x - 4 * zoom, sHead.y - 8 * zoom, 8 * zoom, 16 * zoom);

        // Aspect Lamp (Red or Green)
        ctx.beginPath();
        ctx.arc(sHead.x, sHead.y + (isRed ? -3 : 3) * zoom, 3.5 * zoom, 0, Math.PI * 2);
        ctx.fillStyle = isRed ? '#ef4444' : '#10b981';
        ctx.shadowColor = isRed ? '#ef4444' : '#10b981';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      ctx.restore();

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [
    isBlockActive,
    isPowerIsolated,
    isNightMode,
    isTrainMoving,
    zoom,
    rotationAngle,
    pan,
    projectIso,
  ]);

  // -------------------------------------------------------------
  // MOUSE & TOUCH INTERACTION (DRAG TO PAN, WHEEL TO ZOOM)
  // -------------------------------------------------------------
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom((prev) => Math.min(2.5, Math.max(0.5, prev * zoomFactor)));
  };

  const handleRotate = () => {
    setRotationAngle((prev) => (prev + 45) % 360);
  };

  const handleResetView = () => {
    setZoom(1.0);
    setRotationAngle(0);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="w-full max-w-5xl mx-auto font-sans text-slate-100">
      
      {/* Outer 3D Cockpit Window Frame */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900/95 backdrop-blur-md shadow-2xl shadow-black/70">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 bg-slate-950/80 px-5 py-3.5 gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Train className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold tracking-tight text-white font-mono">
                  3D ISOMETRIC STATION DIGITAL TWIN
                </h2>
                <span className="rounded bg-cyan-500/20 border border-cyan-500/40 px-1.5 py-0.5 text-[10px] font-mono text-cyan-300 font-semibold">
                  60 FPS CANVAS
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {selectedStation} • Interactive Block Lockout & Traction Simulation
              </p>
            </div>
          </div>

          {/* Real-time Status Badges */}
          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded border font-semibold ${
                isBlockActive
                  ? 'bg-red-950/60 border-red-500/50 text-red-300 animate-pulse'
                  : 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
              }`}
            >
              {isBlockActive ? <ShieldAlert className="w-3.5 h-3.5 text-red-400" /> : <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{isBlockActive ? 'BLOCK LOCKED' : 'ALL CLEAR'}</span>
            </span>

            <span
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded border ${
                isPowerIsolated
                  ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                  : 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300'
              }`}
            >
              {isPowerIsolated ? <ZapOff className="w-3.5 h-3.5 text-amber-400" /> : <Zap className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{isPowerIsolated ? '25kV POWER CUT' : 'OHE ENERGIZED'}</span>
            </span>
          </div>
        </div>

        {/* 3D Canvas Viewport */}
        <div className="relative w-full h-[480px] bg-slate-950 select-none overflow-hidden cursor-grab active:cursor-grabbing">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            className="w-full h-full block"
          />

          {/* Floating On-Canvas Camera HUD Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-1.5 bg-slate-900/80 backdrop-blur border border-slate-700/80 p-1.5 rounded-xl shadow-xl z-20">
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.min(2.5, prev * 1.15))}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.max(0.5, prev * 0.85))}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRotate}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Rotate 45°"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleResetView}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Reset Camera"
            >
              <Compass className="w-4 h-4" />
            </button>
          </div>

          {/* Track Legend Overlay */}
          <div className="absolute bottom-4 left-4 bg-slate-900/85 backdrop-blur border border-slate-700/80 p-3 rounded-xl shadow-xl z-20 space-y-1.5 text-[11px] font-mono">
            <div className="text-slate-400 font-bold uppercase text-[10px] mb-1">Station Tracks:</div>
            <div className="flex items-center gap-2 text-cyan-300">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span>Track 1: UP Main (Vande Bharat Corridor)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <span className={`w-2.5 h-2.5 rounded-full ${isBlockActive ? 'bg-red-500 animate-pulse' : 'bg-emerald-400'}`} />
              <span>Track 2: DOWN Main ({isBlockActive ? 'Active Maintenance Block' : 'Open'})</span>
            </div>
            <div className="flex items-center gap-2 text-amber-300">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Track 3: Loop Siding (Held Goods Train)</span>
            </div>
          </div>
        </div>

        {/* Interactive Simulation Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 bg-slate-950/90 p-4">
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Toggle 1: Maintenance Block Lockout */}
            <button
              type="button"
              onClick={() => setIsBlockActive((prev) => !prev)}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all duration-200 flex items-center gap-2 shadow-md cursor-pointer ${
                isBlockActive
                  ? 'bg-red-500 hover:bg-red-400 text-white shadow-red-950/60'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {isBlockActive ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4 text-emerald-400" />}
              <span>{isBlockActive ? 'Release Track 2 Block' : 'Grant Maintenance Block'}</span>
            </button>

            {/* Toggle 2: Cut OHE Traction Power */}
            <button
              type="button"
              onClick={() => setIsPowerIsolated((prev) => !prev)}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all duration-200 flex items-center gap-2 shadow-md cursor-pointer ${
                isPowerIsolated
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-950/60'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {isPowerIsolated ? <ZapOff className="w-4 h-4" /> : <Zap className="w-4 h-4 text-cyan-400" />}
              <span>{isPowerIsolated ? 'Restore 25kV OHE Power' : 'Cut OHE Traction Power'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Train Motion Toggle */}
            <button
              type="button"
              onClick={() => setIsTrainMoving((prev) => !prev)}
              className="px-3 py-2 rounded-xl text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Pause or Resume Train Movement"
            >
              {isTrainMoving ? <Pause className="w-3.5 h-3.5 text-cyan-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{isTrainMoving ? 'Pause Train' : 'Play Train'}</span>
            </button>

            {/* Day / Night Lighting Mode */}
            <button
              type="button"
              onClick={() => setIsNightMode((prev) => !prev)}
              className="px-3 py-2 rounded-xl text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Toggle Night or Twilight Lighting"
            >
              {isNightMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-cyan-300" />}
              <span>{isNightMode ? 'Day Mode' : 'Night Mode'}</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};

export default StationDigitalTwin3D;
