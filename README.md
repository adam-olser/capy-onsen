# Capy Onsen 🐹♨️

A pixel-art capybara onsen with six mini-games, built with [Bun](https://bun.sh) and plain canvas/DOM — no framework.

**Play it:** https://adam-olser.github.io/capy-onsen

## Games

- **Memory Match** — flip cards to find matching pairs
- **Bath Bubbles** — pop bubbles before they float away
- **Orange Catch** — catch falling yuzu in a bowl
- **Capy Run** — jump obstacles in an endless runner
- **Capy Stack** — stack sliding planks as high as you can
- **Wordlebara** — a capybara-themed word-guessing game

## Development

```bash
bun install
bun run dev     # dev server
bun run test    # unit tests
bun run test:visual   # Playwright visual regression suite
bun run build   # production build to dist/
```

Deploys automatically to GitHub Pages on push to `main` (see `.github/workflows/`).

## Credits

See the in-game credits panel (bottom of the main menu) for sprite and music attribution.
