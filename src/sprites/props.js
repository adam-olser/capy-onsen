import { px, blob, ring } from '../core/paint.js';
import { C } from '../core/palette.js';

export function pine(cx, baseY, h, c){
  const steps = Math.max(3, Math.round(h));
  for (let i = 0; i < steps; i++){
    const w = Math.round(i * .55);
    px(cx - w, baseY - steps + i, w * 2 + 1, 1, c);
  }
  px(cx, baseY - 1, 1, Math.max(1, Math.round(h * .2)), c);
}

/* a pixel ring: the background shows through, which is what reads as "bubble" */

export function drawBubble(x, y, r){
  blob(x - r + 1, y - r + 1, r * 2 - 2, r * 2 - 2, 'rgba(191,238,240,.08)', Math.max(1, r * .5));
  ring(x, y, r, 'rgba(214,246,248,.62)');
  px(x - r + 2, y - r + 2, Math.max(1, Math.round(r * .4)), 1, 'rgba(255,255,255,.9)');
  px(x - r + 2, y - r + 3, 1, Math.max(1, Math.round(r * .3)), 'rgba(255,255,255,.7)');
}

export function drawYuzu(x, y, r){
  blob(x - r, y - r, r * 2, r * 2, C.yuzu, Math.max(1, Math.round(r * .45)));
  px(x - r + 1, y - r + 1, Math.max(1, r - 1), 1, C.yuzuHi);
  px(x, y - r - 1, 1, 1, C.leaf);
}
