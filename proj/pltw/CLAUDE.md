# PLTW CSE promo

Status and Bryan's verdicts: `proj/pltw/STATUS.md`. No brief yet (it was made before the interview existed).

## Files
- The picture: the gen cartridge `gen/carts/pltw-cse.json` (60 s, 120 BPM); gen's rules are in `gen/CLAUDE.md`.
- The music: `music.js`, "PLTW CSE": the 60-s score (A minor, own synths on the DSP; `CUES` = the picture's moments).
  Render it with `tools/render_piece.py` to `gen/audio/pltw-cse.mp3` after any change.
- Published: `players/pltw-cse.html` (gen standalone, made with `tools/gen_export.py` or
  `build.main(only_cart='pltw-cse', out_path='players/pltw-cse.html')`; linked from `index.html`), and
  `media/pltw-cse-preview.jpg` for the README.
