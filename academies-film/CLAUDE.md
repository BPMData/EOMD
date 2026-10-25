# Academies hallway film

Status, approvals and things to watch: `academies-film/STATUS.md`. The brief it came from, word for word:
`brief/example-academies.md`. Brand colors: `proj/academies/brand.md`.

## The master
- **`danbury-academies-player.html` is the MASTER.** It has the 8 animated hero marks, the 21 redrawn pathway icons
  and the trilingual word blocks on all 7 academies. Edit this file directly.
- **Its config sits in it TWICE:** the visuals' copy and the audio worker's copy in
  `<script type="text/plain" id="dhs-audio-src">`. A config edit must change both.
- It's ~395 KB: never read it whole. Search it and read the part you need.
- `source/` is the older Sep 29 source tree (`config.js`, `src/`, `tools/`, `README.md`, `docs/SCRIPT.md`). It **lacks**
  the heroes, new icons and word blocks, so don't rebuild the player from it (that would undo them).
- `proj/academies/heroes.js` (`DHS.heroes.draw`) and `proj/academies/icons-new.js` are stand-alone sources of the hero
  marks and icons, already inside the master. Open them for demo sheets or to compare with the master.

## Its music
`audio/instruments-film.js`, `audio/style-film24.js`, `audio/style-rounds.js`, `score/academies-hallway.json`,
`score/corporate-calm.json`. These are shared audio files: read `audio/CLAUDE.md` before changing them.

## Video
`tools/html_to_mp4.py` on the master renders frame-exact with offline music (`DHS.film`).
