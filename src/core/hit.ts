/* ================= hit tests (pure, self-checked at #test) ================= */
/* swept: did the yuzu's underside cross the head top this frame, within its width? */
export function caught(prevBottom: number, bottom: number, top: number, dx: number, halfW: number): boolean {
  return prevBottom < top && bottom >= top && Math.abs(dx) <= halfW;
}

interface Obstacle { x: number; w: number; h: number; }

/* runner: obstacle overlaps the body box horizontally and the feet are below its top */
export function hitsObstacle(o: Obstacle, back: number, front: number, feetY: number): boolean {
  return o.x < front && o.x + o.w > back && feetY < o.h;
}
