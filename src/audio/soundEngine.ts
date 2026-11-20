import { ToneMode } from '../types/game';

/**
 * Web Audio API 프로시저럴 한국적 사운드 엔진 (외부 오디오 용량 0KB)
 * 교실 환경을 고려해 상시 음소거 토글을 존중하며, 음소거 시 모든 출력이 무음 처리됨.
 */
class ProceduralSoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;
  private waterGain: GainNode | null = null;
  private waterRunning = false;

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.waterGain && this.ctx) {
      this.waterGain.gain.setTargetAtTime(muted ? 0 : 0.032, this.ctx.currentTime, 0.12);
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public startAmbientWater(): void {
    const ctx = this.ensureContext();
    if (!ctx || this.waterRunning) return;
    this.waterRunning = true;

    const bufferSize = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 2.4;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 340;
    filter.Q.value = 0.7;

    const gain = ctx.createGain();
    gain.gain.value = this.muted ? 0 : 0.032;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
    this.waterGain = gain;
  }

  /** 가야금·거문고 5음계 여운 (한국 전통 평조 계통) */
  private playPluck(freq: number, duration = 0.9, volume = 0.08, type: OscillatorType = 'triangle'): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.996, now + duration);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.04);
  }

  public playGrainUnlock(): void {
    // 맑은 목탁 공명 + 5음계 상행
    this.playPluck(293.66, 0.35, 0.07, 'sine'); // D4
    window.setTimeout(() => this.playPluck(392.0, 0.9, 0.07, 'triangle'), 90); // G4
    window.setTimeout(() => this.playPluck(440.0, 1.1, 0.06, 'triangle'), 190); // A4
  }

  public playToneSwitch(mode: ToneMode): void {
    if (mode === 'resentment') {
      this.playPluck(220, 0.45, 0.065, 'sawtooth');
      window.setTimeout(() => this.playPluck(233.08, 0.4, 0.055, 'sawtooth'), 40);
    } else if (mode === 'dry') {
      this.playPluck(311.13, 0.2, 0.045, 'sine');
    } else {
      // 원문 경어체: 따스한 5음계 공명
      this.playPluck(293.66, 0.9, 0.07, 'triangle');
      window.setTimeout(() => this.playPluck(392.0, 1.0, 0.065, 'triangle'), 110);
      window.setTimeout(() => this.playPluck(523.25, 1.2, 0.06, 'sine'), 230);
    }
  }

  public playSoftTap(): void {
    this.playPluck(392.0, 0.18, 0.04, 'sine');
  }

  public playHoldPulse(): void {
    this.playPluck(261.63, 0.45, 0.03, 'sine');
  }

  public playStamp(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(52, now + 0.14);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }
}

export const soundEngine = new ProceduralSoundEngine();
