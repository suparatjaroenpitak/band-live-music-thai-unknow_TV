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
  | "piano"
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
  | "distortion-guitar"
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
  category: "Guitar" | "Bass" | "Piano" | "Strings" | "Synth" | "Choir" | "Drums";
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
  pan: number;
  muted: boolean;
  solo: boolean;
  reverbRoomSize: number;
  reverbWet: number;
  reverbDry: number;
  delayTime: number;
  delayFeedback: number;
  delayMix: number;
  chorusDepth: number;
  chorusRate: number;
  chorusMix: number;
  reverb: number;
  delay: number;
  chorus: number;
  eqLow: number;
  eqMid: number;
  eqHigh: number;
  compressorThreshold: number;
  compressorRatio: number;
  compressorAttack: number;
  compressorRelease: number;
  compressor: number;
  limiter: number;
}

export type AudioUnlockStatus = "locked" | "initializing" | "loading" | "ready" | "error";

export interface GuitarStringNote {
  stringNumber: 1 | 2 | 3 | 4 | 5 | 6;
  openNote: "E" | "B" | "G" | "D" | "A";
  note: string | null;
  fret: number | null;
  muted: boolean;
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
