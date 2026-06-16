import { motion } from "framer-motion";
import { useStudioStore } from "../../store/useStudioStore";
import { getInstrument } from "../../utils/instruments";
import { InstrumentBrowser } from "../InstrumentBrowser/InstrumentBrowser";

export function InstrumentView() {
  const currentInstrument = useStudioStore((state) => state.currentInstrument);
  const currentChord = useStudioStore((state) => state.currentChord);
  const chords = useStudioStore((state) => state.chords);
  const instrument = getInstrument(currentInstrument);
  const chord = chords.find((item) => item.id === currentChord);

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(280px,360px)_1fr]">
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Instrument</h2>
        <InstrumentBrowser />
      </div>

      <div className="relative min-h-48 overflow-hidden rounded-lg border border-white/10 bg-white/[0.05] p-5 shadow-pad">
        <div className="absolute inset-0 opacity-40" style={{ background: `linear-gradient(120deg, ${instrument.color}24, transparent 45%)` }} />
        <div className="relative flex h-full min-h-40 items-center justify-center">
          <motion.div
            className="relative h-28 w-full max-w-xl"
            animate={{ scale: currentChord ? 1.025 : 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <div className="absolute left-0 right-0 top-1/2 h-4 -translate-y-1/2 rounded-full bg-slate-950/80 shadow-lg" />
            {Array.from({ length: instrument.family === "piano" ? 12 : 6 }, (_, index) => (
              <motion.span
                key={index}
                className="absolute left-2 right-2 h-[2px] rounded-full bg-slate-200/80"
                style={{ top: 18 + index * (instrument.family === "piano" ? 7 : 14) }}
                animate={{
                  x: currentChord ? [0, index % 2 ? 3 : -3, 0] : 0,
                  opacity: currentChord ? [0.8, 1, 0.8] : 0.72
                }}
                transition={{ duration: 0.32, delay: index * 0.012 }}
              />
            ))}
            <motion.div
              className="absolute left-1/2 top-1/2 grid size-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/45 text-center shadow-glow backdrop-blur"
              style={{ color: instrument.color }}
              animate={{ rotate: currentChord ? [0, -1.8, 1.8, 0] : 0 }}
              transition={{ duration: 0.34 }}
            >
              <span className="text-2xl font-black text-white">{chord?.name ?? "Ready"}</span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
