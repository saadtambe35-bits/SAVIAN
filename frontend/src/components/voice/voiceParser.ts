/**
 * LINE CLEAR (SAVIAN) - Indian Railways AI Operations Cockpit
 * voiceParser.ts: Resilient NLP Railway Voice Parsing & Tokenizer Engine
 *
 * Architecture: 3-Stage Pipeline
 *   1. normalizeTranscript  — lowercase, fix homophones & phonetics for parse
 *   2. Domain extractors    — extractStations / extractDepartment / extractTrack / extractTime
 *   3. restoreRailwayTranscript — produce pretty, professional display text
 *
 * Calibrated for Indian Railways section controllers:
 *   - Noisy ASR transcripts & phonetic variations
 *   - Hinglish phrasing & homophones ("to hours" → 2 hours)
 *   - Regional Indian accents (Hindi/Marathi/Telugu)
 *   - Station nickname / code lookups (Bina-Itarsi WCR corridor)
 */

export interface ExtractedVoiceDemand {
  sectionFrom: string;
  sectionTo: string;
  department: 'P_WAY' | 'S_AND_T' | 'OHE';
  track: 'UP' | 'DOWN' | 'BOTH';
  startTime: string;
  endTime: string;
  durationMinutes: number;
  workDescription: string;
}

export interface DetectedKeyword {
  category: 'STATION' | 'DEPT' | 'TRACK' | 'TIME' | 'ACTION';
  label: string;
  value: string;
}

export interface ParseResult {
  demand: ExtractedVoiceDemand;
  confidence: number;
  detectedKeywords: DetectedKeyword[];
  restoredTranscript: string;
  formalControlOrder: string;
}

export interface StationDefinition {
  code: string;
  name: string;
  km: number;
  aliases: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// CORRIDOR STATIONS — 14 stations on Bina Jn – Itarsi Jn (WCR, Central India)
// ─────────────────────────────────────────────────────────────────────────────
export const CORRIDOR_STATIONS: StationDefinition[] = [
  {
    code: 'BINA',
    name: 'Bina Jn',
    km: 0,
    aliases: [
      'bina jn', 'bina junction', 'bina station', 'bina',
      'beena jn', 'beena junction', 'beena',
      'veena jn', 'veena junction', 'veena',
      'vinayak', 'vina', 'bna',
    ],
  },
  {
    code: 'MABA',
    name: 'Mandi Bamora',
    km: 17,
    aliases: [
      'mandi bamora jn', 'mandi bamora', 'mandibamora',
      'mandi bamra', 'mandibamra', 'bamora', 'bamra', 'bamore',
      'maba',
    ],
  },
  {
    code: 'BAQ',
    name: 'Ganj Basoda',
    km: 46,
    aliases: [
      'ganj basoda', 'ganjbasoda', 'ganj basuda', 'ganj basodha',
      'gunj basoda', 'basoda', 'basuda', 'baq',
      'bus idhar', 'bas idhar', 'bus idhar problem', 'basidhar', 'basida', 'busida',
    ],
  },
  {
    code: 'GLG',
    name: 'Gulabganj',
    km: 65,
    aliases: [
      'gulabganj jn', 'gulabganj', 'gulab ganj', 'gulabgunj', 'gulab gunj',
      'glg',
    ],
  },
  {
    code: 'BHS',
    name: 'Vidisha',
    km: 85,
    aliases: [
      'vidisha jn', 'vidisha junction', 'vidisha station', 'vidisha',
      'vidisa', 'bidisa', 'bidesha', 'bhs',
    ],
  },
  {
    code: 'SCI',
    name: 'Sanchi',
    km: 95,
    aliases: [
      'sanchi jn', 'sanchi junction', 'sanchi stupa', 'sanchi',
      'sanchee', 'sanci', 'sanxi', 'sci',
    ],
  },
  {
    code: 'SMT',
    name: 'Salamatpur',
    km: 102,
    aliases: [
      'salamatpur jn', 'salamatpur', 'salamat pur', 'salmatpur',
      'smt',
    ],
  },
  {
    code: 'BPL',
    name: 'Bhopal Jn',
    km: 139,
    aliases: [
      'bhopal jn', 'bhopal junction', 'bhopal station', 'bhopal',
      'bopal jn', 'bopal', 'bhoopal', 'bpl',
    ],
  },
  {
    code: 'HBJ',
    name: 'Rani Kamlapati',
    km: 145,
    aliases: [
      'rani kamlapati jn', 'rani kamlapati', 'rani kamalapati', 'kamlapati', 'kamalapati',
      'habibganj jn', 'habibganj', 'habib ganj', 'habibgunj', 'habib gunj',
      'rkmp', 'hbj',
    ],
  },
  {
    code: 'MDDP',
    name: 'Mandi Dip',
    km: 161,
    aliases: [
      'mandi deep', 'mandideep', 'mandi dip', 'mandidip',
      'mddp',
    ],
  },
  {
    code: 'ODG',
    name: 'Obaidulla Ganj',
    km: 174,
    aliases: [
      'obaidulla ganj', 'obaidullaganj', 'obaidulla gunj', 'ubedullaganj',
      'obaidullah', 'odg',
    ],
  },
  {
    code: 'BNI',
    name: 'Budni',
    km: 205,
    aliases: [
      'budni jn', 'budni', 'budhni', 'boodni',
      'bni',
    ],
  },
  {
    code: 'NDPM',
    name: 'Narmadapuram',
    km: 213,
    aliases: [
      'narmadapuram jn', 'narmadapuram', 'narmada puram',
      'hoshangabad jn', 'hoshangabad', 'ndpm',
    ],
  },
  {
    code: 'ET',
    name: 'Itarsi Jn',
    km: 231,
    aliases: [
      'itarsi jn', 'itarsi junction', 'itarsi station', 'itarsi',
      'etarsi jn', 'etarsi', 'aitarsi', 'et',
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// DEPARTMENT PATTERNS — all checked on normalized (lowercase) text
// ─────────────────────────────────────────────────────────────────────────────
const DEPT_PATTERNS = {
  OHE: [
    /\bohe\b/i,
    /\bpower block\b/i, /\bpower isolation\b/i, /\bpower cut\b/i, /\bpower off\b/i,
    /\bohe isolation\b/i, /\bohe power\b/i,
    /\bisolation\b/i,                          // "o h e isolation" after normalise → "ohe isolation"
    /\bpower\b/i, /\bcatenary\b/i, /\bcatnary\b/i, /\btraction\b/i, /\btrd\b/i,
    /\belectrical\b/i, /\bdropper\b/i, /\bdroppers\b/i, /\bpantograph\b/i, /\bpanto\b/i,
    /\bwire\b/i, /\b25\s*kv\b/i, /\btower wagon\b/i, /\btower car\b/i,
    /\bbijli band\b/i, /\bcurrent band\b/i, /\bneutral section\b/i, /\bcantilever\b/i,
  ],
  S_AND_T: [
    /\bs&t\b/i, /\bs & t\b/i, /\bs and t\b/i, /\bsnt\b/i, /\bs and tee\b/i,
    /\bsignal\b/i, /\bsignals\b/i, /\bsignaling\b/i, /\bsignalling\b/i, /\btelecom\b/i,
    /\bpoint machine\b/i, /\bpoint\b/i, /\bpoints\b/i,
    /\binterlock\b/i, /\binterlocking\b/i, /\broute relay\b/i, /\brri\b/i,
    /\belectronic interlocking\b/i, /\baxle counter\b/i, /\baxle\b/i,
    /\baxel counter\b/i, /\bbpac\b/i, /\btrack circuit\b/i, /\bblock instrument\b/i,
    /\bsignal failure\b/i, /\bcable cut\b/i,
  ],
  P_WAY: [
    /\bp-way\b/i, /\bp way\b/i, /\bpway\b/i, /\bpee way\b/i, /\bpee-way\b/i, /\bpeeway\b/i,
    /\bp\.way\b/i, /\bcivil\b/i,
    /\btamping\b/i, /\btemping\b/i,
    /\btv timing\b/i, /\btv tamping\b/i, /\btee vee timing\b/i,
    /\bpacking\b/i, /\bcsm\b/i, /\bduomatic\b/i, /\bballast\b/i, /\bbellast\b/i,
    /\bdeep screening\b/i, /\bbcm\b/i,
    /\bfracture\b/i, /\brail fracture\b/i, /\bweld fracture\b/i,
    /\bwelding\b/i, /\bat welding\b/i, /\balumino thermic\b/i,
    /\brail renewal\b/i, /\btrr\b/i, /\btsr\b/i,
    /\bpatrolling\b/i, /\bgang\b/i, /\bsleeper renewal\b/i, /\bsleeper replacement\b/i,
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// TRACK PATTERNS
// NOTE: TRACK_UP / TRACK_DOWN are checked on normalized text.
//   'online' → normalised to 'upline', so /\bupline\b/ picks it up.
//   'long line' / 'wrong line' → normalised to 'downline', so /\bdownline\b/ picks it up.
//   Both TRACK_BOTH takes explicit "both" / "dono" phrasing ONLY.
// ─────────────────────────────────────────────────────────────────────────────
const TRACK_BOTH = [
  /\bboth\s*lines?\b/i, /\bboth\s*tracks?\b/i,
  /\bdouble\s*line\b/i, /\bdouble\s*track\b/i,
  /\bdono\s*(?:line|lines|track)\b/i, /\bdono\b/i,
  /\ball lines\b/i,
  /\bup and down\b/i, /\bup & down\b/i, /\bdn and up\b/i,
];

const TRACK_UP_STRICT = [
  /\bup line\b/i, /\bupline\b/i, /\bup track\b/i,
  /\bup fast\b/i, /\bup loop\b/i, /\bup main\b/i,
  /\bupar ki line\b/i,
];

const TRACK_DOWN_STRICT = [
  /\bdown line\b/i, /\bdownline\b/i, /\bdown track\b/i,
  /\bdown fast\b/i, /\bdown loop\b/i, /\bdn line\b/i,
  /\bdn track\b/i, /\bdn\b/i, /\bdown main\b/i,
  /\bniche ki line\b/i,
];

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 1: normalizeTranscript
// Converts raw ASR transcript (any case) → clean lowercase "internal" text
// that all extractors run on. Does NOT produce display text.
// ─────────────────────────────────────────────────────────────────────────────
function normalizeTranscript(raw: string): string {
  let t = raw.toLowerCase().trim();

  // ── Station phonetic homophones ──────────────────────────────────────────
  t = t.replace(/\b(?:vinayak|veena|beena|vina)\b/g, 'bina');
  t = t.replace(/\b(?:mandi\s+bamra|mandibamra|bamra)\b/g, 'mandi bamora');
  t = t.replace(/\b(?:bus\s+idhar(?:\s+problem)?|bas\s+idhar|ganj\s+basuda|basuda|gunj\s+basoda)\b/g, 'ganj basoda');
  t = t.replace(/\b(?:gulab\s+gunj|gulabgunj)\b/g, 'gulabganj');
  t = t.replace(/\b(?:bidisa|bidesha|vidisa)\b/g, 'vidisha');
  t = t.replace(/\b(?:sanchee|sanci|sanxi)\b/g, 'sanchi');
  t = t.replace(/\b(?:salmatpur|salamat\s+pur)\b/g, 'salamatpur');
  t = t.replace(/\b(?:bopal|bhoopal)\b/g, 'bhopal');
  t = t.replace(/\b(?:habibgunj|habib\s+ganj|rani\s+kamalapati|kamalapati)\b/g, 'habibganj');
  t = t.replace(/\b(?:mandidip|mandi\s+deep)\b/g, 'mandi dip');
  t = t.replace(/\b(?:ubedullaganj|obaidulla\s+gunj)\b/g, 'obaidulla ganj');
  t = t.replace(/\b(?:budhni|boodni)\b/g, 'budni');
  t = t.replace(/\b(?:hoshangabad|narmada\s+puram)\b/g, 'narmadapuram');
  t = t.replace(/\b(?:etarsi|aitarsi)\b/g, 'itarsi');

  // ── Phonetic department / activity homophones ────────────────────────────
  // "eBay" / "e-bay" → "p-way"
  t = t.replace(/\b(?:ebay|e-bay|e\s+bay|ebuy)\b/g, 'p-way');
  // "pvtmping" / "pvtamping" → "p-way tamping"
  t = t.replace(/\b(?:pvtmping|pvtamping|pv\s+tamping|p\s*v\s*tamping)\b/g, 'p-way tamping');
  // "typing" / "temping" → "tamping"
  t = t.replace(/\b(?:typing|temping)\b/g, 'tamping');
  // "tv timing" / "tee vee timing" → "p-way tamping"
  t = t.replace(/\b(?:tv\s+timing|tv\s+tamping|tee\s+vee\s+timing)\b/g, 'p-way tamping');
  // "pee way" → "p-way"
  t = t.replace(/\b(?:pee\s+way|pee-way|peeway)\b/g, 'p-way');
  // "o h e" / "oh e" → "ohe"
  t = t.replace(/\bo\s+h\s+e\b/g, 'ohe');
  t = t.replace(/\boh\s+e\b/g, 'ohe');
  t = t.replace(/\bo\.h\.e\b/g, 'ohe');
  // "ohe isolation" → "ohe isolation" (already fine, but make compound explicit)
  t = t.replace(/\bohe\s+isolation\b/g, 'ohe isolation');
  // "power block" / "bijli band" → "ohe power isolation"
  t = t.replace(/\b(?:power\s+block|bijli\s+band)\b/g, 'ohe power isolation');
  // "s and t" / "snt" → "s&t"
  t = t.replace(/\b(?:s\s+and\s+t|s\s+and\s+tee|snt)\b/g, 's&t');

  // ── Track homophones ─────────────────────────────────────────────────────
  // "offline" / "long line" / "wrong line" → "downline"
  t = t.replace(/\b(?:offline|off\s+line|off-line|d-offline)\b/g, 'downline');
  t = t.replace(/\b(?:long|wrong|dong|dawn)\s+line\b/g, 'downline');
  // "online" only → "upline" (clear phonetic homophone in IR context)
  t = t.replace(/\bonline\b/g, 'upline');
  t = t.replace(/\boutline\b/g, 'upline');
  // "dono line" → "both lines"
  t = t.replace(/\b(?:dono\s+(?:line|track))\b/g, 'both lines');

  // ── Time homophones ──────────────────────────────────────────────────────
  // "in to 13" / "into 13" → "10 to 13"  (user speaks "10 to 13" but ASR hears "in to 13" / "into 13")
  t = t.replace(/\bin to (\d{1,2})\b/g, (_m, h) => `10 to ${h}`);
  t = t.replace(/\binto (\d{1,2})\b/g, (_m, h) => `10 to ${h}`);
  // "towards" / "to hours" / "too hours" → "2 hours"
  t = t.replace(/\btowards\b(?=\s*(?:from|for|\d))/g, 'for 2 hours');
  t = t.replace(/\btowards\b/g, '2 hours');
  t = t.replace(/\b(?:to|too)\s+(?:hours?|hrs?|ghante?)\b/g, '2 hours');
  t = t.replace(/\bfor\s+(?:to|too)\s+(?:hours?|hrs?|ghante?)\b/g, 'for 2 hours');
  // English number words
  t = t.replace(/\bone\s+(?:hour|hr|ghanta)\b/g, '1 hour');
  t = t.replace(/\btwo\s+(?:hours?|hrs?|ghante?)\b/g, '2 hours');
  t = t.replace(/\bthree\s+(?:hours?|hrs?|ghante?)\b/g, '3 hours');
  t = t.replace(/\bfour\s+(?:hours?|hrs?|ghante?)\b/g, '4 hours');
  t = t.replace(/\bfive\s+(?:hours?|hrs?|ghante?)\b/g, '5 hours');
  t = t.replace(/\bhalf\s+(?:an\s+)?hour\b/g, '30 minutes');
  // Hinglish ghante
  t = t.replace(/\bek\s+ghanta\b/g, '1 hour');
  t = t.replace(/\bdo\s+ghante?\b/g, '2 hours');
  t = t.replace(/\bteen\s+ghante?\b/g, '3 hours');
  t = t.replace(/\bchar\s+ghante?\b/g, '4 hours');
  t = t.replace(/\bdedh\s+ghante?\b/g, '90 minutes');
  t = t.replace(/\bdhai\s+ghante?\b/g, '150 minutes');
  t = t.replace(/\baadha\s+ghanta\b/g, '30 minutes');
  // "3 ghante" → "3 hours"
  t = t.replace(/(\d+)\s+ghante?\b/g, (_m, n) => `${n} hours`);

  // ── Strip filler words ───────────────────────────────────────────────────
  t = t.replace(/\b(?:uh+|um+|please)\b/g, ' ');

  return t.replace(/\s{2,}/g, ' ').trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 3: restoreRailwayTranscript (display-quality restoration)
// Takes RAW text (original case) and applies all phonetic fixes to produce
// a clean, professional Indian Railways dispatch wording shown in the UI.
// ─────────────────────────────────────────────────────────────────────────────
export function restoreRailwayTranscript(raw: string): string {
  if (!raw || !raw.trim()) return '';
  let t = raw.trim();

  // ── Station name restorations ────────────────────────────────────────────
  t = t.replace(/\b(?:vinayak|veena|beena|vina)\b/gi, 'Bina Jn');
  t = t.replace(/\b(?:mandi\s+bamra|mandibamra|bamra)\b/gi, 'Mandi Bamora');
  t = t.replace(/\b(?:bus\s+idhar(?:\s+problem)?|bas\s+idhar|ganj\s+basuda|basuda|gunj\s+basoda)\b/gi, 'Ganj Basoda');
  t = t.replace(/\b(?:gulab\s+gunj|gulabgunj)\b/gi, 'Gulabganj');
  t = t.replace(/\b(?:bidisa|bidesha|vidisa)\b/gi, 'Vidisha');
  t = t.replace(/\b(?:sanchee|sanci|sanxi)\b/gi, 'Sanchi');
  t = t.replace(/\b(?:salmatpur|salamat\s+pur)\b/gi, 'Salamatpur');
  t = t.replace(/\bbopal\b/gi, 'Bhopal Jn');
  t = t.replace(/\bbhoopal\b/gi, 'Bhopal Jn');
  t = t.replace(/\b(?:habibgunj|habib\s+ganj|rani\s+kamalapati|kamalapati)\b/gi, 'Rani Kamlapati');
  t = t.replace(/\b(?:mandidip|mandi\s+deep)\b/gi, 'Mandi Dip');
  t = t.replace(/\b(?:ubedullaganj|obaidulla\s+gunj)\b/gi, 'Obaidulla Ganj');
  t = t.replace(/\b(?:budhni|boodni)\b/gi, 'Budni');
  t = t.replace(/\b(?:hoshangabad|narmada\s+puram)\b/gi, 'Narmadapuram');
  t = t.replace(/\b(?:etarsi|aitarsi)\b/gi, 'Itarsi Jn');

  // ── Department / activity restorations ───────────────────────────────────
  // "eBay" / "ebuy" → "P-Way"
  t = t.replace(/\b(?:ebay|e-bay|e\s+bay|ebuy)\b/gi, 'P-Way');
  // "pvtmping" → "P-Way tamping"
  t = t.replace(/\b(?:pvtmping|pvtamping|pv\s+tamping)\b/gi, 'P-Way tamping');
  // "typing" / "temping" → "tamping"
  t = t.replace(/\b(?:typing|temping)\b/gi, 'tamping');
  // "tv timing" → "P-Way tamping"
  t = t.replace(/\b(?:tv\s+timing|tv\s+tamping|tee\s+vee\s+timing)\b/gi, 'P-Way tamping');
  // "pee way" → "P-Way"
  t = t.replace(/\b(?:pee\s+way|pee-way|peeway|p\s+way)\b/gi, 'P-Way');
  // "o h e" → "OHE"
  t = t.replace(/\bo\s+h\s+e\b/gi, 'OHE');
  t = t.replace(/\boh\s+e\b/gi, 'OHE');
  t = t.replace(/\bo\.h\.e\b/gi, 'OHE');
  // "power block" / "bijli band" / "ohe isolation" → "OHE power isolation"
  t = t.replace(/\b(?:power\s+block|bijli\s+band|power\s+cut)\b/gi, 'OHE power isolation');
  t = t.replace(/\bohe\s+isolation\b/gi, 'OHE power isolation');
  // "s and t" → "S&T"
  t = t.replace(/\b(?:s\s+and\s+t|s\s+and\s+tee|snt)\b/gi, 'S&T');

  // ── Track restorations ────────────────────────────────────────────────────
  t = t.replace(/\b(?:offline|off\s+line|off-line|d-offline)\b/gi, 'downline');
  t = t.replace(/\b(?:long|wrong|dong|dawn)\s+line\b/gi, 'downline');
  t = t.replace(/\bonline\b/gi, 'upline');
  t = t.replace(/\boutline\b/gi, 'upline');
  t = t.replace(/\b(?:dono\s+(?:line|track))\b/gi, 'both lines');

  // ── Duration restorations ────────────────────────────────────────────────
  t = t.replace(/\b(?:towards|to\s+hours?|too\s+hours?)\b/gi, '2 hours');
  t = t.replace(/\bdo\s+ghante?\b/gi, '2 hours');
  t = t.replace(/\bteen\s+ghante?\b/gi, '3 hours');
  t = t.replace(/\bchar\s+ghante?\b/gi, '4 hours');
  t = t.replace(/\bdedh\s+ghante?\b/gi, '90 minutes');
  t = t.replace(/\bdhai\s+ghante?\b/gi, '150 minutes');
  t = t.replace(/\baadha\s+ghanta\b/gi, '30 minutes');
  t = t.replace(/(\d+)\s+ghante?\b/gi, (_, n) => `${n} hours`);

  // ── Time window restorations ──────────────────────────────────────────────
  // "in to 13" / "into 13" → "from 10:00 to 13:00 hrs"
  t = t.replace(/\bin to (\d{1,2})\b/gi, (_, h) => {
    const n = parseInt(h, 10);
    return n >= 0 && n <= 23 ? `from 10:00 to ${String(n).padStart(2, '0')}:00 hrs` : `in to ${h}`;
  });
  t = t.replace(/\binto (\d{1,2})\b/gi, (_, h) => {
    const n = parseInt(h, 10);
    return n >= 0 && n <= 23 ? `from 10:00 to ${String(n).padStart(2, '0')}:00 hrs` : `into ${h}`;
  });
  // General "X to Y hrs" — only if not already colon-formatted
  // "from 14 to 16 hours" → "from 14:00 to 16:00 hrs" (strips trailing 'hours')
  t = t.replace(/(?<![\d:])(?:from\s+)?(\d{1,2})\s+to\s+(\d{1,2})(?!\s*:)\s*(?:hours?|hrs?)?/gi, (m, h1, h2) => {
    const n1 = parseInt(h1, 10), n2 = parseInt(h2, 10);
    if (n1 >= 0 && n1 <= 23 && n2 >= 0 && n2 <= 23) {
      return `from ${String(n1).padStart(2, '0')}:00 to ${String(n2).padStart(2, '0')}:00 hrs`;
    }
    return m;
  });
  // Remove duplicate "ohe ohe" from double substitution
  t = t.replace(/\bohe\s+ohe\b/gi, 'OHE');

  return t.replace(/\s{2,}/g, ' ').trim();
}

export function generateFormalControlOrder(demand: ExtractedVoiceDemand): string {
  const lineStr = demand.track === 'BOTH' ? 'Both Lines (UP & DOWN)' : `${demand.track} Line`;
  return `CONTROL ORDER: Block sanctioned on ${lineStr} between ${demand.sectionFrom} and ${demand.sectionTo} for ${demand.workDescription} [${demand.department}]. Window: ${demand.startTime} to ${demand.endTime} (${demand.durationMinutes} mins).`;
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 2A: extractStations
// ─────────────────────────────────────────────────────────────────────────────
function extractStations(text: string): {
  fromStation: StationDefinition;
  toStation: StationDefinition;
  detectedCount: number;
} {
  const matches: Array<{ station: StationDefinition; index: number }> = [];

  for (const st of CORRIDOR_STATIONS) {
    for (const alias of st.aliases) {
      const escaped = alias.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        matches.push({ station: st, index: match.index });
      }
    }
  }

  // Sort by position in text
  matches.sort((a, b) => a.index - b.index);

  // Keep first occurrence of each station code (position-ordered)
  const distinctStations: StationDefinition[] = [];
  for (const m of matches) {
    if (!distinctStations.some((s) => s.code === m.station.code)) {
      distinctStations.push(m.station);
    }
  }

  if (distinctStations.length >= 2) {
    return { fromStation: distinctStations[0], toStation: distinctStations[1], detectedCount: distinctStations.length };
  }

  if (distinctStations.length === 1) {
    const single = distinctStations[0];
    const idx = CORRIDOR_STATIONS.findIndex((s) => s.code === single.code);
    const adjacent = idx < CORRIDOR_STATIONS.length - 1
      ? CORRIDOR_STATIONS[idx + 1]
      : CORRIDOR_STATIONS[idx - 1];
    return { fromStation: single, toStation: adjacent, detectedCount: 1 };
  }

  return { fromStation: CORRIDOR_STATIONS[0], toStation: CORRIDOR_STATIONS[1], detectedCount: 0 };
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 2B: extractDepartment
// ─────────────────────────────────────────────────────────────────────────────
function extractDepartment(text: string): { department: 'P_WAY' | 'S_AND_T' | 'OHE'; matchedLabel: string } {
  // OHE takes highest priority (power/traction work is operationally critical)
  for (const p of DEPT_PATTERNS.OHE) {
    if (p.test(text)) return { department: 'OHE', matchedLabel: 'OHE (Traction)' };
  }
  for (const p of DEPT_PATTERNS.S_AND_T) {
    if (p.test(text)) return { department: 'S_AND_T', matchedLabel: 'S&T (Signals)' };
  }
  for (const p of DEPT_PATTERNS.P_WAY) {
    if (p.test(text)) return { department: 'P_WAY', matchedLabel: 'P-Way (Track)' };
  }
  return { department: 'P_WAY', matchedLabel: 'P-Way (Track)' };
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 2C: extractTrack
// Prioritises explicit "both" phrasing. Then looks for explicit UP/DOWN.
// When ONLY ambiguous-homophone-derived values exist (e.g. 'upline' from 'online'
// + 'downline' from 'long line'), treats as DOWN (default block direction).
// ─────────────────────────────────────────────────────────────────────────────
function extractTrack(text: string): { track: 'UP' | 'DOWN' | 'BOTH'; matchedLabel: string } {
  // 1. Explicit "both" keywords
  if (TRACK_BOTH.some((p) => p.test(text))) {
    return { track: 'BOTH', matchedLabel: 'Both Lines' };
  }

  // 2. Strict up/down checks (after normalization 'upline' and 'downline' are explicit)
  const hasUp = TRACK_UP_STRICT.some((p) => p.test(text));
  const hasDown = TRACK_DOWN_STRICT.some((p) => p.test(text));

  if (hasUp && !hasDown) return { track: 'UP', matchedLabel: 'Up Line' };
  if (hasDown && !hasUp) return { track: 'DOWN', matchedLabel: 'Down Line' };
  if (hasUp && hasDown) return { track: 'BOTH', matchedLabel: 'Both Lines' };

  // 3. Loose fallback: "up" or "down" as standalone words
  const hasLooseUp = /\bup\b/i.test(text);
  const hasLooseDown = /\bdown\b/i.test(text);
  if (hasLooseUp && !hasLooseDown) return { track: 'UP', matchedLabel: 'Up Line' };
  if (hasLooseDown && !hasLooseUp) return { track: 'DOWN', matchedLabel: 'Down Line' };

  // 4. Default: DOWN (blocks are predominantly on down line in WCR)
  return { track: 'DOWN', matchedLabel: 'Down Line' };
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 2D: extractTime
// ─────────────────────────────────────────────────────────────────────────────
function extractTime(text: string): {
  startTime: string;
  endTime: string;
  durationMinutes: number;
  label: string;
} {
  // 1. AM/PM 12-hour format: "2:30 pm to 4:30 pm"
  const ampmMatch = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:to|-|until|se)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (ampmMatch) {
    let h1 = parseInt(ampmMatch[1], 10), m1 = ampmMatch[2] ? parseInt(ampmMatch[2], 10) : 0;
    let h2 = parseInt(ampmMatch[4], 10), m2 = ampmMatch[5] ? parseInt(ampmMatch[5], 10) : 0;
    const ap1 = ampmMatch[3]?.toLowerCase() ?? null;
    const ap2 = ampmMatch[6].toLowerCase();
    if (ap2 === 'pm' && h2 < 12) h2 += 12;
    if (ap2 === 'am' && h2 === 12) h2 = 0;
    if (ap1 === 'pm' && h1 < 12) h1 += 12;
    else if (ap1 === 'am' && h1 === 12) h1 = 0;
    else if (!ap1 && ap2 === 'pm' && h1 < 12) h1 += 12;
    const sStr = `${String(h1).padStart(2, '0')}:${String(m1).padStart(2, '0')}`;
    const eStr = `${String(h2).padStart(2, '0')}:${String(m2).padStart(2, '0')}`;
    let dur = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (dur <= 0) dur += 1440;
    return { startTime: `${sStr} IST`, endTime: `${eStr} IST`, durationMinutes: dur, label: `${sStr} - ${eStr} (${dur}m)` };
  }

  // 2. Colon format: "14:00 to 16:30"
  const colonMatch = text.match(/(\d{1,2}:\d{2})\s*(?:to|-|until|se)\s*(\d{1,2}:\d{2})/i);
  if (colonMatch) {
    const sStr = colonMatch[1], eStr = colonMatch[2];
    const [sh, sm] = sStr.split(':').map(Number);
    const [eh, em] = eStr.split(':').map(Number);
    let dur = (eh * 60 + em) - (sh * 60 + sm);
    if (dur <= 0) dur += 1440;
    return { startTime: `${sStr} IST`, endTime: `${eStr} IST`, durationMinutes: dur, label: `${sStr} - ${eStr} (${dur}m)` };
  }

  // 3. Military 4-digit: "1400 to 1630"
  const fourDigit = text.match(/\b([01]\d[0-5]\d)\s*(?:to|-|se)\s*([01]\d[0-5]\d)\b/);
  if (fourDigit) {
    const toHHMM = (s: string) => `${s.slice(0, 2)}:${s.slice(2)}`;
    const sStr = toHHMM(fourDigit[1]), eStr = toHHMM(fourDigit[2]);
    const [sh, sm] = sStr.split(':').map(Number);
    const [eh, em] = eStr.split(':').map(Number);
    let dur = (eh * 60 + em) - (sh * 60 + sm);
    if (dur <= 0) dur += 1440;
    return { startTime: `${sStr} IST`, endTime: `${eStr} IST`, durationMinutes: dur, label: `${sStr} - ${eStr} (${dur}m)` };
  }

  // 4. Hour range: "from 14 to 16" / "10 to 13" / "14 se 16"
  const hourRange = text.match(/\b(?:from\s+)?(\d{1,2})\s+(?:to|se|-)\s+(\d{1,2})\b(?!\s*:)/i);
  if (hourRange) {
    const h1 = parseInt(hourRange[1], 10), h2 = parseInt(hourRange[2], 10);
    if (h1 >= 0 && h1 <= 23 && h2 >= 0 && h2 <= 23) {
      const sStr = `${String(h1).padStart(2, '0')}:00`;
      const eStr = `${String(h2).padStart(2, '0')}:00`;
      let dur = (h2 - h1) * 60;
      if (dur <= 0) dur += 1440;
      return { startTime: `${sStr} IST`, endTime: `${eStr} IST`, durationMinutes: dur, label: `${sStr} - ${eStr} (${dur}m)` };
    }
  }

  // 5. Duration: "2 hours" / "90 minutes" / "1.5 hours"
  const hoursMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)\b/i);
  if (hoursMatch) {
    const hrs = parseFloat(hoursMatch[1]);
    const mins = Math.round(hrs * 60);
    return { startTime: 'Current Window', endTime: `+${hrs}h`, durationMinutes: mins, label: `${mins} mins (${hrs}h)` };
  }
  const minsMatch = text.match(/(\d+)\s*(?:minutes?|mins?)\b/i);
  if (minsMatch) {
    const mins = parseInt(minsMatch[1], 10);
    return { startTime: 'Current Window', endTime: `+${mins}m`, durationMinutes: mins, label: `${mins} mins` };
  }

  // 6. Emergency
  if (/fracture|emergency|immediate|urgent/i.test(text)) {
    return { startTime: 'IMMEDIATE CLAMP', endTime: '+45 Mins', durationMinutes: 45, label: 'Immediate Clamp (45m)' };
  }

  // 7. Fallback default window
  return { startTime: '14:00 IST', endTime: '16:30 IST', durationMinutes: 150, label: '14:00 - 16:30 (150m)' };
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 2E: extractWorkDescription
// ─────────────────────────────────────────────────────────────────────────────
function extractWorkDescription(text: string, dept: 'P_WAY' | 'S_AND_T' | 'OHE'): {
  description: string;
  actionLabel: string;
} {
  if (/fracture/i.test(text)) return { description: 'Emergency Rail Fracture Clamping & Ultrasonic Flaw Check', actionLabel: 'Emergency Fracture' };
  if (/\b(?:ohe|power isolation|power cut|power block|power off|catenary|cantilever|isolation)\b/i.test(text)) {
    return { description: '25kV OHE Catenary Power De-Energization & Dropper Repair', actionLabel: 'Power Isolation' };
  }
  if (/\b(?:point machine|point overhaul|interlocking)\b/i.test(text)) return { description: 'Electric Point Machine Overhaul & Detection Contact Alignment', actionLabel: 'Point Machine' };
  if (/\b(?:welding|alumino thermic)\b/i.test(text)) return { description: 'Alumino-Thermic (AT) Rail Joint Welding & Grinding', actionLabel: 'AT Welding' };
  if (/\b(?:tamping|csm|packing)\b/i.test(text)) return { description: 'Heavy Track Tamping & Ballast Regulating (CSM-09)', actionLabel: 'Track Tamping' };
  if (/\b(?:ballast|deep screening|bcm)\b/i.test(text)) return { description: 'Ballast Cleaning Machine (BCM) & Deep Track Screening', actionLabel: 'Ballast Screening' };
  if (/\b(?:signal|signals)\b/i.test(text)) return { description: 'Signal Maintenance & Route Relay Testing', actionLabel: 'Signal Maintenance' };

  switch (dept) {
    case 'OHE': return { description: '25kV OHE Overhead Contact Wire Maintenance & Tower Wagon Inspection', actionLabel: 'OHE Maintenance' };
    case 'S_AND_T': return { description: 'Electronic Interlocking (EI) Routine Diagnostic & Axle Counter Testing', actionLabel: 'Signal Routine' };
    default: return { description: 'Continuous Track Machine Tamping & Ballast Alignment (CSM-09)', actionLabel: 'Track Tamping' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ENTRY POINT
// ─────────────────────────────────────────────────────────────────────────────
export function parseRailwayVoiceCommand(rawText: string): ParseResult {
  const normalized = normalizeTranscript(rawText);
  const keywords: DetectedKeyword[] = [];

  // 1. Department
  const { department, matchedLabel: deptLabel } = extractDepartment(normalized);
  keywords.push({ category: 'DEPT', label: 'Dept', value: deptLabel });

  // 2. Track
  const { track, matchedLabel: trackLabel } = extractTrack(normalized);
  keywords.push({ category: 'TRACK', label: 'Track', value: trackLabel });

  // 3. Stations
  const { fromStation, toStation, detectedCount } = extractStations(normalized);
  const sectionFrom = `${fromStation.name} (${fromStation.code})`;
  const sectionTo = `${toStation.name} (${toStation.code})`;
  if (detectedCount >= 2) {
    keywords.push({ category: 'STATION', label: 'Section', value: `${fromStation.name} → ${toStation.name}` });
  } else if (detectedCount === 1) {
    keywords.push({ category: 'STATION', label: 'Station', value: fromStation.name });
  }

  // 4. Time
  const { startTime, endTime, durationMinutes, label: timeLabel } = extractTime(normalized);
  keywords.push({ category: 'TIME', label: 'Window', value: timeLabel });

  // 5. Work description
  const { description: workDescription, actionLabel } = extractWorkDescription(normalized, department);
  keywords.push({ category: 'ACTION', label: 'Action', value: actionLabel });

  // 6. Deduplicate keywords by category (safety guard)
  const seen = new Set<string>();
  const deduplicatedKeywords = keywords.filter((kw) => {
    if (seen.has(kw.category)) return false;
    seen.add(kw.category);
    return true;
  });

  // 7. Confidence Score
  let confidence = 82;
  if (normalized.length > 12) confidence += 4;
  if (detectedCount >= 2) confidence += 6;
  else if (detectedCount === 1) confidence += 3;
  if (deduplicatedKeywords.length >= 4) confidence += 4;
  if (/\d{1,2}:\d{2}|\b\d+\s*(?:hours?|hrs?|mins?|minutes?)\b/i.test(normalized)) confidence += 4;
  confidence = Math.min(99, confidence);

  const demand: ExtractedVoiceDemand = {
    sectionFrom, sectionTo, department, track,
    startTime, endTime, durationMinutes, workDescription,
  };

  const restoredTranscript = restoreRailwayTranscript(rawText);
  const formalControlOrder = generateFormalControlOrder(demand);

  return { demand, confidence, detectedKeywords: deduplicatedKeywords, restoredTranscript, formalControlOrder };
}
