import { PW, PH, bg } from '../core/arena.js';
import { px, TARGET } from '../core/paint.js';
import { finish } from '../core/ui.js';
import { sfx } from '../audio/sfx.js';
import { caught } from '../core/hit.js';
import { capyHead } from '../sprites/capy.js';
import { drawCapyFace } from '../sprites/capyFace.js';
import { drawYuzu } from '../sprites/props.js';

/* A flared-rim, tapered-wall U bowl, stepped one unit at a time -- at u=1
   a smooth curve all but disappears, but two explicit steps read clearly. */
function trayBowl(x, y, w, u, rim, body){
  px(x, y, w, u, rim);                                     // flared outer rim
  px(x + u, y + u, w - 2 * u, u, body);                     // wall, one step in
  px(x + 2 * u, y + 2 * u, w - 4 * u, 2 * u, body);         // cupped base, two steps in
  px(x + 2 * u, y + 3 * u, w - 4 * u, u, '#a4573a');        // shadow along the base
}

/* ================= 3. orange catch ================= */
const STACK_MAX = 5;
const STACK_POS = [[0, 0], [-1, 0], [1, 0], [-.5, -1], [.5, -1]];
export const orange = {
  key: 'orange', title: 'ORANGE CATCH', canvas: true,
  layout(){
    this.cw = Math.min(40, Math.max(16, Math.round(PH * .17)));
    const head = capyHead(this.cw);
    this.u  = head.u;
    this.cy = PH - this.cw * .72;            // head centre
    this.top = this.cy - head.hh;            // top of the head: the actual catch line
    this.halfW = head.hw;                    // head half-width
    this.r = Math.max(3, Math.round(this.cw * .13));
    // catch/spawn happen within this band, not the raw canvas edges -- on a
    // wide desktop window PW dwarfs PH and the tray (sized off PH) shrinks
    // to a sliver of it, so yuzu spawn corner to corner and chasing them
    // means sweeping across the whole monitor. Cap the band by PH like
    // Bath Bubbles' wander band, so it stays a sane, catchable width.
    this.cx0 = PW / 2;
    this.bandHalf = Math.max(this.halfW, Math.min(PW / 2, PH * .8));
    this.x = Math.max(this.cx0 - this.bandHalf + this.halfW, Math.min(this.cx0 + this.bandHalf - this.halfW, this.x == null ? this.cx0 : this.x));
  },
  start(){
    this.x = null; this.layout();
    this.items = []; this.fx = []; this.n = 0; this.lives = 3; this.spawn = .5; this.sp = 1;
    this.stack = 0; this.flash = 0;
  },
  update(dt){
    this.sp += dt * .05;
    this.spawn -= dt;
    if (this.spawn <= 0){
      this.spawn = Math.max(.3, 1.05 - this.sp * .09);
      const lo = this.cx0 - this.bandHalf + this.r, hi = this.cx0 + this.bandHalf - this.r;
      this.items.push({x: lo + Math.random() * Math.max(0, hi - lo), y: -this.r, v: 15 * this.sp});
    }
    for (const o of this.items) o.y += o.v * dt;

    this.items = this.items.filter(o => {
      // swept test against the head top, so nothing tunnels through at speed
      const bottom = o.y + this.r, prev = bottom - o.v * dt;
      if (caught(prev, bottom, this.top, o.x - this.x, this.halfW)){
        this.n++; this.stack++; this.flash = .18; sfx.match();
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
    this.flash = Math.max(0, this.flash - dt);
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
  pointer(x){ this.x = Math.max(this.cx0 - this.bandHalf + this.halfW, Math.min(this.cx0 + this.bandHalf - this.halfW, x)); },
  move(x){ this.pointer(x); },
  draw(){
    bg('#16223a', '#1f6b73');
    for (let i = 0; i < 4; i++){
      const ry = PH - 4 - i * 5;
      TARGET.globalAlpha = .1; px(PW * .05, ry, PW * .9, 1, '#bfeef0'); TARGET.globalAlpha = 1;
    }
    // capybara sits a layer below every orange
    drawCapyFace(this.x, this.cy, this.cw, false);

    // tray: an honest indicator of the actual catch width, not a fudged one --
    // its edges sit exactly at this.x +/- this.halfW, the real hitbox. Its rim
    // sits one unit above this.top, the actual catch line, so a caught orange
    // visibly sinks into the bowl instead of vanishing into the head above it.
    const u = this.u, tw = this.halfW * 2, ty = this.top - u;
    const lit = this.flash > 0;
    trayBowl(this.x - this.halfW, ty, tw, u, '#5a3a24', lit ? '#e8a34f' : '#c96f4a');
    px(this.x - this.halfW, ty, u, u, '#3a2418');            // little end-posts, like a tray's rim
    px(this.x + this.halfW - u, ty, u, u, '#3a2418');
    for (let i = 0; i < this.stack; i++){
      const [dx, dy] = STACK_POS[i];
      drawYuzu(this.x + dx * this.r * 1.9, this.top - this.r + dy * this.r * 1.8, this.r);
    }
    for (const f of this.fx) drawYuzu(f.x, f.y, this.r);
    for (const o of this.items) drawYuzu(o.x, o.y, this.r);
  },
  stat(){ return '♥'.repeat(Math.max(0, this.lives)) + ' · ' + this.n + ' · ' + this.stack + '/' + STACK_MAX; },
};
