# 00_CLAUDE.md: read this first, every chat

Motion-design projects for Bryan Murphy (Danbury HS teacher). Deliverables are self-contained HTML players for classroom and hallway screens, with synthesized music.

## Files by piece (read this before opening anything)
Each chat works on ONE piece. Use only that piece's set (plus `00_HANDOFF.md`); every other file is invisible: don't search, read or summarise it, even if `project_search` returns it. The detailed table below says what each file does.

- **CD-ROM screensaver ONLY** (ignore unless the task is the CD-ROM player):
  - Player: `proj__cdrom__player-src.html`, `proj__cdrom__addons.js`, `proj__cdrom__music.js`, `proj__cdrom__brief.md`, `proj__cdrom__cards.md`, `proj__cdrom__channel-d.html` (only as the Source Code Pro source), `tools__build_cdrom.py`
  - Its music: `proj__cdrom__track2-r2.js`, `audio__style-overclock.js`, `score__cdrom-overclock.json`, `audio__style-loungechip.js`
  - Closed history (open only if Bryan asks): `proj__cdrom__sketch.js`, `proj__cdrom__dud.js`, `proj__cdrom__audition.js`, `proj__cdrom__audition2.js`, `proj__cdrom__audition3.js`, `proj__cdrom__audition-chips.js`, every `proj__cdrom__track2-*` except `-r2.js`, `tools__build_track2.py`
  - Font licenses (ZIP only): `fonts__OFL-VT323.txt`, `fonts__OFL-PixelifySans.txt`, `fonts__OFL-Jacquard24.txt`, `fonts__OFL-AtkinsonHyperlegible.txt`
  - Spent, never open: `tools__patch_*.py`, `tools__fold_cdrom.py`
- **CD-ROM-born but SHARED** (the jukebox and the five audio tools load them, so a change here needs `tools__regress.py`): `audio__chips.js`, `audio__style-chip.js`, `score__cdrom-fm.json`, `score__cdrom-tia.json`, `score__cdrom-beep.json`, `score__cdrom-snes.json`, `score__cdrom-arcade.json`, `audio__instruments-cdrom.js`, `audio__style-lounge.js`, `score__encyclopedia-lounge.json`
- **Living posters (SSR, CS, Exploration):** `living__*` (template, README, sound-timer, trio, variants, words JSONs), `proj__ssr__*`, `proj__cs__copy.md`, `proj__ex__copy.md`, `proj__academies__brand.md` (Exploration colors), `tools__build.py`, `tools__rebuild_living.py`, `tools__hershey_words.py`; fonts Bagel Fat One, EB Garamond, Source Code Pro
- **Academies hallway film (timeline engine):** `engine__*`, `tools__unpack.py`, `proj__academies__brand.md`, `audio__instruments-film.js`, `audio__style-film24.js`, `audio__style-rounds.js`, `score__academies-hallway.json`, `score__corporate-calm.json`
- **Music + jukebox (any piece's audio):** `audio__instruments.js`, `audio__arranger.js`, `audio__style-comp4.js`, `engine__src__audio__dsp.js`, `score__FORMAT.md`, `score__*.json`, `jukebox__template.html`, `tools__calibrate.py`, `tools__midi.py`, `tools__porter.py`, `tools__regress.py`, `tests__hashes.json`, `notes__audio-ports.md`
- **Project-wide, one-off:** `tools__sync_check.py` (pre-move check)

## File layout (flat; `__` means `/`)
Project knowledge has no folders, so the prefix is the folder. Open only what the task needs; this map says which.

| File(s) | What it is | Open when |
|---|---|---|
| `00_HANDOFF.md` | Current status and next steps | Start of every chat |
| `proj__<name>__*` | One piece's brief, decisions, source copy | Working on that piece |
| `audio__instruments.js` | Shared instrument library, reading-room voices (rhodes, vibes, pad, bass, piano, flute, chime, stream) | Changing or adding sounds |
| `audio__instruments-film.js` | The hallway film's voices, added to the same `INSTR` (kick, snap, shaker, woodblock, tine, marimba, pluck, pulse, keys, mallet, voice, whistle, filmBass/filmPad/filmChime). Load right after `audio__instruments.js` | Changing film24/rounds sounds |
| `audio__instruments-cdrom.js` | CD-ROM voices, added to the same `INSTR` (fmEP, slap, brass, bleep, fmBell, fretless, lyricon, triBass, loungeVibes; drums hat, snare, clap, rim, chipKick, chipNoise). Only new names, so loading it never changes other scores. Load after `audio__instruments-film.js` | Changing Lounge sounds |
| `audio__arranger.js` | Arranger core (~16 lines): `sectionLen`, `section` dispatcher on `score.style` (unknown → comp4), `run`, `bind`, `loopSections` | Adding a style; changing the API |
| `audio__style-*.js` | One file per arranger style, each registers `MUSIC.styles.<name>`: `comp4` (endless, generative), `film24` (fixed seamless loop), `rounds` (20-min study loop), `lounge` (Encyclopedia Lounge: endless seeded bossa, head + generative choruses, key lifts; also exposes `MUSIC.loungePlan`). Load after the core. Full order: dsp, instruments, instruments-film, instruments-cdrom, chips, arranger, styles | Changing how one style arranges music |
| `audio__chips.js`, `audio__style-chip.js` | CD-ROM era sound chips (`fm`, `tia`, `beep`, `snes`, `arcade`) and the `chip` style that drives them (`MUSIC.chipEvents` for MIDI). `audio__chips.js` loads before the arranger; it has the opt-in clear sampler (`clear: 1`, `CHIPS.snes.postClear`) and the intro's `pulse` lead (`CHIPS.snes.leads`). Loaded by `tools__build_cdrom.py` and the five tools | CD-ROM chip music |
| `audio__style-loungechip.js` | Style `loungechip` = Lounge (Chipped): Lounge's notes (`MUSIC.loungeEvents`, mirrors `audio__style-lounge.js` call for call; keep them in step) played by one chip (`MUSIC.loungeChipEvents`). Load after the chips and the lounge style. Only `tools__build_cdrom.py` loads it; its `lc_<chip>` scores are derived at build, no score files | Lounge (Chipped) music |
| `proj__cdrom__track2-r2.js` | Track 2 composition engine + the piece **Overclock** (`TRACK2R2`: per-bar chords, melody, twin harmony, slap bass, drums; `chipEvents(chip,bpm,mask,tr)`; 9e: C breakdown, D generated solo, piece `overclock-long`). Shared by the audition page and the player | Changing Overclock's notes |
| `audio__style-overclock.js`, `score__cdrom-overclock.json` | Style `overclock`: cuts Overclock into endless 8-bar sections (intro once, then passes incl. `breakC`, `solo`, `liftB`), chip-voiced Dud speech, clear sampler, post EQ. The score holds default tempo/key (142.5, −3), the menu tempos (`bpms`), sampler `lead`, `clear` chips and master_db per chip. Load after the chips, the arranger and `proj__cdrom__track2-r2.js`. Only `tools__build_cdrom.py` loads them | Overclock in the player |
| `proj__cdrom__track2-*`, `tools__build_track2.py` | Track 2 audition pages (rounds 1–3: sketches, Overclock, Belfry) and their Thonny build | Auditioning Track 2 ideas |
| `notes__audio-ports.md` | Port proofs: null-test numbers, clipper caveat, what wasn't ported, hallway-level `master_db` values | Open only when porting or debugging audio |
| `score__*.json` | Music cartridges: ~2 KB each; one file = a whole 20-min stream | Making or tweaking music |
| `score__FORMAT.md` | Every score field explained (comp4, film24, rounds, lounge) | Before writing a score |
| `living__template.html` | Kells "living poster" engine (continuous growth, fiddlehead text, cursive words) | Continuous/generative visuals |
| `living__sound-timer.js` | Start sound, volume, timer, chime, worker/main-thread music | Player controls |
| `living__README.md` | Living engine architecture, knobs, lessons | Before touching `living__template.html` |
| `living__words.json` | Hershey cursive strokes for vine-written words | Changing words (regenerate with the tool) |
| `living__variant-cs.js` | CS variant: trilingual card trios (EN/ES/PT, three fiddleheads), code font, CS end card. Injected at the template's VARIANT hook; card copy is parsed from `proj__cs__copy.md` at build | CS poster changes |
| `living__words-cs.json` | CS code-word cursive (`tools__hershey_words.py`, VARIANT='cs') | Changing CS words |
| `jukebox__template.html` | Plays every score cartridge | Jukebox changes |
| `engine__*` | Timeline (cut-based) engine from the Academies hallway film. `engine__src__audio__dsp.js` is the DSP that everything uses | Cut-based films; DSP internals |
| `proj__cdrom__player-src.html` | CD-ROM screensaver player source, all five channels, plus (since the Oct 9 fold) everything the build used to patch in: channel titles (`TITLES`, chronological `ORDER`), boot screen (`BOOT_LINES`, `BOOT_AUTO`, `BOOT_CHIME`), Previous/Next Era, the music hooks (bar-line switch, card speech, pause) and the `/*__ADDONS__*/` marker. Fonts, data, add-ons and the music block are injected at build | CD-ROM visuals; titles; boot taglines |
| `proj__cdrom__addons.js` | Player add-ons injected at `/*__ADDONS__*/`: the timer's time-left readout (`drawClock`, 10-s steps), Their Finest Duds word structures + fighter planes + the speaker's zeppelin (overrides `Desk.prototype` step/draw/spawn/adopt/speaker; knobs `ST_*`, `PL_*`, `SHIP_*`; 9f pixel fins, pods and propellers, knobs `PROP_R`, `PROP_FPS`), and Starfield's space fighter (wraps `Stars.prototype.draw`) | Timer readout; Contour Desk words; airship |
| `proj__cdrom__music.js` | CD-ROM music + speech block: modes Overclock (default) / Chips / Lounge / Lounge (Chipped), segmented tempo grid, chip streams per channel, bar-line crossfades, Overclock Tempo/Key menu, chip-voiced Dud speech, Contour intro. Swapped in for the source's sound block at build | CD-ROM sound |
| `tools__build_cdrom.py` | Builds `dist/cdrom-player.html`; downloads VT323/Pixelify/Atkinson/Jacquard 24, takes Source Code Pro from `proj__cdrom__channel-d.html`, embeds the audio library + chip/lounge/overclock scores (+ derived `lc_<chip>` scores), injects the add-ons. `PATCHES` and `MUSIC_PATCHES` are empty since the Oct 9 fold (still usable for quick exact-match edits) | CD-ROM builds |
| `tools__patch_*.py`, `tools__fold_cdrom.py` | Spent one-time patchers (loaders, clear sampler, overclock, oct9b, airship) and the Oct 9 fold. All ran on the Mac; delete after the Claude Code move's first commit | Never |
| `tools__sync_check.py` | Read-only pre-move check: Build folder vs the Project's file list (missing, stale, spent, leftovers) | Before the Claude Code move |
| `tools__build.py` | Builds `dist/living-player.html` + `dist/jukebox.html`. Jukebox skips cartridges whose style isn't in its `STYLES` | Every build |
| `tools__regress.py` | Audio regression: renders fixed sections of every score and hashes them (skips styles it doesn't load). SAVE BASELINE before an audio change, CHECK after (must be 0 mismatches). Needs Node | Before and after any change to `audio__*.js` or the DSP |
| `tests__hashes.json` | The regression baseline (27 sections, Node version recorded) | Never by hand; the tool writes it |
| `tools__calibrate.py` | Renders a score, fixes master_db to −23 LUFS, saves WAV/MP3 preview | After any music change |
| `tools__midi.py` | Exports a score (+ seed) to a multitrack .mid by logging the real arranger's notes. Needs Node. Add new style files to its `AUDIO_LIB` | MIDI export |
| `tools__porter.py` | GUI: extract a finished player's audio code, render original vs port, null test, calibrate. Needs Node + ffmpeg | Porting a finished player's music into a score |
| `tools__hershey_words.py` | Makes `living__words.json` for any word list | New cursive words |
| `tools__unpack.py` | Rebuilds the real folder tree from `engine__*` | Running the timeline engine's Node tools |
| `fonts__OFL-*.txt` | Font licenses | Shipping a ZIP |

Finished builds (`dist/`) never go into the Project: they're big, mostly base64 fonts, and every chat would pay to read them.

## Working rules
The non-negotiables live in the Project instructions. Three additions:
- Don't read `engine__*` for living or jukebox work (except `engine__src__audio__dsp.js` for DSP internals).
- Never upload or read `dist/` builds unless editing one.
- **Saving to the Project.** If the Projects tool is available, write delivered files straight to the Project with `project_write` (and still send them to Bryan); otherwise Bryan uploads them. Write once per delivery, not after every tweak (each write re-caches the Project for every chat). A NEW flat filename gets a `claude/` prefix unless the path is given explicitly; overwriting an existing file keeps its name. Every write replaces the whole file, so build it from the current version, and re-read `00_HANDOFF.md` right before rewriting it (another chat may have edited it).

## Defaults
- **Player.** Fullscreen; controls hidden until mouse-move or tap, fading after 3 s; safe-area padding; prefers-reduced-motion respected. No remote fonts or images. Never render MP4 in the sandbox; Bryan captures locally from the HTML (`?manual` + `advance()`/`renderAt()`).
- **Motion.** Time-based (frame rate never changes speed); `render` is a pure function of time where possible. Nothing flashes more than 3×/s.
- **Loops.** Seam mid-shot, never on a cut.
- **Audio.** Synthesized at 48 kHz and streamed in sections with overlapping tails. Classroom reading music sits at −23 LUFS; hallway films at −16. Peak ≤ −1.5 dBTP. Verify with ffmpeg `ebur128=peak=true:framelog=quiet`. Use a Start sound button (browsers block autoplay audio). Artifacts may block blob workers, so always keep the main-thread fallback.
- **Legibility.** Text ≥44 px body / ≥90 px headlines at 1080p for 20 ft viewing. Check WCAG contrast and report honestly. Many students are English learners, so key lines get Spanish and Brazilian Portuguese.

## Process
Stages, each ending in a delivered file:
1. Sketches or stills
2. Playable visuals
3. Music samples
4. Full player
5. Extras

Rough and early beats polished and lost.

## Builds
- **Living poster or jukebox.** Run `tools__build.py`; choose TARGETS, LIVING_SCORE and LIVING_VARIANT ('ssr' or 'cs'; CS adds CS_PYTHON, CS_CARDS_OFF) at the top.
- **CD-ROM screensaver.** Run `tools__build_cdrom.py` (it uses its own folder). The file list is in `00_HANDOFF.md`.
- **New music.** Copy a `score__*.json`, change it, run `tools__calibrate.py`, then listen to the MP3 before building.
- **Porting a finished player.** Run `tools__porter.py` (extract, render original, render port, null test, calibrate). Making the score is the creative part; if the piece has a new structure it needs a new `audio__style-<name>.js` first.
- **New arranger style.** Copy a style file, register `MUSIC.styles.<name>` (add `.loopSections` for fixed loops), then add the file to the audio list in all five loaders: `tools__build.py` (`AUDIO_LIB` and `STYLES`), `tools__calibrate.py`, `tools__porter.py` (`AUDIO_LIB`), `tools__regress.py` (`AUDIO_LIB`), `tools__midi.py` (`AUDIO_LIB`, plus its voices in `PROGRAMS`/`DRUMS`). `lounge` and `chip` are in all five. Exceptions: `loungechip` and `overclock` live only in the CD-ROM build (no cartridges use them).
- **Audio code change.** `tools__regress.py` SAVE BASELINE first, change, then CHECK.
- **Timeline film.** Run `tools__unpack.py`, then follow `engine__README.md` (the Academies font steps are there).
- **Claude Code (planned, Bryan Oct 9).** Bryan is moving this project to Claude Code (a real folder + git) so one session can carry a multi-stage task. Before the move, `tools__sync_check.py` must report "Ready for the move."; then follow Next 1 in `00_HANDOFF.md`.
