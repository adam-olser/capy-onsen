import { store } from '../core/store.js';

/* Shared audio graph. Two independently-controlled buses (music, sfx) feed
   a master gain -> destination, plus the existing quick on/off mute (which
   gates both at once). Volumes and the mute state persist the same way the
   old single `capy.sound` flag did. */
let actx = null;
let master = null, musicGain = null, sfxGain = null;

export let soundOn = store.get('capy.sound') === '1';
export let musicVol = clamp01(parseFloat(store.get('capy.vol.music') ?? '0.25'));
export let sfxVol   = clamp01(parseFloat(store.get('capy.vol.sfx')   ?? '0.5'));

function clamp01(v){ return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0.5; }

function ensure(){
  if (actx) return actx;
  actx = new (window.AudioContext || window.webkitAudioContext)();
  master = actx.createGain();
  musicGain = actx.createGain();
  sfxGain = actx.createGain();
  musicGain.connect(master); sfxGain.connect(master); master.connect(actx.destination);
  applyGains();
  return actx;
}

function applyGains(){
  if (!actx) return;
  const m = soundOn ? musicVol : 0, s = soundOn ? sfxVol : 0;
  musicGain.gain.setTargetAtTime(m, actx.currentTime, .05);
  sfxGain.gain.setTargetAtTime(s, actx.currentTime, .02);
}

/* Call from any user gesture (click/tap) before scheduling sound -- browsers
   refuse to start an AudioContext without one. Safe to call repeatedly. */
export function unlock(){
  ensure();
  if (actx.state === 'suspended') actx.resume();
}

export function ctx(){ return actx; }
export function musicBus(){ ensure(); return musicGain; }
export function sfxBus(){ ensure(); return sfxGain; }

export function setSoundOn(v){ soundOn = v; store.set('capy.sound', v ? '1' : '0'); applyGains(); }
export function setMusicVol(v){ musicVol = clamp01(v); store.set('capy.vol.music', String(musicVol)); applyGains(); }
export function setSfxVol(v){ sfxVol = clamp01(v); store.set('capy.vol.sfx', String(sfxVol)); applyGains(); }
