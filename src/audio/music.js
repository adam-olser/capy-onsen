import { ctx, musicBus, unlock } from './bus.js';

import menuUrl from './tracks/menu-lofi-tokyo.mp3';
import bubbleUrl from './tracks/bubbles-rainy-days.mp3';
import wordleUrl from './tracks/wordle-solemn-strings.mp3';
import orangeUrl from './tracks/orange-funny-positive.mp3';
import runUrl from './tracks/run-gaming-circuit.mp3';

/* Licensed tracks (see export/AUDIO-CREDITS.md), one per screen -- match and
   stack don't have a dedicated one yet, so they share Orange Catch's. */
const TRACKS = {
  menu: menuUrl, bubble: bubbleUrl, wordle: wordleUrl, orange: orangeUrl, run: runUrl,
  match: orangeUrl, stack: orangeUrl,
};
const FADE = 1.2;                       // seconds, crossfade between tracks

const nodes = {};                       // key -> { audio, gain }
let activeKey = null, desiredKey = 'menu', playing = false;

function nodeFor(key){
  if (nodes[key]) return nodes[key];
  const audio = new Audio(TRACKS[key]);
  audio.loop = true;
  const gain = ctx().createGain();
  gain.gain.value = 0;
  ctx().createMediaElementSource(audio).connect(gain).connect(musicBus());
  return nodes[key] = { audio, gain };
}

function crossfadeTo(key){
  const c = ctx();
  if (activeKey && activeKey !== key && nodes[activeKey]){
    const prev = nodes[activeKey];
    prev.gain.gain.cancelScheduledValues(c.currentTime);
    prev.gain.gain.setValueAtTime(prev.gain.gain.value, c.currentTime);
    prev.gain.gain.linearRampToValueAtTime(0, c.currentTime + FADE);
    const prevAudio = prev.audio;
    setTimeout(() => prevAudio.pause(), FADE * 1000);
  }
  const next = nodeFor(key);
  if (next.audio.paused){ next.audio.currentTime = 0; next.audio.play().catch(() => {}); }
  next.gain.gain.cancelScheduledValues(c.currentTime);
  next.gain.gain.setValueAtTime(next.gain.gain.value, c.currentTime);
  next.gain.gain.linearRampToValueAtTime(1, c.currentTime + FADE);
  activeKey = key;
}

/* Call whenever the visible screen changes (menu <-> a game). Only actually
   crossfades if sound is currently on; otherwise just remembers where we
   are, so turning sound on later starts the right track for wherever the
   player ended up while muted. */
export function setScene(key){
  desiredKey = TRACKS[key] ? key : 'menu';
  if (playing) crossfadeTo(desiredKey);
}

/* Call from the sound toggle turning on -- a real user gesture, which is
   what satisfies the browser autoplay gate. */
export function resumeMusic(){
  unlock();
  playing = true;
  crossfadeTo(desiredKey);
}

/* read-only hook for the browser-testing pass -- see main.js's window.__* */
export function musicDebug(){
  return {
    activeKey, desiredKey, playing,
    paused: activeKey ? nodes[activeKey].audio.paused : null,
    gain: activeKey ? nodes[activeKey].gain.gain.value : null,
  };
}

export function pauseMusic(){
  playing = false;
  if (!activeKey || !nodes[activeKey]) return;
  const c = ctx();
  const cur = nodes[activeKey];
  cur.gain.gain.cancelScheduledValues(c.currentTime);
  cur.gain.gain.setValueAtTime(cur.gain.gain.value, c.currentTime);
  cur.gain.gain.linearRampToValueAtTime(0, c.currentTime + FADE);
  const curAudio = cur.audio;
  setTimeout(() => curAudio.pause(), FADE * 1000);
}
