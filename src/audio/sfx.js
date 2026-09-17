import { store } from '../core/store.js';

/* Placeholder synth cues. Being replaced wholesale in the audio pass:
   ADSR envelopes, filtering, layering and pitch jitter through a shared bus. */
let actx = null, soundOn = store.get('capy.sound') === '1';
const soundBtn = document.getElementById('sound');
function paintSound(){
  soundBtn.textContent = soundOn ? '🔊' : '🔇';
  soundBtn.setAttribute('aria-pressed', String(soundOn));
}
function blip(freq, dur = .09, type = 'triangle', vol = .16){
  if (!soundOn) return;
  if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
  if (actx.state === 'suspended') actx.resume();
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(vol, actx.currentTime);
  g.gain.exponentialRampToValueAtTime(.0001, actx.currentTime + dur);
  o.connect(g).connect(actx.destination);
  o.start(); o.stop(actx.currentTime + dur);
}
export const sfx = {
  tap:   () => blip(520, .06, 'square', .1),
  flip:  () => blip(680, .07),
  match: () => { blip(760, .1); setTimeout(() => blip(1010, .14), 90); },
  miss:  () => blip(190, .12, 'sawtooth', .08),
  purr:  () => { blip(150, .22, 'sine', .12); setTimeout(() => blip(190, .18, 'sine', .1), 130); },
  pop:   () => blip(880, .07, 'sine', .14),
  jump:  () => blip(600, .1, 'square', .1),
  win:   () => [0,110,220,360].forEach((d,i) => setTimeout(() => blip([660,830,990,1320][i], .16), d)),
};
soundBtn.addEventListener('click', () => {
  soundOn = !soundOn;
  store.set('capy.sound', soundOn ? '1' : '0');
  paintSound();
  if (soundOn) sfx.purr();
});
paintSound();
