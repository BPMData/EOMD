# CLAUDE.md

Motion-design projects for Bryan Murphy (Danbury HS teacher). Deliverables are self-contained HTML players for classroom and hallway screens, with synthesized music.

Read `STATUS.md` at the start of every session (what's approved, what's unheard, what's next) and update it at the end of a working session.

## Bryan's rules (non-negotiable)
- **Python scripts Bryan runs are Thonny-friendly:** run with the Run button, no command-line arguments, every setting a variable in a `SETTINGS` block at the top.
- **Players are single offline HTML files:** fonts, data, audio code and images inlined; nothing loads from the internet; no remote fonts or images.
- **Poster copy is word for word:** card and poster text comes from the copy files (`proj__cs__copy.md`, `proj__ex__copy.md`, ...) exactly as written. Don't reword, shorten or "fix" it. ES/PT translations Claude drafted are marked as drafts in `STATUS.md`.
- **Never invent facts:** names, dates, programs, campuses, pathways, numbers. If it isn't in a brief, copy file or config, ask.
- **Edit in place, commit per stage:** change the source files directly (no patcher scripts), and commit at the end of each stage or delivered change with a message that says what changed.

## Working rules
- Open only the files the task needs; the file sets below say which. Don't read `engine__*` for living or jukebox work (except `engine__src__audio__dsp.js` for DSP internals).
- Don't read `dist/` builds (big, mostly base64 fonts) unless the task is debugging a build. The same goes for whole-file reads of `academies-film/danbury-academies-player.html` (~395 KB): search it, read the part you need.
- A change to a shared audio file needs `tools__regress.py` SAVE BASELINE first and CHECK after (but see the regression note in `STATUS.md`: the baseline isn't settled yet).

## Files by piece
- **CD-ROM screensaver (CS Lab Screensaver):**
  - Player: `proj__cdrom__player-src.html`, `proj__cdrom__addons.js`, `proj__cdrom__music.js`, `proj__cdrom__brief.md`, `proj__cdrom__cards.md`, `proj__cdrom__dud.js`, `proj__cdrom__channel-d.html` (only as the Source Code Pro source), `tools__build_cdrom.py`, `tools__cdrom_ambient.py`
  - Its music: `proj__cdrom__track2-r2.js`, `audio__style-overclock.js`, `score__cdrom-overclock.json`, `audio__style-loungechip.js`, `proj__cdrom__intro-motif.md` (spec for the intro motif)
  - Closed history (open only if Bryan asks): `proj__cdrom__sketch.js`
  - Font licenses: `fonts__OFL-VT323.txt`, `fonts__OFL-PixelifySans.txt`, `fonts__OFL-Jacquard24.txt`, `fonts__OFL-AtkinsonHyperlegible.txt`
- **CD-ROM-born but SHARED** (the jukebox and the five audio tools load them, so a change here needs `tools__regress.py`): `audio__chips.js`, `audio__style-chip.js`, `score__cdrom-fm.json`, `score__cdrom-tia.json`, `score__cdrom-beep.json`, `score__cdrom-snes.json`, `score__cdrom-arcade.json`, `audio__instruments-cdrom.js`, `audio__style-lounge.js`, `score__encyclopedia-lounge.json`
- **Living posters (SSR, CS, Exploration):** `living__*`, `proj__ssr__*`, `proj__cs__copy.md`, `proj__ex__copy.md`, `proj__academies__brand.md` (Exploration colors), `tools__build.py`, `tools__hershey_words.py`; fonts Bagel Fat One, EB Garamond, Source Code Pro
- **Academies hallway film:** `academies-film/` (see below), `proj__academies__brand.md`, `proj__academies__heroes.js`, `proj__academies__icons-new.js`; its music: `audio__instruments-film.js`, `audio__style-film24.js`, `audio__style-rounds.js`, `score__academies-hallway.json`, `score__corporate-calm.json`
- **Dust Type (study piece):** `proj__dust__brief.md`, `proj__dust__player-src.html`, `fonts__OFL-Montserrat.txt`; the gen version is the `dust` layer (`gen/layers/dust.js`, `gen/carts/dust-type.json`)
- **gen (generative motion library):** everything under `gen/`. Start from `gen/README.md` and `gen/API.md`
- **Music + jukebox (any piece's audio):** `audio__instruments.js`, `audio__arranger.js`, `audio__style-comp4.js`, `engine__src__audio__dsp.js`, `score__FORMAT.md`, `score__*.json`, `jukebox__template.html`, `tools__calibrate.py`, `tools__midi.py`, `tools__porter.py`, `tools__regress.py`, `tests__hashes.json`, `notes__audio-ports.md`
- **Any piece, video:** `tools__html_to_mp4.py`

## Folder layout
Mostly flat: in a file name `__` stands for `/` (e.g. `audio__style-lounge.js` = `audio/style-lounge.js`); the build scripts accept both. Real folders: `academies-film/`, `gen/`, `players/` (published copies of the finished builds, in git, so a clone plays out of the box), `fonts/` (OFL TTFs `tools__build_cdrom.py` downloads), `dist/` (builds, git-ignored), `font_cache/` (`tools__build.py`'s font cache, git-ignored).

### academies-film/
- **`danbury-academies-player.html` is the MASTER for the Academies film.** It has the 8 animated hero marks, the 21 redrawn pathway icons and the trilingual word blocks on all 7 academies. Edit this file directly. Its config sits in it TWICE (the visuals' copy and the audio worker's copy in `<script type="text/plain" id="dhs-audio-src">`); a config edit must change both.
- `source/` is the older Sep 29 source tree (`config.js`, `src/`, `tools/`, `README.md`, `docs/SCRIPT.md`). It **lacks** the heroes, new icons and word blocks, so don't rebuild the player from it (that would undo them).

### gen/
Generative motion graphics as small JSON cartridges (Truchet, 3D dot meshes, flow fields, Julia sets, kinetic type, Dust Type ...). `gen/README.md` is the overview for people; `gen/API.md` is the one-page reference for Claude. Read those (and the generated `gen/KNOBS.md`), not `gen/layers/*.js`, unless adding or fixing a layer. `gen/carts/private/` holds cartridges that can't be published (e.g. lyrics from a commercial record).

## File map
| File(s) | What it is | Open when |
|---|---|---|
| `README.md`, `LICENSE` | The public face of the repo (github.com/BPMData/EOMD): what EOMD is, how to try it, build, make an MP4; MIT. Keep the README true when tools or builds change | Changing how people use or build it |
| `STATUS.md` | Current status, music direction, known limits, next steps, open taste questions | Start of every session |
| `proj__<name>__*` | One piece's brief, decisions, source copy | Working on that piece |
| `audio__instruments.js` | Shared instrument library, reading-room voices (rhodes, vibes, pad, bass, piano, flute, chime, stream) | Changing or adding sounds |
| `audio__instruments-film.js` | The hallway film's voices, added to the same `INSTR` (kick, snap, shaker, woodblock, tine, marimba, pluck, pulse, keys, mallet, voice, whistle, filmBass/filmPad/filmChime). Load right after `audio__instruments.js` | Changing film24/rounds sounds |
| `audio__instruments-cdrom.js` | CD-ROM voices, added to the same `INSTR` (fmEP, slap, brass, bleep, fmBell, fretless, lyricon, triBass, loungeVibes; drums hat, snare, clap, rim, chipKick, chipNoise). Only new names, so loading it never changes other scores. Load after `audio__instruments-film.js` | Changing Lounge sounds |
| `audio__arranger.js` | Arranger core (~16 lines): `sectionLen`, `section` dispatcher on `score.style` (unknown → comp4), `run`, `bind`, `loopSections` | Adding a style; changing the API |
| `audio__style-*.js` | One file per arranger style, each registers `MUSIC.styles.<name>`: `comp4` (endless, generative), `film24` (fixed seamless loop), `rounds` (20-min study loop), `lounge` (Encyclopedia Lounge: endless seeded bossa, head + generative choruses, key lifts; also exposes `MUSIC.loungePlan`). Load after the core. Full order: dsp, instruments, instruments-film, instruments-cdrom, chips, arranger, styles | Changing how one style arranges music |
| `audio__chips.js`, `audio__style-chip.js` | CD-ROM era sound chips (`fm`, `tia`, `beep`, `snes`, `arcade`) and the `chip` style that drives them (`MUSIC.chipEvents` for MIDI). `audio__chips.js` loads before the arranger; it has the opt-in clear sampler (`clear: 1`, `CHIPS.snes.postClear`) and the intro's `pulse` lead (`CHIPS.snes.leads`). Loaded by `tools__build_cdrom.py` and the five tools | CD-ROM chip music |
| `audio__style-loungechip.js` | Style `loungechip` = Lounge (Chipped): Lounge's notes (`MUSIC.loungeEvents`, mirrors `audio__style-lounge.js` call for call; keep them in step) played by one chip (`MUSIC.loungeChipEvents`). Load after the chips and the lounge style. Its `lc_<chip>` scores are derived at build, no score files | Lounge (Chipped) music |
| `proj__cdrom__track2-r2.js` | Track 2 composition engine + the piece **Overclock** (`TRACK2R2`: per-bar chords, melody, twin harmony, slap bass, drums; `chipEvents(chip,bpm,mask,tr)`; C breakdown, D generated solo, piece `overclock-long`). Loaded by the player build and the jukebox | Changing Overclock's notes |
| `audio__style-overclock.js`, `score__cdrom-overclock.json` | Style `overclock`: cuts Overclock into endless 8-bar sections (intro once, then passes incl. `breakC`, `solo`, `liftB`), chip-voiced Dud speech, clear sampler, post EQ. The score holds default tempo/key (142.5, −3), the menu tempos (`bpms`), sampler `lead`, `clear` chips and master_db per chip. Load after the chips, the arranger and `proj__cdrom__track2-r2.js` | Overclock in the player or jukebox |
| `proj__cdrom__intro-motif.md` | The authoritative score of the Their Finest Duds intro motif (already built into `proj__cdrom__music.js`); keep it as the spec | Changing or checking the intro motif |
| `notes__audio-ports.md` | Port proofs: null-test numbers, clipper caveat, what wasn't ported, hallway-level `master_db` values | Only when porting or debugging audio |
| `score__*.json` | Music cartridges: ~2 KB each; one file = a whole 20-min stream | Making or tweaking music |
| `score__FORMAT.md` | Every score field explained (comp4, film24, rounds, lounge) | Before writing a score |
| `living__template.html` | Kells "living poster" engine (continuous growth, fiddlehead text, cursive words), shared by every variant; has the time-left readout (`CLOCK`, `?noclock`) | Continuous/generative visuals |
| `living__sound-timer.js` | Start sound, volume, timer, chime, worker/main-thread music | Player controls |
| `living__README.md` | Living engine architecture, knobs, lessons | Before touching `living__template.html` |
| `living__trio.js` | Trilingual card trios (EN/ES/PT, three fiddleheads), shared by the cs and ex variants; optional per-card `CARDSTYLE` | Card layout for CS or Exploration |
| `living__variant-cs.js` | CS variant: title, Source Code Pro, `TRIO`, CS end card. Injected at the template's VARIANT hook; card copy is parsed from `proj__cs__copy.md` at build | CS poster changes |
| `living__variant-ex.js` | Exploration Seminar variant: academy colors (`CMAP`, `CARDSTYLE`), no end card (`TICKET=null`); card copy parsed from `proj__ex__copy.md` | Exploration poster changes |
| `living__words.json`, `living__words-cs.json`, `living__words-ex.json` | Hershey cursive strokes for vine-written words (ssr / cs / ex); made by `tools__hershey_words.py` (`VARIANT`) | Changing words (regenerate with the tool) |
| `jukebox__template.html` | Plays every score cartridge | Jukebox changes |
| `engine__*` | Stripped-down starter of the timeline (cut-based) engine the Academies film grew from; `tools__unpack.py` rebuilds its folder tree. `engine__src__audio__dsp.js` is the DSP that everything uses | Cut-based films; DSP internals |
| `proj__cdrom__player-src.html` | CD-ROM screensaver player source: all five channels, channel titles (`TITLES`, chronological `ORDER`), boot screen (`BOOT_LINES`, `BOOT_AUTO`, `BOOT_CHIME`), Previous/Next Era, the music hooks (bar-line switch, card speech, pause) and the `/*__ADDONS__*/` marker (all folded in Oct 9). Fonts, data, add-ons and the music block are injected at build | CD-ROM visuals; titles; boot taglines |
| `proj__cdrom__addons.js` | Player add-ons injected at `/*__ADDONS__*/`: the timer's time-left readout (`drawClock`, 10-s steps), Their Finest Duds word structures + fighter planes + the speaker's zeppelin (overrides `Desk.prototype` step/draw/spawn/adopt/speaker; knobs `ST_*`, `PL_*`, `SHIP_*`; pixel fins, pods and propellers, knobs `PROP_R`, `PROP_FPS`), and Starfield's space fighter (wraps `Stars.prototype.draw`) | Timer readout; Contour Desk words; airship |
| `proj__cdrom__music.js` | CD-ROM music + speech block: modes Overclock (default) / Chips / Lounge / Lounge (Chipped), segmented tempo grid, chip streams per channel, bar-line crossfades, Overclock Tempo/Key menu, chip-voiced Dud speech, Contour intro. Swapped in for the source's sound block at build | CD-ROM sound |
| `tools__build_cdrom.py` | Builds `dist/cdrom-player.html`: downloads VT323/Pixelify/Atkinson/Jacquard 24 into `fonts/`, takes Source Code Pro from `proj__cdrom__channel-d.html`, embeds the audio library + chip/lounge/overclock scores (+ derived `lc_<chip>` scores), injects the add-ons. `PATCHES` and `MUSIC_PATCHES` are empty (new edits go straight into the sources) | CD-ROM builds |
| `tools__cdrom_ambient.py` | Post-processor, run after `tools__build_cdrom.py`: reads `dist/cdrom-player.html`, writes `dist/cdrom-ambient.html` (no cards, so no Dud speech; `CM.next=Infinity` keeps Starfield's hyperspace; red AMBIENT_VER rubber stamp on the boot card, knobs `STAMP_*` at the top) | Ambient screensaver |
| `tools__build.py` | Builds `dist/living-player*.html` + `dist/jukebox.html` (`TARGETS`, `LIVING_SCORE`, `LIVING_VARIANT` 'ssr' / 'cs' / 'ex'; CS adds `CS_PYTHON`, `CS_CARDS_OFF`). The jukebox also loads the three CD-ROM style files (`JUKEBOX_LIB`: loungechip, track2-r2, overclock) and makes an Overclock and a Lounge (Chipped) cartridge per chip in `JUKEBOX_CHIPS`; `JUKEBOX_SKIP_STYLES = ['chip']` leaves the plain Chips cartridges out; `LOUNGE_CHIPPED_TRIM` must match `tools__build_cdrom.py`'s | Every living/jukebox build |
| `tools__html_to_mp4.py` | Tk GUI: pick a player .html, get an .mp4. FILM players (the Academies master: `DHS.film`) render frame-exact with offline music; STEPPED players (`?manual` + `advance()`: CD-ROM, living posters, Dust Type, gen with `cart=<name>`) are stepped frame by frame and their music is recorded from a real-time run (not locked to the picture). Needs ffmpeg (found automatically, or BROWSE) and Playwright + Chromium | Making a video of any piece |
| `tools__regress.py` | Audio regression: renders fixed sections of every score and hashes them (skips styles it doesn't load). SAVE BASELINE before an audio change, CHECK after (must be 0 mismatches). Needs Node | Before and after any change to `audio__*.js` or the DSP |
| `tests__hashes.json` | The regression baseline (27 sections, Node version recorded) | Never by hand; the tool writes it |
| `tools__calibrate.py` | Renders a score, fixes master_db to −23 LUFS, saves WAV/MP3 preview | After any music change |
| `tools__midi.py` | Exports a score (+ seed) to a multitrack .mid by logging the real arranger's notes. Needs Node. Add new style files to its `AUDIO_LIB` | MIDI export |
| `tools__porter.py` | GUI: extract a finished player's audio code, render original vs port, null test, calibrate. Needs Node + ffmpeg | Porting a finished player's music into a score |
| `tools__hershey_words.py` | Makes the `living__words*.json` files for any word list (`VARIANT`) | New cursive words |
| `tools__unpack.py` | Rebuilds the real folder tree from `engine__*` | Running the starter engine's Node tools |
| `engine__tools__html_to_mp4.py` | The starter engine's original MP4 script (paths edited by hand); `tools__html_to_mp4.py` replaces it for real use | Never, normally |
| `proj__academies__heroes.js`, `proj__academies__icons-new.js` | Stand-alone sources of the 8 animated hero marks (`DHS.heroes.draw`) and the 21 redrawn pathway icons; both are already inside the master player | Demo sheets, or comparing with the master |
| `proj__dust__player-src.html` | Dust Type standalone source (`/*__FONT__*/` placeholder in the `@font-face`; build steps in `proj__dust__brief.md`, no build script yet) | Dust Type standalone |
| `fonts__OFL-*.txt` | Font licenses | Shipping a ZIP |

## Defaults
- **Player.** Fullscreen; controls hidden until mouse-move or tap, fading after 3 s; safe-area padding; prefers-reduced-motion respected. Never render MP4 by hand in a sandbox; use `tools__html_to_mp4.py` (it drives `?manual` + `advance()`/`renderAt()`, or `DHS.film.render` for the film).
- **Motion.** Time-based (frame rate never changes speed); `render` is a pure function of time where possible. Nothing flashes more than 3×/s.
- **Loops.** Seam mid-shot, never on a cut.
- **Audio.** Synthesized at 48 kHz and streamed in sections with overlapping tails. Classroom reading music sits at −23 LUFS; hallway films at −16. Peak ≤ −1.5 dBTP. Verify with ffmpeg `ebur128=peak=true:framelog=quiet`. Use a Start sound button (browsers block autoplay audio). Blob workers may be blocked, so always keep the main-thread fallback.
- **Legibility.** Text ≥44 px body / ≥90 px headlines at 1080p for 20 ft viewing. Check WCAG contrast and report honestly. Many students are English learners, so key lines get Spanish and Brazilian Portuguese.

## Process
Stages, each ending in a delivered file and a commit:
1. Sketches or stills
2. Playable visuals
3. Music samples
4. Full player
5. Extras

Rough and early beats polished and lost.

## Builds
- **Living poster or jukebox.** Run `tools__build.py`; choose `TARGETS`, `LIVING_SCORE` and `LIVING_VARIANT` at the top.
- **CD-ROM screensaver.** Run `tools__build_cdrom.py`, then `tools__cdrom_ambient.py` for the ambient version.
- **gen.** `python3 gen/build.py`, then `node gen/tests/smoke.js` (both must pass). `DISPLAY_FONT` (Montserrat Bold) is shared by the `type`, `halftone` and `dust` layers.
- **Dust Type standalone.** No script yet: subset Montserrat Bold and base64 it into the `/*__FONT__*/` placeholder (steps in `proj__dust__brief.md`).
- **Academies film.** Edit `academies-film/danbury-academies-player.html` directly (both config copies).
- **Video.** Run `tools__html_to_mp4.py` on any built player.
- **Publishing a build.** `players/` holds copies of `dist/jukebox.html`, `cdrom-player.html`, `cdrom-ambient.html`, `living-player.html`, `living-player-cs.html`, `living-player-ex.html` and `gen/dist/gen-player.html`. After rebuilding one of them, copy it into `players/` and commit, so the public copies don't go stale. Only publish a build that loads without script errors.
- **New music.** Copy a `score__*.json`, change it, run `tools__calibrate.py`, then listen to the MP3 before building.
- **Porting a finished player.** Run `tools__porter.py` (extract, render original, render port, null test, calibrate). Making the score is the creative part; if the piece has a new structure it needs a new `audio__style-<name>.js` first.
- **New arranger style.** Copy a style file, register `MUSIC.styles.<name>` (add `.loopSections` for fixed loops), then add the file to the audio list in all five loaders: `tools__build.py` (`AUDIO_LIB` and `STYLES`), `tools__calibrate.py`, `tools__porter.py` (`AUDIO_LIB`), `tools__regress.py` (`AUDIO_LIB`), `tools__midi.py` (`AUDIO_LIB`, plus its voices in `PROGRAMS`/`DRUMS`). `lounge` and `chip` are in all five. Exceptions: `loungechip` and `overclock` live only in the CD-ROM build and the jukebox (`JUKEBOX_LIB`); no score files use them.
- **Audio code change.** `tools__regress.py` SAVE BASELINE first, change, then CHECK.
- **Starter engine.** Run `tools__unpack.py`, then follow `engine__README.md`.

## Tools on the Mac
Node via Homebrew (`/opt/homebrew/bin/node`), ffmpeg at `/opt/homebrew/bin/ffmpeg`. Thonny starts without Homebrew on its PATH, so a script with a `NODE_EXE` or `FFMPEG_EXE` setting may need the full path there (`tools__regress.py` already has it; `tools__html_to_mp4.py` finds ffmpeg itself).
