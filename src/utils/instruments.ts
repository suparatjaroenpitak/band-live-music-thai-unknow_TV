import type { InstrumentDefinition } from "../types";

export const INSTRUMENTS: InstrumentDefinition[] = [
  { id: "acoustic-guitar", name: "Acoustic Guitar", family: "guitar", color: "#fbbf24", tags: ["wood", "strum"] },
  { id: "nylon-guitar", name: "Nylon Guitar", family: "guitar", color: "#f59e0b", tags: ["soft", "classic"] },
  { id: "steel-guitar", name: "Steel Guitar", family: "guitar", color: "#d97706", tags: ["bright", "strum"] },
  { id: "electric-guitar", name: "Electric Guitar", family: "guitar", color: "#fb7185", tags: ["drive", "lead"] },
  { id: "clean-guitar", name: "Clean Guitar", family: "guitar", color: "#fda4af", tags: ["clean", "chorus"] },
  { id: "jazz-guitar", name: "Jazz Guitar", family: "guitar", color: "#c084fc", tags: ["warm", "jazz"] },
  { id: "ukulele", name: "Ukulele", family: "ukulele", color: "#86efac", tags: ["small", "bright"] },
  { id: "piano", name: "Piano", family: "keys", color: "#93c5fd", tags: ["keys", "classic"] },
  { id: "grand-piano", name: "Grand Piano", family: "keys", color: "#60a5fa", tags: ["wide", "keys"] },
  { id: "electric-piano", name: "Electric Piano", family: "keys", color: "#38bdf8", tags: ["rhodes", "soft"] },
  { id: "strings", name: "Strings", family: "strings", color: "#a7f3d0", tags: ["ensemble", "pad"] },
  { id: "violin", name: "Violin", family: "strings", color: "#34d399", tags: ["solo", "bow"] },
  { id: "cello", name: "Cello", family: "strings", color: "#10b981", tags: ["low", "bow"] },
  { id: "choir", name: "Choir", family: "choir", color: "#f0abfc", tags: ["voice", "air"] },
  { id: "synth-pad", name: "Synth Pad", family: "synth", color: "#818cf8", tags: ["ambient", "wide"] },
  { id: "synth-lead", name: "Synth Lead", family: "synth", color: "#a78bfa", tags: ["lead", "mono"] },
  { id: "bass", name: "Bass", family: "bass", color: "#2dd4bf", tags: ["low", "solid"] },
  { id: "finger-bass", name: "Finger Bass", family: "bass", color: "#14b8a6", tags: ["pluck", "low"] },
  { id: "slap-bass", name: "Slap Bass", family: "bass", color: "#06b6d4", tags: ["snap", "funk"] },
  { id: "drum-kit", name: "Drum Kit", family: "drums", color: "#f97316", tags: ["beat", "kit"] }
];

export function getInstrument(id: string) {
  return INSTRUMENTS.find((instrument) => instrument.id === id) ?? INSTRUMENTS[0];
}
