import type { ChordPad, InstrumentId, MixerState, PlayMode, ProjectData } from "../types";
import { INSTRUMENTS } from "./instruments";
import { sanitizeInput } from "./sanitize";

const ROOT_PATTERN = /^[A-G](?:#|b)?(?:m|maj|min|dim|sus|add|\d|\/|#|b)*$/i;
const PLAY_MODES: PlayMode[] = ["chord", "arpeggio", "fingerstyle", "strumDown", "strumUp", "autoPattern"];

export function isValidChordName(value: string) {
  const chord = sanitizeInput(value, 24);
  return chord.length > 0 && chord.length <= 24 && ROOT_PATTERN.test(chord);
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

export function validateMixer(mixer: Partial<MixerState>): MixerState {
  return {
    masterVolume: clamp(Number(mixer.masterVolume ?? 0.82), 0, 1),
    instrumentVolume: clamp(Number(mixer.instrumentVolume ?? 0.86), 0, 1),
    reverb: clamp(Number(mixer.reverb ?? 0.24), 0, 1),
    delay: clamp(Number(mixer.delay ?? 0.12), 0, 1),
    chorus: clamp(Number(mixer.chorus ?? 0.1), 0, 1),
    eqLow: clamp(Number(mixer.eqLow ?? 0), -12, 12),
    eqMid: clamp(Number(mixer.eqMid ?? 0), -12, 12),
    eqHigh: clamp(Number(mixer.eqHigh ?? 0), -12, 12),
    compressor: clamp(Number(mixer.compressor ?? 0.35), 0, 1),
    limiter: clamp(Number(mixer.limiter ?? 0.95), 0, 1)
  };
}

export function validateChordPads(value: unknown): ChordPad[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index) => {
      const name = sanitizeInput(String((item as Partial<ChordPad>)?.name ?? ""), 24);
      if (!isValidChordName(name)) return null;
      return {
        id: sanitizeInput(String((item as Partial<ChordPad>)?.id ?? `imported-${index}`), 80) || `imported-${index}`,
        name
      };
    })
    .filter((item): item is ChordPad => Boolean(item));
}

export function validateInstrument(value: unknown): InstrumentId {
  const candidate = String(value ?? "");
  return INSTRUMENTS.some((instrument) => instrument.id === candidate) ? (candidate as InstrumentId) : "acoustic-guitar";
}

export function validatePlayMode(value: unknown): PlayMode {
  return PLAY_MODES.includes(value as PlayMode) ? (value as PlayMode) : "chord";
}

export function validateProjectData(value: unknown): ProjectData | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<ProjectData>;
  const chords = validateChordPads(raw.chords);
  if (chords.length === 0) return null;

  return {
    name: sanitizeInput(String(raw.name ?? "Smart Music Project"), 64),
    chords,
    currentInstrument: validateInstrument(raw.currentInstrument),
    bpm: clamp(Number(raw.bpm ?? 96), 40, 220),
    playMode: validatePlayMode(raw.playMode),
    mixer: validateMixer(raw.mixer ?? {}),
    favoriteInstruments: (Array.isArray(raw.favoriteInstruments) ? raw.favoriteInstruments : [])
      .map(validateInstrument)
      .filter((item, index, array) => array.indexOf(item) === index),
    recentInstruments: (Array.isArray(raw.recentInstruments) ? raw.recentInstruments : [])
      .map(validateInstrument)
      .filter((item, index, array) => array.indexOf(item) === index)
      .slice(0, 8),
    exportedAt: String(raw.exportedAt ?? new Date().toISOString())
  };
}
