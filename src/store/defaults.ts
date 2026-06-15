import type { ChordPad, MixerState } from "../types";
import { createId } from "../utils/ids";

export const DEFAULT_CHORD_NAMES = [
  "C",
  "Dm",
  "Em",
  "F",
  "G",
  "Am",
  "Bdim",
  "C7",
  "D7",
  "E7",
  "Fmaj7",
  "G7",
  "Am7",
  "Bm7",
  "Cmaj7",
  "Dsus4",
  "Esus4",
  "Gsus4",
  "Aadd9",
  "Bb"
];

export const DEFAULT_CHORDS: ChordPad[] = DEFAULT_CHORD_NAMES.map((name) => ({
  id: createId("chord"),
  name
}));

export const DEFAULT_MIXER: MixerState = {
  masterVolume: 0.82,
  instrumentVolume: 0.86,
  reverb: 0.24,
  delay: 0.12,
  chorus: 0.1,
  eqLow: 0,
  eqMid: 0,
  eqHigh: 0,
  compressor: 0.35,
  limiter: 0.95
};
