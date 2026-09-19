import { PW, PH, bg } from '../core/arena.js';
import { px, blob, roundRect, TARGET } from '../core/paint.js';
import { C } from '../core/palette.js';
import { finish, over } from '../core/ui.js';
import { sfx } from '../audio/sfx.js';
import { hitsObstacle } from '../core/hit.js';
import { drawCapyRun, RUN_FRAME_W, RUN_FRAME_H, RUN_AIR_FRAME } from '../sprites/capy.js';
import { hitBox } from '../sprites/run-footprint.js';
import { pine } from '../sprites/props.js';

/* ================= 4. capy run ================= */
export const run = {
  key: 'run', title: 'CAPY RUN', canvas: true,
  layout(){
    // integer scale only, so the artist's pixels stay square. Obstacles
    // spawn at PW and close in at a speed tied to cw, so the runway ahead
    // (in body-widths) is roughly PW / cw -- if cw only followed PH, a
    // narrow mobile-portrait screen (small PW, ordinary PH) would keep the
    // sprite full-size while starving the runway. Cap the scale by width
    // too, so a narrow screen zooms the sprite out instead, buying back
    // runway rather than cropping the runner off the left edge for it.
    const scaleH = Math.round(PH * .15 / RUN_FRAME_H);
    const scaleW = Math.max(1, Math.floor(PW * .12 / RUN_FRAME_W));
    this.scale = Math.max(1, Math.min(3, scaleH, scaleW));
    this.cw = RUN_FRAME_W * this.scale;
    this.u  = this.scale;
    // the sprite is drawn centred on cx (drawCapyRun), so cx must stay at
    // least half a body-width from the left edge or the body gets clipped;
    // within that floor, pull it left (from its usual 24%) for more runway.
    const minCx = Math.ceil(this.cw / 2) + 2;
    this.cx = Math.round(Math.min(PW * .24, Math.max(minCx, PW - this.cw * 7)));
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
      const roll = Math.random();
      this.obs.push({
        x: PW + 8,
        w: this.cw * (.15 + Math.random() * .15),
        h: this.cw * (.22 + Math.random() * .28),
        kind: roll < .55 ? 'bush' : roll < .8 ? 'rock' : 'stump',
        seed: Math.random() * 6.283,
      });
    }
    for (const o of this.obs) o.x -= this.v * dt;
    this.obs = this.obs.filter(o => o.x + o.w > -2);

    /* Collide against the part of the sprite the obstacle can actually reach.
       The nose overhangs the front paw by 8px, so one fixed box either kills
       you with the bush under your chin or lets it pass through the chest. */
    const frame = this.y > 0 ? RUN_AIR_FRAME : Math.floor(this.phase);
    for (const o of this.obs){
      const box = hitBox(frame, o.h, this.y, this.scale, this.cx);
      if (!box) continue;                 // jumped clear, or feet off the ground this frame
      const [back, front] = box;
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
    // a treeline riding the same hill, scrolling at the same rate (the
    // `+ this.d * .25` term matches the hill's own) so it reads as sitting
    // on the ridge instead of drifting independently of it
    const n = 5, spacing = PW / n;
    for (let i = 0; i < n; i++){
      const sx = (((i * spacing - this.d * .25) % PW) + PW) % PW;
      const hh = Math.sin((sx + this.d * .25) / (PW * .22)) * PH * .05;
      pine(Math.round(sx), Math.round(this.gy - PH * .1 - hh - 2), PH * .1, '#0a1320');
    }
    for (let x = 0; x < PW; x++){
      const h = Math.sin((x + this.d * .25) / (PW * .22)) * PH * .05;
      px(x, this.gy - PH * .1 - h, 1, PH, C.hill);
    }
    px(0, this.gy, PW, PH - this.gy, '#20303f');
    px(0, this.gy, PW, 1, C.out);
    for (let i = 0; i < PW; i += 7){
      px((i - this.d * .9) % PW + (i - this.d * .9 < 0 ? PW : 0), this.gy + 3, 3, 1, '#2c4152');
    }
    for (const o of this.obs) this.drawObstacle(o);
    for (const p of this.dust){
      TARGET.globalAlpha = Math.max(0, p.t / .45) * .6;
      px(p.x, p.y, 2, 2, '#6b8299');
      TARGET.globalAlpha = 1;
    }
    drawCapyRun(this.cx, this.gy - this.y, this.scale, this.y > 0 ? RUN_AIR_FRAME : Math.floor(this.phase));
  },
  /* Same bounding box as the collision test regardless of kind -- only the
     art inside it varies, so a new look never quietly moves the hitbox. */
  drawObstacle(o){
    const x = o.x, y = this.gy - o.h, w = o.w, h = o.h;
    if (o.kind === 'rock'){
      blob(x, y, w, h, C.out, 2);
      blob(x + 1, y + 1, Math.max(1, w - 2), Math.max(1, h - 1), '#5c6a72', 2);
      px(x + 1, y + 1, Math.max(1, w * .4), 1, '#8a99a1');            // sunlit edge
      px(x + w * .3, y + h * .5, Math.max(1, w * .2), Math.max(1, h * .3), '#4a5860');
    } else if (o.kind === 'stump'){
      roundRect(x, y, w, h, 1, '#5a3a24');
      roundRect(x + 1, y + 1, Math.max(1, w - 2), Math.max(1, h - 1), 1, '#8a6242');
      for (let ry = y + 2; ry < y + h - 1; ry += 3) px(x + 1, ry, Math.max(1, w - 2), 1, '#6b4a33');
      px(x + 1, y + 1, Math.max(1, w - 2), 1, '#a87c52');             // cut-top highlight
    } else {                                                          // bush, the common case
      blob(x, y, w, h, C.out, 2);
      blob(x + 1, y + 1, Math.max(1, w - 2), Math.max(1, h - 1), '#3d6b3a', 2);
      const dots = Math.max(2, Math.round(w / 3));
      for (let i = 0; i < dots; i++){
        const dx = x + 1 + (Math.sin(o.seed + i * 2.1) * .5 + .5) * Math.max(1, w - 3);
        const dy = y + 1 + (Math.cos(o.seed * 1.3 + i * 1.7) * .5 + .5) * Math.max(1, h - 3);
        px(dx, dy, 1, 1, i % 2 === 0 ? '#5f8f4e' : '#2c5228');
      }
    }
  },
  stat(){ return Math.round(this.d / (this.cw * .15)) + ' m'; },
};
