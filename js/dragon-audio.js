/**
 * Dragon & Throne Audio Synthesizer (Web Audio API)
 * Zero-CORS, Zero-Latency, Works 100% Offline & on file:/// protocol
 */
class DragonAudioEngine {
  constructor() {
    this.ctx = null;
    this.initialized = false;
    this.initOnGesture();
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.initialized = true;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  initOnGesture() {
    const unlock = () => {
      this.initContext();
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('click', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });
  }

  /**
   * Realistic Fire Exhale / Napalm Blast
   */
  playFireBreath(duration = 0.8, intensity = 0.7) {
    this.initContext();
    if (!this.ctx) return;

    try {
      const sampleRate = this.ctx.sampleRate;
      const bufferSize = sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
      const data = buffer.getChannelData(0);

      // Pink/Brown turbulent noise generator
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99 * b0 + white * 0.05;
        b1 = 0.96 * b1 + white * 0.11;
        b2 = 0.86 * b2 + white * 0.25;
        const pink = b0 + b1 + b2 + white * 0.1;
        // Flame rumble modulation
        const rumble = Math.sin(i * 0.008) * 0.3;
        data[i] = (pink * 0.7 + rumble * 0.3);
      }

      const noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = buffer;

      // Resonant Bandpass Filter (350Hz -> 1800Hz sweep)
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(400, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(1400, this.ctx.currentTime + duration * 0.35);
      filter.frequency.exponentialRampToValueAtTime(320, this.ctx.currentTime + duration);
      filter.Q.setValueAtTime(3.2, this.ctx.currentTime);

      // Gain Envelope
      const gainNode = this.ctx.createGain();
      gainNode.gain.setValueAtTime(0.01, this.ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.45 * intensity, this.ctx.currentTime + 0.08);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      noiseNode.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      noiseNode.start();
    } catch (e) {
      console.warn("Audio synthesis error:", e);
    }
  }

  /**
   * Dragon Guttural Roar / Growl
   */
  playDragonRoar(duration = 1.4, pitch = 75) {
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Primary low-frequency FM oscillator (guttural growl)
      const carrier = this.ctx.createOscillator();
      carrier.type = 'sawtooth';
      carrier.frequency.setValueAtTime(pitch, now);
      carrier.frequency.exponentialRampToValueAtTime(pitch * 1.6, now + duration * 0.25);
      carrier.frequency.exponentialRampToValueAtTime(pitch * 0.75, now + duration);

      // Modulator for draconic gravel rumble
      const modulator = this.ctx.createOscillator();
      modulator.type = 'sine';
      modulator.frequency.setValueAtTime(26, now);
      modulator.frequency.linearRampToValueAtTime(16, now + duration);

      const modGain = this.ctx.createGain();
      modGain.gain.setValueAtTime(pitch * 0.8, now);

      modulator.connect(modGain);
      modGain.connect(carrier.frequency);

      // Formant Filter for throat resonance
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, now);
      filter.frequency.exponentialRampToValueAtTime(1200, now + duration * 0.3);
      filter.frequency.exponentialRampToValueAtTime(220, now + duration);
      filter.Q.setValueAtTime(4.5, now);

      // Master gain
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.55, now + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      carrier.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      modulator.start();
      carrier.start();
      modulator.stop(now + duration);
      carrier.stop(now + duration);
    } catch (e) {
      console.warn("Dragon roar audio error:", e);
    }
  }

  /**
   * Daenerys "Dracarys" Incantation + Massive Dragonfire Inferno Blast
   */
  playDracarys() {
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // 1. Immediate Ferocious Dragon Roar & Massive Flame Blast (Zero Latency!)
      this.playDragonRoar(2.5, 78);
      this.playFireBreath(2.8, 1.25);

      // 2. "Dra-ca-rys" Formant Chime / Whispered Command
      const syllableFreqs = [280, 420, 360, 520];
      syllableFreqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        const start = now + idx * 0.18;
        osc.frequency.setValueAtTime(freq, start);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.15, start + 0.16);

        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.01, start);
        g.gain.linearRampToValueAtTime(0.35, start + 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, start + 0.16);

        osc.connect(g);
        g.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + 0.18);
      });

      // 3. Second Inferno Surge at 0.9s (Continuous sweeping fire roar)
      setTimeout(() => {
        this.playFireBreath(2.2, 1.15);
        this.playDragonRoar(1.6, 90);
      }, 900);
    } catch (e) {
      console.warn("Dracarys audio error:", e);
    }
  }

  /**
   * Heavy Iron Clang when swords collide & plunge into the throne
   */
  playIronClang(pitch = 380) {
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const freqs = [pitch, pitch * 1.48, pitch * 2.15, pitch * 3.42, pitch * 5.1];
      const decays = [0.8, 0.65, 0.45, 0.3, 0.18];

      freqs.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now);
        osc.frequency.exponentialRampToValueAtTime(f * 0.98, now + decays[i]);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3 / (i + 1), now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + decays[i]);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(now + decays[i]);
      });
    } catch (e) {
      console.warn("Iron clang audio error:", e);
    }
  }

  /**
   * Sword Whoosh / Air slice as swords streak into position
   */
  playSwordWhoosh() {
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.28);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.28);
    } catch (e) {
      // ignore
    }
  }

  /**
   * Visceral Anvil & Steel Strike when Valyrian Steel plunges into the Iron Throne
   * Features heavy sub-bass mechanical impact + sharp metallic shearing ring + resonance
   */
  playAnvilStrike() {
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // 1. Heavy low-end kinetic impact thud (65Hz -> 30Hz)
      const subOsc = this.ctx.createOscillator();
      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(85, now);
      subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.35);

      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(0.7, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 0.38);

      // 2. High-tensile iron acoustic bite & chime harmonics
      const harmonics = [
        { f: 440, gain: 0.45, decay: 0.95 },
        { f: 880, gain: 0.38, decay: 0.85 },
        { f: 1460, gain: 0.32, decay: 0.65 },
        { f: 2240, gain: 0.22, decay: 0.45 },
        { f: 3820, gain: 0.16, decay: 0.28 },
        { f: 5120, gain: 0.12, decay: 0.18 }
      ];

      harmonics.forEach(({ f, gain, decay }) => {
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now);
        osc.frequency.exponentialRampToValueAtTime(f * 0.992, now + decay);

        const g = this.ctx.createGain();
        g.gain.setValueAtTime(gain, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + decay);

        osc.connect(g);
        g.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + decay);
      });

      // 3. Tangential steel friction scrape burst
      const scrapeBuf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.12), this.ctx.sampleRate);
      const sData = scrapeBuf.getChannelData(0);
      for (let i = 0; i < sData.length; i++) {
        sData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.035));
      }
      const sSrc = this.ctx.createBufferSource();
      sSrc.buffer = scrapeBuf;

      const sFilter = this.ctx.createBiquadFilter();
      sFilter.type = 'bandpass';
      sFilter.frequency.setValueAtTime(2800, now);
      sFilter.Q.setValueAtTime(5.0, now);

      const sGain = this.ctx.createGain();
      sGain.gain.setValueAtTime(0.35, now);
      sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      sSrc.connect(sFilter);
      sFilter.connect(sGain);
      sGain.connect(this.ctx.destination);
      sSrc.start(now);
    } catch (e) {
      console.warn("Anvil strike audio error:", e);
    }
  }

  /**
   * Friction steam & vapor hiss as cold steel wedges into scorching iron
   */
  playForgeHiss() {
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const dur = 0.42;
      const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1);
      }
      const src = this.ctx.createBufferSource();
      src.buffer = buf;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(3600, now);
      filter.frequency.exponentialRampToValueAtTime(1800, now + dur);
      filter.Q.setValueAtTime(3.5, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.24, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      src.start(now);
    } catch (e) {
      // ignore
    }
  }
}

window.dragonAudio = new DragonAudioEngine();
