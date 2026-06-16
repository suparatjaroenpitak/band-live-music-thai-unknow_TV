import type { AudioUnlockStatus, InstrumentId, MixerState, PlayMode } from "../types";
import { chordNameToBassNote, chordNameToGuitarStrings, chordNameToNotes } from "./chords";
import { SAMPLE_LIBRARY } from "./sampleLibrary";

type ToneModule = typeof import("tone");
type StatusListener = (status: AudioUnlockStatus, message: string) => void;
type StrumDirection = "down" | "up";

interface SustainVoice {
  notes: string[];
  sampler: any;
}

class SmartAudioEngine {
  private Tone: ToneModule | null = null;
  private recorder: any = null;
  private masterVolume: any = null;
  private instrumentVolume: any = null;
  private pan: any = null;
  private dryGain: any = null;
  private wetGain: any = null;
  private reverb: any = null;
  private delay: any = null;
  private chorus: any = null;
  private eq: any = null;
  private compressor: any = null;
  private limiter: any = null;
  private activeSequence: any = null;
  private activeLoop: any = null;
  private currentInstrument: InstrumentId = "acoustic-guitar";
  private currentSampler: any = null;
  private readonly samplerCache = new Map<InstrumentId, any>();
  private readonly samplerPromises = new Map<InstrumentId, Promise<any>>();
  private readonly sustainVoices = new Map<string, SustainVoice>();
  private readonly listeners = new Set<StatusListener>();
  private unlockPromise: Promise<void> | null = null;
  private status: AudioUnlockStatus = "locked";
  private statusMessage = "Tap to start audio";

  getStatus() {
    return { status: this.status, message: this.statusMessage };
  }

  subscribe(listener: StatusListener) {
    this.listeners.add(listener);
    listener(this.status, this.statusMessage);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async ensureReady(instrument: InstrumentId, mixer: MixerState, bpm: number) {
    if (this.status !== "ready") {
      await this.unlockFromGesture(instrument, mixer, bpm);
      return;
    }

    this.setBpm(bpm);
    this.updateMixer(mixer);
    await this.setInstrument(instrument);
  }

  async unlockFromGesture(instrument: InstrumentId, mixer: MixerState, bpm: number) {
    if (this.status === "ready") {
      this.setBpm(bpm);
      this.updateMixer(mixer);
      await this.setInstrument(instrument);
      return;
    }

    if (this.unlockPromise) return this.unlockPromise;

    this.unlockPromise = this.bootAudio(instrument, mixer, bpm);
    try {
      await this.unlockPromise;
    } finally {
      this.unlockPromise = null;
    }
  }

  async preloadInstrument(instrument: InstrumentId) {
    if (!this.Tone || !this.masterVolume) return;
    this.setStatus("loading", `Loading ${instrument.replaceAll("-", " ")}`);
    await this.loadSampler(instrument);
    if (this.status !== "error") this.setStatus("ready", "Audio Ready");
  }

  setBpm(bpm: number) {
    if (!this.Tone) return;
    this.Tone.Transport.bpm.rampTo(bpm, 0.05);
  }

  setTransportPlaying(playing: boolean) {
    if (!this.Tone || this.status !== "ready") return;
    if (playing) this.Tone.Transport.start();
    else {
      this.Tone.Transport.stop();
      this.activeSequence?.stop();
      this.activeLoop?.stop();
    }
  }

  async setInstrument(instrument: InstrumentId) {
    this.currentInstrument = instrument;
    if (!this.Tone || !this.instrumentVolume || this.status === "locked") return;

    this.setStatus("loading", `Loading ${instrument.replaceAll("-", " ")}`);
    const sampler = await this.loadSampler(instrument);
    if (this.currentSampler && this.currentSampler !== sampler) {
      this.currentSampler.releaseAll?.();
      this.currentSampler.disconnect?.();
    }
    sampler.disconnect?.();
    sampler.connect(this.instrumentVolume);
    this.currentSampler = sampler;
    this.setStatus("ready", "Audio Ready");
  }

  updateMixer(mixer: MixerState) {
    if (!this.Tone || !this.masterVolume) return;

    this.masterVolume.volume.rampTo(this.gainToDb(mixer.masterVolume), 0.04);
    this.instrumentVolume.volume.rampTo(this.gainToDb(mixer.instrumentVolume), 0.04);
    this.instrumentVolume.mute = mixer.muted && !mixer.solo;
    this.pan.pan.rampTo(mixer.pan, 0.035);
    this.dryGain.gain.rampTo(mixer.reverbDry, 0.05);
    this.wetGain.gain.rampTo(mixer.reverbWet, 0.05);

    this.reverb.decay = 0.35 + mixer.reverbRoomSize * 7.5;
    this.reverb.wet.rampTo(1, 0.05);

    this.delay.delayTime.rampTo(mixer.delayTime, 0.04);
    this.delay.feedback.rampTo(mixer.delayFeedback, 0.04);
    this.delay.wet.rampTo(mixer.delayMix, 0.04);

    this.chorus.depth = mixer.chorusDepth;
    this.chorus.frequency.rampTo(mixer.chorusRate, 0.04);
    this.chorus.wet.rampTo(mixer.chorusMix, 0.04);

    this.eq.low.rampTo(mixer.eqLow, 0.06);
    this.eq.mid.rampTo(mixer.eqMid, 0.06);
    this.eq.high.rampTo(mixer.eqHigh, 0.06);

    this.compressor.threshold.rampTo(mixer.compressorThreshold, 0.05);
    this.compressor.ratio.rampTo(mixer.compressorRatio, 0.05);
    this.compressor.attack.rampTo(mixer.compressorAttack, 0.05);
    this.compressor.release.rampTo(mixer.compressorRelease, 0.05);
    this.limiter.threshold.rampTo(-0.5 - (1 - mixer.limiter) * 12, 0.05);
  }

  playChord(chordName: string, mode: PlayMode) {
    const notes = this.getPlayableNotes(chordName);
    if (!this.Tone || !this.currentSampler || this.status !== "ready") return notes;

    if (this.currentInstrument === "drum-kit") {
      this.playDrums(mode);
      return notes;
    }

    const now = this.Tone.now();
    const velocity = 0.82;

    switch (mode) {
      case "arpeggio":
        notes.forEach((note, index) => this.currentSampler.triggerAttackRelease(note, "8n", now + index * 0.075, velocity));
        break;
      case "fingerstyle":
        this.playFingerstyle(notes, now, velocity);
        break;
      case "strumDown":
        this.triggerStrum(notes, "down", now, false);
        break;
      case "strumUp":
        this.triggerStrum(notes, "up", now, false);
        break;
      case "autoPattern":
        this.playAutoPattern(notes, now, velocity);
        break;
      case "chord":
      default:
        this.currentSampler.triggerAttackRelease(notes, "2n", now, velocity);
        break;
    }

    return notes;
  }

  startSustainChord(chordName: string, sustainId: string) {
    const notes = this.getPlayableNotes(chordName);
    if (!this.Tone || !this.currentSampler || this.status !== "ready") return notes;
    if (this.currentInstrument === "drum-kit") {
      this.playDrums("chord");
      return notes;
    }

    this.stopSustainChord(sustainId);
    this.currentSampler.triggerAttack(notes, this.Tone.now(), 0.82);
    this.sustainVoices.set(sustainId, { notes, sampler: this.currentSampler });
    return notes;
  }

  stopSustainChord(sustainId: string) {
    if (!this.Tone) return;
    const voice = this.sustainVoices.get(sustainId);
    if (!voice) return;
    voice.sampler.triggerRelease(voice.notes, this.Tone.now() + 0.015);
    this.sustainVoices.delete(sustainId);
  }

  stopAllSustainChords() {
    Array.from(this.sustainVoices.keys()).forEach((id) => this.stopSustainChord(id));
  }

  playGuitarString(chordName: string, stringIndex: number, palmMute = false) {
    const string = chordNameToGuitarStrings(chordName)[stringIndex];
    if (!string?.note || !this.Tone || !this.currentSampler || this.status !== "ready") return string?.note ?? null;
    this.currentSampler.triggerAttackRelease(string.note, palmMute ? "32n" : "8n", this.Tone.now(), palmMute ? 0.58 : 0.84);
    return string.note;
  }

  strumGuitar(chordName: string, direction: StrumDirection, palmMute = false) {
    const strings = chordNameToGuitarStrings(chordName).filter((string) => string.note);
    const ordered = direction === "down" ? [...strings].reverse() : strings;
    const notes = ordered.map((string) => string.note as string);
    if (!this.Tone || !this.currentSampler || this.status !== "ready") return notes;
    this.triggerStrum(notes, direction, this.Tone.now(), palmMute);
    return notes;
  }

  async startRecording() {
    if (!this.Tone || !this.masterVolume || this.status !== "ready") return;
    if (!this.recorder) {
      this.recorder = new this.Tone.Recorder();
      this.masterVolume.connect(this.recorder);
    }
    await this.recorder.start();
  }

  async stopRecording() {
    if (!this.recorder) return null;
    return (await this.recorder.stop()) as Blob;
  }

  dispose() {
    this.stopAllSustainChords();
    this.activeSequence?.dispose();
    this.activeLoop?.dispose();
    this.samplerCache.forEach((sampler) => sampler.dispose?.());
    this.samplerCache.clear();
    this.reverb?.dispose();
    this.delay?.dispose();
    this.chorus?.dispose();
    this.eq?.dispose();
    this.compressor?.dispose();
    this.limiter?.dispose();
    this.masterVolume?.dispose();
    this.instrumentVolume?.dispose();
    this.pan?.dispose();
    this.dryGain?.dispose();
    this.wetGain?.dispose();
  }

  private async bootAudio(instrument: InstrumentId, mixer: MixerState, bpm: number) {
    try {
      this.setStatus("initializing", "Starting AudioContext");
      if (!this.Tone) this.Tone = await import("tone");

      await this.Tone.start();
      await this.resumeRawContext();

      if (!this.masterVolume) this.createEffectsChain();

      this.setBpm(bpm);
      this.updateMixer(mixer);
      await this.setInstrument(instrument);
      this.setStatus("ready", "Audio Ready");
    } catch (error) {
      this.setStatus("error", error instanceof Error ? error.message : "Audio failed to start");
      throw error;
    }
  }

  private async resumeRawContext() {
    if (!this.Tone) return;
    const toneWithContext = this.Tone as ToneModule & {
      getContext?: () => { rawContext?: AudioContext; resume?: () => Promise<void> };
      context?: { rawContext?: AudioContext; state?: string; resume?: () => Promise<void> };
    };
    const toneContext = toneWithContext.getContext?.() ?? toneWithContext.context;
    const rawContext = toneContext?.rawContext ?? (toneContext as unknown as AudioContext | undefined);

    if (toneContext?.resume) await toneContext.resume();
    if (rawContext?.state === "suspended") await rawContext.resume();
  }

  private createEffectsChain() {
    if (!this.Tone) return;
    const Tone = this.Tone;

    this.instrumentVolume = new Tone.Volume(-2);
    this.pan = new Tone.Panner(0);
    this.dryGain = new Tone.Gain(0.88);
    this.wetGain = new Tone.Gain(0.24);
    this.chorus = new Tone.Chorus({ frequency: 2.4, delayTime: 3.5, depth: 0.32, wet: 0.1 }).start();
    this.delay = new Tone.FeedbackDelay({ delayTime: 0.24, feedback: 0.22, wet: 0.12 });
    this.reverb = new Tone.Reverb({ decay: 3.5, preDelay: 0.015, wet: 1 });
    this.eq = new Tone.EQ3(0, 0, 0);
    this.compressor = new Tone.Compressor({ threshold: -20, ratio: 3, attack: 0.003, release: 0.25 });
    this.limiter = new Tone.Limiter(-1);
    this.masterVolume = new Tone.Volume(-1);

    this.instrumentVolume.connect(this.pan);
    this.pan.connect(this.dryGain);
    this.dryGain.connect(this.eq);
    this.pan.connect(this.chorus);
    this.chorus.connect(this.delay);
    this.delay.connect(this.reverb);
    this.reverb.connect(this.wetGain);
    this.wetGain.connect(this.eq);
    this.eq.chain(this.compressor, this.limiter, this.masterVolume, Tone.Destination);
  }

  private async loadSampler(instrument: InstrumentId) {
    const cached = this.samplerCache.get(instrument);
    if (cached) return cached;

    const loading = this.samplerPromises.get(instrument);
    if (loading) return loading;

    if (!this.Tone) throw new Error("Tone is not ready");

    const Tone = this.Tone;
    const config = SAMPLE_LIBRARY[instrument] ?? SAMPLE_LIBRARY["acoustic-guitar"];
    let timeoutId = 0;
    let sampler: any;

    const promise = new Promise<any>((resolve, reject) => {
      timeoutId = window.setTimeout(() => reject(new Error(`Sample load timed out: ${instrument}`)), 20_000);
      sampler = new Tone.Sampler({
        urls: config.urls,
        baseUrl: config.baseUrl,
        attack: config.attack ?? 0,
        release: config.release,
        onload: () => {
          window.clearTimeout(timeoutId);
          resolve(sampler);
        },
        onerror: (error: unknown) => {
          window.clearTimeout(timeoutId);
          reject(error instanceof Error ? error : new Error(`Could not load samples: ${instrument}`));
        }
      });
      sampler.volume.value = config.volume ?? 0;
    });

    this.samplerPromises.set(instrument, promise);
    try {
      const loaded = await promise;
      this.samplerCache.set(instrument, loaded);
      return loaded;
    } finally {
      this.samplerPromises.delete(instrument);
    }
  }

  private getPlayableNotes(chordName: string) {
    if (this.currentInstrument === "drum-kit") return ["C2", "F#2", "D2"];
    if (this.currentInstrument.includes("bass")) return [chordNameToBassNote(chordName, 2)];
    if (this.currentInstrument.includes("guitar") || this.currentInstrument === "ukulele") {
      return chordNameToGuitarStrings(chordName)
        .filter((string) => string.note)
        .map((string) => string.note as string);
    }
    return chordNameToNotes(chordName, this.currentInstrument.includes("piano") ? 4 : 3);
  }

  private triggerStrum(notes: string[], direction: StrumDirection, startTime: number, palmMute: boolean) {
    if (!this.currentSampler) return;
    const ordered = direction === "down" ? [...notes].reverse() : notes;
    const duration = palmMute ? "32n" : "2n";
    const gap = palmMute ? 0.014 : 0.026;
    ordered.forEach((note, index) => this.currentSampler.triggerAttackRelease(note, duration, startTime + index * gap, palmMute ? 0.58 : 0.84));
  }

  private playFingerstyle(notes: string[], now: number, velocity: number) {
    const pattern = [0, 2, 1, 2, 0, 1];
    pattern.forEach((noteIndex, index) => {
      this.currentSampler.triggerAttackRelease(notes[noteIndex % notes.length], "8n", now + index * 0.09, velocity - index * 0.035);
    });
  }

  private playAutoPattern(notes: string[], now: number, velocity: number) {
    if (!this.Tone || !this.currentSampler) return;
    this.activeSequence?.dispose();

    const indexes = [0, 1, 2, 1, 0, 2, 1, 2];
    this.activeSequence = new this.Tone.Sequence(
      (time: number, index: number) => {
        this.currentSampler.triggerAttackRelease(notes[index % notes.length], "16n", time, velocity);
      },
      indexes,
      "16n"
    );
    this.activeSequence.loop = false;
    this.activeSequence.start(now);
    this.Tone.Transport.start();
  }

  private playDrums(mode: PlayMode) {
    if (!this.Tone || !this.currentSampler) return;
    const now = this.Tone.now();
    const pattern = mode === "autoPattern" ? ["C2", "F#2", "D2", "F#2", "C2", "F#2", "D2", "F#2"] : ["C2", "F#2", "D2"];

    pattern.forEach((note, index) => {
      const velocity = note === "C2" ? 0.9 : note === "D2" ? 0.72 : 0.48;
      this.currentSampler.triggerAttackRelease(note, note === "F#2" ? "32n" : "8n", now + index * 0.08, velocity);
    });
  }

  private setStatus(status: AudioUnlockStatus, message: string) {
    this.status = status;
    this.statusMessage = message;
    this.listeners.forEach((listener) => listener(status, message));
  }

  private gainToDb(value: number) {
    if (!this.Tone) return -12;
    return this.Tone.gainToDb(Math.max(0.001, value));
  }
}

export const audioEngine = new SmartAudioEngine();
