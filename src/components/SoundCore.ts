// Interactive high fidelity sound synthesizer and asset-based audio file player
class SoundCoreClass {
  private ctx: AudioContext | null = null;
  private spaceHumNode: OscillatorNode | null = null;
  private spaceHumGain: GainNode | null = null;

  // Audio elements for custom assets
  private clickAudio: HTMLAudioElement | null = null;
  private syncAudio: HTMLAudioElement | null = null;
  private songAudio: HTMLAudioElement | null = null;
  private isSongPlaying: boolean = false;

  constructor() {
    // Lazy initialize standard audio objects to avoid pre-user-interaction autoplay bans
    try {
      this.clickAudio = new Audio("/click.mp3");
      this.clickAudio.volume = 0.45;
      
      // Automatic dev/prod dual path fallback resolution
      this.clickAudio.addEventListener("error", () => {
        if (this.clickAudio && !this.clickAudio.src.includes("/src/assets/")) {
          this.clickAudio.src = "/src/assets/click.mp3";
        }
      });
    } catch (e) {
      console.warn("Click audio element initialization failed, using synth fallback");
    }

    try {
      this.syncAudio = new Audio("/sync.mp3");
      this.syncAudio.loop = true;
      this.syncAudio.volume = 0.5;

      this.syncAudio.addEventListener("error", () => {
        if (this.syncAudio && !this.syncAudio.src.includes("/src/assets/")) {
          this.syncAudio.src = "/src/assets/sync.mp3";
        }
      });
    } catch (e) {
      console.warn("Sync audio element initialization failed, using hum fallback");
    }

    try {
      this.songAudio = new Audio("/song.mp3");
      this.songAudio.loop = true;
      this.songAudio.volume = 0.4;

      this.songAudio.addEventListener("error", () => {
        if (this.songAudio && !this.songAudio.src.includes("/src/assets/")) {
          this.songAudio.src = "/src/assets/song.mp3";
        }
      });
    } catch (e) {
      console.warn("Song audio element initialization failed");
    }
  }

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  // Play standard click sound
  playTick() {
    try {
      if (this.clickAudio) {
        this.clickAudio.currentTime = 0;
        this.clickAudio.play().catch(() => {
          // Fallback to synth tick if play fails (e.g. file doesn't exist yet or browser permission block)
          this.playSynthTick();
        });
      } else {
        this.playSynthTick();
      }
    } catch (e) {
      this.playSynthTick();
    }
  }

  private playSynthTick() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(650, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {}
  }

  playLaserSweep() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {}
  }

  playSuccessLaser() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = "triangle";
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1174.66, now); // D6
      
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(now + 0.4);
      osc2.stop(now + 0.4);
    } catch (e) {}
  }

  playBeep() {
    try {
      if (this.clickAudio) {
        this.clickAudio.currentTime = 0;
        this.clickAudio.play().catch(() => {
          this.playSynthBeep();
        });
      } else {
        this.playSynthBeep();
      }
    } catch (e) {
      this.playSynthBeep();
    }
  }

  private playSynthBeep() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      
      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch (e) {}
  }

  // Data sync / loading sound effect
  playSyncSound() {
    try {
      if (this.syncAudio) {
        this.syncAudio.currentTime = 0;
        this.syncAudio.play().catch(() => {
          // If custom assets audio fails to play, use our high fidelity cyber hum synth
          this.startSpaceHum();
        });
      } else {
        this.startSpaceHum();
      }
    } catch (e) {
      this.startSpaceHum();
    }
  }

  stopSyncSound() {
    try {
      if (this.syncAudio) {
        this.syncAudio.pause();
        this.syncAudio.currentTime = 0;
      }
    } catch (e) {}
    this.stopSpaceHum();
  }

  // Background Song toggler
  isSongActive(): boolean {
    return this.isSongPlaying;
  }

  toggleSong(): boolean {
    this.isSongPlaying = !this.isSongPlaying;
    try {
      if (!this.songAudio) {
        this.songAudio = new Audio("/song.mp3");
        this.songAudio.loop = true;
        this.songAudio.volume = 0.4;
        this.songAudio.addEventListener("error", () => {
          if (this.songAudio && !this.songAudio.src.includes("/src/assets/")) {
            this.songAudio.src = "/src/assets/song.mp3";
          }
        });
      }
      
      if (this.isSongPlaying) {
        this.songAudio.play().catch((err) => {
          console.warn("Could not play song asset:", err);
        });
      } else {
        this.songAudio.pause();
      }
    } catch (e) {
      console.warn("Song player error:", e);
    }
    return this.isSongPlaying;
  }

  playBackgroundSong() {
    this.isSongPlaying = true;
    try {
      if (!this.songAudio) {
        this.songAudio = new Audio("/song.mp3");
        this.songAudio.loop = true;
        this.songAudio.volume = 0.4;
        this.songAudio.addEventListener("error", () => {
          if (this.songAudio && !this.songAudio.src.includes("/src/assets/")) {
            this.songAudio.src = "/src/assets/song.mp3";
          }
        });
      }
      this.songAudio.play().catch((err) => {
        console.warn("Autoplay song blocked:", err);
      });
    } catch (e) {}
  }

  pauseBackgroundSong() {
    this.isSongPlaying = false;
    try {
      if (this.songAudio) {
        this.songAudio.pause();
      }
    } catch (e) {}
  }

  startSpaceHum() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      if (this.spaceHumNode) return; // already active

      this.spaceHumNode = this.ctx.createOscillator();
      this.spaceHumGain = this.ctx.createGain();

      this.spaceHumNode.type = "sine";
      this.spaceHumNode.frequency.setValueAtTime(45, this.ctx.currentTime); // Deep hum

      this.spaceHumGain.gain.setValueAtTime(0.02, this.ctx.currentTime);

      this.spaceHumNode.connect(this.spaceHumGain);
      this.spaceHumGain.connect(this.ctx.destination);
      this.spaceHumNode.start();
    } catch (e) {}
  }

  stopSpaceHum() {
    try {
      if (this.spaceHumNode) {
        this.spaceHumNode.stop();
        this.spaceHumNode.disconnect();
        this.spaceHumNode = null;
      }
      if (this.spaceHumGain) {
        this.spaceHumGain.disconnect();
        this.spaceHumGain = null;
      }
    } catch (e) {}
  }
}

export const SoundCore = new SoundCoreClass();
