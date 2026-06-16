import type { InstrumentDefinition } from "../types";

export const INSTRUMENTS: InstrumentDefinition[] = [
  { id: "acoustic-guitar", name: "Acoustic Guitar", family: "guitar", category: "Guitar", color: "#fbbf24", tags: ["wood", "steel", "strum"] },
  { id: "nylon-guitar", name: "Nylon Guitar", family: "guitar", category: "Guitar", color: "#f59e0b", tags: ["soft", "classic", "finger"] },
  { id: "steel-guitar", name: "Steel Guitar", family: "guitar", category: "Guitar", color: "#d97706", tags: ["bright", "picked", "folk"] },
  { id: "electric-guitar", name: "Electric Guitar", family: "guitar", category: "Guitar", color: "#fb7185", tags: ["amp", "lead", "clean"] },
  { id: "distortion-guitar", name: "Distortion Guitar", family: "guitar", category: "Guitar", color: "#f43f5e", tags: ["drive", "rock", "power"] },
  { id: "clean-guitar", name: "Clean Guitar", family: "guitar", category: "Guitar", color: "#fda4af", tags: ["clean", "chorus", "pop"] },
  { id: "jazz-guitar", name: "Jazz Guitar", family: "guitar", category: "Guitar", color: "#c084fc", tags: ["warm", "jazz", "hollow"] },
  { id: "ukulele", name: "Ukulele", family: "ukulele", category: "Guitar", color: "#86efac", tags: ["small", "bright", "island"] },
  { id: "piano", name: "Piano", family: "piano", category: "Piano", color: "#93c5fd", tags: ["keys", "classic", "studio"] },
  { id: "grand-piano", name: "Grand Piano", family: "piano", category: "Piano", color: "#60a5fa", tags: ["wide", "concert", "keys"] },
  { id: "electric-piano", name: "Electric Piano", family: "piano", category: "Piano", color: "#38bdf8", tags: ["rhodes", "soft", "keys"] },
  { id: "strings", name: "Strings", family: "strings", category: "Strings", color: "#a7f3d0", tags: ["ensemble", "pad", "cinematic"] },
  { id: "violin", name: "Violin", family: "strings", category: "Strings", color: "#34d399", tags: ["solo", "bow", "melody"] },
  { id: "cello", name: "Cello", family: "strings", category: "Strings", color: "#10b981", tags: ["low", "bow", "warm"] },
  { id: "choir", name: "Choir", family: "choir", category: "Choir", color: "#f0abfc", tags: ["voice", "air", "pad"] },
  { id: "synth-pad", name: "Sampled Synth Pad", family: "synth", category: "Synth", color: "#818cf8", tags: ["sampled", "ambient", "wide"] },
  { id: "synth-lead", name: "Sampled Synth Lead", family: "synth", category: "Synth", color: "#a78bfa", tags: ["sampled", "lead", "mono"] },
  { id: "bass", name: "Bass Guitar", family: "bass", category: "Bass", color: "#2dd4bf", tags: ["low", "solid", "sampled"] },
  { id: "finger-bass", name: "Finger Bass", family: "bass", category: "Bass", color: "#14b8a6", tags: ["pluck", "low", "round"] },
  { id: "slap-bass", name: "Slap Bass", family: "bass", category: "Bass", color: "#06b6d4", tags: ["snap", "funk", "bright"] },
  { id: "drum-kit", name: "Sample Drum Kit", family: "drums", category: "Drums", color: "#f97316", tags: ["beat", "kit", "sampled"] }
];

export function getInstrument(id: string) {
  return INSTRUMENTS.find((instrument) => instrument.id === id) ?? INSTRUMENTS[0];
}
