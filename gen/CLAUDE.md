# gen (generative motion library)

Generative motion graphics as small JSON cartridges. Status, Dust Type notes, known limits: `gen/STATUS.md`.

## Read first
- `gen/API.md` is the one-page reference for Claude; `gen/README.md` is the overview for people; `gen/KNOBS.md` (generated)
  lists every knob. Read those, not `gen/layers/*.js`, unless adding or fixing a layer.
- **The cartridges are examples of what the tools can do, not a menu.** None is the default answer for a new piece,
  and no piece borrows another piece's look. A new piece reaches this folder only through `/toolbox`, after its gate.
- `gen/carts/private/` holds cartridges that can't be published (e.g. lyrics from a commercial record).

## Build and test
- `python3 gen/build.py`, then `node gen/tests/smoke.js`. Both must pass, and CI checks that the generated
  `gen/carts/_bundle.js` and `gen/KNOBS.md` are committed.
- `DISPLAY_FONT` (Montserrat Bold, in `gen/build.py`) is shared by the `type`, `halftone` and `dust` layers.

## One video or one screen: `tools/gen_export.py`
Pick the cartridge, pick a folder, MAKE HTML / MP4 / BOTH. The HTML holds only that cartridge and opens straight into
it in presentation mode (`GEN.PRESENT`: no gallery, knobs, cartridge menu or shot skipping; just START, play/pause,
fullscreen); the MP4 has the cartridge's `"audio"` track laid in frame-exact. Don't send Bryan to edit
`gen/build.py` or dig in `gen/dist/` (`ONLY_CART` still exists for scripted builds:
`build.main(only_cart, out_path)`).

## Publishing
`gen/dist/gen-player.html` and standalones go into `players/` (`tools/CLAUDE.md`).
