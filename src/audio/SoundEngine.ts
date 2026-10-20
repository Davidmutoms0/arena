import type { MusicalScaleId, SynthTimbreId } from '../types/universe';

export const SCALES: Record<MusicalScaleId, { label: string; rootMidi: number; intervals: number[] }> = {
  lydian: {
    label: 'Lydien Céleste (Fa#)',
    rootMidi: 50, // D3 warm foundation
    intervals: [0, 2, 4, 6, 7, 9, 11],
  },
  pentatonic: {
    label: 'Pentatonique Nébuleuse',
    rootMidi: 48, // C3
    intervals: [0, 3, 5, 7, 10],
  },
  hirajoshi: {
    label: 'Hirajoshi Stellaire',
    rootMidi: 52, // E3
    intervals: [0, 2, 3, 7, 8],
  },
  harmonicMinor: {
    label: 'Mineur Solaire',
    rootMidi: 45, // A2
    intervals: [0, 2, 3, 5, 7, 8, 11],
  },
  fifths: {
    label: 'Quintes d’Eno',
    rootMidi: 48, // C3
    intervals: [0, 2, 7, 9, 14],
  },
};

export function midiToHz(midi: number): number {
  const clamped = Math.max(24, Math.min(98, midi));
  return 440 * Math.pow(2, (clamped - 69) / 12);
}

export function degreeToFrequency(
  degree: number,
  scaleId: MusicalScaleId,
  octaveShift = 0
): number {
  const scale = SCALES[scaleId] ?? SCALES.lydian;
  const len = scale.intervals.length;
  const safeDeg = Math.round(degree);
  const oct = Math.floor(safeDeg / len) + octaveShift;
  const idx = ((safeDeg % len) + len) % len;
  const midi = scale.rootMidi + oct * 12 + scale.intervals[idx];
  return midiToHz(midi);
}

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private analyser: AnalyserNode | null = null;
  private dryBus: GainNode | null = null;
  private reverbSend: GainNode | null = null;
  private delaySend: GainNode | null = null;

  private droneGain: GainNode | null = null;
  private droneFilter: BiquadFilterNode | null = null;
  private droneOscA: OscillatorNode | null = null;
  private droneOscB: OscillatorNode | null = null;
  private droneSub: OscillatorNode | null = null;

  private enabled = false;
  private volume = 0.72;
  private scale: MusicalScaleId = 'lydian';
  private timbre: SynthTimbreId = 'celesta';
  private lastNoteTimestamps: number[] = [];
  private spectrumBuffer = new Uint8Array(32);

  public isEnabled(): boolean {
    return this.enabled;
  }

  public getScale(): MusicalScaleId {
    return this.scale;
  }

  public setScale(scale: MusicalScaleId): void {
    this.scale = scale;
    this.updateDronePitch();
  }

  public getTimbre(): SynthTimbreId {
    return this.timbre;
  }

  public setTimbre(timbre: SynthTimbreId): void {
    this.timbre = timbre;
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.ctx && this.masterGain && this.enabled) {
      this.masterGain.gain.setTargetAtTime(this.volume * 0.75, this.ctx.currentTime, 0.06);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  private initGraph(): void {
    if (this.ctx || typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    this.ctx = ctx;

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -14;
    compressor.knee.value = 18;
    compressor.ratio.value = 5;
    compressor.attack.value = 0.005;
    compressor.release.value = 0.22;

    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.0001;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.82;
    this.spectrumBuffer = new Uint8Array(analyser.frequencyBinCount);

    const dryBus = ctx.createGain();
    dryBus.gain.value = 0.72;

    // Lush algorithmic stereo space reverb (2.6s velvet tail)
    const convolver = ctx.createConvolver();
    convolver.buffer = this.buildSpaceImpulse(ctx, 2.6, 2.5);

    const reverbSend = ctx.createGain();
    reverbSend.gain.value = 0.48;

    // Dotted stereo ping-pong delay
    const delaySend = ctx.createGain();
    delaySend.gain.value = 0.26;

    const delayL = ctx.createDelay(1.0);
    const delayR = ctx.createDelay(1.0);
    delayL.delayTime.value = 0.31;
    delayR.delayTime.value = 0.465;

    const fbFilter = ctx.createBiquadFilter();
    fbFilter.type = 'lowpass';
    fbFilter.frequency.value = 1950;

    const fbGain = ctx.createGain();
    fbGain.gain.value = 0.32;

    const merger = ctx.createChannelMerger(2);

    delaySend.connect(fbFilter);
    fbFilter.connect(delayL);
    delayL.connect(delayR);
    delayR.connect(fbGain);
    fbGain.connect(fbFilter);

    delayL.connect(merger, 0, 0);
    delayR.connect(merger, 0, 1);

    dryBus.connect(compressor);
    reverbSend.connect(convolver);
    convolver.connect(compressor);
    merger.connect(compressor);

    compressor.connect(masterGain);
    masterGain.connect(analyser);
    analyser.connect(ctx.destination);

    // Warm living cosmic sub-drone
    const droneFilter = ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.value = 260;
    droneFilter.Q.value = 1.8;

    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.055;

    const rootHz = degreeToFrequency(0, this.scale, -1);
    const fifthHz = degreeToFrequency(4, this.scale, -1);

    const oscA = ctx.createOscillator();
    oscA.type = 'sawtooth';
    oscA.frequency.value = rootHz;
    oscA.detune.value = -6;

    const oscB = ctx.createOscillator();
    oscB.type = 'triangle';
    oscB.frequency.value = fifthHz;
    oscB.detune.value = 6;

    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = rootHz * 0.5;

    const subGain = ctx.createGain();
    subGain.gain.value = 0.55;

    // Gentle LFO breathing on the drone filter
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.09;
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = 110;
    lfo.connect(lfoDepth);
    lfoDepth.connect(droneFilter.frequency);

    oscA.connect(droneFilter);
    oscB.connect(droneFilter);
    sub.connect(subGain);
    subGain.connect(droneFilter);
    droneFilter.connect(droneGain);
    droneGain.connect(dryBus);
    droneGain.connect(reverbSend);

    oscA.start();
    oscB.start();
    sub.start();
    lfo.start();

    this.compressor = compressor;
    this.masterGain = masterGain;
    this.analyser = analyser;
    this.dryBus = dryBus;
    this.reverbSend = reverbSend;
    this.delaySend = delaySend;
    this.droneFilter = droneFilter;
    this.droneGain = droneGain;
    this.droneOscA = oscA;
    this.droneOscB = oscB;
    this.droneSub = sub;
  }

  private buildSpaceImpulse(ctx: AudioContext, seconds: number, decay: number): AudioBuffer {
    const rate = ctx.sampleRate;
    const length = Math.floor(rate * seconds);
    const impulse = ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const channel = impulse.getChannelData(ch);
      let prev = 0;
      for (let i = 0; i < length; i++) {
        const t = i / length;
        const env = Math.pow(1 - t, decay) * (i < 450 ? i / 450 : 1);
        const white = Math.random() * 2 - 1;
        // Progressive high-frequency damping for natural hall warmth
        const damp = 0.28 + 0.52 * (1 - t);
        prev = prev + damp * (white - prev);
        channel[i] = prev * env * 0.85;
      }
    }
    return impulse;
  }

  private updateDronePitch(): void {
    if (!this.ctx || !this.droneOscA || !this.droneOscB || !this.droneSub) return;
    const now = this.ctx.currentTime;
    const rootHz = degreeToFrequency(0, this.scale, -1);
    const fifthHz = degreeToFrequency(3, this.scale, -1);
    this.droneOscA.frequency.setTargetAtTime(rootHz, now, 0.35);
    this.droneOscB.frequency.setTargetAtTime(fifthHz, now, 0.35);
    this.droneSub.frequency.setTargetAtTime(rootHz * 0.5, now, 0.35);
  }

  public async setEnabled(enable: boolean): Promise<boolean> {
    if (enable) {
      this.initGraph();
      if (!this.ctx || !this.masterGain) return false;
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      this.enabled = true;
      this.masterGain.gain.setTargetAtTime(this.volume * 0.75, this.ctx.currentTime, 0.12);
      // Welcome harmonic chord shimmer
      this.triggerChordShimmer();
      return true;
    } else {
      this.enabled = false;
      if (this.ctx && this.masterGain) {
        this.masterGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.08);
      }
      return false;
    }
  }

  public resumeIfUnlocked(): void {
    if (this.enabled && this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public triggerChordShimmer(): void {
    if (!this.enabled || !this.ctx) return;
    [0, 2, 4, 7, 9].forEach((deg, idx) => {
      setTimeout(() => {
        this.playDegree(deg + 7, 0.28, (idx - 2) * 0.35, 1.4);
      }, idx * 75);
    });
  }

  public modulateDrone(normalizedEnergy: number): void {
    if (!this.enabled || !this.ctx || !this.droneFilter || !this.droneGain) return;
    const clamped = Math.max(0, Math.min(1, normalizedEnergy));
    const now = this.ctx.currentTime;
    this.droneFilter.frequency.setTargetAtTime(210 + clamped * 460, now, 0.25);
    this.droneGain.gain.setTargetAtTime(0.045 + clamped * 0.04, now, 0.25);
  }

  private canTriggerVoice(): boolean {
    const now = performance.now();
    // Prune notes older than 1000ms
    while (this.lastNoteTimestamps.length > 0 && now - this.lastNoteTimestamps[0] > 1000) {
      this.lastNoteTimestamps.shift();
    }
    if (this.lastNoteTimestamps.length >= 20) {
      return false;
    }
    if (
      this.lastNoteTimestamps.length > 0 &&
      now - this.lastNoteTimestamps[this.lastNoteTimestamps.length - 1] < 24
    ) {
      return false;
    }
    this.lastNoteTimestamps.push(now);
    return true;
  }

  public playDegree(
    degree: number,
    velocity = 0.45,
    pan = 0,
    duration = 1.05
  ): void {
    if (!this.enabled || !this.ctx || !this.dryBus || !this.reverbSend || !this.delaySend) return;
    if (!this.canTriggerVoice()) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;
    const freq = degreeToFrequency(degree, this.scale, 0);
    const amp = Math.max(0.03, Math.min(0.55, velocity)) * 0.36;

    const panner = ctx.createStereoPanner();
    panner.pan.value = Math.max(-0.92, Math.min(0.92, pan));

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, now);

    if (this.timbre === 'celesta') {
      // 2-Operator FM Celestial Bell
      const attack = 0.006;
      env.gain.linearRampToValueAtTime(amp, now + attack);
      env.gain.exponentialRampToValueAtTime(0.0002, now + duration);

      const carrier = ctx.createOscillator();
      carrier.type = 'sine';
      carrier.frequency.setValueAtTime(freq, now);

      const mod = ctx.createOscillator();
      mod.type = 'sine';
      mod.frequency.setValueAtTime(freq * 2.0, now);

      const modGain = ctx.createGain();
      modGain.gain.setValueAtTime(freq * 1.35, now);
      modGain.gain.exponentialRampToValueAtTime(1.0, now + duration * 0.38);

      mod.connect(modGain);
      modGain.connect(carrier.frequency);
      carrier.connect(env);

      mod.start(now);
      carrier.start(now);
      mod.stop(now + duration + 0.05);
      carrier.stop(now + duration + 0.05);
      carrier.onended = () => {
        panner.disconnect();
      };
    } else if (this.timbre === 'pad') {
      // Warm Analog Poly-Pad Pluck
      const attack = 0.045;
      const release = duration * 1.45;
      env.gain.linearRampToValueAtTime(amp * 0.85, now + attack);
      env.gain.exponentialRampToValueAtTime(0.0002, now + release);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.Q.value = 2.4;
      filter.frequency.setValueAtTime(freq * 4.2, now);
      filter.frequency.exponentialRampToValueAtTime(Math.max(180, freq * 1.15), now + release * 0.8);

      const osc1 = ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(freq, now);
      osc1.detune.value = -7;

      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq, now);
      osc2.detune.value = 7;

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(env);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + release + 0.05);
      osc2.stop(now + release + 0.05);
      osc1.onended = () => {
        panner.disconnect();
      };
    } else {
      // Crystalline Glass Harmonica
      const attack = 0.015;
      env.gain.linearRampToValueAtTime(amp * 0.9, now + attack);
      env.gain.exponentialRampToValueAtTime(0.0002, now + duration * 1.15);

      const oscMain = ctx.createOscillator();
      oscMain.type = 'sine';
      oscMain.frequency.setValueAtTime(freq, now);

      const oscOvertone = ctx.createOscillator();
      oscOvertone.type = 'triangle';
      oscOvertone.frequency.setValueAtTime(freq * 3.0, now);

      const overtoneGain = ctx.createGain();
      overtoneGain.gain.setValueAtTime(0.16, now);
      overtoneGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.45);

      oscMain.connect(env);
      oscOvertone.connect(overtoneGain);
      overtoneGain.connect(env);

      oscMain.start(now);
      oscOvertone.start(now);
      oscMain.stop(now + duration * 1.15 + 0.05);
      oscOvertone.stop(now + duration * 1.15 + 0.05);
      oscMain.onended = () => {
        panner.disconnect();
      };
    }

    env.connect(panner);
    panner.connect(this.dryBus);
    panner.connect(this.reverbSend);
    panner.connect(this.delaySend);
  }

  public playCollisionImpact(intensity = 0.6, pan = 0): void {
    if (!this.enabled || !this.ctx || !this.dryBus || !this.reverbSend) return;
    if (!this.canTriggerVoice()) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;
    const rootHz = degreeToFrequency(0, this.scale, -1);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(rootHz * 2.2, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(34, rootHz * 0.55), now + 0.55);

    const env = ctx.createGain();
    const peak = Math.min(0.42, 0.14 + intensity * 0.28);
    env.gain.setValueAtTime(peak, now);
    env.gain.exponentialRampToValueAtTime(0.0002, now + 0.72);

    const panner = ctx.createStereoPanner();
    panner.pan.value = Math.max(-0.9, Math.min(0.9, pan));

    osc.connect(env);
    env.connect(panner);
    panner.connect(this.dryBus);
    panner.connect(this.reverbSend);

    osc.start(now);
    osc.stop(now + 0.76);
    osc.onended = () => panner.disconnect();

    // Accompanying harmonic sparkle
    this.playDegree(9, intensity * 0.7, pan, 1.3);
  }

  public getSpectrumLevels(bars = 14): number[] {
    if (!this.enabled || !this.analyser) {
      return new Array(bars).fill(0.06);
    }
    this.analyser.getByteFrequencyData(this.spectrumBuffer);
    const out: number[] = [];
    const usable = Math.min(this.spectrumBuffer.length, 24);
    for (let i = 0; i < bars; i++) {
      const idx = Math.floor((i / bars) * usable);
      const val = this.spectrumBuffer[idx] / 255;
      out.push(Math.max(0.08, Math.min(1, val * 1.25)));
    }
    return out;
  }
}

export const soundEngine = new SoundEngine();
