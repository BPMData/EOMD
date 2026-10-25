# audio/ (and score/): the music library

Every player's synthesized music: shared instruments, the arranger, one file per style, and the score cartridges in
`score/`. **A new one-off piece doesn't borrow another piece's music:** it writes its own `proj/<name>/music.js`
(see `/toolbox`).

Streams are synthesized at 48 kHz in sections with overlapping tails. Loudness targets come from each piece's brief.

## The regression rule (shared audio files)
A change to any file here, to `engine/src/audio/dsp.js`, or to the CD-ROM-born shared files (`audio/chips.js`,
`audio/style-chip.js`, `score/cdrom-*.json`, `audio/instruments-cdrom.js`, `audio/style-lounge.js`,
`score/encyclopedia-lounge.json`) needs `tools/regress.py` SAVE BASELINE first and CHECK after (0 mismatches). The
baseline (`tests/hashes.json`, 93 sections, never edited by hand) was made with Node 22, and CI runs CHECK on every
push; Node 26 on the Mac doesn't match it (`tools/STATUS.md`), so on the Mac point `NODE_EXE` at Node 22 or let CI check.

## Files
| File | What it is |
|---|---|
| `instruments.js` | Shared instrument library, reading-room voices (rhodes, vibes, pad, bass, piano, flute, chime, stream) |
| `instruments-film.js` | The hallway film's voices, added to the same `INSTR` (kick, snap, shaker, woodblock, tine, marimba, pluck, pulse, keys, mallet, voice, whistle, filmBass/filmPad/filmChime). Load right after `instruments.js` |
| `instruments-cdrom.js` | CD-ROM voices, added to the same `INSTR` (fmEP, slap, brass, bleep, fmBell, fretless, lyricon, triBass, loungeVibes; drums hat, snare, clap, rim, chipKick, chipNoise). Only new names, so loading it never changes other scores. Load after `instruments-film.js` |
| `arranger.js` | Arranger core (~16 lines): `sectionLen`, `section` dispatcher on `score.style` (unknown → comp4), `run`, `bind`, `loopSections` |
| `style-*.js` | One file per style, each registers `MUSIC.styles.<name>`: `comp4` (endless, generative), `film24` (fixed seamless loop), `rounds` (20-min study loop), `lounge` (Encyclopedia Lounge: endless seeded bossa, head + generative choruses, key lifts; also `MUSIC.loungePlan`), `chip`, `loungechip`, `overclock` (the last two: `proj/cdrom/CLAUDE.md`) |
| `chips.js`, `style-chip.js` | CD-ROM era sound chips (`fm`, `tia`, `beep`, `snes`, `arcade`) and the `chip` style that drives them (`MUSIC.chipEvents` for MIDI). `chips.js` loads before the arranger; opt-in clear sampler (`clear: 1`, `CHIPS.snes.postClear`), the intro's `pulse` lead (`CHIPS.snes.leads`) |
| `../engine/src/audio/dsp.js` | The DSP everything uses |
| `../score/*.json` | Music cartridges, ~2 KB each; one file = a whole 20-min stream. Every field: `score/FORMAT.md` |

**Load order:** dsp, instruments, instruments-film, instruments-cdrom, chips, arranger, styles.

## Recipes
- **New music for a stream:** copy a `score/*.json`, change it, run `tools/calibrate.py` (sets master_db to the
  target, saves a WAV/MP3 preview), then listen to the MP3 before building. Read `score/FORMAT.md` first.
- **New arranger style:** copy a style file, register `MUSIC.styles.<name>` (add `.loopSections` for fixed loops),
  then add the file to the audio list in all five loaders: `tools/build.py` (`AUDIO_LIB` and `STYLES`),
  `tools/calibrate.py`, `tools/porter.py` (`AUDIO_LIB`), `tools/regress.py` (`AUDIO_LIB`), `tools/midi.py`
  (`AUDIO_LIB`, plus its voices in `PROGRAMS`/`DRUMS`). `lounge` and `chip` are in all five. Exceptions: `loungechip`
  and `overclock` live only in the CD-ROM build and the jukebox (`JUKEBOX_LIB`); no score files use them.
- **Porting a finished player's music into a score:** `tools/porter.py` (extract, render original, render port, null
  test, calibrate). Making the score is the creative part; a new structure needs a new `style-<name>.js` first. Port
  proofs and caveats: `notes/audio-ports.md` (open only when porting or debugging audio).
- **MIDI:** `tools/midi.py` exports a score (+ seed) to a multitrack .mid by logging the real arranger's notes (Node).
  Add new style files to its `AUDIO_LIB`.
