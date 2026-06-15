import type { InstrumentId, MixerState, PlayMode } from "../types";
import { chordNameToBassNote, chordNameToNotes } from "./chords";

type ToneModule = typeof import("tone");

class SmartAudioEngine {
  private Tone: ToneModule | null = null;
  private synth: any = null;
  private drumKit: { kick: any; snare: any; hat: any } | null = null;
  private recorder: any = null;
  private masterVolume: any = null;
  private instrumentVolume: any = null;
  private reverb: any = null;
  private delay: any = null;
  private chorus: any = null;
  private eq: any = null;
  private compressor: any = null;
  private limiter: any = null;
  private activeSequence: any = null;
  private activeLoop: any = null;
  private currentInstrument: InstrumentId = "acoustic-guitar";

  async ensureReady(instrument: InstrumentId, mixer: MixerState, bpm: number) {
    if (!this.Tone) {
      this.Tone = await import("tone");
    }

    await this.Tone.start();

    if (!this.masterVolume) {
      this.createEffectsChain();
    }

    this.setBpm(bpm);
    this.updateMixer(mixer);
    if (!this.synth || instrument !== this.currentInstrument) {
      this.setInstrument(instrument);
    }
  }

  setBpm(bpm: number) {
    if (!this.Tone) return;
    this.Tone.Transport.bpm.rampTo(bpm, 0.05);
  }

  setTransportPlaying(playing: boolean) {
    if (!this.Tone) return;
    if (playing) this.Tone.Transport.start();
    else {
      this.Tone.Transport.stop();
      this.activeSequence?.stop();
      this.activeLoop?.stop();
    }
  }

  setInstrument(instrument: InstrumentId) {
    if (!this.Tone || !this.masterVolume) {
      this.currentInstrument = instrument;
      return;
    }

    this.disposeInstrument();
    this.currentInstrument = instrument;

    if (instrument === "drum-kit") {
      this.drumKit = {
        kick: new this.Tone.MembraneSynth({ pitchDecay: 0.04, octaves: 7 }).chain(this.instrumentVolume),
        snare: new this.Tone.NoiseSynth({
          noise: { type: "white" },
          envelope: { attack: 0.002, decay: 0.16, sustain: 0 }
        }).chain(this.instrumentVolume),
        hat: new this.Tone.MetalSynth({
          envelope: { attack: 0.001, decay: 0.08, release: 0.02 },
          harmonicity: 5.1,
          modulationIndex: 18,
          resonance: 2500,
          octaves: 1.5
        }).chain(this.instrumentVolume)
      };
      return;
    }

    const Tone = this.Tone;
    const voice = this.getVoice(instrument);
    this.synth = new (Tone.PolySynth as any)(voice.type, voice.options);
    this.synth.maxPolyphony = instrument.includes("bass") ? 4 : 12;
    this.synth.chain(this.instrumentVolume);
  }

  updateMixer(mixer: MixerState) {
    if (!this.Tone || !this.masterVolume) return;

    this.masterVolume.volume.rampTo(this.gainToDb(mixer.masterVolume), 0.04);
    this.instrumentVolume.volume.rampTo(this.gainToDb(mixer.instrumentVolume), 0.04);
    this.reverb.wet.rampTo(mixer.reverb, 0.08);
    this.delay.wet.rampTo(mixer.delay, 0.08);
    this.chorus.wet.rampTo(mixer.chorus, 0.08);
    this.eq.low.rampTo(mixer.eqLow, 0.06);
    this.eq.mid.rampTo(mixer.eqMid, 0.06);
    this.eq.high.rampTo(mixer.eqHigh, 0.06);
    this.compressor.threshold.rampTo(-8 - mixer.compressor * 32, 0.05);
    this.limiter.threshold.rampTo(-0.5 - (1 - mixer.limiter) * 12, 0.05);
  }

  playChord(chordName: string, mode: PlayMode) {
    if (!this.Tone) return chordNameToNotes(chordName);

    const baseOctave = this.currentInstrument.includes("bass") ? 2 : 4;
    const notes =
      this.currentInstrument.includes("bass") && this.currentInstrument !== "drum-kit"
        ? [chordNameToBassNote(chordName, 2)]
        : chordNameToNotes(chordName, baseOctave);

    if (this.currentInstrument === "drum-kit") {
      this.playDrums(mode);
      return ["C2", "D2", "F#2"];
    }

    const now = this.Tone.now();
    const velocity = 0.82;

    switch (mode) {
      case "arpeggio":
        notes.forEach((note, index) => this.synth.triggerAttackRelease(note, "8n", now + index * 0.075, velocity));
        break;
      case "fingerstyle":
        this.playFingerstyle(notes, now, velocity);
        break;
      case "strumDown":
        notes.forEach((note, index) => this.synth.triggerAttackRelease(note, "2n", now + index * 0.028, velocity));
        break;
      case "strumUp":
        [...notes].reverse().forEach((note, index) => this.synth.triggerAttackRelease(note, "2n", now + index * 0.028, velocity));
        break;
      case "autoPattern":
        this.playAutoPattern(notes, now, velocity);
        break;
      case "chord":
      default:
        this.synth.triggerAttackRelease(notes, "2n", now, velocity);
        break;
    }

    return notes;
  }

  async startRecording() {
    if (!this.Tone || !this.masterVolume) return;
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
    this.disposeInstrument();
    this.activeSequence?.dispose();
    this.activeLoop?.dispose();
    this.reverb?.dispose();
    this.delay?.dispose();
    this.chorus?.dispose();
    this.eq?.dispose();
    this.compressor?.dispose();
    this.limiter?.dispose();
    this.masterVolume?.dispose();
    this.instrumentVolume?.dispose();
  }

  private createEffectsChain() {
    if (!this.Tone) return;
    const Tone = this.Tone;

    this.instrumentVolume = new Tone.Volume(-2);
    this.chorus = new Tone.Chorus(3.5, 2.5, 0.12).start();
    this.delay = new Tone.FeedbackDelay("8n", 0.22);
    this.reverb = new Tone.Reverb({ decay: 2.6, preDelay: 0.015, wet: 0.2 });
    this.eq = new Tone.EQ3(0, 0, 0);
    this.compressor = new Tone.Compressor({ threshold: -20, ratio: 3, attack: 0.003, release: 0.25 });
    this.limiter = new Tone.Limiter(-1);
    this.masterVolume = new Tone.Volume(-1);

    this.instrumentVolume.chain(
      this.chorus,
      this.delay,
      this.reverb,
      this.eq,
      this.compressor,
      this.limiter,
      this.masterVolume,
      Tone.Destination
    );
  }

  private getVoice(instrument: InstrumentId) {
    if (!this.Tone) throw new Error("Tone is not ready");
    const Tone = this.Tone;

    if (instrument.includes("guitar") || instrument === "ukulele") {
      return {
        type: Tone.Synth,
        options: {
          oscillator: {
            type:
              instrument === "nylon-guitar" || instrument === "ukulele"
                ? "triangle"
                : instrument === "electric-guitar"
                  ? "fatsawtooth"
                  : "fatsine"
          },
          envelope: {
            attack: 0.004,
            decay: instrument === "ukulele" ? 0.18 : 0.24,
            sustain: instrument === "electric-guitar" ? 0.24 : 0.12,
            release: instrument === "electric-guitar" ? 0.85 : 0.58
          }
        }
      };
    }

    if (instrument.includes("piano")) {
      return {
        type: instrument === "electric-piano" ? Tone.FMSynth : Tone.Synth,
        options: {
          oscillator: { type: instrument === "electric-piano" ? "sine" : "triangle8" },
          envelope: { attack: 0.006, decay: 0.32, sustain: 0.34, release: 1.2 }
        }
      };
    }

    if (["strings", "violin", "cello", "choir", "synth-pad"].includes(instrument)) {
      return {
        type: Tone.Synth,
        options: {
          oscillator: { type: instrument === "choir" ? "fatsine" : "fatsawtooth" },
          envelope: {
            attack: instrument === "synth-pad" ? 0.38 : 0.18,
            decay: 0.25,
            sustain: 0.78,
            release: instrument === "cello" ? 1.9 : 1.45
          }
        }
      };
    }

    if (instrument === "synth-lead") {
      return {
        type: Tone.MonoSynth,
        options: {
          oscillator: { type: "sawtooth" },
          filter: { Q: 1, type: "lowpass", rolloff: -24 },
          envelope: { attack: 0.015, decay: 0.16, sustain: 0.48, release: 0.45 }
        }
      };
    }

    return {
      type: Tone.MonoSynth,
      options: {
        oscillator: { type: instrument === "slap-bass" ? "square" : "triangle" },
        filter: { Q: 1, type: "lowpass", rolloff: -24 },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.64, release: 0.35 }
      }
    };
  }

  private playFingerstyle(notes: string[], now: number, velocity: number) {
    const pattern = [0, 2, 1, 2, 0, 1];
    pattern.forEach((noteIndex, index) => {
      this.synth.triggerAttackRelease(notes[noteIndex % notes.length], "8n", now + index * 0.09, velocity - index * 0.035);
    });
  }

  private playAutoPattern(notes: string[], now: number, velocity: number) {
    if (!this.Tone) return;
    this.activeSequence?.dispose();

    const indexes = [0, 1, 2, 1, 0, 2, 1, 2];
    this.activeSequence = new this.Tone.Sequence(
      (time: number, index: number) => {
        this.synth.triggerAttackRelease(notes[index % notes.length], "16n", time, velocity);
      },
      indexes,
      "16n"
    );
    this.activeSequence.loop = false;
    this.activeSequence.start(now);
    this.Tone.Transport.start();
  }

  private playDrums(mode: PlayMode) {
    if (!this.Tone || !this.drumKit) return;
    const now = this.Tone.now();
    const pattern = mode === "autoPattern" ? [0, 2, 1, 2, 0, 2, 1, 2] : [0, 2, 1];

    pattern.forEach((hit, index) => {
      const time = now + index * 0.08;
      if (hit === 0) this.drumKit?.kick.triggerAttackRelease("C2", "8n", time, 0.9);
      if (hit === 1) this.drumKit?.snare.triggerAttackRelease("8n", time, 0.7);
      if (hit === 2) this.drumKit?.hat.triggerAttackRelease("16n", time, 0.45);
    });
  }

  private disposeInstrument() {
    this.synth?.dispose();
    this.synth = null;
    this.drumKit?.kick.dispose();
    this.drumKit?.snare.dispose();
    this.drumKit?.hat.dispose();
    this.drumKit = null;
  }

  private gainToDb(value: number) {
    if (!this.Tone) return -12;
    return this.Tone.gainToDb(Math.max(0.001, value));
  }
}

export const audioEngine = new SmartAudioEngine();
