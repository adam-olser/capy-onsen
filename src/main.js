import { gameEl, winEl, boardEl, playEl, over, paintBest, registerGames } from './core/ui.js';
import { startArena, stopArena, restartArena, arenaResize, current, PW, PH } from './core/arena.js';
import { sfx } from './audio/sfx.js';
import { setScene, musicDebug } from './audio/music.js';
import { paintIcons, paintOn, drawFullscreen } from './ui/icons.js';
import { initSoundPanel } from './ui/soundPanel.js';
import { startScene, sceneDebug, resize as resizeScene } from './scene/onsen.js';
import { match } from './games/match.js';
import { bubble } from './games/bubble.js';
import { orange } from './games/orange.js';
import { run } from './games/run.js';
import { stack } from './games/stack.js';
import { wordle, FACE_LW, FACE_LH } from './games/wordle.js';

// older Safari fires this non-standard event on pinch, ignoring touch-action
addEventListener('gesturestart', e => e.preventDefault());

/* ================= routing ================= */
const GAMES = { match, bubble, orange, run, stack, wordle };
const wordEl = document.getElementById('word');
const paneOf = g => g.pane || (g.canvas ? 'play' : 'board');
let dom = null;                       // the non-canvas game currently open

function openGame(key){
  const g = GAMES[key];
  if (!g) return;
  gameEl.classList.add('on');
  document.getElementById('gtitle').textContent = g.title;
  winEl.classList.remove('on');
  if (dom && dom.stop) dom.stop();
  const p = paneOf(g);
  boardEl.style.display = p === 'board' ? 'grid'  : 'none';
  playEl.style.display  = p === 'play'  ? 'block' : 'none';
  wordEl.style.display  = p === 'word'  ? 'flex'  : 'none';
  sfx.tap();
  setScene(key);
  if (p === 'play'){ dom = null; startArena(g); }
  else { dom = g; g.start(); }
}
function closeGame(){
  stopArena();
  if (dom && dom.stop) dom.stop();
  dom = null;
  gameEl.classList.remove('on'); winEl.classList.remove('on');
  sfx.tap();
  setScene('menu');
}
function restart(){
  winEl.classList.remove('on');
  if (dom){ if (dom.stop) dom.stop(); dom.start(); } else restartArena();
  sfx.tap();
}
const active = () => dom || current();

document.getElementById('menu').addEventListener('click', e => {
  const b = e.target.closest('[data-game]');
  if (b) openGame(b.dataset.game);
});
document.getElementById('back').addEventListener('click', closeGame);
document.getElementById('again').addEventListener('click', restart);

const creditsBtn = document.getElementById('creditsBtn');
const creditsModal = document.getElementById('creditsModal');
const creditsClose = document.getElementById('creditsClose');
function openCredits(){
  creditsModal.removeAttribute('hidden');
  creditsBtn.setAttribute('aria-expanded', 'true');
}
function closeCredits(){
  creditsModal.setAttribute('hidden', '');
  creditsBtn.setAttribute('aria-expanded', 'false');
}
creditsBtn.addEventListener('click', openCredits);
creditsClose.addEventListener('click', closeCredits);
creditsModal.addEventListener('click', e => { if (e.target === creditsModal) closeCredits(); });

/* Fullscreen toggle. iOS Safari AND iOS Chrome (same WebKit engine
   underneath, so same limitation) never implemented the Fullscreen API for
   anything but a <video> element -- there's no JS call that makes a
   regular browser tab go fullscreen there, full stop. The only thing that
   actually works on iOS is "Add to Home Screen" (see the apple-mobile-
   web-app-capable meta tag), which launches chrome-less from that icon --
   but only from that icon, not from reopening the same Safari/Chrome tab.
   Rather than hiding the button (which just reads as "nothing happened"
   when someone taps where a control used to be) or silently swallowing a
   rejected promise (same problem), always show it and fall back to a
   modal with that actual instruction whenever fullscreen isn't usable. */
const fsBtn = document.getElementById('fullscreenBtn');
const fsHelpModal = document.getElementById('fsHelpModal');
document.getElementById('fsHelpClose').addEventListener('click', () => fsHelpModal.setAttribute('hidden', ''));
fsHelpModal.addEventListener('click', e => { if (e.target === fsHelpModal) fsHelpModal.setAttribute('hidden', ''); });
const fsIcon = fsBtn.querySelector('canvas');
const paintFs = () => {
  const active = !!document.fullscreenElement;
  paintOn(fsIcon, () => drawFullscreen(active));
  fsBtn.setAttribute('aria-pressed', String(active));
};
paintFs();
fsBtn.addEventListener('click', () => {
  if (document.fullscreenElement) return document.exitFullscreen();
  if (!document.fullscreenEnabled || !document.documentElement.requestFullscreen){
    fsHelpModal.removeAttribute('hidden');
    return;
  }
  document.documentElement.requestFullscreen().catch(() => fsHelpModal.removeAttribute('hidden'));
});
document.addEventListener('fullscreenchange', () => {
  paintFs();
  // Entering/exiting fullscreen changes the viewport size by however much
  // room the address bar/toolbar used to take -- the game arena's own
  // ResizeObserver picks that up on its own, but the menu scene canvas only
  // redraws on the window's own 'resize' event, which some browsers fire
  // late (or not at all) for a fullscreen transition specifically, leaving
  // a dead margin the size of that reclaimed toolbar until something else
  // happens to trigger a resize. Force both, a frame after the transition
  // actually lands so innerWidth/innerHeight already reflect it.
  requestAnimationFrame(() => {
    resizeScene();
    if (gameEl.classList.contains('on')) arenaResize();
  });
});

/* Convert a page-space pointer event to arena units using the canvas's own
   current CSS size, not the shared window-derived PIXEL constant -- since
   arenaResize() snaps the canvas to an integer device-pixel box (see
   core/arena.js), its actual rendered size no longer exactly matches
   PIXEL * PW, and dividing by PIXEL instead of the canvas's real size drifts
   the hit-test off from where the pixels are actually drawn on screen. */
function toArena(e){
  const r = playEl.getBoundingClientRect();
  return [(e.clientX - r.left) * (PW / r.width), (e.clientY - r.top) * (PH / r.height)];
}
playEl.addEventListener('pointerdown', e => {
  e.preventDefault();
  if (over()) return;
  const g = current(); if (!g || !g.pointer) return;
  g.pointer(...toArena(e));
});
playEl.addEventListener('pointermove', e => {
  const g = current(); if (!g || !g.move) return;
  g.move(...toArena(e));
});
addEventListener('keydown', e => {
  if (e.key === 'Escape' && !creditsModal.hasAttribute('hidden')) return closeCredits();
  if (e.key === 'Escape' && !fsHelpModal.hasAttribute('hidden')) return fsHelpModal.setAttribute('hidden', '');
  if (!gameEl.classList.contains('on')) return;
  if (e.key === 'Escape') return closeGame();
  const g = active();
  if ((e.key === ' ' || e.key === 'ArrowUp') && g && g.jump){ e.preventDefault(); g.jump(); }
});

registerGames(Object.keys(GAMES));
paintIcons();
paintBest();
initSoundPanel();
startScene();

// read-only hook for the Playwright pixel-scale tests (test/visual/) --
// harmless in production, never written to
window.__sceneDebug = sceneDebug;
window.__faceSize = { FACE_LW, FACE_LH };
window.__currentGame = current;
window.__PW_PH = () => [PW, PH];
window.__musicDebug = musicDebug;
