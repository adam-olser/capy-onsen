import { px, blob, roundRect, TARGET } from '../core/paint.js';
import { C } from '../core/palette.js';

/* Menu portrait: a supplied illustration, not drawn by the pixel painter.
   96x96 source, trimmed to its content box (82x82) with a 1px pad. Provenance:
   user-supplied reference image, used as the main-menu capybara. */
const CAPY_PORTRAIT = new Image();
CAPY_PORTRAIT.src = 'data:image/png;base64,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';
const PORTRAIT_SRC = 82;          // native px, square
const PORTRAIT_CHEEK = 71;        // measured cheek-to-cheek width inside that canvas
export let capyPortraitBox = {x: 0, y: 0, w: 0, h: 0};

/* Draws the portrait so its cheek width equals `w`, matching the scale
   drawCapy() uses (w == head width, cheek to cheek). cy lands at the same
   "waterline sits ~12u below this" spot the procedural head used, so the
   scene's water-cut overlay still crosses the neck, not the mouth. */
export function drawCapyPortrait(cx, cy, w){
  if (!CAPY_PORTRAIT.complete || !CAPY_PORTRAIT.naturalWidth) return;
  const scale = w / PORTRAIT_CHEEK;
  const dw = PORTRAIT_SRC * scale, dh = dw;
  const dx = cx - dw / 2, dy = cy - dh * .40;
  // this draw is a downscale (82px source -> ~44-50px here); nearest-neighbor
  // used to blend in with smoothing forced on for just this draw, to save a
  // 2px eye highlight that got dropped unevenly by the downscale otherwise.
  // That traded the crispness of the whole portrait -- eyes, nose, fur
  // outline, all of it -- for one asymmetric 2px detail it didn't even fully
  // preserve (one eye still came out dimmer than the other). The capybara is
  // the largest, most prominent thing on the menu, so a soft portrait was a
  // bad trade against the rest of the crisp, nearest-neighbor scene around
  // it. Plain nearest-neighbor now, same as everything else in the buffer.
  TARGET.drawImage(CAPY_PORTRAIT, dx, dy, dw, dh);
  capyPortraitBox = {x: dx, y: dy, w: dw, h: dh};
}

/* Head metrics, so games can line things up with the face without
   hardcoding numbers that drift when the sprite is redrawn. */
const FACE_U = 38;                      // design grid width, in units

export function capyHead(w){
  const u = Math.max(1, Math.round(w / FACE_U));
  return { u, hw: 19 * u, hh: 12 * u };
}

/* Front-facing capybara, drawn on a 38x24 unit grid so the nose glyph, the
   ear detail and the eye curves all survive at small sizes. */
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
