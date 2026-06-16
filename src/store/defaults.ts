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
  pan: 0,
  muted: false,
  solo: false,
  reverbRoomSize: 0.42,
  reverbWet: 0.24,
  reverbDry: 0.88,
  delayTime: 0.24,
  delayFeedback: 0.22,
  delayMix: 0.12,
  chorusDepth: 0.32,
  chorusRate: 2.4,
  chorusMix: 0.1,
  reverb: 0.24,
  delay: 0.12,
  chorus: 0.1,
  eqLow: 0,
  eqMid: 0,
  eqHigh: 0,
  compressorThreshold: -20,
  compressorRatio: 3,
  compressorAttack: 0.003,
  compressorRelease: 0.25,
  compressor: 0.35,
  limiter: 0.95
};
