# CS Lab Screensaver ("the CD-ROM one")

Status, history, known limits and open taste questions: `proj/cdrom/STATUS.md` (read it when working on this piece).
Brief and decisions: `proj/cdrom/brief.md`.

## Files
- **Player:** `player-src.html` (all five channels, channel titles `TITLES` + chronological `ORDER`, boot screen
  `BOOT_LINES` / `BOOT_AUTO` / `BOOT_CHIME`, Previous/Next Era, the music hooks and the `/*__ADDONS__*/` marker; fonts,
  data, add-ons and the music block are injected at build), `addons.js` (injected at `/*__ADDONS__*/`: the timer's
  time-left readout `drawClock` in 10-s steps; Their Finest Duds word structures, fighter planes and the speaker's
  zeppelin, overriding `Desk.prototype` step/draw/spawn/adopt/speaker, knobs `ST_*`, `PL_*`, `SHIP_*`, `PROP_R`,
  `PROP_FPS`; Starfield's space fighter, wrapping `Stars.prototype.draw`), `music.js` (music + speech block: modes
  Overclock (default) / Chips / Lounge / Lounge (Chipped), segmented tempo grid, chip streams per channel, bar-line
  crossfades, Overclock Tempo/Key menu, chip-voiced Dud speech, Contour intro; swapped in for the source's sound block
  at build), `brief.md`, `cards.md`, `dud.js`, `channel-d.html` (only as the Source Code Pro source).
- **Its music:** `track2-r2.js` (Track 2 engine + the piece **Overclock**: `TRACK2R2`, per-bar chords, melody, twin
  harmony, slap bass, drums; `chipEvents(chip,bpm,mask,tr)`; C breakdown, D generated solo, piece `overclock-long`;
  loaded by the player build and the jukebox), `audio/style-overclock.js` + `score/cdrom-overclock.json` (style
  `overclock`: endless 8-bar sections, intro once, then passes incl. `breakC`, `solo`, `liftB`; chip-voiced Dud
  speech, clear sampler, post EQ; the score holds tempo/key 142.5 / −3, the menu tempos `bpms`, sampler `lead`,
  `clear` chips, master_db per chip; load after the chips, the arranger and `track2-r2.js`),
  `audio/style-loungechip.js` (Lounge (Chipped): Lounge's notes via `MUSIC.loungeEvents`, which mirrors
  `audio/style-lounge.js` call for call, keep them in step, played by one chip; its `lc_<chip>` scores are derived at
  build), `intro-motif.md` (the authoritative score of the Their Finest Duds intro motif, already built into
  `music.js`; keep it as the spec).
- **CD-ROM-born but SHARED** (the jukebox and the five audio tools load them, so a change needs `tools/regress.py`;
  see `audio/CLAUDE.md`): `audio/chips.js`, `audio/style-chip.js`, `score/cdrom-{fm,tia,beep,snes,arcade}.json`,
  `audio/instruments-cdrom.js`, `audio/style-lounge.js`, `score/encyclopedia-lounge.json`.
- **Closed history** (open only if Bryan asks): `sketch.js`.
- **Font licenses:** `fonts/OFL-VT323.txt`, `fonts/OFL-PixelifySans.txt`, `fonts/OFL-Jacquard24.txt`,
  `fonts/OFL-AtkinsonHyperlegible.txt`.

## Build
- Run `tools/build_cdrom.py` → `dist/cdrom-player.html`. It downloads VT323 / Pixelify / Atkinson / Jacquard 24 into
  `fonts/`, takes Source Code Pro from `channel-d.html`, embeds the audio library + chip/lounge/overclock scores (+ the
  derived `lc_<chip>` scores) and injects the add-ons. `PATCHES` and `MUSIC_PATCHES` are empty: new edits go straight
  into the sources.
- Then `tools/cdrom_ambient.py` → `dist/cdrom-ambient.html` (no cards, so no Dud speech; `CM.next=Infinity` keeps
  Starfield's hyperspace; red AMBIENT_VER rubber stamp on the boot card, knobs `STAMP_*` at the top).
- `LOUNGE_CHIPPED_TRIM` in `tools/build_cdrom.py` must match `tools/build.py`'s.
- Publishing: copy both builds into `players/` (`tools/CLAUDE.md`).
