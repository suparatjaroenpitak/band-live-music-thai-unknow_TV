import { useCallback, useRef, useState } from "react";
import { audioEngine } from "../../audio/ToneEngine";
import { useStudioStore } from "../../store/useStudioStore";
import type { ChordPad } from "../../types";

interface UseSustainEngineOptions {
  chord: ChordPad;
  onPointerStart?: (event: React.PointerEvent<HTMLButtonElement>) => void;
  holdDelayMs?: number;
}

export function useSustainEngine({ chord, onPointerStart, holdDelayMs = 230 }: UseSustainEngineOptions) {
  const mixer = useStudioStore((state) => state.mixer);
  const bpm = useStudioStore((state) => state.bpm);
  const currentInstrument = useStudioStore((state) => state.currentInstrument);
  const playMode = useStudioStore((state) => state.playMode);
  const setCurrentChord = useStudioStore((state) => state.setCurrentChord);
  const addPerformanceEvent = useStudioStore((state) => state.addPerformanceEvent);
  const [isPressed, setIsPressed] = useState(false);
  const [isSustaining, setIsSustaining] = useState(false);
  const holdTimer = useRef<number | null>(null);
  const activePointer = useRef<number | null>(null);
  const pressedAt = useRef(0);
  const readyPromise = useRef<Promise<void> | null>(null);
  const sustainingRef = useRef(false);

  const clearHoldTimer = useCallback(() => {
    if (holdTimer.current !== null) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  }, []);

  const startSustain = useCallback(async () => {
    await readyPromise.current;
    if (activePointer.current === null) return;
    const notes = audioEngine.startSustainChord(chord.name, chord.id);
    sustainingRef.current = true;
    setIsSustaining(true);
    addPerformanceEvent({
      chordName: chord.name,
      notes,
      mode: playMode,
      instrument: currentInstrument,
      durationMs: 1_200
    });
    window.navigator.vibrate?.(12);
  }, [addPerformanceEvent, chord.id, chord.name, currentInstrument, playMode]);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      activePointer.current = event.pointerId;
      pressedAt.current = performance.now();
      sustainingRef.current = false;
      setIsPressed(true);
      setIsSustaining(false);
      setCurrentChord(chord.id);
      onPointerStart?.(event);
      readyPromise.current = audioEngine.ensureReady(currentInstrument, mixer, bpm);
      clearHoldTimer();
      holdTimer.current = window.setTimeout(() => void startSustain(), holdDelayMs);
    },
    [bpm, chord.id, clearHoldTimer, currentInstrument, holdDelayMs, mixer, onPointerStart, setCurrentChord, startSustain]
  );

  const finishPointer = useCallback(
    async (event?: React.PointerEvent<HTMLButtonElement>) => {
      if (event && activePointer.current !== event.pointerId) return;
      if (event?.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      clearHoldTimer();
      await readyPromise.current?.catch(() => undefined);

      if (sustainingRef.current) {
        audioEngine.stopSustainChord(chord.id);
      } else if (activePointer.current !== null) {
        const notes = audioEngine.playChord(chord.name, playMode);
        addPerformanceEvent({
          chordName: chord.name,
          notes,
          mode: playMode,
          instrument: currentInstrument,
          durationMs: Math.max(260, performance.now() - pressedAt.current + 500)
        });
        window.navigator.vibrate?.(8);
      }

      activePointer.current = null;
      sustainingRef.current = false;
      setIsPressed(false);
      setIsSustaining(false);
    },
    [addPerformanceEvent, chord.id, chord.name, clearHoldTimer, currentInstrument, playMode]
  );

  const onPointerCancel = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (activePointer.current !== event.pointerId) return;
      clearHoldTimer();
      audioEngine.stopSustainChord(chord.id);
      activePointer.current = null;
      sustainingRef.current = false;
      setIsPressed(false);
      setIsSustaining(false);
    },
    [chord.id, clearHoldTimer]
  );

  return {
    isPressed,
    isSustaining,
    handlers: {
      onPointerDown,
      onPointerUp: (event: React.PointerEvent<HTMLButtonElement>) => void finishPointer(event),
      onPointerCancel,
      onLostPointerCapture: () => {
        if (activePointer.current !== null) {
          clearHoldTimer();
          audioEngine.stopSustainChord(chord.id);
          activePointer.current = null;
          sustainingRef.current = false;
          setIsPressed(false);
          setIsSustaining(false);
        }
      }
    }
  };
}

export function SustainIndicator({ active }: { active: boolean }) {
  return (
    <span
      className={`absolute left-3 top-3 h-1.5 w-12 rounded-full transition ${
        active ? "bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.65)]" : "bg-white/10"
      }`}
      aria-hidden="true"
    />
  );
}
