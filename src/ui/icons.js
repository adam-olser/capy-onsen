import { px, blob, ring, TARGET, setTarget } from '../core/paint.js';
import { DPR } from '../core/env.js';
import { C, CREAM } from '../core/palette.js';
import { drawYuzu } from '../sprites/props.js';
import { CAPY_RUN, RUN_FRAME_W, RUN_FRAME_H } from '../sprites/capy.js';

/* ================= menu icons, drawn with the same pixel painter ================= */
/* Corner sound button: a pixel speaker, not an emoji. Two states share one
   painter so on/off never drift out of sync visually. */
export function drawSpeaker(on){
  const body = '#f4e9d8', dark = '#16223a';
  blob(4, 12, 7, 8, body, 2);
  // cone: three widening rows read as a trapezoid at this scale
  px(11, 13, 3, 6, body);
  px(14, 11, 2, 10, body);
  px(16, 9, 2, 14, body);
  if (on){
    px(21, 13, 2, 1, '#f2a03d'); px(21, 18, 2, 1, '#f2a03d');
    px(20, 14, 1, 4, '#f2a03d');
    px(25, 10, 2, 1, '#f2a03d'); px(25, 21, 2, 1, '#f2a03d');
    px(24, 11, 1, 10, '#f2a03d'); px(27, 11, 1, 10, '#f2a03d');
  } else {
    px(21, 11, 2, 2, '#c96f4a'); px(25, 11, 2, 2, '#c96f4a');
    px(22, 13, 2, 2, '#c96f4a'); px(24, 13, 2, 2, '#c96f4a');
    px(21, 17, 2, 2, '#c96f4a'); px(25, 17, 2, 2, '#c96f4a');
    px(22, 19, 2, 2, '#c96f4a'); px(24, 19, 2, 2, '#c96f4a');
  }
}

/* Mixer button: two small equalizer sliders. */
export function drawMixer(){
  const track = '#4a6169', knob = '#f2a03d';
  px(9, 5, 2, 22, track); px(20, 5, 2, 22, track);
  blob(6, 10, 8, 5, knob, 1);
  blob(17, 17, 8, 5, knob, 1);
}

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
    drawYuzu(16, 21, 12);
    px(0, 11, 12, 1, '#c98046'); px(0, 12, 10, 1, '#c98046');               // dimpled rind texture
    px(20, 15, 8, 1, '#c98046'); px(22, 25, 7, 1, '#c98046');
    px(15, 6, 2, 5, '#6b4a33');
    blob(16, 2, 13, 8, '#4f8a49', 2);
    blob(18, 3, 6, 4, '#79b86e', 2);                                        // leaf sheen
  },
  bubble(){
    ring(13, 19, 12, '#3f8f98'); ring(13, 19, 11, '#5fb0b8');
    px(7, 11, 4, 1, '#c8f0f2'); px(6, 12, 2, 1, '#c8f0f2'); px(5, 13, 2, 1, '#c8f0f2');
    ring(26, 8, 5, '#3f8f98'); ring(26, 8, 4, '#5fb0b8');
    px(23, 5, 2, 1, '#c8f0f2'); px(22, 6, 2, 1, '#c8f0f2');
    ring(4, 27, 3, '#3f8f98');
  },
  moon(){
    blob(2, 4, 25, 25, '#e8c46a', 7);
    TARGET.globalCompositeOperation = 'destination-out';   // safe: the icon canvas starts empty
    blob(12, -1, 25, 25, '#000', 7);
    TARGET.globalCompositeOperation = 'source-over';
    // craters, in the visible crescent sliver (lower-left of the circle)
    px(8, 21, 2, 2, '#d1a24a'); px(5, 15, 2, 2, '#d1a24a'); px(10, 25, 1, 1, '#d1a24a');
    px(19, 9, 3, 3, '#e8c46a');
    px(25, 19, 2, 2, '#e8c46a');
    px(22, 27, 2, 2, '#e8c46a');
    px(6, 6, 2, 2, '#fff4de'); px(4, 4, 1, 1, '#fff4de');                   // twinkle beside the crescent
    px(29, 15, 1, 1, '#fff4de');
  },
  leaf(){
    // a pointed oval (tip up-right, base down-left), rasterised as a
    // tapered capsule along its spine so the width tapers smoothly
    // instead of relying on hand-tuned per-row spans
    const p0 = [5, 29], p1 = [28, 3];
    const dx = p1[0] - p0[0], dy = p1[1] - p0[1], len2 = dx * dx + dy * dy;
    const maxW = 7.2;
    for (let y = 0; y < 32; y++){
      for (let x = 0; x < 32; x++){
        const t = Math.max(0, Math.min(1, ((x - p0[0]) * dx + (y - p0[1]) * dy) / len2));
        const lx = p0[0] + t * dx, ly = p0[1] + t * dy;
        const w = maxW * Math.sin(Math.PI * t);
        const d = Math.hypot(x - lx, y - ly);
        if (d <= w) px(x, y, 1, 1, d > w - 1.6 ? '#3b6b38' : '#4f8a49');
      }
    }
    for (let i = 0; i <= 24; i++){                                        // midrib
      const t = i / 24;
      px(Math.round(p0[0] + t * dx), Math.round(p0[1] + t * dy), 1, 1, '#79b86e');
    }
    px(2, 29, 4, 2, '#3b6b38'); px(0, 30, 4, 2, '#3b6b38');                // stem
  },
  onsen(){
    // a wooden-bottomed tub: elliptical pool, a solid wood base/feet under
    // it (not just a thin rim sliver), and steam in a colour that actually
    // shows up against the card's cream back
    const wood = '#5a3a24', woodDark = '#3a2418', water = '#2f7f88', sheen = '#6fd0d8', steam = '#7fb8bf';
    px(5, 26, 22, 4, woodDark);                               // wooden base
    px(3, 29, 5, 2, woodDark); px(24, 29, 5, 2, woodDark);    // feet
    blob(2, 13, 28, 16, wood, 8);                              // tub rim (elliptical)
    blob(4, 15, 24, 11, water, 6);                             // water
    px(7, 17, 16, 1, sheen);                                   // water sheen
    const curls = [8, 16, 24];
    for (let c = 0; c < curls.length; c++){
      for (let i = 0; i < 5; i++){
        const off = Math.round(Math.sin(i * 1.1 + c) * 2.2);
        px(curls[c] + off, 10 - i * 2.2, 2, 2, steam);
      }
    }
  },
  paw(){
    const c = '#6b4a33', hi = '#8a6242';
    // true ellipses (blob() only gives an axis-aligned rounded rect): the
    // classic symmetric paw-print glyph -- four even toes (outer two a
    // touch smaller) over one smooth rounded pad, no notch
    const ellipse = (cx, cy, rx, ry, color) => {
      const x0 = Math.floor(cx - rx), x1 = Math.ceil(cx + rx);
      const y0 = Math.floor(cy - ry), y1 = Math.ceil(cy + ry);
      for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++){
          const nx = (x + .5 - cx) / rx, ny = (y + .5 - cy) / ry;
          if (nx * nx + ny * ny <= 1) px(x, y, 1, 1, color);
        }
    };
    const toe = (cx, cy, rx, ry) => { ellipse(cx, cy, rx, ry, c); ellipse(cx, cy - ry * .15, rx * .6, ry * .62, hi); };
    toe(7, 12, 3.4, 5);   toe(32 - 7, 12, 3.4, 5);               // outer toes
    toe(13, 6.5, 3.9, 5.8); toe(32 - 13, 6.5, 3.9, 5.8);         // inner toes
    ellipse(16, 22.5, 10, 7.5, c);                                // the pad
    ellipse(16, 20.5, 6.5, 5, hi);
  },
  star(){
    // a proper 5-point star, rasterised from its actual polygon so the
    // silhouette is correct instead of hand-drawn rows
    const cx = 16, cy = 16.5, R = 15, r = 5.9;
    const pts = [];
    for (let i = 0; i < 10; i++){
      const ang = -Math.PI / 2 + i * Math.PI / 5;
      const rad = i % 2 === 0 ? R : r;
      pts.push([cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad]);
    }
    const inside = (x, y) => {
      let c = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++){
        const [xi, yi] = pts[i], [xj, yj] = pts[j];
        if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
      }
      return c;
    };
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) if (inside(x + .5, y + .5)) px(x, y, 1, 1, '#e8c46a');
    for (let y = 0; y < 32; y++) for (let x = 0; x < 16; x++) if (inside(x + .5, y + .5)) px(x, y, 1, 1, '#f2d488');
    px(14, 13, 2, 2, '#fff4de');                                            // a small glint, not a block
    px(3, 3, 2, 2, '#e8c46a'); px(27, 4, 2, 2, '#e8c46a'); px(4, 26, 2, 2, '#e8c46a');
  },
  lantern(){
    // a Japanese chōchin: an elongated oval paper body (bulging in the
    // upper-middle, tapering hard into both caps -- a round blob() reads as
    // a ball, not a lantern), bamboo ribbing, a medallion, and lacquered caps
    const paper = '#e8613f', dark = '#2a1810', hi = '#ff8a5c', cream = '#fff4de';
    px(15, 0, 2, 3, dark);                                    // hanging cord
    blob(12, 2, 8, 4, dark, 2);                                // top cap
    const top = 6, bot = 28, maxW = 12;
    const bodyW = y => Math.round(maxW * Math.pow(Math.sin(Math.PI * (y - top) / (bot - top)), .55));
    for (let y = top; y <= bot; y++){
      const w = bodyW(y);
      if (w > 0) px(16 - w, y, w * 2, 1, paper);
    }
    px(9, 9, 2, 15, hi);                                       // sheen down the left side
    for (const ry of [12, 17, 22]){ const w = bodyW(ry); px(16 - w, ry, w * 2, 1, dark); }  // ribbing
    blob(11, 13, 10, 9, cream, 5);                              // centre medallion
    blob(13, 16, 6, 4, paper, 2);                               // medallion mark
    blob(12, 24, 8, 5, dark, 2);                                // bottom cap
    px(15, 29, 2, 3, dark);                                     // tassel stub
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
