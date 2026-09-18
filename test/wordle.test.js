import { test, expect } from 'bun:test';
import { scoreGuess, mergeKeyState, pickHint } from '../src/core/score.js';
import { caught, hitsObstacle } from '../src/core/hit.js';
import { ALLOWED, ANSWERS } from '../src/data/words.js';

const s = (g, a) => scoreGuess(g, a).join(' ');

test('all correct', () => {
  expect(s('steam', 'steam')).toBe('hit hit hit hit hit');
});

test('no overlap at all', () => {
  expect(s('vivid', 'porch')).toBe('miss miss miss miss miss');
});

test('misplaced letters go near', () => {
  // WATER vs TRAWL: w,a,t,r all present but displaced; e is absent
  expect(scoreGuess('water', 'trawl')).toEqual(['near', 'near', 'near', 'miss', 'near']);
});

test('doubled guess letters do not borrow from greens', () => {
  // GEESE vs THESE: both Es in the answer are already claimed as green,
  // so the guess's leading Es have nothing left to turn yellow
  expect(scoreGuess('geese', 'these')).toEqual(['miss', 'miss', 'hit', 'hit', 'hit']);
});

test('one copy goes near, the spare goes miss', () => {
  // SASSY vs BASIS: answer has two Ss, one claimed green at index 2,
  // leaving exactly one for the guess's other Ss
  expect(scoreGuess('sassy', 'basis')).toEqual(['near', 'hit', 'hit', 'miss', 'miss']);
});

test('extra copies past the answer count fall through to miss', () => {
  // LLAMA has three Ls? no: two Ls, one in ALLOY -> second L must miss
  expect(scoreGuess('lulls', 'aloud')).toEqual(['near', 'near', 'miss', 'miss', 'miss']);
});

test('greens claim their copies before any yellow', () => {
  expect(scoreGuess('abbey', 'babes')).toEqual(['near', 'near', 'hit', 'hit', 'miss']);
});

test('keyboard state only improves', () => {
  expect(mergeKeyState(undefined, 'miss')).toBe('miss');
  expect(mergeKeyState('miss', 'near')).toBe('near');
  expect(mergeKeyState('hit', 'near')).toBe('hit');
  expect(mergeKeyState('near', 'hit')).toBe('hit');
});

test('every answer is itself a legal guess', () => {
  const bad = ANSWERS.filter(w => !ALLOWED.has(w));
  expect(bad).toEqual([]);
});

test('word lists are sane', () => {
  expect(ANSWERS.length).toBeGreaterThan(300);
  expect(ALLOWED.size).toBeGreaterThan(5000);
  expect(ANSWERS.every(w => w.length === 5)).toBe(true);
});

test('runner and catcher hitboxes still hold', () => {
  expect(caught(9, 11, 10, 0, 5)).toBe(true);
  expect(caught(0, 40, 10, 0, 5)).toBe(true);      // no tunnelling
  expect(caught(9, 11, 10, 9, 5)).toBe(false);
  expect(hitsObstacle({x: 9, w: 4, h: 6}, 10, 20, 0)).toBe(true);
  expect(hitsObstacle({x: 9, w: 4, h: 6}, 10, 20, 7)).toBe(false);
});

/* --- capy run collision geometry --- */
import { extentAt, hitBox, FRAME_COLS, FRAME_ROWS } from '../src/sprites/run-footprint.js';

test('a short obstacle only meets the legs, not the nose', () => {
  const scale = 2, cx = 100, cellL = cx - FRAME_COLS / 2 * scale;
  const low  = hitBox(0, 1 * scale, 0, scale, cx);     // ankle-height bush
  const tall = hitBox(0, FRAME_ROWS * scale, 0, scale, cx);
  // frame 0 stands on x 7..14, but its silhouette reaches x 26 (the snout)
  expect(low).toEqual([cellL + 7 * scale, cellL + 15 * scale]);
  expect(tall[1]).toBe(cellL + 27 * scale);
  expect(low[1]).toBeLessThan(tall[1]);                 // short bush cannot reach the snout
});

test('the box grows as the obstacle gets taller', () => {
  const widths = [1, 4, 8, 14, 21].map(h => { const b = hitBox(2, h, 0, 1, 0); return b[1] - b[0]; });
  expect(widths).toEqual([...widths].sort((a, b) => a - b));
});

test('jumping shrinks what the obstacle can reach, then clears it', () => {
  const scale = 2;
  expect(hitBox(0, 6 * scale, 0, scale, 0)).not.toBeNull();       // grounded: hits
  expect(hitBox(0, 6 * scale, 6 * scale, scale, 0)).toBeNull();   // feet level with its top
  expect(hitBox(0, 6 * scale, 9 * scale, scale, 0)).toBeNull();   // well above it
});

test('a frame with both feet off the ground cannot be tripped at ankle height', () => {
  expect(extentAt(4, 1)).toBeNull();
});

/* --- capy face frame selection (pure logic, see src/sprites/capyFace.js) --- */
import '../test/setup.js';
import { pickFace } from '../src/sprites/capyFace.js';

test('idle and blink are the baseline frames', () => {
  expect(pickFace(false, {})).toBe('idle');
  expect(pickFace(true, {})).toBe('blink');
});

test('happy covers both happy and win, sad covers both sad and lose', () => {
  expect(pickFace(false, { mood: 'happy' })).toBe('happy');
  expect(pickFace(false, { mood: 'win' })).toBe('happy');
  expect(pickFace(false, { mood: 'sad' })).toBe('sad');
  expect(pickFace(false, { mood: 'lose' })).toBe('sad');
});

test('look picks the matching side', () => {
  expect(pickFace(false, { look: -1 })).toBe('look-left');
  expect(pickFace(false, { look: 1 })).toBe('look-right');
});

test('the two smaller turn steps share one frame, the full turn is separate', () => {
  expect(pickFace(false, { turn: 1 / 3 })).toBe('turn-right-1');
  expect(pickFace(false, { turn: 2 / 3 })).toBe('turn-right-2');
  expect(pickFace(false, { turn: 1 })).toBe('turn-right-2');
  expect(pickFace(false, { turn: -1 / 3 })).toBe('turn-left-1');
  expect(pickFace(false, { turn: -2 / 3 })).toBe('turn-left-2');
});

test('priority is turn > look > blink > mood, since only one frame can show', () => {
  expect(pickFace(true, { turn: 1 })).toBe('turn-right-2');
  expect(pickFace(true, { look: 1 })).toBe('look-right');
  expect(pickFace(true, { mood: 'happy' })).toBe('blink');
});

test('states with no dedicated art fall back to idle', () => {
  expect(pickFace(false, { ear: 1 })).toBe('idle');
  expect(pickFace(false, { sniff: 1 })).toBe('idle');
});

test('hint picks distinct not-yet-hit letters, in answer order', () => {
  expect(pickHint('steam', {})).toEqual(['s', 't']);
});

test('hint skips letters already green on the keyboard', () => {
  expect(pickHint('steam', { s: 'hit' })).toEqual(['t', 'e']);
});

test('hint never repeats a letter that appears twice in the answer', () => {
  expect(pickHint('erase', {})).toEqual(['e', 'r']);
});

test('hint returns fewer than 2 once most letters are known', () => {
  expect(pickHint('steam', { s: 'hit', t: 'hit', e: 'hit', a: 'hit' })).toEqual(['m']);
});

test('hint returns none once the whole word is known', () => {
  expect(pickHint('steam', { s: 'hit', t: 'hit', e: 'hit', a: 'hit', m: 'hit' })).toEqual([]);
});
