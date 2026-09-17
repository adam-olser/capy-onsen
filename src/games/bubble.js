import { PW, PH, bg } from '../core/arena.js';
import { px, TARGET } from '../core/paint.js';
import { T } from '../core/env.js';
import { finish } from '../core/ui.js';
import { sfx } from '../audio/sfx.js';
import { drawCapy } from '../sprites/capy.js';
import { drawBubble } from '../sprites/props.js';

/* ================= 2. bath bubbles ================= */
/* the capybara sits in the tub and blows them; pop them before they surface */
export const bubble = {
  key: 'bubble', title: 'BATH BUBBLES', canvas: true,
  layout(){
    this.cw = Math.min(46, Math.max(18, Math.round(PH * .2)));
    this.u  = Math.max(1, Math.round(this.cw / 22));
    this.cx = PW / 2;
    this.cy = PH - this.cw * .62;          // head centre, low in the water
  },
  start(){
    this.layout();
    this.b = []; this.t = 30; this.n = 0; this.spawn = 0; this.happy = 0;
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
    bg('#1f6b73', '#0c3038');
    for (let i = 0; i < 5; i++){
      const ry = PH * .1 + i * PH * .2 + Math.sin(T * .7 + i) * 2;
      TARGET.globalAlpha = .07; px(PW * .1, ry, PW * .8, 1, '#bfeef0'); TARGET.globalAlpha = 1;
    }
    // capybara first, bubbles over the top
    drawCapy(this.cx, this.cy, this.cw, this.happy > 0);
    // waterline sits at the chin and reads as a surface, not a seam across the face
    const wl = Math.round(this.cy + this.cw * .3);
    TARGET.globalAlpha = .38;
    px(0, wl, PW, PH - wl, '#14484f');
    TARGET.globalAlpha = 1;
    TARGET.globalAlpha = .3;
    px(0, wl, PW, 1, '#bfeef0');
    TARGET.globalAlpha = 1;
    for (const o of this.b) drawBubble(o.x, o.y, o.r);
  },
  stat(){ return Math.ceil(this.t) + 's · ' + this.n; },
};
