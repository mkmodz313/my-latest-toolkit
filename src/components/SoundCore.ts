// Interactive high fidelity sound synthesizer using standard Web Audio APIs
class SoundCoreClass {
  private ctx: AudioContext | null = null;
  private spaceHumNode: OscillatorNode | null = null;
  private spaceHumGain: GainNode | null = null;

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  playTick() {
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
      // High pitched premium bell chime
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
