import { useEffect, useMemo } from "react";
import { AdBanner } from "../components/AdBanner/AdBanner";
import { AudioUnlock } from "../components/AudioUnlock/AudioUnlock";
import { ChordPadGrid } from "../components/ChordPads/ChordPadGrid";
import { EffectsPanel } from "../components/EffectsPanel/EffectsPanel";
import { InstrumentView } from "../components/InstrumentSelector/InstrumentView";
import { MixerPanel } from "../components/MixerPanel/MixerPanel";
import { ProjectActions } from "../components/Project/ProjectActions";
import { RecorderControls } from "../components/Recorder/RecorderControls";
import { SmartGuitar } from "../components/SmartGuitar/SmartGuitar";
import { SmartPiano } from "../components/SmartPiano/SmartPiano";
import { TransportBar } from "../components/Transport/TransportBar";
import { audioEngine } from "../audio/ToneEngine";
import { useAutoSave } from "../hooks/useAutoSave";
import { useStudioStore } from "../store/useStudioStore";
import type { PlayMode } from "../types";

const PLAY_MODES: Array<{ label: string; value: PlayMode }> = [
  { label: "Chord", value: "chord" },
  { label: "Arpeggio", value: "arpeggio" },
  { label: "Fingerstyle", value: "fingerstyle" },
  { label: "Strum Down", value: "strumDown" },
  { label: "Strum Up", value: "strumUp" },
  { label: "Auto Pattern", value: "autoPattern" }
];

export default function StudioPage() {
  useAutoSave();
  const playMode = useStudioStore((state) => state.playMode);
  const setPlayMode = useStudioStore((state) => state.setPlayMode);
  const mixer = useStudioStore((state) => state.mixer);
  const bpm = useStudioStore((state) => state.bpm);
  const currentInstrument = useStudioStore((state) => state.currentInstrument);

  const isPiano = useMemo(() => currentInstrument.includes("piano"), [currentInstrument]);
  const isGuitar = useMemo(() => currentInstrument.includes("guitar") || currentInstrument === "ukulele" || currentInstrument.includes("bass"), [currentInstrument]);

  useEffect(() => {
    audioEngine.updateMixer(mixer);
  }, [mixer]);

  useEffect(() => {
    audioEngine.setBpm(bpm);
  }, [bpm]);

  useEffect(() => {
    if (audioEngine.getStatus().status === "ready") {
      void audioEngine.setInstrument(currentInstrument);
    }
  }, [currentInstrument]);

  return (
    <main className="min-h-screen pb-16 text-slate-100">
      <TransportBar />

      <div className="mx-auto max-w-7xl space-y-4 px-3 py-4 sm:px-4">
        <ProjectActions />
        <InstrumentView />
        <AudioUnlock />

        <section className="rounded-lg border border-white/10 bg-white/[0.05] p-3 shadow-pad">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
            {PLAY_MODES.map((mode) => (
              <button
                key={mode.value}
                className={`h-10 rounded-lg border px-3 text-xs font-semibold transition ${
                  playMode === mode.value
                    ? "border-cyan-200/70 bg-cyan-300/20 text-cyan-100"
                    : "border-white/10 bg-black/20 text-slate-300 hover:bg-white/10"
                }`}
                onClick={() => setPlayMode(mode.value)}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </section>

        {isGuitar && <SmartGuitar />}
        {isPiano && <SmartPiano />}
        <ChordPadGrid />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MixerPanel />
          <EffectsPanel />
          <RecorderControls />
        </div>
      </div>

      <AdBanner />
    </main>
  );
}
