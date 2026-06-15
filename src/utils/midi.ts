import type { PerformanceEvent } from "../types";

const NOTE_BASE: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11
};

export function exportEventsToMidi(events: PerformanceEvent[], bpm: number) {
  const ticksPerBeat = 480;
  const trackEvents: Array<{ tick: number; bytes: number[] }> = [];
  const tempo = Math.round(60_000_000 / bpm);

  trackEvents.push({ tick: 0, bytes: [0xff, 0x51, 0x03, (tempo >> 16) & 0xff, (tempo >> 8) & 0xff, tempo & 0xff] });
  trackEvents.push({ tick: 0, bytes: [0xc0, 0x00] });

  events.forEach((event) => {
    const startTick = Math.max(0, Math.round((event.timestampMs / 1000) * (bpm / 60) * ticksPerBeat));
    const endTick = startTick + Math.max(120, Math.round((event.durationMs / 1000) * (bpm / 60) * ticksPerBeat));

    event.notes.forEach((note) => {
      const midi = noteNameToMidi(note);
      if (midi === null) return;
      trackEvents.push({ tick: startTick, bytes: [0x90, midi, 92] });
      trackEvents.push({ tick: endTick, bytes: [0x80, midi, 0] });
    });
  });

  trackEvents.sort((a, b) => a.tick - b.tick || a.bytes[0] - b.bytes[0]);
  trackEvents.push({ tick: trackEvents.at(-1)?.tick ?? 0, bytes: [0xff, 0x2f, 0x00] });

  let previousTick = 0;
  const trackData: number[] = [];
  trackEvents.forEach((event) => {
    trackData.push(...writeVarLen(event.tick - previousTick), ...event.bytes);
    previousTick = event.tick;
  });

  const header = [
    ...ascii("MThd"),
    0x00,
    0x00,
    0x00,
    0x06,
    0x00,
    0x00,
    0x00,
    0x01,
    (ticksPerBeat >> 8) & 0xff,
    ticksPerBeat & 0xff
  ];

  const track = [
    ...ascii("MTrk"),
    (trackData.length >> 24) & 0xff,
    (trackData.length >> 16) & 0xff,
    (trackData.length >> 8) & 0xff,
    trackData.length & 0xff,
    ...trackData
  ];

  return new Blob([new Uint8Array([...header, ...track])], { type: "audio/midi" });
}

function noteNameToMidi(note: string) {
  const match = /^([A-G](?:#|b)?)(-?\d+)$/.exec(note);
  if (!match) return null;
  return (Number(match[2]) + 1) * 12 + NOTE_BASE[match[1]];
}

function ascii(value: string) {
  return [...value].map((char) => char.charCodeAt(0));
}

function writeVarLen(value: number) {
  let buffer = value & 0x7f;
  const bytes = [];

  while ((value >>= 7)) {
    buffer <<= 8;
    buffer |= (value & 0x7f) | 0x80;
  }

  while (true) {
    bytes.push(buffer & 0xff);
    if (buffer & 0x80) buffer >>= 8;
    else break;
  }

  return bytes;
}
