import { paintOn, drawSpeaker, drawMixer } from './icons.js';
import { unlock, soundOn, setSoundOn, musicVol, setMusicVol, sfxVol, setSfxVol } from '../audio/bus.js';
import { resumeMusic, pauseMusic } from '../audio/music.js';
import { sfx } from '../audio/sfx.js';

export function initSoundPanel(): void {
  const soundBtn = document.getElementById('sound')!;
  const mixerBtn = document.getElementById('mixerBtn')!;
  const mixer = document.getElementById('mixer')!;
  const musicSlider = document.getElementById('musicSlider') as HTMLInputElement;
  const sfxSlider = document.getElementById('sfxSlider') as HTMLInputElement;
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
    const t = e.target as Node;
    if (t === mixer || mixer.contains(t) || t === mixerBtn || mixerBtn.contains(t)) return;
    mixer.setAttribute('hidden', '');
    mixerBtn.setAttribute('aria-expanded', 'false');
  });

  musicSlider.addEventListener('input', () => { unlock(); setMusicVol(Number(musicSlider.value) / 100); });
  sfxSlider.addEventListener('input', () => { unlock(); setSfxVol(Number(sfxSlider.value) / 100); sfx.tap(); });
}
