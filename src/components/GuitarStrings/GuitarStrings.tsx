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

const FRET_LABELS = ["Nut", "I", "II", "III", "IV", "V", "VI", "VII"];

export const GuitarStrings = memo(function GuitarStrings({ strings, chordName, onStringPlay, onStrum }: GuitarStringsProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pointers = useRef(new Map<number, PointerTrack>());
  const [activeStrings, setActiveStrings] = useState<Record<number, number>>({});
  const [pick, setPick] = useState<{ y: number; direction: StrumDirection; nonce: number } | null>(null);

  const numFrets = useMemo(() => {
    const maxFret = Math.max(0, ...strings.map((s) => s.fret ?? 0));
    return Math.max(5, Math.min(7, maxFret + 1));
  }, [strings]);

  const fretSections = useMemo(() => {
    const arr: Array<{ label: string }> = [];
    for (let i = 0; i < numFrets; i++) {
      arr.push({ label: FRET_LABELS[i] ?? `${i}` });
    }
    return arr;
  }, [numFrets]);

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
      className="touch-none relative h-[500px] overflow-hidden rounded-lg border border-white/10 bg-[linear-gradient(90deg,rgba(15,23,42,0.95),rgba(24,17,12,0.92))] shadow-pad"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishPointer}
      onPointerCancel={cancelPointer}
      aria-label={`${chordName} smart guitar strings`}
      role="application"
    >
      <div className="pointer-events-none absolute left-0 top-0 h-full w-14 border-r border-white/10 bg-black/30 z-10" />
      <div className="pointer-events-none absolute left-14 right-24 top-0 h-full bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.03)_0,rgba(255,255,255,0.03)_1px,transparent_1px,transparent_56px)]" />

      <div className="pointer-events-none absolute left-14 right-24 top-0 h-4 z-10 flex">
        {fretSections.map((_, fi) => (
          <div key={fi} className="flex-1 border-r border-white/5 flex items-center justify-start pl-1">
            <span className="text-[7px] text-slate-600">{FRET_LABELS[fi] ?? `${fi}`}</span>
          </div>
        ))}
      </div>

      <div className="absolute left-14 right-24 top-4 bottom-0 z-20 flex flex-col">
        {strings.map((string, index) => {
          const active = Boolean(activeStrings[index]);
          return (
            <div key={string.stringNumber} className="flex-1 flex items-stretch border-b border-white/[0.04] relative">
              <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${numFrets}, 1fr)` }}>
                {fretSections.map((f, fi) => {
                  const isNut = fi === 0;
                  const isOpen = isNut && string.fret === 0 && !string.muted;
                  const isMuted = isNut && string.muted;
                  const hasDot = fi > 0 && string.fret === fi;

                  return (
                    <div key={fi} className="relative flex items-center justify-center border-r border-white/[0.03]">
                      {isOpen && <span className="z-10 text-base font-bold text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.6)] select-none">○</span>}
                      {isMuted && <span className="z-10 text-base font-bold text-red-400 drop-shadow-[0_0_6px_rgba(248,113,113,0.6)] select-none">✕</span>}

                      {hasDot && (
                        <div className={`z-20 size-8 rounded-full border-2 flex items-center justify-center shadow-lg transition-all duration-100 ${
                          active
                            ? "border-cyan-200 bg-cyan-400/45 shadow-[0_0_18px_rgba(103,232,249,0.6)] scale-110"
                            : "border-amber-300/70 bg-amber-400/35 shadow-[0_0_12px_rgba(251,191,36,0.25)]"
                        }`}>
                          <span className={`text-xs font-bold ${active ? "text-white" : "text-amber-100"}`}>{fi}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="absolute left-0 -top-4 h-[calc(100%+16px)] w-full pointer-events-none z-30">
                <motion.div
                  className={`absolute top-1/2 -translate-y-1/2 left-0 right-0 h-[3px] rounded-full mx-2 ${string.muted ? "bg-slate-500/25" : "bg-slate-100/60"}`}
                  animate={{
                    x: active ? [0, -6, 5, -3, 0] : 0,
                    scaleY: active ? [1, 2.4, 1] : 1,
                    boxShadow: active ? "0 0 24px rgba(94,234,212,0.8)" : "0 0 0 rgba(0,0,0,0)"
                  }}
                  transition={{ duration: 0.24 }}
                >
                  {active ? <span className="absolute -top-5 left-1/2 size-10 -translate-x-1/2 animate-[ping_420ms_ease-out] rounded-full bg-cyan-200/25" /> : null}
                </motion.div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pointer-events-none absolute right-0 top-0 h-full w-24 bg-black/20 flex flex-col z-10">
        {strings.map((string, index) => (
          <div key={string.stringNumber} className="flex-1 flex items-center justify-end pr-3">
            <span className="text-[11px] font-semibold text-slate-300">
              {string.muted ? "X" : `${string.note}  ${string.fret}`}
            </span>
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute left-0 top-0 h-full w-14 flex flex-col z-10">
        {strings.map((string, index) => (
          <div key={string.stringNumber} className="flex-1 flex flex-col items-center justify-center text-[10px] font-semibold text-slate-400">
            <span>{string.stringNumber}</span>
            <span>{string.openNote}</span>
          </div>
        ))}
      </div>

      {pick ? (
        <motion.div
          key={pick.nonce}
          className="pointer-events-none absolute left-[3.6rem] z-40 h-8 w-12 rounded-full border border-cyan-200/50 bg-cyan-200/15"
          style={{ top: pick.y - 16 }}
          initial={{ opacity: 0, x: pick.direction === "down" ? -18 : 18, rotate: pick.direction === "down" ? -18 : 18 }}
          animate={{ opacity: [0, 1, 0], x: pick.direction === "down" ? 42 : -42 }}
          transition={{ duration: 0.22 }}
        />
      ) : null}
    </div>
  );
});
