import { Download, FileAudio, Mic, Pause, Play, Square, Trash2 } from "lucide-react";
import { useRef } from "react";
import { audioEngine } from "../../audio/ToneEngine";
import { useStudioStore } from "../../store/useStudioStore";
import { downloadBlob } from "../../utils/download";
import { recordingToMp3Blob, recordingToWavBlob } from "../../utils/audioFiles";
import { exportEventsToMidi } from "../../utils/midi";

export function RecorderControls({ compact = false }: { compact?: boolean }) {
  const currentInstrument = useStudioStore((state) => state.currentInstrument);
  const mixer = useStudioStore((state) => state.mixer);
  const bpm = useStudioStore((state) => state.bpm);
  const recording = useStudioStore((state) => state.recording);
  const startRecordingState = useStudioStore((state) => state.startRecordingState);
  const stopRecordingState = useStudioStore((state) => state.stopRecordingState);
  const setRecordingPlayback = useStudioStore((state) => state.setRecordingPlayback);
  const deleteRecording = useStudioStore((state) => state.deleteRecording);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = async () => {
    await audioEngine.ensureReady(currentInstrument, mixer, bpm);
    await audioEngine.startRecording();
    startRecordingState();
  };

  const stopRecording = async () => {
    const blob = await audioEngine.stopRecording();
    stopRecordingState(blob);
  };

  const playRecording = async () => {
    if (!recording.url) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(recording.url);
      audioRef.current.onended = () => setRecordingPlayback("ready");
    }
    await audioRef.current.play();
    setRecordingPlayback("playing");
  };

  const pauseRecording = () => {
    audioRef.current?.pause();
    setRecordingPlayback("paused");
  };

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setRecordingPlayback(recording.blob ? "ready" : "idle");
  };

  const exportWav = async () => {
    if (!recording.blob) return;
    const wav = await recordingToWavBlob(recording.blob);
    downloadBlob(wav, "smart-music-performance.wav");
  };

  const exportMp3 = async () => {
    if (!recording.blob) return;
    const mp3 = await recordingToMp3Blob(recording.blob);
    downloadBlob(mp3, "smart-music-performance.mp3");
  };

  const exportMidi = () => {
    const midi = exportEventsToMidi(recording.events, bpm);
    downloadBlob(midi, "smart-music-performance.mid");
  };

  if (compact) {
    return (
      <button
        className={`grid size-10 place-items-center rounded-lg border transition ${
          recording.status === "recording"
            ? "border-red-300/70 bg-red-500/80 text-white"
            : "border-red-300/30 bg-red-500/15 text-red-100 hover:bg-red-500/25"
        }`}
        onClick={() => (recording.status === "recording" ? void stopRecording() : void startRecording())}
        aria-label={recording.status === "recording" ? "Stop recording" : "Record"}
        title={recording.status === "recording" ? "Stop recording" : "Record"}
      >
        {recording.status === "recording" ? <Square size={18} /> : <Mic size={18} />}
      </button>
    );
  }

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.05] p-4 shadow-pad">
      <div className="mb-4 flex items-center gap-2">
        <FileAudio size={18} className="text-red-200" />
        <h2 className="text-lg font-semibold text-white">Recorder</h2>
        <span className="ml-auto rounded-md border border-white/10 bg-black/20 px-2 py-1 text-xs capitalize text-slate-300">
          {recording.status}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
        <IconButton active={recording.status === "recording"} label="Record" onClick={() => void startRecording()}>
          <Mic size={17} />
        </IconButton>
        <IconButton label="Play" disabled={!recording.url} onClick={() => void playRecording()}>
          <Play size={17} />
        </IconButton>
        <IconButton label="Pause" disabled={!recording.url} onClick={pauseRecording}>
          <Pause size={17} />
        </IconButton>
        <IconButton label="Stop" onClick={() => (recording.status === "recording" ? void stopRecording() : stopPlayback())}>
          <Square size={17} />
        </IconButton>
        <IconButton label="Delete" disabled={!recording.url && recording.events.length === 0} onClick={deleteRecording}>
          <Trash2 size={17} />
        </IconButton>
        <IconButton label="WAV" disabled={!recording.blob} onClick={() => void exportWav()}>
          <Download size={17} />
        </IconButton>
        <IconButton label="MP3" disabled={!recording.blob} onClick={() => void exportMp3()}>
          <Download size={17} />
        </IconButton>
        <IconButton label="MIDI" disabled={recording.events.length === 0} onClick={exportMidi}>
          <Download size={17} />
        </IconButton>
      </div>
    </section>
  );
}

function IconButton({
  children,
  label,
  active = false,
  disabled = false,
  onClick
}: {
  children: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex h-12 min-w-0 items-center justify-center gap-1 rounded-lg border px-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-35 ${
        active ? "border-red-300/70 bg-red-500/75 text-white" : "border-white/10 bg-black/20 text-slate-100 hover:bg-white/10"
      }`}
      disabled={disabled}
      onClick={onClick}
      title={label}
      aria-label={label}
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
