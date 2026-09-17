/* The pixel painter. Everything draws through px()/blob() into whichever
   context TARGET points at, so the scene, the games and the icon canvases
   all share one drawing language. */
export let TARGET = null;
export function setTarget(t){ TARGET = t; }

export function px(x, y, w, h, c){
  TARGET.fillStyle = c;
  TARGET.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
}

/* octagonal pixel blob: three rects give a convincing rounded corner */
export function blob(x, y, w, h, c, r){
  if (Math.min(w, h) < 6){ px(x, y, w, h, c); return; }
  r = Math.max(1, Math.min(Math.round(r), Math.floor(Math.min(w, h) / 4)));
  const m = Math.max(1, Math.round(r / 2));
  px(x + r, y, w - 2 * r, h, c);
  px(x + m, y + m, w - 2 * m, h - 2 * m, c);
  px(x, y + r, w, h - 2 * r, c);
}

/* Rounded rect with true circular corners, drawn scanline by scanline.
   blob() chamfers into an octagon, which reads as a chopped-off chin at
   larger sizes; this curves properly. */
export function roundRect(x, y, w, h, r, c){
  r = Math.max(0, Math.min(Math.round(r), Math.floor(Math.min(w, h) / 2)));
  for (let i = 0; i < h; i++){
    let inset = 0;
    if (i < r){
      const dy = r - 1 - i;
      inset = r - Math.round(Math.sqrt(Math.max(0, r * r - dy * dy)));
    } else if (i >= h - r){
      const dy = i - (h - r);
      inset = r - Math.round(Math.sqrt(Math.max(0, r * r - dy * dy)));
    }
    px(x + inset, y + i, w - inset * 2, 1, c);
  }
}

export function ring(cx, cy, r, c){
  // midpoint circle: the old fixed-corner version was a rounded square past r=6
  let x = Math.round(r), y = 0, err = 1 - x;
  while (x >= y){
    px(cx + x, cy + y, 1, 1, c); px(cx + y, cy + x, 1, 1, c);
    px(cx - x, cy + y, 1, 1, c); px(cx - y, cy + x, 1, 1, c);
    px(cx - x, cy - y, 1, 1, c); px(cx - y, cy - x, 1, 1, c);
    px(cx + x, cy - y, 1, 1, c); px(cx + y, cy - x, 1, 1, c);
    y++;
    if (err < 0) err += 2 * y + 1; else { x--; err += 2 * (y - x) + 1; }
  }
}
