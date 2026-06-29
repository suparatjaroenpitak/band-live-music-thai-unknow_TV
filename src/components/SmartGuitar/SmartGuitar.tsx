import { ArrowDownUp, Guitar, Hand, Waves } from "lucide-react";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import { audioEngine } from "../../audio/ToneEngine";
import { chordNameToGuitarStrings } from "../../audio/chords";
import { useStudioStore } from "../../store/useStudioStore";
import { GuitarStrings } from "../GuitarStrings/GuitarStrings";

type StrumDirection = "down" | "up";

export const SmartGuitar = memo(function SmartGuitar() {
  const chords = useStudioStore((state) => state.chords);
  const currentChord = useStudioStore((state) => state.currentChord);
  const setCurrentChord = useStudioStore((state) => state.setCurrentChord);
  const currentInstrument = useStudioStore((state) => state.currentInstrument);
  const mixer = useStudioStore((state) => state.mixer);
  const bpm = useStudioStore((state) => state.bpm);
  const addPerformanceEvent = useStudioStore((state) => state.addPerformanceEvent);
  const [lastGesture, setLastGesture] = useState("Ready");
  const selectedChord = useMemo(() => chords.find((chord) => chord.id === currentChord) ?? chords[0], [chords, currentChord]);
  const strings = useMemo(() => chordNameToGuitarStrings(selectedChord.name), [selectedChord.name]);
  const audioReady = useRef(false);

  const ensureAudio = useCallback(() => {
    if (audioEngine.getStatus().status === "ready") {
      audioReady.current = true;
      return;
    }
    void audioEngine.ensureReady(currentInstrument, mixer, bpm);
  }, [bpm, currentInstrument, mixer]);

  const playString = useCallback(
    (stringIndex: number, palmMute: boolean) => {
      const note = audioEngine.playGuitarString(selectedChord.name, stringIndex, palmMute);
      if (!note) {
        ensureAudio();
        return;
      }
      setLastGesture(palmMute ? "Palm mute" : `String ${stringIndex + 1}`);
      addPerformanceEvent({
        chordName: selectedChord.name,
        notes: [note],
        mode: "arpeggio",
        instrument: currentInstrument,
        durationMs: palmMute ? 120 : 420
      });
    },
    [addPerformanceEvent, currentInstrument, ensureAudio, selectedChord.name]
  );

  const strum = useCallback(
    (direction: StrumDirection, palmMute: boolean) => {
      const notes = audioEngine.strumGuitar(selectedChord.name, direction, palmMute);
      if (notes.length === 0) {
        ensureAudio();
        return;
      }
      setLastGesture(palmMute ? "Palm mute strum" : direction === "down" ? "Down strum" : "Up strum");
      addPerformanceEvent({
        chordName: selectedChord.name,
        notes,
        mode: direction === "down" ? "strumDown" : "strumUp",
        instrument: currentInstrument,
        durationMs: palmMute ? 180 : 760
      });
      window.navigator.vibrate?.(palmMute ? 6 : 10);
    },
    [addPerformanceEvent, currentInstrument, ensureAudio, selectedChord.name]
  );

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <div className="flex items-center gap-2">
            <Guitar size={19} className="text-amber-200" />
            <h2 className="text-lg font-semibold text-white">Smart Guitar</h2>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="rounded-md border border-white/10 bg-black/20 px-2 py-1">{selectedChord.name}</span>
            <span>{lastGesture}</span>
          </div>
        </div>

        <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
          {chords.slice(0, 12).map((chord) => (
            <button
              key={chord.id}
              className={`h-9 shrink-0 rounded-lg border px-3 text-sm font-bold transition ${
                selectedChord.id === chord.id
                  ? "border-amber-200/70 bg-amber-300/20 text-amber-100"
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

      <div className="grid gap-3 xl:grid-cols-[1fr_210px]">
        <GuitarStrings strings={strings} chordName={selectedChord.name} onStringPlay={(index, palmMute) => void playString(index, palmMute)} onStrum={(direction, palmMute) => void strum(direction, palmMute)} />

        <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
          <GestureBadge icon={<ArrowDownUp size={16} />} label="Down / Up" />
          <GestureBadge icon={<Waves size={16} />} label="Arpeggio" />
          <GestureBadge icon={<Hand size={16} />} label="Palm Mute" />
        </div>
      </div>
    </section>
  );
});

function GestureBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.05] p-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-cyan-100">
        {icon}
        {label}
      </div>
    </div>
  );
}
