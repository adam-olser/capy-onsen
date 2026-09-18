import { test, expect } from '@playwright/test';

/* Regression coverage for the buffer->canvas integer-scale fix (see
   src/scene/onsen.js, src/core/arena.js, src/games/wordle.js): a fractional
   scale there is what makes the pixel art look "swimmy"/distorted, and it
   only gets more visible on odd or high-DPI screens -- so this sweeps a
   spread of desktop sizes, DPRs, and phone orientations rather than testing
   just one. Run with `npx playwright test` (needs the dev server; the
   config starts one automatically). */

const CASES = [
  { name: 'desktop 1440x900 @1x', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  { name: 'desktop 1440x900 @2x', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 },
  { name: 'desktop 1920x1080 @1.5x', viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1.5 },
  { name: 'desktop 2560x1440 @2x', viewport: { width: 2560, height: 1440 }, deviceScaleFactor: 2 },
  { name: 'ultrawide 3440x1440 @1x', viewport: { width: 3440, height: 1440 }, deviceScaleFactor: 1 },
  { name: 'small window 700x500 @1x', viewport: { width: 700, height: 500 }, deviceScaleFactor: 1 },
  { name: 'iPhone SE portrait', viewport: { width: 375, height: 667 }, deviceScaleFactor: 2 },
  { name: 'iPhone SE landscape (rotated)', viewport: { width: 667, height: 375 }, deviceScaleFactor: 2 },
  { name: 'iPhone 14 Pro portrait', viewport: { width: 393, height: 852 }, deviceScaleFactor: 3 },
  { name: 'iPhone 14 Pro landscape (rotated)', viewport: { width: 852, height: 393 }, deviceScaleFactor: 3 },
  { name: 'Pixel 7 portrait', viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.625 },
  { name: 'Pixel 7 landscape (rotated)', viewport: { width: 915, height: 412 }, deviceScaleFactor: 2.625 },
];

for (const c of CASES) {
  test.describe(c.name, () => {
    test.use({ viewport: c.viewport, deviceScaleFactor: c.deviceScaleFactor });

    test('menu background: whole-number pixel scale, no letterboxing', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(250);

      const dbg = await page.evaluate(() => window.__sceneDebug());
      expect(Number.isInteger(dbg.scale)).toBe(true);
      expect(dbg.scale).toBeGreaterThanOrEqual(1);
      // the logical buffer, blown up by the integer scale, must fully cover
      // the real canvas, with at most one logical unit of harmless overscan
      expect(dbg.VW * dbg.scale).toBeGreaterThanOrEqual(dbg.cvW);
      expect((dbg.VW - 1) * dbg.scale).toBeLessThan(dbg.cvW);
      expect(dbg.VH * dbg.scale).toBeGreaterThanOrEqual(dbg.cvH);
      expect((dbg.VH - 1) * dbg.scale).toBeLessThan(dbg.cvH);

      const corners = await page.evaluate(() => {
        const cv = document.getElementById('scene');
        const g = cv.getContext('2d');
        return [[0, 0], [cv.width - 1, 0], [0, cv.height - 1], [cv.width - 1, cv.height - 1]]
          .map(([x, y]) => g.getImageData(x, y, 1, 1).data[3]);
      });
      expect(corners).toEqual([255, 255, 255, 255]);

      // the nominal CSS-px-per-logical-unit density is capped at 4 (see the
      // comment in onsen.js's resize()) so a wide/tall viewport reveals more
      // of the scene at the same fine density, instead of the same low
      // logical resolution blown up into visibly chunkier blocks the bigger
      // the screen gets -- this held everything from a phone to an
      // ultrawide desktop in the CASES above 3.5px either side of that cap
      const cssPxPerUnit = (dbg.cvW / dbg.VW) / (await page.evaluate(() => window.devicePixelRatio));
      expect(cssPxPerUnit).toBeGreaterThanOrEqual(2.5);
      expect(cssPxPerUnit).toBeLessThanOrEqual(4.5);
    });

    test('game canvas: fills its container edge-to-edge, backing store close to cssSize * DPR', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: /capy run/i }).click();
      await page.waitForTimeout(250);

      const info = await page.evaluate(() => {
        const play = document.getElementById('play');
        const stage = document.querySelector('.stage');
        const pr = play.getBoundingClientRect();
        const sr = stage.getBoundingClientRect();
        return {
          gapLeft: pr.left - sr.left, gapRight: sr.right - pr.right,
          gapTop: pr.top - sr.top, gapBottom: sr.bottom - pr.bottom,
          backingW: play.width, backingH: play.height,
          cssW: pr.width, cssH: pr.height,
          dpr: window.devicePixelRatio,
        };
      });

      // no meaningful margin around the canvas -- see core/arena.js: the
      // scale is fixed to the nominal design density first, then PW/PH are
      // solved to fit the container at exactly that scale, which bounds the
      // leftover to about half a *scale step* (a few CSS px at most) instead
      // of half of PW/PH itself, which used to be tens of CSS px on a small
      // screen -- a visible, wasted margin around the play area
      for (const gap of [info.gapLeft, info.gapRight, info.gapTop, info.gapBottom]) {
        expect(Math.abs(gap)).toBeLessThan(8);
      }
      // same rounding remainder shows up here too, in device px this time
      // (PW/PH themselves are rounded to fit the container at the fixed
      // scale, so the backing store can be a few device px off from an
      // exact cssSize * DPR match, on either side)
      expect(Math.abs(info.backingW - info.cssW * info.dpr)).toBeLessThan(10);
      expect(Math.abs(info.backingH - info.cssH * info.dpr)).toBeLessThan(10);
    });

    test('Wordlebara face canvas: backing store is a whole multiple of the design grid', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: /wordlebara/i }).click();
      await page.waitForTimeout(250);

      const info = await page.evaluate(() => {
        const face = document.getElementById('capyface');
        const { FACE_LW, FACE_LH } = window.__faceSize;
        return { w: face.width, h: face.height, FACE_LW, FACE_LH };
      });
      expect(info.w % info.FACE_LW).toBe(0);
      expect(info.h % info.FACE_LH).toBe(0);
    });
  });
}
