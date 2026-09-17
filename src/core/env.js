export const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Cross-cutting mutable state. Exported `let` bindings are live for importers;
   only the owning module writes them, through these setters. */
export let PIXEL = 4;
export function setPixel(v){ PIXEL = v; }

export let T = 0;                 // scene clock, seconds
export function setT(v){ T = v; }
