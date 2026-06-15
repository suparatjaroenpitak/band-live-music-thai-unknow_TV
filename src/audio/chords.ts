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
