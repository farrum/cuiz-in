// Hybrid game audio engine using Web Audio API for latency-free synthesizers and loopable background tracks
class GameAudioManager {
  private bgmAudio: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;
  private bgmEnabled: boolean = true;
  private sfxEnabled: boolean = true;
  private activeBgmUrl: string = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3';

  constructor() {
    // Load preferences
    this.bgmEnabled = localStorage.getItem('cuizin_bgm_enabled') !== 'false';
    this.sfxEnabled = localStorage.getItem('cuizin_sfx_enabled') !== 'false';
  }

  private initAudioContext() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // Plays a synthesized sound effect using Web Audio API
  public playSFX(type: 'click' | 'correct' | 'wrong' | 'chest' | 'socrates' | 'aryabhata' | 'chanakya' | 'ramanujan') {
    if (!this.sfxEnabled) return;

    try {
      this.initAudioContext();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gainNode = this.audioCtx.createGain();
      osc.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);

      const now = this.audioCtx.currentTime;

      if (type === 'click') {
        // Soft tactile woody click
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        osc.start(now);
        osc.stop(now + 0.08);
      } 
      else if (type === 'correct') {
        // High ascending double-note chord
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now); // A4
        osc.frequency.setValueAtTime(554.37, now + 0.1); // C#5
        osc.frequency.setValueAtTime(659.25, now + 0.2); // E5

        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.setValueAtTime(0.2, now + 0.2);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

        osc.start(now);
        osc.stop(now + 0.45);
      } 
      else if (type === 'wrong') {
        // Low buzzing descending buzzer
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(90, now + 0.35);

        gainNode.gain.setValueAtTime(0.18, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

        osc.start(now);
        osc.stop(now + 0.35);
      } 
      else if (type === 'chest') {
        // Sweeping space-shimmer sweep
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.6);

        gainNode.gain.setValueAtTime(0.25, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

        osc.start(now);
        osc.stop(now + 0.6);
      }
      else if (type === 'socrates') {
        // Double logic logic ping
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.setValueAtTime(450, now + 0.1);
        osc.frequency.setValueAtTime(600, now + 0.2);

        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

        osc.start(now);
        osc.stop(now + 0.45);
      }
      else if (type === 'aryabhata') {
        // Celestial reverse sweep
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.35);

        gainNode.gain.setValueAtTime(0.18, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

        osc.start(now);
        osc.stop(now + 0.35);
      }
      else if (type === 'chanakya') {
        // Shield impact clang
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.4);

        gainNode.gain.setValueAtTime(0.25, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        osc.start(now);
        osc.stop(now + 0.4);
      }
      else if (type === 'ramanujan') {
        // Glistening sweep shimmer
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(1500, now + 0.5);

        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        osc.start(now);
        osc.stop(now + 0.5);
      }
    } catch (e) {
      console.warn("Audio Context failed to synthesize tone:", e);
    }
  }

  // Starts background music loop
  public startBGM() {
    if (!this.bgmEnabled) return;

    if (this.bgmAudio) {
      this.bgmAudio.play().catch(e => console.log("BGM play deferred until user interaction"));
      return;
    }

    try {
      this.bgmAudio = new Audio(this.activeBgmUrl);
      this.bgmAudio.loop = true;
      this.bgmAudio.volume = 0.15; // Soft ambiance
      this.bgmAudio.play().catch(e => console.log("BGM play deferred until user interaction"));
    } catch (e) {
      console.warn("BGM initialization failed:", e);
    }
  }

  // Pauses background music
  public pauseBGM() {
    if (this.bgmAudio) {
      this.bgmAudio.pause();
    }
  }

  // Getters & Toggles
  public isBgmEnabled() {
    return this.bgmEnabled;
  }

  public isSfxEnabled() {
    return this.sfxEnabled;
  }

  public toggleBGM() {
    this.bgmEnabled = !this.bgmEnabled;
    localStorage.setItem('cuizin_bgm_enabled', String(this.bgmEnabled));
    if (this.bgmEnabled) {
      this.startBGM();
    } else {
      this.pauseBGM();
    }
  }

  public toggleSFX() {
    this.sfxEnabled = !this.sfxEnabled;
    localStorage.setItem('cuizin_sfx_enabled', String(this.sfxEnabled));
  }
}

export const audioManager = new GameAudioManager();
export default audioManager;
