/* Wordle letter scoring.

   The subtle part is duplicates: greens claim their copies of a letter first,
   and only the leftovers can turn yellow. Guess SPEED against ERASE gives one
   E as near and the other as miss, because ERASE has two Es and one is already
   consumed. A naive "does the answer contain this letter" check gets this
   wrong and is the most common bug in Wordle clones. */
export function scoreGuess(guess, answer){
  const res = new Array(guess.length).fill('miss');
  const left = new Map();

  // pass 1: exact positions, counting what the answer has left over
  for (let i = 0; i < answer.length; i++){
    if (guess[i] === answer[i]) res[i] = 'hit';
    else left.set(answer[i], (left.get(answer[i]) || 0) + 1);
  }
  // pass 2: misplaced letters consume the remainder, left to right
  for (let i = 0; i < guess.length; i++){
    if (res[i] === 'hit') continue;
    const n = left.get(guess[i]) || 0;
    if (n > 0){ res[i] = 'near'; left.set(guess[i], n - 1); }
  }
  return res;
}

/* Keyboard keys only ever get better, never worse. */
const RANK = { miss: 0, near: 1, hit: 2 };
export function mergeKeyState(prev, next){
  return RANK[next] > RANK[prev ?? 'miss'] || prev == null ? next : prev;
}

/* Up to `n` distinct letters from `answer` the keyboard doesn't already show
   as green, in answer order. Fewer come back once most of the word is known. */
export function pickHint(answer, keyState, n = 2){
  const out = [];
  for (const ch of answer){
    if (out.includes(ch) || keyState[ch] === 'hit') continue;
    out.push(ch);
    if (out.length >= n) break;
  }
  return out;
}
