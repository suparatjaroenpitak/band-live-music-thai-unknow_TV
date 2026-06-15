export type PlayMode =
  | "chord"
  | "arpeggio"
  | "fingerstyle"
  | "strumDown"
  | "strumUp"
  | "autoPattern";

export type InstrumentFamily =
  | "guitar"
  | "ukulele"
  | "keys"
  | "strings"
  | "choir"
  | "synth"
  | "bass"
  | "drums";

export type InstrumentId =
  | "acoustic-guitar"
  | "nylon-guitar"
  | "steel-guitar"
  | "electric-guitar"
  | "clean-guitar"
  | "jazz-guitar"
  | "ukulele"
  | "piano"
  | "grand-piano"
  | "electric-piano"
  | "strings"
  | "violin"
  | "cello"
  | "choir"
  | "synth-pad"
  | "synth-lead"
  | "bass"
  | "finger-bass"
  | "slap-bass"
  | "drum-kit";

export interface InstrumentDefinition {
  id: InstrumentId;
  name: string;
  family: InstrumentFamily;
  color: string;
  tags: string[];
}

export interface ChordPad {
  id: string;
  name: string;
}

export interface MixerState {
  masterVolume: number;
  instrumentVolume: number;
  reverb: number;
  delay: number;
  chorus: number;
  eqLow: number;
  eqMid: number;
  eqHigh: number;
  compressor: number;
  limiter: number;
}

export interface PerformanceEvent {
  id: string;
  chordName: string;
  notes: string[];
  mode: PlayMode;
  instrument: InstrumentId;
  timestampMs: number;
  durationMs: number;
}

export interface ProjectData {
  name: string;
  chords: ChordPad[];
  currentInstrument: InstrumentId;
  bpm: number;
  playMode: PlayMode;
  mixer: MixerState;
  favoriteInstruments: InstrumentId[];
  recentInstruments: InstrumentId[];
  exportedAt: string;
}

export type RecorderStatus = "idle" | "recording" | "ready" | "playing" | "paused";
