import { PIXEL, DPR } from './env.js';
import { setTarget } from './paint.js';
import { playEl, stageEl, statEl, over } from './ui.js';

/* ================= canvas arena ================= */
const pb = document.createElement('canvas'), pbx = pb.getContext('2d');
const pctx = playEl.getContext('2d');
export let PW = 0, PH = 0;
let cur = null, raf = 0, lastT = 0, running = false;

export function arenaResize(){
  // measured against .stage, not the canvas itself -- once we size playEl to
  // an integer device-pixel box below, it stops filling .stage exactly, and
  // measuring playEl would feed that back in and shrink it every resize
  const r = stageEl.getBoundingClientRect();
  if (!r.width || !r.height) return;

  // fix the device-pixels-per-unit scale to the nominal design density
  // FIRST, independent of the container's size, then size PW/PH to fit the
  // container at exactly that scale. Doing it the other way around (derive
  // the scale from how many of an already-chosen PW/PH fit) bounds the
  // rounding error to half of PW/PH -- tens of CSS px on a small screen,
  // a very visible leftover margin, and the one bad case (the natural
  // ratio landing right on a .5 boundary) can overshoot the container by
  // nearly as much as flooring used to waste. Solving for PW/PH instead
  // bounds the error to half a *scale step* -- a couple of device px,
  // consistently, at any container size -- which is what a fractional
  // buffer->screen scale actually costs: it's what makes pixel art look
  // "swimmy" on odd or high-res screens.
  const scale = Math.max(1, Math.round(PIXEL * DPR));
  PW = Math.max(60, Math.round((r.width * DPR) / scale));
  PH = Math.max(60, Math.round((r.height * DPR) / scale));
  pb.width = PW; pb.height = PH;

  playEl.width = PW * scale; playEl.height = PH * scale;
  playEl.style.width = (PW * scale / DPR) + 'px';
  playEl.style.height = (PH * scale / DPR) + 'px';

  pctx.imageSmoothingEnabled = false; pbx.imageSmoothingEnabled = false;
  if (cur && cur.layout) cur.layout();
}
// the game panel keeps growing after it opens, so watch the stable container,
// not the canvas -- see the comment in arenaResize() for why
new ResizeObserver(() => { if (running) arenaResize(); }).observe(stageEl);

function tick(now){
  if (!running) return;
  const dt = Math.min(.05, lastT ? (now - lastT) / 1000 : 0);
  lastT = now;
  if (!over()) cur.update(dt);
  setTarget(pbx);
  cur.draw();
  setTarget(null);
  pctx.clearRect(0, 0, playEl.width, playEl.height);
  pctx.drawImage(pb, 0, 0, PW, PH, 0, 0, playEl.width, playEl.height);
  statEl.textContent = cur.stat();
  raf = requestAnimationFrame(tick);
}

export function startArena(game){
  cur = game;
  arenaResize();
  game.start();
  lastT = 0; running = true;
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(tick);
}
export function stopArena(){
  running = false; cancelAnimationFrame(raf); cur = null;
}
export function restartArena(){
  if (!cur) return;
  arenaResize(); cur.start(); lastT = 0;
}
export const current = () => cur;

export function bg(a, b){
  const g = pbx.createLinearGradient(0, 0, 0, PH);
  g.addColorStop(0, a); g.addColorStop(1, b);
  pbx.fillStyle = g; pbx.fillRect(0, 0, PW, PH);
}

/* vertical gradient over an arbitrary band */
export function vgrad(y0, y1, a, b){
  const g = pbx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, a); g.addColorStop(1, b);
  pbx.fillStyle = g; pbx.fillRect(0, y0, PW, y1 - y0);
}

/* soft radial falloff, for lantern light and steam haze */
export function glow(x, y, r, inner, outer = 'rgba(0,0,0,0)'){
  const g = pbx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, inner); g.addColorStop(1, outer);
  pbx.fillStyle = g; pbx.beginPath(); pbx.arc(x, y, r, 0, 6.283); pbx.fill();
}
