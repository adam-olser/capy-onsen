import { test, expect } from '@playwright/test';

/* Regression test for a bug where arenaResize()'s integer-scale snap (see
   core/arena.js) changed the game canvas's actual rendered CSS size, but
   main.js's pointer handlers still converted clicks using the old
   window-derived PIXEL constant -- so a click that visually landed on a
   bubble no longer mapped to where the game thought the bubble was.

   Reads the real bubble list off the running game object (window.__currentGame,
   a read-only debug hook -- see main.js) instead of guessing at bubble
   positions from canvas pixel colors, which turned out to have false
   positives (the ripple highlights and the capybara's own eye highlight are
   also near-white/near-cyan). Converts each bubble's logical (x, y) to a
   page-space point using PW/PH and the canvas's live bounding rect -- the
   exact inverse of the conversion main.js's pointer handler performs -- and
   dispatches a real 'pointerdown' there. */

const CASES = [
  { name: 'desktop 1440x900 @1x', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  { name: 'desktop 1920x1080 @1.5x', viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1.5 },
  { name: 'small window 700x500 @1x', viewport: { width: 700, height: 500 }, deviceScaleFactor: 1 },
  { name: 'iPhone SE portrait', viewport: { width: 375, height: 667 }, deviceScaleFactor: 2 },
  { name: 'iPhone SE landscape (rotated)', viewport: { width: 667, height: 375 }, deviceScaleFactor: 2 },
];

for (const c of CASES) {
  test.describe(c.name, () => {
    test.use({ viewport: c.viewport, deviceScaleFactor: c.deviceScaleFactor });

    test('clicking a bubble at its real logical position pops it', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: /bath bubbles/i }).click();
      await page.waitForTimeout(300);

      const result = await page.evaluate(async () => {
        const play = document.getElementById('play');
        const stat = document.getElementById('stat');

        let popped = 0, attempts = 0;
        for (let i = 0; i < 20 && attempts < 12; i++) {
          const g = window.__currentGame();
          const [PW, PH] = window.__PW_PH();
          const bubble = g && g.b && g.b[0];
          if (!bubble) { await new Promise(res => setTimeout(res, 100)); continue; }
          attempts++;

          const r = play.getBoundingClientRect();
          const clientX = r.left + (bubble.x / PW) * r.width;
          const clientY = r.top + (bubble.y / PH) * r.height;
          const before = stat.textContent;
          play.dispatchEvent(new PointerEvent('pointerdown', { clientX, clientY, bubbles: true }));
          await new Promise(res => setTimeout(res, 30));
          if (stat.textContent !== before) popped++;
        }
        return { popped, attempts };
      });

      expect(result.attempts).toBeGreaterThan(0);
      // every attempt targets a real, currently-tracked bubble at its exact
      // logical position -- with correct coordinate mapping this should be
      // very close to 100%; a mapping bug makes nearly all of them miss
      expect(result.popped).toBeGreaterThanOrEqual(Math.ceil(result.attempts * 0.8));
    });
  });
}
