import type { GuitarStringNote } from "../types";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const ROOTS: Record<string, number> = {
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

export function chordNameToNotes(chordName: string, baseOctave = 4) {
  const cleaned = chordName.trim();
  const match = /^([A-G](?:#|b)?)(.*)$/i.exec(cleaned);
  if (!match) return ["C4", "E4", "G4"];

  const root = normalizeRoot(match[1]);
  const suffix = match[2].toLowerCase();
  const rootValue = ROOTS[root] ?? 0;
  const intervals = getIntervals(suffix);

  return intervals.map((interval) => semitoneToNote(rootValue + interval, baseOctave));
}

export function chordNameToBassNote(chordName: string, baseOctave = 2) {
  return chordNameToNotes(chordName, baseOctave)[0];
}

const OPEN_STRINGS: Array<Pick<GuitarStringNote, "stringNumber" | "openNote"> & { openMidi: number }> = [
  { stringNumber: 1, openNote: "E", openMidi: noteToMidi("E4") },
  { stringNumber: 2, openNote: "B", openMidi: noteToMidi("B3") },
  { stringNumber: 3, openNote: "G", openMidi: noteToMidi("G3") },
  { stringNumber: 4, openNote: "D", openMidi: noteToMidi("D3") },
  { stringNumber: 5, openNote: "A", openMidi: noteToMidi("A2") },
  { stringNumber: 6, openNote: "E", openMidi: noteToMidi("E2") }
];

const COMMON_GUITAR_VOICINGS: Record<string, Array<{ note: string | null; fret: number | null }>> = {
  C: [
    { note: "E4", fret: 0 },
    { note: "C4", fret: 1 },
    { note: "G3", fret: 0 },
    { note: "E3", fret: 2 },
    { note: "C3", fret: 3 },
    { note: null, fret: null }
  ],
  G: [
    { note: "G4", fret: 3 },
    { note: "B3", fret: 0 },
    { note: "G3", fret: 0 },
    { note: "D3", fret: 0 },
    { note: "B2", fret: 2 },
    { note: "G2", fret: 3 }
  ],
  Am: [
    { note: "E4", fret: 0 },
    { note: "C4", fret: 1 },
    { note: "A3", fret: 2 },
    { note: "E3", fret: 2 },
    { note: "A2", fret: 0 },
    { note: null, fret: null }
  ],
  F: [
    { note: "F4", fret: 1 },
    { note: "C4", fret: 1 },
    { note: "A3", fret: 2 },
    { note: "F3", fret: 3 },
    { note: "C3", fret: 3 },
    { note: "F2", fret: 1 }
  ],
  Dm: [
    { note: "F4", fret: 1 },
    { note: "D4", fret: 3 },
    { note: "A3", fret: 2 },
    { note: "D3", fret: 0 },
    { note: null, fret: null },
    { note: null, fret: null }
  ],
  Em: [
    { note: "E4", fret: 0 },
    { note: "B3", fret: 0 },
    { note: "G3", fret: 0 },
    { note: "E3", fret: 2 },
    { note: "B2", fret: 2 },
    { note: "E2", fret: 0 }
  ]
};

export function chordNameToGuitarStrings(chordName: string): GuitarStringNote[] {
  const root = getChordRootName(chordName);
  const quality = getChordQualityName(chordName);
  const common = COMMON_GUITAR_VOICINGS[`${root}${quality}`] ?? COMMON_GUITAR_VOICINGS[root];

  if (common) {
    return OPEN_STRINGS.map((string, index) => ({
      stringNumber: string.stringNumber,
      openNote: string.openNote,
      note: common[index].note,
      fret: common[index].fret,
      muted: common[index].note === null
    }));
  }

  const chordNotes = chordNameToNotes(chordName, 3).map((note) => normalizeNoteName(note));
  return OPEN_STRINGS.map((string) => {
    const match = findClosestFret(string.openMidi, chordNotes);
    return {
      stringNumber: string.stringNumber,
      openNote: string.openNote,
      note: match ? midiToNote(match.midi) : null,
      fret: match?.fret ?? null,
      muted: !match
    };
  });
}

function normalizeRoot(value: string) {
  const root = value[0].toUpperCase() + value.slice(1);
  return ROOTS[root] === undefined ? "C" : root;
}

function getIntervals(suffix: string) {
  const isMinor = /^m(?!aj)/.test(suffix) || suffix.includes("min");
  const isDim = suffix.includes("dim");
  const isSus4 = suffix.includes("sus4") || suffix === "sus";
  const isMaj7 = suffix.includes("maj7");
  const has7 = suffix.includes("7");
  const hasAdd9 = suffix.includes("add9");

  if (isDim) return has7 ? [0, 3, 6, 9] : [0, 3, 6];
  if (isSus4) return has7 ? [0, 5, 7, 10] : [0, 5, 7];

  const triad = isMinor ? [0, 3, 7] : [0, 4, 7];
  if (isMaj7) return [...triad, 11];
  if (has7) return [...triad, 10];
  if (hasAdd9) return [...triad, 14];

  return triad;
}

function semitoneToNote(value: number, baseOctave: number) {
  const octaveOffset = Math.floor(value / 12);
  const note = NOTE_NAMES[((value % 12) + 12) % 12];
  return `${note}${baseOctave + octaveOffset}`;
}

function getChordRootName(chordName: string) {
  const match = /^([A-G](?:#|b)?)/i.exec(chordName.trim());
  return match ? normalizeRoot(match[1]) : "C";
}

function getChordQualityName(chordName: string) {
  const match = /^[A-G](?:#|b)?(.*)$/i.exec(chordName.trim());
  const suffix = match?.[1]?.toLowerCase() ?? "";
  if (/^m(?!aj)/.test(suffix) || suffix.includes("min")) return "m";
  return "";
}

function normalizeNoteName(note: string) {
  return note.replace(/\d+/g, "");
}

function noteToMidi(note: string) {
  const match = /^([A-G](?:#|b)?)(-?\d+)$/.exec(note);
  if (!match) return 60;
  const root = normalizeRoot(match[1]);
  return (Number(match[2]) + 1) * 12 + (ROOTS[root] ?? 0);
}

function midiToNote(midi: number) {
  const note = NOTE_NAMES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${note}${octave}`;
}

function findClosestFret(openMidi: number, chordNotes: string[]) {
  for (let fret = 0; fret <= 5; fret += 1) {
    const midi = openMidi + fret;
    const noteName = NOTE_NAMES[((midi % 12) + 12) % 12];
    if (chordNotes.includes(noteName)) return { midi, fret };
  }
  return null;
}
