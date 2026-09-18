import { px, blob, ring, TARGET, setTarget } from '../core/paint.js';
import { DPR } from '../core/env.js';
import { C, CREAM } from '../core/palette.js';
import { drawYuzu } from '../sprites/props.js';
import { CAPY_RUN, RUN_FRAME_W, RUN_FRAME_H } from '../sprites/capy.js';

/* ================= menu icons, drawn with the same pixel painter ================= */
export const ICON_DRAW = {
  match(){                                   // a face-down card behind a face-up one
    blob(1, 8, 14, 21, C.out, 3);
    blob(3, 10, 10, 17, '#17555c', 3);
    px(5, 13, 6, 1, '#2f7f88'); px(5, 17, 6, 1, '#2f7f88'); px(5, 21, 4, 1, '#2f7f88');
    blob(13, 3, 18, 25, C.out, 4);
    blob(15, 5, 14, 21, CREAM, 4);
    drawYuzu(22, 16, 5);
    px(21, 9, 2, 2, '#6b4a33');
    px(23, 8, 3, 2, C.leaf);
  },
  bubble(){                                  // a cluster, biggest first
    ring(11, 12, 9, '#cdeff1');
    px(8, 7, 3, 1, '#ffffff'); px(7, 8, 2, 1, '#ffffff'); px(6, 9, 2, 1, '#ffffff');
    ring(23, 20, 7, '#cdeff1');
    px(21, 16, 2, 1, '#ffffff'); px(20, 17, 2, 1, '#ffffff');
    ring(9, 26, 4, '#cdeff1');
  },
  orange(){                                  // one big yuzu, stem and leaf
    drawYuzu(16, 20, 11);
    px(15, 7, 2, 4, '#6b4a33');
    blob(17, 4, 10, 6, C.leaf, 2);
    px(19, 6, 5, 1, '#7fc274');
  },
  wordle(){                                  // a guess grid resolving to green
    const tile = (x, y, c) => { blob(x, y, 9, 11, C.out, 2); blob(x + 1, y + 1, 7, 9, c, 2); };
    tile(1, 4, '#2a3a46'); tile(11, 4, '#2a3a46'); tile(21, 4, '#d9902f');
    tile(1, 17, '#4f8a49'); tile(11, 17, '#4f8a49'); tile(21, 17, '#4f8a49');
  },
  stack(){                                   // two planks with a capybara riding the top
    blob(2, 26, 28, 5, C.out, 2); blob(3, 27, 26, 3, '#8a6242', 2);
    blob(6, 21, 20, 5, C.out, 2); blob(7, 22, 18, 3, '#6b4a33', 2);
    if (CAPY_RUN.complete && CAPY_RUN.naturalWidth)
      TARGET.drawImage(CAPY_RUN, 0, 0, RUN_FRAME_W, RUN_FRAME_H, 3, 0, RUN_FRAME_W, RUN_FRAME_H);
  },
  run(){                                     // Rainloaf's sprite, centred, unscaled
    if (!CAPY_RUN.complete || !CAPY_RUN.naturalWidth) return;
    TARGET.drawImage(CAPY_RUN, 2 * RUN_FRAME_W, 0, RUN_FRAME_W, RUN_FRAME_H,
                     Math.round((32 - RUN_FRAME_W) / 2), Math.round((32 - RUN_FRAME_H) / 2),
                     RUN_FRAME_W, RUN_FRAME_H);
  },
};

/* Every ICON_DRAW/CARD_DRAW fn assumes a fixed 0..32 logical grid. These
   canvases are painted once (not per frame like the scene/arena), so rather
   than a buffer+blit, backing store is DPR-scaled to the canvas's own CSS
   size and the draw commands are scaled to match -- same fix, cheaper for
   a one-shot paint. Falls back to the native attribute if it isn't laid out
   yet (0x0 from getBoundingClientRect, e.g. painted before its pane opens). */
export function paintOn(cv, fn){
  if (!cv || !fn) return;
  const rect = cv.getBoundingClientRect();
  const cssW = rect.width  || cv.width  || 32;
  const cssH = rect.height || cv.height || 32;
  const scale = (cssW * DPR) / 32;
  cv.width = Math.max(1, Math.round(cssW * DPR));
  cv.height = Math.max(1, Math.round(cssH * DPR));
  const g = cv.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.scale(scale, scale);
  const prev = TARGET;
  setTarget(g);
  fn();
  setTarget(prev);
}
// the sprite is a data URI: it decodes a tick after boot, so repaint once it lands
CAPY_RUN.addEventListener('load', () => paintIcons());

export function paintIcons(){
  for (const key in ICON_DRAW){
    paintOn(document.querySelector('[data-game="' + key + '"] canvas.ico'), ICON_DRAW[key]);
  }
}

/* ---- memory match card faces, same pixel language as the games ---- */
export const CARD_DRAW = {
  yuzu(){
    drawYuzu(16, 20, 11);
    px(15, 7, 2, 4, '#6b4a33');
    blob(17, 3, 11, 7, '#4f8a49', 2);
    px(20, 6, 5, 1, '#79b86e');
  },
  bubble(){
    ring(14, 18, 11, '#3f8f98');
    px(9, 11, 3, 1, '#8fd3d8'); px(8, 12, 2, 1, '#8fd3d8'); px(7, 13, 2, 1, '#8fd3d8');
    ring(25, 8, 5, '#3f8f98');
    px(23, 5, 2, 1, '#8fd3d8'); px(22, 6, 2, 1, '#8fd3d8');
  },
  moon(){
    blob(3, 5, 22, 22, '#e8c46a', 6);
    TARGET.globalCompositeOperation = 'destination-out';   // safe: the icon canvas starts empty
    blob(12, 1, 22, 22, '#000', 6);
    TARGET.globalCompositeOperation = 'source-over';
    px(21, 11, 2, 2, '#e8c46a');
    px(26, 19, 1, 1, '#e8c46a');
    px(24, 26, 1, 1, '#e8c46a');
  },
  leaf(){
    // per-row spans: a pointed oval tilted tip-up-right, base down-left
    const spans = [[4,20,25],[5,18,26],[6,16,27],[7,14,27],[8,13,27],[9,11,26],[10,10,25],
                   [11,9,24],[12,8,22],[13,7,20],[14,6,18],[15,6,16],[16,6,14],[17,7,12],[18,8,11]];
    for (const [y, a, b] of spans) px(a, y, b - a + 1, 1, '#4f8a49');
    for (let i = 0; i < 13; i++) px(9 + i, 16 - i, 1, 1, '#79b86e');      // midrib
    px(6, 19, 3, 2, '#3b6b38'); px(5, 21, 3, 2, '#3b6b38'); px(4, 23, 3, 5, '#3b6b38');
  },
  onsen(){
    for (let i = 0; i < 3; i++){
      const x = 7 + i * 8;
      px(x,     3,  2, 3, '#5f9aa1'); px(x + 1, 6,  2, 3, '#5f9aa1');
      px(x,     9,  2, 3, '#5f9aa1'); px(x + 1, 12, 2, 3, '#5f9aa1');
    }
    blob(3, 19, 26, 9, '#c96f4a', 4);
    px(7, 21, 18, 2, '#e08a63');
    px(5, 26, 22, 2, '#a4573a');
  },
  paw(){
    const c = '#6b4a33';
    blob(2, 10, 7, 9, c, 2);
    blob(10, 4, 7, 10, c, 2);
    blob(19, 4, 7, 10, c, 2);
    blob(25, 11, 6, 9, c, 2);
    blob(7, 18, 18, 12, c, 5);
  },
};
export function drawCardBack(){
  const base = '#2f7f88', dark = '#0f3a42';
  blob(5, 3, 8, 8, base, 2);
  blob(19, 3, 8, 8, base, 2);
  px(7, 5, 4, 4, dark); px(21, 5, 4, 4, dark);
  blob(3, 7, 26, 21, base, 6);
  px(10, 14, 3, 3, dark); px(19, 14, 3, 3, dark);
  blob(11, 20, 10, 6, dark, 2);
  px(13, 22, 2, 1, base); px(18, 22, 2, 1, base);
}
