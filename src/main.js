import { gameEl, winEl, boardEl, playEl, over, paintBest, registerGames } from './core/ui.js';
import { startArena, stopArena, restartArena, arenaResize, current, PW, PH } from './core/arena.js';
import { sfx } from './audio/sfx.js';
import { paintIcons } from './ui/icons.js';
import { initSoundPanel } from './ui/soundPanel.js';
import { startScene, sceneDebug } from './scene/onsen.js';
import { match } from './games/match.js';
import { bubble } from './games/bubble.js';
import { orange } from './games/orange.js';
import { run } from './games/run.js';
import { stack } from './games/stack.js';
import { wordle, FACE_LW, FACE_LH } from './games/wordle.js';

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
  if (p === 'play'){ dom = null; startArena(g); }
  else { dom = g; g.start(); }
}
function closeGame(){
  stopArena();
  if (dom && dom.stop) dom.stop();
  dom = null;
  gameEl.classList.remove('on'); winEl.classList.remove('on');
  sfx.tap();
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
