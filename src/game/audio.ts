import { DEFAULT_SETTINGS } from './rules';
import { AttackStyle, GameSettings, RegionId, WeaponId } from './types';

export interface BossSoundtrackConfig {
  id: string;
  label: string;
  /**
   * Optional path to a human-created or properly licensed soundtrack file inside `public/`.
   * Example: place your licensed MP3/OGG at `public/audio/bosses/core_sentinel.mp3`.
   * If no file exists at this path, SoundEngine automatically falls back to its
   * multi-layered procedural Web Audio boss tension score without errors.
   */
  customAudioUrl?: string;
  stepMs: number;
  bassNotes: number[];
  leadNotes: number[];
  accentEvery: number;
}

/**
 * Modular Boss Soundtrack Registry.
 * Add new boss IDs here to assign unique music per boss encounter.
 * To use your own licensed soundtrack, drop the file in `public/audio/bosses/`
 * and set `customAudioUrl` below (e.g. '/audio/bosses/core_sentinel.mp3').
 */
export const BOSS_SOUNDTRACK_REGISTRY: Record<string, BossSoundtrackConfig> = {
  core_sentinel: {
    id: 'core_sentinel',
    label: 'Aegis Core Sentinel — Overload Protocol',
    // Uncomment and add your own human-created or licensed track in public/audio/bosses/:
    // customAudioUrl: '/audio/bosses/core_sentinel.mp3',
    stepMs: 210,
    // Driving D-minor Phrygian bass ostinato
    bassNotes: [73.42, 73.42, 77.78, 73.42, 87.31, 73.42, 98.0, 82.41],
    // Urgent dramatic minor lead motif
    leadNotes: [293.66, 0, 311.13, 349.23, 0, 440.0, 415.3, 349.23, 293.66, 0, 261.63, 293.66, 349.23, 0, 311.13, 293.66],
    accentEvery: 4,
  },
  default_boss: {
    id: 'default_boss',
    label: 'Guardian Encounter',
    stepMs: 225,
    bassNotes: [82.41, 82.41, 98.0, 82.41, 110.0, 98.0, 92.5, 82.41],
    leadNotes: [329.63, 0, 349.23, 392.0, 440.0, 0, 392.0, 329.63],
    accentEvery: 4,
  },
};

const CROSSFADE_SECONDS = 0.85;

/**
 * Modular Web Audio Engine for Bounce Back: After the Fall.
 *
 * Features:
 * - Dual-bus crossfading mixer (`regionBus` & `bossBus`) for smooth region ↔ boss
 *   transitions with zero abrupt cuts and zero track overlap.
 * - Optional drop-in support for human-created / licensed boss audio tracks
 *   (via `BOSS_SOUNDTRACK_REGISTRY[bossId].customAudioUrl`), with automatic
 *   fallback to procedural Web Audio synthesis.
 * - Mobile & desktop browser autoplay-restriction recovery via `unlock()`.
 */
export class SoundEngine {
  private ctx: AudioContext | null = null;
  private regionBus: GainNode | null = null;
  private bossBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;

  private regionTimer: number | null = null;
  private bossTimer: number | null = null;
  private regionStep = 0;
  private bossStep = 0;

  private currentRegionTrack: RegionId | 'title' = 'title';
  private activeBossTrackId: string | null = null;
  private activeTrack: RegionId | 'title' | 'boss' = 'title';
  private bossIntensityPhase: 1 | 2 | 3 = 1;

  // Optional custom licensed HTMLAudioElement playback for boss tracks
  private customBossAudio: HTMLAudioElement | null = null;
  private customBossAudioTrackId: string | null = null;
  private customBossFadeRaf: number | null = null;
  private customBossTargetVol = 0;
  private customBossCurrentVol = 0;
  private failedCustomUrls = new Set<string>();

  private settings: GameSettings = { ...DEFAULT_SETTINGS };
  private unlocked = false;

  public applySettings(settings: GameSettings): void {
    this.settings = { ...settings };
    this.syncBusVolumes(0.15);
  }

  public getActiveTrack(): RegionId | 'title' | 'boss' {
    return this.activeTrack;
  }

  public getActiveBossTrackId(): string | null {
    return this.activeBossTrackId;
  }

  public unlock(): void {
    if (this.unlocked && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().then(() => this.syncBusVolumes(0.25)).catch(() => {});
      }
      if (this.customBossAudio && this.activeBossTrackId && this.customBossAudio.paused) {
        this.customBossAudio.play().catch(() => {});
      }
      return;
    }
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      // Create dedicated mixer buses for smooth crossfading
      this.regionBus = this.ctx.createGain();
      this.bossBus = this.ctx.createGain();
      this.sfxBus = this.ctx.createGain();

      this.regionBus.gain.setValueAtTime(this.activeBossTrackId ? 0.0001 : 1, this.ctx.currentTime);
      this.bossBus.gain.setValueAtTime(this.activeBossTrackId ? 1 : 0.0001, this.ctx.currentTime);
      this.sfxBus.gain.setValueAtTime(1, this.ctx.currentTime);

      this.regionBus.connect(this.ctx.destination);
      this.bossBus.connect(this.ctx.destination);
      this.sfxBus.connect(this.ctx.destination);

      this.unlocked = true;
      this.startRegionMusicLoop();
      if (this.activeBossTrackId) {
        this.startBossPlayback(this.activeBossTrackId);
      }
      this.syncBusVolumes(0.35);
    } catch {
      // Ignore if audio context is unavailable in headless environment
    }
  }

  /**
   * Switch background ambient music (title or region).
   * If a boss encounter is currently active, remembers the return region without interrupting boss music.
   */
  public setTrack(track: RegionId | 'title' | 'boss'): void {
    if (track === 'boss') {
      this.enterBossEncounter(this.activeBossTrackId ?? 'core_sentinel');
      return;
    }
    this.currentRegionTrack = track;
    if (this.activeBossTrackId !== null) {
      this.exitBossEncounter(track);
      return;
    }
    if (this.activeTrack === track) return;
    this.activeTrack = track;
    this.regionStep = 0;
    this.syncBusVolumes(0.45);
  }

  /**
   * Smoothly crossfade from region background music into a specific boss soundtrack.
   * Safe to call every frame — will NOT restart or overlap if the same boss track is already playing.
   */
  public enterBossEncounter(bossTrackId: string, phase: 1 | 2 | 3 = 1): void {
    const resolvedId = BOSS_SOUNDTRACK_REGISTRY[bossTrackId] ? bossTrackId : 'default_boss';
    this.bossIntensityPhase = phase;

    // Already playing this boss soundtrack -> never restart or overlap
    if (this.activeBossTrackId === resolvedId && this.activeTrack === 'boss') {
      return;
    }

    const switchingBoss = this.activeBossTrackId !== null && this.activeBossTrackId !== resolvedId;
    this.activeBossTrackId = resolvedId;
    this.activeTrack = 'boss';
    this.bossStep = 0;

    if (switchingBoss) {
      this.stopBossLoopOnly();
    }

    if (this.unlocked) {
      this.startBossPlayback(resolvedId);
    }
    this.syncBusVolumes(CROSSFADE_SECONDS);
  }

  /**
   * Update boss music intensity when the boss shifts to Phase 2 or Phase 3.
   */
  public setBossPhase(phase: 1 | 2 | 3): void {
    this.bossIntensityPhase = phase;
  }

  /**
   * Smoothly fade out the boss soundtrack and crossfade back into the region/title track.
   */
  public exitBossEncounter(returnTrack?: RegionId | 'title', fadeSeconds = CROSSFADE_SECONDS): void {
    if (returnTrack) {
      this.currentRegionTrack = returnTrack;
    }
    if (this.activeBossTrackId === null && this.activeTrack === this.currentRegionTrack) {
      return;
    }

    this.activeBossTrackId = null;
    this.activeTrack = this.currentRegionTrack;
    this.bossIntensityPhase = 1;
    this.syncBusVolumes(fadeSeconds);

    // Stop boss synth loop cleanly after fade completes so zero stray notes linger
    const stopDelayMs = Math.round(fadeSeconds * 1000) + 120;
    window.setTimeout(() => {
      if (this.activeBossTrackId === null) {
        this.stopBossLoopOnly();
        this.stopCustomBossAudio();
      }
    }, stopDelayMs);
  }

  public stop(): void {
    if (this.regionTimer !== null) {
      window.clearInterval(this.regionTimer);
      this.regionTimer = null;
    }
    this.stopBossLoopOnly();
    this.stopCustomBossAudio();
  }

  private getMusicGainTarget(): number {
    if (this.settings.muted || this.settings.masterVolume <= 0.01 || this.settings.musicVolume <= 0.01) {
      return 0.0001;
    }
    return Math.max(0.0001, this.settings.musicVolume * this.settings.masterVolume);
  }

  private syncBusVolumes(fadeSeconds: number): void {
    const musicMaster = this.getMusicGainTarget();
    const isBoss = this.activeBossTrackId !== null;

    if (this.ctx && this.regionBus && this.bossBus) {
      const now = this.ctx.currentTime;
      const targetRegion = isBoss ? 0.0001 : musicMaster;
      const targetBoss = isBoss ? musicMaster : 0.0001;

      this.regionBus.gain.cancelScheduledValues(now);
      this.regionBus.gain.setValueAtTime(Math.max(0.0001, this.regionBus.gain.value), now);
      this.regionBus.gain.linearRampToValueAtTime(targetRegion, now + Math.max(0.05, fadeSeconds));

      this.bossBus.gain.cancelScheduledValues(now);
      this.bossBus.gain.setValueAtTime(Math.max(0.0001, this.bossBus.gain.value), now);
      this.bossBus.gain.linearRampToValueAtTime(targetBoss, now + Math.max(0.05, fadeSeconds));
    }

    // Smoothly ramp optional custom HTMLAudioElement boss track volume as well
    this.customBossTargetVol = isBoss ? Math.min(1, musicMaster * 0.72) : 0;
    this.animateCustomBossVolume();
  }

  private animateCustomBossVolume(): void {
    if (this.customBossFadeRaf !== null) {
      window.cancelAnimationFrame(this.customBossFadeRaf);
      this.customBossFadeRaf = null;
    }
    const step = () => {
      if (!this.customBossAudio) return;
      const diff = this.customBossTargetVol - this.customBossCurrentVol;
      if (Math.abs(diff) < 0.01) {
        this.customBossCurrentVol = this.customBossTargetVol;
        this.customBossAudio.volume = Math.max(0, Math.min(1, this.customBossCurrentVol));
        if (this.customBossCurrentVol <= 0.005 && this.activeBossTrackId === null) {
          this.customBossAudio.pause();
        }
        return;
      }
      this.customBossCurrentVol += diff * 0.1;
      this.customBossAudio.volume = Math.max(0, Math.min(1, this.customBossCurrentVol));
      this.customBossFadeRaf = window.requestAnimationFrame(step);
    };
    if (this.customBossAudio) {
      this.customBossFadeRaf = window.requestAnimationFrame(step);
    }
  }

  private startBossPlayback(bossTrackId: string): void {
    const cfg = BOSS_SOUNDTRACK_REGISTRY[bossTrackId] ?? BOSS_SOUNDTRACK_REGISTRY.default_boss;

    // 1. If the developer configured a human-created/licensed track file, try loading it cleanly
    if (cfg.customAudioUrl && !this.failedCustomUrls.has(cfg.customAudioUrl)) {
      if (this.customBossAudio && this.customBossAudioTrackId === bossTrackId) {
        if (this.customBossAudio.paused) {
          this.customBossAudio.play().catch(() => {});
        }
        return;
      }
      this.stopCustomBossAudio();
      try {
        const audio = new Audio(cfg.customAudioUrl);
        audio.loop = true;
        audio.preload = 'auto';
        audio.volume = 0;
        this.customBossCurrentVol = 0;
        this.customBossAudio = audio;
        this.customBossAudioTrackId = bossTrackId;

        audio.addEventListener(
          'error',
          () => {
            if (cfg.customAudioUrl) {
              this.failedCustomUrls.add(cfg.customAudioUrl);
            }
            this.stopCustomBossAudio();
            if (this.activeBossTrackId === bossTrackId) {
              this.startProceduralBossLoop(cfg);
            }
          },
          { once: true }
        );

        audio
          .play()
          .then(() => {
            this.animateCustomBossVolume();
          })
          .catch(() => {
            // Autoplay blocked or file missing — fall back to procedural boss synthesizer
            if (this.activeBossTrackId === bossTrackId && this.bossTimer === null) {
              this.startProceduralBossLoop(cfg);
            }
          });
        return;
      } catch {
        // Fall through to procedural boss score
      }
    }

    // 2. Built-in multi-layered procedural Web Audio boss soundtrack
    this.startProceduralBossLoop(cfg);
  }

  private stopCustomBossAudio(): void {
    if (this.customBossFadeRaf !== null) {
      window.cancelAnimationFrame(this.customBossFadeRaf);
      this.customBossFadeRaf = null;
    }
    if (this.customBossAudio) {
      try {
        this.customBossAudio.pause();
        this.customBossAudio.currentTime = 0;
      } catch {
        // Ignore cleanup errors
      }
      this.customBossAudio = null;
      this.customBossAudioTrackId = null;
      this.customBossCurrentVol = 0;
    }
  }

  private stopBossLoopOnly(): void {
    if (this.bossTimer !== null) {
      window.clearInterval(this.bossTimer);
      this.bossTimer = null;
    }
  }

  private startProceduralBossLoop(cfg: BossSoundtrackConfig): void {
    this.stopBossLoopOnly();
    this.bossTimer = window.setInterval(() => {
      if (!this.ctx || !this.bossBus || this.ctx.state !== 'running') return;
      if (this.activeBossTrackId === null) return;
      if (this.settings.muted || this.settings.masterVolume <= 0.01 || this.settings.musicVolume <= 0.01) return;

      const now = this.ctx.currentTime;
      const step = this.bossStep++;
      const phase = this.bossIntensityPhase;

      // Layer A: Heavy driving sub-bass ostinato (sawtooth + lowpass filter)
      const bassFreq = cfg.bassNotes[step % cfg.bassNotes.length];
      if (bassFreq > 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassFilter = this.ctx.createBiquadFilter();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(bassFreq, now);
        bassFilter.type = 'lowpass';
        bassFilter.frequency.setValueAtTime(phase >= 3 ? 520 : phase === 2 ? 410 : 320, now);
        bassGain.gain.setValueAtTime(0.0001, now);
        bassGain.gain.linearRampToValueAtTime(0.075, now + 0.02);
        bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.19);
        bassOsc.connect(bassFilter);
        bassFilter.connect(bassGain);
        bassGain.connect(this.bossBus);
        bassOsc.start(now);
        bassOsc.stop(now + 0.21);
      }

      // Layer B: Rhythmic industrial war-drum kick pulse on downbeats (faster in Phase 2/3)
      const isKick = step % cfg.accentEvery === 0 || (phase >= 2 && step % cfg.accentEvery === 2);
      if (isKick) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(128, now);
        kickOsc.frequency.exponentialRampToValueAtTime(38, now + 0.12);
        kickGain.gain.setValueAtTime(0.11, now);
        kickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
        kickOsc.connect(kickGain);
        kickGain.connect(this.bossBus);
        kickOsc.start(now);
        kickOsc.stop(now + 0.16);
      }

      // Layer C: Tense dramatic minor lead melody & Phase 3 harmonic fifth accent
      const leadFreq = cfg.leadNotes[step % cfg.leadNotes.length];
      if (leadFreq > 0) {
        const leadOsc = this.ctx.createOscillator();
        const leadGain = this.ctx.createGain();
        leadOsc.type = phase >= 2 ? 'square' : 'triangle';
        leadOsc.frequency.setValueAtTime(leadFreq, now);
        const leadPeak = phase >= 3 ? 0.046 : 0.036;
        leadGain.gain.setValueAtTime(0.0001, now);
        leadGain.gain.linearRampToValueAtTime(leadPeak, now + 0.025);
        leadGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
        leadOsc.connect(leadGain);
        leadGain.connect(this.bossBus);
        leadOsc.start(now);
        leadOsc.stop(now + 0.3);

        if (phase === 3 && step % 2 === 0) {
          const fifthOsc = this.ctx.createOscillator();
          const fifthGain = this.ctx.createGain();
          fifthOsc.type = 'triangle';
          fifthOsc.frequency.setValueAtTime(leadFreq * 1.498, now);
          fifthGain.gain.setValueAtTime(0.0001, now);
          fifthGain.gain.linearRampToValueAtTime(0.022, now + 0.02);
          fifthGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
          fifthOsc.connect(fifthGain);
          fifthGain.connect(this.bossBus);
          fifthOsc.start(now);
          fifthOsc.stop(now + 0.22);
        }
      }
    }, cfg.stepMs);
  }

  private startRegionMusicLoop(): void {
    if (this.regionTimer !== null) return;
    const scales: Record<RegionId | 'title', number[]> = {
      title: [220, 261.63, 293.66, 329.63, 392.0, 440.0, 523.25],
      haven: [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 392.0, 329.63],
      city: [196.0, 233.08, 261.63, 293.66, 311.13, 261.63, 233.08, 174.61],
      forest: [293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 440.0, 392.0],
      wasteland: [130.81, 146.83, 155.56, 196.0, 146.83, 130.81, 116.54, 130.81],
      core: [220.0, 246.94, 293.66, 329.63, 440.0, 493.88, 587.33, 440.0],
    };

    this.regionTimer = window.setInterval(() => {
      if (!this.ctx || !this.regionBus || this.ctx.state !== 'running') return;
      if (this.settings.muted || this.settings.masterVolume <= 0.01 || this.settings.musicVolume <= 0.01) return;

      const scale = scales[this.currentRegionTrack];
      const freq = scale[this.regionStep % scale.length];
      this.regionStep++;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const isTense = this.currentRegionTrack === 'wasteland';

      osc.type = isTense ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now);

      const peak = 0.055;
      const dur = isTense ? 0.52 : 0.95;

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(peak, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      osc.connect(gain);
      gain.connect(this.regionBus);
      osc.start(now);
      osc.stop(now + dur + 0.05);
    }, 620);
  }

  private tone(
    freqStart: number,
    freqEnd: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    jitter = 0.08
  ): void {
    if (!this.ctx || !this.sfxBus || this.settings.muted || this.settings.masterVolume <= 0.01 || this.settings.sfxVolume <= 0.01) return;
    if (this.ctx.state === 'suspended') return;
    const now = this.ctx.currentTime;
    const mult = 1 + (Math.random() * 2 - 1) * jitter;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(40, freqStart * mult), now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd * mult), now + duration);

    const amp = volume * this.settings.sfxVolume * this.settings.masterVolume;
    gain.gain.setValueAtTime(amp, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.sfxBus);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playFootstep(): void {
    this.tone(130, 82, 0.05, 'triangle', 0.05, 0.14);
  }

  public playSwing(): void {
    this.tone(360, 140, 0.11, 'sawtooth', 0.11, 0.1);
  }

  public playHit(heavy = false): void {
    this.tone(heavy ? 180 : 240, 58, heavy ? 0.16 : 0.1, 'square', heavy ? 0.16 : 0.12, 0.08);
  }

  public playDodge(): void {
    this.tone(220, 480, 0.12, 'sine', 0.09, 0.06);
  }

  public playPickup(): void {
    this.tone(520, 780, 0.12, 'sine', 0.12, 0.04);
  }

  public playPlayerHurt(): void {
    this.tone(160, 62, 0.18, 'sawtooth', 0.17, 0.05);
  }

  public playTelegraph(): void {
    this.tone(320, 620, 0.22, 'triangle', 0.09, 0.04);
  }

  public playPulse(): void {
    this.tone(240, 680, 0.28, 'sine', 0.16, 0.03);
    this.tone(120, 340, 0.32, 'triangle', 0.12, 0.03);
  }

  public playDiscovery(): void {
    this.tone(392, 523.25, 0.22, 'triangle', 0.11, 0.01);
    setTimeout(() => this.tone(523.25, 659.25, 0.28, 'sine', 0.11, 0.01), 110);
  }

  public playQuestComplete(): void {
    const notes = [392, 493.88, 587.33, 783.99];
    notes.forEach((n, idx) => {
      setTimeout(() => this.tone(n, n * 1.01, 0.25, 'triangle', 0.12, 0.01), idx * 95);
    });
  }

  public playRestore(): void {
    const chord = [261.63, 329.63, 392.0, 523.25, 659.25];
    chord.forEach((n, idx) => {
      setTimeout(() => this.tone(n, n * 1.03, 0.55, 'sine', 0.13, 0.01), idx * 75);
    });
  }

  public playUiClick(): void {
    this.tone(440, 540, 0.05, 'sine', 0.06, 0.03);
  }

  public playWeaponSwing(weaponId: WeaponId, style: AttackStyle): void {
    const heavy = style !== 'basic';
    const dur = style === 'charged' ? 0.24 : heavy ? 0.18 : 0.11;
    switch (weaponId) {
      case 'scrap_blade':
        this.tone(heavy ? 280 : 380, heavy ? 100 : 150, dur, 'sawtooth', heavy ? 0.14 : 0.1, 0.09);
        break;
      case 'reinforced_sword':
        this.tone(heavy ? 230 : 310, heavy ? 85 : 130, dur, 'sawtooth', heavy ? 0.16 : 0.12, 0.07);
        this.tone(heavy ? 520 : 620, 290, dur * 0.8, 'triangle', 0.07, 0.05);
        break;
      case 'pulse_blade':
        this.tone(heavy ? 480 : 640, heavy ? 190 : 280, dur, 'sine', heavy ? 0.15 : 0.12, 0.04);
        this.tone(heavy ? 240 : 320, 920, dur * 0.7, 'triangle', 0.09, 0.05);
        break;
      case 'ancient_blade':
        this.tone(heavy ? 210 : 290, heavy ? 490 : 420, dur + 0.04, 'triangle', 0.15, 0.03);
        this.tone(heavy ? 420 : 540, 180, dur, 'sine', 0.11, 0.04);
        break;
      case 'coreblade':
        this.tone(heavy ? 360 : 520, heavy ? 880 : 780, dur + 0.05, 'sine', 0.16, 0.02);
        this.tone(heavy ? 180 : 260, 520, dur + 0.03, 'triangle', 0.13, 0.03);
        break;
      case 'scrap_axe':
      case 'foundry_greataxe':
        this.tone(heavy ? 145 : 190, heavy ? 54 : 74, dur + 0.05, 'sawtooth', heavy ? 0.17 : 0.14, 0.06);
        this.tone(heavy ? 95 : 120, 48, dur + 0.04, 'triangle', 0.12, 0.05);
        break;
      case 'hunter_bow':
      case 'arc_longbow':
        this.tone(weaponId === 'arc_longbow' ? 680 : 540, 220, 0.09, 'triangle', 0.12, 0.05);
        this.tone(weaponId === 'arc_longbow' ? 920 : 760, 390, 0.07, 'sine', 0.08, 0.04);
        break;
    }
  }

  public playEnergyStrike(weaponId: WeaponId): void {
    const base = weaponId === 'coreblade' ? 520 : weaponId === 'ancient_blade' ? 390 : 440;
    this.tone(base, base * 1.9, 0.18, 'sine', 0.14, 0.03);
    this.tone(base * 0.5, base * 1.1, 0.22, 'triangle', 0.11, 0.04);
  }

  public playCritHit(): void {
    this.tone(860, 1480, 0.12, 'triangle', 0.16, 0.03);
    this.tone(240, 90, 0.15, 'square', 0.14, 0.05);
  }

  public playWeaponSwitch(): void {
    this.tone(520, 760, 0.07, 'triangle', 0.09, 0.04);
    setTimeout(() => this.tone(720, 960, 0.06, 'sine', 0.07, 0.03), 45);
  }

  public playForgeUpgrade(): void {
    this.tone(680, 320, 0.12, 'square', 0.13, 0.03);
    setTimeout(() => this.tone(523.25, 783.99, 0.24, 'triangle', 0.12, 0.02), 85);
    setTimeout(() => this.tone(783.99, 1046.5, 0.3, 'sine', 0.11, 0.01), 175);
  }

  public playBossPhaseShift(): void {
    this.tone(150, 75, 0.35, 'sawtooth', 0.18, 0.02);
    setTimeout(() => this.tone(220, 440, 0.32, 'triangle', 0.14, 0.02), 140);
  }

  public playBossFall(): void {
    this.tone(110, 38, 0.42, 'sawtooth', 0.2, 0.02);
    this.tone(80, 32, 0.5, 'triangle', 0.18, 0.02);
  }

  public playBossAshDissolve(): void {
    this.tone(360, 180, 0.55, 'sine', 0.09, 0.05);
    setTimeout(() => this.tone(520, 880, 0.42, 'triangle', 0.11, 0.02), 260);
  }

  public playTeleporterActivate(): void {
    const notes = [293.66, 369.99, 440.0, 587.33, 880.0];
    notes.forEach((n, i) => {
      setTimeout(() => this.tone(n, n * 1.04, 0.42, 'sine', 0.12, 0.01), i * 70);
    });
  }

  public playTeleportWarp(): void {
    this.tone(220, 880, 0.42, 'sine', 0.15, 0.01);
    this.tone(330, 1120, 0.38, 'triangle', 0.1, 0.02);
    setTimeout(() => this.tone(660, 330, 0.35, 'sine', 0.11, 0.01), 280);
  }
}
