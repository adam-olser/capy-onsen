import { BEST } from './store.js';
import { sfx } from '../audio/sfx.js';

/* ================= shared game plumbing ================= */
export const statEl  = document.getElementById('stat');
export const winEl   = document.getElementById('win');
export const gameEl  = document.getElementById('game');
export const boardEl = document.getElementById('board');
export const playEl  = document.getElementById('play');

let GAME_KEYS = [];
export function registerGames(keys){ GAME_KEYS = keys; }

export function paintBest(){
  for (const key of GAME_KEYS){
    const el = document.getElementById('best-' + key);
    const b = BEST.get(key);
    if (el) el.textContent = b ? 'BEST ' + b : '';
  }
}
export function finish(line, value, key, lowerBetter, record = true){
  const prev = BEST.get(key);
  const isBest = record && (!prev || (lowerBetter ? value < prev : value > prev));
  if (isBest) BEST.set(key, value);
  paintBest();
  document.getElementById('wintext').textContent = line;
  document.getElementById('winsub').textContent =
    isBest ? '★ NEW BEST ★' : (prev ? 'BEST ' + prev : '');
  winEl.classList.add('on');
  sfx.win();
}
export const over = () => winEl.classList.contains('on');
