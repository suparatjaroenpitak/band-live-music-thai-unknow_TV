import { motion } from "framer-motion";
import { memo, useCallback, useRef, useState } from "react";
import type { GuitarStringNote } from "../../types";

type StrumDirection = "down" | "up";

interface PointerTrack {
  startY: number;
  lastY: number;
  lastString: number;
  lastPlayedAt: number;
  startedAt: number;
  palmMute: boolean;
  visited: Set<number>;
}

interface GuitarStringsProps {
  strings: GuitarStringNote[];
  chordName: string;
  onStringPlay: (stringIndex: number, palmMute: boolean) => void;
  onStrum: (direction: StrumDirection, palmMute: boolean) => void;
}

export const GuitarStrings = memo(function GuitarStrings({ strings, chordName, onStringPlay, onStrum }: GuitarStringsProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pointers = useRef(new Map<number, PointerTrack>());
  const [activeStrings, setActiveStrings] = useState<Record<number, number>>({});
  const [pick, setPick] = useState<{ y: number; direction: StrumDirection; nonce: number } | null>(null);

  const stringIndexFromY = useCallback((clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const ratio = Math.min(0.999, Math.max(0, (clientY - rect.top) / rect.height));
    return Math.min(5, Math.max(0, Math.floor(ratio * 6)));
  }, []);

  const pulseString = useCallback((index: number) => {
    const nonce = performance.now();
    setActiveStrings((state) => ({ ...state, [index]: nonce }));
    window.setTimeout(() => {
      setActiveStrings((state) => (state[index] === nonce ? { ...state, [index]: 0 } : state));
    }, 260);
  }, []);

  const movePick = useCallback((clientY: number, direction: StrumDirection) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPick({ y: clientY - rect.top, direction, nonce: performance.now() });
    window.setTimeout(() => setPick(null), 220);
  }, []);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      const index = stringIndexFromY(event.clientY);
      const palmMute = pointers.current.size >= 1;
      pointers.current.set(event.pointerId, {
        startY: event.clientY,
        lastY: event.clientY,
        lastString: index,
        lastPlayedAt: performance.now(),
        startedAt: performance.now(),
        palmMute,
        visited: new Set([index])
      });
      onStringPlay(index, palmMute);
      pulseString(index);
      movePick(event.clientY, "down");
    },
    [movePick, onStringPlay, pulseString, stringIndexFromY]
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const track = pointers.current.get(event.pointerId);
      if (!track) return;
      event.preventDefault();
      const index = stringIndexFromY(event.clientY);
      const now = performance.now();
      const direction: StrumDirection = event.clientY >= track.lastY ? "down" : "up";
      track.palmMute = track.palmMute || pointers.current.size > 1;

      if (index !== track.lastString) {
        track.visited.add(index);
        if (now - track.lastPlayedAt > 85 || track.palmMute) {
          onStringPlay(index, track.palmMute);
          track.lastPlayedAt = now;
        }
        pulseString(index);
        movePick(event.clientY, direction);
        track.lastString = index;
      }

      track.lastY = event.clientY;
    },
    [movePick, onStringPlay, pulseString, stringIndexFromY]
  );

  const finishPointer = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const track = pointers.current.get(event.pointerId);
      if (!track) return;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      const duration = performance.now() - track.startedAt;
      const movement = track.lastY - track.startY;
      const direction: StrumDirection = movement >= 0 ? "down" : "up";
      const isSwipe = Math.abs(movement) > 42 && track.visited.size >= 3;
      const isFastStrum = isSwipe && duration < 420;

      if (isFastStrum || track.palmMute) {
        onStrum(direction, track.palmMute);
        movePick(track.lastY, direction);
        track.visited.forEach((index) => pulseString(index));
      }

      pointers.current.delete(event.pointerId);
    },
    [movePick, onStrum, pulseString]
  );

  const cancelPointer = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);
  }, []);

  return (
    <div
      ref={containerRef}
      className="touch-none relative h-[310px] overflow-hidden rounded-lg border border-white/10 bg-[linear-gradient(90deg,rgba(15,23,42,0.95),rgba(24,17,12,0.92))] shadow-pad"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishPointer}
      onPointerCancel={cancelPointer}
      aria-label={`${chordName} smart guitar strings`}
      role="application"
    >
      <div className="pointer-events-none absolute left-0 top-0 h-full w-14 border-r border-white/10 bg-black/25" />
      <div className="pointer-events-none absolute left-14 right-0 top-0 h-full bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.05)_0,rgba(255,255,255,0.05)_1px,transparent_1px,transparent_58px)]" />

      {strings.map((string, index) => {
        const active = Boolean(activeStrings[index]);
        return (
          <div key={string.stringNumber} className="absolute left-0 right-0 flex h-1/6 items-center" style={{ top: `${index * (100 / 6)}%` }}>
            <div className="z-10 flex w-14 flex-col items-center justify-center text-[10px] font-semibold text-slate-400">
              <span>{string.stringNumber}</span>
              <span>{string.openNote}</span>
            </div>
            <motion.div
              className={`relative ml-3 h-[3px] flex-1 rounded-full ${string.muted ? "bg-slate-500/35" : "bg-slate-100/80"}`}
              animate={{
                x: active ? [0, -7, 6, -4, 0] : 0,
                scaleY: active ? [1, 1.8, 1] : 1,
                boxShadow: active ? "0 0 22px rgba(94,234,212,0.75)" : "0 0 0 rgba(0,0,0,0)"
              }}
              transition={{ duration: 0.24 }}
            >
              {active ? <span className="absolute -top-5 left-1/2 size-10 -translate-x-1/2 animate-[ping_420ms_ease-out] rounded-full bg-cyan-200/25" /> : null}
            </motion.div>
            <div className="w-20 px-3 text-right text-xs font-semibold text-slate-200">
              {string.muted ? "X" : `${string.note} · ${string.fret}`}
            </div>
          </div>
        );
      })}

      {pick ? (
        <motion.div
          key={pick.nonce}
          className="pointer-events-none absolute left-[4.2rem] z-20 h-8 w-12 rounded-full border border-cyan-200/50 bg-cyan-200/15"
          style={{ top: pick.y - 16 }}
          initial={{ opacity: 0, x: pick.direction === "down" ? -18 : 18, rotate: pick.direction === "down" ? -18 : 18 }}
          animate={{ opacity: [0, 1, 0], x: pick.direction === "down" ? 42 : -42 }}
          transition={{ duration: 0.22 }}
        />
      ) : null}
    </div>
  );
});
