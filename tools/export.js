/* Renders every procedurally-drawn sprite to a PNG at its native pixel grid,
   and POSTs them to the local receiver started alongside this page. */
import { setTarget } from '../src/core/paint.js';
import { drawCapy } from '../src/sprites/capy.js';
import { drawYuzu, drawBubble, pine } from '../src/sprites/props.js';
import { ICON_DRAW, CARD_DRAW, drawCardBack, paintOn } from '../src/ui/icons.js';
import { CAPY_RUN } from '../src/sprites/capy.js';

const RECEIVER = 'http://127.0.0.1:8787/save?name=';
const out = document.getElementById('out');
const made = [];

function make(name, w, h, fn){
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const g = cv.getContext('2d');
  g.imageSmoothingEnabled = false;
  const prev = setTarget(g);
  setTarget(g);
  fn(g);
  setTarget(prev ?? null);

  const fig = document.createElement('figure');
  const view = document.createElement('canvas');
  const S = Math.max(1, Math.round(160 / Math.max(w, h)));
  view.width = w * S; view.height = h * S;
  const vg = view.getContext('2d');
  vg.imageSmoothingEnabled = false;
  vg.drawImage(cv, 0, 0, w, h, 0, 0, w * S, h * S);
  fig.append(view, Object.assign(document.createElement('figcaption'), { textContent: `${name}  ${w}x${h}` }));
  out.append(fig);

  made.push({ name, cv });
}

/* ---- the capybara face, every pose we can produce ---- */
const FW = 38, FH = 46, fx = FW / 2 + 5, fy = 22;
const face = (name, opts, blink = false) =>
  make('capy-face-' + name, FW + 10, FH, () => drawCapy(fx, fy, FW, blink, { bust: false, ...opts }));

face('idle',  {});
face('happy', { mood: 'happy' });
face('sad',   { mood: 'sad' });
face('alert', { mood: 'alert' });
face('win',   { mood: 'win' });
face('lose',  { mood: 'lose' });
face('blink', {}, true);
face('ear-twitch', { ear: 1 });
face('sniff', { sniff: 1 });
face('look-left',  { look: -1 });
face('look-right', { look:  1 });
for (let i = 1; i <= 3; i++) face('turn-right-' + i, { turn: i / 3 });
for (let i = 1; i <= 3; i++) face('turn-left-' + i,  { turn: -i / 3 });
make('capy-face-bust', FW + 10, 60, () => drawCapy(fx, 22, FW, false, {}));

/* ---- props ---- */
make('yuzu', 16, 18, () => drawYuzu(8, 9, 6));
make('bubble', 20, 20, () => drawBubble(10, 10, 8));
make('pine', 18, 28, () => pine(9, 26, 20, '#0a1320'));

/* ---- menu icons and memory-match cards ---- */
for (const k in ICON_DRAW) make('icon-' + k, 32, 32, () => ICON_DRAW[k]());
for (const k in CARD_DRAW) make('card-' + k, 32, 32, () => CARD_DRAW[k]());
make('card-back', 32, 32, () => drawCardBack());

/* ---- Rainloaf's run strip, passed through untouched ---- */
if (CAPY_RUN.complete && CAPY_RUN.naturalWidth){
  make('run-strip-rainloaf', CAPY_RUN.naturalWidth, CAPY_RUN.naturalHeight,
       g => g.drawImage(CAPY_RUN, 0, 0));
}

/* ---- ship them ---- */
const status = document.getElementById('status');
let done = 0, failed = 0;
for (const { name, cv } of made){
  const blob = await new Promise(r => cv.toBlob(r, 'image/png'));
  try {
    await fetch(RECEIVER + encodeURIComponent(name), { method: 'POST', body: blob });
    done++;
  } catch (e) { failed++; }
  status.textContent = `${done} written, ${failed} failed, of ${made.length}`;
}
status.textContent = `done: ${done} written, ${failed} failed, of ${made.length}`;
