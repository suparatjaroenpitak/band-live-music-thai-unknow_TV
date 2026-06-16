import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  ChordPad,
  InstrumentId,
  MixerState,
  PerformanceEvent,
  PlayMode,
  ProjectData,
  RecorderStatus
} from "../types";
import { createId } from "../utils/ids";
import { sanitizeInput } from "../utils/sanitize";
import { clamp, validateMixer } from "../utils/validation";
import { DEFAULT_CHORDS, DEFAULT_MIXER } from "./defaults";

interface RecordingState {
  status: RecorderStatus;
  startedAt: number | null;
  events: PerformanceEvent[];
  blob?: Blob;
  url?: string;
}

interface StudioState {
  projectName: string;
  chords: ChordPad[];
  currentChord: string | null;
  currentInstrument: InstrumentId;
  favoriteInstruments: InstrumentId[];
  recentInstruments: InstrumentId[];
  bpm: number;
  playMode: PlayMode;
  mixer: MixerState;
  transportPlaying: boolean;
  recording: RecordingState;
  lastSavedAt: string | null;
  setProjectName: (name: string) => void;
  setCurrentInstrument: (instrument: InstrumentId) => void;
  toggleFavoriteInstrument: (instrument: InstrumentId) => void;
  setBpm: (bpm: number) => void;
  setPlayMode: (mode: PlayMode) => void;
  setTransportPlaying: (playing: boolean) => void;
  setMixerValue: <K extends keyof MixerState>(key: K, value: MixerState[K]) => void;
  addChord: (name: string) => void;
  updateChord: (id: string, name: string) => void;
  removeChord: (id: string) => void;
  reorderChord: (fromId: string, toId: string) => void;
  setChordSet: (chords: ChordPad[]) => void;
  setCurrentChord: (id: string | null) => void;
  markSaved: () => void;
  exportProject: () => ProjectData;
  importProject: (project: ProjectData) => void;
  startRecordingState: () => void;
  stopRecordingState: (blob: Blob | null) => void;
  setRecordingPlayback: (status: RecorderStatus) => void;
  deleteRecording: () => void;
  addPerformanceEvent: (event: Omit<PerformanceEvent, "id" | "timestampMs">) => void;
}

const emptyRecording = (): RecordingState => ({
  status: "idle",
  startedAt: null,
  events: []
});

export const useStudioStore = create<StudioState>()(
  persist(
    (set, get) => ({
      projectName: "Smart Music Project",
      chords: DEFAULT_CHORDS,
      currentChord: null,
      currentInstrument: "acoustic-guitar",
      favoriteInstruments: ["acoustic-guitar", "piano", "synth-pad"],
      recentInstruments: ["acoustic-guitar"],
      bpm: 96,
      playMode: "chord",
      mixer: DEFAULT_MIXER,
      transportPlaying: false,
      recording: emptyRecording(),
      lastSavedAt: null,
      setProjectName: (name) => set({ projectName: sanitizeInput(name, 64) || "Smart Music Project" }),
      setCurrentInstrument: (instrument) =>
        set((state) => ({
          currentInstrument: instrument,
          recentInstruments: [instrument, ...state.recentInstruments.filter((item) => item !== instrument)].slice(0, 8)
        })),
      toggleFavoriteInstrument: (instrument) =>
        set((state) => ({
          favoriteInstruments: state.favoriteInstruments.includes(instrument)
            ? state.favoriteInstruments.filter((item) => item !== instrument)
            : [instrument, ...state.favoriteInstruments]
        })),
      setBpm: (bpm) => set({ bpm: clamp(Math.round(bpm), 40, 220) }),
      setPlayMode: (playMode) => set({ playMode }),
      setTransportPlaying: (transportPlaying) => set({ transportPlaying }),
      setMixerValue: (key, value) =>
        set((state) => ({
          mixer: validateMixer({
            ...state.mixer,
            [key]: value
          })
        })),
      addChord: (name) => {
        const chordName = sanitizeInput(name, 24);
        if (!chordName) return;
        set((state) => ({ chords: [...state.chords, { id: createId("chord"), name: chordName }] }));
      },
      updateChord: (id, name) => {
        const chordName = sanitizeInput(name, 24);
        if (!chordName) return;
        set((state) => ({
          chords: state.chords.map((chord) => (chord.id === id ? { ...chord, name: chordName } : chord))
        }));
      },
      removeChord: (id) =>
        set((state) => ({
          chords: state.chords.filter((chord) => chord.id !== id),
          currentChord: state.currentChord === id ? null : state.currentChord
        })),
      reorderChord: (fromId, toId) =>
        set((state) => {
          const fromIndex = state.chords.findIndex((chord) => chord.id === fromId);
          const toIndex = state.chords.findIndex((chord) => chord.id === toId);
          if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return state;
          const next = [...state.chords];
          const [moved] = next.splice(fromIndex, 1);
          next.splice(toIndex, 0, moved);
          return { chords: next };
        }),
      setChordSet: (chords) => set({ chords }),
      setCurrentChord: (currentChord) => set({ currentChord }),
      markSaved: () => set({ lastSavedAt: new Date().toISOString() }),
      exportProject: () => {
        const state = get();
        return {
          name: state.projectName,
          chords: state.chords,
          currentInstrument: state.currentInstrument,
          bpm: state.bpm,
          playMode: state.playMode,
          mixer: state.mixer,
          favoriteInstruments: state.favoriteInstruments,
          recentInstruments: state.recentInstruments,
          exportedAt: new Date().toISOString()
        };
      },
      importProject: (project) =>
        set({
          projectName: project.name,
          chords: project.chords,
          currentInstrument: project.currentInstrument,
          bpm: project.bpm,
          playMode: project.playMode,
          mixer: project.mixer,
          favoriteInstruments: project.favoriteInstruments,
          recentInstruments: project.recentInstruments
        }),
      startRecordingState: () => {
        const previousUrl = get().recording.url;
        if (previousUrl) URL.revokeObjectURL(previousUrl);
        set({
          recording: {
            status: "recording",
            startedAt: performance.now(),
            events: []
          }
        });
      },
      stopRecordingState: (blob) =>
        set((state) => ({
          recording: {
            ...state.recording,
            status: blob ? "ready" : "idle",
            startedAt: null,
            blob: blob ?? undefined,
            url: blob ? URL.createObjectURL(blob) : undefined
          }
        })),
      setRecordingPlayback: (status) =>
        set((state) => ({
          recording: {
            ...state.recording,
            status
          }
        })),
      deleteRecording: () => {
        const url = get().recording.url;
        if (url) URL.revokeObjectURL(url);
        set({ recording: emptyRecording() });
      },
      addPerformanceEvent: (event) =>
        set((state) => {
          if (state.recording.status !== "recording" || state.recording.startedAt === null) return state;
          return {
            recording: {
              ...state.recording,
              events: [
                ...state.recording.events,
                {
                  ...event,
                  id: createId("event"),
                  timestampMs: performance.now() - state.recording.startedAt
                }
              ]
            }
          };
        })
    }),
    {
      name: "smart-music-studio",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted) => {
        if (!persisted || typeof persisted !== "object") return persisted;
        const state = persisted as Partial<StudioState>;
        return {
          ...state,
          mixer: validateMixer(state.mixer ?? {})
        };
      },
      partialize: (state) => ({
        projectName: state.projectName,
        chords: state.chords,
        currentInstrument: state.currentInstrument,
        favoriteInstruments: state.favoriteInstruments,
        recentInstruments: state.recentInstruments,
        bpm: state.bpm,
        playMode: state.playMode,
        mixer: state.mixer,
        lastSavedAt: state.lastSavedAt
      })
    }
  )
);
