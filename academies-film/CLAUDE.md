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

## Sanctioned Corporate Calm (the 20-min study loop)
**`sanctioned-corporate-calm.html` is its MASTER** (Bryan's copy, Nov 4; newer than what `source/tools/build-study.js` makes: safe
areas, the hat logo, no Download button, a main-thread audio fallback). Edit it directly; don't rebuild it from `source/`.
Its music is `source/src/audio/longform.js`, already inside it.

## Clock + timer versions
`clock-timer.js` adds a wall clock (always on) and the CD-ROM's session timer on top of a piece; `tools/build_academies_clock.py`
injects it into copies of both masters → `dist/danbury-academies-clock.html` and `dist/sanctioned-corporate-calm.html`, copied
to `players/`. The masters stay clock-free (the film's MP4s are unchanged). After any master edit, re-run the build.

## Its music
`audio/instruments-film.js`, `audio/style-film24.js`, `audio/style-rounds.js`, `score/academies-hallway.json`,
`score/corporate-calm.json`. These are shared audio files: read `audio/CLAUDE.md` before changing them.

## Video
`tools/html_to_mp4.py` on the master renders frame-exact with offline music (`DHS.film`).
