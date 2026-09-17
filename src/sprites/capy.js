import { px, blob, TARGET } from '../core/paint.js';
import { C } from '../core/palette.js';

/* capybara head + shoulders, front on, sitting in the water */
export let capyBox = {x:0, y:0, w:0, h:0};
export function drawCapy(cx, cy, w, blink, mood = 'idle'){
  const u = Math.max(1, Math.round(w / 22));
  const hw = 10 * u, hh = 7 * u;
  capyBox = {x: cx - hw - 3 * u, y: cy - hh - 5 * u, w: (hw + 3 * u) * 2, h: (hh + 8 * u) * 2};

  // shoulders, just breaking the surface
  blob(cx - hw - 4 * u, cy + hh - 3 * u, (hw + 4 * u) * 2, 9 * u, C.out, 2 * u);
  blob(cx - hw - 3 * u, cy + hh - 2 * u, (hw + 3 * u) * 2, 8 * u, C.furSh, 2 * u);

  // ears
  for (const sgn of [-1, 1]){
    const ex = cx + sgn * (hw - 4 * u);
    blob(ex - 3 * u, cy - hh - 3 * u, 6 * u, 5 * u, C.out, 2 * u);
    blob(ex - 2 * u, cy - hh - 2 * u, 4 * u, 3 * u, C.fur, u);
    px(ex - u, cy - hh - u, 2 * u, u, C.muzzle);
  }

  // head
  blob(cx - hw - u, cy - hh - u, (hw + u) * 2, (hh + u) * 2, C.out, 3 * u);
  blob(cx - hw, cy - hh, hw * 2, hh * 2, C.fur, 3 * u);
  px(cx - hw + 3 * u, cy - hh + u, 4 * u, u, C.furHi);

  // eyes — mood only changes the eyes and cheeks, never the silhouette
  const eh = blink ? u : 2 * u;
  if (mood === 'happy' || mood === 'win'){
    for (const sgn of [-1, 1]){                       // ^ ^
      const ex = cx + (sgn < 0 ? -6 * u : 4 * u);
      px(ex, cy, u, u, C.eye); px(ex + u, cy - u, u, u, C.eye); px(ex + 2 * u, cy, u, u, C.eye);
    }
    px(cx - 9 * u, cy + u, 2 * u, u, '#e08a63');
    px(cx + 7 * u, cy + u, 2 * u, u, '#e08a63');
  } else if (mood === 'sad' || mood === 'lose'){
    px(cx - 6 * u, cy, 2 * u, u, C.eye);              // droopy slits
    px(cx + 4 * u, cy, 2 * u, u, C.eye);
    px(cx - 6 * u, cy - u, u, u, C.eye);
    px(cx + 5 * u, cy - u, u, u, C.eye);
  } else {
    px(cx - 6 * u, cy - u, 2 * u, eh, C.eye);
    px(cx + 4 * u, cy - u, 2 * u, eh, C.eye);
  }

  // muzzle + nostrils
  blob(cx - 5 * u, cy + 2 * u, 10 * u, 5 * u, C.muzzle, 2 * u);
  px(cx - 2 * u, cy + 3 * u, u, u, C.out);
  px(cx + u, cy + 3 * u, u, u, C.out);
}

/* Half-bound gallop, the gait cavioid rodents actually use at speed:
   hind legs swing together, front legs asynchronously, and the body
   extends and compresses like a see-saw. Six key poses, stepped not lerped. */
/* Capybara run cycle by Rainloaf (rainloaf.itch.io/capybara-sprite-sheet),
   free for commercial use with credit. Taken from the .aseprite sprite layer
   so it carries real alpha, mirrored to face right: 5 frames of 27x21. */
export const CAPY_RUN = new Image();
CAPY_RUN.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIcAAAAVCAYAAABsSf1CAAACkElEQVR42u2av24CMQzGbZSNlVdACAkJVvbubLfwIkwMne5FurCxs7NSqVJV9RW6dk4Xgo6QENtxwh81Uocel/zy2Z9zOV0Q8pr1/kf4b0/TTO4Ai8kAAAC2Hz/PEhNb0ey2cmGxirmXS5tPhz489qchTHO8pOFLc2qzHK/DLLZynMS0zQza5vKG7dcvAACs3vbuftQIZI1VajEZOE4qafhIrPl0CPv3b4oh0eQY4/P15ezieL2D0PV2OXcGqSZMg+PrKGH6iix2MYtBMTEJYJawdjmHxahP4UhZJNM7Vqauu2cVN4eDPkoQlUxP2j8oFpgtwTKc5ehWLSTMv7YY9c8MorCTv75PiPMsJxkaLE1el2UowaKCXTXXSA4ziKrVVWucW7MMZyknGkPt0aH9fi8dP9P0J8PG9ktCVnYxpVgm5UiOsFrGkCRLwRjiNxJi7NgsYY7ILKMlTGtpZAjFWtUsZfkMIhNLmY9rQqMsTGVDVKPV4PgMbaYkR5zVyWgIy30m1zRjYY54HyCJYYb5SKuToQocr3ep5zbmBJIqNNeIBU1vASD43SI0TjeWq82BG0Pr+rXNLMlzrA5H/rYSM4GDugC0zSwrWbEPQFricqpZkLCTntXmEPr+0x3Hjtc78gewFMsZxIsb5rIwVQGeSAQAG/hN9JbSnfCVYF5U5PFe5FSzX2ExU0fmhBw9xH6xOKNklUr09+dGylcvZZjOBLDEW0NAGHpjqnzJXW0OMF7vTn8BHvomlVQbI8lnPCZLZa4Sc8QqmfV7qSblJgwYDXohY2gYH2+ZB3tcjvzDNaFrWeMTxqPeF+wH/ANC0n6acWb1T8xVdFAKCeDgHkDpkUI9tiY9qyqd6y2P793NOdw/y4vYPMo58y0AAAAASUVORK5CYII=';
export const RUN_FRAME_W = 27, RUN_FRAME_H = 21, RUN_FRAMES = 5, RUN_AIR_FRAME = 2;
// consumers subscribe with CAPY_RUN.addEventListener('load', ...) — see ui/icons.js

export function drawCapyRun(cx, footY, scale, frame){
  if (!CAPY_RUN.complete || !CAPY_RUN.naturalWidth) return;
  const w = RUN_FRAME_W * scale, h = RUN_FRAME_H * scale;
  TARGET.drawImage(CAPY_RUN, (frame % RUN_FRAMES) * RUN_FRAME_W, 0, RUN_FRAME_W, RUN_FRAME_H,
                   Math.round(cx - w / 2), Math.round(footY - h), w, h);
}
