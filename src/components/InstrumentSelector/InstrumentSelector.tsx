import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Clock3, Guitar, Heart, Search, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { audioEngine } from "../../audio/ToneEngine";
import { useVirtualList } from "../../hooks/useVirtualList";
import { useStudioStore } from "../../store/useStudioStore";
import type { InstrumentDefinition, InstrumentId } from "../../types";
import { getInstrument, INSTRUMENTS } from "../../utils/instruments";
import { sanitizeInput } from "../../utils/sanitize";

type FilterMode = "all" | "favorite" | "recent";

export function InstrumentSelector() {
  const currentInstrument = useStudioStore((state) => state.currentInstrument);
  const setCurrentInstrument = useStudioStore((state) => state.setCurrentInstrument);
  const favoriteInstruments = useStudioStore((state) => state.favoriteInstruments);
  const recentInstruments = useStudioStore((state) => state.recentInstruments);
  const toggleFavoriteInstrument = useStudioStore((state) => state.toggleFavoriteInstrument);
  const mixer = useStudioStore((state) => state.mixer);
  const bpm = useStudioStore((state) => state.bpm);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [scrollTop, setScrollTop] = useState(0);
  const selected = getInstrument(currentInstrument);

  const filtered = useMemo(() => {
    const source = INSTRUMENTS.filter((instrument) => {
      if (filter === "favorite") return favoriteInstruments.includes(instrument.id);
      if (filter === "recent") return recentInstruments.includes(instrument.id);
      return true;
    });
    const needle = query.toLowerCase();
    return source.filter(
      (instrument) =>
        instrument.name.toLowerCase().includes(needle) ||
        instrument.family.includes(needle) ||
        instrument.tags.some((tag) => tag.includes(needle))
    );
  }, [favoriteInstruments, filter, query, recentInstruments]);

  const list = useVirtualList({
    itemCount: filtered.length,
    itemHeight: 58,
    viewportHeight: 300,
    scrollTop
  });

  const selectInstrument = async (instrument: InstrumentDefinition) => {
    setCurrentInstrument(instrument.id);
    setOpen(false);
    await audioEngine.ensureReady(instrument.id, mixer, bpm);
  };

  return (
    <section className="relative">
      <button
        className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-white/[0.06] p-3 text-left shadow-pad transition hover:border-cyan-200/40"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <InstrumentGlyph instrument={selected} active />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-white">{selected.name}</span>
          <span className="block truncate text-xs capitalize text-slate-400">{selected.family}</span>
        </span>
        <ChevronDown size={18} className={`text-slate-300 transition ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 rounded-lg border border-white/10 bg-studio-panel2 p-3 shadow-2xl"
          >
            <label className="flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3">
              <Search size={16} className="text-slate-400" />
              <input
                className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                value={query}
                onChange={(event) => setQuery(sanitizeInput(event.target.value, 32))}
                placeholder="Search instruments"
              />
            </label>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <FilterButton active={filter === "all"} label="All" icon={<Guitar size={15} />} onClick={() => setFilter("all")} />
              <FilterButton
                active={filter === "favorite"}
                label="Favorites"
                icon={<Heart size={15} />}
                onClick={() => setFilter("favorite")}
              />
              <FilterButton
                active={filter === "recent"}
                label="Recent"
                icon={<Clock3 size={15} />}
                onClick={() => setFilter("recent")}
              />
            </div>

            <div
              className="scrollbar-thin mt-3 h-[300px] overflow-auto rounded-lg border border-white/10 bg-black/15"
              onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
            >
              <div style={{ height: list.totalHeight, position: "relative" }}>
                <div style={{ transform: `translateY(${list.offsetY}px)` }}>
                  {list.indexes.map((index) => {
                    const instrument = filtered[index];
                    const isFavorite = favoriteInstruments.includes(instrument.id);
                    return (
                      <button
                        key={instrument.id}
                        className={`flex h-[58px] w-full items-center gap-3 px-3 text-left transition ${
                          currentInstrument === instrument.id ? "bg-cyan-300/15" : "hover:bg-white/5"
                        }`}
                        onClick={() => void selectInstrument(instrument)}
                      >
                        <InstrumentGlyph instrument={instrument} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-white">{instrument.name}</span>
                          <span className="block truncate text-xs text-slate-400">{instrument.tags.join(" · ")}</span>
                        </span>
                        <span
                          role="button"
                          tabIndex={0}
                          className={`grid size-8 place-items-center rounded-md ${
                            isFavorite ? "text-amber-300" : "text-slate-500 hover:text-slate-200"
                          }`}
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleFavoriteInstrument(instrument.id as InstrumentId);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              toggleFavoriteInstrument(instrument.id as InstrumentId);
                            }
                          }}
                          aria-label={isFavorite ? "Remove favorite" : "Add favorite"}
                        >
                          <Star size={16} fill={isFavorite ? "currentColor" : "none"} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

function InstrumentGlyph({ instrument, active = false }: { instrument: InstrumentDefinition; active?: boolean }) {
  return (
    <span
      className={`relative grid size-11 shrink-0 place-items-center rounded-lg border ${
        active ? "border-white/20" : "border-white/10"
      }`}
      style={{ backgroundColor: `${instrument.color}22`, color: instrument.color }}
    >
      <Guitar size={21} />
      <span className="absolute bottom-1 h-1 w-5 rounded-full" style={{ backgroundColor: instrument.color }} />
    </span>
  );
}

function FilterButton({
  active,
  label,
  icon,
  onClick
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex h-9 items-center justify-center gap-2 rounded-lg border text-xs font-semibold transition ${
        active ? "border-cyan-200/50 bg-cyan-300/15 text-cyan-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
      }`}
      onClick={onClick}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}
