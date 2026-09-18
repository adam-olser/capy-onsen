import { ALLOWED, ANSWERS } from '../data/words.js';
import { scoreGuess, mergeKeyState } from '../core/score.js';
import { finish, statEl, over } from '../core/ui.js';
import { sfx } from '../audio/sfx.js';
import { setTarget, TARGET } from '../core/paint.js';
import { DPR } from '../core/env.js';
import { drawCapyFace } from '../sprites/capyFace.js';
import { drawYuzu } from '../sprites/props.js';

/* Drawn at a fixed logical size (matches the cx0/w/cy constants in tick()),
   then blitted up to the real, DPR-sized display canvas -- same buffer/blit
   pattern the scene and the game arena use, so this canvas stops being the
   one place still drawing straight into a browser-upscaled bitmap. */
const FACE_LW = 64, FACE_LH = 44;
const faceBuf = document.createElement('canvas');
faceBuf.width = FACE_LW; faceBuf.height = FACE_LH;
const faceBufCtx = faceBuf.getContext('2d');
faceBufCtx.imageSmoothingEnabled = false;

/* ================= 6. wordlebara =================
   Wordle rules. The capybara watches: it perks up on a green, slumps on an
   all-grey row, and gets a yuzu on its head if you finish it. */
const ROWS = 6, COLS = 5;

/* Idle repertoire. One is picked at random between reactions so the capybara
   is never simply static; each is a small parameter change, not a new sprite. */
const IDLES = [
  { name: 'blink', dur: .18 },
  { name: 'look',  dur: 1.2 },
  { name: 'ear',   dur: .55 },
  { name: 'sniff', dur: .8  },
  { name: 'doze',  dur: 1.6 },
  { name: 'turn',  dur: 2.2 },
  { name: 'turn',  dur: 2.2 },      // twice as likely: it is the nicest one
];
const KEY_ROWS = ['qwertyuiop', 'asdfghjkl', '⏎ zxcvbnm ⌫'];
const DAY0 = Date.UTC(2026, 0, 1);

export const wordle = {
  key: 'wordle', title: 'WORDLEBARA', pane: 'word',

  start(){
    this.grid = document.getElementById('wgrid');
    this.keysEl = document.getElementById('wkeys');
    this.face = document.getElementById('capyface');
    this.fctx = this.face.getContext('2d');

    // the daily word first; replays are random so it stays playable
    if (this.seenDaily){
      this.answer = ANSWERS[Math.floor(Math.random() * ANSWERS.length)];
    } else {
      const day = Math.floor((Date.now() - DAY0) / 864e5);
      this.answer = ANSWERS[((day % ANSWERS.length) + ANSWERS.length) % ANSWERS.length];
      this.seenDaily = true;
    }

    this.row = 0; this.cur = ''; this.done = false;
    this.keyState = {}; this.mood = 'idle'; this.moodUntil = 0;
    this.idle = { name: 'none', until: 0, dir: 1 };
    this.nextIdle = performance.now() + 1200;
    this.hop = 0; this.shake = 0;
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

  shakeRow(){
    const row = this.grid.children[this.row];
    row.classList.remove('shake');
    void row.offsetWidth;                // restart the animation
    row.classList.add('shake');
    sfx.miss();
  },

  submit(){
    if (this.cur.length < COLS) return this.shakeRow();
    if (!ALLOWED.has(this.cur)){ this.react('shake'); return this.shakeRow(); }

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
      } else if (marks.includes('hit')){
        this.react('hop');                                   // a green: it perks up
      } else if (marks.includes('near')){
        this.setMood('happy', .9);
      } else {
        this.react('shake');                                 // all grey: it slumps
      }
    }, COLS * 150 + 250);
  },

  setMood(m, secs){ this.mood = m; this.moodUntil = performance.now() + secs * 1000; },
  react(kind){
    const now = performance.now();
    if (kind === 'hop'){ this.hop = now + 520; this.setMood('happy', 1.4); }
    if (kind === 'shake'){ this.shake = now + 420; this.setMood('sad', 1.1); }
  },

  tick(now){
    if (now > this.moodUntil && this.mood !== 'win' && this.mood !== 'lose') this.mood = 'idle';

    // pick a new idle once the last one has run its course
    if (this.mood === 'idle' && now > this.idle.until){
      if (now > this.nextIdle){
        const pick = IDLES[Math.floor(Math.random() * IDLES.length)];
        this.idle = { name: pick.name, dur: pick.dur * 1000,
                      until: now + pick.dur * 1000, dir: Math.random() < .5 ? -1 : 1 };
        this.nextIdle = this.idle.until + 900 + Math.random() * 2600;
      } else {
        this.idle.name = 'none';
      }
    }

    const a = { mood: this.mood };
    const el = (this.idle.until - now) / 1000;
    let blink = now % 4600 < 130;                       // the baseline blink
    if (this.mood === 'idle'){
      if (this.idle.name === 'blink') blink = true;
      if (this.idle.name === 'look')  a.look = this.idle.dir;
      if (this.idle.name === 'ear')   a.ear = 1;
      if (this.idle.name === 'sniff') a.sniff = Math.sin(now / 70) > 0 ? 1 : 0;
      if (this.idle.name === 'doze'){ blink = true; a.sniff = el > .8 ? 0 : 1; }
      if (this.idle.name === 'turn'){                  // swing out and back
        const p = Math.max(0, Math.min(1, 1 - (this.idle.until - now) / this.idle.dur));
        // quantised to the 4 poses in the reference: pixel art reads better stepped
        a.turn = this.idle.dir * Math.round(Math.sin(p * Math.PI) * 3) / 3;
      }
    }
    if (this.mood === 'win') a.ear = Math.sin(now / 130) > 0 ? 1 : 0;

    const w = 48, cx0 = 32;          // u=2, so every feature is 2px and reads cleanly
    const hop   = now < this.hop   ? -Math.abs(Math.sin((this.hop - now) / 90)) * 3 : 0;
    const shake = now < this.shake ?  Math.sin((this.shake - now) / 28) * 2 : 0;
    const bob = this.mood === 'win' ? Math.sin(now / 160) * 1.5 : Math.sin(now / 900) * .6;
    const cy = (this.mood === 'lose' ? 26 : 22) + bob + hop;

    const prev = TARGET;
    setTarget(faceBufCtx);
    faceBufCtx.clearRect(0, 0, FACE_LW, FACE_LH);
    drawCapyFace(cx0 + shake, cy, w, blink, a);
    if (this.mood === 'win') drawYuzu(cx0 + shake, cy - 17, 4);
    setTarget(prev);

    // the display canvas is CSS-sized (clamp(), ties to viewport width), so
    // it can change while the game is open -- resize it to match physical
    // pixels whenever it does, and only then (the reassignment clears the
    // canvas and resets imageSmoothingEnabled, so both stay behind the guard)
    const rect = this.face.getBoundingClientRect();
    const needW = Math.max(1, Math.round(rect.width * DPR));
    const needH = Math.max(1, Math.round(rect.height * DPR));
    if (this.face.width !== needW || this.face.height !== needH){
      this.face.width = needW; this.face.height = needH;
      this.fctx.imageSmoothingEnabled = false;
    }
    this.fctx.clearRect(0, 0, this.face.width, this.face.height);
    this.fctx.drawImage(faceBuf, 0, 0, FACE_LW, FACE_LH, 0, 0, this.face.width, this.face.height);

    this.raf = requestAnimationFrame(t => this.tick(t));
  },
};
