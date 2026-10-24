// Original synthesized effects; no downloads, recordings or audio assets.
export class Sound {
 constructor(enabled, music = () => true) { this.enabled = enabled; this.musicEnabled = music; this.note = 0; this.nextNote = 0; this.nextCrackle = 0; }
 start() {
  if (!this.enabled()) return;
  try {
   if (!this.ctx) {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.noise = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
    const samples = this.noise.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
    this.musicBus = this.ctx.createGain(); this.musicBus.gain.value = 0; this.musicBus.connect(this.ctx.destination);
    this.wind = this.ctx.createBufferSource(); this.wind.buffer = this.noise; this.wind.loop = true;
    this.windFilter = this.ctx.createBiquadFilter(); this.windFilter.type = 'lowpass'; this.windFilter.frequency.value = 380;
    this.windGain = this.ctx.createGain(); this.windGain.gain.value = 0;
    this.wind.connect(this.windFilter).connect(this.windGain).connect(this.ctx.destination); this.wind.start();
    this.engine = this.ctx.createOscillator(); this.engine.type = 'sine'; this.engine.frequency.value = 49;
    this.engineGain = this.ctx.createGain(); this.engineGain.gain.value = 0;
    this.engine.connect(this.engineGain).connect(this.ctx.destination); this.engine.start();
   }
   this.ctx.resume().catch(() => {});
  } catch { /* Audio is optional; the game remains playable without it. */ }
 }
 tone(frequency, at, duration, volume, type = 'sine', end = frequency, destination = this.ctx.destination) {
  const c = this.ctx, oscillator = c.createOscillator(), gain = c.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, at);
  oscillator.frequency.exponentialRampToValueAtTime(end, at + duration);
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(volume, at + .008);
  gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
  oscillator.connect(gain).connect(destination);
  oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  oscillator.start(at); oscillator.stop(at + duration + .02);
 }
 // An original, quiet pentatonic score. Layers grow with the permanent home;
 // no recordings, downloads, model inference, or wall-clock rewards are needed.
 update(state) {
  if (!this.ctx || this.ctx.state !== 'running' || !this.enabled()) return;
  const c=this.ctx, now=c.currentTime, storm=Math.floor(state.activeSeconds/120)%3===2;
  const distance=Math.hypot(state.player.x+2,state.player.z),near=Math.max(0,1-distance/14);
  this.windGain.gain.setTargetAtTime(storm?.09:.038,now,1.2);
  this.windFilter.frequency.setTargetAtTime(storm?650:330,now,1.2);
  this.engineGain.gain.setTargetAtTime(near*(.008+state.buildings.engine*.003),now,.5);
  this.engine.frequency.setTargetAtTime(49+Math.sin(now*.8)*.8,now,.2);
  this.musicBus.gain.setTargetAtTime(this.musicEnabled()?.62:0,now,.25);
  if(now>this.nextCrackle){
   if(near>.1){this.rustle(now,900+Math.random()*1400,.06,near*.025);if(Math.random()<.12)this.tone(110,now,.3,near*.005,'triangle',75);}
   this.nextCrackle=now+.2+Math.random()*.5;
  }
  if(now>=this.nextNote){
   this.nextNote=now+1.5;
   if(!this.musicEnabled())return;
   const melody=[0,7,12,7,4,2,0,-5,0,4,7,12,14,12,7,4,2,7,9,7,4,2,0,-5,0,7,4,2,0,-5,-3,-5];
   const index=this.note++%melody.length,frequency=261.6256*2**(melody[index]/12);
   this.tone(frequency,now,2.8,.025,'sine',frequency,this.musicBus);
   this.tone(frequency*2,now+.025,1.4,.004,'sine',frequency*2,this.musicBus);
   if(index%4===0){const bass=65.4064*2**([0,-3,-5,0][Math.floor(index/8)]/12);this.tone(bass,now,5.8,.02,'sine',bass,this.musicBus);}
   if(state.buildings.engine>=1&&index%2===0)this.tone(frequency*.5,now+.75,2.6,.01,'triangle',frequency*.5,this.musicBus);
   if(Object.values(state.flags).filter(Boolean).length>=3&&index%4===2)this.tone(frequency*1.5,now+.75,2.2,.009,'sine',frequency*1.5,this.musicBus);
  }
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
