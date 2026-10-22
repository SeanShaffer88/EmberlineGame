// Original synthesized effects; no downloads, recordings or audio assets.
export class Sound {
 constructor(enabled) { this.enabled = enabled; }
 start() {
  if (!this.enabled()) return;
  try {
   if (!this.ctx) {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.noise = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
    const samples = this.noise.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
   }
   this.ctx.resume().catch(() => {});
  } catch { /* Audio is optional; the game remains playable without it. */ }
 }
 tone(frequency, at, duration, volume, type = 'sine', end = frequency) {
  const c = this.ctx, oscillator = c.createOscillator(), gain = c.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, at);
  oscillator.frequency.exponentialRampToValueAtTime(end, at + duration);
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(volume, at + .008);
  gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
  oscillator.connect(gain).connect(c.destination);
  oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  oscillator.start(at); oscillator.stop(at + duration + .02);
 }
 rustle(at, frequency, duration, volume) {
  const c = this.ctx, source = c.createBufferSource(), filter = c.createBiquadFilter(), gain = c.createGain();
  source.buffer = this.noise;
  filter.type = 'bandpass'; filter.frequency.value = frequency; filter.Q.value = .7;
  gain.gain.setValueAtTime(volume, at);
  gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
  source.connect(filter).connect(gain).connect(c.destination);
  source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
  source.start(at, Math.random() * .6); source.stop(at + duration + .02);
 }
 play(kind = 'tap') {
  if (!this.enabled() || !this.ctx || this.ctx.state !== 'running') return;
  const now = this.ctx.currentTime;
  if (kind === 'step') { this.rustle(now, 1800, .12, .023); return; }
  if (kind === 'tree') {
   this.tone(170, now, .16, .055, 'sine', 65);
   this.rustle(now, 620, .14, .13); return;
  }
  if (kind === 'scrap' || kind === 'coal') {
   this.tone(kind === 'coal' ? 580 : 940, now, .24, .025, 'triangle', 420);
   this.rustle(now, 2400, .10, .06); return;
  }
  if (kind === 'food') { this.rustle(now, 1200, .18, .05); this.tone(660, now + .04, .18, .022); return; }
  const notes = kind === 'reward' ? [392, 493.88, 587.33, 783.99] : kind === 'gather' ? [220, 330] : [440];
  notes.forEach((f, i) => this.tone(f, now + i * .09, .28, .032));
 }
 pause() { this.ctx?.suspend().catch(() => {}); }
}
