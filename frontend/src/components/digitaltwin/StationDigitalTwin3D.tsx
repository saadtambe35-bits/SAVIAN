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
      // 7. TRACK 1: Ultra-Realistic 3D Aerodynamic Vande Bharat Express
      // -------------------------------------------------------------
      const trainX = trainPosRef.current;
      const trainY = -60;
      const trainLength = 140;
      const trainWidth = 18;
      const trainHeight = 22;
      const halfL = trainLength / 2;
      const halfW = trainWidth / 2;
      const baseZ = 6;
      const topZ = baseZ + trainHeight;
      const frontX = trainX + halfL;
      const rearX = trainX - halfL;

      // 7.0 Ambient Ground Contact Shadow
      const sh1 = toScreen(rearX - 10, trainY - halfW - 2, 0.5);
      const sh2 = toScreen(frontX + 32, trainY - halfW - 2, 0.5);
      const sh3 = toScreen(frontX + 32, trainY + halfW + 6, 0.5);
      const sh4 = toScreen(rearX - 10, trainY + halfW + 6, 0.5);

      ctx.beginPath();
      ctx.moveTo(sh1.x, sh1.y);
      ctx.lineTo(sh2.x, sh2.y);
      ctx.lineTo(sh3.x, sh3.y);
      ctx.lineTo(sh4.x, sh4.y);
      ctx.closePath();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fill();

      // 7.1 Volumetric Headlight Forward Projection Beam (Track Illumination)
      const beamOrigin = toScreen(frontX + 26, trainY, 9);
      const beamL1 = toScreen(frontX + 110, trainY - 24, 0);
      const beamL2 = toScreen(frontX + 110, trainY + 24, 0);
      const beamGrad = ctx.createLinearGradient(beamOrigin.x, beamOrigin.y, (beamL1.x + beamL2.x) / 2, (beamL1.y + beamL2.y) / 2);
      beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
      beamGrad.addColorStop(0.3, 'rgba(253, 224, 71, 0.20)');
      beamGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');

      ctx.beginPath();
      ctx.moveTo(beamOrigin.x, beamOrigin.y);
      ctx.lineTo(beamL1.x, beamL1.y);
      ctx.lineTo(beamL2.x, beamL2.y);
      ctx.closePath();
      ctx.fillStyle = beamGrad;
      ctx.fill();

      // 7.2 Undercarriage Skirt & Bogies
      const skBotRear = toScreen(rearX, trainY + halfW, 2);
      const skBotFront = toScreen(frontX - 2, trainY + halfW, 2);
      const skTopFront = toScreen(frontX - 2, trainY + halfW, baseZ);
      const skTopRear = toScreen(rearX, trainY + halfW, baseZ);

      ctx.beginPath();
      ctx.moveTo(skBotRear.x, skBotRear.y);
      ctx.lineTo(skBotFront.x, skBotFront.y);
      ctx.lineTo(skTopFront.x, skTopFront.y);
      ctx.lineTo(skTopRear.x, skTopRear.y);
      ctx.closePath();
      ctx.fillStyle = '#0f172a'; // Deep Chassis Shadow
      ctx.fill();

      // 4 Bogie Wheelsets
      const wheelOffsets = [rearX + 18, rearX + 34, frontX - 34, frontX - 18];
      wheelOffsets.forEach((wx) => {
        const wCenter = toScreen(wx, trainY + halfW - 1, 3.5);
        ctx.beginPath();
        ctx.arc(wCenter.x, wCenter.y, 4.5 * zoom, 0, Math.PI * 2);
        ctx.fillStyle = '#334155';
        ctx.fill();
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1 * zoom;
        ctx.stroke();

        // Inner metallic hub
        ctx.beginPath();
        ctx.arc(wCenter.x, wCenter.y, 2 * zoom, 0, Math.PI * 2);
        ctx.fillStyle = '#cbd5e1';
        ctx.fill();
      });

      // 7.3 Main Coach Body Points
      const r1 = toScreen(rearX, trainY - halfW, topZ); // Rear Left
      const r2 = toScreen(frontX, trainY - halfW, topZ); // Front Left
      const r3 = toScreen(frontX, trainY + halfW, topZ); // Front Right
      const r4 = toScreen(rearX, trainY + halfW, topZ); // Rear Right

      const b1 = toScreen(rearX, trainY - halfW, baseZ);
      const b2 = toScreen(frontX, trainY - halfW, baseZ);
      const b3 = toScreen(frontX, trainY + halfW, baseZ);
      const b4 = toScreen(rearX, trainY + halfW, baseZ);

      // 7.4 Rear Cab Face
      ctx.beginPath();
      ctx.moveTo(b1.x, b1.y);
      ctx.lineTo(b4.x, b4.y);
      ctx.lineTo(r4.x, r4.y);
      ctx.lineTo(r1.x, r1.y);
      ctx.closePath();
      ctx.fillStyle = '#cbd5e1'; // Slightly shaded rear
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.stroke();

      // Rear Red Tail Lights (Twin Markers)
      const tailL = toScreen(rearX - 0.5, trainY - 4, baseZ + 6);
      const tailR = toScreen(rearX - 0.5, trainY + 4, baseZ + 6);
      [tailL, tailR].forEach((tl) => {
        ctx.beginPath();
        ctx.arc(tl.x, tl.y, 2 * zoom, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 7.5 Main Side Wall (Facing Viewer)
      ctx.beginPath();
      ctx.moveTo(b4.x, b4.y);
      ctx.lineTo(b3.x, b3.y);
      ctx.lineTo(r3.x, r3.y);
      ctx.lineTo(r4.x, r4.y);
      ctx.closePath();
      const sideGrad = ctx.createLinearGradient(b4.x, b4.y, r4.x, r4.y);
      sideGrad.addColorStop(0, '#f1f5f9');
      sideGrad.addColorStop(0.5, '#ffffff');
      sideGrad.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = sideGrad;
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 7.6 Signature Vande Bharat Blue Ribbon Band
      const bandZ_Bot = baseZ + 5;
      const bandZ_Top = baseZ + 15;
      const ribbonB4 = toScreen(rearX + 4, trainY + halfW + 0.15, bandZ_Bot);
      const ribbonB3 = toScreen(frontX, trainY + halfW + 0.15, bandZ_Bot);
      const ribbonT3 = toScreen(frontX, trainY + halfW + 0.15, bandZ_Top);
      const ribbonT4 = toScreen(rearX + 4, trainY + halfW + 0.15, bandZ_Top);

      ctx.beginPath();
      ctx.moveTo(ribbonB4.x, ribbonB4.y);
      ctx.lineTo(ribbonB3.x, ribbonB3.y);
      ctx.lineTo(ribbonT3.x, ribbonT3.y);
      ctx.lineTo(ribbonT4.x, ribbonT4.y);
      ctx.closePath();
      ctx.fillStyle = '#0f3a6e'; // Vande Bharat Navy Blue
      ctx.fill();

      // Dynamic Golden-Orange Accent Pinstripe along lower skirt
      const pinB4 = toScreen(rearX + 2, trainY + halfW + 0.2, baseZ + 3.8);
      const pinB3 = toScreen(frontX + 12, trainY + halfW + 0.2, baseZ + 3.8);
      ctx.beginPath();
      ctx.moveTo(pinB4.x, pinB4.y);
      ctx.lineTo(pinB3.x, pinB3.y);
      ctx.strokeStyle = '#f97316'; // Indian Railways Saffron / Gold accent
      ctx.lineWidth = 1.6 * zoom;
      ctx.stroke();

      // 7.7 True Isometric Passenger Windows with Soft Interior Lighting
      const numWindows = 6;
      const winSpacing = (trainLength - 36) / numWindows;
      for (let i = 0; i < numWindows; i++) {
        const wx1 = rearX + 14 + i * winSpacing;
        const wx2 = wx1 + winSpacing - 4;

        const wp1 = toScreen(wx1, trainY + halfW + 0.2, bandZ_Bot + 2);
        const wp2 = toScreen(wx2, trainY + halfW + 0.2, bandZ_Bot + 2);
        const wp3 = toScreen(wx2, trainY + halfW + 0.2, bandZ_Top - 2);
        const wp4 = toScreen(wx1, trainY + halfW + 0.2, bandZ_Top - 2);

        // Window Frame
        ctx.beginPath();
        ctx.moveTo(wp1.x, wp1.y);
        ctx.lineTo(wp2.x, wp2.y);
        ctx.lineTo(wp3.x, wp3.y);
        ctx.lineTo(wp4.x, wp4.y);
        ctx.closePath();

        // Warm internal cabin lighting
        ctx.fillStyle = isNightMode ? '#fef08a' : '#fef9c3';
        ctx.shadowColor = 'rgba(254, 240, 138, 0.4)';
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Window Glass reflection gloss
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Subtle seated passenger silhouette
        const pHead = toScreen((wx1 + wx2) / 2, trainY + halfW + 0.25, bandZ_Bot + 4.5);
        ctx.beginPath();
        ctx.arc(pHead.x, pHead.y, 1.6 * zoom, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
        ctx.fill();
      }

      // 7.8 Aerodynamic 3D Bullet Nose Cone (Vande Bharat 2.0 Facets)
      const noseTipLow = toScreen(frontX + 28, trainY, baseZ + 2); // Bottom Cowcatcher Tip
      const noseTipMid = toScreen(frontX + 26, trainY, baseZ + 8); // Central Nose Point
      const noseTipTop = toScreen(frontX + 16, trainY, baseZ + 16); // Windshield Base
      const noseRoofPeak = toScreen(frontX + 6, trainY, topZ); // Roof Blending Point

      const noseSideMid = toScreen(frontX + 10, trainY + halfW, baseZ + 8);
      const noseSideLow = toScreen(frontX + 8, trainY + halfW, baseZ + 2);

      // Facet A: Lower Cowcatcher Wedge (Facing Viewer)
      ctx.beginPath();
      ctx.moveTo(b3.x, b3.y);
      ctx.lineTo(noseSideLow.x, noseSideLow.y);
      ctx.lineTo(noseTipLow.x, noseTipLow.y);
      ctx.lineTo(noseTipMid.x, noseTipMid.y);
      ctx.lineTo(noseSideMid.x, noseSideMid.y);
      ctx.closePath();
      ctx.fillStyle = '#0284c7'; // Bold Vande Bharat Blue
      ctx.fill();
      ctx.strokeStyle = '#0369a1';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Facet B: Mid Cab Side Wrap
      ctx.beginPath();
      ctx.moveTo(noseSideMid.x, noseSideMid.y);
      ctx.lineTo(noseTipMid.x, noseTipMid.y);
      ctx.lineTo(noseTipTop.x, noseTipTop.y);
      ctx.lineTo(r3.x, r3.y);
      ctx.closePath();
      ctx.fillStyle = '#f8fafc'; // White Aerodynamic Cheek
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.stroke();

      // Facet C: High-Raked Tinted Cockpit Windshield (Driver's Glass)
      const windLeft = toScreen(frontX + 4, trainY - halfW + 3, baseZ + 19);
      const windRight = toScreen(frontX + 4, trainY + halfW - 2, baseZ + 19);
      ctx.beginPath();
      ctx.moveTo(noseTipTop.x, noseTipTop.y);
      ctx.lineTo(windRight.x, windRight.y);
      ctx.lineTo(noseRoofPeak.x, noseRoofPeak.y);
      ctx.lineTo(windLeft.x, windLeft.y);
      ctx.closePath();
      ctx.fillStyle = '#0f172a'; // Smoked Obsidian Windshield Glass
      ctx.fill();
      ctx.strokeStyle = '#38bdf8'; // Blue glass seal
      ctx.lineWidth = 1;
      ctx.stroke();

      // Windshield Specular Sky Glint
      ctx.beginPath();
      ctx.moveTo(noseTipTop.x, noseTipTop.y);
      ctx.lineTo(windRight.x, windRight.y);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1.2 * zoom;
      ctx.stroke();

      // Twin High-Intensity LED Headlights on the Nose
      const hlLeft = toScreen(frontX + 24, trainY - 3, baseZ + 7.5);
      const hlRight = toScreen(frontX + 24, trainY + 3, baseZ + 7.5);
      [hlLeft, hlRight].forEach((hl) => {
        ctx.beginPath();
        ctx.arc(hl.x, hl.y, 2.5 * zoom, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#fef08a';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 7.9 3D Contoured Roof Surface with Equipment & AC Housing
      ctx.beginPath();
      ctx.moveTo(r1.x, r1.y);
      ctx.lineTo(r2.x, r2.y);
      ctx.lineTo(noseRoofPeak.x, noseRoofPeak.y);
      ctx.lineTo(r3.x, r3.y);
      ctx.lineTo(r4.x, r4.y);
      ctx.closePath();
      const roofGrad = ctx.createLinearGradient(r1.x, r1.y, r3.x, r3.y);
      roofGrad.addColorStop(0, '#f8fafc');
      roofGrad.addColorStop(0.5, '#e2e8f0');
      roofGrad.addColorStop(1, '#cbd5e1');
      ctx.fillStyle = roofGrad;
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.stroke();

      // AC Ventilation Unit Housing on Roof
      const acX1 = rearX + 40;
      const acX2 = rearX + 90;
      const ac1 = toScreen(acX1, trainY - 5, topZ + 0.2);
      const ac2 = toScreen(acX2, trainY - 5, topZ + 0.2);
      const ac3 = toScreen(acX2, trainY + 5, topZ + 0.2);
      const ac4 = toScreen(acX1, trainY + 5, topZ + 0.2);
      const acTop3 = toScreen(acX2, trainY + 5, topZ + 3);
      const acTop4 = toScreen(acX1, trainY + 5, topZ + 3);

      ctx.beginPath();
      ctx.moveTo(ac4.x, ac4.y);
      ctx.lineTo(ac3.x, ac3.y);
      ctx.lineTo(acTop3.x, acTop3.y);
      ctx.lineTo(acTop4.x, acTop4.y);
      ctx.closePath();
      ctx.fillStyle = '#94a3b8';
      ctx.fill();

      // 7.10 Articulated Diamond Pantograph Assembly (Touching 25kV OHE Wire)
      const wireHeight = 52;
      const pBase = toScreen(rearX + 25, trainY, topZ);
      const pKnee1 = toScreen(rearX + 30, trainY, topZ + 12);
      const pKnee2 = toScreen(rearX + 20, trainY, topZ + 18);
      const pHead = toScreen(rearX + 26, trainY, wireHeight);

      // Red/Terracotta Insulator Boots
      const ins1 = toScreen(rearX + 22, trainY - 3, topZ + 1.5);
      const ins2 = toScreen(rearX + 28, trainY + 3, topZ + 1.5);
      [ins1, ins2].forEach((ip) => {
        ctx.beginPath();
        ctx.arc(ip.x, ip.y, 2 * zoom, 0, Math.PI * 2);
        ctx.fillStyle = '#b45309'; // Terracotta
        ctx.fill();
      });

      // Pantograph Arms
      ctx.beginPath();
      ctx.moveTo(pBase.x, pBase.y);
      ctx.lineTo(pKnee1.x, pKnee1.y);
      ctx.lineTo(pKnee2.x, pKnee2.y);
      ctx.lineTo(pHead.x, pHead.y);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2 * zoom;
      ctx.stroke();

      // Contact Head Skid
      const pBarL = toScreen(rearX + 26, trainY - 8, wireHeight);
      const pBarR = toScreen(rearX + 26, trainY + 8, wireHeight);
      ctx.beginPath();
      ctx.moveTo(pBarL.x, pBarL.y);
      ctx.lineTo(pBarR.x, pBarR.y);
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2.5 * zoom;
      ctx.stroke();

      // 25kV Electric Spark / Contact Glow on Wire
      if (!isPowerIsolated) {
        ctx.beginPath();
        ctx.arc(pHead.x, pHead.y, 3 * zoom, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // -------------------------------------------------------------
      // 8. OVERHEAD OHE TRACTION CANTILEVER GANTRIES & WIRES
      // -------------------------------------------------------------
      const oheMasts = [-240, -80, 80, 240];

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
