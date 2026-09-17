import { test, expect } from 'bun:test';
import { scoreGuess, mergeKeyState } from '../src/core/score.js';
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
