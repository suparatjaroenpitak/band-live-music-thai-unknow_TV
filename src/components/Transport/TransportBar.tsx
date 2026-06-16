import { CircleStop, Disc3, Music2, Play, Square } from "lucide-react";
import { audioEngine } from "../../audio/ToneEngine";
import { useStudioStore } from "../../store/useStudioStore";
import { RecorderControls } from "../Recorder/RecorderControls";

export function TransportBar() {
  const bpm = useStudioStore((state) => state.bpm);
  const setBpm = useStudioStore((state) => state.setBpm);
  const mixer = useStudioStore((state) => state.mixer);
  const currentInstrument = useStudioStore((state) => state.currentInstrument);
  const transportPlaying = useStudioStore((state) => state.transportPlaying);
  const setTransportPlaying = useStudioStore((state) => state.setTransportPlaying);

  const toggleTransport = async () => {
    const next = !transportPlaying;
    await audioEngine.ensureReady(currentInstrument, mixer, bpm);
    audioEngine.setTransportPlaying(next);
    setTransportPlaying(next);
  };

  const stopTransport = () => {
    audioEngine.setTransportPlaying(false);
    setTransportPlaying(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-studio-ink/88 px-3 py-3 shadow-lg backdrop-blur-xl sm:px-4">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-cyan-300 text-studio-ink shadow-glow">
            <Music2 size={22} />
          </div>
          <div className="min-w-0">
            <div className="truncate text-base font-bold text-white sm:text-lg">Smart Music Studio</div>
            <div className="text-xs text-slate-400">Realtime Chord Workstation</div>
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <label className="flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3">
            <Disc3 size={16} className="text-cyan-200" />
            <input
              className="w-16 bg-transparent text-center text-sm font-semibold text-white outline-none"
              min={40}
              max={220}
              type="number"
              value={bpm}
              onChange={(event) => setBpm(Number(event.target.value))}
              aria-label="BPM"
            />
            <span className="text-xs uppercase text-slate-400">BPM</span>
          </label>

          <button
            className="grid size-10 place-items-center rounded-lg border border-cyan-200/30 bg-cyan-300 text-studio-ink transition hover:bg-cyan-200"
            onClick={() => void toggleTransport()}
            aria-label={transportPlaying ? "Pause transport" : "Play transport"}
            title={transportPlaying ? "Pause" : "Play"}
          >
            {transportPlaying ? <Square size={18} /> : <Play size={18} />}
          </button>

          <button
            className="grid size-10 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-100 transition hover:bg-white/10"
            onClick={stopTransport}
            aria-label="Stop transport"
            title="Stop"
          >
            <CircleStop size={18} />
          </button>

          <RecorderControls compact />
        </div>
      </div>
    </header>
  );
}
