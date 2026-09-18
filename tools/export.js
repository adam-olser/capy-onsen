/* Renders every procedurally-drawn sprite to a PNG at its native pixel grid,
   and POSTs them to the local receiver started alongside this page. The
   capybara face isn't here: it's no longer procedural, it's drawn from the
   PNGs in src/sprites/faces/, which are already the source of truth. */
import { setTarget } from '../src/core/paint.js';
import { drawYuzu, drawBubble, pine } from '../src/sprites/props.js';
import { ICON_DRAW, CARD_DRAW, drawCardBack } from '../src/ui/icons.js';
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
