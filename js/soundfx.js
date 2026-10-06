/**
 * Game of Thrones Portfolio - Web Audio Soundscape Synthesizer
 * Procedurally generates authentic medieval audio effects without external MP3 dependencies.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = true; // start muted by default for clean UX
    this.ambientNode = null;
    this.ambientGain = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
        this.initialized = true;
      }
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  toggleSound() {
    if (!this.initialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isMuted = !this.isMuted;
    if (!this.isMuted) {
      this.playUnsheath();
      this.startAmbient();
    } else {
      this.stopAmbient();
    }
    return !this.isMuted;
  }

  /**
   * Valyrian Steel Blade Unsheathing Sound
   * Combines high-frequency metallic friction with metallic bell/ring resonance.
   */
  playUnsheath() {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;

    // 1. Friction sweep (scabbard scrape)
    const scrapeOsc = this.ctx.createOscillator();
    const scrapeGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    scrapeOsc.type = 'sawtooth';
    scrapeOsc.frequency.setValueAtTime(450, now);
    scrapeOsc.frequency.exponentialRampToValueAtTime(1600, now + 0.28);
    scrapeOsc.frequency.exponentialRampToValueAtTime(800, now + 0.5);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.Q.setValueAtTime(4.0, now);

    scrapeGain.gain.setValueAtTime(0.001, now);
    scrapeGain.gain.linearRampToValueAtTime(0.18, now + 0.08);
    scrapeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    scrapeOsc.connect(filter);
    filter.connect(scrapeGain);
    scrapeGain.connect(this.ctx.destination);

    scrapeOsc.start(now);
    scrapeOsc.stop(now + 0.5);

    // 2. High metallic chime (Valyrian steel ring)
    [1760, 2640, 3520].forEach((freq, i) => {
      const ringOsc = this.ctx.createOscillator();
      const ringGain = this.ctx.createGain();

      ringOsc.type = 'sine';
      ringOsc.frequency.setValueAtTime(freq, now + 0.15);
      ringOsc.frequency.exponentialRampToValueAtTime(freq * 0.98, now + 1.2);

      ringGain.gain.setValueAtTime(0.001, now);
      ringGain.gain.setValueAtTime(0.08 / (i + 1), now + 0.15);
      ringGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      ringOsc.connect(ringGain);
      ringGain.connect(this.ctx.destination);

      ringOsc.start(now + 0.15);
      ringOsc.stop(now + 1.2);
    });
  }

  /**
   * Sword Clash / Stance Transition Sound
   */
  playClash() {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.3);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  /**
   * Subtle Rune Glow / Button Hover
   */
  playHover() {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(660, now + 0.12);

    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  /**
   * Ambient Whispering Wind / Hearth Fire
   */
  startAmbient() {
    if (this.ambientNode || !this.ctx) return;
    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Generate soft pink/brown filtered noise
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
      }

      this.ambientNode = this.ctx.createBufferSource();
      this.ambientNode.buffer = buffer;
      this.ambientNode.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 350;

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.ambientGain.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + 3);

      this.ambientNode.connect(filter);
      filter.connect(this.ambientGain);
      this.ambientGain.connect(this.ctx.destination);

      this.ambientNode.start(0);
    } catch (e) {
      console.warn('Ambient audio could not be initialized:', e);
    }
  }

  stopAmbient() {
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.5);
      setTimeout(() => {
        if (this.ambientNode) {
          try { this.ambientNode.stop(); } catch(e) {}
          this.ambientNode = null;
        }
      }, 500);
    }
  }
}

window.soundEngine = new SoundEngine();
