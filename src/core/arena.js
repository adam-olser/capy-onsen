import { PIXEL } from './env.js';
import { setTarget } from './paint.js';
import { playEl, statEl, over } from './ui.js';

/* ================= canvas arena ================= */
const pb = document.createElement('canvas'), pbx = pb.getContext('2d');
const pctx = playEl.getContext('2d');
export let PW = 0, PH = 0;
let cur = null, raf = 0, lastT = 0, running = false;

export function arenaResize(){
  const r = playEl.getBoundingClientRect();
  if (!r.width || !r.height) return;
  playEl.width = r.width; playEl.height = r.height;
  PW = Math.max(60, Math.round(r.width / PIXEL));
  PH = Math.max(60, Math.round(r.height / PIXEL));
  pb.width = PW; pb.height = PH;
  pctx.imageSmoothingEnabled = false; pbx.imageSmoothingEnabled = false;
  if (cur && cur.layout) cur.layout();
}
// the game panel keeps growing after it opens, so watch the canvas itself
new ResizeObserver(() => { if (running) arenaResize(); }).observe(playEl);

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
