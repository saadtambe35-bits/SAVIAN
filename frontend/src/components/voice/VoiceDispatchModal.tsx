import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { encodeWAV } from './wavEncoder';
import { transcribeAudioApi } from '@/lib/api';
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
  RotateCcw,
} from 'lucide-react';
import {
  ExtractedVoiceDemand,
  DetectedKeyword,
  parseRailwayVoiceCommand,
  restoreRailwayTranscript,
  generateFormalControlOrder,
  CORRIDOR_STATIONS,
} from './voiceParser';

export type { ExtractedVoiceDemand, DetectedKeyword };

/**
 * LINE CLEAR (SAVIAN) - Indian Railways AI Operations Cockpit
 * VoiceDispatchModal.tsx: BHOLU-Style Voice Block Extraction & Dispatch Tokenizer
 */

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

export const VoiceDispatchModal: React.FC<VoiceDispatchModalProps> = ({
  isOpen,
  onClose,
  onSubmitDemand,
}) => {
  const [transcript, setTranscript] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [micPermissionState, setMicPermissionState] = useState<'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [audioBars, setAudioBars] = useState<number[]>([6, 10, 16, 12, 8, 14, 20, 15, 9, 12, 18, 7]);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);
  const [autoClean, setAutoClean] = useState<boolean>(true);
  const [rawSpeechHeard, setRawSpeechHeard] = useState<string>('');

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Parse transcript dynamically
  const { demand, confidence, detectedKeywords, restoredTranscript, formalControlOrder } = useMemo(() => {
    if (!transcript.trim()) {
      return {
        demand: DEFAULT_DEMAND,
        confidence: 96,
        detectedKeywords: [],
        restoredTranscript: '',
        formalControlOrder: '',
      };
    }
    return parseRailwayVoiceCommand(transcript);
  }, [transcript]);

  // Debounced auto-clean when speech pauses or user stops typing (if autoClean is ON)
  useEffect(() => {
    if (!autoClean || !transcript.trim() || isListening) return;
    const timer = setTimeout(() => {
      const cleaned = restoreRailwayTranscript(transcript);
      if (cleaned && cleaned !== transcript) {
        setTranscript(cleaned);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [transcript, autoClean, isListening]);

  const pcmChunksRef = useRef<Float32Array[]>([]);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  // Clean up Web Audio resources
  const stopAudioAnalyser = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch {}
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAudioBars([6, 10, 16, 12, 8, 14, 20, 15, 9, 12, 18, 7]);
  }, []);

  // Start real-time Web Audio analyser on microphone input
  const startAudioAnalyser = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      // Buffer raw PCM audio chunks for universal backend speech transcription (Brave, Firefox, Safari, Chrome)
      pcmChunksRef.current = [];
      try {
        const processor = audioCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;
        processor.onaudioprocess = (e) => {
          if (!isListeningRef.current) return;
          const input = e.inputBuffer.getChannelData(0);
          pcmChunksRef.current.push(new Float32Array(input));
        };
        source.connect(processor);
        processor.connect(audioCtx.destination);
      } catch (procErr) {
        console.warn('ScriptProcessor audio tap warning:', procErr);
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateBars = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Sample 12 representative frequency bins and compute height
        const barCount = 12;
        const step = Math.max(1, Math.floor(bufferLength / barCount));
        const newBars: number[] = [];

        for (let i = 0; i < barCount; i++) {
          const rawVal = dataArray[i * step] || 0;
          // Scale raw 0-255 byte value to bar height between 4px and 34px
          const scaledHeight = Math.max(4, Math.min(34, Math.round((rawVal / 255) * 34)));
          newBars.push(scaledHeight);
        }

        setAudioBars(newBars);
        animationFrameRef.current = requestAnimationFrame(updateBars);
      };

      updateBars();
      setMicPermissionState('granted');
      return true;
    } catch (err: any) {
      console.warn('Microphone permission / AudioContext not available:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicPermissionState('denied');
        setStatusMessage('Microphone access blocked. Please allow mic permissions in your browser address bar.');
      } else {
        setStatusMessage('Unable to access microphone: ' + (err.message || 'unknown error'));
      }
      return false;
    }
  }, []);

  const isListeningRef = useRef<boolean>(false);

  // Stop listening helper & trigger universal transcription
  const stopListening = useCallback(async () => {
    isListeningRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    // Capture recorded audio samples before tearing down audio context
    const chunks = [...pcmChunksRef.current];
    const sampleRate = audioContextRef.current?.sampleRate || 16000;
    stopAudioAnalyser();
    setIsListening(false);

    // If autoClean is active, polish current transcript immediately
    if (autoClean) {
      setTranscript((curr) => {
        const cleaned = restoreRailwayTranscript(curr);
        return cleaned || curr;
      });
    }

    // If audio samples were recorded, dispatch to universal FastAPI backend STT endpoint
    if (chunks.length > 0) {
      setStatusMessage('Transcribing speech across universal engine...');
      const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
      if (totalLen > 6000) {
        const merged = new Float32Array(totalLen);
        let offset = 0;
        for (const chunk of chunks) {
          merged.set(chunk, offset);
          offset += chunk.length;
        }

        try {
          const wavBlob = encodeWAV(merged, sampleRate);
          const backendTranscript = await transcribeAudioApi(wavBlob);
          if (backendTranscript && backendTranscript.trim()) {
            const raw = backendTranscript.trim();
            setRawSpeechHeard(raw);
            const polished = autoClean ? restoreRailwayTranscript(raw) : raw;
            setTranscript(polished);
            setStatusMessage(`✅ Transcribed: "${polished.slice(-35)}"`);
          } else {
            setStatusMessage('Ready. Tap mic or edit command text.');
          }
        } catch (transcribeErr) {
          console.warn('Backend transcription fallback error:', transcribeErr);
          setStatusMessage('Ready. Command captured.');
        }
      } else {
        setStatusMessage('Recording was too short. Speak full command.');
      }
    } else {
      setStatusMessage('');
    }
  }, [stopAudioAnalyser, autoClean]);

  // Start fresh speech recognition session
  const startListeningSession = useCallback(() => {
    const windowWithSpeech = window as any;
    const SpeechRecognitionClass =
      windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setMicPermissionState('unsupported');
      setStatusMessage('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    // Abort any old recognition instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    try {
      const rec = new SpeechRecognitionClass();
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.lang = 'en-IN'; // Indian English pronunciation & vocabulary

      rec.onstart = () => {
        isListeningRef.current = true;
        setIsListening(true);
        setMicPermissionState('granted');
        setStatusMessage('🔴 Live listening: Speak your railway command now...');
      };

      rec.onspeechstart = () => {
        setStatusMessage('Voice detected: streaming speech to text...');
      };

      rec.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = 0; i < event.results.length; ++i) {
          const item = event.results[i];
          const textChunk = item[0]?.transcript || '';
          if (item.isFinal) {
            finalTranscript += textChunk + ' ';
          } else {
            interimTranscript += textChunk;
          }
        }

        const combined = (finalTranscript + interimTranscript).trim();
        if (combined) {
          setTranscript(combined);
          setStatusMessage(`Heard: "${combined.slice(-35)}"`);
        }
      };

      rec.onerror = (event: any) => {
        console.warn('Speech recognition error event:', event.error);
        if (event.error === 'not-allowed') {
          setMicPermissionState('denied');
          setStatusMessage('Microphone access blocked. Click the lock/tune icon in your browser URL bar to allow microphone.');
          stopListening();
        } else if (event.error === 'no-speech') {
          setStatusMessage('No voice detected. Please speak closer to your mic or tap quick keywords below.');
        } else if (event.error === 'network') {
          setStatusMessage('Network timeout to Google Speech service. (If using Brave, enable Google Speech in brave://settings/privacy).');
        } else if (event.error === 'audio-capture') {
          setStatusMessage('No microphone hardware detected or mic is busy in another app.');
        } else if (event.error !== 'aborted') {
          setStatusMessage(`Speech error: ${event.error}`);
        }
      };

      rec.onend = () => {
        // If user still wanted to be listening, restart fresh instance
        if (isListeningRef.current) {
          try {
            rec.start();
            return;
          } catch {
            // failed to restart
          }
        }
        setIsListening(false);
        stopAudioAnalyser();
      };

      recognitionRef.current = rec;
      rec.start();
      isListeningRef.current = true;
      setIsListening(true);
      setStatusMessage('Requesting microphone access from browser...');

      // In parallel, start audio waveform analyser non-blockingly
      startAudioAnalyser().catch(() => {});
    } catch (err: any) {
      console.error('Failed to start speech recognition instance:', err);
      setStatusMessage('Could not start speech recognition: ' + (err.message || 'unknown error'));
      setIsListening(false);
      isListeningRef.current = false;
    }
  }, [startAudioAnalyser, stopListening]);

  // Toggle speech recognition & microphone
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListeningSession();
    }
  }, [isListening, startListeningSession, stopListening]);

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

  // Reset current voice dispatch session
  const handleReset = useCallback(() => {
    stopListening();
    setTranscript('');
    setStatusMessage('Session reset. Ready for new voice command.');
    setRawSpeechHeard('');
    setSubmittedSuccess(false);
  }, [stopListening]);

  // Clean up when modal closes & reset state when freshly opened
  useEffect(() => {
    if (isOpen) {
      setTranscript('');
      setStatusMessage('');
      setRawSpeechHeard('');
      setSubmittedSuccess(false);
    } else {
      stopListening();
    }
  }, [isOpen, stopListening]);

  // Handle demand submission
  const handleSubmit = () => {
    setSubmittedSuccess(true);
    if (onSubmitDemand) {
      onSubmitDemand(demand);
    }
    setTimeout(() => {
      setSubmittedSuccess(false);
      setTranscript('');
      onClose();
    }, 1200);
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-stone-900/60 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl sm:max-w-3xl rounded-3xl border border-stone-200/80 bg-[#FAF7F2]/95 backdrop-blur-2xl shadow-2xl overflow-hidden text-stone-900 my-auto flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 skin-glass-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-stone-200/60 bg-white/40 px-6 py-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-300/40 text-emerald-800 shadow-xs">
              <Volume2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="voice-modal-title" className="text-base sm:text-lg font-bold tracking-tight text-stone-900">
                  Voice Dispatch Assistant (BHOLU)
                </h2>
                <span className="cockpit-dark-chip text-[10px] font-mono text-emerald-300 font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 led-glow-emerald" />
                  NLP V2.4
                </span>
              </div>
              <p className="text-xs text-stone-500 font-medium">
                Spoken Indian Railways Block Tokenizer • Hands-Free Section Control
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-stone-400 hover:bg-[#eae4d5] hover:text-stone-700 transition-colors cursor-pointer"
            aria-label="Close voice modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 bg-[#faf8f3]">
          
          {/* Microphone & Voice Waveform Centerpiece */}
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl border border-[#ded8c9] bg-white shadow-sm relative overflow-hidden">
            
            {/* Ambient field */}
            <div
              className={`pointer-events-none absolute h-40 w-40 rounded-full blur-3xl transition-all duration-500 ${
                isListening ? 'bg-rose-500/15 scale-125' : 'bg-emerald-600/10 scale-100'
              }`}
            />

            {/* Interactive Microphone Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`relative flex h-20 w-20 items-center justify-center rounded-full border-2 transition-all duration-300 shadow-lg cursor-pointer ${
                isListening
                  ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-rose-500/25 scale-105'
                  : 'bg-emerald-50 border-emerald-700 text-emerald-800 shadow-emerald-800/15 hover:scale-105 hover:bg-emerald-100'
              }`}
              title={isListening ? 'Click to stop listening' : 'Click to start speaking command'}
            >
              {isListening ? (
                <>
                  <span className="absolute inset-0 rounded-full border-2 border-rose-400 animate-ping opacity-60" />
                  <MicOff className="w-8 h-8" />
                </>
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </button>

            {/* Real-Time Audio Visualizer Waveform & Status */}
            <div className="mt-4 flex flex-col items-center gap-2">
              <div className="flex items-center gap-1 h-9 px-3 py-1 rounded-xl bg-[#f4efe4]/80 border border-[#ded8c9]">
                {audioBars.map((height, idx) => (
                  <span
                    key={idx}
                    className={`w-1.5 rounded-full transition-all duration-75 ${
                      isListening
                        ? 'bg-gradient-to-t from-emerald-700 to-emerald-500'
                        : 'bg-stone-300'
                    }`}
                    style={{ height: `${height}px` }}
                  />
                ))}
              </div>

              {/* Status Message / Listening Cue */}
              <div className="flex items-center gap-1.5 text-xs font-mono">
                {isListening ? (
                  <span className="flex items-center gap-2 text-emerald-800 font-bold tracking-wide">
                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                    <span>{statusMessage || 'LIVE LISTENING: Speak into your microphone...'}</span>
                  </span>
                ) : micPermissionState === 'denied' ? (
                  <span className="text-rose-700 font-medium text-[11px] text-center">
                    ⚠️ Microphone access denied. Please allow microphone in your browser URL bar.
                  </span>
                ) : micPermissionState === 'unsupported' ? (
                  <span className="text-amber-800 font-medium text-[11px] text-center">
                    Speech recognition not supported in this browser. You can type in the box below.
                  </span>
                ) : (
                  <span className="text-stone-500 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                    Tap mic to speak command or select a quick utterance chip below
                  </span>
                )}
              </div>
            </div>

            {/* Spoken / Typed Transcript Box */}
            <div className="mt-4 w-full">
              <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
                <div className="flex items-center gap-2">
                  <label htmlFor="voice-transcript-input" className="block text-[11px] font-mono uppercase text-stone-500 font-semibold">
                    Live Spoken Command Transcript:
                  </label>
                  <button
                    type="button"
                    onClick={() => setAutoClean(!autoClean)}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer ${
                      autoClean
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-stone-200 text-stone-600 border border-stone-300'
                    }`}
                    title="Toggle auto-converting spoken accents and ASR inaccuracies into clean Indian Railways terminology"
                  >
                    ✨ Auto-Clean: {autoClean ? 'ON' : 'OFF'}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {transcript && restoredTranscript && restoredTranscript !== transcript && (
                    <button
                      type="button"
                      onClick={() => setTranscript(restoredTranscript)}
                      className="text-[10px] font-mono font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 bg-emerald-100/70 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 cursor-pointer transition-colors shadow-2xs"
                      title="Replace current transcript with restored Indian Railways terms"
                    >
                      <Sparkles className="w-3 h-3 text-emerald-700" />
                      Polish to Railway Lexicon
                    </button>
                  )}
                  {transcript && (
                    <button
                      type="button"
                      onClick={() => setTranscript('')}
                      className="text-[10px] font-mono text-stone-400 hover:text-stone-700 cursor-pointer transition-colors"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-[10px] font-mono text-stone-500 hover:text-rose-700 flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-stone-200/60 border border-transparent hover:border-stone-300 cursor-pointer transition-colors"
                    title="Reset voice command session fresh"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                </div>
              </div>

              <textarea
                id="voice-transcript-input"
                rows={2}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Speak or type (e.g. Block downline between Bina and Mandi Bamora for P-Way tamping from 14:00 to 16:30 hours)"
                className="w-full bg-[#f4efe4] border border-[#ded8c9] rounded-xl p-3 text-xs sm:text-sm font-mono text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-emerald-700 focus:bg-white resize-none transition-colors"
              />

              {/* Polish Suggestion Chip if raw differs from restored */}
              {transcript.trim() && restoredTranscript && restoredTranscript !== transcript && (
                <div className="mt-1.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-emerald-50/95 border border-emerald-300 text-[11px] font-mono text-emerald-900 shadow-2xs">
                  <div className="flex items-start gap-1.5 flex-1 min-w-0">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0 mt-0.5" />
                    <div className="text-[11px] leading-relaxed break-words">
                      <span className="font-semibold text-emerald-950">Restored Railway Text: </span>
                      <span className="italic text-emerald-900">{restoredTranscript}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTranscript(restoredTranscript)}
                    className="self-end sm:self-center flex-shrink-0 px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    Apply Clean Text
                  </button>
                </div>
              )}

              {/* Quick Append Keyword Chips */}
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                <span className="text-[10px] text-stone-400 mr-0.5">Insert Token:</span>
                {[
                  { label: '+ Bina → MABA', text: 'between Bina and Mandi Bamora' },
                  { label: '+ Vidisha → Bhopal', text: 'between Vidisha and Bhopal' },
                  { label: '+ Down Line', text: 'on down line' },
                  { label: '+ Up Line', text: 'on up line' },
                  { label: '+ P-Way Tamping', text: 'for P-Way tamping' },
                  { label: '+ OHE Isolation', text: 'for OHE power isolation' },
                  { label: '+ 2 Hours', text: 'for 2 hours' },
                  { label: '+ 14:00 to 16:30', text: 'from 14:00 to 16:30 hours' },
                ].map((token, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setTranscript((prev) => (prev ? `${prev.trim()} ${token.text}` : token.text));
                    }}
                    className="px-2 py-0.5 rounded-md bg-[#f4efe4] hover:bg-[#eae4d5] border border-[#ded8c9] text-stone-700 text-[10px] transition-colors cursor-pointer"
                  >
                    {token.label}
                  </button>
                ))}
              </div>

              {/* Live Detected Keywords Strip */}
              {detectedKeywords.length > 0 && (
                <div className="mt-2.5 w-full p-2.5 rounded-xl bg-[#f7f4ec] border border-[#e5dfd3] flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-mono uppercase font-bold text-stone-500 flex items-center gap-1 mr-1">
                    <Sparkles className="w-3 h-3 text-emerald-700" />
                    Detected Keywords:
                  </span>
                  {detectedKeywords.map((kw, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-white border border-[#ded8c9] text-emerald-900 shadow-xs"
                    >
                      <span className="text-stone-400 font-normal">{kw.label}:</span>
                      <span className="text-emerald-800 font-bold">{kw.value}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Formal Railway Dispatch Order Preview */}
              {transcript.trim() && formalControlOrder && (
                <div className="mt-2.5 w-full p-2.5 rounded-xl bg-gradient-to-r from-emerald-50/90 to-amber-50/80 border border-emerald-300/80 shadow-xs flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase font-bold text-emerald-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                      Formal Controller Dispatch Order:
                    </span>
                    <button
                      type="button"
                      onClick={() => setTranscript(formalControlOrder)}
                      className="text-[9px] font-mono font-bold text-emerald-800 hover:text-emerald-950 bg-white border border-emerald-300 px-2 py-0.5 rounded shadow-2xs hover:bg-emerald-100 transition-colors cursor-pointer"
                    >
                      Use as Transcript
                    </button>
                  </div>
                  <div className="text-xs font-mono text-stone-800 bg-white/95 p-2 rounded-lg border border-emerald-200/80 leading-relaxed select-text">
                    {formalControlOrder}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Utterance Demo Chips */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-stone-600">
              <span className="uppercase tracking-wider font-semibold">Demo / Quick Utterance Chips:</span>
              <span className="text-[10px] text-stone-400">1-Click Live Pitch Simulator</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {QUICK_UTTERANCES.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setTranscript(chip.transcript)}
                  className="p-3 rounded-xl border border-[#ded8c9] bg-white hover:bg-[#fbf9f4] hover:border-emerald-700/40 text-left transition-all cursor-pointer shadow-sm group"
                >
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-stone-800 group-hover:text-emerald-800">
                    <span>{chip.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-emerald-700 transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <p className="mt-1 text-[11px] text-stone-600 truncate">
                    &quot;{chip.transcript}&quot;
                  </p>
                  <div className="mt-1.5 text-[10px] font-mono text-emerald-700 font-semibold">
                    ↳ {chip.hint}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Structured Railway Entity Card Output */}
          <div className="rounded-xl border border-[#ded8c9] bg-white p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <h3 className="text-xs font-mono font-bold text-stone-800 uppercase tracking-wider">
                  Extracted Structured Block Demand
                </h3>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-mono font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>{confidence}% NLP Confidence</span>
              </div>
            </div>

            {/* Extracted Entity Tokens Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
              
              {/* Section Pair */}
              <div className="p-2.5 rounded-lg bg-[#f7f4ec] border border-[#e5dfd3] col-span-2">
                <div className="text-stone-500 text-[10px] flex items-center gap-1 font-semibold">
                  <Train className="w-3 h-3 text-emerald-700" />
                  CORRIDOR SECTION
                </div>
                <div className="text-stone-900 font-bold mt-1 flex items-center gap-1.5 truncate">
                  <span>{demand.sectionFrom}</span>
                  <ArrowRight className="w-3 h-3 text-stone-400 flex-shrink-0" />
                  <span>{demand.sectionTo}</span>
                </div>
              </div>

              {/* Department Token */}
              <div className="p-2.5 rounded-lg bg-[#f7f4ec] border border-[#e5dfd3]">
                <div className="text-stone-500 text-[10px] flex items-center gap-1 font-semibold">
                  {demand.department === 'P_WAY' && <Train className="w-3 h-3 text-amber-700" />}
                  {demand.department === 'OHE' && <Zap className="w-3 h-3 text-rose-700" />}
                  {demand.department === 'S_AND_T' && <Cpu className="w-3 h-3 text-emerald-700" />}
                  DEPARTMENT
                </div>
                <div className="text-stone-900 font-bold mt-1">
                  {demand.department === 'P_WAY' && 'P-Way (Track)'}
                  {demand.department === 'OHE' && 'OHE (Traction)'}
                  {demand.department === 'S_AND_T' && 'S&T (Signals)'}
                </div>
              </div>

              {/* Track Line Token */}
              <div className="p-2.5 rounded-lg bg-[#f7f4ec] border border-[#e5dfd3]">
                <div className="text-stone-500 text-[10px] font-semibold">TRACK LINE</div>
                <div className="text-emerald-800 font-bold mt-1">
                  {demand.track === 'DOWN' ? 'DOWN LINE' : demand.track === 'UP' ? 'UP LINE' : 'BOTH TRACKS'}
                </div>
              </div>

              {/* Time Window */}
              <div className="p-2.5 rounded-lg bg-[#f7f4ec] border border-[#e5dfd3] col-span-2">
                <div className="text-stone-500 text-[10px] flex items-center gap-1 font-semibold">
                  <Clock className="w-3 h-3 text-amber-700" />
                  REQUESTED BLOCK WINDOW
                </div>
                <div className="text-stone-900 font-bold mt-1">
                  {demand.startTime} — {demand.endTime}
                </div>
              </div>

              {/* Duration Token */}
              <div className="p-2.5 rounded-lg bg-[#f7f4ec] border border-[#e5dfd3]">
                <div className="text-stone-500 text-[10px] font-semibold">DURATION</div>
                <div className="text-emerald-800 font-bold mt-1 text-sm">
                  {demand.durationMinutes} mins
                </div>
              </div>

              {/* Work Scope */}
              <div className="p-2.5 rounded-lg bg-[#f7f4ec] border border-[#e5dfd3]">
                <div className="text-stone-500 text-[10px] font-semibold">WORK CODE</div>
                <div className="text-stone-800 font-bold mt-1 truncate">
                  {demand.workDescription.split(' ')[0]}
                </div>
              </div>

            </div>

            {/* Scope Summary */}
            <div className="p-2.5 rounded-lg bg-[#f7f4ec] border border-[#e5dfd3] text-xs font-mono text-stone-700">
              <span className="text-stone-500 font-semibold">Scope:</span> {demand.workDescription}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#e5dfd3] bg-[#f4efe4] px-6 py-4 flex-shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-stone-500 font-mono">
            <AlertCircle className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span>Extracted tokens will be automatically routed to CP-SAT solver constraint matrix.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 text-xs font-mono rounded-xl bg-white hover:bg-[#eae4d5] text-stone-700 transition-colors border border-[#ded8c9] font-medium cursor-pointer shadow-sm"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submittedSuccess}
              className="w-full sm:w-auto px-5 py-2 text-xs font-mono font-bold rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white transition-all duration-200 flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/20 hover:scale-[1.02] cursor-pointer"
            >
              {submittedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
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

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};

export default VoiceDispatchModal;
