import { Music } from "lucide-react";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import { audioEngine } from "../../audio/ToneEngine";
import { useStudioStore } from "../../store/useStudioStore";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const WHITE_INDICES = [0, 2, 4, 5, 7, 9, 11];
const BLACK_INDICES = [1, 3, 6, 8, 10];
const BASE_OCTAVE = 4;

interface PointerNote {
  note: string;
  pointerId: number;
}

function midiToNote(midi: number): string {
  const note = NOTE_NAMES[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${note}${octave}`;
}

export const SmartPiano = memo(function SmartPiano() {
  const currentInstrument = useStudioStore((state) => state.currentInstrument);
  const mixer = useStudioStore((state) => state.mixer);
  const bpm = useStudioStore((state) => state.bpm);
  const addPerformanceEvent = useStudioStore((state) => state.addPerformanceEvent);
  const chords = useStudioStore((state) => state.chords);
  const currentChord = useStudioStore((state) => state.currentChord);
  const setCurrentChord = useStudioStore((state) => state.setCurrentChord);

  const [activeNotes, setActiveNotes] = useState<Record<string, number>>({});
  const pointers = useRef<Map<number, PointerNote>>(new Map());

  const selectedChord = useMemo(() => chords.find((c) => c.id === currentChord) ?? chords[0], [chords, currentChord]);

  const ensureAudio = useCallback(() => {
    void audioEngine.ensureReady(currentInstrument, mixer, bpm);
  }, [bpm, currentInstrument, mixer]);

  const noteOn = useCallback((note: string, pointerId: number) => {
    const nonce = performance.now();
    setActiveNotes((prev) => ({ ...prev, [note]: nonce }));
    audioEngine.playChord(note, "chord");
    pointers.current.set(pointerId, { note, pointerId });
    addPerformanceEvent({
      chordName: note,
      notes: [note],
      mode: "chord",
      instrument: currentInstrument,
      durationMs: 300
    });
    window.navigator.vibrate?.(5);
  }, [addPerformanceEvent, currentInstrument]);

  const noteOff = useCallback((note: string, pointerId: number) => {
    setActiveNotes((prev) => {
      const next = { ...prev };
      if (next[note]) delete next[note];
      return next;
    });
    pointers.current.delete(pointerId);
  }, []);

  const playChordNotes = useCallback(() => {
    ensureAudio();
    const midiNotes = [0, 4, 7, 12].map((i) => {
      const rootMidi = 60 + NOTE_NAMES.indexOf(selectedChord.name.replace(/[^A-G#b]/g, "")) % 12;
      return midiToNote(rootMidi + i);
    });
    midiNotes.forEach((note, i) => {
      setTimeout(() => {
        audioEngine.playChord(note, "chord");
        setActiveNotes((prev) => ({ ...prev, [note]: performance.now() }));
        setTimeout(() => {
          setActiveNotes((prev) => {
            const next = { ...prev };
            delete next[note];
            return next;
          });
        }, 400);
      }, i * 40);
    });
  }, [ensureAudio, selectedChord.name]);

  const octaveStart = BASE_OCTAVE;
  const octaveEnd = BASE_OCTAVE + 2;
  const totalWhite = (octaveEnd - octaveStart) * 7 + 1;

  const whiteKeys: Array<{ note: string; midi: number }> = [];
  for (let oct = octaveStart; oct < octaveEnd; oct++) {
    for (const idx of WHITE_INDICES) {
      const midi = (oct + 1) * 12 + idx;
      whiteKeys.push({ note: midiToNote(midi), midi });
    }
  }
  {
    const midi = (octaveEnd + 1) * 12;
    whiteKeys.push({ note: midiToNote(midi), midi });
  }

  const blackKeys: Array<{ note: string; midi: number; leftPct: number }> = [];
  for (let oct = octaveStart; oct < octaveEnd; oct++) {
    for (const idx of BLACK_INDICES) {
      const midi = (oct + 1) * 12 + idx;
      const whiteIndexBefore = WHITE_INDICES.filter((w) => w < idx).length;
      const leftPct = ((oct - octaveStart) * 7 + whiteIndexBefore + 0.65) / totalWhite * 100;
      blackKeys.push({ note: midiToNote(midi), midi, leftPct });
    }
  }

  const handlePointerDown = useCallback((note: string, event: React.PointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    ensureAudio();
    noteOn(note, event.pointerId);
  }, [ensureAudio, noteOn]);

  const handlePointerUp = useCallback((note: string, event: React.PointerEvent) => {
    event.preventDefault();
    noteOff(note, event.pointerId);
  }, [noteOff]);

  const handlePointerCancel = useCallback((note: string, event: React.PointerEvent) => {
    noteOff(note, event.pointerId);
  }, [noteOff]);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <div className="flex items-center gap-2">
            <Music size={19} className="text-blue-200" />
            <h2 className="text-lg font-semibold text-white">Smart Piano</h2>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span>{octaveStart} - {octaveEnd} Octave</span>
            <span>|</span>
            <span>{Object.keys(activeNotes).length > 0 ? `Playing: ${Object.keys(activeNotes).join(", ")}` : "Tap keys to play"}</span>
          </div>
        </div>

        <button
          onClick={playChordNotes}
          className="h-9 shrink-0 rounded-lg border border-blue-200/50 bg-blue-300/20 px-3 text-sm font-bold text-blue-100 transition hover:bg-blue-300/30"
          type="button"
        >
          Play {selectedChord.name} Chord
        </button>

        <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
          {chords.slice(0, 12).map((chord) => (
            <button
              key={chord.id}
              className={`h-9 shrink-0 rounded-lg border px-3 text-sm font-bold transition ${
                selectedChord.id === chord.id
                  ? "border-blue-200/70 bg-blue-300/20 text-blue-100"
                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
              onClick={() => setCurrentChord(chord.id)}
              type="button"
            >
              {chord.name}
            </button>
          ))}
        </div>
      </div>

      <div className="relative touch-none select-none overflow-hidden rounded-xl border border-white/10 bg-[#0c1018] shadow-pad" style={{ height: "340px" }}>
        {whiteKeys.map(({ note, midi }) => {
          const active = Boolean(activeNotes[note]);
          return (
            <div
              key={midi}
              onPointerDown={(e) => handlePointerDown(note, e)}
              onPointerUp={(e) => handlePointerUp(note, e)}
              onPointerCancel={(e) => handlePointerCancel(note, e)}
              className={`absolute bottom-0 top-0 rounded-b-md border border-b-0 transition-all duration-75 ${
                active
                  ? "border-blue-300/50 bg-gradient-to-b from-blue-200/40 to-blue-300/20 shadow-[0_0_20px_rgba(147,197,253,0.4)]"
                  : "border-white/15 bg-gradient-to-b from-slate-50 to-white hover:from-slate-100 hover:to-white/95"
              }`}
              style={{
                left: `${(midi - (octaveStart + 1) * 12) / (12 * (octaveEnd - octaveStart + 1)) * 100}%`,
                width: `${1 / totalWhite * 100 + 0.3}%`,
                zIndex: 1,
              }}
            >
              <span className={`pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-xs font-semibold ${active ? "text-blue-700" : "text-slate-400"}`}>
                {note}
              </span>
            </div>
          );
        })}

        {blackKeys.map(({ note, midi, leftPct }) => {
          const active = Boolean(activeNotes[note]);
          return (
            <div
              key={midi}
              onPointerDown={(e) => handlePointerDown(note, e)}
              onPointerUp={(e) => handlePointerUp(note, e)}
              onPointerCancel={(e) => handlePointerCancel(note, e)}
              className={`absolute bottom-0 top-0 rounded-b-md border border-b-0 transition-all duration-75 ${
                active
                  ? "border-blue-400/60 bg-gradient-to-b from-blue-400/70 to-blue-600/50 shadow-[0_0_24px_rgba(96,165,250,0.5)]"
                  : "border-black/40 bg-gradient-to-b from-slate-800 to-black hover:from-slate-700 hover:to-slate-900"
              }`}
              style={{
                left: `${leftPct}%`,
                width: `${0.62 / totalWhite * 100}%`,
                zIndex: 2,
              }}
            >
              <span className={`pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] font-semibold ${active ? "text-blue-200" : "text-slate-500"}`}>
                {note}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
});
