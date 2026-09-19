import { paintOn, drawSpeaker, drawMixer } from './icons.js';
import { unlock, soundOn, setSoundOn, musicVol, setMusicVol, sfxVol, setSfxVol } from '../audio/bus.js';
import { resumeMusic, pauseMusic } from '../audio/music.js';
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

  soundBtn.addEventListener('click', () => {
    unlock();                          // the user gesture Web Audio needs before it'll make any sound
    on = !on;
    setSoundOn(on);
    paintSound();
    if (on){ sfx.purr(); resumeMusic(); } else { pauseMusic(); }
  });

  mixerBtn.addEventListener('click', () => {
    unlock();
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

  musicSlider.addEventListener('input', () => { unlock(); setMusicVol(musicSlider.value / 100); });
  sfxSlider.addEventListener('input', () => { unlock(); setSfxVol(sfxSlider.value / 100); sfx.tap(); });
}
