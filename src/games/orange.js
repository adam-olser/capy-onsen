import { PW, PH, bg } from '../core/arena.js';
import { px, TARGET } from '../core/paint.js';
import { finish } from '../core/ui.js';
import { sfx } from '../audio/sfx.js';
import { caught } from '../core/hit.js';
import { drawCapy } from '../sprites/capy.js';
import { drawYuzu } from '../sprites/props.js';

/* ================= 3. orange catch ================= */
const STACK_MAX = 5;
const STACK_POS = [[0, 0], [-1, 0], [1, 0], [-.5, -1], [.5, -1]];
export const orange = {
  key: 'orange', title: 'ORANGE CATCH', canvas: true,
  layout(){
    this.cw = Math.min(40, Math.max(16, Math.round(PH * .17)));
    this.u  = Math.max(1, Math.round(this.cw / 22));
    this.cy = PH - this.cw * .72;            // head centre
    this.top = this.cy - 7 * this.u;         // top of the head: the actual catch line
    this.halfW = 10 * this.u;                // head half-width
    this.r = Math.max(3, Math.round(this.cw * .13));
    this.x = Math.max(this.halfW, Math.min(PW - this.halfW, this.x == null ? PW / 2 : this.x));
  },
  start(){
    this.x = null; this.layout();
    this.items = []; this.fx = []; this.n = 0; this.lives = 3; this.spawn = .5; this.sp = 1;
    this.stack = 0;
  },
  update(dt){
    this.sp += dt * .05;
    this.spawn -= dt;
    if (this.spawn <= 0){
      this.spawn = Math.max(.3, 1.05 - this.sp * .09);
      this.items.push({x: this.r + Math.random() * (PW - 2 * this.r), y: -this.r, v: 15 * this.sp});
    }
    for (const o of this.items) o.y += o.v * dt;

    this.items = this.items.filter(o => {
      // swept test against the head top, so nothing tunnels through at speed
      const bottom = o.y + this.r, prev = bottom - o.v * dt;
      if (caught(prev, bottom, this.top, o.x - this.x, this.halfW)){
        this.n++; this.stack++; sfx.match();
        if (this.stack >= STACK_MAX) this.tumble();
        return false;
      }
      if (o.y > PH + 5){
        this.lives--; sfx.miss();
        if (this.lives <= 0) finish('CAUGHT ' + this.n + ' YUZU', this.n, 'orange', false);
        return false;
      }
      return true;
    });

    for (const f of this.fx){ f.vy += 160 * dt; f.x += f.vx * dt; f.y += f.vy * dt; }
    this.fx = this.fx.filter(f => f.y < PH + 8);
  },
  tumble(){
    // a full head-load rolls off into the water
    for (let i = 0; i < STACK_MAX; i++){
      const [dx, dy] = STACK_POS[i];
      this.fx.push({
        x: this.x + dx * this.r * 1.9, y: this.top - this.r + dy * this.r * 1.8,
        vx: (dx || (Math.random() - .5)) * 34 + (Math.random() - .5) * 14, vy: -40 - Math.random() * 20,
      });
    }
    this.stack = 0;
    sfx.pop();
  },
  pointer(x){ this.x = Math.max(this.halfW, Math.min(PW - this.halfW, x)); },
  move(x){ this.pointer(x); },
  draw(){
    bg('#16223a', '#1f6b73');
    for (let i = 0; i < 4; i++){
      const ry = PH - 4 - i * 5;
      TARGET.globalAlpha = .1; px(PW * .05, ry, PW * .9, 1, '#bfeef0'); TARGET.globalAlpha = 1;
    }
    // capybara sits a layer below every orange
    drawCapy(this.x, this.cy, this.cw, false);
    for (let i = 0; i < this.stack; i++){
      const [dx, dy] = STACK_POS[i];
      drawYuzu(this.x + dx * this.r * 1.9, this.top - this.r + dy * this.r * 1.8, this.r);
    }
    for (const f of this.fx) drawYuzu(f.x, f.y, this.r);
    for (const o of this.items) drawYuzu(o.x, o.y, this.r);
  },
  stat(){ return '♥'.repeat(Math.max(0, this.lives)) + ' · ' + this.n + ' · ' + this.stack + '/' + STACK_MAX; },
};
