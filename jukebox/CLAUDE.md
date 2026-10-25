# Jukebox

`template.html` plays every score cartridge. Status, known limits and the pending look redesign: `jukebox/STATUS.md`.
Don't read `engine/` for jukebox work (except `engine/src/audio/dsp.js` for DSP internals); the music library's rules
are in `audio/CLAUDE.md`.

## Build
`tools/build.py` with `dist/jukebox.html` in `TARGETS`. Jukebox-only settings:
- `JUKEBOX_LIB` loads the three CD-ROM style files (`audio/style-loungechip.js`, `proj/cdrom/track2-r2.js`,
  `audio/style-overclock.js`).
- Per chip in `JUKEBOX_CHIPS` it makes an Overclock and a Lounge (Chipped) cartridge; `JUKEBOX_SKIP_STYLES = ['chip']`
  leaves the plain Chips cartridges out.
- `LOUNGE_CHIPPED_TRIM` must match `tools/build_cdrom.py`'s.
Publish by copying `dist/jukebox.html` into `players/` (`tools/CLAUDE.md`).
