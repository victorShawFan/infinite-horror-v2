export function getAudioCueForPresentation(cue) {
  if (cue.type === 'attack') return 'attack';
  if (cue.type === 'hit') return cue.intensity === 'critical' ? 'critical' : 'hit';
  if (cue.type === 'heal') return 'heal';
  if (cue.type === 'guard') return 'guard';
  if (cue.type === 'protection') return 'guard';
  if (cue.type === 'hazard') return 'critical';
  if (cue.type === 'boss_phase') return 'boss_phase';
  return null;
}

export function normalizeAudioPreference(value) {
  return value === true || value === 'true';
}

export function getMusicThemeForScene(scene, context = {}) {
  if (scene === 'hub') return 'lord-god';
  if (scene === 'battle') return context.boss ? 'boss' : 'combat';
  if (scene === 'exploration' || scene === 'briefing') {
    return { 1:'bio-horror', 2:'alien-horror', 3:'curse-horror', 4:'tomb-horror' }[Number(context.chapter || 1)] || 'bio-horror';
  }
  if (scene === 'epilogue') return 'epilogue';
  return 'title';
}

const MUSIC_THEMES = Object.freeze({
  title:         { frequencies:[55,82.41,110], wave:'sine', gain:.052, pulse:.075 },
  'lord-god':    { frequencies:[65.41,98,130.81,196], wave:'sine', gain:.047, pulse:.11 },
  'bio-horror':  { frequencies:[46.25,69.3,92.5], wave:'triangle', gain:.045, pulse:.19 },
  'alien-horror':{ frequencies:[43.65,65.41,87.31], wave:'sawtooth', gain:.028, pulse:.23 },
  'curse-horror':{ frequencies:[41.2,61.74,77.78], wave:'sine', gain:.052, pulse:.13 },
  'tomb-horror': { frequencies:[55,73.42,110], wave:'triangle', gain:.039, pulse:.09 },
  combat:        { frequencies:[55,82.41,123.47], wave:'sawtooth', gain:.034, pulse:.36 },
  boss:          { frequencies:[36.71,55,73.42,110], wave:'sawtooth', gain:.044, pulse:.48 },
  epilogue:      { frequencies:[65.41,98,130.81,164.81], wave:'sine', gain:.052, pulse:.065 },
});

export class RebuildAudio {
  constructor({ muted = false } = {}) {
    this.ctx = null;
    this.master = null;
    this.muted = normalizeAudioPreference(muted);
    this.musicTheme = 'title';
    this.musicNodes = [];
    this.musicBus = null;
  }

  init() {
    if (this.ctx || typeof window === 'undefined') return !!this.ctx;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return false;
    try {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.24;
      this.master.connect(this.ctx.destination);
      this._startMusic();
      return true;
    } catch {
      this.ctx = null;
      this.master = null;
      return false;
    }
  }

  setMuted(muted) {
    this.muted = !!muted;
    if (this.master && this.ctx) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.24, this.ctx.currentTime, 0.02);
    }
  }

  toggleMuted() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  setMusicTheme(theme) {
    const resolved = MUSIC_THEMES[theme] ? theme : 'title';
    if (resolved === this.musicTheme && this.musicNodes.length) return;
    this.musicTheme = resolved;
    if (this.ctx) this._startMusic();
  }

  _stopMusic() {
    for (const node of this.musicNodes) {
      try { node.stop?.(); } catch {}
      try { node.disconnect?.(); } catch {}
    }
    this.musicNodes = [];
    try { this.musicBus?.disconnect?.(); } catch {}
    this.musicBus = null;
  }

  _startMusic() {
    if (!this.ctx || !this.master) return;
    this._stopMusic();
    const theme = MUSIC_THEMES[this.musicTheme] || MUSIC_THEMES.title;
    const now = this.ctx.currentTime;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = this.musicTheme === 'combat' || this.musicTheme === 'boss' ? 520 : 310;
    filter.Q.value = 1.2;
    this.musicBus = this.ctx.createGain();
    this.musicBus.gain.value = theme.gain;
    filter.connect(this.musicBus);
    this.musicBus.connect(this.master);
    for (const [index, frequency] of theme.frequencies.entries()) {
      const oscillator = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      oscillator.type = theme.wave;
      oscillator.frequency.value = frequency;
      oscillator.detune.value = (index - theme.frequencies.length / 2) * 3;
      gain.gain.value = 1 / theme.frequencies.length;
      oscillator.connect(gain); gain.connect(filter); oscillator.start(now);
      this.musicNodes.push(oscillator, gain);
    }
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.type = 'sine'; lfo.frequency.value = theme.pulse; lfoGain.gain.value = theme.gain * .36;
    lfo.connect(lfoGain); lfoGain.connect(this.musicBus.gain); lfo.start(now);
    this.musicNodes.push(lfo, lfoGain, filter);
  }

  play(cue) {
    if (this.muted || !this.init()) return;
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    const patterns = {
      click:      [{ f: 520, to: 680, d: .055, v: .09, type: 'sine' }],
      attack:     [{ f: 260, to: 95, d: .14, v: .18, type: 'sawtooth' }],
      hit:        [{ f: 150, to: 62, d: .16, v: .24, type: 'square' }],
      critical:   [{ f: 560, to: 120, d: .24, v: .28, type: 'sawtooth' }, { f: 82, to: 45, d: .28, v: .18, type: 'square', delay: .02 }],
      heal:       [{ f: 440, to: 660, d: .22, v: .12, type: 'sine' }, { f: 660, to: 920, d: .24, v: .09, type: 'sine', delay: .1 }],
      guard:      [{ f: 190, to: 260, d: .18, v: .14, type: 'triangle' }],
      boss_phase: [{ f: 78, to: 42, d: .65, v: .34, type: 'square' }, { f: 120, to: 58, d: .55, v: .22, type: 'sawtooth', delay: .13 }],
      victory:    [{ f: 392, to: 392, d: .3, v: .12, type: 'sine' }, { f: 523, to: 523, d: .32, v: .12, type: 'sine', delay: .12 }, { f: 659, to: 659, d: .4, v: .14, type: 'sine', delay: .24 }],
      defeat:     [{ f: 190, to: 72, d: .7, v: .2, type: 'triangle' }],
    };
    for (const tone of patterns[cue] || []) this._tone(tone);
  }

  _tone({ f, to, d, v, type, delay = 0 }) {
    const start = this.ctx.currentTime + delay;
    const oscillator = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(f, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, to), start + d);
    gain.gain.setValueAtTime(Math.max(.001, v), start);
    gain.gain.exponentialRampToValueAtTime(.001, start + d);
    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start(start);
    oscillator.stop(start + d + .02);
  }
}
