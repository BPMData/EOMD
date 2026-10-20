# gen: generative motion graphics as tiny JSON cartridges

Truchet tiles, morphing 3D dot meshes, endless grid fly-overs, contour maps, branching fractals,
flow fields, Julia sets, wormhole tunnels, reaction-diffusion, harmonographs, halftone prints and kinetic
typography for music videos, all drawn live on an HTML canvas. No After Effects, no 3D engine, no internet.

Each piece is a **cartridge**: a ~1 KB JSON file that picks layers and sets their knobs. The library does
the drawing, so making a new piece (or asking an AI to make one) costs a small JSON file instead of a new
600-line program.

## Try it
1. Double-click `player.html` (works straight from the folder).
2. Press **G** for the gallery, pick a cartridge.
3. Press **K** for the knobs (every knob has a one-line explanation under it; **? HELP** hides them,
   **CLOSE** or Esc closes the panel). Drag sliders until it looks right, then **COPY JSON**.
4. Paste that into a new file in `carts/` (e.g. `carts/my-piece.json`).
5. Run `build.py` (Thonny: open, Run). It checks every cartridge and writes `dist/gen-player.html`:
   one self-contained file to put on a USB stick or a smart board.

## Making a kinetic-type music video
1. Run Whisper on the track with word timestamps (`word_timestamps=True`), keep the `.json`.
2. Open the player, pick `music-video-template`, drop the MP3 on the page.
3. KNOBS → WHISPER JSON (choose phrases or words). Each line in the SCRIPT box is now a cue.
4. Add your stage directions after the `|` on each line: `shout orange bg=black`, `whisper`,
   `drawn`, `tremble`, `melt`, `block` (use `/` for line breaks) ... then APPLY SCRIPT.
   No Whisper file? Type the lines, then TAP TIMING and press T as each line is said.
5. COPY JSON, save it as `carts/private/<name>.json`, put the MP3 in `gen/audio/`, run `build.py`.
   The built file carries the track inside it, so it plays anywhere offline.
Words from a commercial record belong in `carts/private/` (keep that folder out of a public repo).

## Files
| File | What it is |
|---|---|
| `player.html` | Player, knob panel and gallery |
| `carts/*.json` | Cartridges (`reel.json` is the showcase) |
| `core.js` | Seeded random, noise, easing, color, beat clock |
| `m3d.js` | Rotation, perspective, the 3D surfaces |
| `stage.js` | Plays a cartridge: shots, transitions, HUD |
| `layers/*.js` | One file per kind of visual |
| `build.py` | Builds `dist/gen-player.html`, `carts/_bundle.js` and `KNOBS.md` |
| `audio/` | Tracks a cartridge names in `"audio"` (git ignores .mp3/.wav) |
| `tests/smoke.js` | `node gen/tests/smoke.js`: every cartridge runs, stays finite, is deterministic |
| `API.md` | One-page reference (written for Claude, readable by people) |
| `KNOBS.md` | Every knob with its range (generated) |

## Fonts
The HUD uses the viewer's system monospace unless you set `FONT_FILE` in `build.py` to an OFL font
(Source Code Pro, VT323, ...); it gets embedded, so the build stays offline. Ship the font's OFL text with it.
