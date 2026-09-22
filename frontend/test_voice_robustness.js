// test_voice_robustness.js
// Automated "Try & Run" Verification Suite for Railway Voice Parsing Engine

import { parseRailwayVoiceCommand } from './src/components/voice/voiceParser.ts';

const testCases = [
  // --- 1. Standard Benchmark Utterances ---
  {
    name: 'Benchmark: P-Way Downline Tamping',
    input: 'Block downline between Bina and Mandi Bamora for P-Way tamping from 14:00 to 16:30 hours.',
    expected: {
      fromCode: 'BINA',
      toCode: 'MABA',
      track: 'DOWN',
      dept: 'P_WAY',
      durationMinutes: 150,
    }
  },
  {
    name: 'Benchmark: Emergency Rail Fracture',
    input: 'Emergency rail fracture at Km 42 Down Line Bina',
    expected: {
      fromCode: 'BINA',
      track: 'DOWN',
      dept: 'P_WAY',
      durationMinutes: 45,
    }
  },
  {
    name: 'Benchmark: OHE Power Isolation 2 Hours',
    input: 'OHE Power isolation Mandi Bamora to Ganj Basoda 2 hours',
    expected: {
      fromCode: 'MABA',
      toCode: 'BAQ',
      track: 'DOWN',
      dept: 'OHE',
      durationMinutes: 120,
    }
  },
  {
    name: 'Benchmark: S&T Point Machine Overhaul',
    input: 'S&T point machine overhaul Vidisha 90 mins',
    expected: {
      fromCode: 'BHS',
      track: 'DOWN',
      dept: 'S_AND_T',
      durationMinutes: 90,
    }
  },

  // --- 2. Station Phonetic Mishearings (ASR Accents) ---
  {
    name: 'Misheard Veena for Bina',
    input: 'Power block from Veena to Mandi Bamora downline 2 hours',
    expected: {
      fromCode: 'BINA',
      toCode: 'MABA',
      track: 'DOWN',
      dept: 'OHE',
      durationMinutes: 120,
    }
  },
  {
    name: 'Misheard Beena Junction',
    input: 'Tamping between Beena Junction and Bamora up line 3 hours',
    expected: {
      fromCode: 'BINA',
      toCode: 'MABA',
      track: 'UP',
      dept: 'P_WAY',
      durationMinutes: 180,
    }
  },
  {
    name: 'Misheard Ganj Basuda for Ganj Basoda',
    input: 'P-Way welding between Mandibamora and Ganj Basuda 2 hrs',
    expected: {
      fromCode: 'MABA',
      toCode: 'BAQ',
      track: 'DOWN',
      dept: 'P_WAY',
      durationMinutes: 120,
    }
  },
  {
    name: 'Misheard Bopal for Bhopal Jn',
    input: 'OHE catenary inspection Bopal Jn to Habibganj both tracks 2 hours',
    expected: {
      fromCode: 'BPL',
      toCode: 'HBJ',
      track: 'BOTH',
      dept: 'OHE',
      durationMinutes: 120,
    }
  },
  {
    name: 'Misheard Sanchee for Sanchi',
    input: 'Signal maintenance Vidisha to Sanchee upline 60 minutes',
    expected: {
      fromCode: 'BHS',
      toCode: 'SCI',
      track: 'UP',
      dept: 'S_AND_T',
      durationMinutes: 60,
    }
  },
  {
    name: 'Misheard Etarsi for Itarsi',
    input: 'Track tamping Narmadapuram to Etarsi downline from 10:00 to 12:00',
    expected: {
      fromCode: 'NDPM',
      toCode: 'ET',
      track: 'DOWN',
      dept: 'P_WAY',
      durationMinutes: 120,
    }
  },
  {
    name: 'Misheard Bidisa for Vidisha',
    input: 'Point machine failure Bidisa station up line',
    expected: {
      fromCode: 'BHS',
      track: 'UP',
      dept: 'S_AND_T',
    }
  },
  {
    name: 'Misheard Mandi Bamra and Gulab Gunj',
    input: 'P-way track renewal between Mandi Bamra and Gulab Gunj 3 hours',
    expected: {
      fromCode: 'MABA',
      toCode: 'GLG',
      track: 'DOWN',
      dept: 'P_WAY',
      durationMinutes: 180,
    }
  },

  // --- 3. Homophones ("to hours" -> 2 hours) ---
  {
    name: 'Homophone: "to hours"',
    input: 'OHE power block Bina to Mandi Bamora to hours',
    expected: {
      fromCode: 'BINA',
      toCode: 'MABA',
      dept: 'OHE',
      durationMinutes: 120,
    }
  },
  {
    name: 'Homophone: "too hours"',
    input: 'CSM tamping Bhopal to Mandi Dip too hours up line',
    expected: {
      fromCode: 'BPL',
      toCode: 'MDDP',
      track: 'UP',
      dept: 'P_WAY',
      durationMinutes: 120,
    }
  },
  {
    name: 'Homophone: "for to hours"',
    input: 'Block Obaidulla Ganj to Budni for to hours downline',
    expected: {
      fromCode: 'ODG',
      toCode: 'BNI',
      track: 'DOWN',
      durationMinutes: 120,
    }
  },
  {
    name: 'Homophone: "one hour"',
    input: 'S&T testing Vidisha one hour',
    expected: {
      fromCode: 'BHS',
      dept: 'S_AND_T',
      durationMinutes: 60,
    }
  },
  {
    name: 'Homophone: "three hours"',
    input: 'BCM deep screening between Salamatpur and Bhopal three hours',
    expected: {
      fromCode: 'SMT',
      toCode: 'BPL',
      dept: 'P_WAY',
      durationMinutes: 180,
    }
  },

  // --- 4. Hinglish Railway Controller Phrasing ---
  {
    name: 'Hinglish: "Bina se Mandi Bamora do ghante"',
    input: 'Bina se Mandi Bamora down line do ghante ke liye block chahiye',
    expected: {
      fromCode: 'BINA',
      toCode: 'MABA',
      track: 'DOWN',
      durationMinutes: 120,
    }
  },
  {
    name: 'Hinglish: "dedh ghanta" (90 mins)',
    input: 'OHE wire work Vidisha se Sanchi dedh ghante up track',
    expected: {
      fromCode: 'BHS',
      toCode: 'SCI',
      track: 'UP',
      dept: 'OHE',
      durationMinutes: 90,
    }
  },
  {
    name: 'Hinglish: "aadha ghanta" (30 mins)',
    input: 'Point machine check at Bhopal aadha ghanta',
    expected: {
      fromCode: 'BPL',
      dept: 'S_AND_T',
      durationMinutes: 30,
    }
  },
  {
    name: 'Hinglish: "dhai ghante" (150 mins)',
    input: 'P-way welding between Budni and Narmadapuram dhai ghante',
    expected: {
      fromCode: 'BNI',
      toCode: 'NDPM',
      dept: 'P_WAY',
      durationMinutes: 150,
    }
  },
  {
    name: 'Hinglish: "dono line" (both tracks)',
    input: 'Bhopal to Rani Kamlapati dono line 2 hours power block',
    expected: {
      fromCode: 'BPL',
      toCode: 'HBJ',
      track: 'BOTH',
      dept: 'OHE',
      durationMinutes: 120,
    }
  },
  {
    name: 'Hinglish: "bijli band"',
    input: 'Bijli band chahiye Mandi Bamora to Ganj Basoda 2 hours',
    expected: {
      fromCode: 'MABA',
      toCode: 'BAQ',
      dept: 'OHE',
      durationMinutes: 120,
    }
  },

  // --- 5. Station Code Usage (Telephonic Shortforms) ---
  {
    name: 'Station Codes: BINA to MABA',
    input: 'CSM tamping BINA to MABA downline 14:00 to 16:00',
    expected: {
      fromCode: 'BINA',
      toCode: 'MABA',
      track: 'DOWN',
      dept: 'P_WAY',
      durationMinutes: 120,
    }
  },
  {
    name: 'Station Codes: BAQ to GLG',
    input: 'Block BAQ to GLG up track 2 hours OHE',
    expected: {
      fromCode: 'BAQ',
      toCode: 'GLG',
      track: 'UP',
      dept: 'OHE',
      durationMinutes: 120,
    }
  },
  {
    name: 'Station Codes: BHS to SCI',
    input: 'S&T axle counter overhaul BHS to SCI 90 mins',
    expected: {
      fromCode: 'BHS',
      toCode: 'SCI',
      dept: 'S_AND_T',
      durationMinutes: 90,
    }
  },
  {
    name: 'Station Codes: RKMP to MDDP',
    input: 'Emergency rail fracture RKMP to MDDP down line',
    expected: {
      fromCode: 'HBJ',
      toCode: 'MDDP',
      track: 'DOWN',
      dept: 'P_WAY',
      durationMinutes: 45,
    }
  },

  // --- 6. Time Format Variations ---
  {
    name: 'Military 4-digit: "1400 to 1630"',
    input: 'P-Way block Bina to Mandi Bamora 1400 to 1630 downline',
    expected: {
      fromCode: 'BINA',
      toCode: 'MABA',
      track: 'DOWN',
      dept: 'P_WAY',
      durationMinutes: 150,
    }
  },
  {
    name: 'Single hour digits: "from 10 to 13"',
    input: 'Track maintenance Vidisha to Sanchi from 10 to 13 upline',
    expected: {
      fromCode: 'BHS',
      toCode: 'SCI',
      track: 'UP',
      dept: 'P_WAY',
      durationMinutes: 180,
    }
  },
  {
    name: 'Hindi time word: "14 se 16"',
    input: 'OHE block Mandi Bamora to Ganj Basoda 14 se 16',
    expected: {
      fromCode: 'MABA',
      toCode: 'BAQ',
      dept: 'OHE',
      durationMinutes: 120,
    }
  },
  {
    name: 'Fractional hours: "1.5 hours"',
    input: 'Axle counter testing Bhopal to Rani Kamlapati 1.5 hours',
    expected: {
      fromCode: 'BPL',
      toCode: 'HBJ',
      dept: 'S_AND_T',
      durationMinutes: 90,
    }
  },
  {
    name: 'Minutes only: "45 minutes"',
    input: 'Point motor inspection Budni 45 minutes',
    expected: {
      fromCode: 'BNI',
      dept: 'S_AND_T',
      durationMinutes: 45,
    }
  },

  // --- 7. Directional Sensitivity & Corridor Inversion ---
  {
    name: 'Reverse corridor: Itarsi to Bhopal',
    input: 'Itarsi to Bhopal upline OHE tower wagon 3 hours',
    expected: {
      fromCode: 'ET',
      toCode: 'BPL',
      track: 'UP',
      dept: 'OHE',
      durationMinutes: 180,
    }
  },
  {
    name: 'Reverse corridor: Vidisha to Bina',
    input: 'Vidisha to Bina up line tamping 2 hours',
    expected: {
      fromCode: 'BHS',
      toCode: 'BINA',
      track: 'UP',
      dept: 'P_WAY',
      durationMinutes: 120,
    }
  },

  // --- 8. Track Detection Variations ---
  {
    name: 'Track: "both lines"',
    input: 'Deep screening between Gulabganj and Vidisha both lines 4 hours',
    expected: {
      fromCode: 'GLG',
      toCode: 'BHS',
      track: 'BOTH',
      dept: 'P_WAY',
      durationMinutes: 240,
    }
  },
  {
    name: 'Track: "up and down"',
    input: 'OHE power shutdown Mandi Dip to Obaidulla Ganj up and down 2 hours',
    expected: {
      fromCode: 'MDDP',
      toCode: 'ODG',
      track: 'BOTH',
      dept: 'OHE',
      durationMinutes: 120,
    }
  },
  {
    name: 'Track: "dn track"',
    input: 'Welding between Sanchi and Salamatpur dn track 90 mins',
    expected: {
      fromCode: 'SCI',
      toCode: 'SMT',
      track: 'DOWN',
      dept: 'P_WAY',
      durationMinutes: 90,
    }
  },
  {
    name: 'Track: "up fast"',
    input: 'CSM tamping Bhopal to Mandi Dip up fast 2 hours',
    expected: {
      fromCode: 'BPL',
      toCode: 'MDDP',
      track: 'UP',
      dept: 'P_WAY',
      durationMinutes: 120,
    }
  },

  // --- 9. Department Detection Nuances ---
  {
    name: 'Dept: "catenary & pantograph"',
    input: 'Catenary wire repair near Narmadapuram up line 2 hours',
    expected: {
      fromCode: 'NDPM',
      track: 'UP',
      dept: 'OHE',
      durationMinutes: 120,
    }
  },
  {
    name: 'Dept: "electronic interlocking"',
    input: 'Electronic interlocking diagnostic at Itarsi Jn 2 hours',
    expected: {
      fromCode: 'ET',
      dept: 'S_AND_T',
      durationMinutes: 120,
    }
  },
  {
    name: 'Dept: "ballast unloading"',
    input: 'Ballast unloading between Ganj Basoda and Gulabganj downline 2 hours',
    expected: {
      fromCode: 'BAQ',
      toCode: 'GLG',
      track: 'DOWN',
      dept: 'P_WAY',
      durationMinutes: 120,
    }
  },
  {
    name: 'Dept: "AT welding"',
    input: 'AT welding rail joints between Salamatpur and Sanchi upline 2 hours',
    expected: {
      fromCode: 'SMT',
      toCode: 'SCI',
      track: 'UP',
      dept: 'P_WAY',
      durationMinutes: 120,
    }
  },
  {
    name: 'Dept: "pee way" phonetic',
    input: 'Pee way tamping Bina to Mandi Bamora 2 hours downline',
    expected: {
      fromCode: 'BINA',
      toCode: 'MABA',
      track: 'DOWN',
      dept: 'P_WAY',
      durationMinutes: 120,
    }
  },
  {
    name: 'Dept: "s and t" phonetic',
    input: 'S and T point machine overhaul at Vidisha 90 mins',
    expected: {
      fromCode: 'BHS',
      dept: 'S_AND_T',
      durationMinutes: 90,
    }
  },
  {
    name: 'Dept: "current band"',
    input: 'Current band Mandideep to Obaidulla Ganj 2 hours up line',
    expected: {
      fromCode: 'MDDP',
      toCode: 'ODG',
      track: 'UP',
      dept: 'OHE',
      durationMinutes: 120,
    }
  },

  // --- 10. Single-Station Inferences ---
  {
    name: 'Single station: Vidisha fracture',
    input: 'Emergency rail fracture at Vidisha down line',
    expected: {
      fromCode: 'BHS',
      track: 'DOWN',
      dept: 'P_WAY',
      durationMinutes: 45,
    }
  },
  {
    name: 'Single station: Itarsi terminus',
    input: 'Point machine failure at Itarsi',
    expected: {
      fromCode: 'ET',
      dept: 'S_AND_T',
    }
  },
  {
    name: 'Single station: Bina yard',
    input: 'OHE tower wagon inspection at Bina 2 hours',
    expected: {
      fromCode: 'BINA',
      dept: 'OHE',
      durationMinutes: 120,
    }
  },

  // --- 11. Advanced Stress & Real-World ASR Inaccuracies ---
  {
    name: 'Reverse word order: track first',
    input: 'Down line Bina to Mandi Bamora block 2 hours',
    expected: {
      fromCode: 'BINA',
      toCode: 'MABA',
      track: 'DOWN',
      durationMinutes: 120,
    }
  },
  {
    name: 'Messy punctuation & mixed casing',
    input: 'bina, mandi-bamora: p.way tamping for 2.5 hours!',
    expected: {
      fromCode: 'BINA',
      toCode: 'MABA',
      dept: 'P_WAY',
      durationMinutes: 150,
    }
  },
  {
    name: 'Historical station name: Hoshangabad',
    input: 'Hoshangabad to Itarsi downline 2 hours',
    expected: {
      fromCode: 'NDPM',
      toCode: 'ET',
      track: 'DOWN',
      durationMinutes: 120,
    }
  },
  {
    name: 'Historical station name: Habibganj to Bhopal',
    input: 'Habibganj to Bhopal up line 1 hour',
    expected: {
      fromCode: 'HBJ',
      toCode: 'BPL',
      track: 'UP',
      durationMinutes: 60,
    }
  },
  {
    name: '12-Hour AM/PM: 2:30 pm to 4:30 pm',
    input: 'OHE catenary check Vidisha to Sanchi 2:30 pm to 4:30 pm',
    expected: {
      fromCode: 'BHS',
      toCode: 'SCI',
      dept: 'OHE',
      durationMinutes: 120,
    }
  },
  {
    name: '12-Hour AM/PM: 9 am to 11 am',
    input: 'Track machine packing Mandi Bamora to Ganj Basoda 9 am to 11 am',
    expected: {
      fromCode: 'MABA',
      toCode: 'BAQ',
      dept: 'P_WAY',
      durationMinutes: 120,
    }
  },
  {
    name: 'Hindi number: "teen ghante" (3 hours)',
    input: 'Bina to Mandi Bamora teen ghante up line',
    expected: {
      fromCode: 'BINA',
      toCode: 'MABA',
      track: 'UP',
      durationMinutes: 180,
    }
  },
  {
    name: 'Hindi number: "char ghante" (4 hours)',
    input: 'Vidisha char ghante block downline',
    expected: {
      fromCode: 'BHS',
      track: 'DOWN',
      durationMinutes: 240,
    }
  },
  {
    name: 'Sleeper replacement P-Way',
    input: 'Sleeper replacement between Budni and Narmadapuram up line 3 hrs',
    expected: {
      fromCode: 'BNI',
      toCode: 'NDPM',
      track: 'UP',
      dept: 'P_WAY',
      durationMinutes: 180,
    }
  },
  {
    name: 'Rail renewal P-Way',
    input: 'Rail renewal Rani Kamlapati to Mandideep dn line 2 hours',
    expected: {
      fromCode: 'HBJ',
      toCode: 'MDDP',
      track: 'DOWN',
      dept: 'P_WAY',
      durationMinutes: 120,
    }
  },
  {
    name: 'Interlocking failure S&T',
    input: 'Interlocking failure at BHS station',
    expected: {
      fromCode: 'BHS',
      dept: 'S_AND_T',
    }
  },
  {
    name: 'Block instrument failure S&T',
    input: 'Block instrument failure at GLG',
    expected: {
      fromCode: 'GLG',
      dept: 'S_AND_T',
    }
  },
  {
    name: '25kV wire snapping OHE immediate',
    input: '25 kv wire snapping between BAQ and GLG immediate',
    expected: {
      fromCode: 'BAQ',
      toCode: 'GLG',
      dept: 'OHE',
      durationMinutes: 45,
    }
  },
  {
    name: 'Full Jn names with 150 mins',
    input: 'Bina junction to Mandi Bamra Jn both lines for 150 mins',
    expected: {
      fromCode: 'BINA',
      toCode: 'MABA',
      track: 'BOTH',
      durationMinutes: 150,
    }
  },
  {
    name: 'CSM machine alignment with Obaidullah Ganj',
    input: 'CSM-09 machine alignment between Obaidullah Ganj and Budni 2 hours',
    expected: {
      fromCode: 'ODG',
      toCode: 'BNI',
      dept: 'P_WAY',
      durationMinutes: 120,
    }
  },
  {
    name: "User Live Spoken: 'Vinayak offline TV timing towards from 15 to 16 bus idhar problem'",
    input: 'Vinayak offline TV timing towards from 15 to 16 bus idhar problem',
    expected: {
      fromCode: 'BINA',
      toCode: 'BAQ',
      track: 'DOWN',
      dept: 'P_WAY',
      durationMinutes: 60,
    }
  },
  {
    name: "User Live Spoken: 'eBay online typing in to 13 o h e isolation Vidisha to Bhopal long line pvtmping'",
    input: 'eBay online typing in to 13 o h e isolation Vidisha to Bhopal long line pvtmping',
    expected: {
      fromCode: 'BHS',
      toCode: 'BPL',
      track: 'BOTH',
      dept: 'OHE',
      durationMinutes: 180,
    }
  },
  {
    name: "Phonetic P-Way & 10 to 13 hours: 'eBay tamping in to 13 Vidisha to Bhopal downline'",
    input: 'eBay tamping in to 13 Vidisha to Bhopal downline',
    expected: {
      fromCode: 'BHS',
      toCode: 'BPL',
      track: 'DOWN',
      dept: 'P_WAY',
      durationMinutes: 180,
    }
  },
];

console.log(`\n======================================================`);
console.log(`🚀 STARTING VOICE ROBUSTNESS TEST SUITE (${testCases.length} CASES)`);
console.log(`======================================================\n`);

let passed = 0;
let failed = 0;
const failures = [];

for (let i = 0; i < testCases.length; i++) {
  const tc = testCases[i];
  const res = parseRailwayVoiceCommand(tc.input);
  const d = res.demand;

  let tcPass = true;
  const errs = [];

  if (tc.expected.fromCode && !d.sectionFrom.includes(tc.expected.fromCode)) {
    tcPass = false;
    errs.push(`Expected fromCode=${tc.expected.fromCode}, got ${d.sectionFrom}`);
  }

  if (tc.expected.toCode && !d.sectionTo.includes(tc.expected.toCode)) {
    tcPass = false;
    errs.push(`Expected toCode=${tc.expected.toCode}, got ${d.sectionTo}`);
  }

  if (tc.expected.track && d.track !== tc.expected.track) {
    tcPass = false;
    errs.push(`Expected track=${tc.expected.track}, got ${d.track}`);
  }

  if (tc.expected.dept && d.department !== tc.expected.dept) {
    tcPass = false;
    errs.push(`Expected dept=${tc.expected.dept}, got ${d.department}`);
  }

  if (tc.expected.durationMinutes && d.durationMinutes !== tc.expected.durationMinutes) {
    tcPass = false;
    errs.push(`Expected duration=${tc.expected.durationMinutes}, got ${d.durationMinutes}`);
  }

  if (tcPass) {
    passed++;
    console.log(`✅ [${i + 1}/${testCases.length}] PASS: ${tc.name}`);
  } else {
    failed++;
    console.error(`❌ [${i + 1}/${testCases.length}] FAIL: ${tc.name}`);
    for (const e of errs) {
      console.error(`     ↳ ${e}`);
    }
    failures.push({ name: tc.name, input: tc.input, errs });
  }
}

console.log(`\n======================================================`);
console.log(`🏁 TEST RESULTS: ${passed}/${testCases.length} PASSED (${Math.round((passed / testCases.length) * 100)}%)`);
if (failed > 0) {
  console.log(`❌ ${failed} FAILED CASES.`);
  process.exit(1);
} else {
  console.log(`🌟 100% PERFECTION ACHIEVED! ALL TEST CASES PASSED!`);
  console.log(`======================================================\n`);
  process.exit(0);
}
