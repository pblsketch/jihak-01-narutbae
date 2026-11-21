import { SceneId, ToneMode } from '../types/game';

type NarrationListener = (playingKey: string | null) => void;

/**
 * Web Audio API 한국적 서정 사운드 엔진 + Fish Audio MP3 / 한국어 TTS 낭송 컨트롤러
 * - 외부 오디오 없이도 동작하는 5음계 가야금·거문고풍 BGM + 강물·눈비 환경음
 * - public/assets/audio/stanza1~5.mp3 (Fish Audio 생성 파일) 존재 시 자동 재생,
 *   미존재 시 브라우저 한국어 TTS(speechSynthesis)로 자동 폴백 + BGM 자동 덕킹(ducking)
 */
class ProceduralSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private waterGain: GainNode | null = null;
  private rainGain: GainNode | null = null;

  private muted = false;
  private ambientStarted = false;
  private bgmTimer: number | null = null;
  private bgmStep = 0;
  private currentWeather: 'mist' | 'wind' | 'snowRain' | 'clear' = 'mist';

  private activeAudio: HTMLAudioElement | null = null;
  private playingKey: string | null = null;
  private listeners = new Set<NarrationListener>();

  // 한국 전통 평조 5음계 (D4, E4, G4, A4, B4, D5 + 저음 거문고 D3, A3)
  private readonly bgmPattern: Array<{ freq: number; bass?: number; dur: number } | null> = [
    { freq: 293.66, bass: 146.83, dur: 2.2 }, // D4 + D3
    { freq: 329.63, dur: 1.6 }, // E4
    null, // 여백
    { freq: 392.0, dur: 2.0 }, // G4
    { freq: 440.0, bass: 220.0, dur: 2.4 }, // A4 + A3
    null,
    { freq: 392.0, dur: 1.8 }, // G4
    { freq: 329.63, dur: 1.9 }, // E4
    { freq: 293.66, bass: 146.83, dur: 2.5 }, // D4 + D3
    null,
    { freq: 493.88, dur: 1.9 }, // B4
    { freq: 587.33, bass: 220.0, dur: 2.4 }, // D5 + A3
    { freq: 440.0, dur: 2.0 }, // A4
    null,
    { freq: 392.0, dur: 2.1 }, // G4
    null,
  ];

  public subscribeNarration(listener: NarrationListener): () => void {
    this.listeners.add(listener);
    listener(this.playingKey);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emitNarration(key: string | null): void {
    this.playingKey = key;
    this.duckBgm(key !== null);
    this.listeners.forEach((fn) => fn(key));
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) {
      this.stopNarration();
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 1, this.ctx.currentTime, 0.12);
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : 1;
      this.masterGain.connect(this.ctx.destination);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = 0.85;
      this.bgmGain.connect(this.masterGain);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private duckBgm(ducked: boolean): void {
    if (!this.bgmGain || !this.ctx) return;
    this.bgmGain.gain.setTargetAtTime(ducked ? 0.25 : 0.85, this.ctx.currentTime, 0.18);
  }

  public startAmbientWater(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || !this.bgmGain || this.ambientStarted) return;
    this.ambientStarted = true;

    // 1. 강물 노이즈 버퍼 (브라운 노이즈)
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

    const waterNoise = ctx.createBufferSource();
    waterNoise.buffer = buffer;
    waterNoise.loop = true;

    const waterFilter = ctx.createBiquadFilter();
    waterFilter.type = 'bandpass';
    waterFilter.frequency.value = 320;
    waterFilter.Q.value = 0.7;

    this.waterGain = ctx.createGain();
    this.waterGain.gain.value = 0.028;

    waterNoise.connect(waterFilter);
    waterFilter.connect(this.waterGain);
    this.waterGain.connect(this.bgmGain);
    waterNoise.start();

    // 2. 3연 밤 눈비·바람 고대역 노이즈 레이어
    const rainNoise = ctx.createBufferSource();
    rainNoise.buffer = buffer;
    rainNoise.loop = true;

    const rainFilter = ctx.createBiquadFilter();
    rainFilter.type = 'highpass';
    rainFilter.frequency.value = 1150;

    this.rainGain = ctx.createGain();
    this.rainGain.gain.value = this.currentWeather === 'snowRain' ? 0.036 : 0.0;

    rainNoise.connect(rainFilter);
    rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.bgmGain);
    rainNoise.start();

    // 3. 서정 국악 5음계 가야금·거문고 BGM 루프
    if (this.bgmTimer === null) {
      const playNextNote = () => {
        if (this.muted || !this.ctx || !this.bgmGain || this.ctx.state !== 'running') return;
        const step = this.bgmPattern[this.bgmStep % this.bgmPattern.length];
        this.bgmStep++;
        if (!step) return;

        // 3연 눈비 밤에는 반음 살짝 낮춘 애상적 뉘앙스
        const nightShift = this.currentWeather === 'snowRain' ? 0.9438 : 1.0;
        this.playGayageumNote(step.freq * nightShift, step.dur, 0.032, this.bgmGain);
        if (step.bass) {
          this.playGayageumNote(step.bass * nightShift, step.dur * 1.15, 0.028, this.bgmGain);
        }
      };

      playNextNote();
      this.bgmTimer = window.setInterval(playNextNote, 1650);
    }
  }

  public setAtmosphere(_scene: SceneId, weather: 'mist' | 'wind' | 'snowRain' | 'clear'): void {
    this.currentWeather = weather;
    if (!this.ctx) return;
    if (this.rainGain) {
      const targetRain = weather === 'snowRain' ? 0.038 : weather === 'wind' ? 0.014 : 0.0;
      this.rainGain.gain.setTargetAtTime(targetRain, this.ctx.currentTime, 0.6);
    }
    if (this.waterGain) {
      const targetWater = weather === 'wind' ? 0.038 : 0.026;
      this.waterGain.gain.setTargetAtTime(targetWater, this.ctx.currentTime, 0.5);
    }
  }

  /** 따뜻한 저역 통과 필터를 거친 가야금·거문고 현 울림 */
  private playGayageumNote(
    freq: number,
    duration: number,
    volume: number,
    destination: AudioNode,
  ): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const harmonic = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.997, now + duration);

    harmonic.type = 'sine';
    harmonic.frequency.setValueAtTime(freq * 2, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1450, now);
    filter.frequency.exponentialRampToValueAtTime(420, now + duration);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    const hGain = this.ctx.createGain();
    hGain.gain.value = 0.25;

    osc.connect(filter);
    harmonic.connect(hGain);
    hGain.connect(filter);
    filter.connect(gain);
    gain.connect(destination);

    osc.start(now);
    harmonic.start(now);
    osc.stop(now + duration + 0.05);
    harmonic.stop(now + duration + 0.05);
  }

  private playPluck(
    freq: number,
    duration = 0.9,
    volume = 0.08,
    type: OscillatorType = 'triangle',
  ): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

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
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + duration + 0.04);
  }

  public playGrainUnlock(): void {
    this.playPluck(293.66, 0.35, 0.07, 'sine');
    window.setTimeout(() => this.playPluck(392.0, 0.9, 0.07, 'triangle'), 90);
    window.setTimeout(() => this.playPluck(440.0, 1.1, 0.06, 'triangle'), 190);
  }

  /**
   * 감각적 피드백: 시어의 울림 & 연속 공명 체인에 반응하는 가야금 5음계 화음
   */
  public playResonanceChord(chainLevel = 1): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    // 평조 5음계 상행 아르페지오 — 체인이 쌓일수록 음역과 화음이 부드럽게 확장
    const scale = [293.66, 329.63, 392.0, 440.0, 493.88, 587.33, 659.25];
    const startIdx = Math.min(3, Math.max(0, chainLevel - 1));
    const notes = [scale[startIdx], scale[startIdx + 2], scale[Math.min(scale.length - 1, startIdx + 3)]];

    notes.forEach((freq, idx) => {
      window.setTimeout(() => {
        if (!this.muted && this.masterGain) {
          this.playGayageumNote(freq, 1.35 + idx * 0.2, 0.055, this.masterGain);
        }
      }, idx * 85);
    });
  }

  /**
   * 영광의 보상: 3종 감상 낙관 획득 시 전각 도장 울림 + 4음 가야금 축복 화음
   */
  public playSealAchievement(): void {
    if (this.muted) return;
    this.playStamp();
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const chord = [293.66, 392.0, 440.0, 587.33];
    chord.forEach((freq, idx) => {
      window.setTimeout(() => {
        if (!this.muted && this.masterGain) {
          this.playGayageumNote(freq, 1.8, 0.06, this.masterGain);
        }
      }, 110 + idx * 95);
    });
  }

  public playToneSwitch(mode: ToneMode): void {
    if (mode === 'resentment') {
      this.playPluck(220, 0.45, 0.065, 'sawtooth');
      window.setTimeout(() => this.playPluck(233.08, 0.4, 0.055, 'sawtooth'), 40);
    } else if (mode === 'dry') {
      this.playPluck(311.13, 0.2, 0.045, 'sine');
    } else {
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
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(52, now + 0.14);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  /**
   * 낭송 재생:
   * 1순위: public/assets/audio/<key>.mp3 (Fish Audio MCP 생성 음원)
   * 2순위: 파일 미존재 시 브라우저 한국어 TTS(speechSynthesis) 자동 폴백
   */
  public toggleNarration(key: string, fallbackText: string): void {
    if (this.playingKey === key) {
      this.stopNarration();
      return;
    }

    this.stopNarration();
    this.startAmbientWater();

    // 음소거 중 직접 낭송 버튼을 누르면 안내만 듣기 위해 일시 재생 시도
    if (this.muted) {
      this.setMuted(false);
    }

    const audioUrl = `./assets/audio/${key}.mp3`;
    const audio = new Audio(audioUrl);
    this.activeAudio = audio;
    this.emitNarration(key);

    audio.onended = () => {
      if (this.activeAudio === audio) {
        this.activeAudio = null;
        this.emitNarration(null);
      }
    };

    const fallbackToSpeech = () => {
      if (this.activeAudio === audio) {
        this.activeAudio = null;
      }
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        this.emitNarration(null);
        return;
      }
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(fallbackText);
        utter.lang = 'ko-KR';
        utter.rate = 0.86;
        utter.pitch = 0.96;

        const voices = window.speechSynthesis.getVoices();
        const koVoice =
          voices.find((v) => v.lang.toLowerCase().startsWith('ko') && /natural|online|google|yuna|sora/i.test(v.name)) ||
          voices.find((v) => v.lang.toLowerCase().startsWith('ko'));
        if (koVoice) utter.voice = koVoice;

        utter.onend = () => {
          if (this.playingKey === key) this.emitNarration(null);
        };
        utter.onerror = () => {
          if (this.playingKey === key) this.emitNarration(null);
        };
        window.speechSynthesis.speak(utter);
      } catch {
        this.emitNarration(null);
      }
    };

    audio.onerror = fallbackToSpeech;
    audio.play().catch(fallbackToSpeech);
  }

  public stopNarration(): void {
    if (this.activeAudio) {
      this.activeAudio.pause();
      this.activeAudio.src = '';
      this.activeAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    if (this.playingKey !== null) {
      this.emitNarration(null);
    }
  }
}

export const soundEngine = new ProceduralSoundEngine();
