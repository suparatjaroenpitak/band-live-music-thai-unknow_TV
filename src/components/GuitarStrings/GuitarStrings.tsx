import { motion } from "framer-motion";
import { memo, useCallback, useMemo, useRef, useState } from "react";
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

const FRET_POSITIONS = [0, 5.6, 10.9, 16.0, 20.7, 25.2, 29.5, 33.5, 37.5];
const FRET_NAMES = ["Nut", "1", "2", "3", "4", "5", "6", "7", "8"];

export const GuitarStrings = memo(function GuitarStrings({ strings, chordName, onStringPlay, onStrum }: GuitarStringsProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pointers = useRef(new Map<number, PointerTrack>());
  const [activeStrings, setActiveStrings] = useState<Record<number, number>>({});
  const [pick, setPick] = useState<{ y: number; direction: StrumDirection; nonce: number } | null>(null);

  const maxFret = useMemo(() => Math.max(0, ...strings.map((s) => s.fret ?? 0)), [strings]);
  const visibleFrets = Math.max(5, Math.min(8, maxFret + 1));

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
        if (now - track.lastPlayedAt > 60 || track.palmMute) {
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
      className="touch-none relative h-[480px] overflow-hidden rounded-lg border border-white/10 bg-[linear-gradient(90deg,rgba(15,23,42,0.95),rgba(24,17,12,0.92))] shadow-pad"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishPointer}
      onPointerCancel={cancelPointer}
      aria-label={`${chordName} smart guitar strings`}
      role="application"
    >
      <div className="pointer-events-none absolute left-0 top-0 h-full w-12 border-r border-white/10 bg-black/25 z-10" />

      {strings.map((string, index) => {
        const active = Boolean(activeStrings[index]);
        return (
          <div key={string.stringNumber} className="absolute left-0 right-0 flex h-1/6 items-center" style={{ top: `${index * (100 / 6)}%` }}>
            <div className="z-10 flex w-12 shrink-0 flex-col items-center justify-center text-[10px] font-semibold text-slate-400">
              <span>{string.stringNumber}</span>
              <span>{string.openNote}</span>
            </div>

            <div className="relative ml-0 flex-1 h-full flex items-center">
              {FRET_POSITIONS.slice(0, visibleFrets).map((fretPos, fi) => {
                const isNut = fi === 0;
                const isThisFret = string.fret === fi;
                const isOpen = fi === 0 && string.fret === 0 && !string.muted;

                return (
                  <div
                    key={fi}
                    className={`absolute h-full flex items-center ${fi > 0 ? "border-l border-white/5" : ""}`}
                    style={{ left: `${(fretPos / FRET_POSITIONS[visibleFrets - 1]) * 100}%`, width: `${fretPos > 0 ? ((FRET_POSITIONS[fi] - FRET_POSITIONS[fi - 1]) / FRET_POSITIONS[visibleFrets - 1]) * 100 : 10}%` }}
                  >
                    {fi > 0 && (
                      <span className="absolute -top-1 left-0 -translate-x-1/2 text-[8px] text-slate-600">{FRET_NAMES[fi]}</span>
                    )}

                    {isNut && !string.muted && (
                      <span className="absolute left-1 text-[10px] font-bold text-emerald-400">○</span>
                    )}
                    {isNut && string.muted && (
                      <span className="absolute left-1 text-[10px] font-bold text-red-400">✕</span>
                    )}

                    {isThisFret && fi > 0 && (
                      <div className="absolute left-[10%] z-20 flex items-center justify-center">
                        <div className={`size-7 rounded-full border-2 flex items-center justify-center shadow-lg transition-all duration-100 ${
                          active
                            ? "border-cyan-200 bg-cyan-400/40 shadow-cyan-400/50"
                            : "border-amber-300/70 bg-amber-400/30 shadow-amber-400/30"
                        }`}>
                          <span className={`text-[10px] font-bold ${active ? "text-white" : "text-amber-100"}`}>{fi}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              <motion.div
                className={`relative ml-1 h-[3px] flex-1 rounded-full ${string.muted ? "bg-slate-500/30" : "bg-slate-100/70"}`}
                animate={{
                  x: active ? [0, -7, 6, -4, 0] : 0,
                  scaleY: active ? [1, 2.2, 1] : 1,
                  boxShadow: active ? "0 0 24px rgba(94,234,212,0.8)" : "0 0 0 rgba(0,0,0,0)"
                }}
                transition={{ duration: 0.24 }}
              >
                {active ? <span className="absolute -top-6 left-1/2 size-12 -translate-x-1/2 animate-[ping_420ms_ease-out] rounded-full bg-cyan-200/25" /> : null}
              </motion.div>

              <div className="w-16 shrink-0 px-2 text-right text-[11px] font-semibold text-slate-200">
                {string.muted ? "X" : `${string.note} · ${string.fret}`}
              </div>
            </div>
          </div>
        );
      })}

      {pick ? (
        <motion.div
          key={pick.nonce}
          className="pointer-events-none absolute left-[3rem] z-30 h-8 w-12 rounded-full border border-cyan-200/50 bg-cyan-200/15"
          style={{ top: pick.y - 16 }}
          initial={{ opacity: 0, x: pick.direction === "down" ? -18 : 18, rotate: pick.direction === "down" ? -18 : 18 }}
          animate={{ opacity: [0, 1, 0], x: pick.direction === "down" ? 42 : -42 }}
          transition={{ duration: 0.22 }}
        />
      ) : null}
    </div>
  );
});
