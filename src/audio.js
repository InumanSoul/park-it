import { G, car } from './state.js';
import { ICON_SND_ON, ICON_SND_OFF } from './sprites.js';

export let AC = null, engOsc = null, engGain = null, masterGain = null;
export function ac(){
  try {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!AC && Ctor) AC = new Ctor();
  } catch(e){}
  return AC;
}
export function out(){
  const a = ac(); if (!a) return null;
  if (!masterGain){
    masterGain = a.createGain();
    masterGain.gain.value = G.muted ? 0 : 1;
    masterGain.connect(a.destination);
  }
  return masterGain;
}
export function setMuted(v){
  G.muted = v;
  if (masterGain) masterGain.gain.value = v ? 0 : 1;
  try { localStorage.setItem('parkit-muted', v ? '1' : '0'); } catch(e){}
  const btn = document.getElementById('sndBtn');
  if (btn){ btn.innerHTML = v ? ICON_SND_OFF : ICON_SND_ON; btn.classList.toggle('muted', v); }
}
export function beep(f, dur, type='square', g=0.07, delay=0, slideTo){
  const a = ac(), mg = out(); if (!a || !mg) return;
  try {
    const o = a.createOscillator(), gn = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, a.currentTime + delay);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, a.currentTime + delay + dur);
    gn.gain.setValueAtTime(g, a.currentTime + delay);
    gn.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + delay + dur);
    o.connect(gn).connect(mg);
    o.start(a.currentTime + delay); o.stop(a.currentTime + delay + dur + 0.02);
  } catch(e){}
}
export function noiseBurst(dur=0.3, g=0.25){
  const a = ac(), mg = out(); if (!a || !mg) return;
  try {
    const src = a.createBufferSource();
    const buf = a.createBuffer(1, a.sampleRate*dur, a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i=0;i<d.length;i++) d[i] = (Math.random()*2-1) * (1 - i/d.length);
    src.buffer = buf;
    const gn = a.createGain(); gn.gain.value = g;
    src.connect(gn).connect(mg); src.start();
  } catch(e){}
}
export const sfx = {
  crash(){ noiseBurst(0.35, 0.3); beep(90, 0.3, 'sawtooth', 0.15); },
  granny(){ beep(900, 0.45, 'sawtooth', 0.12, 0, 250); noiseBurst(0.2, 0.15); },
  win(st){ [392,523,659,784].slice(0, 1+st).forEach((f,i)=>beep(f, 0.18, 'triangle', 0.09, i*0.13)); },
  honk(){ beep(345, 0.18, 'square', 0.1); beep(258, 0.18, 'square', 0.1, 0.02); },
};
export function engineUpdate(){
  const a = ac(), mg = out(); if (!a || !mg) return;
  try {
    if (!engOsc){
      engOsc = a.createOscillator(); engGain = a.createGain();
      engOsc.type = 'sawtooth'; engGain.gain.value = 0;
      engOsc.connect(engGain).connect(mg); engOsc.start();
    }
    const sp = Math.abs(car.v);
    engOsc.frequency.value = 55 + sp*0.45;
    engGain.gain.value = G.scene === 'play' ? (sp > 3 ? 0.028 : 0.01) : 0;
  } catch(e){}
}
