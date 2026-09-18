import { unlock, ctx, sfxBus } from './bus.js';

/* Synthesized cues, no audio files. Every cue is built from oscillator(s) +
   an ADSR-shaped gain envelope, often with a biquad filter for texture and
   occasionally a short burst of filtered noise for percussive "thump" --
   the standard toolkit for 8-bit-style Web Audio sound design (envelope
   shaping, filtering, noise+tone layering). A few ms of random pitch jitter
   is added per-call so rapid repeats (popping several bubbles) don't sound
   like a machine gun of identical clicks. */

let noiseBuf = null;
function noise(){
  const c = ctx();
  if (!noiseBuf){
    noiseBuf = c.createBuffer(1, c.sampleRate * 0.3, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
}

const jitter = (cents = 15) => Math.pow(2, ((Math.random() * 2 - 1) * cents) / 1200);

/* A single oscillator voice with an ADSR envelope and an optional lowpass
   sweep (for pitch-bend "pop"/"jump" style cues) or filter. */
function tone(freq, { type = 'sine', a = .005, d = .06, s = .3, r = .08, peak = .22,
                       sweepTo = null, sweepTime = .1, filterFreq = null, filterQ = .8 } = {}){
  const c = ctx(), bus = sfxBus();
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.value = freq * jitter();
  if (sweepTo != null){
    o.frequency.exponentialRampToValueAtTime(Math.max(20, sweepTo * jitter()), c.currentTime + sweepTime);
  }
  let node = o;
  if (filterFreq){
    const f = c.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = filterFreq; f.Q.value = filterQ;
    node.connect(f); node = f;
  }
  const t0 = c.currentTime;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + a);
  g.gain.linearRampToValueAtTime(peak * s, t0 + a + d);
  g.gain.linearRampToValueAtTime(0, t0 + a + d + r);
  node.connect(g).connect(bus);
  o.start(t0); o.stop(t0 + a + d + r + .02);
}

/* A short burst of filtered noise -- a wooden tap, a card's edge, a splash. */
function thump(freqCenter, { dur = .07, q = 1.4, peak = .18, type = 'bandpass' } = {}){
  const c = ctx(), bus = sfxBus();
  const src = c.createBufferSource(); src.buffer = noise();
  const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freqCenter * jitter(8); f.Q.value = q;
  const g = c.createGain();
  const t0 = c.currentTime;
  g.gain.setValueAtTime(peak, t0);
  g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
  src.connect(f).connect(g).connect(bus);
  src.start(t0); src.stop(t0 + dur + .01);
}

function at(fn, delayMs){ setTimeout(fn, delayMs); }

export const sfx = {
  /* a soft wooden tap -- menu nav, keypresses */
  tap(){ unlock(); thump(1800, { dur: .045, peak: .13 }); tone(680, { type: 'triangle', a: .002, d: .03, r: .03, peak: .07 }); },

  /* a card's edge catching the light as it flips */
  flip(){ unlock(); thump(2400, { dur: .09, q: .9, peak: .14, type: 'highpass' }); },

  /* two notes, rising -- a small win */
  match(){
    unlock();
    tone(660, { type: 'triangle', a: .004, d: .07, r: .1, peak: .2 });
    at(() => tone(880, { type: 'triangle', a: .004, d: .09, r: .14, peak: .22 }), 85);
  },

  /* a short low buzz -- something didn't land */
  miss(){ unlock(); tone(180, { type: 'sawtooth', a: .002, d: .05, r: .1, peak: .14, filterFreq: 900 }); },

  /* low sine with a slow tremolo -- an actual purr, not a beep */
  purr(){
    unlock();
    const c = ctx(), bus = sfxBus();
    const o = c.createOscillator(), lfo = c.createOscillator(), lfoGain = c.createGain(), g = c.createGain();
    o.type = 'sine'; o.frequency.value = 145 * jitter(6);
    lfo.frequency.value = 11; lfoGain.gain.value = 28;
    lfo.connect(lfoGain).connect(o.frequency);
    const t0 = c.currentTime, dur = .38;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(.16, t0 + .05);
    g.gain.linearRampToValueAtTime(.1, t0 + dur * .6);
    g.gain.linearRampToValueAtTime(0, t0 + dur);
    o.connect(g).connect(bus);
    o.start(t0); lfo.start(t0);
    o.stop(t0 + dur + .02); lfo.stop(t0 + dur + .02);
  },

  /* a bubble: quick downward pitch sweep + a tiny surface tick */
  pop(){
    unlock();
    tone(1500, { type: 'sine', a: .002, d: .05, r: .06, peak: .18, sweepTo: 650, sweepTime: .07 });
    thump(3200, { dur: .02, peak: .06 });
  },

  /* a quick upward chirp */
  jump(){ unlock(); tone(420, { type: 'square', a: .002, d: .05, r: .07, peak: .14, sweepTo: 720, sweepTime: .09, filterFreq: 2200 }); },

  /* a hirajoshi-scale arpeggio -- matches the ambient music's own scale */
  win(){
    unlock();
    const notes = [659, 698, 932, 1108, 1397];   // E5 hirajoshi-ish run
    notes.forEach((f, i) => at(() => tone(f, { type: 'triangle', a: .005, d: .1, r: .22, peak: .18 }), i * 90));
  },
};
