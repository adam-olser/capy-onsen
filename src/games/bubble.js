import { PW, PH, bg, vgrad, glow } from '../core/arena.js';
import { px, blob, TARGET } from '../core/paint.js';
import { C } from '../core/palette.js';
import { T } from '../core/env.js';
import { finish } from '../core/ui.js';
import { sfx } from '../audio/sfx.js';
import { drawCapyFace } from '../sprites/capyFace.js';
import { drawBubble, drawYuzu } from '../sprites/props.js';

/* ================= 2. bath bubbles ================= */
/* the capybara sits in the tub and blows them; pop them before they surface */
export const bubble = {
  key: 'bubble', title: 'BATH BUBBLES', canvas: true,
  layout(){
    this.cw = Math.min(52, Math.max(18, Math.round(PH * .24)));
    this.u  = Math.max(1, Math.round(this.cw / 22));
    this.cx = PW / 2;
    this.wl = Math.round(PH * .62);        // the bath fills the lower third
    this.cy = this.wl - this.cw * .3;      // chin sits on the surface
    this.spoutX = Math.round(PW * .2);
    this.spoutY = Math.round(this.wl - PH * .3);
  },
  start(){
    this.layout();
    this.b = []; this.t = 30; this.n = 0; this.spawn = 0; this.happy = 0;
    this.steam = Array.from({length: 16}, () => ({
      x: PW * .1 + Math.random() * PW * .8,
      y: this.wl - Math.random() * PH * .3,
      r: 1 + Math.random() * 2, s: .05 + Math.random() * .1, a: .05 + Math.random() * .08,
    }));
    this.floats = [{x: PW * .18, p: 0}, {x: PW * .84, p: 2.4}];
    this.splash = 0;
  },
  update(dt){
    this.t -= dt;
    this.happy = Math.max(0, this.happy - dt);
    if (this.t <= 0){ this.t = 0; finish('POPPED ' + this.n + ' BUBBLES', this.n, 'bubble', false); return; }
    this.spawn -= dt;
    if (this.spawn <= 0){
      this.spawn = Math.max(.16, .62 - (30 - this.t) * .015);
      const r = 4 + Math.random() * 4;
      // surface beside the snout, at the waterline, then fan out as they rise
      const side = Math.random() < .5 ? -1 : 1;
      this.b.push({
        x: Math.max(r, Math.min(PW - r, this.cx + side * (7 + Math.random() * 5) * this.u)),
        y: this.cy + this.cw * .3,
        r, vx: (Math.random() - .5) * 26,
        v: 9 + Math.random() * 13 + (30 - this.t) * .45,
        p: Math.random() * 6.3,
      });
    }
    for (const o of this.b){
      o.y -= o.v * dt;
      o.x += o.vx * dt + Math.sin(T * 2 + o.p) * .2;
      if (o.x < o.r){ o.x = o.r; o.vx = -o.vx; }
      if (o.x > PW - o.r){ o.x = PW - o.r; o.vx = -o.vx; }
    }
    this.b = this.b.filter(o => o.y + o.r > 0);

    const top = this.wl - PH * .34;
    for (const s of this.steam){
      s.y -= s.s; s.x += Math.sin(T * .8 + s.y * .1) * .05;
      if (s.y < top){ s.y = this.wl - Math.random() * 3; s.x = PW * .1 + Math.random() * PW * .8; }
    }
    this.splash = (this.splash + dt * 6) % 6.283;
  },
  pointer(x, y){
    for (let i = this.b.length - 1; i >= 0; i--){
      const o = this.b[i];
      if (Math.hypot(o.x - x, o.y - y) < o.r + 3){
        this.b.splice(i, 1); this.n++; this.happy = .5; sfx.pop(); return;
      }
    }
    sfx.miss();
  },
  draw(){
    const wl = this.wl;

    /* --- bath house wall --- */
    bg('#1b2942', '#27414c');
    for (let y = 3; y < wl - 6; y += 7){               // cedar panelling
      TARGET.globalAlpha = .22; px(0, y, PW, 1, '#141d2c'); TARGET.globalAlpha = 1;
    }

    /* --- lanterns on the wall --- */
    for (const lx of [PW * .78, PW * .93]){
      const ly = wl - PH * .36, lw = Math.max(2, Math.round(PH * .022));
      glow(lx, ly, lw * 6, 'rgba(255,180,92,.3)');
      px(lx - 1, ly - lw * 3, 2, lw * 2, C.out);       // cord
      blob(lx - lw, ly - lw, lw * 2, lw * 2, C.lantern, 1);
      px(lx - lw, ly - lw - 1, lw * 2, 1, C.out);
    }

    /* --- bamboo spout trickling into the bath --- */
    const sx = this.spoutX, sy = this.spoutY;
    px(0, sy, sx, 3, '#6f8f4a');
    px(0, sy + 3, sx, 1, '#415b2c');
    px(sx - 2, sy, 2, 4, '#55743a');
    TARGET.globalAlpha = .75;
    px(sx - 1, sy + 4, 2, wl - sy - 4, '#dff6f8');
    TARGET.globalAlpha = .35;
    px(sx - 2, sy + 6, 1, wl - sy - 6, '#dff6f8');     // a little spread
    TARGET.globalAlpha = 1;
    glow(sx, wl, Math.max(4, PW * .05), 'rgba(207,239,241,.22)');
    for (let i = 0; i < 4; i++){                       // splash rings where it lands
      const rr = 2 + i * 3 + Math.sin(this.splash + i) * 1.5;
      TARGET.globalAlpha = Math.max(0, .4 - i * .09);
      px(sx - rr, wl + i * 2, rr * 2, 1, '#dff6f8');
      TARGET.globalAlpha = 1;
    }

    /* --- stone rim and water --- */
    blob(-4, wl - 4, PW + 8, 7, '#33454b', 2);
    px(0, wl - 3, PW, 1, '#4a6169');
    px(0, wl, PW, PH - wl, '#14484f');
    vgrad(wl, PH, 'rgba(42,130,138,.5)', 'rgba(10,40,48,.95)');

    /* the capybara first, so the water tint sits over its shoulders */
    drawCapyFace(this.cx, this.cy, this.cw, this.happy > 0);
    TARGET.globalAlpha = .38;
    px(0, wl, PW, PH - wl, '#14484f');
    TARGET.globalAlpha = 1;
    TARGET.globalAlpha = .35; px(0, wl, PW, 1, '#bfeef0'); TARGET.globalAlpha = 1;

    for (let i = 0; i < 7; i++){                       // ripples across the surface
      const ry = wl + 4 + i * Math.max(2, (PH - wl) * .13);
      if (ry > PH) break;
      const off = Math.sin(T * .9 + i * 1.2) * PW * .06;
      TARGET.globalAlpha = Math.max(0, .16 - i * .018);
      px(PW * .16 + off, ry, PW * .22, 1, '#bfeef0');
      px(PW * .6 - off, ry + 1, PW * .18, 1, '#bfeef0');
      TARGET.globalAlpha = 1;
    }

    for (const o of this.floats){                      // yuzu bobbing in the bath
      const r = Math.max(3, Math.round(this.cw * .13));
      drawYuzu(o.x, wl + r * .4 + Math.sin(T * 1.1 + o.p) * 1.2, r);
    }

    for (const s of this.steam){                       // steam above the surface
      const fade = Math.max(0, Math.min(1, (s.y - (wl - PH * .34)) / (PH * .34)));
      TARGET.globalAlpha = s.a * fade;
      px(s.x - s.r, s.y - s.r, s.r * 2, s.r * 2, C.steam);
      TARGET.globalAlpha = 1;
    }

    for (const o of this.b) drawBubble(o.x, o.y, o.r);
  },
  stat(){ return Math.ceil(this.t) + ' s · ' + this.n; },
};
