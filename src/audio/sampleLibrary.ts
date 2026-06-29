import type { InstrumentId } from "../types";

export interface SampleInstrumentConfig {
  baseUrl: string;
  urls: Record<string, string>;
  release: number;
  attack?: number;
  volume?: number;
}

const GM_BASE = "https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM";
const DRUM_BASE = "https://tonejs.github.io/audio/drum-samples/CR78";
const CACHE_BUST = "?v=2";

const guitarRoots = {
  E2: `E2.mp3${CACHE_BUST}`,
  A2: `A2.mp3${CACHE_BUST}`,
  D3: `D3.mp3${CACHE_BUST}`,
  G3: `G3.mp3${CACHE_BUST}`,
  B3: `B3.mp3${CACHE_BUST}`,
  E4: `E4.mp3${CACHE_BUST}`
};

const ukuleleRoots = {
  G3: `G3.mp3${CACHE_BUST}`,
  C4: `C4.mp3${CACHE_BUST}`,
  E4: `E4.mp3${CACHE_BUST}`,
  A4: `A4.mp3${CACHE_BUST}`
};

const bassRoots = {
  E1: `E1.mp3${CACHE_BUST}`,
  A1: `A1.mp3${CACHE_BUST}`,
  D2: `D2.mp3${CACHE_BUST}`,
  G2: `G2.mp3${CACHE_BUST}`,
  C3: `C3.mp3${CACHE_BUST}`
};

const pianoRoots = {
  A1: `A1.mp3${CACHE_BUST}`,
  C2: `C2.mp3${CACHE_BUST}`,
  E2: `E2.mp3${CACHE_BUST}`,
  G2: `G2.mp3${CACHE_BUST}`,
  C3: `C3.mp3${CACHE_BUST}`,
  E3: `E3.mp3${CACHE_BUST}`,
  G3: `G3.mp3${CACHE_BUST}`,
  C4: `C4.mp3${CACHE_BUST}`,
  E4: `E4.mp3${CACHE_BUST}`,
  G4: `G4.mp3${CACHE_BUST}`,
  C5: `C5.mp3${CACHE_BUST}`,
  E5: `E5.mp3${CACHE_BUST}`,
  G5: `G5.mp3${CACHE_BUST}`,
  C6: `C6.mp3${CACHE_BUST}`
};

const bowedRoots = {
  G2: `G2.mp3${CACHE_BUST}`,
  C3: `C3.mp3${CACHE_BUST}`,
  G3: `G3.mp3${CACHE_BUST}`,
  C4: `C4.mp3${CACHE_BUST}`,
  G4: `G4.mp3${CACHE_BUST}`,
  C5: `C5.mp3${CACHE_BUST}`
};

const choirRoots = {
  C3: `C3.mp3${CACHE_BUST}`,
  G3: `G3.mp3${CACHE_BUST}`,
  C4: `C4.mp3${CACHE_BUST}`,
  G4: `G4.mp3${CACHE_BUST}`,
  C5: `C5.mp3${CACHE_BUST}`
};

const synthRoots = {
  C2: `C2.mp3${CACHE_BUST}`,
  G2: `G2.mp3${CACHE_BUST}`,
  C3: `C3.mp3${CACHE_BUST}`,
  G3: `G3.mp3${CACHE_BUST}`,
  C4: `C4.mp3${CACHE_BUST}`,
  G4: `G4.mp3${CACHE_BUST}`,
  C5: `C5.mp3${CACHE_BUST}`
};

const drumRoots = {
  C2: `kick.mp3${CACHE_BUST}`,
  D2: `snare.mp3${CACHE_BUST}`,
  "F#2": `hihat.mp3${CACHE_BUST}`
};

function gm(instrument: string) {
  return `${GM_BASE}/${instrument}-mp3/`;
}

export const SAMPLE_LIBRARY: Record<InstrumentId, SampleInstrumentConfig> = {
  "acoustic-guitar": { baseUrl: gm("acoustic_guitar_steel"), urls: guitarRoots, release: 1.4, attack: 0.002, volume: -2 },
  "nylon-guitar": { baseUrl: gm("acoustic_guitar_nylon"), urls: guitarRoots, release: 1.2, attack: 0.004, volume: -1 },
  "steel-guitar": { baseUrl: gm("acoustic_guitar_steel"), urls: guitarRoots, release: 1.2, attack: 0.002, volume: -2 },
  "electric-guitar": { baseUrl: gm("electric_guitar_clean"), urls: guitarRoots, release: 1.5, attack: 0.002, volume: -3 },
  "distortion-guitar": { baseUrl: gm("distortion_guitar"), urls: guitarRoots, release: 1.8, attack: 0.001, volume: -5 },
  "clean-guitar": { baseUrl: gm("electric_guitar_clean"), urls: guitarRoots, release: 1.6, attack: 0.002, volume: -3 },
  "jazz-guitar": { baseUrl: gm("electric_guitar_jazz"), urls: guitarRoots, release: 1.5, attack: 0.003, volume: -3 },
  ukulele: { baseUrl: gm("acoustic_guitar_nylon"), urls: ukuleleRoots, release: 0.75, attack: 0.002, volume: -1 },
  piano: { baseUrl: gm("acoustic_grand_piano"), urls: pianoRoots, release: 1.8, attack: 0.001, volume: -4 },
  "grand-piano": { baseUrl: gm("acoustic_grand_piano"), urls: pianoRoots, release: 2, attack: 0.001, volume: -4 },
  "electric-piano": { baseUrl: gm("electric_piano_1"), urls: pianoRoots, release: 1.6, attack: 0.002, volume: -3 },
  strings: { baseUrl: gm("string_ensemble_1"), urls: bowedRoots, release: 2.4, attack: 0.08, volume: -5 },
  violin: { baseUrl: gm("violin"), urls: bowedRoots, release: 1.8, attack: 0.06, volume: -4 },
  cello: { baseUrl: gm("cello"), urls: bowedRoots, release: 2, attack: 0.06, volume: -4 },
  choir: { baseUrl: gm("choir_aahs"), urls: choirRoots, release: 2.2, attack: 0.1, volume: -5 },
  "synth-pad": { baseUrl: gm("pad_2_warm"), urls: synthRoots, release: 2.5, attack: 0.12, volume: -6 },
  "synth-lead": { baseUrl: gm("lead_2_sawtooth"), urls: synthRoots, release: 0.7, attack: 0.01, volume: -7 },
  bass: { baseUrl: gm("acoustic_bass"), urls: bassRoots, release: 0.8, attack: 0.002, volume: -2 },
  "finger-bass": { baseUrl: gm("electric_bass_finger"), urls: bassRoots, release: 0.85, attack: 0.002, volume: -2 },
  "slap-bass": { baseUrl: gm("slap_bass_1"), urls: bassRoots, release: 0.6, attack: 0.001, volume: -3 },
  "drum-kit": { baseUrl: `${DRUM_BASE}/`, urls: drumRoots, release: 0.3, attack: 0.001, volume: -2 }
};
