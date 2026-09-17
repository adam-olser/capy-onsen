/* ================= hit tests (pure, self-checked at #test) ================= */
/* swept: did the yuzu's underside cross the head top this frame, within its width? */
export function caught(prevBottom, bottom, top, dx, halfW){
  return prevBottom < top && bottom >= top && Math.abs(dx) <= halfW;
}
/* runner: obstacle overlaps the body box horizontally and the feet are below its top */
export function hitsObstacle(o, back, front, feetY){
  return o.x < front && o.x + o.w > back && feetY < o.h;
}
