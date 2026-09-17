import { TARGET } from '../core/paint.js';
import { capyHead } from './capy.js';

import idleUrl from './faces/idle.png';
import blinkUrl from './faces/blink.png';
import happyUrl from './faces/happy.png';
import sadUrl from './faces/sad.png';
import lookLeftUrl from './faces/look-left.png';
import lookRightUrl from './faces/look-right.png';
import turnRight1Url from './faces/turn-right-1.png';
import turnRight2Url from './faces/turn-right-2.png';
import turnLeft1Url from './faces/turn-left-1.png';
import turnLeft2Url from './faces/turn-left-2.png';

/* AI-generated capybara expression set (idle/blink/happy/sad, four turn
   steps, two look-aside steps), used by Bath Bubbles, Orange Catch and
   Wordlebara. Provenance: generated in PixelLab from a user-supplied
   reference photo -- see export/sprites-ai/README for that session.

   Every image is calibrated against the SAME (cx, cy, w) contract the old
   procedural drawCapy() used, so callers didn't need to change: `w` is head
   width (cheek to cheek) and `cy - capyHead(w).hh` is where the top of the
   forehead lands -- which is what Orange Catch's catch line is built from, so
   that gameplay-critical geometry stays correct across the swap. */
const CHEEK_REF = 92;      // px, averaged from the front-facing crops' own cheek width

// foreheadTop: measured per image (topmost opaque pixel in its own centre
// strip), in that image's native pixels -- crops aren't identically padded.
const SPEC = {
  idle:          { url: idleUrl,        foreheadTop: 6 },
  blink:         { url: blinkUrl,       foreheadTop: 5 },
  happy:         { url: happyUrl,       foreheadTop: 6 },
  sad:           { url: sadUrl,         foreheadTop: 5 },
  'look-left':   { url: lookLeftUrl,    foreheadTop: 5 },
  'look-right':  { url: lookRightUrl,   foreheadTop: 5 },
  'turn-right-1':{ url: turnRight1Url,  foreheadTop: 5 },
  'turn-right-2':{ url: turnRight2Url,  foreheadTop: 0 },
  'turn-left-1': { url: turnLeft1Url,   foreheadTop: 5 },
  'turn-left-2': { url: turnLeft2Url,   foreheadTop: 0 },
};

const FACES = {};
for (const key in SPEC){
  const img = new Image();
  img.src = SPEC[key].url;
  FACES[key] = img;
}

/* Which frame a given (blink, opts) combination should show. Priority is
   turn > look > blink > mood, since a raster frame can only show one state
   at a time -- unlike the old procedural draw, which composited all of them.
   ear/sniff/doze/alert have no dedicated art and fall through to idle/blink. */
export function pickFace(blink, opts){
  const o = opts || {};
  const turn = o.turn || 0;
  if (Math.abs(turn) > 0.01){
    const dir = turn < 0 ? 'left' : 'right';
    const step = Math.abs(turn) >= 0.55 ? 2 : 1;   // 1/3 -> step 1, 2/3 and 1 both -> step 2
    return `turn-${dir}-${step}`;
  }
  if (o.look) return o.look < 0 ? 'look-left' : 'look-right';
  if (blink) return 'blink';
  if (o.mood === 'happy' || o.mood === 'win') return 'happy';
  if (o.mood === 'sad' || o.mood === 'lose') return 'sad';
  return 'idle';
}

/* Same signature as the old procedural drawCapy(cx, cy, w, blink, opts), so
   every call site swaps in unchanged. `bust` is ignored -- every image
   already includes a hint of neck/shoulder from its own generation. */
export function drawCapyFace(cx, cy, w, blink, opts){
  let key = pickFace(blink, opts);
  let img = FACES[key];
  if (!img.complete || !img.naturalWidth){ key = 'idle'; img = FACES.idle; }
  if (!img.complete || !img.naturalWidth) return;   // still loading: draw nothing this frame

  const scale = w / CHEEK_REF;
  const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
  const { hh } = capyHead(w);
  const dx = cx - dw / 2;
  const dy = (cy - hh) - SPEC[key].foreheadTop * scale;
  TARGET.drawImage(img, dx, dy, dw, dh);
}
