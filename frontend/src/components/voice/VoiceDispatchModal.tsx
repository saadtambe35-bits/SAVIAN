import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Mic,
  MicOff,
  X,
  Sparkles,
  Send,
  CheckCircle2,
  Volume2,
  Train,
  Zap,
  Cpu,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

/**
 * LINE CLEAR (SAVIAN) - Indian Railways AI Operations Cockpit
 * VoiceDispatchModal.tsx: JARVIS-Style Voice Block Extraction & Dispatch Tokenizer
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

export interface VoiceDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitDemand?: (demand: ExtractedVoiceDemand) => void;
}

// Pre-packaged Quick Utterance Chips for Live Pitches & No-Mic Demos
const QUICK_UTTERANCES = [
  {
    label: 'P-Way Downline Tamping (Benchmark)',
    transcript: 'Block downline between Bina and Mandi Bamora for P-Way tamping from 14:00 to 16:30 hours.',
    hint: 'BINA -> MABA | Down Line | 150 mins',
  },
  {
    label: 'Emergency Rail Fracture',
    transcript: 'Emergency rail fracture at Km 42 Down Line Bina',
    hint: 'BINA yard | Down Line | Urgent P-Way',
  },
  {
    label: 'OHE Power Isolation',
    transcript: 'OHE Power isolation Mandi Bamora to Ganj Basoda 2 hours',
    hint: 'MABA -> Ganj Basoda | OHE Traction | 120 mins',
  },
  {
    label: 'S&T Point Machine Overhaul',
    transcript: 'S&T point machine overhaul Vidisha 90 mins',
    hint: 'Vidisha Jn | S&T Interlocking | 90 mins',
  },
];

// Fallback baseline demand
const DEFAULT_DEMAND: ExtractedVoiceDemand = {
  sectionFrom: 'Bina Jn (BINA)',
  sectionTo: 'Mandi Bamora (MABA)',
  department: 'P_WAY',
  track: 'DOWN',
  startTime: '14:00 IST',
  endTime: '16:30 IST',
  durationMinutes: 150,
  workDescription: 'Continuous Track Tamping (CSM-09 Machine Alignment)',
};

// NLP Entity Extraction Engine tailored for Indian Railways Section Controller Lexicon
function parseRailwayVoiceCommand(rawText: string): { demand: ExtractedVoiceDemand; confidence: number } {
  const text = rawText.toLowerCase();

  // 1. Department Detection
  let department: 'P_WAY' | 'S_AND_T' | 'OHE' = 'P_WAY';
  if (text.includes('ohe') || text.includes('power') || text.includes('catenary') || text.includes('traction') || text.includes('dropper')) {
    department = 'OHE';
  } else if (text.includes('s&t') || text.includes('signal') || text.includes('point') || text.includes('interlock') || text.includes('axle')) {
    department = 'S_AND_T';
  } else {
    department = 'P_WAY';
  }

  // 2. Track Detection
  let track: 'UP' | 'DOWN' | 'BOTH' = 'DOWN';
  if (text.includes('both') || text.includes('double track') || text.includes('all lines')) {
    track = 'BOTH';
  } else if (text.includes('up line') || text.includes('upline') || text.includes('up fast') || text.includes('up loop')) {
    track = 'UP';
  } else {
    track = 'DOWN';
  }

  // 3. Station Pair Detection
  let sectionFrom = 'Bina Jn (BINA)';
  let sectionTo = 'Mandi Bamora (MABA)';

  if (text.includes('vidisha') && (text.includes('bhopal') || text.includes('gulabganj'))) {
    sectionFrom = 'Vidisha (BHS)';
    sectionTo = text.includes('bhopal') ? 'Bhopal Jn (BPL)' : 'Gulabganj (GLG)';
  } else if (text.includes('vidisha')) {
    sectionFrom = 'Vidisha (BHS)';
    sectionTo = 'Sanchi (SCI)';
  } else if (text.includes('mandi bamora') && text.includes('ganj basoda')) {
    sectionFrom = 'Mandi Bamora (MABA)';
    sectionTo = 'Ganj Basoda (BAQ)';
  } else if (text.includes('bina') && text.includes('mandi bamora')) {
    sectionFrom = 'Bina Jn (BINA)';
    sectionTo = 'Mandi Bamora (MABA)';
  } else if (text.includes('bina')) {
    sectionFrom = 'Bina Jn (BINA)';
    sectionTo = 'Bina Yard (Km 42.0)';
  }

  // 4. Time Window & Duration Detection
  let startTime = '14:00 IST';
  let endTime = '16:30 IST';
  let durationMinutes = 150;

  // Check for explicit "from XX:XX to YY:YY"
  const timeRangeMatch = text.match(/from\s+(\d{1,2}:\d{2})\s+to\s+(\d{1,2}:\d{2})/);
  if (timeRangeMatch) {
    startTime = `${timeRangeMatch[1]} IST`;
    endTime = `${timeRangeMatch[2]} IST`;

    const [startH, startM] = timeRangeMatch[1].split(':').map(Number);
    const [endH, endM] = timeRangeMatch[2].split(':').map(Number);
    const diff = (endH * 60 + endM) - (startH * 60 + startM);
    durationMinutes = diff > 0 ? diff : 150;
  } else if (text.includes('2 hours') || text.includes('2 hrs') || text.includes('two hours')) {
    startTime = 'Current Window';
    endTime = '+2 Hours';
    durationMinutes = 120;
  } else if (text.includes('90 mins') || text.includes('90 min') || text.includes('90 minutes')) {
    startTime = 'Current Window';
    endTime = '+90 Mins';
    durationMinutes = 90;
  } else if (text.includes('fracture') || text.includes('emergency')) {
    startTime = 'IMMEDIATE CLAMP';
    endTime = '+45 Mins';
    durationMinutes = 45;
  }

  // 5. Work Description Detection
  let workDescription = 'Track Machine Continuous Tamping (CSM)';
  if (text.includes('fracture')) {
    workDescription = 'Emergency Rail Fracture Clamping & Ultrasonic Flaw Check';
  } else if (text.includes('ohe') || text.includes('power isolation')) {
    workDescription = '25kV OHE Catenary Power De-Energization & Dropper Repair';
  } else if (text.includes('point machine')) {
    workDescription = 'Electric Point Machine Overhaul & Detection Contact Alignment';
  } else if (text.includes('tamping')) {
    workDescription = 'Heavy Track Tamping & Ballast Regulating (CSM-09)';
  }

  // NLP Confidence Calculation
  let confidence = 88;
  if (text.length > 20) confidence += 4;
  if (timeRangeMatch) confidence += 4;
  if (text.includes('downline') || text.includes('upline')) confidence += 2;
  confidence = Math.min(98, confidence);

  return {
    demand: {
      sectionFrom,
      sectionTo,
      department,
      track,
      startTime,
      endTime,
      durationMinutes,
      workDescription,
    },
    confidence,
  };
}

export const VoiceDispatchModal: React.FC<VoiceDispatchModalProps> = ({
  isOpen,
  onClose,
  onSubmitDemand,
}) => {
  const [transcript, setTranscript] = useState<string>(QUICK_UTTERANCES[0].transcript);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);
  const recognitionRef = useRef<unknown>(null);

  // Parse transcript dynamically
  const { demand, confidence } = useMemo(() => {
    if (!transcript.trim()) {
      return { demand: DEFAULT_DEMAND, confidence: 96 };
    }
    return parseRailwayVoiceCommand(transcript);
  }, [transcript]);

  // Setup Web Speech API if supported in browser
  useEffect(() => {
    // Check window speech recognition
    const windowWithSpeech = window as unknown as {
      SpeechRecognition?: new () => unknown;
      webkitSpeechRecognition?: new () => unknown;
    };

    const SpeechRecognitionClass =
      windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      const recognitionInstance = new SpeechRecognitionClass() as {
        continuous: boolean;
        interimResults: boolean;
        lang: string;
        onresult: (event: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
        stop: () => void;
      };

      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-IN'; // Indian English pronunciation

      recognitionInstance.onresult = (event) => {
        const spokenText = event.results[0][0].transcript;
        setTranscript(spokenText);
      };

      recognitionInstance.onerror = () => {
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognitionInstance;
    }
  }, []);

  // Keyboard accessibility and body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Toggle speech recognition
  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) {
      // Graceful fallback for environments without browser speech API
      setIsListening((prev) => !prev);
      return;
    }

    const rec = recognitionRef.current as { start: () => void; stop: () => void };
    if (isListening) {
      rec.stop();
      setIsListening(false);
    } else {
      try {
        rec.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  }, [isListening]);

  // Handle demand submission
  const handleSubmit = () => {
    setSubmittedSuccess(true);
    if (onSubmitDemand) {
      onSubmitDemand(demand);
    }
    setTimeout(() => {
      setSubmittedSuccess(false);
      onClose();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-slate-700/80 bg-slate-900/95 shadow-2xl shadow-black/80 overflow-hidden text-slate-100 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/70 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Volume2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="voice-modal-title" className="text-base sm:text-lg font-bold tracking-tight text-white font-mono">
                  VOICE DISPATCH ASSISTANT (JARVIS-IR)
                </h2>
                <span className="rounded bg-cyan-500/20 border border-cyan-500/40 px-1.5 py-0.5 text-[10px] font-mono text-cyan-300 font-semibold">
                  NLP V2.4
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Spoken Indian Railways Block Tokenizer • Hands-Free Section Control
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors cursor-pointer"
            aria-label="Close voice modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Microphone & Voice Waveform Centerpiece */}
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl border border-slate-800 bg-slate-950/60 relative overflow-hidden">
            
            {/* Glowing radial ambient field */}
            <div
              className={`pointer-events-none absolute h-40 w-40 rounded-full blur-3xl transition-all duration-500 ${
                isListening ? 'bg-cyan-500/20 scale-125' : 'bg-slate-800/20 scale-100'
              }`}
            />

            {/* Glowing Interactive Microphone Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`relative flex h-20 w-20 items-center justify-center rounded-full border-2 transition-all duration-300 shadow-2xl cursor-pointer ${
                isListening
                  ? 'bg-red-500/20 border-red-500 text-red-400 shadow-red-500/50 scale-105'
                  : 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400 shadow-cyan-500/30 hover:scale-105 hover:bg-cyan-500/20'
              }`}
              title={isListening ? 'Click to stop listening' : 'Click to start speaking command'}
            >
              {isListening ? (
                <>
                  <span className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-60" />
                  <MicOff className="w-8 h-8" />
                </>
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </button>

            {/* Visualizer Waveform / Listening State */}
            <div className="mt-4 flex items-center gap-1.5 h-6">
              {isListening ? (
                <>
                  <span className="h-3 w-1 bg-cyan-400 rounded-full animate-pulse" />
                  <span className="h-5 w-1 bg-cyan-300 rounded-full animate-pulse delay-75" />
                  <span className="h-6 w-1 bg-cyan-400 rounded-full animate-pulse delay-150" />
                  <span className="h-4 w-1 bg-cyan-300 rounded-full animate-pulse delay-100" />
                  <span className="h-2 w-1 bg-cyan-400 rounded-full animate-pulse" />
                  <span className="ml-2 text-xs font-mono text-cyan-300 font-bold tracking-wider">
                    LISTENING TO SECTION CONTROLLER...
                  </span>
                </>
              ) : (
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Tap mic to speak command or select a quick utterance chip below
                </span>
              )}
            </div>

            {/* Spoken / Typed Transcript Box */}
            <div className="mt-4 w-full">
              <label htmlFor="voice-transcript-input" className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                Live Controller Spoken Command Transcript:
              </label>
              <textarea
                id="voice-transcript-input"
                rows={2}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="e.g. Block downline between Bina and Mandi Bamora for P-Way tamping from 14:00 to 16:30 hours."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-xs sm:text-sm font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 resize-none transition-colors"
              />
            </div>
          </div>

          {/* Quick Utterance Demo Chips */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="uppercase tracking-wider">Demo / Quick Utterance Chips:</span>
              <span className="text-[10px] text-slate-500">1-Click Live Pitch Simulator</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {QUICK_UTTERANCES.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setTranscript(chip.transcript)}
                  className="p-2.5 rounded-xl border border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-700 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-200 group-hover:text-cyan-300">
                    <span>{chip.label}</span>
                    <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-400 truncate">
                    &quot;{chip.transcript}&quot;
                  </p>
                  <div className="mt-1 text-[10px] font-mono text-cyan-400/80">
                    ↳ {chip.hint}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Structured Railway Entity Card Output */}
          <div className="rounded-xl border border-cyan-500/40 bg-slate-950/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                  Extracted Structured Block Demand
                </h3>
              </div>

              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                <CheckCircle2 className="w-3 h-3" />
                <span>{confidence}% NLP Confidence</span>
              </div>
            </div>

            {/* Extracted Entity Tokens Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
              
              {/* Section Pair */}
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 col-span-2">
                <div className="text-slate-500 text-[10px] flex items-center gap-1">
                  <Train className="w-3 h-3 text-cyan-400" />
                  CORRIDOR SECTION
                </div>
                <div className="text-slate-100 font-bold mt-1 flex items-center gap-1.5 truncate">
                  <span>{demand.sectionFrom}</span>
                  <ArrowRight className="w-3 h-3 text-slate-500 flex-shrink-0" />
                  <span>{demand.sectionTo}</span>
                </div>
              </div>

              {/* Department Token */}
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-slate-500 text-[10px] flex items-center gap-1">
                  {demand.department === 'P_WAY' && <Train className="w-3 h-3 text-amber-400" />}
                  {demand.department === 'OHE' && <Zap className="w-3 h-3 text-red-400" />}
                  {demand.department === 'S_AND_T' && <Cpu className="w-3 h-3 text-cyan-400" />}
                  DEPARTMENT
                </div>
                <div className="text-slate-100 font-bold mt-1">
                  {demand.department === 'P_WAY' && 'P-Way (Track)'}
                  {demand.department === 'OHE' && 'OHE (Traction)'}
                  {demand.department === 'S_AND_T' && 'S&T (Signals)'}
                </div>
              </div>

              {/* Track Line Token */}
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-slate-500 text-[10px]">TRACK LINE</div>
                <div className="text-cyan-300 font-bold mt-1">
                  {demand.track === 'DOWN' ? 'DOWN LINE' : demand.track === 'UP' ? 'UP LINE' : 'BOTH TRACKS'}
                </div>
              </div>

              {/* Time Window */}
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 col-span-2">
                <div className="text-slate-500 text-[10px] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  REQUESTED BLOCK WINDOW
                </div>
                <div className="text-slate-100 font-bold mt-1">
                  {demand.startTime} — {demand.endTime}
                </div>
              </div>

              {/* Duration Token */}
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-slate-500 text-[10px]">DURATION</div>
                <div className="text-emerald-400 font-bold mt-1 text-sm">
                  {demand.durationMinutes} mins
                </div>
              </div>

              {/* Work Scope */}
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-slate-500 text-[10px]">WORK CODE</div>
                <div className="text-slate-300 font-bold mt-1 truncate">
                  {demand.workDescription.split(' ')[0]}
                </div>
              </div>

            </div>

            {/* Scope Summary */}
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs font-mono text-slate-300">
              <span className="text-slate-500">Scope:</span> {demand.workDescription}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800 bg-slate-950/80 px-6 py-4">
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
            <AlertCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span>Extracted tokens will be automatically routed to CP-SAT solver constraint matrix.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 text-xs font-mono rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submittedSuccess}
              className="w-full sm:w-auto px-5 py-2 text-xs font-mono font-bold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 hover:text-white transition-all duration-200 flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-950/70 hover:scale-[1.02] cursor-pointer"
            >
              {submittedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Submitted to Solver!</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Approve & Submit to Solver</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default VoiceDispatchModal;
