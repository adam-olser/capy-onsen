import { ALLOWED, ANSWERS } from '../data/words.js';
import { scoreGuess, mergeKeyState } from '../core/score.js';
import { finish, statEl, over } from '../core/ui.js';
import { sfx } from '../audio/sfx.js';
import { setTarget, TARGET } from '../core/paint.js';
import { drawCapy } from '../sprites/capy.js';
import { drawYuzu } from '../sprites/props.js';

/* ================= 6. wordlebara =================
   Wordle rules. The capybara watches: it perks up on a green, slumps on an
   all-grey row, and gets a yuzu on its head if you finish it. */
const ROWS = 6, COLS = 5;
const KEY_ROWS = ['qwertyuiop', 'asdfghjkl', '⏎ zxcvbnm ⌫'];
const DAY0 = Date.UTC(2026, 0, 1);

export const wordle = {
  key: 'wordle', title: 'WORDLEBARA', pane: 'word',

  start(){
    this.grid = document.getElementById('wgrid');
    this.keysEl = document.getElementById('wkeys');
    this.face = document.getElementById('capyface');
    this.fctx = this.face.getContext('2d');
    this.fctx.imageSmoothingEnabled = false;

    // the daily word first; replays are random so it stays playable
    if (this.seenDaily){
      this.answer = ANSWERS[Math.floor(Math.random() * ANSWERS.length)];
    } else {
      const day = Math.floor((Date.now() - DAY0) / 864e5);
      this.answer = ANSWERS[((day % ANSWERS.length) + ANSWERS.length) % ANSWERS.length];
      this.seenDaily = true;
    }

    this.row = 0; this.cur = ''; this.done = false;
    this.keyState = {}; this.mood = 'idle'; this.moodUntil = 0; this.bounce = 0;
    this.build();
    statEl.textContent = '1/' + ROWS;

    if (!this.onKeyDown){
      this.onKeyDown = e => {
        if (this.done || over()) return;
        if (e.key === 'Enter'){ e.preventDefault(); this.submit(); }
        else if (e.key === 'Backspace'){ e.preventDefault(); this.back(); }
        else if (/^[a-zA-Z]$/.test(e.key)) this.type(e.key.toLowerCase());
      };
    }
    addEventListener('keydown', this.onKeyDown);
    this.raf = requestAnimationFrame(t => this.tick(t));
  },

  stop(){
    cancelAnimationFrame(this.raf);
    if (this.onKeyDown) removeEventListener('keydown', this.onKeyDown);
  },

  build(){
    this.grid.innerHTML = '';
    this.tiles = [];
    for (let r = 0; r < ROWS; r++){
      const row = document.createElement('div');
      row.className = 'wrow';
      const cells = [];
      for (let c = 0; c < COLS; c++){
        const t = document.createElement('div');
        t.className = 'wt';
        t.innerHTML = '<i class="mk"></i>';
        row.appendChild(t); cells.push(t);
      }
      this.grid.appendChild(row); this.tiles.push(cells);
    }

    this.keysEl.innerHTML = '';
    this.keyEls = {};
    for (const spec of KEY_ROWS){
      const row = document.createElement('div');
      row.className = 'krow';
      for (const ch of spec.split(' ').join('')){
        const b = document.createElement('button');
        b.className = 'k' + (ch === '⏎' || ch === '⌫' ? ' wide' : '');
        b.textContent = ch === '⏎' ? 'ENTER' : ch === '⌫' ? 'DEL' : ch.toUpperCase();
        b.addEventListener('click', () => {
          if (this.done || over()) return;
          if (ch === '⏎') this.submit();
          else if (ch === '⌫') this.back();
          else this.type(ch);
        });
        row.appendChild(b);
        if (ch !== '⏎' && ch !== '⌫') this.keyEls[ch] = b;
      }
      this.keysEl.appendChild(row);
    }
  },

  type(ch){
    if (this.cur.length >= COLS) return;
    this.cur += ch;
    const t = this.tiles[this.row][this.cur.length - 1];
    t.firstChild.insertAdjacentText('beforebegin', ch.toUpperCase());
    t.classList.add('filled');
    this.setMood('happy', .18);          // a small ear-perk per keypress
    sfx.tap();
  },

  back(){
    if (!this.cur.length) return;
    const t = this.tiles[this.row][this.cur.length - 1];
    t.childNodes.forEach(n => { if (n.nodeType === 3) n.remove(); });
    t.classList.remove('filled');
    this.cur = this.cur.slice(0, -1);
  },

  shake(){
    const row = this.grid.children[this.row];
    row.classList.remove('shake');
    void row.offsetWidth;                // restart the animation
    row.classList.add('shake');
    sfx.miss();
  },

  submit(){
    if (this.cur.length < COLS) return this.shake();
    if (!ALLOWED.has(this.cur)){ this.setMood('sad', .8); return this.shake(); }

    const guess = this.cur;                 // captured: this.cur is cleared below,
    const marks = scoreGuess(guess, this.answer);   // before these timeouts fire
    const cells = this.tiles[this.row];
    marks.forEach((m, i) => setTimeout(() => {
      cells[i].classList.add(m, 'flip');
      const ch = guess[i];
      this.keyState[ch] = mergeKeyState(this.keyState[ch], m);
      const k = this.keyEls[ch];
      if (k){ k.classList.remove('hit', 'near', 'miss'); k.classList.add(this.keyState[ch]); }
      sfx.flip();
    }, i * 150));

    const won = guess === this.answer;
    const last = this.row === ROWS - 1;
    const guesses = this.row + 1;
    this.row++; this.cur = '';
    statEl.textContent = Math.min(this.row + 1, ROWS) + '/' + ROWS;

    setTimeout(() => {
      if (won){
        this.done = true; this.setMood('win', 99);
        finish('GOT IT IN ' + guesses + (guesses === 1 ? ' GUESS' : ' GUESSES'), guesses, 'wordle', true);
      } else if (last){
        this.done = true; this.setMood('lose', 99);
        finish('IT WAS ' + this.answer.toUpperCase(), 0, 'wordle', true, false);
      } else {
        this.setMood(marks.includes('hit') ? 'happy' : marks.includes('near') ? 'idle' : 'sad', 1.2);
      }
    }, COLS * 150 + 250);
  },

  setMood(m, secs){ this.mood = m; this.moodUntil = performance.now() + secs * 1000; },

  tick(now){
    if (now > this.moodUntil && this.mood !== 'win' && this.mood !== 'lose') this.mood = 'idle';
    const w = 30, cx = 22;
    const bob = this.mood === 'win' ? Math.sin(now / 160) * 1.5 : Math.sin(now / 900) * .6;
    const cy = (this.mood === 'lose' ? 17 : 14) + bob;

    const prev = TARGET;
    setTarget(this.fctx);
    this.fctx.clearRect(0, 0, this.face.width, this.face.height);
    drawCapy(cx, cy, w, now % 4200 < 130, this.mood);
    if (this.mood === 'win') drawYuzu(cx, cy - 11, 3);
    setTarget(prev);

    this.raf = requestAnimationFrame(t => this.tick(t));
  },
};
