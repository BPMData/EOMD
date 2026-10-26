# Contributing to EOMD

Thanks for wanting to add something. Contributions are welcome:

- **New gen cartridges.** The easiest first pull request: one JSON file in `gen/carts/`.
- **Music scores.** A new `score/<name>.json` for the arranger (`score/FORMAT.md` explains every field).
- **New gen layers** in `gen/layers/` (read `gen/API.md` first).
- **Fixes** to anything: code, docs, typos, builds.
- **A piece made for someone** (a promo, a poster, a screen loop): start with the interview in `brief/INTERVIEW.md`
  and put the approved brief in `proj/<name>/brief.md` before designing anything.

Not sure an idea fits? Open an issue first (there are forms for bugs and for cartridge ideas).

## Your first cartridge

1. Double-click `gen/player.html`. Press **G** for the gallery and pick a cartridge to start from, then **K** for the knobs.
2. Drag knobs until it looks right, press **COPY JSON** and save it as `gen/carts/<your-piece>.json`.
3. Build and test (both must pass):
   ```bash
   python3 gen/build.py
   node gen/tests/smoke.js
   ```
4. Commit your cartridge **and** the two files the build regenerates, `gen/carts/_bundle.js` and `gen/KNOBS.md`
   (CI checks that they match).
5. Open a pull request. Say what the piece is and what you watched it on.

`gen/README.md` has the longer walkthrough (kinetic-type music videos included); `gen/API.md` is the one-page reference.

## A new music score

Copy a `score/*.json`, change it, run `tools/calibrate.py` (it sets the loudness and writes an MP3 preview to `dist/`),
listen to the whole preview, then rebuild the jukebox with `tools/build.py` (`TARGETS = ['jukebox']`).
The scripts in `tools/` have every setting at the top and run from Thonny's Run button or `python3 tools/<name>.py`.

## Pull request checklist

- [ ] `python3 gen/build.py` and `node gen/tests/smoke.js` pass (CI runs them too, on every push and pull request).
- [ ] It's still a **single offline file**: fonts, data, images and audio code are inlined; nothing loads from the internet.
- [ ] **No remote fonts** (or remote images, scripts or CDNs).
- [ ] **Motion is time-based**: position comes from the clock, so the frame rate never changes the speed.
- [ ] **Nothing flashes faster than 3 times per second.**
- [ ] You watched it (and listened to it, if it has sound) from start to finish.

CI also runs the audio regression check (`tools/regress.py`): it renders every score and compares it with
`tests/hashes.json`. A new score just shows up as "new" and passes. If your change alters existing music on purpose
(for example a fix in `audio/`), CI will report mismatches: say so in the pull request, and the maintainer will
listen and save a new baseline.

## AI-written contributions

Welcome. This repo is built to be worked on with AI coding assistants (`CLAUDE.md` is the map). Use whatever assistant
you like, as long as the tests pass and **you have actually watched and listened to the result** before opening the
pull request. A cartridge that passes the smoke test but was never looked at isn't finished.

## License and copyright

- Everything you contribute is under the repo's **GNU AGPLv3** (see `LICENSE`).
- **No copyrighted material** you don't have the rights to: no commercial song lyrics, logos, photos or fonts
  without an open license.
- Lyrics from a commercial record belong only in `gen/carts/private/`, which git ignores. Never put them in a pull request.
- Audio files (`*.mp3`, `*.wav`) are git-ignored too, so a cartridge's `"audio"` track doesn't travel with the pull request.
