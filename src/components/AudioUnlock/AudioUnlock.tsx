import { CheckCircle2, Loader2, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { audioEngine } from "../../audio/ToneEngine";
import { useStudioStore } from "../../store/useStudioStore";
import type { AudioUnlockStatus } from "../../types";

export function AudioUnlock() {
  const currentInstrument = useStudioStore((state) => state.currentInstrument);
  const mixer = useStudioStore((state) => state.mixer);
  const bpm = useStudioStore((state) => state.bpm);
  const [audioState, setAudioState] = useState(audioEngine.getStatus());
  const stateRef = useRef(audioState.status);

  useEffect(() => {
    return audioEngine.subscribe((status, message) => {
      stateRef.current = status;
      setAudioState({ status, message });
    });
  }, []);

  const unlock = useCallback(() => {
    const status = stateRef.current;
    if (status === "ready" || status === "initializing" || status === "loading") return;
    void audioEngine.unlockFromGesture(currentInstrument, mixer, bpm).catch(() => undefined);
  }, [bpm, currentInstrument, mixer]);

  useEffect(() => {
    const options: AddEventListenerOptions = { capture: true, passive: true };
    window.addEventListener("pointerdown", unlock, options);
    window.addEventListener("touchstart", unlock, options);
    window.addEventListener("click", unlock, options);

    return () => {
      window.removeEventListener("pointerdown", unlock, options);
      window.removeEventListener("touchstart", unlock, options);
      window.removeEventListener("click", unlock, options);
    };
  }, [unlock]);

  const ready = audioState.status === "ready";
  const busy = audioState.status === "initializing" || audioState.status === "loading";
  const failed = audioState.status === "error";

  return (
    <button
      className={`flex h-10 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition ${
        ready
          ? "border-emerald-300/40 bg-emerald-300/15 text-emerald-100"
          : failed
            ? "border-red-300/50 bg-red-500/20 text-red-100"
            : "border-amber-200/40 bg-amber-300/15 text-amber-100"
      }`}
      onClick={unlock}
      aria-live="polite"
      title={audioState.message}
      type="button"
    >
      {ready ? <CheckCircle2 size={16} /> : busy ? <Loader2 className="animate-spin" size={16} /> : failed ? <VolumeX size={16} /> : <Volume2 size={16} />}
      <span>{statusLabel(audioState.status)}</span>
    </button>
  );
}

function statusLabel(status: AudioUnlockStatus) {
  if (status === "ready") return "Audio Ready";
  if (status === "initializing") return "Starting";
  if (status === "loading") return "Loading Samples";
  if (status === "error") return "Audio Retry";
  return "Tap for Audio";
}
