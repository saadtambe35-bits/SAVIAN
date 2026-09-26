import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MapControls } from 'three/addons/controls/MapControls.js';
import {
  Train,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  Compass,
  Maximize2,
  Minimize2,
  Wrench,
  AlertTriangle,
  Radio,
  Plus,
  Trash2,
  Activity,
  Info,
  Navigation,
  ArrowRight,
  ArrowLeftRight,
  Sparkles,
  X,
  Gauge,
  CheckCircle2,
} from 'lucide-react';

/**
 * LINE CLEAR (SAVIAN) - Indian Railways AI Operations Cockpit
 * StationDigitalTwin3D.tsx: Production-Grade 5-Track Digital Twin
 * 
 * Major Features Implemented:
 * 1. UNIVERSAL DOUBLE SCISSORS CROSSOVER LADDER:
 *    - Throat ladders at West Throat, Station Central, and East Throat
 *    - Full any-to-any track connectivity (Track 1 ↔ 2 ↔ 3 ↔ 4 ↔ 5 in BOTH Eastbound & Westbound)
 * 2. TRAIN DISPATCHER (ADD TRAIN WITH ORIGIN & DESTINATION):
 *    - Modal with 6 Indian Railways presets (Vande Bharat, Rajdhani, Shatabdi, Tejas, Freight, Amrit Bharat)
 *    - Choose travel direction, origin track (T1-T5), and destination track (T1-T5)
 *    - Dijkstra routes train from origin track across turnouts to destination track!
 * 3. DYNAMIC ON-THE-FLY TRACK CHANGING:
 *    - Live quick-switch buttons [T1] [T2] [T3] [T4] [T5] on each active train card
 *    - Recalculates route at next upcoming switch and steers train across ladder crossovers to chosen track!
 * 4. TRAIN DESPAWNING / DELETION:
 *    - One-click deletion of any train from active fleet with complete Three.js mesh & sprite cleanup
 * 5. CAMERA FOCUS & RECENTER:
 *    - Smooth follow/focus on any train, plus camera pan boundary clamping and recenter tween
 */

export interface StationDigitalTwin3DProps {
  isBlockActive?: boolean;
  isPowerIsolated?: boolean;
  selectedStation?: string;
}

export type MaintenanceType = 'P-WAY' | 'OHE' | 'S-T';

// Blockable Maintenance Zones (Only 3 zones: West Throat, Station Central, East Throat)
export type SegmentZoneId =
  | 'WEST_THROAT'
  | 'STATION_CENTRAL'
  | 'EAST_THROAT';

// Physical Corridor Segments across the 5000-unit yard (-2500 to +2500)
export type CorridorZoneId =
  | 'WEST_APPROACH'
  | 'WEST_THROAT'
  | 'STATION_CENTRAL'
  | 'EAST_THROAT'
  | 'EAST_DEPARTURE';

export interface TrackDef {
  id: number;
  name: string;
  z: number;
  speedLimit: number;
  role: 'UP_LOOP' | 'UP_MAIN' | 'DOWN_MAIN' | 'DOWN_LOOP' | 'SIDING';
  platform?: string;
}

export interface ZoneDef {
  id: SegmentZoneId;
  name: string;
  startX: number;
  endX: number;
  centerX: number;
}

export interface CorridorSegmentDef {
  id: CorridorZoneId;
  name: string;
  startX: number;
  endX: number;
  centerX: number;
}

export interface ActiveBlock {
  trackId: number;
  zoneId: SegmentZoneId;
  type: MaintenanceType;
  timestamp: string;
}

// 5 Parallel Tracks Configuration (20-unit lateral gauge)
export const TRACKS: TrackDef[] = [
  { id: 1, name: 'Track 1 (Up Loop)', z: -40, speedLimit: 50, role: 'UP_LOOP', platform: 'Platform 1' },
  { id: 2, name: 'Track 2 (Up Main)', z: -20, speedLimit: 130, role: 'UP_MAIN' },
  { id: 3, name: 'Track 3 (Down Main)', z: 0, speedLimit: 130, role: 'DOWN_MAIN' },
  { id: 4, name: 'Track 4 (Down Loop)', z: 20, speedLimit: 50, role: 'DOWN_LOOP', platform: 'Platform 2' },
  { id: 5, name: 'Track 5 (Goods Siding)', z: 40, speedLimit: 40, role: 'SIDING' },
];

// 3 Logical Block Zones (West Outer and East Outer removed per user specification)
export const ZONES: ZoneDef[] = [
  { id: 'WEST_THROAT', name: 'West Throat', startX: -1500, endX: -500, centerX: -1000 },
  { id: 'STATION_CENTRAL', name: 'Station Central', startX: -500, endX: 500, centerX: 0 },
  { id: 'EAST_THROAT', name: 'East Throat', startX: 500, endX: 1500, centerX: 1000 },
];

// Physical Corridor Segments across the entire 5000-unit yard (-2500 to +2500)
export const CORRIDOR_SEGMENTS: CorridorSegmentDef[] = [
  { id: 'WEST_APPROACH', name: 'West Approach', startX: -2500, endX: -1500, centerX: -2000 },
  { id: 'WEST_THROAT', name: 'West Throat', startX: -1500, endX: -500, centerX: -1000 },
  { id: 'STATION_CENTRAL', name: 'Station Central', startX: -500, endX: 500, centerX: 0 },
  { id: 'EAST_THROAT', name: 'East Throat', startX: 500, endX: 1500, centerX: 1000 },
  { id: 'EAST_DEPARTURE', name: 'East Approach', startX: 1500, endX: 2500, centerX: 2000 },
];

// Train Presets with authentic Indian Railways liveries & speed profiles
export interface TrainPreset {
  id: string;
  name: string;
  serviceType: string;
  primaryColorHex: number;
  accentColorHex: number;
  speed: number; // units per frame (~55 km/h per unit)
  defaultDirection: 1 | -1;
  badgeBg: string;
}

export const TRAIN_PRESETS: TrainPreset[] = [
  {
    id: 'VANDE_BHARAT',
    name: '20901 Vande Bharat Express',
    serviceType: 'Semi-High Speed EMU',
    primaryColorHex: 0xffffff,
    accentColorHex: 0x0284c7,
    speed: 2.3, // ~130 km/h
    defaultDirection: 1,
    badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  },
  {
    id: 'RAJDHANI',
    name: '12951 Mumbai Rajdhani Express',
    serviceType: 'Superfast Express',
    primaryColorHex: 0x991b1b,
    accentColorHex: 0xfacc15,
    speed: 1.8, // ~100 km/h
    defaultDirection: -1,
    badgeBg: 'bg-red-500/20 text-red-300 border-red-500/40',
  },
  {
    id: 'SHATABDI',
    name: '12002 Bhopal Shatabdi Express',
    serviceType: 'Intercity Express',
    primaryColorHex: 0x1e3a8a,
    accentColorHex: 0x38bdf8,
    speed: 2.0, // ~110 km/h
    defaultDirection: 1,
    badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  },
  {
    id: 'TEJAS',
    name: '22692 Tejas Superfast Express',
    serviceType: 'Corporate Luxury Superfast',
    primaryColorHex: 0xd97706,
    accentColorHex: 0xfef08a,
    speed: 2.1, // ~115 km/h
    defaultDirection: 1,
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  {
    id: 'WAG12_FREIGHT',
    name: 'WAG-12 Heavy Freight #60021',
    serviceType: '12000 HP Dedicated Freight',
    primaryColorHex: 0x14532d,
    accentColorHex: 0xeab308,
    speed: 1.1, // ~60 km/h
    defaultDirection: -1,
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  },
  {
    id: 'AMRIT_BHARAT',
    name: '15557 Amrit Bharat Express',
    serviceType: 'Push-Pull Non-AC Superfast',
    primaryColorHex: 0xc2410c,
    accentColorHex: 0x94a3b8,
    speed: 1.6, // ~90 km/h
    defaultDirection: -1,
    badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  },
];

// Determine track ID from Z coordinate
const getTrackIdFromZ = (z: number): number => {
  let closestId = 1;
  let minDist = Infinity;
  TRACKS.forEach((t) => {
    const dist = Math.abs(t.z - z);
    if (dist < minDist) {
      minDist = dist;
      closestId = t.id;
    }
  });
  return closestId;
};

// Determine zone ID from X coordinate
const getZoneIdFromX = (x: number): CorridorZoneId => {
  if (x >= -1500 && x < -500) return 'WEST_THROAT';
  if (x >= -500 && x <= 500) return 'STATION_CENTRAL';
  if (x > 500 && x <= 1500) return 'EAST_THROAT';
  if (x < -1500) return 'WEST_APPROACH';
  return 'EAST_DEPARTURE';
};

// -------------------------------------------------------------
// UNIVERSAL DOUBLE SCISSORS CROSSOVER LADDER NETWORK
// Relocated BEFORE the throat on BOTH sides (West: -2100 to -1500, East: 1500 to 2100)
// Enables ANY track (1-5) to switch to ANY other track BEFORE entering the throat!
// -------------------------------------------------------------
export interface CrossoverLink {
  id: string;
  name: string;
  zone: CorridorZoneId;
  t1: number;
  t2: number;
  x1: number;
  x2: number;
}

export const ALL_CROSSOVER_LINKS: CrossoverLink[] = [
  // 1. WEST ADVANCE LADDER - BEFORE WEST THROAT (x: -2100 to -1500)
  // Step 1 (-2100 to -1950): Outer tracks 1 <-> 2 and 5 <-> 4
  { id: 'W_1_2', name: 'West Turnout T1-T2', zone: 'WEST_APPROACH', t1: 1, t2: 2, x1: -2100, x2: -1950 },
  { id: 'W_2_1', name: 'West Turnout T2-T1', zone: 'WEST_APPROACH', t1: 2, t2: 1, x1: -2100, x2: -1950 },
  { id: 'W_5_4', name: 'West Turnout T5-T4', zone: 'WEST_APPROACH', t1: 5, t2: 4, x1: -2100, x2: -1950 },
  { id: 'W_4_5', name: 'West Turnout T4-T5', zone: 'WEST_APPROACH', t1: 4, t2: 5, x1: -2100, x2: -1950 },

  // Step 2 (-1950 to -1800): Main tracks 2 <-> 3 and 4 <-> 3
  { id: 'W_2_3', name: 'West Turnout T2-T3', zone: 'WEST_APPROACH', t1: 2, t2: 3, x1: -1950, x2: -1800 },
  { id: 'W_3_2', name: 'West Turnout T3-T2', zone: 'WEST_APPROACH', t1: 3, t2: 2, x1: -1950, x2: -1800 },
  { id: 'W_4_3', name: 'West Turnout T4-T3', zone: 'WEST_APPROACH', t1: 4, t2: 3, x1: -1950, x2: -1800 },
  { id: 'W_3_4', name: 'West Turnout T3-T4', zone: 'WEST_APPROACH', t1: 3, t2: 4, x1: -1950, x2: -1800 },

  // Step 3 (-1800 to -1650): Symmetrical crossover layer
  { id: 'W_3_2_B', name: 'West Turnout T3-T2 B', zone: 'WEST_APPROACH', t1: 3, t2: 2, x1: -1800, x2: -1650 },
  { id: 'W_2_3_B', name: 'West Turnout T2-T3 B', zone: 'WEST_APPROACH', t1: 2, t2: 3, x1: -1800, x2: -1650 },
  { id: 'W_3_4_B', name: 'West Turnout T3-T4 B', zone: 'WEST_APPROACH', t1: 3, t2: 4, x1: -1800, x2: -1650 },
  { id: 'W_4_3_B', name: 'West Turnout T4-T3 B', zone: 'WEST_APPROACH', t1: 4, t2: 3, x1: -1800, x2: -1650 },

  // Step 4 (-1650 to -1500): Outermost track feeds before West Throat begins
  { id: 'W_2_1_B', name: 'West Turnout T2-T1 B', zone: 'WEST_APPROACH', t1: 2, t2: 1, x1: -1650, x2: -1500 },
  { id: 'W_1_2_B', name: 'West Turnout T1-T2 B', zone: 'WEST_APPROACH', t1: 1, t2: 2, x1: -1650, x2: -1500 },
  { id: 'W_4_5_B', name: 'West Turnout T4-T5 B', zone: 'WEST_APPROACH', t1: 4, t2: 5, x1: -1650, x2: -1500 },
  { id: 'W_5_4_B', name: 'West Turnout T5-T4 B', zone: 'WEST_APPROACH', t1: 5, t2: 4, x1: -1650, x2: -1500 },

  // 2. STATION CENTRAL SCISSORS (x: -200 to 200)
  // Enables mid-yard track shifting directly between platforms!
  { id: 'C_1_2', name: 'Station Central T1-T2', zone: 'STATION_CENTRAL', t1: 1, t2: 2, x1: -200, x2: -50 },
  { id: 'C_2_1', name: 'Station Central T2-T1', zone: 'STATION_CENTRAL', t1: 2, t2: 1, x1: -200, x2: -50 },
  { id: 'C_4_5', name: 'Station Central T4-T5', zone: 'STATION_CENTRAL', t1: 4, t2: 5, x1: -200, x2: -50 },
  { id: 'C_5_4', name: 'Station Central T5-T4', zone: 'STATION_CENTRAL', t1: 5, t2: 4, x1: -200, x2: -50 },
  { id: 'C_2_3', name: 'Station Central T2-T3', zone: 'STATION_CENTRAL', t1: 2, t2: 3, x1: -200, x2: -50 },
  { id: 'C_3_2', name: 'Station Central T3-T2', zone: 'STATION_CENTRAL', t1: 3, t2: 2, x1: -200, x2: -50 },
  { id: 'C_3_4', name: 'Station Central T3-T4', zone: 'STATION_CENTRAL', t1: 3, t2: 4, x1: -200, x2: -50 },
  { id: 'C_4_3', name: 'Station Central T4-T3', zone: 'STATION_CENTRAL', t1: 4, t2: 3, x1: -200, x2: -50 },

  { id: 'C_1_2_B', name: 'Station Central T1-T2 B', zone: 'STATION_CENTRAL', t1: 1, t2: 2, x1: 50, x2: 200 },
  { id: 'C_2_1_B', name: 'Station Central T2-T1 B', zone: 'STATION_CENTRAL', t1: 2, t2: 1, x1: 50, x2: 200 },
  { id: 'C_4_5_B', name: 'Station Central T4-T5 B', zone: 'STATION_CENTRAL', t1: 4, t2: 5, x1: 50, x2: 200 },
  { id: 'C_5_4_B', name: 'Station Central T5-T4 B', zone: 'STATION_CENTRAL', t1: 5, t2: 4, x1: 50, x2: 200 },
  { id: 'C_2_3_B', name: 'Station Central T2-T3 B', zone: 'STATION_CENTRAL', t1: 2, t2: 3, x1: 50, x2: 200 },
  { id: 'C_3_2_B', name: 'Station Central T3-T2 B', zone: 'STATION_CENTRAL', t1: 3, t2: 2, x1: 50, x2: 200 },
  { id: 'C_3_4_B', name: 'Station Central T3-T4 B', zone: 'STATION_CENTRAL', t1: 3, t2: 4, x1: 50, x2: 200 },
  { id: 'C_4_3_B', name: 'Station Central T4-T3 B', zone: 'STATION_CENTRAL', t1: 4, t2: 3, x1: 50, x2: 200 },

  // 3. EAST ADVANCE LADDER - BEFORE EAST THROAT (x: 1500 to 2100)
  // For Westbound traffic approaching from +2500, switches happen before entering East Throat (1500 to 500)
  // Step 1 (1500 to 1650): Outer tracks 1 <-> 2 and 5 <-> 4
  { id: 'E_1_2', name: 'East Turnout T1-T2', zone: 'EAST_DEPARTURE', t1: 1, t2: 2, x1: 1500, x2: 1650 },
  { id: 'E_2_1', name: 'East Turnout T2-T1', zone: 'EAST_DEPARTURE', t1: 2, t2: 1, x1: 1500, x2: 1650 },
  { id: 'E_5_4', name: 'East Turnout T5-T4', zone: 'EAST_DEPARTURE', t1: 5, t2: 4, x1: 1500, x2: 1650 },
  { id: 'E_4_5', name: 'East Turnout T4-T5', zone: 'EAST_DEPARTURE', t1: 4, t2: 5, x1: 1500, x2: 1650 },

  // Step 2 (1650 to 1800): Main tracks 2 <-> 3 and 4 <-> 3
  { id: 'E_2_3', name: 'East Turnout T2-T3', zone: 'EAST_DEPARTURE', t1: 2, t2: 3, x1: 1650, x2: 1800 },
  { id: 'E_3_2', name: 'East Turnout T3-T2', zone: 'EAST_DEPARTURE', t1: 3, t2: 2, x1: 1650, x2: 1800 },
  { id: 'E_4_3', name: 'East Turnout T4-T3', zone: 'EAST_DEPARTURE', t1: 4, t2: 3, x1: 1650, x2: 1800 },
  { id: 'E_3_4', name: 'East Turnout T3-T4', zone: 'EAST_DEPARTURE', t1: 3, t2: 4, x1: 1650, x2: 1800 },

  // Step 3 (1800 to 1950): Symmetrical crossover layer
  { id: 'E_3_2_B', name: 'East Turnout T3-T2 B', zone: 'EAST_DEPARTURE', t1: 3, t2: 2, x1: 1800, x2: 1950 },
  { id: 'E_2_3_B', name: 'East Turnout T2-T3 B', zone: 'EAST_DEPARTURE', t1: 2, t2: 3, x1: 1800, x2: 1950 },
  { id: 'E_3_4_B', name: 'East Turnout T3-T4 B', zone: 'EAST_DEPARTURE', t1: 3, t2: 4, x1: 1800, x2: 1950 },
  { id: 'E_4_3_B', name: 'East Turnout T4-T3 B', zone: 'EAST_DEPARTURE', t1: 4, t2: 3, x1: 1800, x2: 1950 },

  // Step 4 (1950 to 2100): Outer feeds
  { id: 'E_2_1_B', name: 'East Turnout T2-T1 B', zone: 'EAST_DEPARTURE', t1: 2, t2: 1, x1: 1950, x2: 2100 },
  { id: 'E_1_2_B', name: 'East Turnout T1-T2 B', zone: 'EAST_DEPARTURE', t1: 1, t2: 2, x1: 1950, x2: 2100 },
  { id: 'E_4_5_B', name: 'East Turnout T4-T5 B', zone: 'EAST_DEPARTURE', t1: 4, t2: 5, x1: 1950, x2: 2100 },
  { id: 'E_5_4_B', name: 'East Turnout T5-T4 B', zone: 'EAST_DEPARTURE', t1: 5, t2: 4, x1: 1950, x2: 2100 },
];

const ALL_X_MILESTONES = [
  -2500,
  -2100, -1950, -1800, -1650, -1500, // West Advance Crossover Ladder (BEFORE West Throat)
  -1000,                              // West Throat Midpoint
  -500, -200, -50, 50, 200, 500,     // Station Central & Mid-Yard Scissors
  1000,                               // East Throat Midpoint
  1500, 1650, 1800, 1950, 2100,      // East Advance Crossover Ladder (BEFORE East Throat)
  2500,
];

// -------------------------------------------------------------
// GRAPH MODEL & DIJKSTRA INTERLOCKING BRAIN
// -------------------------------------------------------------
interface GraphNode {
  id: string;
  x: number;
  z: number;
  trackId: number;
}

interface GraphEdge {
  from: string;
  to: string;
  trackId: number;
  zoneId: CorridorZoneId | 'CROSSOVER';
  distance: number;
  direction: 1 | -1;
}

class InterlockingGraph {
  nodes: Map<string, GraphNode> = new Map();
  edges: GraphEdge[] = [];

  constructor() {
    this.buildGraph();
  }

  buildGraph() {
    // 1. Create Nodes on all tracks across milestones
    TRACKS.forEach((track) => {
      ALL_X_MILESTONES.forEach((x) => {
        const nodeId = `N_${track.id}_${x}`;
        this.nodes.set(nodeId, { id: nodeId, x, z: track.z, trackId: track.id });
      });

      // Straight Edges Eastbound (+1)
      for (let i = 0; i < ALL_X_MILESTONES.length - 1; i++) {
        const x1 = ALL_X_MILESTONES[i];
        const x2 = ALL_X_MILESTONES[i + 1];
        const from = `N_${track.id}_${x1}`;
        const to = `N_${track.id}_${x2}`;
        const midX = (x1 + x2) / 2;
        const zone = getZoneIdFromX(midX);

        this.edges.push({
          from,
          to,
          trackId: track.id,
          zoneId: zone,
          distance: x2 - x1,
          direction: 1,
        });
      }

      // Straight Edges Westbound (-1)
      for (let i = ALL_X_MILESTONES.length - 1; i > 0; i--) {
        const x1 = ALL_X_MILESTONES[i];
        const x2 = ALL_X_MILESTONES[i - 1];
        const from = `N_${track.id}_${x1}`;
        const to = `N_${track.id}_${x2}`;
        const midX = (x1 + x2) / 2;
        const zone = getZoneIdFromX(midX);

        this.edges.push({
          from,
          to,
          trackId: track.id,
          zoneId: zone,
          distance: x1 - x2,
          direction: -1,
        });
      }
    });

    // 2. Build Universal Double Scissors Crossover Edges
    ALL_CROSSOVER_LINKS.forEach((link) => {
      const z1 = TRACKS.find((t) => t.id === link.t1)!.z;
      const z2 = TRACKS.find((t) => t.id === link.t2)!.z;
      const dist = Math.hypot(link.x2 - link.x1, z2 - z1);

      // Eastbound crossover edge (+1)
      this.edges.push({
        from: `N_${link.t1}_${link.x1}`,
        to: `N_${link.t2}_${link.x2}`,
        trackId: link.t2,
        zoneId: 'CROSSOVER',
        distance: dist,
        direction: 1,
      });

      // Westbound crossover edge (-1)
      this.edges.push({
        from: `N_${link.t2}_${link.x2}`,
        to: `N_${link.t1}_${link.x1}`,
        trackId: link.t1,
        zoneId: 'CROSSOVER',
        distance: dist,
        direction: -1,
      });
    });
  }

  // Reconstruct path array from previous map
  private reconstructPath(endNodeId: string, previous: Map<string, string | null>): THREE.Vector3[] {
    const pathPoints: THREE.Vector3[] = [];
    let curr: string | null = endNodeId;
    while (curr) {
      const n = this.nodes.get(curr)!;
      pathPoints.unshift(new THREE.Vector3(n.x, 1.6, n.z));
      curr = previous.get(curr) || null;
    }
    return pathPoints;
  }

  // Dijkstra's Shortest Path Algorithm targeting specified track
  findPath(
    startNodeId: string,
    targetTrackId: number,
    direction: 1 | -1,
    activeBlocks: ActiveBlock[]
  ): THREE.Vector3[] | null {
    const distances: Map<string, number> = new Map();
    const previous: Map<string, string | null> = new Map();
    const unvisited: Set<string> = new Set();

    this.nodes.forEach((_, id) => {
      distances.set(id, Infinity);
      previous.set(id, null);
      unvisited.add(id);
    });

    distances.set(startNodeId, 0);

    const targetX = direction === 1 ? 2500 : -2500;
    const preferredTargetNodeId = `N_${targetTrackId}_${targetX}`;

    while (unvisited.size > 0) {
      let currentId: string | null = null;
      let minDistance = Infinity;

      unvisited.forEach((id) => {
        const d = distances.get(id)!;
        if (d < minDistance) {
          minDistance = d;
          currentId = id;
        }
      });

      if (!currentId || minDistance === Infinity) break;
      unvisited.delete(currentId);

      // Reached preferred terminus node
      if (currentId === preferredTargetNodeId && minDistance < Infinity) {
        return this.reconstructPath(currentId, previous);
      }

      // Outgoing edges matching travel direction
      const outgoing = this.edges.filter((e) => e.from === currentId && e.direction === direction);

      for (const edge of outgoing) {
        if (!unvisited.has(edge.to)) continue;

        let weight = edge.distance;

        // If edge is a blocked track segment, weight is Infinity!
        if (edge.zoneId !== 'CROSSOVER') {
          const isBlocked = activeBlocks.some(
            (b) => b.trackId === edge.trackId && b.zoneId === edge.zoneId
          );
          if (isBlocked) {
            weight = Infinity;
          }
        }

        // Slight crossover penalty to prefer staying straight when open
        if (edge.zoneId === 'CROSSOVER') {
          weight += 18;
        }

        const alt = distances.get(currentId)! + weight;
        if (alt < distances.get(edge.to)!) {
          distances.set(edge.to, alt);
          previous.set(edge.to, currentId);
        }
      }
    }

    // If preferred target node was reached
    if (distances.get(preferredTargetNodeId) !== Infinity && previous.get(preferredTargetNodeId) !== null) {
      return this.reconstructPath(preferredTargetNodeId, previous);
    }

    // Fallback: If preferred target track is blocked at terminus, find closest unblocked track!
    let bestTerminusId: string | null = null;
    let bestCost = Infinity;

    TRACKS.forEach((trk) => {
      const candidateId = `N_${trk.id}_${targetX}`;
      const d = distances.get(candidateId);
      if (d !== undefined && d < Infinity) {
        const trackDistPenalty = Math.abs(trk.id - targetTrackId) * 80;
        const totalCost = d + trackDistPenalty;
        if (totalCost < bestCost) {
          bestCost = totalCost;
          bestTerminusId = candidateId;
        }
      }
    });

    if (bestTerminusId) {
      return this.reconstructPath(bestTerminusId, previous);
    }

    return null;
  }
}

// -------------------------------------------------------------
// TRAIN ENTITY INTERFACES
// -------------------------------------------------------------
interface ConsistCar {
  mesh: THREE.Group;
  type: 'ENGINE' | 'COACH_1' | 'COACH_2';
}

interface ActiveTrain {
  id: string;
  name: string;
  presetId: string;
  direction: 1 | -1; // 1 = Eastbound (+X), -1 = Westbound (-X)
  startTrack: number;
  assignedTrack: number;
  currentTrack: number;
  curve: THREE.CatmullRomCurve3;
  curveLength: number;
  distanceTraveled: number;
  speed: number;
  targetSpeed: number;
  cars: ConsistCar[];
  status: 'CRUISING' | 'DIVERTING' | 'CAUTION_TSR' | 'EMERGENCY_STOP';
  statusMessage: string;
  labelSprite: THREE.Sprite;
  primaryColorHex: number;
}

export interface TrainUIItem {
  id: string;
  name: string;
  presetId: string;
  direction: 1 | -1;
  startTrack: number;
  assignedTrack: number;
  currentTrack: number;
  speed: number;
  status: 'CRUISING' | 'DIVERTING' | 'CAUTION_TSR' | 'EMERGENCY_STOP';
  statusMessage: string;
  primaryColorHex: number;
  progressPercent: number;
}

export const StationDigitalTwin3D: React.FC<StationDigitalTwin3DProps> = ({
  isBlockActive: incomingBlockActive,
  isPowerIsolated: incomingPowerIsolated,
  selectedStation = 'Bhopal Divisional Yard (BPL) - 5-Track Automated Corridor',
}) => {
  // -------------------------------------------------------------
  // REACT STATES
  // -------------------------------------------------------------
  const [activeBlocks, setActiveBlocks] = useState<ActiveBlock[]>([
    { trackId: 2, zoneId: 'STATION_CENTRAL', type: 'P-WAY', timestamp: '14:30' },
  ]);

  const [selectedTrack, setSelectedTrack] = useState<number>(2);
  const [selectedZone, setSelectedZone] = useState<SegmentZoneId>('STATION_CENTRAL');
  const [selectedType, setSelectedType] = useState<MaintenanceType>('P-WAY');

  const [isSimRunning, setIsSimRunning] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [eventLogs, setEventLogs] = useState<string[]>([
    'Interlocking Brain: Ready. Universal Double Scissors Graph initialized.',
  ]);

  // Train Management States
  const [trainsList, setTrainsList] = useState<TrainUIItem[]>([]);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState<boolean>(false);
  const [dispatchPresetId, setDispatchPresetId] = useState<string>('VANDE_BHARAT');
  const [dispatchDirection, setDispatchDirection] = useState<1 | -1>(1);
  const [dispatchStartTrack, setDispatchStartTrack] = useState<number>(1);
  const [dispatchTargetTrack, setDispatchTargetTrack] = useState<number>(5);
  const [customTrainName, setCustomTrainName] = useState<string>('');

  // Floating Menus: Closed by default to keep the 3D yard view completely unobstructed
  const [isBlockMenuOpen, setIsBlockMenuOpen] = useState<boolean>(false);
  const [isTrainsMenuOpen, setIsTrainsMenuOpen] = useState<boolean>(false);

  // DOM Container & Three.js Refs
  const mountRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<MapControls | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Entities
  const graphRef = useRef<InterlockingGraph>(new InterlockingGraph());
  const activeTrainsRef = useRef<ActiveTrain[]>([]);
  const segmentMeshesRef = useRef<Map<string, { ballast: THREE.Mesh; rails: THREE.LineSegments }>>(new Map());
  const hazardGroupRef = useRef<THREE.Group>(new THREE.Group());
  const pulseTimerRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);

  const addLog = useCallback((msg: string) => {
    setEventLogs((prev) => [msg, ...prev.slice(0, 7)]);
  }, []);

  // Sync active trains to React state for responsive UI rendering
  const syncActiveTrainsState = useCallback(() => {
    const list: TrainUIItem[] = activeTrainsRef.current.map((t) => {
      const progress = Math.min(100, Math.max(0, Math.round((t.distanceTraveled / t.curveLength) * 100)));
      return {
        id: t.id,
        name: t.name,
        presetId: t.presetId,
        direction: t.direction,
        startTrack: t.startTrack,
        assignedTrack: t.assignedTrack,
        currentTrack: t.currentTrack,
        speed: t.speed,
        status: t.status,
        statusMessage: t.statusMessage,
        primaryColorHex: t.primaryColorHex,
        progressPercent: progress,
      };
    });
    setTrainsList(list);
  }, []);

  // -------------------------------------------------------------
  // THREE.JS PROCEDURAL TEXTURE LABEL SPRITE
  // -------------------------------------------------------------
  const createLabelSprite = (text: string, bgColor: string, textColor: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 460;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Sprite();

    ctx.fillStyle = bgColor;
    ctx.strokeStyle = textColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(8, 8, 444, 64, 16);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 23px monospace';
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 230, 40);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(65, 11.5, 1);
    return sprite;
  };

  // -------------------------------------------------------------
  // BUILD MULTI-CAR CONSIST MESH (LENGTH ALONG Z-AXIS!)
  // In Three.js, Object3D.lookAt(target) aligns the LOCAL +Z AXIS with target!
  // By modeling car body length along Z, cars point directly along the track rails!
  // -------------------------------------------------------------
  const buildConsistCar = (
    carType: 'ENGINE' | 'COACH_1' | 'COACH_2',
    primaryHex: number,
    accentHex: number
  ): THREE.Group => {
    const group = new THREE.Group();
    const length = carType === 'ENGINE' ? 44 : 40;
    const height = 7.5;
    const width = 6.4;

    // Main Car Body (Width along X: 6.4, Height along Y: 7.5, Length along Z: 44/40!)
    const bodyGeo = new THREE.BoxGeometry(width, height, length);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: primaryHex,
      roughness: 0.25,
      metalness: 0.35,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = height / 2 + 1.8;
    body.castShadow = true;
    group.add(body);

    // Signature Accent Band (Along Z)
    const bandGeo = new THREE.BoxGeometry(width + 0.15, 2.2, length + 0.1);
    const bandMat = new THREE.MeshStandardMaterial({
      color: accentHex,
      roughness: 0.3,
    });
    const band = new THREE.Mesh(bandGeo, bandMat);
    band.position.y = height / 2 + 1.8;
    group.add(band);

    if (carType === 'ENGINE') {
      // Aerodynamic Nose Cone (Apex points forward along +Z!)
      const noseGeo = new THREE.ConeGeometry(width / 2, 10, 16);
      const noseMat = new THREE.MeshStandardMaterial({
        color: accentHex,
        roughness: 0.2,
      });
      const nose = new THREE.Mesh(noseGeo, noseMat);
      nose.rotation.x = Math.PI / 2; // Point cone apex forward along +Z
      nose.position.set(0, height / 2 + 1.2, length / 2 + 5);
      group.add(nose);

      // Cockpit Windshield (Facing forward along +Z)
      const glassGeo = new THREE.BoxGeometry(width - 1, 2.4, 4);
      const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1 });
      const glass = new THREE.Mesh(glassGeo, glassMat);
      glass.position.set(0, height - 0.4, length / 2 + 2);
      group.add(glass);

      // Volumetric Headlight Projection Beam (Expanding forward along +Z)
      const beamGeo = new THREE.ConeGeometry(14, 75, 16, 1, true);
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0xfef08a,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.rotation.x = -Math.PI / 2;
      beam.position.set(0, 4, length / 2 + 37.5);
      group.add(beam);

      // Articulated Pantograph on Roof
      const pantoGeo = new THREE.BoxGeometry(4, 0.5, 8);
      const pantoMat = new THREE.MeshStandardMaterial({ color: accentHex });
      const panto = new THREE.Mesh(pantoGeo, pantoMat);
      panto.position.set(0, height + 2.5, -length / 4);
      group.add(panto);
    } else {
      // Passenger Windows (Spaced along Z on left & right sides)
      for (let wz = -length / 2 + 6; wz <= length / 2 - 6; wz += 7) {
        const winGeo = new THREE.BoxGeometry(width + 0.25, 2.2, 4.5);
        const winMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
        const win = new THREE.Mesh(winGeo, winMat);
        win.position.set(0, height / 2 + 1.8, wz);
        group.add(win);
      }
    }

    // Bogie Wheelsets (Axles along X, spaced along Z)
    const wheelGeo = new THREE.CylinderGeometry(1.6, 1.6, 1.2, 12);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
    [-length / 2.8, length / 2.8].forEach((wz) => {
      [-width / 2.2, width / 2.2].forEach((wx) => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 1.6, wz);
        group.add(wheel);
      });
    });

    return group;
  };

  // -------------------------------------------------------------
  // DISPATCH / SPAWN TRAIN ON CUSTOM ROUTE (ANY TRACK -> ANY TRACK)
  // -------------------------------------------------------------
  const spawnTrain = useCallback(
    (options?: {
      presetId?: string;
      customName?: string;
      direction?: 1 | -1;
      startTrack?: number;
      targetTrack?: number;
    }) => {
      const scene = sceneRef.current;
      const graph = graphRef.current;
      if (!scene || !graph) return;

      const presetId = options?.presetId || 'VANDE_BHARAT';
      const preset = TRAIN_PRESETS.find((p) => p.id === presetId) || TRAIN_PRESETS[0];

      const direction = options?.direction !== undefined ? options.direction : preset.defaultDirection;
      const startTrack = options?.startTrack !== undefined ? options.startTrack : (direction === 1 ? 2 : 3);
      const targetTrack = options?.targetTrack !== undefined ? options.targetTrack : startTrack;

      const trainName =
        options?.customName?.trim() ||
        `${preset.name} [T${startTrack} ➔ T${targetTrack}]`;

      // Start node based on travel direction
      const startX = direction === 1 ? -2500 : 2500;
      const startNodeId = `N_${startTrack}_${startX}`;

      // Solve path using Dijkstra targeting targetTrack
      const pathPoints = graph.findPath(startNodeId, targetTrack, direction, activeBlocks);
      if (!pathPoints || pathPoints.length < 2) {
        addLog(`⚠️ Interlocking: No unblocked path from Track ${startTrack} to Track ${targetTrack}.`);
        return;
      }

      // Smooth 3D Spline Curve along calculated path points
      const curve = new THREE.CatmullRomCurve3(pathPoints, false, 'catmullrom', 0.12);
      const curveLength = curve.getLength();

      // Build Consist Meshes with preset colors
      const engineMesh = buildConsistCar('ENGINE', preset.primaryColorHex, preset.accentColorHex);
      const coach1Mesh = buildConsistCar('COACH_1', preset.primaryColorHex, preset.accentColorHex);
      const coach2Mesh = buildConsistCar('COACH_2', preset.primaryColorHex, preset.accentColorHex);

      scene.add(engineMesh);
      scene.add(coach1Mesh);
      scene.add(coach2Mesh);

      // Status Label Sprite
      const labelSprite = createLabelSprite(trainName, 'rgba(15, 23, 42, 0.92)', '#38bdf8');
      scene.add(labelSprite);

      const activeTrain: ActiveTrain = {
        id: `train_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name: trainName,
        presetId: preset.id,
        direction,
        startTrack,
        assignedTrack: targetTrack,
        currentTrack: startTrack,
        curve,
        curveLength,
        distanceTraveled: 0,
        speed: preset.speed,
        targetSpeed: preset.speed,
        cars: [
          { mesh: engineMesh, type: 'ENGINE' },
          { mesh: coach1Mesh, type: 'COACH_1' },
          { mesh: coach2Mesh, type: 'COACH_2' },
        ],
        status: startTrack === targetTrack ? 'CRUISING' : 'DIVERTING',
        statusMessage:
          startTrack === targetTrack
            ? `${direction === 1 ? 'Eastbound' : 'Westbound'} Clear • Cruising ${Math.round(preset.speed * 55)} km/h`
            : `Routing T${startTrack} ➔ T${targetTrack} via Interlocking Ladder`,
        labelSprite,
        primaryColorHex: preset.primaryColorHex,
      };

      activeTrainsRef.current.push(activeTrain);
      syncActiveTrainsState();
      addLog(
        `🚆 Dispatched ${trainName} (${direction === 1 ? 'Eastbound' : 'Westbound'}) [Track ${startTrack} ➔ Track ${targetTrack}].`
      );
    },
    [activeBlocks, addLog, syncActiveTrainsState]
  );

  // -------------------------------------------------------------
  // DELETE / DESPAWN TRAIN
  // -------------------------------------------------------------
  const deleteTrain = useCallback(
    (trainId: string) => {
      const scene = sceneRef.current;
      const idx = activeTrainsRef.current.findIndex((t) => t.id === trainId);
      if (idx === -1) return;

      const train = activeTrainsRef.current[idx];
      if (scene) {
        train.cars.forEach((car) => scene.remove(car.mesh));
        scene.remove(train.labelSprite);
      }

      activeTrainsRef.current.splice(idx, 1);
      syncActiveTrainsState();
      addLog(`🗑️ Despawned & removed train: ${train.name} from yard corridor.`);
    },
    [addLog, syncActiveTrainsState]
  );

  // -------------------------------------------------------------
  // DYNAMIC TRACK CHANGING: ON-THE-FLY REROUTING TO ANY OTHER TRACK
  // -------------------------------------------------------------
  const switchTrainTrack = useCallback(
    (trainId: string, newTargetTrack: number) => {
      const train = activeTrainsRef.current.find((t) => t.id === trainId);
      const graph = graphRef.current;
      if (!train || !graph) return;

      if (train.currentTrack === newTargetTrack && train.assignedTrack === newTargetTrack) {
        addLog(`ℹ️ Train ${train.name} is already cruising on Track ${newTargetTrack}.`);
        return;
      }

      // 1. Current position along curve
      const t = Math.min(1, Math.max(0, train.distanceTraveled / train.curveLength));
      const enginePos = train.curve.getPointAt(t);

      // 2. Find upcoming milestone node along travel direction on current track
      const candidateMilestones = Array.from(graph.nodes.values()).filter((n) => {
        if (n.trackId !== train.currentTrack) return false;
        return train.direction === 1 ? n.x >= enginePos.x + 25 : n.x <= enginePos.x - 25;
      });

      candidateMilestones.sort((a, b) => Math.abs(a.x - enginePos.x) - Math.abs(b.x - enginePos.x));

      if (candidateMilestones.length === 0) {
        addLog(`⚠️ Train ${train.name} is too close to corridor exit to switch tracks.`);
        return;
      }

      const switchNode = candidateMilestones[0];

      // 3. Solve path from upcoming switch node to new target track
      const remainingPath = graph.findPath(switchNode.id, newTargetTrack, train.direction, activeBlocks);
      if (!remainingPath || remainingPath.length < 2) {
        addLog(`⚠️ Interlocking: No unblocked path from Track ${train.currentTrack} to Track ${newTargetTrack}.`);
        return;
      }

      // 4. Splice new curve from current engine position to switch node to remaining path
      const splicedPoints = [enginePos, ...remainingPath];
      const newCurve = new THREE.CatmullRomCurve3(splicedPoints, false, 'catmullrom', 0.12);

      train.assignedTrack = newTargetTrack;
      train.curve = newCurve;
      train.curveLength = newCurve.getLength();
      train.distanceTraveled = 0;
      train.status = 'DIVERTING';
      train.statusMessage = `Switching ➔ Track ${newTargetTrack} via Interlocking Switch`;

      syncActiveTrainsState();
      addLog(`🔄 Route Command: Train ${train.name} redirected ➔ Track ${newTargetTrack}.`);
    },
    [activeBlocks, addLog, syncActiveTrainsState]
  );

  // -------------------------------------------------------------
  // CAMERA FOCUS ON SPECIFIC TRAIN
  // -------------------------------------------------------------
  const focusOnTrain = useCallback((trainId: string) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const train = activeTrainsRef.current.find((t) => t.id === trainId);
    if (!camera || !controls || !train) return;

    const t = Math.min(1, Math.max(0, train.distanceTraveled / train.curveLength));
    const pos = train.curve.getPointAt(t);

    controls.target.set(pos.x, 0, pos.z);
    camera.position.set(pos.x + 280, 260, pos.z + 280);
    camera.zoom = 1.35;
    camera.updateProjectionMatrix();
    controls.update();
  }, []);

  // -------------------------------------------------------------
  // THREE.JS INITIALIZATION & SCENE SETUP
  // -------------------------------------------------------------
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0a0e17');
    sceneRef.current = scene;

    // 2. Camera: High-Precision Orthographic Camera
    const aspect = container.clientWidth / container.clientHeight;
    const viewSize = 750;
    const camera = new THREE.OrthographicCamera(
      (-viewSize * aspect) / 2,
      (viewSize * aspect) / 2,
      viewSize / 2,
      -viewSize / 2,
      1,
      6000
    );
    camera.position.set(450, 420, 450);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. MapControls (Smooth Ground-Plane Panning across 5x Corridor)
    const controls = new MapControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = true;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI / 2 - 0.08;
    controls.minZoom = 0.6; // Mathematically constrained
    controls.maxZoom = 2.4;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Camera Pan Bounding Box Clamping (Hard physical boundary wall)
    const yardBounds = new THREE.Box3(
      new THREE.Vector3(-2200, -20, -100),
      new THREE.Vector3(2200, 50, 100)
    );

    const restrictPan = () => {
      const clampedX = THREE.MathUtils.clamp(controls.target.x, yardBounds.min.x, yardBounds.max.x);
      const clampedZ = THREE.MathUtils.clamp(controls.target.z, yardBounds.min.z, yardBounds.max.z);

      const diffX = clampedX - controls.target.x;
      const diffZ = clampedZ - controls.target.z;

      if (diffX !== 0 || diffZ !== 0) {
        camera.position.x += diffX;
        camera.position.z += diffZ;
        controls.target.x = clampedX;
        controls.target.z = clampedZ;
      }
    };

    controls.addEventListener('change', restrictPan);

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xe0f2fe, 1.5);
    dirLight.position.set(400, 600, 300);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    const cyanRim = new THREE.DirectionalLight(0x00f0ff, 0.4);
    cyanRim.position.set(-400, 200, -300);
    scene.add(cyanRim);

    // 6. Vast Ground Plane & Yard Grid
    const groundGeo = new THREE.PlaneGeometry(5500, 600);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x0b1120, roughness: 0.95 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    scene.add(ground);

    const grid = new THREE.GridHelper(5200, 104, 0x1e293b, 0x111c30);
    grid.position.y = 0.05;
    scene.add(grid);

    // 7. BUILD 5 TRACKS × 5 CORRIDOR SEGMENTS MESHES
    const segmentMap = new Map<string, { ballast: THREE.Mesh; rails: THREE.LineSegments }>();
    const ballastMatDefault = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 });
    const railsMatDefault = new THREE.LineBasicMaterial({ color: 0x94a3b8, linewidth: 2 });

    TRACKS.forEach((track) => {
      CORRIDOR_SEGMENTS.forEach((zone) => {
        const segKey = `${track.id}_${zone.id}`;
        const segLength = zone.endX - zone.startX;

        // Ballast Bed Box
        const ballastGeo = new THREE.BoxGeometry(segLength, 1.2, 12);
        const ballastMesh = new THREE.Mesh(ballastGeo, ballastMatDefault.clone());
        ballastMesh.position.set(zone.centerX, 0.6, track.z);
        ballastMesh.receiveShadow = true;
        scene.add(ballastMesh);

        // Sleepers
        const sleeperSpacing = 8;
        const sleeperCount = Math.floor(segLength / sleeperSpacing);
        const sleeperGeo = new THREE.BoxGeometry(2.4, 0.6, 10);
        const sleeperMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
        const instancedSleepers = new THREE.InstancedMesh(sleeperGeo, sleeperMat, sleeperCount);
        const dummy = new THREE.Object3D();

        for (let i = 0; i < sleeperCount; i++) {
          const sx = zone.startX + (i + 0.5) * sleeperSpacing;
          dummy.position.set(sx, 1.25, track.z);
          dummy.updateMatrix();
          instancedSleepers.setMatrixAt(i, dummy.matrix);
        }
        instancedSleepers.instanceMatrix.needsUpdate = true;
        scene.add(instancedSleepers);

        // Dual Steel Rails Line Segments
        const railHalf = 3.2;
        const railPoints: THREE.Vector3[] = [
          new THREE.Vector3(zone.startX, 1.7, track.z - railHalf),
          new THREE.Vector3(zone.endX, 1.7, track.z - railHalf),
          new THREE.Vector3(zone.startX, 1.7, track.z + railHalf),
          new THREE.Vector3(zone.endX, 1.7, track.z + railHalf),
        ];
        const railsGeo = new THREE.BufferGeometry().setFromPoints(railPoints);
        const railsLine = new THREE.LineSegments(railsGeo, railsMatDefault.clone());
        scene.add(railsLine);

        segmentMap.set(segKey, { ballast: ballastMesh, rails: railsLine });
      });
    });
    segmentMeshesRef.current = segmentMap;

    // 8. BUILD UNIVERSAL DOUBLE SCISSORS CROSSOVER 3D MESHES
    const crossoverMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 });
    const switchBallastMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 });

    ALL_CROSSOVER_LINKS.forEach((link) => {
      const z1 = TRACKS.find((t) => t.id === link.t1)!.z;
      const z2 = TRACKS.find((t) => t.id === link.t2)!.z;

      // Smooth Bezier Curve Rails
      const curve = new THREE.CubicBezierCurve3(
        new THREE.Vector3(link.x1, 1.7, z1),
        new THREE.Vector3(link.x1 + (link.x2 - link.x1) * 0.35, 1.7, z1),
        new THREE.Vector3(link.x2 - (link.x2 - link.x1) * 0.35, 1.7, z2),
        new THREE.Vector3(link.x2, 1.7, z2)
      );
      const pts = curve.getPoints(24);
      const curveGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const curveLine = new THREE.Line(curveGeo, crossoverMat);
      scene.add(curveLine);

      // Angled Switch Ballast Bed
      const midX = (link.x1 + link.x2) / 2;
      const midZ = (z1 + z2) / 2;
      const len = Math.hypot(link.x2 - link.x1, z2 - z1);
      const angle = Math.atan2(z2 - z1, link.x2 - link.x1);
      const xBallastGeo = new THREE.BoxGeometry(len, 1.1, 9);
      const xBallast = new THREE.Mesh(xBallastGeo, switchBallastMat);
      xBallast.position.set(midX, 0.55, midZ);
      xBallast.rotation.y = -angle;
      scene.add(xBallast);
    });

    // 9. STATION PLATFORMS (Platform 1 at z = -52, Platform 2 at z = 30)
    const platMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });
    [
      { name: 'BHOPAL JN - PLATFORM 1', z: -52, width: 14, length: 700 },
      { name: 'BHOPAL JN - PLATFORM 2', z: 30, width: 14, length: 700 },
    ].forEach((p) => {
      const pGeo = new THREE.BoxGeometry(p.length, 3.5, p.width);
      const pMesh = new THREE.Mesh(pGeo, platMat);
      pMesh.position.set(0, 1.75, p.z);
      scene.add(pMesh);

      const edgeGeo = new THREE.BoxGeometry(p.length, 0.4, 0.8);
      const edgeMat = new THREE.MeshBasicMaterial({ color: 0xeab308 });
      const edgeMesh = new THREE.Mesh(edgeGeo, edgeMat);
      edgeMesh.position.set(0, 3.6, p.z + (p.z < 0 ? 6.5 : -6.5));
      scene.add(edgeMesh);

      const sign = createLabelSprite(p.name, 'rgba(15, 23, 42, 0.85)', '#facc15');
      sign.position.set(0, 20, p.z);
      scene.add(sign);
    });

    // 10. OVERHEAD OHE TRACTION GANTRIES ACROSS 5 TRACKS
    const gantryPositionsX = [-2000, -1400, -800, -200, 400, 1000, 1600, 2200];
    const wireHeight = 22;
    gantryPositionsX.forEach((gx) => {
      const mastGeo = new THREE.BoxGeometry(2, wireHeight + 6, 2);
      const mastMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.6 });

      const mastLeft = new THREE.Mesh(mastGeo, mastMat);
      mastLeft.position.set(gx, (wireHeight + 6) / 2, -52);
      scene.add(mastLeft);

      const mastRight = new THREE.Mesh(mastGeo, mastMat);
      mastRight.position.set(gx, (wireHeight + 6) / 2, 52);
      scene.add(mastRight);

      const beamGeo = new THREE.BoxGeometry(2.5, 2, 106);
      const beam = new THREE.Mesh(beamGeo, mastMat);
      beam.position.set(gx, wireHeight + 4, 0);
      scene.add(beam);
    });

    scene.add(hazardGroupRef.current);

    // Clean Yard Start: No automatic trains are dispatched.
    // Trains enter only when the user explicitly clicks "+ Dispatch Train".

    // -------------------------------------------------------------
    // RENDER LOOP (60 FPS)
    // -------------------------------------------------------------
    let isRunning = true;

    const animate = () => {
      if (!isRunning) return;

      pulseTimerRef.current += 0.045;
      const pulseVal = 0.5 + 0.5 * Math.sin(pulseTimerRef.current * 3);

      controls.update();

      if (isSimRunning) {
        updateSimulationStep();
      }

      // Sync train list state to UI ~3 times/sec
      frameCountRef.current += 1;
      if (frameCountRef.current % 20 === 0) {
        syncActiveTrainsState();
      }

      // Hazard Visuals Pulse
      hazardGroupRef.current.children.forEach((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
          child.material.opacity = 0.35 + 0.35 * pulseVal;
        }
      });

      renderer.render(scene, camera);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    // Resize Handler
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      const newAspect = w / h;
      cameraRef.current.left = (-viewSize * newAspect) / 2;
      cameraRef.current.right = (viewSize * newAspect) / 2;
      cameraRef.current.top = viewSize / 2;
      cameraRef.current.bottom = -viewSize / 2;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
      controls.removeEventListener('change', restrictPan);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [spawnTrain, syncActiveTrainsState]);

  // -------------------------------------------------------------
  // SIMULATION STEP: MULTI-CAR CONSIST SPLINE MOVEMENT & DYNAMIC RE-ROUTING
  // -------------------------------------------------------------
  const updateSimulationStep = () => {
    const scene = sceneRef.current;
    const graph = graphRef.current;
    if (!scene || !graph) return;

    const trains = activeTrainsRef.current;
    const carOffsetDistance = 46;

    for (let i = trains.length - 1; i >= 0; i--) {
      const train = trains[i];

      // 1. Advance distance traveled along CatmullRom Curve
      train.distanceTraveled += train.speed;
      const t = train.distanceTraveled / train.curveLength;

      // 2. Engine Position & Actual Track Detection
      const enginePos = train.curve.getPointAt(Math.min(1, Math.max(0, t)));
      train.currentTrack = getTrackIdFromZ(enginePos.z);
      const currentZone = getZoneIdFromX(enginePos.x);

      // Check if current zone on actual track is blocked
      const isActualTrackBlocked = activeBlocks.some(
        (b) => b.trackId === train.currentTrack && b.zoneId === currentZone
      );

      if (isActualTrackBlocked) {
        train.speed = Math.max(0, train.speed - 0.05);
        train.status = 'EMERGENCY_STOP';
        train.statusMessage = '⚠️ EMERGENCY STOP: Active Block Detected Ahead!';
      } else {
        train.speed = Math.min(train.targetSpeed, train.speed + 0.02);
      }

      // 3. Dynamic Forward Switch Evaluation (Rerouting BEFORE the Block)
      const lookaheadDistance = 140;
      const lookaheadT = Math.min(1, Math.max(0, (train.distanceTraveled + lookaheadDistance) / train.curveLength));
      const lookaheadPos = train.curve.getPointAt(lookaheadT);
      const lookaheadTrack = getTrackIdFromZ(lookaheadPos.z);
      const lookaheadZone = getZoneIdFromX(lookaheadPos.x);

      const isUpcomingBlocked = activeBlocks.some(
        (b) => b.trackId === lookaheadTrack && b.zoneId === lookaheadZone
      );

      if (isUpcomingBlocked && train.status !== 'EMERGENCY_STOP') {
        // Find upcoming milestone node along travel direction on current track
        const upcomingNode = Array.from(graph.nodes.values()).find((n) => {
          if (n.trackId !== train.currentTrack) return false;
          return train.direction === 1
            ? n.x >= enginePos.x + 15 && n.x <= enginePos.x + 160
            : n.x <= enginePos.x - 15 && n.x >= enginePos.x - 160;
        });

        if (upcomingNode) {
          // Re-run Dijkstra avoiding blocked segment
          const newPath = graph.findPath(upcomingNode.id, train.assignedTrack, train.direction, activeBlocks);
          if (newPath && newPath.length >= 2) {
            const splicedCurve = new THREE.CatmullRomCurve3(
              [enginePos, ...newPath],
              false,
              'catmullrom',
              0.12
            );
            train.curve = splicedCurve;
            train.curveLength = splicedCurve.getLength();
            train.distanceTraveled = 0;
            train.status = 'DIVERTING';
            train.statusMessage = `Diverting via Interlocking Turnout (Bypassing ${lookaheadZone})`;
            addLog(`⚡ Interlocking Re-route: ${train.name} switched to bypass blocked ${lookaheadZone}.`);
          }
        }
      }

      // 4. Animate Multi-Car Consist (Engine + 2 Coaches)
      train.cars.forEach((car) => {
        let carOffset = 0;
        if (car.type === 'COACH_1') carOffset = carOffsetDistance;
        if (car.type === 'COACH_2') carOffset = carOffsetDistance * 2;

        const carDistance = Math.max(0, train.distanceTraveled - carOffset);
        const carT = Math.min(1, Math.max(0, carDistance / train.curveLength));

        const pt = train.curve.getPointAt(carT);
        const tangent = train.curve.getTangentAt(carT);

        car.mesh.position.copy(pt);
        // Look along tangent so car length (Z-axis) aligns perfectly with the track!
        const lookTarget = pt.clone().add(tangent);
        car.mesh.lookAt(lookTarget);
      });

      // Update Floating Status Label above Engine
      const engineMesh = train.cars[0].mesh;
      train.labelSprite.position.set(engineMesh.position.x, engineMesh.position.y + 18, engineMesh.position.z);

      // 5. Continuous Loop: Train loops continuously until user explicitly deletes/removes it!
      if (t >= 1.0) {
        const startX = train.direction === 1 ? -2500 : 2500;
        const startNodeId = `N_${train.startTrack}_${startX}`;
        const newPath = graph.findPath(startNodeId, train.assignedTrack, train.direction, activeBlocks);

        if (newPath && newPath.length >= 2) {
          train.curve = new THREE.CatmullRomCurve3(newPath, false, 'catmullrom', 0.12);
          train.curveLength = train.curve.getLength();
        }

        train.distanceTraveled = 0;
        addLog(`🔄 ${train.name} completed run. Looping continuously on route.`);
      }
    }
  };

  // -------------------------------------------------------------
  // UPDATE VISUAL MAINTENANCE BLOCKS (COLORING & HAZARDS)
  // -------------------------------------------------------------
  useEffect(() => {
    const segmentMap = segmentMeshesRef.current;
    const hazardGroup = hazardGroupRef.current;

    while (hazardGroup.children.length > 0) {
      hazardGroup.remove(hazardGroup.children[0]);
    }

    // Reset default track colors
    segmentMap.forEach(({ ballast, rails }) => {
      (ballast.material as THREE.MeshStandardMaterial).color.setHex(0x1e293b);
      (rails.material as THREE.LineBasicMaterial).color.setHex(0x94a3b8);
    });

    // Apply active maintenance blocks
    activeBlocks.forEach((block) => {
      const segKey = `${block.trackId}_${block.zoneId}`;
      const meshes = segmentMap.get(segKey);
      const trackDef = TRACKS.find((t) => t.id === block.trackId);
      const zoneDef = ZONES.find((z) => z.id === block.zoneId);

      if (meshes && trackDef && zoneDef) {
        const segLength = zoneDef.endX - zoneDef.startX;

        if (block.type === 'P-WAY') {
          (meshes.ballast.material as THREE.MeshStandardMaterial).color.setHex(0x7f1d1d);
          (meshes.rails.material as THREE.LineBasicMaterial).color.setHex(0xef4444);

          const barrierGeo = new THREE.BoxGeometry(segLength, 3, 14);
          const barrierMat = new THREE.MeshBasicMaterial({
            color: 0xef4444,
            transparent: true,
            opacity: 0.45,
          });
          const barrier = new THREE.Mesh(barrierGeo, barrierMat);
          barrier.position.set(zoneDef.centerX, 2.5, trackDef.z);
          hazardGroup.add(barrier);

          const tag = createLabelSprite(
            `⛔ P-WAY BLOCK: T${block.trackId} [${zoneDef.name.toUpperCase()}]`,
            'rgba(153, 27, 27, 0.92)',
            '#ffffff'
          );
          tag.position.set(zoneDef.centerX, 24, trackDef.z);
          hazardGroup.add(tag);
        } else if (block.type === 'OHE') {
          (meshes.ballast.material as THREE.MeshStandardMaterial).color.setHex(0x451a03);
          (meshes.rails.material as THREE.LineBasicMaterial).color.setHex(0xf59e0b);

          const tag = createLabelSprite(
            `⚡ OHE POWER CUT: T${block.trackId} [${zoneDef.name.toUpperCase()}]`,
            'rgba(120, 53, 15, 0.92)',
            '#fde047'
          );
          tag.position.set(zoneDef.centerX, 24, trackDef.z);
          hazardGroup.add(tag);
        } else if (block.type === 'S-T') {
          (meshes.ballast.material as THREE.MeshStandardMaterial).color.setHex(0x312e81);
          (meshes.rails.material as THREE.LineBasicMaterial).color.setHex(0x818cf8);

          const tag = createLabelSprite(
            `🟡 S&T TSR 30 km/h: T${block.trackId} [${zoneDef.name.toUpperCase()}]`,
            'rgba(30, 27, 75, 0.92)',
            '#a5b4fc'
          );
          tag.position.set(zoneDef.centerX, 24, trackDef.z);
          hazardGroup.add(tag);
        }
      }
    });
  }, [activeBlocks]);

  // -------------------------------------------------------------
  // USER ACTIONS: APPLY / REMOVE BLOCKS
  // -------------------------------------------------------------
  const handleApplyBlock = () => {
    setActiveBlocks((prev) => {
      const filtered = prev.filter((b) => !(b.trackId === selectedTrack && b.zoneId === selectedZone));
      return [
        ...filtered,
        {
          trackId: selectedTrack,
          zoneId: selectedZone,
          type: selectedType,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ];
    });

    const tName = TRACKS.find((t) => t.id === selectedTrack)?.name;
    const zName = ZONES.find((z) => z.id === selectedZone)?.name;
    addLog(`User Enforced ${selectedType} Block on ${tName} [${zName}]. Dijkstra re-evaluating routes.`);
  };

  const handleRemoveBlock = (trackId: number, zoneId: SegmentZoneId) => {
    setActiveBlocks((prev) => prev.filter((b) => !(b.trackId === trackId && b.zoneId === zoneId)));
    addLog(`Block Released on Track ${trackId} [${zoneId}]. Segment reopened.`);
  };

  const handleClearAll = () => {
    setActiveBlocks([]);
    addLog('All Corridor Blocks Cleared. Full 5-Track Interlocking Open.');
  };

  // -------------------------------------------------------------
  // SMOOTH CAMERA RECENTER TWEEN
  // -------------------------------------------------------------
  const isTweeningRef = useRef<boolean>(false);

  const handleRecenterView = useCallback(() => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls || isTweeningRef.current) return;

    isTweeningRef.current = true;

    const startPos = camera.position.clone();
    const targetPos = new THREE.Vector3(450, 420, 450);

    const startTarget = controls.target.clone();
    const targetLookAt = new THREE.Vector3(0, 0, 0);

    const startZoom = camera.zoom;
    const targetZoom = 1.0;

    const duration = 750;
    const startTime = performance.now();

    const easeInOutCubic = (x: number): number =>
      x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

    const animateStep = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeInOutCubic(progress);

      camera.position.lerpVectors(startPos, targetPos, eased);
      controls.target.lerpVectors(startTarget, targetLookAt, eased);
      camera.zoom = THREE.MathUtils.lerp(startZoom, targetZoom, eased);
      camera.updateProjectionMatrix();
      controls.update();

      if (progress < 1) {
        requestAnimationFrame(animateStep);
      } else {
        camera.position.copy(targetPos);
        controls.target.copy(targetLookAt);
        camera.zoom = targetZoom;
        camera.updateProjectionMatrix();
        controls.update();
        isTweeningRef.current = false;
        addLog('Camera Recenter: Default Center-Yard Focus Restored.');
      }
    };

    requestAnimationFrame(animateStep);
  }, [addLog]);

  // Fullscreen Handler: Fullscreen 3D model container directly for maximum interaction area
  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!document.fullscreenElement) {
      if (el && el.requestFullscreen) {
        el.requestFullscreen().catch(() => setIsFullscreen(true));
      } else {
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => setIsFullscreen(false));
      } else {
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFSChange = () => {
      const isFS = !!document.fullscreenElement;
      setIsFullscreen(isFS);
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        if (rendererRef.current && cameraRef.current && mountRef.current) {
          const w = mountRef.current.clientWidth;
          const h = mountRef.current.clientHeight;
          const newAspect = w / h;
          const viewSize = 750;
          cameraRef.current.left = (-viewSize * newAspect) / 2;
          cameraRef.current.right = (viewSize * newAspect) / 2;
          cameraRef.current.top = viewSize / 2;
          cameraRef.current.bottom = -viewSize / 2;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h);
        }
      }, 60);
    };
    document.addEventListener('fullscreenchange', handleFSChange);
    return () => document.removeEventListener('fullscreenchange', handleFSChange);
  }, []);

  return (
    <div
      ref={containerRef}
      className={
        isFullscreen
          ? 'fixed inset-0 z-[999999] w-screen h-screen flex flex-col bg-[#0a0e17] font-sans text-slate-100 overflow-hidden'
          : 'w-full font-sans text-slate-100'
      }
    >
      {/* Outer 3D Cockpit Frame */}
      <div
        className={`relative overflow-hidden ${
          isFullscreen ? 'w-full h-full flex flex-col rounded-none border-0' : 'rounded-3xl border border-slate-800'
        } bg-[#0a0e17] shadow-2xl shadow-black/90`}
      >
        {/* Header Bar */}
        <div className={`shrink-0 flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-800/80 bg-slate-950/90 ${isFullscreen ? 'px-5 py-2.5' : 'px-6 py-3.5'} gap-3.5 backdrop-blur-md`}>
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-inner">
              <Train className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white font-mono">
                  5-TRACK YARD DIGITAL TWIN • DYNAMIC LADDER INTERLOCKING
                </h2>
                <span className="rounded-full bg-cyan-500/20 border border-cyan-500/40 px-2 py-0.5 text-[10px] font-mono text-cyan-300 font-bold">
                  DIJKSTRA GRAPH BRAIN
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {selectedStation} • Multi-Car Consist Spline Simulation (Universal Scissors Crossover Routing)
              </p>
            </div>
          </div>

          {/* Top Status & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            {/* 1. BUTTON TO OPEN/CLOSE BLOCK DISPATCHER MENU (GREEN LIGHT OUTLINE & ACCENTS) */}
            <button
              type="button"
              onClick={() => setIsBlockMenuOpen((prev) => !prev)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-bold transition-all cursor-pointer shadow-xs ${
                isBlockMenuOpen
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 ring-2 ring-emerald-400/50 shadow-lg shadow-emerald-500/25'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-emerald-400 border-emerald-500/50 hover:border-emerald-400'
              }`}
              title="Open/Close Block Dispatcher Menu"
            >
              <Wrench className="w-3.5 h-3.5 text-emerald-400" />
              <span>BLOCK DISPATCHER</span>
              {activeBlocks.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-600 text-white font-mono font-bold animate-pulse">
                  {activeBlocks.length}
                </span>
              )}
            </button>

            {/* 2. BUTTON TO OPEN/CLOSE ACTIVE TRAINS & TRACK SWITCHER MENU */}
            <button
              type="button"
              onClick={() => setIsTrainsMenuOpen((prev) => !prev)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-bold transition-all cursor-pointer shadow-xs ${
                isTrainsMenuOpen
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 ring-2 ring-cyan-400/40 shadow-md'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-cyan-300 border-cyan-500/40'
              }`}
              title="Open/Close Active Trains & Track Switcher Menu"
            >
              <Train className="w-3.5 h-3.5 text-cyan-400" />
              <span>ACTIVE TRAINS & SWITCHER</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-950 text-cyan-200 border border-cyan-500/40 font-mono font-bold">
                {trainsList.length}
              </span>
            </button>

            {/* 3. + DISPATCH TRAIN BUTTON */}
            <button
              type="button"
              onClick={() => setIsDispatchModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border font-bold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-cyan-400 shadow-md transition-all cursor-pointer"
              title="Add a New Train with Custom Origin & Destination Track"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>DISPATCH TRAIN</span>
            </button>

            {/* 4. Recenter View Button */}
            <button
              type="button"
              onClick={handleRecenterView}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 border-slate-700 transition-all cursor-pointer shadow-xs"
              title="Recenter Camera Target to Center-Yard"
            >
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>RECENTER</span>
            </button>

            {/* 5. Full Screen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border font-bold bg-slate-800 hover:bg-slate-700 text-white border-slate-700 shadow-md transition-all cursor-pointer"
              title="Full Screen View"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span>{isFullscreen ? 'EXIT' : 'FULL SCREEN'}</span>
            </button>
          </div>
        </div>

        {/* 3D WebGL Canvas Viewport with MapControls */}
        <div
          className={`relative w-full ${
            isFullscreen ? 'flex-1 min-h-0' : 'h-[620px] sm:h-[700px] lg:h-[760px]'
          } bg-[#0a0e17] select-none overflow-hidden`}
        >
          {/* Three.js Canvas DOM Container */}
          <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

          {/* Floating MapControls Camera HUD (Top Right) */}
          <div className="absolute top-5 right-5 flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-2 rounded-2xl shadow-2xl z-20">
            <button
              type="button"
              onClick={() => {
                if (!cameraRef.current) return;
                cameraRef.current.zoom = Math.min(2.4, cameraRef.current.zoom * 1.2);
                cameraRef.current.updateProjectionMatrix();
              }}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (!cameraRef.current) return;
                cameraRef.current.zoom = Math.max(0.6, cameraRef.current.zoom * 0.8);
                cameraRef.current.updateProjectionMatrix();
              }}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRecenterView}
              className="p-2 rounded-xl text-cyan-400 hover:text-white hover:bg-slate-800 transition-colors border border-cyan-500/30 cursor-pointer"
              title="Recenter View"
            >
              <Compass className="w-4 h-4" />
            </button>
          </div>

          {/* 1. TOGGLEABLE BLOCK DISPATCHER MENU (Only visible when isBlockMenuOpen is TRUE) */}
          {isBlockMenuOpen && (
            <div className="absolute top-5 left-5 bg-slate-900/95 backdrop-blur-md border-2 border-emerald-400 shadow-2xl shadow-emerald-950/70 ring-1 ring-emerald-500/40 p-4 rounded-2xl z-30 w-84 sm:w-96 space-y-3 font-mono animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs font-bold text-slate-200 border-b border-slate-800 pb-2">
                <span className="flex items-center gap-1.5 text-emerald-400 font-black tracking-wide">
                  <Wrench className="w-4 h-4 text-emerald-400" />
                  BLOCK DISPATCHER
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-emerald-300 font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40">
                    5-Track Interlocking
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsBlockMenuOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Close Menu"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 1. Track Selector */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  1. Target Track (1-5):
                </label>
                <div className="grid grid-cols-5 gap-1 text-[11px]">
                  {TRACKS.map((trk) => (
                    <button
                      key={trk.id}
                      type="button"
                      onClick={() => setSelectedTrack(trk.id)}
                      className={`py-1.5 rounded-lg font-bold border transition-colors cursor-pointer ${
                        selectedTrack === trk.id
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md font-bold'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      T{trk.id}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Zone Selector */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  2. Block Zone:
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                  {ZONES.map((zone) => (
                    <button
                      key={zone.id}
                      type="button"
                      onClick={() => setSelectedZone(zone.id)}
                      className={`py-1.5 px-2 rounded-lg font-bold border truncate transition-colors cursor-pointer ${
                        selectedZone === zone.id
                          ? 'bg-emerald-600 text-white border-emerald-400 shadow-md font-bold'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {zone.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Fault Type */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  3. Maintenance Type:
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setSelectedType('P-WAY')}
                    className={`py-1.5 rounded-lg font-bold border flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                      selectedType === 'P-WAY'
                        ? 'bg-red-600 text-white border-red-400 shadow-md'
                        : 'bg-slate-800 text-red-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>P-Way</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedType('OHE')}
                    className={`py-1.5 rounded-lg font-bold border flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                      selectedType === 'OHE'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                        : 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>OHE</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedType('S-T')}
                    className={`py-1.5 rounded-lg font-bold border flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                      selectedType === 'S-T'
                        ? 'bg-indigo-500 text-white border-indigo-400 shadow-md'
                        : 'bg-slate-800 text-indigo-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>S&T</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleApplyBlock}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Enforce Block</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearAll}
                  className="py-2 px-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Clear All Blocks"
                >
                  <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Clear All</span>
                </button>
              </div>

              {/* Active Corridors Under Block List (Inside Dispatcher Menu!) */}
              <div className="pt-2 border-t border-slate-800 space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Enforced Corridors:</span>
                  <span className="text-emerald-400 font-bold">{activeBlocks.length} Active</span>
                </div>

                {activeBlocks.length === 0 ? (
                  <div className="text-slate-500 text-[10px] py-1">
                    ✓ All 5 tracks open. Crossover interlocking clear.
                  </div>
                ) : (
                  <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                    {activeBlocks.map((b, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-1.5 p-1 rounded-lg bg-slate-800/80 border border-slate-700 text-[10px]"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              b.type === 'P-WAY' ? 'bg-red-500 animate-pulse' : b.type === 'OHE' ? 'bg-amber-400' : 'bg-indigo-400'
                            }`}
                          />
                          <span className="font-bold text-white">Track {b.trackId}</span>
                          <span className="text-slate-400 truncate">({b.zoneId})</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveBlock(b.trackId, b.zoneId)}
                          className="text-slate-400 hover:text-red-400 p-0.5 transition-colors cursor-pointer"
                          title="Release Block"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. TOGGLEABLE ACTIVE TRAINS & TRACK SWITCHER MENU (Only visible when isTrainsMenuOpen is TRUE) */}
          {isTrainsMenuOpen && (
            <div className="absolute top-5 right-18 bg-slate-900/95 backdrop-blur-md border border-cyan-500/50 p-4 rounded-2xl shadow-2xl z-30 w-84 sm:w-96 space-y-2.5 font-mono text-xs max-h-[560px] flex flex-col animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs font-bold text-slate-200 border-b border-slate-800 pb-2">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <Train className="w-4 h-4" />
                  ACTIVE TRAINS & SWITCHER
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-cyan-300 font-bold px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/30">
                    {trainsList.length} Active
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsTrainsMenuOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Close Menu"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Train Cards List */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {trainsList.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-800 text-center text-slate-400 space-y-2.5">
                    <p className="text-[11px]">No trains running currently.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDispatchModalOpen(true);
                        setIsTrainsMenuOpen(false);
                      }}
                      className="w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Dispatch a Train</span>
                    </button>
                  </div>
                ) : (
                  trainsList.map((tr) => (
                    <div
                      key={tr.id}
                      className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2 hover:border-cyan-500/50 transition-colors shadow-sm"
                    >
                      {/* Header: Name, Direction, Delete */}
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                            style={{ backgroundColor: `#${tr.primaryColorHex.toString(16).padStart(6, '0')}` }}
                          />
                          <span className="font-bold text-white text-[11px] truncate">{tr.name}</span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* Focus camera button */}
                          <button
                            type="button"
                            onClick={() => focusOnTrain(tr.id)}
                            className="p-1 rounded-lg bg-slate-700 hover:bg-cyan-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title="Center Camera on this Train"
                          >
                            <Navigation className="w-3 h-3" />
                          </button>

                          {/* Delete train button */}
                          <button
                            type="button"
                            onClick={() => deleteTrain(tr.id)}
                            className="p-1 rounded-lg bg-slate-700 hover:bg-red-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title="Delete / Remove Train"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Telemetry Row */}
                      <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-300 bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
                        <div>
                          <span className="text-slate-500">Route: </span>
                          <span className="font-bold text-cyan-300">
                            T{tr.startTrack} ➔ T{tr.assignedTrack}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Current: </span>
                          <span className="font-bold text-amber-300">Track {tr.currentTrack}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Speed: </span>
                          <span className="font-bold text-emerald-300">{Math.round(tr.speed * 55)} km/h</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Progress: </span>
                          <span className="font-bold text-white">{tr.progressPercent}%</span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center justify-between text-[10px]">
                        <span
                          className={`px-1.5 py-0.5 rounded font-bold truncate max-w-[210px] ${
                            tr.status === 'EMERGENCY_STOP'
                              ? 'bg-red-950 text-red-300 border border-red-500/50 animate-pulse'
                              : tr.status === 'DIVERTING'
                              ? 'bg-amber-950 text-amber-300 border border-amber-500/50'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                          }`}
                        >
                          {tr.statusMessage}
                        </span>
                      </div>

                      {/* Live Track Changing Quick Buttons */}
                      <div className="pt-1.5 border-t border-slate-700/60">
                        <div className="text-[10px] font-bold text-slate-400 mb-1 flex items-center justify-between">
                          <span className="flex items-center gap-1 text-cyan-300">
                            <ArrowLeftRight className="w-3 h-3" />
                            Switch to Track:
                          </span>
                          <span className="text-[9px] text-slate-400">Interlocking Switch</span>
                        </div>
                        <div className="grid grid-cols-5 gap-1 text-[10px]">
                          {[1, 2, 3, 4, 5].map((trkId) => (
                            <button
                              key={trkId}
                              type="button"
                              onClick={() => switchTrainTrack(tr.id, trkId)}
                              className={`py-1 rounded font-bold border transition-colors cursor-pointer ${
                                tr.assignedTrack === trkId
                                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                                  : 'bg-slate-700 text-slate-200 border-slate-600 hover:bg-slate-600 hover:text-white'
                              }`}
                              title={`Switch Train to Track ${trkId}`}
                            >
                              T{trkId}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Bottom Quick Dispatch Action */}
              <button
                type="button"
                onClick={() => {
                  setIsDispatchModalOpen(true);
                  setIsTrainsMenuOpen(false);
                }}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-slate-700 hover:border-cyan-500 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Dispatch New Train</span>
              </button>
            </div>
          )}

          {/* Minimal Unobtrusive Log Pill at Bottom Left (Zero Screen Clutter) */}
          <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-xl z-10 text-[10px] text-slate-400 font-mono max-w-md truncate pointer-events-none">
            {eventLogs[0] || 'Interlocking operating normally.'}
          </div>
        </div>

        {/* Bottom Control Bar */}
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-3.5 border-t border-slate-800 bg-slate-950/95 p-4 sm:p-5 font-mono text-xs">
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>Clean 3D View: Left-Click + Drag to Pan • Scroll to Zoom • Use top buttons to toggle Dispatchers</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Pause / Resume Engine — only unique control not in the header */}
            <button
              type="button"
              onClick={() => setIsSimRunning((prev) => !prev)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer font-bold"
            >
              {isSimRunning ? <Pause className="w-3.5 h-3.5 text-cyan-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{isSimRunning ? 'Pause Engine' : 'Resume Engine'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TRAIN DISPATCHER MODAL: ADD TRAIN & SELECT ROUTE (FROM -> TO) */}
      {/* ------------------------------------------------------------- */}
      {isDispatchModalOpen && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#0b121e] border border-cyan-500/40 rounded-3xl w-full max-w-xl shadow-2xl p-6 space-y-5 font-mono text-slate-200 relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <Train className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">DISPATCH TRAIN TO CORRIDOR</h3>
                  <p className="text-xs text-slate-400">Select train livery, travel direction, start track and destination track</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDispatchModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. Train Service Livery Preset */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                1. Select Train Service & Livery:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TRAIN_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setDispatchPresetId(p.id);
                      setDispatchDirection(p.defaultDirection);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      dispatchPresetId === p.id
                        ? 'bg-cyan-950/80 border-cyan-400 ring-1 ring-cyan-400 shadow-md'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: `#${p.primaryColorHex.toString(16).padStart(6, '0')}` }}
                      />
                      <span className="text-[9px] font-bold text-slate-400">{Math.round(p.speed * 55)} km/h</span>
                    </div>
                    <div className="font-bold text-white text-[11px] leading-tight">{p.name.split(' ')[1] || p.name}</div>
                    <div className="text-[9px] text-slate-400 truncate mt-0.5">{p.serviceType}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Direction Selector */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                2. Travel Direction:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDispatchDirection(1)}
                  className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    dispatchDirection === 1
                      ? 'bg-cyan-600 text-white border-cyan-400 shadow-md'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <ArrowRight className="w-4 h-4 text-cyan-300" />
                  <span>Eastbound (➔ West to East)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDispatchDirection(-1)}
                  className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    dispatchDirection === -1
                      ? 'bg-cyan-600 text-white border-cyan-400 shadow-md'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <ArrowRight className="w-4 h-4 text-amber-300 rotate-180" />
                  <span>Westbound (⬅ East to West)</span>
                </button>
              </div>
            </div>

            {/* 3. Origin & Destination Track Selectors */}
            <div className="grid grid-cols-2 gap-4">
              {/* Start Track (From) */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  3. Origin Track (Entry):
                </label>
                <div className="grid grid-cols-5 gap-1 text-[11px]">
                  {TRACKS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setDispatchStartTrack(t.id)}
                      className={`py-2 rounded-lg font-bold border transition-colors cursor-pointer ${
                        dispatchStartTrack === t.id
                          ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      T{t.id}
                    </button>
                  ))}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 truncate">
                  {TRACKS.find((t) => t.id === dispatchStartTrack)?.name}
                </div>
              </div>

              {/* Destination Track (To) */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  4. Destination Track (Exit):
                </label>
                <div className="grid grid-cols-5 gap-1 text-[11px]">
                  {TRACKS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setDispatchTargetTrack(t.id)}
                      className={`py-2 rounded-lg font-bold border transition-colors cursor-pointer ${
                        dispatchTargetTrack === t.id
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      T{t.id}
                    </button>
                  ))}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 truncate">
                  {TRACKS.find((t) => t.id === dispatchTargetTrack)?.name}
                </div>
              </div>
            </div>

            {/* Dynamic Interlocking Route Preview */}
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Interlocking Pathfinding Plan:
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {dispatchStartTrack === dispatchTargetTrack
                    ? `Direct Straight Run on Track ${dispatchStartTrack}`
                    : `Dynamic Ladder Shift: Track ${dispatchStartTrack} ➔ Scissors Turnout ➔ Track ${dispatchTargetTrack}`}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                The Dijkstra routing brain will navigate turnout ladders to switch onto Track {dispatchTargetTrack}, and automatically divert if blocks are encountered.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsDispatchModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  spawnTrain({
                    presetId: dispatchPresetId,
                    direction: dispatchDirection,
                    startTrack: dispatchStartTrack,
                    targetTrack: dispatchTargetTrack,
                    customName: customTrainName,
                  });
                  setIsDispatchModalOpen(false);
                }}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-900/40 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Launch Train to Yard</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StationDigitalTwin3D;
