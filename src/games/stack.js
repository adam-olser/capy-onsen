import { PW, PH, bg, glow } from '../core/arena.js';
import { px, blob, roundRect, TARGET } from '../core/paint.js';
import { C } from '../core/palette.js';
import { finish, over } from '../core/ui.js';
import { T } from '../core/env.js';
import { sfx } from '../audio/sfx.js';
import { drawCapyRun, RUN_FRAME_W, RUN_FRAME_H } from '../sprites/capy.js';
import { pine } from '../sprites/props.js';

/* ================= 5. capy stack =================
   Onsen deck planks. Tap to drop the sliding one; whatever overhangs the
   plank below is sliced off and falls, so the tower narrows as you climb.
   A perfect drop costs nothing and pays a little width back. */
const PERFECT_TOL = 1.2;        // virtual px

export const stack = {
  key: 'stack', title: 'CAPY STACK', canvas: true,
  layout(){
    this.lh    = Math.max(5, Math.round(PH * .045));       // plank thickness
    this.baseY = Math.round(PH * .94);
    // width as a flat fraction of PW alone made towers balloon on a wide
    // desktop window (PW large, PH comparatively short) while looking
    // right on mobile portrait (PW already the smaller axis there) --
    // basing it on the smaller of PW/PH keeps the tower's proportions
    // (width vs. plank thickness, which comes from PH) consistent
    // regardless of aspect ratio.
    this.baseW = Math.round(Math.min(PW, PH) * .42);
    this.scale = Math.max(1, Math.min(3, Math.round(this.lh * 2.2 / RUN_FRAME_H)));
    this.visible = Math.max(4, Math.floor(PH * .62 / this.lh));
  },
  start(){
    this.layout();
    const w = this.baseW;
    this.stack = [{ x: Math.round((PW - w) / 2), w }];
    this.debris = [];
    this.n = 0;
    this.cam = 0;
    this.flash = 0;
    this.stars = Array.from({length: 28}, () => ({
      x: Math.random() * PW, y: Math.random() * PH * .55, p: Math.random() * 6.283,
    }));
    this.spawn(1);
  },
  spawn(dir){
    const top = this.stack[this.stack.length - 1];
    // px/s, ramps with height -- scaled by PW/125 (125 being a typical
    // mobile PW, where this was originally tuned) so the plank takes about
    // the same time to sweep the canvas on any screen. Left as a flat
    // constant, a wide desktop window (much bigger PW, same px/s) made
    // every pass crawl, since the plank had much further to travel at the
    // same speed.
    const sp = (26 + this.n * 1.6) * (PW / 125);
    this.moving = {
      w: top.w,
      x: dir > 0 ? -top.w * .1 : PW - top.w * .9,
      dir, sp: Math.min(sp, PW * .95),
    };
  },
  update(dt){
    const m = this.moving;
    m.x += m.dir * m.sp * dt;
    if (m.x < 0){ m.x = 0; m.dir = 1; }
    if (m.x + m.w > PW){ m.x = PW - m.w; m.dir = -1; }

    // camera eases up so the working row stays put on screen
    const want = Math.max(0, (this.stack.length - this.visible) * this.lh);
    this.cam += (want - this.cam) * Math.min(1, dt * 6);

    this.flash = Math.max(0, this.flash - dt);
    for (const d of this.debris){ d.vy += 220 * dt; d.x += d.vx * dt; d.y += d.vy * dt; }
    this.debris = this.debris.filter(d => d.y < PH + 20);
  },
  drop(){
    if (over()) return;
    const top = this.stack[this.stack.length - 1];
    const m = this.moving;
    const left = Math.max(m.x, top.x), right = Math.min(m.x + m.w, top.x + top.w);
    const overlap = right - left;

    if (overlap <= 0){                                     // missed the tower entirely
      this.debris.push({ x: m.x, w: m.w, y: this.rowY(this.stack.length), vx: m.dir * 20, vy: -30 });
      sfx.miss();
      finish('STACKED ' + this.n, this.n, 'stack', false);
      return;
    }

    const perfect = Math.abs(m.x - top.x) <= PERFECT_TOL;
    const y = this.rowY(this.stack.length);
    if (perfect){
      // snap it flush and pay a little width back, capped at the base plank
      const w = Math.min(this.baseW, top.w + 1.5);
      this.stack.push({ x: Math.round(top.x + (top.w - w) / 2), w });
      this.flash = .5;
      sfx.match();
    } else {
      if (m.x < left) this.debris.push({ x: m.x, w: left - m.x, y, vx: -18, vy: -20 });
      if (m.x + m.w > right) this.debris.push({ x: right, w: m.x + m.w - right, y, vx: 18, vy: -20 });
      this.stack.push({ x: left, w: overlap });
      sfx.tap();
    }
    this.n++;
    this.spawn(-m.dir);
  },
  pointer(){ this.drop(); },
  jump(){ this.drop(); },

  rowY(i){ return this.baseY - (i + 1) * this.lh + this.cam; },

  plank(x, y, w, i){
    if (y < -this.lh || y > PH) return;
    const tone = ['#c96f4a', '#b6603f', '#a4573a'][i % 3];
    roundRect(x, y, w, this.lh, 2, '#5a3a24');
    roundRect(x + 1, y + 1, Math.max(1, w - 2), Math.max(1, this.lh - 2), 2, tone);
    if (w > 6) px(x + 2, y + 1, Math.max(1, w - 4), 1, '#e8a34f');           // highlight
    if (w > 10 && this.lh > 4) px(x + 3, y + this.lh - 2, w - 6, 1, '#00000022');
    if (w > 14 && this.lh > 5){                                             // wood grain
      const gy = y + Math.floor(this.lh * .55);
      px(x + 3, gy, Math.max(1, Math.round(w * .3)), 1, 'rgba(0,0,0,.15)');
      px(x + w * .55, gy, Math.max(1, Math.round(w * .25)), 1, 'rgba(0,0,0,.15)');
    }
  },

  draw(){
    bg('#101a30', '#1f6b73');

    // stars, twinkling the same way the menu scene's do
    for (const s of this.stars){
      TARGET.globalAlpha = .35 + .45 * Math.sin(T * .8 + s.p);
      px(s.x, s.y, 1, 1, '#ffffff');
      TARGET.globalAlpha = 1;
    }

    // moon and a treeline for depth
    blob(PW * .8 - 4, PH * .12 - 4, 9, 9, C.moon, 2);
    const horizon = PH * .58;
    for (const [fx, fh] of [[.06, .06], [.16, .045], [.86, .05], [.95, .065]])
      pine(Math.round(PW * fx), Math.round(horizon), PH * fh, '#0a1320');

    // a warm glow low in frame -- the deck rises out of the onsen itself
    glow(PW / 2, PH * 1.08, PW * .6, 'rgba(233,163,79,.12)');

    for (let i = 0; i < this.stack.length; i++){
      const s = this.stack[i];
      this.plank(s.x, this.rowY(i), s.w, i);
    }
    for (const d of this.debris){
      TARGET.globalAlpha = .85;
      this.plank(d.x, d.y, d.w, 0);
      TARGET.globalAlpha = 1;
    }

    // the sliding plank, with the capybara riding it
    const m = this.moving, my = this.rowY(this.stack.length);
    this.plank(m.x, my, m.w, this.stack.length);
    drawCapyRun(m.x + m.w / 2, my + 1 + Math.sin(T * 3) * .5, this.scale, 0);

    if (this.flash > 0){
      TARGET.globalAlpha = Math.min(1, this.flash * 2);
      const cx = Math.round(PW / 2);
      for (let i = 0; i < 5; i++) px(cx - 10 + i * 5, my - 6, 2, 2, C.yuzu);
      TARGET.globalAlpha = 1;
    }
  },
  stat(){ return this.n + ' HIGH'; },
};
