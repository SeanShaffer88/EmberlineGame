import {strikeVoice} from './harvest-feel.js';
import {weather} from './journey.js';
import {ambienceLevels} from './field.js';
// Original synthesized effects; no downloads, recordings or audio assets.
export class Sound {
 constructor(enabled, music = () => true, mix = () => ({})) { this.strikeSerial={tree:0,coal:0,scrap:0,food:0}; this.mixSettings=mix; this.nextBird=0; this.enabled = enabled; this.musicEnabled = music; this.note = 0; this.nextNote = 0; this.nextCrackle = 0; }
 start() {
  if (!this.enabled()) return;
  try {
   if (!this.ctx) {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.noise = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
    const samples = this.noise.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
    this.effectsBus=this.ctx.createGain();this.effectsBus.connect(this.ctx.destination);this.ambienceBus=this.ctx.createGain();this.ambienceBus.connect(this.ctx.destination);
    this.river=this.ctx.createBufferSource();this.river.buffer=this.noise;this.river.loop=true;this.riverFilter=this.ctx.createBiquadFilter();this.riverFilter.type='lowpass';this.riverFilter.frequency.value=850;this.riverGain=this.ctx.createGain();this.riverGain.gain.value=0;this.river.connect(this.riverFilter).connect(this.riverGain).connect(this.ambienceBus);this.river.start();
    this.musicBus = this.ctx.createGain(); this.musicBus.gain.value = 0; this.musicBus.connect(this.ctx.destination);
    this.wind = this.ctx.createBufferSource(); this.wind.buffer = this.noise; this.wind.loop = true;
    this.windFilter = this.ctx.createBiquadFilter(); this.windFilter.type = 'lowpass'; this.windFilter.frequency.value = 380;
    this.windGain = this.ctx.createGain(); this.windGain.gain.value = 0;
    this.wind.connect(this.windFilter).connect(this.windGain).connect(this.ambienceBus); this.wind.start();
    this.engine = this.ctx.createOscillator(); this.engine.type = 'sine'; this.engine.frequency.value = 49;
    this.engineGain = this.ctx.createGain(); this.engineGain.gain.value = 0;
    this.engine.connect(this.engineGain).connect(this.ambienceBus); this.engine.start();
   }
   this.applyMix();this.ctx.resume().catch(() => {});
  } catch { /* Audio is optional; the game remains playable without it. */ }
 }
 tone(frequency, at, duration, volume, type = 'sine', end = frequency, destination = this.effectsBus || this.ctx.destination) {
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
  const c=this.ctx, now=c.currentTime, storm=weather(state).storm;this.applyMix();const place=ambienceLevels(state);this.riverGain?.gain.setTargetAtTime(place.river*.03,now,.7);if(now>this.nextBird){if(place.birds>.15&&!storm){this.tone(1700,now,.16,place.birds*.009,'sine',2300,this.ambienceBus);this.tone(2100,now+.2,.12,place.birds*.007,'sine',1600,this.ambienceBus);}this.nextBird=now+11;}
  const distance=Math.hypot(state.player.x+2,state.player.z),near=Math.max(0,1-distance/14);
  this.windGain.gain.setTargetAtTime(storm?.09:.038,now,1.2);
  this.windFilter.frequency.setTargetAtTime(storm?650:330,now,1.2);
  this.engineGain.gain.setTargetAtTime(near*(.008+state.buildings.engine*.003),now,.5);
  this.engine.frequency.setTargetAtTime(49+Math.sin(now*.8)*.8,now,.2);

  if(now>this.nextCrackle){
   if(near>.1){this.rustle(now,900+Math.random()*1400,.06,near*.025,this.ambienceBus);if(Math.random()<.12)this.tone(110,now,.3,near*.005,'triangle',75,this.ambienceBus);}
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
 rustle(at, frequency, duration, volume, destination = this.effectsBus || this.ctx.destination) {
  const c = this.ctx, source = c.createBufferSource(), filter = c.createBiquadFilter(), gain = c.createGain();
  source.buffer = this.noise;
  filter.type = 'bandpass'; filter.frequency.value = frequency; filter.Q.value = .7;
  gain.gain.setValueAtTime(volume, at);
  gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
  source.connect(filter).connect(gain).connect(destination);
  source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
  source.start(at, Math.random() * .6); source.stop(at + duration + .02);
 }
 play(kind = 'tap') {
  if (!this.enabled() || !this.ctx || this.ctx.state !== 'running') return;
  const now = this.ctx.currentTime;
  const voice=strikeVoice(kind,this.strikeSerial[kind]||0);if(kind in this.strikeSerial)this.strikeSerial[kind]++;
  if(kind==='whistle'){this.tone(330,now,.85,.025,'sine',310);this.tone(495,now,.8,.012,'sine',465);this.rustle(now,850,.65,.012);return;}
  if(/^note-[0-2]$/.test(kind)){const f=[392,523.25,783.99][+kind.slice(-1)];this.tone(f,now,.6,.035,'sine',f);this.tone(f*2,now,.3,.008,'sine',f*2);return;}
  if(kind.startsWith('finish-')){const type=kind.slice(7);this.rustle(now,type==='tree'?480:type==='coal'?950:1800,.32,.07);this.tone(type==='food'?740:330,now+.04,.25,.025,'triangle',550);this.tone(660,now+.16,.24,.02);return;}
  if(kind==='step-wood'){this.tone(130,now,.09,.022,'sine',70);this.rustle(now,650,.07,.015);return;}
  if(kind==='step-metal'){this.tone(700,now,.13,.012,'triangle',480);return;}
  if(kind==='step-packed'){this.rustle(now,1100,.085,.018);return;}
  if (kind === 'step') { this.rustle(now, 1800, .12, .023); return; }
  if (kind === 'tree') {
   this.tone(voice.frequency, now, .16, .055*voice.weight, 'sine', 65*voice.pitch);
   this.rustle(now, 620*voice.pitch, .14, .1*voice.weight); return;
  }
  if (kind === 'scrap' || kind === 'coal') {
   this.tone(voice.frequency, now, .24, .025*voice.weight, 'triangle', 420*voice.pitch);
   this.rustle(now, 2400*voice.pitch, .10, .06*voice.weight); return;
  }
  if (kind === 'food') { this.rustle(now, 1200, .18, .05); this.tone(voice.frequency, now + .04, .18, .022*voice.weight); return; }
  const notes = kind === 'reward' ? [392, 493.88, 587.33, 783.99] : kind === 'gather' ? [220, 330] : [440];
  notes.forEach((f, i) => this.tone(f, now + i * .09, .28, .032));
 }
 applyMix(){if(!this.ctx)return;const m=this.mixSettings(),t=this.ctx.currentTime,level=(key,fallback)=>Number.isFinite(m[key])?Math.max(0,Math.min(1,m[key])):fallback;this.effectsBus?.gain.setTargetAtTime(level('effectsVolume',.8),t,.08);this.ambienceBus?.gain.setTargetAtTime(level('ambienceVolume',.7),t,.15);this.musicBus?.gain.setTargetAtTime(this.musicEnabled()?.62*level('musicVolume',.7)/.7:0,t,.25);}
 pause() { this.ctx?.suspend().catch(() => {}); }
}
