import { PW, PH, bg } from '../core/arena.js';
import { px, blob, TARGET } from '../core/paint.js';
import { C } from '../core/palette.js';
import { finish, over } from '../core/ui.js';
import { sfx } from '../audio/sfx.js';
import { hitsObstacle } from '../core/hit.js';
import { drawCapyRun, RUN_FRAME_W, RUN_FRAME_H, RUN_AIR_FRAME } from '../sprites/capy.js';

/* ================= 4. capy run ================= */
export const run = {
  key: 'run', title: 'CAPY RUN', canvas: true,
  layout(){
    // integer scale only, so the artist's pixels stay square
    this.scale = Math.max(1, Math.min(3, Math.round(PH * .15 / RUN_FRAME_H)));
    this.cw = RUN_FRAME_W * this.scale;
    this.u  = this.scale;
    this.cx = Math.round(PW * .24);
    this.gy = Math.round(PH * .78);
    // jump clears ~0.9 body-heights in ~0.78s, whatever the screen size
    this.jv = 4.62 * this.cw;
    this.grav = 11.84 * this.cw;
  },
  start(){
    this.layout();
    this.d = 0; this.v = 2.2 * this.cw; this.y = 0; this.vy = 0; this.obs = []; this.dust = [];
    this.next = 1.6; this.phase = 0; this.wasAir = false;
  },
  jump(){ if (this.y <= 0 && !over()){ this.vy = this.jv; sfx.jump(); } },
  pointer(){ this.jump(); },
  update(dt){
    const u = this.u;
    this.v += dt * this.cw * .09;
    this.d += this.v * dt;
    this.phase += dt * this.v / this.cw * 5;     // ~10fps at base speed, faster as it accelerates
    this.vy -= this.grav * dt;
    this.y = Math.max(0, this.y + this.vy * dt);
    if (this.y === 0) this.vy = 0;

    // kick up dust on landing
    if (this.wasAir && this.y === 0){
      for (let i = 0; i < 5; i++) this.dust.push({
        x: this.cx - 4 * u + Math.random() * 8 * u, y: this.gy,
        vx: -25 - Math.random() * 25, vy: -12 - Math.random() * 16, t: .45,
      });
    }
    this.wasAir = this.y > 0;
    for (const p of this.dust){ p.t -= dt; p.vy += 90 * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
    this.dust = this.dust.filter(p => p.t > 0);

    this.next -= dt;
    if (this.next <= 0){
      this.next = Math.max(.55, 1.25 + Math.random() * .9 - this.v / this.cw * .12);
      // 0.22-0.50 body-heights tall, against a jump that clears 0.9
      this.obs.push({
        x: PW + 8,
        w: this.cw * (.15 + Math.random() * .15),
        h: this.cw * (.22 + Math.random() * .28),
      });
    }
    for (const o of this.obs) o.x -= this.v * dt;
    this.obs = this.obs.filter(o => o.x + o.w > -2);

    // hitbox = the sprite's body footprint, inset from its 27px cell
    const back = this.cx - 9 * this.scale, front = this.cx + 9 * this.scale;
    for (const o of this.obs){
      if (hitsObstacle(o, back, front, this.y)){
        const m = Math.round(this.d / (this.cw * .15));
        finish('RAN ' + m + ' m', m, 'run', false);
        return;
      }
    }
  },
  draw(){
    bg('#101a30', '#2b3f56');
    blob(PW * .78 - 4, PH * .14 - 4, 9, 9, C.moon, 2);
    for (let x = 0; x < PW; x++){
      const h = Math.sin((x + this.d * .25) / (PW * .22)) * PH * .05;
      px(x, this.gy - PH * .1 - h, 1, PH, C.hill);
    }
    px(0, this.gy, PW, PH - this.gy, '#20303f');
    px(0, this.gy, PW, 1, C.out);
    for (let i = 0; i < PW; i += 7){
      px((i - this.d * .9) % PW + (i - this.d * .9 < 0 ? PW : 0), this.gy + 3, 3, 1, '#2c4152');
    }
    for (const o of this.obs){
      blob(o.x, this.gy - o.h, o.w, o.h, C.out, 1);
      blob(o.x + 1, this.gy - o.h + 1, Math.max(1, o.w - 2), Math.max(1, o.h - 1), '#3d6b3a', 1);
    }
    for (const p of this.dust){
      TARGET.globalAlpha = Math.max(0, p.t / .45) * .6;
      px(p.x, p.y, 2, 2, '#6b8299');
      TARGET.globalAlpha = 1;
    }
    drawCapyRun(this.cx, this.gy - this.y, this.scale, this.y > 0 ? RUN_AIR_FRAME : Math.floor(this.phase));
  },
  stat(){ return Math.round(this.d / (this.cw * .15)) + ' m'; },
};
