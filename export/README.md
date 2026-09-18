# Capy Onsen — sprite export

Every sprite here is rendered at its **native pixel grid** (1×, no scaling), with
transparency, so it can be edited pixel-for-pixel and dropped back in.

## What's here

| group | files | notes |
|---|---|---|
| Menu icons | `icon-*.png` | 32×32, one per game |
| Memory match cards | `card-*.png` | 32×32, six faces plus the back |
| Props | `yuzu`, `bubble`, `pine` | as used in the scene |
| Run cycle | `run-strip-rainloaf.png` | 135×21, five 27×21 frames |

The capybara face isn't exported from here: it's drawn from the PNGs in
`src/sprites/faces/` (idle/blink/happy/sad/look/turn), which are already the
source of truth — edit those directly.

## Provenance

Everything above is drawn procedurally in `src/sprites/` and `src/ui/icons.js`
— these PNGs are renders of that code, not the source of truth. **Edits here
do not flow back into the game automatically**; the drawing code has to be
updated to match, or the sprite switched over to loading a PNG.

`run-strip-rainloaf.png` is **not ours**: it is the run cycle by
[Rainloaf](https://rainloaf.itch.io/capybara-sprite-sheet), extracted from the
`.aseprite` layer and mirrored. Free for commercial use **with credit**, which
the site carries in its footer. Keep that credit on any derivative.

## Regenerating

    bun run dev          # then open http://localhost:3001/export
    # with the receiver running:  python3 /tmp/capy_recv.py
