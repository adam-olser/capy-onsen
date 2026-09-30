/* Shared shapes used across games/, core/ and main.ts. One file so every
   game implicitly agreeing on the same contract becomes an explicit,
   checked one. */

export type Pane = 'board' | 'play' | 'word';

/* The mini-game contract. `canvas`/`pane` pick which of #board/#play/#word
   main.ts shows; a DOM game (canvas falsy) gets stop() called on close,
   a canvas game is driven by core/arena.js's own loop instead. */
export interface Game {
  key: string;
  title: string;
  canvas?: boolean;
  pane?: Pane;
  start(): void;
  stop?(): void;
  update?(dt: number): void;
  draw?(): void;
  stat?(): string;
  layout?(): void;
  pointer?(x: number, y: number): void;
  move?(x: number, y: number): void;
  jump?(): void;
}

export type Mark = 'hit' | 'near' | 'miss';
export type KeyState = Partial<Record<string, Mark>>;
