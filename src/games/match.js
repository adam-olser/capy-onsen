import { boardEl, statEl, finish } from '../core/ui.js';
import { sfx } from '../audio/sfx.js';
import { paintOn, CARD_DRAW, drawCardBack } from '../ui/icons.js';

/* ================= 1. memory match (DOM) ================= */
const SYMBOLS = ['yuzu', 'bubble', 'moon', 'leaf', 'onsen', 'paw', 'star', 'lantern'];
const SYMBOL_NAMES = {
  yuzu: 'yuzu', bubble: 'bubble', moon: 'moon',
  leaf: 'leaf', onsen: 'hot spring', paw: 'paw print',
  star: 'star', lantern: 'lantern',
};
export const match = {
  key: 'match', title: 'MEMORY MATCH', canvas: false,
  start(){
    const deck = [...SYMBOLS, ...SYMBOLS]
      .map(v => ({v, k: Math.random()})).sort((a, b) => a.k - b.k).map(o => o.v);
    boardEl.innerHTML = '';
    this.first = null; this.lock = false; this.moves = 0; this.found = 0;
    statEl.textContent = '0 MOVES';
    deck.forEach(sym => {
      const b = document.createElement('button');
      b.className = 'tile';
      b.dataset.v = sym;
      b.setAttribute('aria-label', 'Hidden card');
      b.innerHTML = '<span class="inner">' +
        '<span class="face front"><canvas width="32" height="32"></canvas></span>' +
        '<span class="face back"><canvas width="32" height="32"></canvas></span></span>';
      b.addEventListener('click', () => this.flip(b));
      boardEl.appendChild(b);
      paintOn(b.querySelector('.front canvas'), drawCardBack);
      paintOn(b.querySelector('.back canvas'), CARD_DRAW[sym]);
    });
  },
  flip(b){
    if (this.lock || b.classList.contains('flipped') || b.classList.contains('done')) return;
    b.classList.add('flipped');
    b.setAttribute('aria-label', SYMBOL_NAMES[b.dataset.v]);
    sfx.flip();
    if (!this.first){ this.first = b; return; }
    this.moves++;
    statEl.textContent = this.moves + (this.moves === 1 ? ' MOVE' : ' MOVES');
    if (this.first.dataset.v === b.dataset.v){
      const a = this.first;
      a.classList.add('done'); b.classList.add('done');
      a.disabled = true; b.disabled = true;
      this.first = null; this.found++;
      sfx.match();
      if (this.found === SYMBOLS.length){
        const m = this.moves;
        setTimeout(() => finish('ALL MATCHED IN ' + m + ' MOVES', m, 'match', true), 420);
      }
    } else {
      this.lock = true;
      sfx.miss();
      const a = this.first; this.first = null;
      setTimeout(() => {
        a.classList.remove('flipped'); b.classList.remove('flipped');
        a.setAttribute('aria-label', 'Hidden card'); b.setAttribute('aria-label', 'Hidden card');
        this.lock = false;
      }, 700);
    }
  },
};
