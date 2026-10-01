// ═══════════════════════════════════════════════════════════════
// Web Audio 音效引擎 — 程序化生成氛围音效
// ═══════════════════════════════════════════════════════════════

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this._initialized = false;
    this._bgmOsc = null;
  }

  init() {
    if (this._initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.5;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.3;
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.6;
      this.sfxGain.connect(this.masterGain);

      this._initialized = true;
    } catch (e) {
      console.warn('AudioEngine: Web Audio not available', e);
    }
  }

  /** 播放攻击音效 */
  playHit(isCrit = false) {
    if (!this._initialized) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(isCrit ? 600 : 400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(isCrit ? 200 : 150, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.2);
  }

  /** 播放受伤音效 */
  playDamage() {
    if (!this._initialized) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.type = 'square';
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.3);
  }

  /** 拾取物品音效 */
  playPickup() {
    if (!this._initialized) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.1);
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.2);
  }

  /** 升级音效 */
  playLevelUp() {
    if (!this._initialized) return;
    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, this.ctx.currentTime + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + i * 0.12 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + i * 0.12 + 0.3);

      osc.start(this.ctx.currentTime + i * 0.12);
      osc.stop(this.ctx.currentTime + i * 0.12 + 0.35);
    });
  }

  /** 基因锁激活音效 */
  playGeneLock() {
    if (!this._initialized) return;
    // 低频嗡鸣 + 高频sweep
    const bassOsc = this.ctx.createOscillator();
    const bassGain = this.ctx.createGain();
    bassOsc.connect(bassGain);
    bassGain.connect(this.sfxGain);
    bassOsc.type = 'sine';
    bassOsc.frequency.value = 60;
    bassGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    bassGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 1.0);
    bassOsc.start(this.ctx.currentTime);
    bassOsc.stop(this.ctx.currentTime + 1.0);

    const sweepOsc = this.ctx.createOscillator();
    const sweepGain = this.ctx.createGain();
    sweepOsc.connect(sweepGain);
    sweepGain.connect(this.sfxGain);
    sweepOsc.type = 'sawtooth';
    sweepOsc.frequency.setValueAtTime(200, this.ctx.currentTime);
    sweepOsc.frequency.exponentialRampToValueAtTime(2000, this.ctx.currentTime + 0.5);
    sweepGain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    sweepGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.6);
    sweepOsc.start(this.ctx.currentTime);
    sweepOsc.stop(this.ctx.currentTime + 0.6);
  }

  /** 对话/事件触发音效 */
  playDialogue() {
    if (!this._initialized) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.type = 'sine';
    osc.frequency.value = 440;
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.12);
  }

  /** Boss登场音效 */
  playBossAppear() {
    if (!this._initialized) return;
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.type = 'square';
      osc.frequency.setValueAtTime(100 - i * 20, this.ctx.currentTime + i * 0.3);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + i * 0.3 + 0.4);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime + i * 0.3);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + i * 0.3 + 0.5);
      osc.start(this.ctx.currentTime + i * 0.3);
      osc.stop(this.ctx.currentTime + i * 0.3 + 0.5);
    }
  }

  /** 开始恐怖氛围背景音 */
  startAmbience() {
    if (!this._initialized || this._bgmOsc) return;
    // 低沉的 drone
    this._bgmOsc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200;

    this._bgmOsc.connect(filter);
    filter.connect(this.musicGain);

    this._bgmOsc.type = 'sawtooth';
    this._bgmOsc.frequency.value = 55; // A1 低音

    // LFO 调制频率产生不安感
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.connect(lfoGain);
    lfoGain.connect(this._bgmOsc.frequency);
    lfo.frequency.value = 0.3; // 极慢
    lfoGain.gain.value = 8;
    lfo.start();

    this._bgmOsc.start();
  }

  stopAmbience() {
    if (this._bgmOsc) {
      this._bgmOsc.stop();
      this._bgmOsc = null;
    }
  }

  /** 恢复音频上下文（需要用户交互后调用） */
  resume() {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }
}

export const audioEngine = new AudioEngine();
