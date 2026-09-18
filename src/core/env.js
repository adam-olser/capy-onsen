export const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Canvas backing stores are sized in CSS px elsewhere in this codebase, so on
   any DPR>1 screen the browser has to rescale the bitmap onto the physical
   pixel grid on top of our own nearest-neighbor draws -- two uncoordinated
   resampling passes, which is exactly what drops single-pixel details (an
   eye highlight) and looks different device to device. Capped at 3: some
   Android panels report 4 and a backing store that scales just makes every
   canvas heavier for a difference nobody can see on a phone screen. */
export const DPR = Math.max(1, Math.min(3, window.devicePixelRatio || 1));

/* Cross-cutting mutable state. Exported `let` bindings are live for importers;
   only the owning module writes them, through these setters. */
export let PIXEL = 4;
export function setPixel(v){ PIXEL = v; }

export let T = 0;                 // scene clock, seconds
export function setT(v){ T = v; }
