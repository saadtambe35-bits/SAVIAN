// frontend/test_full_suite.js
// Comprehensive Frontend QA & Logic Fortification Test Suite

import {
  minutesToTime,
  timeToMinutes,
  formatDuration,
  DEPARTMENT_CONFIG,
  SEVERITY_CONFIG,
  TRAIN_TYPE_COLORS,
} from './src/lib/utils.ts';
import { MOCK_STATIONS } from './src/data/mockData.ts';
import { parseRailwayVoiceCommand } from './src/components/voice/voiceParser.ts';

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  passedTests++;
}

console.log('======================================================');
console.log('🚆 LINE CLEAR - FRONTEND LOGIC & INTEGRITY TEST SUITE');
console.log('======================================================\n');

// 1. Time Utilities Verification
console.log('--- 1. Testing Time & Duration Utilities ---');
assert(minutesToTime(0) === '00:00', 'minutesToTime(0) must be 00:00');
assert(minutesToTime(60) === '01:00', 'minutesToTime(60) must be 01:00');
assert(minutesToTime(870) === '14:30', 'minutesToTime(870) must be 14:30');
assert(minutesToTime(1439) === '23:59', 'minutesToTime(1439) must be 23:59');

assert(timeToMinutes('00:00') === 0, 'timeToMinutes(00:00) must be 0');
assert(timeToMinutes('01:00') === 60, 'timeToMinutes(01:00) must be 60');
assert(timeToMinutes('14:30') === 870, 'timeToMinutes(14:30) must be 870');
assert(timeToMinutes('23:59') === 1439, 'timeToMinutes(23:59) must be 1439');

// Round-trip identity test across all 24 hours
for (let m = 0; m < 1440; m += 15) {
  const timeStr = minutesToTime(m);
  const back = timeToMinutes(timeStr);
  assert(back === m, `Round trip failed for minute ${m} -> ${timeStr} -> ${back}`);
}

assert(formatDuration(30) === '30m', 'formatDuration(30) must be 30m');
assert(formatDuration(60) === '1h', 'formatDuration(60) must be 1h');
assert(formatDuration(90) === '1h 30m', 'formatDuration(90) must be 1h 30m');
assert(formatDuration(120) === '2h', 'formatDuration(120) must be 2h');
assert(formatDuration(150) === '2h 30m', 'formatDuration(150) must be 2h 30m');
console.log('  ✓ Time & duration utilities passed 100%');

// 2. Station Data & Corridor Chainage Integrity
console.log('\n--- 2. Testing Corridor Station Chainage Integrity ---');
assert(Array.isArray(MOCK_STATIONS), 'MOCK_STATIONS must be an array');
assert(MOCK_STATIONS.length >= 10, 'Corridor must have at least 10 key stations');

const stationCodes = new Set();
let prevKm = -1;
for (const st of MOCK_STATIONS) {
  assert(Boolean(st.code), 'Station must have code');
  assert(!stationCodes.has(st.code), `Duplicate station code: ${st.code}`);
  stationCodes.add(st.code);
  assert(typeof st.distance_km === 'number', `distance_km must be number for ${st.code}`);
  assert(st.distance_km >= prevKm, `Station ${st.code} distance (${st.distance_km}) must be >= previous (${prevKm})`);
  prevKm = st.distance_km;
}
assert(stationCodes.has('BINA'), 'BINA must exist in corridor stations');
assert(stationCodes.has('ET') || stationCodes.has('BPL'), 'ET or BPL must exist in corridor stations');
console.log('  ✓ Corridor stations monotonic chainage passed 100%');

// 3. Configuration & Theme Consistency
console.log('\n--- 3. Testing Theme Config & Styling Constants ---');
assert(Boolean(DEPARTMENT_CONFIG.P_WAY), 'DEPARTMENT_CONFIG.P_WAY must exist');
assert(Boolean(DEPARTMENT_CONFIG.OHE), 'DEPARTMENT_CONFIG.OHE must exist');
assert(Boolean(DEPARTMENT_CONFIG.S_AND_T), 'DEPARTMENT_CONFIG.S_AND_T must exist');
assert(Boolean(SEVERITY_CONFIG.CRITICAL), 'SEVERITY_CONFIG.CRITICAL must exist');
assert(Boolean(SEVERITY_CONFIG.HIGH), 'SEVERITY_CONFIG.HIGH must exist');
assert(Boolean(SEVERITY_CONFIG.MEDIUM), 'SEVERITY_CONFIG.MEDIUM must exist');
assert(Boolean(SEVERITY_CONFIG.LOW), 'SEVERITY_CONFIG.LOW must exist');
assert(Boolean(TRAIN_TYPE_COLORS.RAJDHANI), 'TRAIN_TYPE_COLORS.RAJDHANI must exist');
assert(Boolean(TRAIN_TYPE_COLORS.VANDE_BHARAT), 'TRAIN_TYPE_COLORS.VANDE_BHARAT must exist');
assert(Boolean(TRAIN_TYPE_COLORS.EXPRESS), 'TRAIN_TYPE_COLORS.EXPRESS must exist');
console.log('  ✓ Configuration invariants passed 100%');

// 4. Voice Parser Robustness Suite (Key Critical Regressions)
console.log('\n--- 4. Testing Railway Voice Parsing Engine ---');
const keyVoiceCases = [
  {
    name: 'Bina to Mandi Bamora P-Way 2.5 hours',
    input: 'Block downline between Bina and Mandi Bamora for P-Way tamping from 14:00 to 16:30 hours.',
    validate: (res) => res.demand.sectionFrom.includes('BINA') && res.demand.sectionTo.includes('MABA') && res.demand.department === 'P_WAY' && res.demand.durationMinutes === 150
  },
  {
    name: 'Emergency fracture km 42 Bina',
    input: 'Emergency rail fracture at Km 42 Down Line Bina',
    validate: (res) => res.demand.sectionFrom.includes('BINA') && res.demand.track === 'DOWN' && res.demand.department === 'P_WAY'
  },
  {
    name: 'Hinglish: do ghante Mandi Bamora',
    input: 'Bina se Mandi Bamora do ghante P-Way',
    validate: (res) => res.demand.sectionFrom.includes('BINA') && res.demand.sectionTo.includes('MABA') && res.demand.durationMinutes === 120
  },
  {
    name: 'Phonetic: Veena for Bina',
    input: 'Veena downline for P-Way 2 hours',
    validate: (res) => res.demand.sectionFrom.includes('BINA') && res.demand.durationMinutes === 120
  },
  {
    name: 'Colloquial: bijli band OHE power isolation',
    input: 'Mandi Bamora to Ganj Basoda bijli band 2 hours',
    validate: (res) => res.demand.department === 'OHE' && res.demand.durationMinutes === 120
  },
];

for (const tc of keyVoiceCases) {
  const result = parseRailwayVoiceCommand(tc.input);
  assert(tc.validate(result), `Voice parser failed for: ${tc.name}`);
}
console.log('  ✓ Voice parsing engine critical cases passed 100%');

console.log('\n======================================================');
console.log(`🏁 FRONTEND TEST SUITE SUMMARY: ${passedTests}/${totalTests} TESTS PASSED (100%)`);
console.log('🌟 ZERO REGRESSIONS, ZERO INVARIANTS VIOLATED!');
console.log('======================================================');
