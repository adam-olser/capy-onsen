import { PIXEL } from './core/env.js';
import { gameEl, winEl, boardEl, playEl, over, paintBest, registerGames } from './core/ui.js';
import { startArena, stopArena, restartArena, arenaResize, current } from './core/arena.js';
import { sfx } from './audio/sfx.js';
import { paintIcons } from './ui/icons.js';
import { startScene } from './scene/onsen.js';
import { match } from './games/match.js';
import { bubble } from './games/bubble.js';
import { orange } from './games/orange.js';
import { run } from './games/run.js';

/* ================= routing ================= */
const GAMES = { match, bubble, orange, run };
let dom = null;                       // the non-canvas game currently open

function openGame(key){
  const g = GAMES[key];
  if (!g) return;
  gameEl.classList.add('on');
  document.getElementById('gtitle').textContent = g.title;
  winEl.classList.remove('on');
  boardEl.style.display = g.canvas ? 'none' : 'grid';
  playEl.style.display  = g.canvas ? 'block' : 'none';
  sfx.tap();
  if (g.canvas){ dom = null; startArena(g); }
  else { dom = g; g.start(); }
}
function closeGame(){
  stopArena(); dom = null;
  gameEl.classList.remove('on'); winEl.classList.remove('on');
  sfx.tap();
}
function restart(){
  winEl.classList.remove('on');
  if (dom) dom.start(); else restartArena();
  sfx.tap();
}
const active = () => dom || current();

document.getElementById('menu').addEventListener('click', e => {
  const b = e.target.closest('[data-game]');
  if (b) openGame(b.dataset.game);
});
document.getElementById('back').addEventListener('click', closeGame);
document.getElementById('again').addEventListener('click', restart);

playEl.addEventListener('pointerdown', e => {
  e.preventDefault();
  if (over()) return;
  const g = current(); if (!g || !g.pointer) return;
  const r = playEl.getBoundingClientRect();
  g.pointer((e.clientX - r.left) / PIXEL, (e.clientY - r.top) / PIXEL);
});
playEl.addEventListener('pointermove', e => {
  const g = current(); if (!g || !g.move) return;
  const r = playEl.getBoundingClientRect();
  g.move((e.clientX - r.left) / PIXEL, (e.clientY - r.top) / PIXEL);
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
startScene();
