/**
 * Procedural Web Audio Ambient Soundscape Synthesizer
 * Generates continuous, high-quality focus sounds completely offline in the browser
 * without relying on external MP3/audio files that could fail, lag, or consume bandwidth.
 */

import { AMBIENT_SOUND_LIBRARY, AmbientTrack } from './ambientSoundLibrary';

export type SoundType =
  | 'noise'
  | 'binaural'
  | 'rain'
  | 'water'
  | 'wind'
  | 'ambient_chatter'
  | 'drone'
  | 'mechanical'
  | 'bell_bowl';

export interface SoundProfile {
  type: SoundType;
  noiseColor?: 'white' | 'pink' | 'brown' | 'green' | 'blue' | 'violet' | 'gray' | 'velvet';
  filterFreq?: number;
  filterType?: BiquadFilterType;
  filterQ?: number;
  carrierFreq?: number;
  beatFreq?: number;
  frequencies?: number[];
  lfoRate?: number;
  lfoDepth?: number;
  pulseRate?: number;
  resonance?: number;
  reverbDecay?: number;
}

export { AMBIENT_SOUND_LIBRARY, type AmbientTrack };
export const AMBIENT_TRACKS: AmbientTrack[] = AMBIENT_SOUND_LIBRARY;

export class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeNodes: { stop: () => void }[] = [];
  private currentTrackId: string | null = null;
  private isPlaying = false;
  private volume = 0.65;
  private timerInterval: any = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.linearRampToValueAtTime(this.volume, this.ctx.currentTime + 0.05);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentTrack(): string | null {
    return this.currentTrackId;
  }

  public stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    if (this.masterGain && this.ctx) {
      // Gentle fade out to avoid clicks
      this.masterGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
      setTimeout(() => {
        this.activeNodes.forEach((n) => {
          try {
            n.stop();
          } catch (e) {}
        });
        this.activeNodes = [];
        if (this.masterGain && this.ctx) {
          this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        }
      }, 160);
    } else {
      this.activeNodes.forEach((n) => {
        try {
          n.stop();
        } catch (e) {}
      });
      this.activeNodes = [];
    }
  }

  public play(trackId: string) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    this.stop();
    this.currentTrackId = trackId;
    this.isPlaying = true;

    // Reset master gain to current volume with gentle attack
    this.masterGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(this.volume, this.ctx.currentTime + 0.25);

    // Map legacy IDs to new library
    let effectiveId = trackId;
    if (trackId === 'rain') effectiveId = 'rain_distant_thunder';
    if (trackId === 'binaural') effectiveId = 'binaural_alpha_10hz';
    if (trackId === 'campfire') effectiveId = 'forest_campfire_hearth';
    if (trackId === 'cafe') effectiveId = 'campus_coffee_shop_murmur';
    if (trackId === 'forest') effectiveId = 'forest_pine_wind';
    if (trackId === 'brown_noise') effectiveId = 'noise_brown_deep';

    const track = AMBIENT_SOUND_LIBRARY.find((t) => t.id === effectiveId) || AMBIENT_SOUND_LIBRARY[0];
    const profile = track.profile;

    switch (profile.type) {
      case 'binaural':
        this.createBinauralSound(profile);
        break;
      case 'rain':
        this.createRainSound(profile);
        break;
      case 'water':
        this.createWaterSound(profile);
        break;
      case 'wind':
        this.createWindSound(profile);
        break;
      case 'ambient_chatter':
        this.createChatterSound(profile);
        break;
      case 'drone':
        this.createDroneSound(profile);
        break;
      case 'mechanical':
        this.createMechanicalSound(profile);
        break;
      case 'bell_bowl':
        this.createBellBowlSound(profile);
        break;
      case 'noise':
      default:
        this.createNoiseSound(profile);
        break;
    }
  }

  // --- AUDIO GENERATION METHODS ---

  // Generate continuous noise buffer with specific color
  private createNoiseBuffer(color: string = 'white', seconds: number = 3): AudioBuffer {
    if (!this.ctx) throw new Error('AudioContext missing');
    const bufferSize = seconds * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);

    if (color === 'pink') {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    } else if (color === 'brown' || color === 'velvet') {
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      }
    } else {
      // White, Blue, Violet, Green (shaped by filters later)
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
    }
    return buffer;
  }

  // 1. Noise Sounds (Brown, Pink, White, Green, Blue, Violet, Gray, Velvet)
  private createNoiseSound(profile: SoundProfile) {
    if (!this.ctx || !this.masterGain) return;

    const noiseBuffer = this.createNoiseBuffer(profile.noiseColor || 'brown');
    const source = this.ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = profile.filterType || 'lowpass';
    filter.frequency.setValueAtTime(profile.filterFreq || 500, this.ctx.currentTime);
    if (profile.filterQ) filter.Q.setValueAtTime(profile.filterQ, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.7, this.ctx.currentTime);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start();
    this.activeNodes.push({
      stop: () => {
        try {
          source.stop();
          source.disconnect();
        } catch (e) {}
      },
    });
  }

  // 2. Binaural Beats & Brainwave Entrainment
  private createBinauralSound(profile: SoundProfile) {
    if (!this.ctx || !this.masterGain) return;

    const carrier = profile.carrierFreq || 216;
    const beat = profile.beatFreq || 10;

    const oscL = this.ctx.createOscillator();
    oscL.type = 'sine';
    oscL.frequency.setValueAtTime(carrier, this.ctx.currentTime);

    const oscR = this.ctx.createOscillator();
    oscR.type = 'sine';
    oscR.frequency.setValueAtTime(carrier + beat, this.ctx.currentTime);

    const gainL = this.ctx.createGain();
    const gainR = this.ctx.createGain();
    gainL.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gainR.gain.setValueAtTime(0.35, this.ctx.currentTime);

    const merger = this.ctx.createChannelMerger(2);

    oscL.connect(gainL);
    gainL.connect(merger, 0, 0);

    oscR.connect(gainR);
    gainR.connect(merger, 0, 1);

    // Warm underlying pink noise bed for comforting spatial presence
    const bedBuffer = this.createNoiseBuffer('pink', 2);
    const bedSource = this.ctx.createBufferSource();
    bedSource.buffer = bedBuffer;
    bedSource.loop = true;

    const bedFilter = this.ctx.createBiquadFilter();
    bedFilter.type = 'lowpass';
    bedFilter.frequency.setValueAtTime(320, this.ctx.currentTime);

    const bedGain = this.ctx.createGain();
    bedGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

    bedSource.connect(bedFilter);
    bedFilter.connect(bedGain);
    bedGain.connect(this.masterGain);

    merger.connect(this.masterGain);

    oscL.start();
    oscR.start();
    bedSource.start();

    this.activeNodes.push({
      stop: () => {
        try {
          oscL.stop();
          oscL.disconnect();
          oscR.stop();
          oscR.disconnect();
          bedSource.stop();
          bedSource.disconnect();
        } catch (e) {}
      },
    });
  }

  // 3. Rain & Storm Weather Variations
  private createRainSound(profile: SoundProfile) {
    if (!this.ctx || !this.masterGain) return;

    const noiseBuffer = this.createNoiseBuffer('pink', 2);
    const source = this.ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(profile.filterFreq || 1200, this.ctx.currentTime);
    if (profile.resonance) filter.Q.setValueAtTime(profile.resonance, this.ctx.currentTime);

    const rainGain = this.ctx.createGain();
    rainGain.gain.setValueAtTime(0.65, this.ctx.currentTime);

    source.connect(filter);
    filter.connect(rainGain);
    rainGain.connect(this.masterGain);
    source.start();

    this.activeNodes.push({
      stop: () => {
        try {
          source.stop();
          source.disconnect();
        } catch (e) {}
      },
    });

    // Subtle low frequency rumble/thunder oscillator
    const thunderOsc = this.ctx.createOscillator();
    thunderOsc.type = 'sine';
    thunderOsc.frequency.setValueAtTime(55, this.ctx.currentTime);

    const thunderGain = this.ctx.createGain();
    thunderGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

    thunderOsc.connect(thunderGain);
    thunderGain.connect(this.masterGain);
    thunderOsc.start();

    const rumblePeriod = profile.pulseRate ? 1000 / profile.pulseRate : 12000;
    this.timerInterval = setInterval(() => {
      if (!this.ctx || !this.isPlaying) return;
      const now = this.ctx.currentTime;
      thunderGain.gain.setValueAtTime(0.04, now);
      thunderGain.gain.exponentialRampToValueAtTime(0.18, now + 1.2);
      thunderGain.gain.exponentialRampToValueAtTime(0.04, now + 4.0);
    }, Math.max(5000, rumblePeriod));

    this.activeNodes.push({
      stop: () => {
        try {
          thunderOsc.stop();
          thunderOsc.disconnect();
        } catch (e) {}
      },
    });
  }

  // 4. Water, Ocean & River Variations
  private createWaterSound(profile: SoundProfile) {
    if (!this.ctx || !this.masterGain) return;

    const noiseBuffer = this.createNoiseBuffer('pink', 2);
    const source = this.ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(profile.filterFreq || 800, this.ctx.currentTime);
    filter.Q.setValueAtTime(profile.resonance || 1.2, this.ctx.currentTime);

    const waveGain = this.ctx.createGain();
    waveGain.gain.setValueAtTime(0.45, this.ctx.currentTime);

    // LFO for surf wave swells
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(profile.lfoRate || 0.1, this.ctx.currentTime);

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(250, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    source.connect(filter);
    filter.connect(waveGain);
    waveGain.connect(this.masterGain);

    source.start();
    lfo.start();

    this.activeNodes.push({
      stop: () => {
        try {
          source.stop();
          source.disconnect();
          lfo.stop();
          lfo.disconnect();
        } catch (e) {}
      },
    });
  }

  // 5. Forest, Nature & Wind
  private createWindSound(profile: SoundProfile) {
    if (!this.ctx || !this.masterGain) return;

    const noiseBuffer = this.createNoiseBuffer('pink', 3);
    const source = this.ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(profile.filterFreq || 900, this.ctx.currentTime);
    filter.Q.setValueAtTime(profile.resonance || 1.8, this.ctx.currentTime);

    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(profile.lfoRate || 0.15, this.ctx.currentTime);

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(350, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start();
    lfo.start();

    this.activeNodes.push({
      stop: () => {
        try {
          source.stop();
          source.disconnect();
          lfo.stop();
          lfo.disconnect();
        } catch (e) {}
      },
    });
  }

  // 6. Library, Campus & Coffee Shop Chatter
  private createChatterSound(profile: SoundProfile) {
    if (!this.ctx || !this.masterGain) return;

    // Convolved vocal formant warmth
    const noiseBuffer = this.createNoiseBuffer('brown', 2);
    const source = this.ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;

    const f1 = this.ctx.createBiquadFilter();
    f1.type = 'bandpass';
    f1.frequency.setValueAtTime(profile.filterFreq || 900, this.ctx.currentTime);
    f1.Q.setValueAtTime(profile.resonance || 1.5, this.ctx.currentTime);

    const f2 = this.ctx.createBiquadFilter();
    f2.type = 'lowpass';
    f2.frequency.setValueAtTime(1400, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.55, this.ctx.currentTime);

    source.connect(f1);
    f1.connect(f2);
    f2.connect(gain);
    gain.connect(this.masterGain);
    source.start();

    this.activeNodes.push({
      stop: () => {
        try {
          source.stop();
          source.disconnect();
        } catch (e) {}
      },
    });

    // Periodic gentle ceramic / page-turn acoustic resonance
    const clinkOsc = this.ctx.createOscillator();
    clinkOsc.type = 'sine';
    clinkOsc.frequency.setValueAtTime(1800, this.ctx.currentTime);

    const clinkGain = this.ctx.createGain();
    clinkGain.gain.setValueAtTime(0, this.ctx.currentTime);

    clinkOsc.connect(clinkGain);
    clinkGain.connect(this.masterGain);
    clinkOsc.start();

    this.timerInterval = setInterval(() => {
      if (!this.ctx || !this.isPlaying) return;
      const now = this.ctx.currentTime;
      clinkOsc.frequency.setValueAtTime(1200 + Math.random() * 800, now);
      clinkGain.gain.setValueAtTime(0.04, now);
      clinkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    }, 6000);

    this.activeNodes.push({
      stop: () => {
        try {
          clinkOsc.stop();
          clinkOsc.disconnect();
        } catch (e) {}
      },
    });
  }

  // 7. Space, Celestial & Deep Drones
  private createDroneSound(profile: SoundProfile) {
    if (!this.ctx || !this.masterGain) return;

    const freqs = profile.frequencies || [55, 110, 165];
    const droneGain = this.ctx.createGain();
    droneGain.gain.setValueAtTime(0.35 / Math.sqrt(freqs.length), this.ctx.currentTime);
    droneGain.connect(this.masterGain);

    const oscs: OscillatorNode[] = [];
    freqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      // Slight detune for rich celestial chorus
      osc.frequency.setValueAtTime(freq + (idx * 0.3 - 0.2), this.ctx.currentTime);
      osc.connect(droneGain);
      osc.start();
      oscs.push(osc);
    });

    // Slow filter modulation
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(650, this.ctx.currentTime);

    this.activeNodes.push({
      stop: () => {
        oscs.forEach((o) => {
          try {
            o.stop();
            o.disconnect();
          } catch (e) {}
        });
      },
    });
  }

  // 8. Mechanical, Fan & Travel Hums
  private createMechanicalSound(profile: SoundProfile) {
    if (!this.ctx || !this.masterGain) return;

    const noiseBuffer = this.createNoiseBuffer('brown', 2);
    const source = this.ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(profile.filterFreq || 650, this.ctx.currentTime);

    const motorOsc = this.ctx.createOscillator();
    motorOsc.type = 'sine';
    motorOsc.frequency.setValueAtTime(60, this.ctx.currentTime); // 60Hz mains hum

    const motorGain = this.ctx.createGain();
    motorGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    const mainGain = this.ctx.createGain();
    mainGain.gain.setValueAtTime(0.55, this.ctx.currentTime);

    source.connect(filter);
    filter.connect(mainGain);

    motorOsc.connect(motorGain);
    motorGain.connect(mainGain);

    mainGain.connect(this.masterGain);

    source.start();
    motorOsc.start();

    this.activeNodes.push({
      stop: () => {
        try {
          source.stop();
          source.disconnect();
          motorOsc.stop();
          motorOsc.disconnect();
        } catch (e) {}
      },
    });
  }

  // 9. Zen, Bells & Tibetan Singing Bowls
  private createBellBowlSound(profile: SoundProfile) {
    if (!this.ctx || !this.masterGain) return;

    const freqs = profile.frequencies || [216, 432, 648];
    const bowlGain = this.ctx.createGain();
    bowlGain.gain.setValueAtTime(0.3 / freqs.length, this.ctx.currentTime);
    bowlGain.connect(this.masterGain);

    const oscs: OscillatorNode[] = [];
    freqs.forEach((f) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, this.ctx.currentTime);
      osc.connect(bowlGain);
      osc.start();
      oscs.push(osc);
    });

    this.activeNodes.push({
      stop: () => {
        oscs.forEach((o) => {
          try {
            o.stop();
            o.disconnect();
          } catch (e) {}
        });
      },
    });
  }
}

export const soundEngine = new AmbientSoundEngine();
