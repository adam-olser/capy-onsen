import { unlock, ctx, musicBus } from './bus.js';

/* Generative ambient bed: a soft detuned drone plus sparse notes from the
   hirajoshi scale (the Japanese pentatonic behind Sakura -- fits the onsen
   setting), so it never audibly loops. No samples, two oscillators for the
   drone and one at a time for the melody, all well under the noise floor of
   the SFX. Starts once, on the first user gesture, and just keeps running
   softly under every screen. */
const ROOT = 220;                              // A3
const HIRAJOSHI = [0, 1, 5, 7, 8];              // semitone steps from the root
const noteFreq = step => ROOT * Math.pow(2, step / 12);

let started = false, droneGain = null, noteTimer = null;

function scheduleNote(){
  const c = ctx(), bus = musicBus();
  const step = HIRAJOSHI[Math.floor(Math.random() * HIRAJOSHI.length)] + (Math.random() < .3 ? 12 : 0);
  const freq = noteFreq(step);
  const o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
  o.type = 'sine'; o.frequency.value = freq;
  f.type = 'lowpass'; f.frequency.value = 1400; f.Q.value = .5;
  const t0 = c.currentTime, dur = 3.2 + Math.random() * 2.2;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(.05, t0 + dur * .3);
  g.gain.linearRampToValueAtTime(0, t0 + dur);
  o.connect(f).connect(g).connect(bus);
  o.start(t0); o.stop(t0 + dur + .1);

  noteTimer = setTimeout(scheduleNote, (2.6 + Math.random() * 4.5) * 1000);
}

export function startMusic(){
  if (started) return;
  started = true;
  unlock();
  const c = ctx(), bus = musicBus();

  // drone: root + fifth, gently detuned against each other
  droneGain = c.createGain();
  droneGain.gain.value = 0;
  droneGain.connect(bus);
  for (const step of [0, 7]){
    const o1 = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain();
    o1.type = 'sine'; o2.type = 'sine';
    o1.frequency.value = noteFreq(step - 12);
    o2.frequency.value = noteFreq(step - 12) * 1.004;   // slow detune beat
    g.gain.value = step === 0 ? .5 : .3;
    o1.connect(g); o2.connect(g); g.connect(droneGain);
    o1.start(); o2.start();
  }
  droneGain.gain.linearRampToValueAtTime(.14, c.currentTime + 3);

  scheduleNote();
}

export function stopMusic(){
  started = false;
  if (noteTimer) clearTimeout(noteTimer);
  if (droneGain) droneGain.gain.linearRampToValueAtTime(0, ctx().currentTime + 1.2);
}
