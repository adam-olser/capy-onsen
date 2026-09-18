import { px, blob, setTarget } from '../core/paint.js';
import { C } from '../core/palette.js';
import { RM, PIXEL, setPixel, T, setT, DPR } from '../core/env.js';
import { drawCapyPortrait, capyPortraitBox } from '../sprites/capy.js';
import { drawYuzu, pine } from '../sprites/props.js';
import { sfx } from '../audio/sfx.js';

/* ================= pixel scene ================= */
const cv = document.getElementById('scene');
const ctx = cv.getContext('2d');
const buf = document.createElement('canvas');
const bx = buf.getContext('2d');

let VW = 120, VH = 220, scale = 1, stars = [], steam = [], yuzu = [], fireflies = [];

function resize(){
  const w = innerWidth, h = innerHeight;
  const p = Math.max(3, Math.round(Math.min(w, h) / 110));   // nominal CSS px per logical unit
  setPixel(p);
  cv.width = w * DPR; cv.height = h * DPR;   // backing store matches physical pixels, full-bleed

  // a fractional buffer->canvas scale is what made this background look
  // "swimmy" on odd/high-res screens -- pick a whole device pixels-per-unit
  // scale instead, and size the buffer to fully cover the canvas at that
  // scale (any excess on the far edge is simply clipped by drawImage below)
  scale = Math.max(1, Math.round(p * DPR));
  VW = Math.max(60, Math.ceil(cv.width / scale));
  VH = Math.max(80, Math.ceil(cv.height / scale));
  buf.width = VW; buf.height = VH;
  ctx.imageSmoothingEnabled = false;
  bx.imageSmoothingEnabled = false;

  const waterY = Math.round(VH * .58);
  stars = Array.from({length: Math.round(VW * .35)}, () => ({
    x: Math.random() * VW, y: Math.random() * waterY * .8, p: Math.random() * 6.283,
  }));
  steam = Array.from({length: 26}, () => ({
    x: VW * .18 + Math.random() * VW * .64,
    y: waterY - Math.random() * VH * .24,
    r: 1 + Math.random() * 1.8, s: .04 + Math.random() * .09, a: .05 + Math.random() * .07,
  }));
  yuzu = [
    {x: VW * .24, p: 0}, {x: VW * .74, p: 2.1}, {x: VW * .86, p: 4.2},
  ];
  fireflies = Array.from({length: 6}, () => ({
    x: Math.random() * VW,
    y: waterY - VH * .02 - Math.random() * VH * .1,   // hug the bank, not the sky
    p: Math.random() * 6.3, s: .4 + Math.random() * .7,
  }));
}
addEventListener('resize', resize, {passive: true});

let t0 = performance.now(), happyUntil = 0;

function frame(now){
  setTarget(bx);
  setT(RM ? 3 : (now - t0) / 1000);
  const waterY = Math.round(VH * .58);

  // sky
  const g = bx.createLinearGradient(0, 0, 0, waterY);
  g.addColorStop(0, C.sky0); g.addColorStop(1, C.sky1);
  bx.fillStyle = g; bx.fillRect(0, 0, VW, waterY);

  // stars
  for (const s of stars){
    const a = .35 + .45 * Math.sin(T * .8 + s.p);
    bx.globalAlpha = a; px(s.x, s.y, 1, 1, '#ffffff'); bx.globalAlpha = 1;
  }
  // moon
  const mx = Math.round(VW * .8), my = Math.round(VH * .11), mr = Math.max(3, Math.round(VH * .03));
  const mg = bx.createRadialGradient(mx, my, mr, mx, my, mr * 5);
  mg.addColorStop(0, 'rgba(245,234,208,.2)'); mg.addColorStop(1, 'rgba(245,234,208,0)');
  bx.fillStyle = mg; bx.beginPath(); bx.arc(mx, my, mr * 5, 0, 6.283); bx.fill();
  blob(mx - mr, my - mr, mr * 2, mr * 2, C.moon, Math.max(1, Math.round(mr * .4)));

  // hills
  const hy = waterY - Math.round(VH * .1);
  for (let x = 0; x < VW; x++){
    const h1 = Math.sin(x / (VW * .28)) * VH * .045 + Math.sin(x / (VW * .09)) * VH * .015;
    px(x, hy - h1, 1, waterY - (hy - h1), C.hill2);
  }
  for (let x = 0; x < VW; x++){
    const h2 = Math.sin(x / (VW * .19) + 2) * VH * .03;
    px(x, hy + VH * .03 - h2, 1, waterY - (hy + VH * .03 - h2), C.hill);
  }

  // pine silhouettes along the ridge
  const ridge = x => hy + VH * .03 - Math.sin(x / (VW * .19) + 2) * VH * .03;
  for (const [pxx, ph] of [[.04, .075], [.15, .05], [.22, .06], [.78, .05], [.86, .075], [.97, .045]]){
    const gx = Math.round(VW * pxx);
    pine(gx, Math.round(ridge(gx)) + 1, VH * ph, '#0a1320');
  }

  // lanterns on the bank
  for (const lx of [VW * .09, VW * .92]){
    const ly = waterY - VH * .07, lw = Math.max(2, Math.round(VH * .016));
    const lg = bx.createRadialGradient(lx, ly, 0, lx, ly, lw * 6);
    lg.addColorStop(0, 'rgba(255,180,92,.28)'); lg.addColorStop(1, 'rgba(255,180,92,0)');
    bx.fillStyle = lg; bx.beginPath(); bx.arc(lx, ly, lw * 6, 0, 6.283); bx.fill();
    px(lx - 1, ly + lw, 2, VH * .07, C.out);
    blob(lx - lw, ly - lw, lw * 2, lw * 2, C.lantern, 1);
    px(lx - lw, ly - lw - 1, lw * 2, 1, C.out);
  }

  // water
  px(0, waterY, VW, VH - waterY, C.water0);
  const gw = bx.createLinearGradient(0, waterY, 0, VH);
  gw.addColorStop(0, 'rgba(42,130,138,.55)'); gw.addColorStop(1, 'rgba(15,58,66,.9)');
  bx.fillStyle = gw; bx.fillRect(0, waterY, VW, VH - waterY);

  // stones rimming the pool
  for (const [rx, rw] of [[.03, .09], [.13, .06], [.88, .07], [.98, .1]]){
    const gx = VW * rx, gw3 = Math.max(5, VW * rw);
    blob(gx - gw3 / 2, waterY - 3, gw3, 7, '#0e1a26', 2);
    px(gx - gw3 / 2 + 1, waterY - 2, Math.max(1, gw3 * .35), 1, '#1e3140');
  }

  // capybara (bobbing)
  const bob = RM ? 0 : Math.sin(T * 1.3) * Math.max(1, VH * .006);
  const cw = Math.min(44, Math.max(18, Math.round(VH * .17)));
  drawCapyPortrait(VW / 2, waterY - cw * .28 + bob, cw);
  // waterline cuts across the chin
  const cut = waterY + Math.round(cw * .04) + bob;
  px(0, cut, VW, VH - cut, C.water1);
  const gw2 = bx.createLinearGradient(0, cut, 0, VH);
  gw2.addColorStop(0, 'rgba(42,130,138,.4)'); gw2.addColorStop(1, 'rgba(15,58,66,.95)');
  bx.fillStyle = gw2; bx.fillRect(0, cut, VW, VH - cut);

  // moon reflection, shivering on the surface
  const step = Math.max(2, Math.round((VH - cut) * .09));
  for (let i = 0; i < 10; i++){
    const ry = cut + 2 + i * step;
    if (ry > VH) break;
    const w = Math.max(1, mr * .9 - Math.abs(Math.sin(T * 1.1 + i * .9)) * mr * .6);
    bx.globalAlpha = Math.max(0, .17 - i * .015);
    px(mx - w, ry, w * 2, 1, '#f5ead0');
    bx.globalAlpha = 1;
  }
  // lantern light on the water
  for (const lx of [VW * .09, VW * .92]){
    for (let i = 0; i < 5; i++){
      const ry = cut + 1 + i * Math.max(2, Math.round(step * .7));
      if (ry > VH) break;
      const w = Math.max(1, 3 - Math.abs(Math.sin(T * 1.4 + i)) * 2);
      bx.globalAlpha = Math.max(0, .2 - i * .035);
      px(lx - w, ry, w * 2, 1, C.lantern);
      bx.globalAlpha = 1;
    }
  }

  // ripples
  for (let i = 0; i < 7; i++){
    const ry = waterY + cw * .2 + i * (VH - waterY) * .12;
    if (ry > VH) break;
    const off = Math.sin(T * .9 + i * 1.3) * VW * .05;
    bx.globalAlpha = .1 - i * .011;
    px(VW * .22 + off, ry, VW * .14, 1, '#bfeef0');
    px(VW * .66 - off, ry + 1, VW * .1, 1, '#bfeef0');
    bx.globalAlpha = 1;
  }

  // floating yuzu
  yuzu.forEach(o => {
    const r = Math.max(3, Math.round(cw * .12));
    const yy = waterY + cw * .22 + Math.sin(T * 1.1 + o.p) * Math.max(1, VH * .005);
    drawYuzu(o.x, yy, r);
  });

  // steam
  if (!RM){
    for (const s of steam){
      s.y -= s.s; s.x += Math.sin(T + s.y * .1) * .04;
      const top = waterY - VH * .28;
      if (s.y < top){ s.y = waterY - Math.random() * 4; s.x = VW * .18 + Math.random() * VW * .64; }
      const fade = Math.max(0, Math.min(1, (s.y - top) / (waterY - top)));
      bx.globalAlpha = s.a * fade;
      px(s.x - s.r, s.y - s.r, s.r * 2, s.r * 2, C.steam);
      bx.globalAlpha = 1;
    }
  } else {
    for (const s of steam){ bx.globalAlpha = s.a * .6; px(s.x - s.r, s.y - s.r, s.r * 2, s.r * 2, C.steam); bx.globalAlpha = 1; }
  }

  // fireflies drifting over the bank
  for (const f of fireflies){
    const a = .2 + .6 * Math.max(0, Math.sin(T * f.s + f.p));
    const fx = f.x + Math.sin(T * .35 + f.p) * VW * .035;
    const fy = f.y + Math.cos(T * .27 + f.p) * VH * .025;
    // a cross-shaped falloff reads as a glow; a 3x3 block just reads as a box
    bx.globalAlpha = a * .22;
    px(fx, fy - 1, 1, 3, '#ffe9a0'); px(fx - 1, fy, 3, 1, '#ffe9a0');
    bx.globalAlpha = a; px(fx, fy, 1, 1, '#ffe27a');
    bx.globalAlpha = 1;
  }

  // happy hearts when poked
  if (now < happyUntil){
    const k = 1 - (happyUntil - now) / 900;
    bx.globalAlpha = 1 - k;
    px(VW / 2 - 6, waterY - cw * .5 - k * VH * .1, 2, 2, '#ff8f6b');
    px(VW / 2 + 5, waterY - cw * .55 - k * VH * .12, 2, 2, '#ffb0a0');
    bx.globalAlpha = 1;
  }

  ctx.clearRect(0, 0, cv.width, cv.height);
  ctx.drawImage(buf, 0, 0, VW, VH, 0, 0, VW * scale, VH * scale);
  requestAnimationFrame(frame);
}

/* poke the capybara */
cv.addEventListener('pointerdown', e => {
  const vx = e.clientX / PIXEL, vy = e.clientY / PIXEL;
  const b = capyPortraitBox;
  if (vx > b.x && vx < b.x + b.w && vy > b.y && vy < b.y + b.h){
    happyUntil = performance.now() + 900;
    sfx.purr();
  }
});

export function startScene(){
  resize();
  requestAnimationFrame(frame);
}

/* exposes the current integer buffer->canvas scale for the visual tests --
   see test/visual/pixel-scale.spec.js */
export function sceneDebug(){
  return { VW, VH, scale, cvW: cv.width, cvH: cv.height };
}
