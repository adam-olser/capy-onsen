import { paintOn, drawSpeaker, drawMixer } from './icons.js';
import { unlock, soundOn, setSoundOn, musicVol, setMusicVol, sfxVol, setSfxVol } from '../audio/bus.js';
import { startMusic } from '../audio/music.js';
import { sfx } from '../audio/sfx.js';

export function initSoundPanel(){
  const soundBtn = document.getElementById('sound');
  const mixerBtn = document.getElementById('mixerBtn');
  const mixer = document.getElementById('mixer');
  const musicSlider = document.getElementById('musicSlider');
  const sfxSlider = document.getElementById('sfxSlider');
  const soundIcon = soundBtn.querySelector('canvas');
  const mixerIcon = mixerBtn.querySelector('canvas');

  let on = soundOn;
  const paintSound = () => {
    paintOn(soundIcon, () => drawSpeaker(on));
    soundBtn.setAttribute('aria-pressed', String(on));
  };
  paintOn(mixerIcon, drawMixer);
  paintSound();
  musicSlider.value = String(Math.round(musicVol * 100));
  sfxSlider.value = String(Math.round(sfxVol * 100));

  // any interaction with either button counts as the user gesture Web Audio
  // needs before it will make a sound at all
  const wake = () => { unlock(); startMusic(); };

  soundBtn.addEventListener('click', () => {
    wake();
    on = !on;
    setSoundOn(on);
    paintSound();
    if (on) sfx.purr();
  });

  mixerBtn.addEventListener('click', () => {
    wake();
    const open = mixer.hasAttribute('hidden');
    if (open) mixer.removeAttribute('hidden'); else mixer.setAttribute('hidden', '');
    mixerBtn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('pointerdown', e => {
    if (mixer.hasAttribute('hidden')) return;
    if (e.target === mixer || mixer.contains(e.target) || e.target === mixerBtn || mixerBtn.contains(e.target)) return;
    mixer.setAttribute('hidden', '');
    mixerBtn.setAttribute('aria-expanded', 'false');
  });

  musicSlider.addEventListener('input', () => { wake(); setMusicVol(musicSlider.value / 100); });
  sfxSlider.addEventListener('input', () => { wake(); setSfxVol(sfxSlider.value / 100); sfx.tap(); });
}
