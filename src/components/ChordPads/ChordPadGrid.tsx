import { AnimatePresence, motion } from "framer-motion";
import { Download, GripVertical, Plus, Save, Trash2, Upload } from "lucide-react";
import { type ChangeEvent, useMemo, useRef, useState } from "react";
import { audioEngine } from "../../audio/ToneEngine";
import { chordNameToNotes } from "../../audio/chords";
import { useStableRateLimiter } from "../../hooks/useStableRateLimiter";
import { useStudioStore } from "../../store/useStudioStore";
import type { ChordPad } from "../../types";
import { downloadJson } from "../../utils/download";
import { createId } from "../../utils/ids";
import { sanitizeInput } from "../../utils/sanitize";
import { isValidChordName, validateChordPads } from "../../utils/validation";

interface Ripple {
  id: string;
  x: number;
  y: number;
}

export function ChordPadGrid() {
  const chords = useStudioStore((state) => state.chords);
  const mixer = useStudioStore((state) => state.mixer);
  const bpm = useStudioStore((state) => state.bpm);
  const currentInstrument = useStudioStore((state) => state.currentInstrument);
  const playMode = useStudioStore((state) => state.playMode);
  const currentChord = useStudioStore((state) => state.currentChord);
  const setCurrentChord = useStudioStore((state) => state.setCurrentChord);
  const addChord = useStudioStore((state) => state.addChord);
  const updateChord = useStudioStore((state) => state.updateChord);
  const removeChord = useStudioStore((state) => state.removeChord);
  const reorderChord = useStudioStore((state) => state.reorderChord);
  const setChordSet = useStudioStore((state) => state.setChordSet);
  const addPerformanceEvent = useStudioStore((state) => state.addPerformanceEvent);
  const [draftChord, setDraftChord] = useState("Cadd9");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [ripples, setRipples] = useState<Record<string, Ripple[]>>({});
  const importRef = useRef<HTMLInputElement>(null);
  const canMutate = useStableRateLimiter(24, 4_000);

  const activeChordName = useMemo(() => chords.find((chord) => chord.id === currentChord)?.name, [chords, currentChord]);

  const playChord = async (chord: ChordPad, event: React.PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setCurrentChord(chord.id);
    addRipple(chord.id, event);
    await audioEngine.ensureReady(currentInstrument, mixer, bpm);
    const notes = audioEngine.playChord(chord.name, playMode);
    addPerformanceEvent({
      chordName: chord.name,
      notes,
      mode: playMode,
      instrument: currentInstrument,
      durationMs: playMode === "autoPattern" ? 1_400 : 900
    });
    window.navigator.vibrate?.(8);
  };

  const addRipple = (chordId: string, event: React.PointerEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ripple = { id: createId("ripple"), x: event.clientX - rect.left, y: event.clientY - rect.top };
    setRipples((state) => ({ ...state, [chordId]: [...(state[chordId] ?? []), ripple] }));
    window.setTimeout(() => {
      setRipples((state) => ({ ...state, [chordId]: (state[chordId] ?? []).filter((item) => item.id !== ripple.id) }));
    }, 520);
  };

  const saveEdit = (id: string) => {
    if (!canMutate() || !isValidChordName(editingValue)) return;
    updateChord(id, editingValue);
    setEditingId(null);
  };

  const handleAddChord = () => {
    if (!canMutate() || !isValidChordName(draftChord)) return;
    addChord(draftChord);
    setDraftChord("");
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || file.size > 256_000) return;

    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const imported = validateChordPads(Array.isArray(parsed) ? parsed : (parsed as { chords?: unknown }).chords);
      if (imported.length > 0) setChordSet(imported);
    } catch {
      return;
    }
  };

  return (
    <section className="flex min-h-0 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="mr-auto">
          <h2 className="text-lg font-semibold text-white">Chord Pads</h2>
          <p className="text-xs text-slate-400">{chords.length} pads ready {activeChordName ? `· ${activeChordName}` : ""}</p>
        </div>

        <div className="flex min-w-0 flex-1 basis-72 items-center gap-2 sm:flex-none">
          <input
            className="h-10 min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/70"
            value={draftChord}
            onChange={(event) => setDraftChord(sanitizeInput(event.target.value, 24))}
            placeholder="Add chord"
            aria-label="Add chord name"
          />
          <button
            className="grid size-10 shrink-0 place-items-center rounded-lg bg-cyan-300 text-studio-ink transition hover:bg-cyan-200 disabled:opacity-40"
            onClick={handleAddChord}
            disabled={!isValidChordName(draftChord)}
            aria-label="Add chord"
            title="Add chord"
          >
            <Plus size={18} />
          </button>
        </div>

        <button
          className="grid size-10 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-100 transition hover:bg-white/10"
          onClick={() => downloadJson(chords, "smart-chord-set.json")}
          aria-label="Export chord set"
          title="Export chord set"
        >
          <Download size={18} />
        </button>
        <button
          className="grid size-10 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-100 transition hover:bg-white/10"
          onClick={() => importRef.current?.click()}
          aria-label="Import chord set"
          title="Import chord set"
        >
          <Upload size={18} />
        </button>
        <input ref={importRef} className="hidden" type="file" accept="application/json,.json" onChange={handleImport} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        <AnimatePresence initial={false}>
          {chords.map((chord, index) => (
            <motion.div
              key={chord.id}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.16 }}
              className="relative"
              draggable
              onDragStart={() => setDraggingId(chord.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (draggingId) reorderChord(draggingId, chord.id);
                setDraggingId(null);
              }}
            >
              <button
                className={`touch-none relative h-28 w-full overflow-hidden rounded-lg border p-3 text-left shadow-pad transition ${
                  currentChord === chord.id
                    ? "border-cyan-200/80 bg-cyan-300/18"
                    : "border-white/10 bg-white/[0.06] hover:border-cyan-200/40 hover:bg-white/[0.09]"
                }`}
                onPointerDown={(event) => void playChord(chord, event)}
                onPointerUp={() => window.setTimeout(() => setCurrentChord(null), 90)}
                aria-label={`Play ${chord.name}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <GripVertical size={16} className="mt-1 shrink-0 text-slate-500" />
                  <span className="rounded-md bg-black/20 px-2 py-1 text-[11px] font-semibold text-slate-300">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                {editingId === chord.id ? (
                  <input
                    className="mt-3 w-full rounded-md border border-cyan-200/50 bg-black/40 px-2 py-1 text-center text-2xl font-black text-white outline-none"
                    value={editingValue}
                    autoFocus
                    onPointerDown={(event) => event.stopPropagation()}
                    onChange={(event) => setEditingValue(sanitizeInput(event.target.value, 24))}
                    onBlur={() => saveEdit(chord.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") saveEdit(chord.id);
                      if (event.key === "Escape") setEditingId(null);
                    }}
                    aria-label={`Edit ${chord.name}`}
                  />
                ) : (
                  <div className="mt-3 truncate text-center text-3xl font-black text-white">{chord.name}</div>
                )}

                <div className="mt-2 truncate text-center text-xs text-slate-400">{chordNameToNotes(chord.name).join(" · ")}</div>

                {(ripples[chord.id] ?? []).map((ripple) => (
                  <span
                    key={ripple.id}
                    className="pointer-events-none absolute size-10 animate-[ping_520ms_ease-out] rounded-full bg-cyan-200/30"
                    style={{ left: ripple.x - 20, top: ripple.y - 20 }}
                  />
                ))}
              </button>

              <div className="absolute bottom-2 right-2 flex gap-1">
                <button
                  className="grid size-8 place-items-center rounded-md bg-black/35 text-slate-200 backdrop-blur transition hover:bg-black/60"
                  onClick={() => {
                    setEditingId(chord.id);
                    setEditingValue(chord.name);
                  }}
                  aria-label={`Edit ${chord.name}`}
                  title="Edit chord"
                >
                  <Save size={15} />
                </button>
                <button
                  className="grid size-8 place-items-center rounded-md bg-black/35 text-red-200 backdrop-blur transition hover:bg-red-500/30 disabled:opacity-30"
                  onClick={() => removeChord(chord.id)}
                  disabled={chords.length <= 1}
                  aria-label={`Delete ${chord.name}`}
                  title="Delete chord"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
