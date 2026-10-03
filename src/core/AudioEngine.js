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

  /** 章节感知氛围背景音 */
  startAmbience(chapter = 1) {
    this.stopAmbience();
    if (!this._initialized) return;
    
    // 每章不同的音色和节奏
    const CHAPTER_AMBIENCE = {
      1:  { freq: 55, type: 'sawtooth', lfoRate: 0.3, lfoDepth: 8, filterFreq: 200, name: '生化恐惧' },
      2:  { freq: 48, type: 'triangle', lfoRate: 0.15, lfoDepth: 4, filterFreq: 180, name: '异形深空' },
      3:  { freq: 62, type: 'sawtooth', lfoRate: 0.5, lfoDepth: 12, filterFreq: 160, name: '咒怨不安' },
      4:  { freq: 52, type: 'sine', lfoRate: 0.2, lfoDepth: 6, filterFreq: 250, name: '沙漠古墓' },
      5:  { freq: 45, type: 'triangle', lfoRate: 0.1, lfoDepth: 3, filterFreq: 300, name: '死神低语' },
      6:  { freq: 50, type: 'sawtooth', lfoRate: 0.25, lfoDepth: 10, filterFreq: 150, name: '深海压迫' },
      7:  { freq: 58, type: 'square', lfoRate: 0.4, lfoDepth: 15, filterFreq: 120, name: '废墟警报' },
      8:  { freq: 65, type: 'sine', lfoRate: 0.08, lfoDepth: 2, filterFreq: 400, name: '原野悠远' },
      9:  { freq: 42, type: 'sawtooth', lfoRate: 0.35, lfoDepth: 8, filterFreq: 180, name: '虫潮逼近' },
      10: { freq: 55, type: 'triangle', lfoRate: 0.2, lfoDepth: 5, filterFreq: 280, name: '战场号角' },
      11: { freq: 38, type: 'sawtooth', lfoRate: 0.6, lfoDepth: 20, filterFreq: 100, name: '梦境扭曲' },
      12: { freq: 60, type: 'square', lfoRate: 0.45, lfoDepth: 18, filterFreq: 140, name: '终末轰鸣' },
    };
    
    const cfg = CHAPTER_AMBIENCE[chapter] || CHAPTER_AMBIENCE[1];
    
    // 主音振荡器
    this._bgmOsc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cfg.filterFreq;
    filter.Q.value = 2;

    this._bgmOsc.connect(filter);
    filter.connect(this.musicGain);

    this._bgmOsc.type = cfg.type;
    this._bgmOsc.frequency.value = cfg.freq;

    // LFO 调制频率产生氛围感
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.connect(lfoGain);
    lfoGain.connect(this._bgmOsc.frequency);
    lfo.frequency.value = cfg.lfoRate;
    lfoGain.gain.value = cfg.lfoDepth;
    lfo.start();
    this._bgmLfo = lfo;

    // 第二层谐波（增加厚度）
    this._bgmOsc2 = this.ctx.createOscillator();
    const filter2 = this.ctx.createBiquadFilter();
    filter2.type = 'lowpass';
    filter2.frequency.value = cfg.filterFreq * 0.7;
    const gain2 = this.ctx.createGain();
    gain2.gain.value = 0.15;
    this._bgmOsc2.connect(filter2);
    filter2.connect(gain2);
    gain2.connect(this.musicGain);
    this._bgmOsc2.type = 'sine';
    this._bgmOsc2.frequency.value = cfg.freq * 1.5; // 五度泛音
    this._bgmOsc2.start();

    this._bgmOsc.start();
  }

  stopAmbience() {
    try { if (this._bgmOsc) { this._bgmOsc.stop(); this._bgmOsc = null; } } catch {}
    try { if (this._bgmOsc2) { this._bgmOsc2.stop(); this._bgmOsc2 = null; } } catch {}
    try { if (this._bgmLfo) { this._bgmLfo.stop(); this._bgmLfo = null; } } catch {}
  }

  /** 恢复音频上下文（需要用户交互后调用） */
  resume() {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }
}

export const audioEngine = new AudioEngine();
