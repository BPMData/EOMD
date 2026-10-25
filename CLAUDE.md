# CLAUDE.md

Motion-design projects for Bryan Murphy (Danbury HS teacher). Deliverables are self-contained HTML players for classroom and hallway screens, with synthesized music.

Read `STATUS.md` at the start of every session (what's approved, what's unheard, what's next) and update it at the end of a working session.

## Bryan's rules (non-negotiable)
- **Python scripts Bryan runs are Thonny-friendly:** run with the Run button, no command-line arguments, every setting a variable in a `SETTINGS` block at the top.
- **Players are single offline HTML files:** fonts, data, audio code and images inlined; nothing loads from the internet; no remote fonts or images.
- **Poster copy is word for word:** card and poster text comes from the copy files (`proj/cs/copy.md`, `proj/ex/copy.md`, ...) exactly as written. Don't reword, shorten or "fix" it. ES/PT translations Claude drafted are marked as drafts in `STATUS.md`.
- **Never invent facts:** names, dates, programs, campuses, pathways, numbers. If it isn't in a brief, copy file or config, ask.
- **Edit in place, commit per stage:** change the source files directly (no patcher scripts), and commit at the end of each stage or delivered change with a message that says what changed.

## New pieces: interview first
Before starting any NEW piece (a new video, poster or player; not a change to an existing one), interview the client and get a brief approved: follow `brief/INTERVIEW.md` (`/new-piece` starts it). A one-line request is the start of the interview, not the brief: most of the job is finding out what the client actually needs.
- **Order:** interview in rounds (the ★ questions every time) → `proj/<name>/brief.md` from `brief/TEMPLATE.md` → the client approves it → 2–3 concepts → storyboard + stills → build. No design work before the brief is approved.
- **The mode question is in round 1,** asked in the client's terms: **"Quick and low-cost, built from ready-made parts (efficient mode), or a one-off design made from scratch, slower and costlier (full creative mode)?"**
- **The existing cartridges, scores, styles and palettes are examples of what the tools can do, not a menu.** None of them is the default or the expected answer for a new piece. Take ideas from them; never reach for one just because it's there.
- **Efficient mode** still means fitting the subject: pick (or tune) visuals and music that suit the piece's topic and audience. Never reuse music written for another piece (e.g. the hallway film's music, built around the seven academies) unless Bryan asks for it.
- **Full creative mode designs before it picks tools.** Concept, storyboard and stills come from the brief alone, before opening `gen/`, the cartridges or other pieces' code. The craft bar is section 14 of `brief/TEMPLATE.md` (taken from the Academies brief, `brief/example-academies.md`). New gen layers, new music (a new score, or a new `audio/style-*.js`), the timeline engine (`engine/`) or a player written from scratch are all fair game; spend the tokens. Reuse the plumbing (DSP, render and export tools), never another piece's look.
- **Music for a one-off piece is scored to its picture.** Write a `proj/<name>/music.js` (fixed length, hits on the cartridge's moments; `proj/pltw/music.js` is the model) and render it with `tools/render_piece.py`; don't borrow another piece's score.

## Working rules
- Open only the files the task needs; the file sets below say which. Don't read `engine/` for living or jukebox work (except `engine/src/audio/dsp.js` for DSP internals).
- Don't read `dist/` builds (big, mostly base64 fonts) unless the task is debugging a build. The same goes for whole-file reads of `academies-film/danbury-academies-player.html` (~395 KB): search it, read the part you need.
- A change to a shared audio file needs `tools/regress.py` SAVE BASELINE first and CHECK after The baseline (`tests/hashes.json`, 93 sections) was made with Node 22 and CI runs CHECK on every push; Node 26 on the Mac doesn't match it (see the Regression bullet in `STATUS.md`), so on the Mac point `NODE_EXE` at Node 22 or let CI check.

## Files by piece
- **CD-ROM screensaver (CS Lab Screensaver):**
  - Player: `proj/cdrom/player-src.html`, `proj/cdrom/addons.js`, `proj/cdrom/music.js`, `proj/cdrom/brief.md`, `proj/cdrom/cards.md`, `proj/cdrom/dud.js`, `proj/cdrom/channel-d.html` (only as the Source Code Pro source), `tools/build_cdrom.py`, `tools/cdrom_ambient.py`
  - Its music: `proj/cdrom/track2-r2.js`, `audio/style-overclock.js`, `score/cdrom-overclock.json`, `audio/style-loungechip.js`, `proj/cdrom/intro-motif.md` (spec for the intro motif)
  - Closed history (open only if Bryan asks): `proj/cdrom/sketch.js`
  - Font licenses: `fonts/OFL-VT323.txt`, `fonts/OFL-PixelifySans.txt`, `fonts/OFL-Jacquard24.txt`, `fonts/OFL-AtkinsonHyperlegible.txt`
- **CD-ROM-born but SHARED** (the jukebox and the five audio tools load them, so a change here needs `tools/regress.py`): `audio/chips.js`, `audio/style-chip.js`, `score/cdrom-fm.json`, `score/cdrom-tia.json`, `score/cdrom-beep.json`, `score/cdrom-snes.json`, `score/cdrom-arcade.json`, `audio/instruments-cdrom.js`, `audio/style-lounge.js`, `score/encyclopedia-lounge.json`
- **Living posters (SSR, CS, Exploration):** `living/*`, `proj/ssr/*`, `proj/cs/copy.md`, `proj/ex/copy.md`, `proj/academies/brand.md` (Exploration colors), `tools/build.py`, `tools/hershey_words.py`; fonts Bagel Fat One, EB Garamond, Source Code Pro
- **Academies hallway film:** `academies-film/` (see below), `proj/academies/brand.md`, `proj/academies/heroes.js`, `proj/academies/icons-new.js`; its music: `audio/instruments-film.js`, `audio/style-film24.js`, `audio/style-rounds.js`, `score/academies-hallway.json`, `score/corporate-calm.json`
- **gen (generative motion library):** everything under `gen/`. Start from `gen/README.md` and `gen/API.md`. Export (HTML / MP4): `tools/gen_export.py`
- **PLTW CSE promo (gen cartridge `pltw-cse`):** `gen/carts/pltw-cse.json`, its score `proj/pltw/music.js` (rendered by `tools/render_piece.py` to `gen/audio/pltw-cse.mp3`)
- **Music + jukebox (any piece's audio):** `audio/instruments.js`, `audio/arranger.js`, `audio/style-comp4.js`, `engine/src/audio/dsp.js`, `score/FORMAT.md`, `score/*.json`, `jukebox/template.html`, `tools/calibrate.py`, `tools/midi.py`, `tools/porter.py`, `tools/regress.py`, `tests/hashes.json`, `notes/audio-ports.md`
- **Any piece, video:** `tools/html_to_mp4.py`

## Folder layout
Real folders (the flat `__` file names were turned into folders on Oct 20, 2026; old notes may still use them: `audio__style-lounge.js` = `audio/style-lounge.js`): `audio/` (instruments, arranger, styles), `score/` (music cartridges + `FORMAT.md`), `tools/` (the Python scripts Bryan runs; each resolves paths from the repo root, its parent folder), `proj/<piece>/` (one piece's brief, copy and sources), `brief/` (how a new piece starts: the client interview, the brief template, the Academies brief as the example), `.claude/skills/new-piece/` (`/new-piece`), `living/` (living-poster engine), `jukebox/`, `engine/` (starter engine, a real tree: `engine/src/audio/dsp.js`), `fonts/` (OFL TTFs `tools/build_cdrom.py` downloads + every `OFL-*.txt` license), `notes/`, `tests/` (regression baseline), `academies-film/`, `gen/`, `players/` (published copies of the finished builds, in git, so a clone plays out of the box), `media/` (README images, e.g. `pltw-cse-preview.jpg` cut from the MP4), `.github/` (CI workflow, issue templates), `dist/` (builds, git-ignored), `font_cache/` (`tools/build.py`'s font cache, git-ignored).

### academies-film/
- **`danbury-academies-player.html` is the MASTER for the Academies film.** It has the 8 animated hero marks, the 21 redrawn pathway icons and the trilingual word blocks on all 7 academies. Edit this file directly. Its config sits in it TWICE (the visuals' copy and the audio worker's copy in `<script type="text/plain" id="dhs-audio-src">`); a config edit must change both.
- `source/` is the older Sep 29 source tree (`config.js`, `src/`, `tools/`, `README.md`, `docs/SCRIPT.md`). It **lacks** the heroes, new icons and word blocks, so don't rebuild the player from it (that would undo them).

### gen/
Generative motion graphics as small JSON cartridges (Truchet, 3D dot meshes, flow fields, Julia sets, kinetic type, Dust Type ...). `gen/README.md` is the overview for people; `gen/API.md` is the one-page reference for Claude. Read those (and the generated `gen/KNOBS.md`), not `gen/layers/*.js`, unless adding or fixing a layer. `gen/carts/private/` holds cartridges that can't be published (e.g. lyrics from a commercial record).

## File map
| File(s) | What it is | Open when |
|---|---|---|
| `index.html` | Landing page of the GitHub Pages site (bpmdata.github.io/EOMD): links to every player. `.nojekyll` must stay, or Pages hides `gen/carts/_bundle.js` | Adding or renaming a player |
| `CONTRIBUTING.md`, `.github/ISSUE_TEMPLATE/` | How outsiders contribute (cartridges, scores, layers, fixes; PR checklist; AI-written work welcome); bug + cartridge-idea issue forms | Changing the contribution rules |
| `.github/workflows/ci.yml` | CI on every push and PR: gen build + smoke test, and the audio regression CHECK (Node 22) | Changing what CI checks |
| `README.md`, `LICENSE` | The public face of the repo (github.com/BPMData/EOMD): what EOMD is, how to try it, build, make an MP4; MIT. Keep the README true when tools or builds change | Changing how people use or build it |
| `STATUS.md` | Current status, music direction, known limits, next steps, open taste questions | Start of every session |
| `brief/INTERVIEW.md`, `brief/TEMPLATE.md`, `brief/example-academies.md` | The client interview (questions, how to ask, what happens after), the fill-in brief with the default craft bar and QA, and Bryan's Academies prompt as the model brief | Starting any new piece |
| `proj/<name>/*` | One piece's brief, decisions, source copy | Working on that piece |
| `audio/instruments.js` | Shared instrument library, reading-room voices (rhodes, vibes, pad, bass, piano, flute, chime, stream) | Changing or adding sounds |
| `audio/instruments-film.js` | The hallway film's voices, added to the same `INSTR` (kick, snap, shaker, woodblock, tine, marimba, pluck, pulse, keys, mallet, voice, whistle, filmBass/filmPad/filmChime). Load right after `audio/instruments.js` | Changing film24/rounds sounds |
| `audio/instruments-cdrom.js` | CD-ROM voices, added to the same `INSTR` (fmEP, slap, brass, bleep, fmBell, fretless, lyricon, triBass, loungeVibes; drums hat, snare, clap, rim, chipKick, chipNoise). Only new names, so loading it never changes other scores. Load after `audio/instruments-film.js` | Changing Lounge sounds |
| `audio/arranger.js` | Arranger core (~16 lines): `sectionLen`, `section` dispatcher on `score.style` (unknown → comp4), `run`, `bind`, `loopSections` | Adding a style; changing the API |
| `audio/style-*.js` | One file per arranger style, each registers `MUSIC.styles.<name>`: `comp4` (endless, generative), `film24` (fixed seamless loop), `rounds` (20-min study loop), `lounge` (Encyclopedia Lounge: endless seeded bossa, head + generative choruses, key lifts; also exposes `MUSIC.loungePlan`). Load after the core. Full order: dsp, instruments, instruments-film, instruments-cdrom, chips, arranger, styles | Changing how one style arranges music |
| `audio/chips.js`, `audio/style-chip.js` | CD-ROM era sound chips (`fm`, `tia`, `beep`, `snes`, `arcade`) and the `chip` style that drives them (`MUSIC.chipEvents` for MIDI). `audio/chips.js` loads before the arranger; it has the opt-in clear sampler (`clear: 1`, `CHIPS.snes.postClear`) and the intro's `pulse` lead (`CHIPS.snes.leads`). Loaded by `tools/build_cdrom.py` and the five tools | CD-ROM chip music |
| `audio/style-loungechip.js` | Style `loungechip` = Lounge (Chipped): Lounge's notes (`MUSIC.loungeEvents`, mirrors `audio/style-lounge.js` call for call; keep them in step) played by one chip (`MUSIC.loungeChipEvents`). Load after the chips and the lounge style. Its `lc_<chip>` scores are derived at build, no score files | Lounge (Chipped) music |
| `proj/cdrom/track2-r2.js` | Track 2 composition engine + the piece **Overclock** (`TRACK2R2`: per-bar chords, melody, twin harmony, slap bass, drums; `chipEvents(chip,bpm,mask,tr)`; C breakdown, D generated solo, piece `overclock-long`). Loaded by the player build and the jukebox | Changing Overclock's notes |
| `audio/style-overclock.js`, `score/cdrom-overclock.json` | Style `overclock`: cuts Overclock into endless 8-bar sections (intro once, then passes incl. `breakC`, `solo`, `liftB`), chip-voiced Dud speech, clear sampler, post EQ. The score holds default tempo/key (142.5, −3), the menu tempos (`bpms`), sampler `lead`, `clear` chips and master_db per chip. Load after the chips, the arranger and `proj/cdrom/track2-r2.js` | Overclock in the player or jukebox |
| `proj/cdrom/intro-motif.md` | The authoritative score of the Their Finest Duds intro motif (already built into `proj/cdrom/music.js`); keep it as the spec | Changing or checking the intro motif |
| `notes/audio-ports.md` | Port proofs: null-test numbers, clipper caveat, what wasn't ported, hallway-level `master_db` values | Only when porting or debugging audio |
| `score/*.json` | Music cartridges: ~2 KB each; one file = a whole 20-min stream | Making or tweaking music |
| `score/FORMAT.md` | Every score field explained (comp4, film24, rounds, lounge) | Before writing a score |
| `living/template.html` | Kells "living poster" engine (continuous growth, fiddlehead text, cursive words), shared by every variant; has the time-left readout (`CLOCK`, `?noclock`) | Continuous/generative visuals |
| `living/sound-timer.js` | Start sound, volume, timer, chime, worker/main-thread music | Player controls |
| `living/README.md` | Living engine architecture, knobs, lessons | Before touching `living/template.html` |
| `living/trio.js` | Trilingual card trios (EN/ES/PT, three fiddleheads), shared by the cs and ex variants; optional per-card `CARDSTYLE` | Card layout for CS or Exploration |
| `living/variant-cs.js` | CS variant: title, Source Code Pro, `TRIO`, CS end card. Injected at the template's VARIANT hook; card copy is parsed from `proj/cs/copy.md` at build | CS poster changes |
| `living/variant-ex.js` | Exploration Seminar variant: academy colors (`CMAP`, `CARDSTYLE`), no end card (`TICKET=null`); card copy parsed from `proj/ex/copy.md` | Exploration poster changes |
| `living/words.json`, `living/words-cs.json`, `living/words-ex.json` | Hershey cursive strokes for vine-written words (ssr / cs / ex); made by `tools/hershey_words.py` (`VARIANT`) | Changing words (regenerate with the tool) |
| `jukebox/template.html` | Plays every score cartridge | Jukebox changes |
| `engine/` | Stripped-down starter of the timeline (cut-based) engine the Academies film grew from (its Node tools run in place: `node engine/tools/build-player.js`). `engine/src/audio/dsp.js` is the DSP that everything uses | Cut-based films; DSP internals |
| `proj/cdrom/player-src.html` | CD-ROM screensaver player source: all five channels, channel titles (`TITLES`, chronological `ORDER`), boot screen (`BOOT_LINES`, `BOOT_AUTO`, `BOOT_CHIME`), Previous/Next Era, the music hooks (bar-line switch, card speech, pause) and the `/*__ADDONS__*/` marker (all folded in Oct 9). Fonts, data, add-ons and the music block are injected at build | CD-ROM visuals; titles; boot taglines |
| `proj/cdrom/addons.js` | Player add-ons injected at `/*__ADDONS__*/`: the timer's time-left readout (`drawClock`, 10-s steps), Their Finest Duds word structures + fighter planes + the speaker's zeppelin (overrides `Desk.prototype` step/draw/spawn/adopt/speaker; knobs `ST_*`, `PL_*`, `SHIP_*`; pixel fins, pods and propellers, knobs `PROP_R`, `PROP_FPS`), and Starfield's space fighter (wraps `Stars.prototype.draw`) | Timer readout; Contour Desk words; airship |
| `proj/cdrom/music.js` | CD-ROM music + speech block: modes Overclock (default) / Chips / Lounge / Lounge (Chipped), segmented tempo grid, chip streams per channel, bar-line crossfades, Overclock Tempo/Key menu, chip-voiced Dud speech, Contour intro. Swapped in for the source's sound block at build | CD-ROM sound |
| `tools/build_cdrom.py` | Builds `dist/cdrom-player.html`: downloads VT323/Pixelify/Atkinson/Jacquard 24 into `fonts/`, takes Source Code Pro from `proj/cdrom/channel-d.html`, embeds the audio library + chip/lounge/overclock scores (+ derived `lc_<chip>` scores), injects the add-ons. `PATCHES` and `MUSIC_PATCHES` are empty (new edits go straight into the sources) | CD-ROM builds |
| `tools/cdrom_ambient.py` | Post-processor, run after `tools/build_cdrom.py`: reads `dist/cdrom-player.html`, writes `dist/cdrom-ambient.html` (no cards, so no Dud speech; `CM.next=Infinity` keeps Starfield's hyperspace; red AMBIENT_VER rubber stamp on the boot card, knobs `STAMP_*` at the top) | Ambient screensaver |
| `tools/build.py` | Builds `dist/living-player*.html` + `dist/jukebox.html` (`TARGETS`, `LIVING_SCORE`, `LIVING_VARIANT` 'ssr' / 'cs' / 'ex'; CS adds `CS_PYTHON`, `CS_CARDS_OFF`). The jukebox also loads the three CD-ROM style files (`JUKEBOX_LIB`: loungechip, track2-r2, overclock) and makes an Overclock and a Lounge (Chipped) cartridge per chip in `JUKEBOX_CHIPS`; `JUKEBOX_SKIP_STYLES = ['chip']` leaves the plain Chips cartridges out; `LOUNGE_CHIPPED_TRIM` must match `tools/build_cdrom.py`'s | Every living/jukebox build |
| `tools/html_to_mp4.py` | Tk GUI: pick a player .html, get an .mp4. FILM players (the Academies master: `DHS.film`) render frame-exact with offline music; STEPPED players (`?manual` + `advance()`: CD-ROM, living posters, gen with `cart=<name>`) are stepped frame by frame and their music is recorded from a real-time run (not locked to the picture). Needs ffmpeg (found automatically, or BROWSE) and Playwright + Chromium | Making a video of any piece |
| `tools/gen_export.py` | Tk GUI for gen: pick a cartridge and a folder (remembered; Desktop at first), MAKE HTML (standalone player with only that cartridge) / MAKE MP4 (frame by frame via `tools/html_to_mp4.py`'s renderer, with the cartridge's `"audio"` track laid in frame-exact) / MAKE BOTH. Calls `gen/build.py`'s `main(only_cart, out_path)` | Any gen video or standalone file |
| `tools/render_piece.py` | Renders a one-off scored piece (`proj/<name>/music.js` setting `PIECE.render(sr)`) to WAV + MP3 at `TARGET_LUFS`, true-peak limited, ffmpeg-checked | After changing a one-off score |
| `proj/pltw/music.js` | "PLTW CSE": the 60-s score for the `pltw-cse` cartridge (120 BPM, A minor, own synths on the DSP, `CUES` = the picture's moments) | Changing that music |
| `tools/regress.py` | Audio regression: renders fixed sections of every score and hashes them (skips styles it doesn't load). SAVE BASELINE before an audio change, CHECK after (must be 0 mismatches). Needs Node | Before and after any change to `audio/*.js` or the DSP |
| `tests/hashes.json` | The regression baseline (93 sections, made with Node 22; the Node version is recorded) | Never by hand; the tool writes it |
| `tools/calibrate.py` | Renders a score, fixes master_db to −23 LUFS, saves WAV/MP3 preview | After any music change |
| `tools/midi.py` | Exports a score (+ seed) to a multitrack .mid by logging the real arranger's notes. Needs Node. Add new style files to its `AUDIO_LIB` | MIDI export |
| `tools/porter.py` | GUI: extract a finished player's audio code, render original vs port, null test, calibrate. Needs Node + ffmpeg | Porting a finished player's music into a score |
| `tools/hershey_words.py` | Makes the `living/words*.json` files for any word list (`VARIANT`) | New cursive words |
| `engine/tools/html_to_mp4.py` | The starter engine's original MP4 script (paths edited by hand); `tools/html_to_mp4.py` replaces it for real use | Never, normally |
| `proj/academies/heroes.js`, `proj/academies/icons-new.js` | Stand-alone sources of the 8 animated hero marks (`DHS.heroes.draw`) and the 21 redrawn pathway icons; both are already inside the master player | Demo sheets, or comparing with the master |
| `fonts/OFL-*.txt` | Font licenses | Shipping a ZIP |

## Defaults
- **Player.** Fullscreen; controls hidden until mouse-move or tap, fading after 3 s; safe-area padding; prefers-reduced-motion respected. Never render MP4 by hand in a sandbox; use `tools/html_to_mp4.py` (it drives `?manual` + `advance()`/`renderAt()`, or `DHS.film.render` for the film).
- **Motion.** Time-based (frame rate never changes speed); `render` is a pure function of time where possible. Nothing flashes more than 3×/s.
- **Loops.** Seam mid-shot, never on a cut.
- **Audio.** Synthesized at 48 kHz and streamed in sections with overlapping tails. Classroom reading music sits at −23 LUFS; hallway films at −16. Peak ≤ −1.5 dBTP. Verify with ffmpeg `ebur128=peak=true:framelog=quiet`. Use a Start sound button (browsers block autoplay audio). Blob workers may be blocked, so always keep the main-thread fallback.
- **Legibility.** Text ≥44 px body / ≥90 px headlines at 1080p for 20 ft viewing. Check WCAG contrast and report honestly. Many students are English learners, so key lines get Spanish and Brazilian Portuguese.

## Process
Stages, each ending in a delivered file and a commit:
0. Interview and approved brief (`brief/INTERVIEW.md`)
1. Sketches or stills
2. Playable visuals
3. Music samples
4. Full player
5. Extras

Rough and early beats polished and lost.

## Builds
- **Living poster or jukebox.** Run `tools/build.py`; choose `TARGETS`, `LIVING_SCORE` and `LIVING_VARIANT` at the top.
- **CD-ROM screensaver.** Run `tools/build_cdrom.py`, then `tools/cdrom_ambient.py` for the ambient version.
- **gen.** `python3 gen/build.py`, then `node gen/tests/smoke.js` (both must pass). `DISPLAY_FONT` (Montserrat Bold) is shared by the `type`, `halftone` and `dust` layers.
- **A gen piece for one video or one screen: `tools/gen_export.py`.** Pick the cartridge, pick a folder, MAKE HTML / MP4 / BOTH. The HTML holds only that cartridge and opens straight into it in presentation mode (`GEN.PRESENT`: no gallery, knobs, cartridge menu or shot skipping; just START, play/pause, fullscreen); the MP4 has the cartridge's music in sync. Don't send Bryan to edit `gen/build.py` or dig in `gen/dist/` (`ONLY_CART` still exists for scripted builds).
- **Academies film.** Edit `academies-film/danbury-academies-player.html` directly (both config copies).
- **Video.** gen: `tools/gen_export.py`. Anything else: `tools/html_to_mp4.py` on the built player.
- **Publishing a build.** `players/` holds copies of `dist/jukebox.html`, `pltw-cse.html` (gen standalone, made with `tools/gen_export.py` or `build.main(only_cart='pltw-cse', out_path='players/pltw-cse.html')`; linked from `index.html`), `cdrom-player.html`, `cdrom-ambient.html`, `living-player.html`, `living-player-cs.html`, `living-player-ex.html` and `gen/dist/gen-player.html`. After rebuilding one of them, copy it into `players/` and commit, so the public copies don't go stale. Only publish a build that loads without script errors.
- **New music.** Copy a `score/*.json`, change it, run `tools/calibrate.py`, then listen to the MP3 before building.
- **Porting a finished player.** Run `tools/porter.py` (extract, render original, render port, null test, calibrate). Making the score is the creative part; if the piece has a new structure it needs a new `audio/style-<name>.js` first.
- **New arranger style.** Copy a style file, register `MUSIC.styles.<name>` (add `.loopSections` for fixed loops), then add the file to the audio list in all five loaders: `tools/build.py` (`AUDIO_LIB` and `STYLES`), `tools/calibrate.py`, `tools/porter.py` (`AUDIO_LIB`), `tools/regress.py` (`AUDIO_LIB`), `tools/midi.py` (`AUDIO_LIB`, plus its voices in `PROGRAMS`/`DRUMS`). `lounge` and `chip` are in all five. Exceptions: `loungechip` and `overclock` live only in the CD-ROM build and the jukebox (`JUKEBOX_LIB`); no score files use them.
- **Audio code change.** `tools/regress.py` SAVE BASELINE first, change, then CHECK.
- **Starter engine.** Follow `engine/README.md` (run its tools from inside `engine/`).

## Tools on the Mac
Node via Homebrew (`/opt/homebrew/bin/node`), ffmpeg at `/opt/homebrew/bin/ffmpeg`. Thonny starts without Homebrew on its PATH, so a script with a `NODE_EXE` or `FFMPEG_EXE` setting may need the full path there (`tools/regress.py` already has it; `tools/html_to_mp4.py` finds ffmpeg itself).
