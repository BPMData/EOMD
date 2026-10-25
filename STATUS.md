# STATUS.md: status + next steps (update at the end of each working session)

> **Visitors:** this is the project's working log (what's approved, what's untested, what's next), kept for the people and AI assistants working on it. For what EOMD is and how to use it, start with [README.md](README.md).

_Last updated: Oct 25, 2026 (new pieces start with a client interview and an approved brief: `brief/`). Before that, Oct 20 (open-source pass in the cloud: real folders instead of `__` names, CI, CONTRIBUTING, regression baseline settled for Node 22. Before that: moved to Claude Code: git repo, spent patchers and Track 2 auditions deleted, CLAUDE.md + this file; gen dust layer wired in; `tools/html_to_mp4.py`. Earlier: Oct 15 Dust Type study; 9e Overclock long form; 9f airship parts; 9g PATCHES folded into the player source; 9h ambient screensaver + CD-ROM music in the jukebox (not yet run); living posters' time-left readout; Academies film heroes, icons and word blocks)_

## Status
- **New pieces start with a client interview (Oct 25, Claude Code in the cloud; branch `ccr-1a9f3c89-1xqwn8`).** Bryan's
  worry: the cartridges made pieces cheaper, but the repo could no longer make another Academies film. Finding: the
  Academies film came from Bryan's ~1,800-word prompt (Claude web UI, no project files), a blank page and a written craft
  bar, not from a toolkit; PLTW had no brief at all, and a new-piece session here opens with ~8,500 words about other pieces.
  New:
  - `brief/INTERVIEW.md`: how to interview the client (rounds of 2–3 questions; ★ questions every time, both modes; ask
    about the problem, in experience terms; vague words turned into choices; landmines; facts with sources; delegation
    only for creative areas), then brief → approval → 2–3 concepts → design before tools (full creative mode).
  - `brief/TEMPLATE.md`: 19 sections + a Decisions log; the default craft bar (§14) and QA list (§17) are generalized from
    the Academies prompt.
  - `brief/example-academies.md`: Bryan's Academies prompt, word for word.
  - `/new-piece` skill (`.claude/skills/new-piece/SKILL.md`) starts the interview.
  - CLAUDE.md "New pieces" rewritten (interview first; the efficient/full creative question is in round 1; full creative
    designs before picking tools; the "words inside the picture" rule removed, Bryan: "should stay dead");
    Process gains stage 0. README, CONTRIBUTING, `gen/API.md` and `engine/README.md` point to it.
  - Mode question for a non-technical Pro user, in usage terms (Bryan, Oct 25): ready-made styles ≈ 5–20% of one
    5-hour limit; from scratch ≈ half to all of one, best started before the limit resets or before stepping away.
    No dollar estimates (pay-per-use developers are on their own). Rough: each brief logs its real usage; replace the
    ranges after three pieces per mode. Interview questions go in everyday words ("church tag sale" test).
  Not yet tried on a real piece.
- **Open-source pass (Oct 20, Claude Code in the cloud; branch `claude/loving-mccarthy-83ac1l`, one PR into main).**
  Bryan approved all four parts:
  - **Real folders.** The ~95 flat files moved with `git mv` (history follows: the rename commit changes no content):
    `audio/`, `score/` (+ `FORMAT.md`), `tools/`, `proj/<piece>/` (academies, cdrom, cs, ex, pltw, ssr), `living/`, `jukebox/`,
    `engine/` (now the real tree: `engine/src/audio/dsp.js`), `notes/`, `tests/hashes.json`, `fonts/OFL-*.txt` (next to the TTFs).
    `tools__unpack.py` deleted (nothing left to unpack). Every `tools/*.py` resolves paths from the repo root (its parent folder),
    so Thonny's Run button still works: **open `tools/build.py` instead of `tools__build.py`**. All five audio loaders,
    `tools/build_cdrom.py`, comments, CLAUDE.md, README.md, gen/API.md and this file use the new paths (names of files deleted
    before Oct 20 are left as history). Old notes may still say `audio__x.js`: that's `audio/x.js`.
  - **Checked in the cloud (Linux, Node 22.22, Python 3.13, Chromium 141):** regression CHECK 0 mismatches of 93 after the move;
    every published player rebuilt from the new layout (jukebox, cdrom-player, cdrom-ambient, the three living posters, gen-player,
    pltw-cse) and compared with builds of the untouched clone: same code apart from file names in comments (CD-ROM fonts differ
    only by fontTools' build timestamp). Each loaded headless with no page errors, canvases drawing, and sound measured after
    pressing the button (Web Audio players: signal at the speakers; gen: the embedded 60-s MP3 playing). The PLTW MP3 was
    re-rendered first with `tools/render_piece.py` (-16.3 LUFS, -1.5 dBTP, same length; differs from the published one only by
    MP3 encoder noise). The non-GUI scripts were run by path from another folder (build, build_cdrom, cdrom_ambient, render_piece,
    calibrate, midi, hershey_words); the GUI ones (gen_export, html_to_mp4, porter, regress) opened their windows, and
    gen_export's MAKE HTML and the porter's score picker were driven. **Not run in the cloud:** an MP4 export (the sandbox's
    Playwright wanted a newer Chromium), anything on a Mac or in Thonny itself. The starter engine's missing fonts are fixed: `engine/fonts/`
    now holds `DHSDisplay.ttf` + `DHSText.ttf` + `OFL.txt` (Bricolage Grotesque, copied from `academies-film/source/fonts/`) and the
    generated `engine/src/core/fontdata.js`, so `engine/dev.html` opens and `node tools/build-player.js` builds and plays (tested headless).
  - **CI** (`.github/workflows/ci.yml`, badge on README): gen build + smoke test + "generated files committed" check, and the
    audio regression CHECK on Node 22, on every push and PR. First run on GitHub still to be confirmed.
  - **CONTRIBUTING.md** + issue forms (bug, cartridge idea); README's "planned" paragraph now links to it. README's
    "Why the file names look like `audio__style-lounge.js`" section became "Where things are".
  - **STATUS.md** visitor header (top of this file).
  - Cloud notes: `tools/build.py`'s font URLs (`github.com/.../raw/...`) were blocked by the sandbox proxy, so its font cache was
    filled from `raw.githubusercontent.com` (same files; `tools/build_cdrom.py` already uses that host). Commits use the noreply address.
- **PLTW CSE promo r2 (Oct 20, full creative mode; UNSEEN and UNHEARD by Bryan): `gen/carts/pltw-cse.json`, 60 s, 120 BPM.**
  r1 (captions over unrelated cartridges + the hallway film's music) was rejected: "words on top of unconnected visuals ...
  looks bad", and the seven-academy music made no sense for CS. r2 makes the visuals FORM the words:
  - BOOT 0-10: `swarm` warp (hyperspace streaks) → sphere → the dots fly into PLTW → burst through the camera.
  - TUNNEL 10-24: `tunnel` checker; COMPUTER / SCIENCE / ESSENTIALS made of dots park in front of you, then fly through the
    camera and burst (14, 16, 18); CODE / BUILD / DRIVE fly through on 20, 21, 22.
  - DRIVE 24-36: `swarm` floor + a wireframe self-driving car with a lidar sweep; sky dots fly down into VEXcode VR,
    VEXcode EXP, self-driving vehicles, then back up.
  - TILES 36-48: `truchet` tiles flip left to right to spell "MIT App / Inventor", then "Python".
  - FINALE 48-60: `swarm` knot → PLTW → COMPUTER / SCIENCE / ESSENTIALS, held to the end.
  New code: `gen/layers/swarm.js` (new layer), `words` on `tunnel` and `truchet`, `GEN.core.textPoints`. All cuts, on the beat.
  Music: `proj/pltw/music.js` ("PLTW CSE", own synths on the DSP, scored to `CUES` = the cartridge's moments; boot data
  chatter + blip clouds as dots assemble, four-on-the-floor drop with crash/stab per word burst, stop-time CODE/BUILD/DRIVE,
  motorik drive with a lidar ping per sweep, chiptune lead + tile-flip tick runs, finale). Rendered by the new
  `tools/render_piece.py`: -16 LUFS, -1.5 dBTP (checked with ffmpeg), only seen as a spectrogram, never heard.
  Colors: PLTW brand page (Dark Blue `#0e0318`, Cream `#f7f4f1`, PLTW Blue `#3e34d9`, Deep Blue `#141e8a`, CS Purple `#461c5d`);
  dots/accents use the tint `#6f68e6` (PLTW Blue on Dark Blue is ~2.3:1). Course name = PLTW's "Computer Science Essentials";
  tool names: VEXcode VR, VEXcode EXP, MIT App Inventor, Python (Trinket is also on PLTW's list; left out, Bryan didn't name it).
- **`tools/gen_export.py` (NEW Oct 20, Bryan: "that CANNOT be how we generate the final video"):** Tk GUI, pick a gen cartridge
  + folder (Desktop first, then remembered in `~/.eomd_gen_export.json`) → MAKE HTML / MP4 / BOTH. MP4 reuses
  `tools/html_to_mp4.py`'s stepped renderer but lays in the cartridge's `"audio"` file (frame-exact) instead of recording live.
  Engine tested headless (HTML + 1080p MP4 of pltw-cse); the window itself not yet clicked through. `ONLY_CART` reset to ''.
- **PLTW promo r2 seen by Bryan (Oct 20):** "looks cheesy as hell, but it's exactly what I asked for". Published as
  `players/pltw-cse.html` on GitHub Pages (index.html card) for his Zoom class. Bryan: the standalone must NOT carry the
  gen gallery UI, so standalone builds are now presentation mode (`GEN.PRESENT`, set by `gen/build.py`). Bryan asked why
  the r2 session took ~30 min wall-clock (cheap in tokens): mostly build + headless frame-grab rounds and two 2-min MP4
  renders; a lighter check loop is a possible later improvement.
- **Repo made presentable for Bryan's CS class (Oct 20):** README leads with the PLTW promo (link + `media/pltw-cse-preview.jpg`),
  a "How the PLTW video works" section for students, a note on the `__` file names, stale MP4/music lines fixed; GitHub
  homepage set to the Pages site, topics added.
- **Rule added Oct 20:** CLAUDE.md "New pieces": ask efficient vs full creative mode first; words inside the picture;
  one-off music scored to picture. `tools/html_to_mp4.py` renders picture-only when a page is silent (no more crash).
  Known gap: `tools/html_to_mp4.py` still can't hear a gen cartridge's `<audio>` track (use `tools/gen_export.py`).
- **Public on GitHub (Oct 20): https://github.com/BPMData/EOMD** (Efficient Offline Motion Designer), MIT license (Bryan Patrick Murphy), `README.md` for visitors. Commits use the noreply address `123925276+BPMData@users.noreply.github.com`.
- **Prebuilt players in `players/` (Oct 20):** every build made fresh from the current sources (jukebox, CD-ROM + ambient, the three
  living posters, gen) and copied in. Each one was loaded headless: no script errors, sound starts, frames render. That means the 9h
  scripts (jukebox CD-ROM cartridges, ambient version) have now run; their levels and the AMBIENT_VER stamp are still unheard/unseen by Bryan.
- **Moved to Claude Code (Oct 20, DONE).** This folder (`MotionDesign`) is the single source of truth, in git. Deleted: the spent patchers and one-off tools (`tools__patch_*.py`, `tools__fold_cdrom.py`, `tools__strip_player.py`, `tools__rebuild_living.py`, `tools__sync_check.py`, `tools__check_files.py`), the Track 2 audition files (`proj__cdrom__track2-audition.html`, `-r2-audition.html`, `-r3.js`, `-sketches.js`, `tools__build_track2.py`) and `academies-film/danbury-academies-player_ORIGINAL.html`. `motif.txt` → `proj/cdrom/intro-motif.md`. `00_CLAUDE.md` → `CLAUDE.md`, `00_HANDOFF.md` → this file.
- **Video export (NEW Oct 20): `tools/html_to_mp4.py`** (Tk GUI). Bryan ran it on the Academies master: "Worked perfectly". Also tested on the CD-ROM build (20 s with music), the old Dust Type standalone and the gen player. Not tested: CANCEL, portrait, a living poster (none built in `dist/` at the time).
- **Dust Type = the gen `dust` layer + cartridge `dust-type` (a cartridge only; the Oct 15 standalone player was dropped Oct 20,
  Bryan: "it was never meant to be a standalone anything").** Letters burst into coloured powder and dust coalesces back into crisp
  letters (the ALT VFX / Semi-Permanent packed-powder trick; one baked physics sim played forward and backward). Look approved Oct 15
  ("looks sick now"); in gen Oct 20: "works fine, looks good". `gen/layers/dust.js` (39 knobs, each with a help line; modes both /
  explode / assemble; how it works and the r1 look lesson are in its header), `gen/carts/dust-type.json` (3 shots: DUST both ways
  27.8 s = 2 loops, GEN burst 10.2 s, TYPE coalesce 9.3 s), `gen/fonts/Montserrat-Bold.ttf` + OFL, which is `DISPLAY_FONT` in
  `gen/build.py` (so the `type` and `halftone` layers use Montserrat Bold too). `gen/tests/smoke.js`'s stub canvas returns gradients
  (dust is the first layer to use them). **Palette fix (Oct 20):** the cartridge no longer pins a `colors` list, so `color
  ink/accent/dim` change the dust live (fallback = dim-ink blend, dim, accent, ink). Not yet checked: every knob on every setting.
- **CS Lab Screensaver ("CD-ROM"): Stage 4 runs on Bryan's Mac; extras through 9f built.** Brief: `proj/cdrom/brief.md` v3.1
  (covers the music modes, Overclock, the timer readout, the word structures; does NOT yet describe the 9c passes or the 9e long form).
  - **Seen/heard and approved:** Overclock as the default mode (Oct 9: "soooo much better than chips"), clear sampler on Their Finest
    Duds, strings lead (settled), the 9c variations + energy arc ("the breather periods really do break up the samey-sameyness"),
    hi-vis yellow timer readout (10-s steps), card 12 "Clear Names" (EN approved; ES/PT are Claude's drafts), the word structures,
    Duds in the air (zeppelin captain, fighter planes, Starfield space fighter; 9d: wildly over the top, and Bryan loved it) with oversized
    pilots and per-world headgear (9e). Oct 8 approvals: switch fix, channel titles + chronological `ORDER`, the Their Finest Duds
    intro, the boot screen.
  - **Oct 9h, ambient version + CD-ROM music in the jukebox (Bryan asked; scripts in the folder, NOT yet run):**
    - **Ambient screensaver:** `tools/cdrom_ambient.py` (Thonny, run after `tools/build_cdrom.py`) reads `dist/cdrom-player.html`
      and writes `dist/cdrom-ambient.html`: `const CARDS=[]` (parsed as JSON, so card text can't trip it) and `CM.next=Infinity`
      (Starfield's hyperspace only fires in card-free gaps, `CM.next-t>10`; with no cards and the default `next:8` it would never fire
      after 8 s), plus the page title "CS Lab Screensaver · Ambient" and a card-free `aria-label`. With no cards nothing ever speaks:
      the chip speech (`prepCard`) and the Lounge blips (`speakCard`) only run for a card. Kept: music modes, boot screen, timer +
      "SAVE YOUR WORK!" end card, corner ding, whoosh, zeppelin captain (always spawned by `Desk.prototype.step`), Starfield pilot. The
      Lab Maze HUD guide never rises (he only appears to speak). A post-processor, so no source or build-script edit; it could become a
      second output of `tools/build_cdrom.py`.
    - **AMBIENT_VER stamp (Bryan: keep the ding and the boot screen, stamp the boot card like an old CANCELED stamp; UNSEEN):** the script
      wraps `bootFrame` (`bootFrame` → `bootFrame0` + `stampAmbient`), so the stamp also dissolves out with the boot card (`bootOver`).
      A red rubber stamp, rounded double border, Atkinson Bold, rotated −10°, drawn at 1/3 res with hard edges and blotchy ink loss on
      the plaque's Bayer dither (two reds, lighter to the right), upscaled ×3 without smoothing (~1030 × 410 px, centre 1020, 330:
      across the plaque and logo). It slams in (1.6× → 1× in 0.13 s) 0.5 s after the punch line lands; reduced motion: appears at 0.9 s.
      Knobs at the top of the script: `STAMP_TEXT`, `STAMP_ANGLE`, `STAMP_X/Y`, `STAMP_SIZE`, `STAMP_INK/INK2`. Tested: edit + syntax +
      the drawing code against a stub canvas (no frame rendered); refuses to run on a page that already has a stamp.
    - **Jukebox:** `tools/build.py` adds, jukebox only: `JUKEBOX_LIB` = `audio/style-loungechip.js`, `proj/cdrom/track2-r2.js`,
      `audio/style-overclock.js`; per chip in `JUKEBOX_CHIPS` (chronological: tia, beep, arcade, snes, fm) an **Overclock** cartridge
      (`overclock-<chip>`: the overclock score + `chip`, `tonic` 40+tr for the key label) and a **Lounge (Chipped)** cartridge
      (`lounge-chipped-<chip>`, derived exactly like `tools/build_cdrom.py`: lounge score, style `loungechip`, the chip score's
      tail/lead, master_db + `LOUNGE_CHIPPED_TRIM`, keep the two trims in step). `JUKEBOX_SKIP_STYLES = ['chip']`: the plain Chips
      cartridges stay out (Bryan: "it's so bad lol"). The chip-less `score/cdrom-overclock.json` is not listed itself. The living
      poster's `AUDIO` is unchanged. Tested: cartridge list + fields on stand-in scores (15 cartridges, no chip ones). Not tested: audio
      in the jukebox page (same `MUSIC.run`/`MUSIC.section` path as the player's worker), levels vs the other cartridges (the CD-ROM
      master_db values were set in the player).
  - **Oct 9g, patches folded (DONE):** the build's 24 `PATCHES` were applied to `proj/cdrom/player-src.html` (same order, exact
    single matches), `PATCHES` emptied in `tools/build_cdrom.py`, the unused `TITLES_JS`/`BOOT_JS` removed, rebuilt: **IDENTICAL
    (1,049,388 bytes)**. The player source now holds the channel titles (`TITLES`), the boot screen (`BOOT_LINES`, `BOOT_AUTO`,
    `BOOT_CHIME`), the music hooks and the `/*__ADDONS__*/` marker; `proj/cdrom/addons.js` is still its own file, injected there by
    the build. `MUSIC_PATCHES` was already empty. New edits go straight into the sources. The fold's check proved 9e and the airship
    patch are installed and in that build.
  - **Oct 9e, option 3 = the longer composed form (audition heard: "sounds good on all chips", approved; built Oct 9g, not yet
    confirmed heard in the player):**
    - `proj/cdrom/track2-r2.js`: bars 20–27 = **C**, a half-time breakdown (backbeat on 3, long bass notes, ♭VI → v → Am9 → D7 → G →
      ii–V; C7 brings the slap and 16ths back, C8 fills into A). Bars 28–35 = **D**, a **generated solo** over A's chords/bass/drums
      (`T.solo(seed, to)`: 2-bar phrases that get busier, a held chord tone + breath at the end of D2/D4/D6, the twin lead joins in 3rds
      for D7–D8, the last beat runs up into the next section's first note; register D5–G6). Pieces can now have an `order` (bar
      indices or `{bi, tr}` for key lifts); bass approach notes at a bar's end aim at the next bar in the order (flag `nx`; helpers
      `T.approach`, `T.firstBass`, `T.barLabel`). Piece `overclock` still plays bars 0–19 and is note-for-note unchanged (tested);
      piece `overclock-long` = Intro · A · B · A · C · A · D · B+2 (D8 pivots up, B8 drops home), ~1.6 min per loop at 142.5.
    - `audio/style-overclock.js` (player): `FORM.sections` gains C and D; new pass types `breakC` (A C), `solo` (A D, a new solo take
      every pass, seeded by the pass) and `liftB` (B up a whole step). Every SET = `full` · 1–2 bag passes · `breakC` · 50% one
      var/build · `solo` · `liftB` = 72–104 bars, ~2–3 min at 142.5 (the 9c `lift` pass is no longer drawn). Variations only touch A
      and B. Bar-end bass approaches now aim at the bar that really follows (fixes "always aims at A1").
    - Tested (Node, stub chips with the real ranges + the real seeded rng): plain loop (`?plain`) identical to 9c on 5 chips × 3 seeds
      × 14 sections; the first pass (intro + full A B, with speech) identical; 2 h × 3 seeds × 5 chips at 120/142.5/168 BPM: 8.1 M
      events, none invalid or past a section end; 38,000 bar-end approaches all a half step from the real next root; 115–160 distinct
      solo openings per 6 h; Dud speech inside C/D bars works; top lead notes match 9c. Levels unmeasured.
    - `MUS.info().overclock.now` shows the pass type and section, e.g. `D3 · Em7`.
  - **Oct 9f, retro airship parts (Bryan approved the preview: "exactly what I was thinking of. Absolutely peak."; built Oct 9g, not
    yet confirmed seen in the player):** fins lit per pixel from the envelope's light and Bayer-dithered into `ENV` (darker toward the
    tips, a rib, a darker rim, hidden where the envelope is in front: an envelope depth buffer `SB`); engine pods as dithered dark-metal
    ellipsoids (the 3 darkest `ENV` tones); propellers as pixel sprites: a thin X (1 sprite px = 5 screen px) in `ENV`, 4 frames per
    quarter turn stepped at `PROP_FPS` 8, counter-rotating; reduced motion holds frame 0. Knobs `PROP_R`, `PROP_FPS` (in
    `proj/cdrom/addons.js`).
  - **Built, still unheard (Oct 8):** Previous Era / Next Era, Lounge (Chipped), Lounge speech ~3 dB louder (`LOUNGE_SPK` 1.4).
  - **How Overclock works in the player** (details in the files' header comments): `audio/style-overclock.js` cuts the piece into
    endless 8-bar sections (intro once, then passes), voices each bar through `TRACK2R2.chipEvents`, adds chip-voiced Dud speech from
    the bar's chord, applies clear mode + post EQ + master_db. `score/cdrom-overclock.json`: bpm 142.5, tr −3, `bpms` menu list,
    `lead` strings, `clear` ["snes"], `vary` 1, master_db per chip (fm −15.38, tia −9.29, beep −17.87, snes −11.9, arcade −13.11;
    measured on the A+B loop). `proj/cdrom/music.js`: modes Overclock (default) → Chips → Lounge → Lounge (Chipped); segmented tempo
    grid; Tempo/Key menus while Overclock plays; `?music=`, `?bpm=`, `?tr=`, `?plain`.
- **Track 2 history** is in the brief (rounds 1–3; Overclock chosen; 142.5 BPM, −3 st; clear sampler). The audition pages were
  deleted Oct 20 (not kept in git).
- **Tools:** Node v26 via Homebrew on the Mac; Thonny may need `NODE_EXE` set to the full path (`which node`).
- **Regression check: SETTLED for Node 22 (Oct 20, cloud).** CHECK on the untouched clone under Node 22.22 (Linux) matched the Oct 5
  baseline 27/27, so the Mac's 16 mismatches come from (a) Node 26 / the Mac, not from the files. SAVE BASELINE then extended
  `tests/hashes.json` to all 93 sections (the 27 old hashes unchanged); CI checks it on Node 22. On the Mac, CHECK needs Node 22
  (`brew install node@22`, `NODE_EXE` = `/opt/homebrew/opt/node@22/bin/node`) or just let CI check. Earlier notes: First CHECK on the Mac (Node v26) against the Oct 5 baseline (Node v22,
  Linux): `ssr-tv-science` 11/11 match; **16 mismatches** = all of `late-library` (11), `academies-hallway` (1), `corporate-calm` (4).
  Causes not yet separated: (a) Node 26 / Apple-silicon math in the piano + film voices; (b) a copy-paste slip in
  `audio/instruments.js` or `audio/instruments-film.js`; (c) the baseline came from different copies of those scores. Test (a):
  `brew install node@22`, point `NODE_EXE` in `tools/regress.py` at `/opt/homebrew/opt/node@22/bin/node`, CHECK. The CD-ROM player
  doesn't use those scores; no Overclock work changed an existing shared audio file.
- **Living posters (Kells engine, shared `living/template.html`; `LIVING_VARIANT` = 'ssr' | 'cs' | 'ex' in `tools/build.py`):**
  - **Exploration Seminar: DONE (Oct 7; Bryan watched it: "completely fine").** `dist/living-player-ex.html` (built in the old Build folder; this folder's `dist/` doesn't have it yet). 17 trilingual trio cards
    parsed word for word from `proj/ex/copy.md` (Oct 9 added 7 academy cards, cards 18–24, so the build now has 24; those 7
    haven't been watched yet) (ES/PT are Claude's drafts; Bryan trusts them), 11 cursive words
    (`living/words-ex.json`, made by `tools/hershey_words.py` with VARIANT='ex'), **no end card** (`TICKET=null` in
    `living/variant-ex.js`; the template guards `&&TICKET` are in), academy colors from `proj/academies/brand.md` via `CMAP` +
    `CARDSTYLE` in the variant (blue = rule/campus cards, teal = class cards, pair cards fill + edge; orange 4.31:1 is large-bold only,
    so orange cards use weight 700). "choose/pick" wording stays (Bryan: fine for 9th graders). Body text is below the 44 px rule on most
    cards (estimated 28–35 px); Bryan was fine with it on the board.
  - **Oct 9: time-left readout (all variants, in the template).** While the session timer runs, the time left shows top-right in
    yellow `#FFD100` Bagel Fat One (the card-title font) with a charcoal outline, updating in 10-second steps rounded up (a 20-min
    timer shows 20:00 for 10 s, then 19:50 ...), drawn on top of the cards. Knobs: `CLOCK` (step, size, ink, edge, margins);
    `?noclock` hides it. Built into the old folder's `dist/living-player-ex.html` (syntax + clock logic tested in Node; **not watched on a screen**).
    **The CS and SSR players need a rebuild** (LIVING_VARIANT = 'cs' / 'ssr') to pick it up.
  - **CS living poster: DONE (Oct 6)**; the "What Went Wrong?" copy change and card 12 land on its next rebuild.
    **SSR living poster (Kells):** done; 43-word bank not yet watched.
- **Jukebox cartridges (Oct 9h `tools/build.py`):** `ssr-tv-science`, `late-library`, `academies-hallway`, `corporate-calm`,
  `encyclopedia-lounge`, then `overclock-<chip>` and `lounge-chipped-<chip>` for tia, beep, arcade, snes, fm (15 in all). The plain
  `chip` cartridges are skipped (`JUKEBOX_SKIP_STYLES`).
- **Academies hallway film: master = `academies-film/danbury-academies-player.html`** (heroes, new icons and the trilingual word
  blocks on all 7 academies; edit it directly, both config copies). `academies-film/source/` is the older Sep 29 source and lacks
  those changes. Bryan rendered the master to MP4 with `tools/html_to_mp4.py` (Oct 20).
  - **Approved:** the 21 pathway icons redrawn from the official logo hexes (`proj/academies/icons-new.js`; same ids as the
    config), at line weight 0.08. Bryan's calls: Justice & Law = the helmet (the logo's hex; the scales are the crest), Audio
    Engineering = the media circle, Medical Technology & Engineering = the circuit bulb, Applied Engineering = the brain bulb, Sports &
    Human Performance = heart + pulse.
  - **Approved:** 8 animated hero marks (the symbol above each logo circle) in `proj/academies/heroes.js`,
    `DHS.heroes.draw(ctx, id, x, y, s, fg, bg, t, lw)`: laptop (closed lid in the deck's perspective, flips open, screen turns on; thin
    trackpad clear of the keys), bubbles (both draw in, then dots pulse while the lines write in), caduceus, team, scales, workbench
    (`workbenchA`, Bryan's pick Oct 9: gear rises and turns over a blank ruler; the pencil, held at 45°, enters from the left and
    draws each tick as its tip passes, is dropped and slides back left into its slot; a thin background-color outline keeps it
    readable over the gear; `workbench` = the older flat-slide version, `workbenchB` = right-to-left + straight drop, both unused),
    globe, compass. Each plays once and holds; gears keep turning.
  - **One animated pathway icon per academy (Oct 9):** the old set (turbine, robot arm, heartPulse = circuit bulb, dna, code) plus
    `book` (Education: the tassel sways in a light breeze; approved) and `tower` (Broadcasting: waves pulse out of the head one ring
    slot per 1.6 s pulse, the new ring fades in, the outer one fades out, then they rest on the logo's positions; the lattice girders
    draw at 0.55× weight; approved: "way better").
  - **Trilingual word block on all 7 academies (Oct 15, Bryan asked):** the rolling EN/ES/PT pill beside "Career academy, grades 10–12"
    (config `flourish`, drawn by `T.roll`) was only on 3 academies (Technology, Energy, Art). Added: Scientific Innovation & Medicine
    `['Medicine', 'Medicina']` (ES = PT, listed once like 'Arte'), IT & Cybersecurity `['Information Technology', 'Tecnología de la
    Información', 'Tecnologia da Informação']`, Professional & Public Service `['Public Service', 'Servicio Público', 'Serviço Público']`,
    Communication & Design `['Communication', 'Comunicación', 'Comunicação']`. ES/PT are Claude's translations. A pill shrinks below its
    30 px text only if its longest word would overflow the text column (in tests only the IT one in portrait, slightly). The config's
    old comment "max 3–4 per loop incl. greeting" is now out of date (7 + the greeting).
  - Also in the master (from patcher v3, Oct 15): icon weight 0.08 in the badge hexes and 0.11 in the tiny chip + ranking-list icons
    (0.08 is about 1 px there); the icon drawer has optional per-line weight (`w`) and opacity (`a`); the hero replaces the hat on each
    academy splash (half-size 72 landscape / 66 portrait; orbit-ring gap 0.3 → 0.34); the Emerging Tech candlestick ticker fades out
    within `TICKER_GAP` (170 px) of the hero; the compass above "Every 9th grader starts in the Exploration Academy" (plays 1.5×) and
    above the end card's "Explore. Find your fit." The hat stays on the hub, title and end-card lockup.
  - Demo sheets (downloads only, not in the folder): `academies-heroes.html`, `academies-motion-demos.html`, `academies-icons-compare.html`.
  - **Watch for:** hero size; the chip icons at 0.11; knockout shapes (closed laptop lid, ruler ticks, compass sun) use the flat
    academy color, so a faint edge may show against the background's soft light falloff.

## Music direction (approved, unchanged)
Lab Maze: FM card (`fm`) · D2 ASCII World: 2600 TIA (`tia`) · D1 DOS Prompt: beeper (`beep`) · Contour Desk: sampler + airship (`snes`) ·
Starfield: 4-op FM + PSG (`arcade`). Overclock (default) plays Track 2 on each channel's chip; Lounge plays Encyclopedia Lounge on every
channel; Lounge (Chipped) plays it on each channel's chip. Overclock knobs (score): `bpm`, `tr`, `bpms`, `lead`, `clear`, `vary`,
`master_db`; form knobs in `FORM` (`audio/style-overclock.js`). Lounge knobs (score): `split`, `altEvery`/`restEvery`, `keys`,
`mix.vibes.g`, `bed.walkUp`.
Lessons: snes brass too tinny; breather sections land well; strings > flute/horn; the mallet must answer on its own on MacBook Air
speakers; speech blips short with silence between 32nds; FM ducks −5 dB under the Dud; keep the beeper's noise-click snare. Track 2:
no sparse riff + pedal ideas; dense late-80s fusion works, even on the TIA; contrast (breathers, a half-time C, a solo) beats repetition.
Chips music (the plain `chip` style): Bryan Oct 9, "it's so bad lol"; kept as a player mode, left out of the jukebox.

## Known limits
- Chip speech needs the render to finish before the first blip; if late, the card shows without speech. A manual switch drops a card
  that hasn't started speaking.
- During the airship passage (Chips) a channel switch changes the picture at once; the music crossfades at the next section boundary.
- The first Previous Era click after a forward run may take up to ~2.5 s to dissolve (that chip wasn't pre-rendered yet).
- The whoosh and the boot chime bypass the music limiter and the music modes; they follow the volume slider and mute only.
- Not loudness-measured: the Contour intro (matched to its approved Oct 8 level, −26.75 LUFS), Lounge (Chipped) (`LOUNGE_CHIPPED_TRIM`),
  the boot chime (`BOOT_CHIME`), Overclock at tempos/keys other than 142.5/−3, and the 9e C/D passes (master_db was set on A+B; C is
  thinner, so expect it a little quieter, which suits a breakdown).
- The intro motif is fixed (`proj/cdrom/intro-motif.md`): its G→C♯ drop only lands on Overclock's key at −3 st. While it plays,
  cards wait; a mode or tempo change lands when it ends.
- On the TIA, Lounge (Chipped) bass can land one semitone above the bass register (E♭); the Chips music does the same.
- Overclock on the TIA/beeper: melody only (no twin lead); two brief sour TIA notes (E♯ −38¢, one A♯ approach +37¢) at 0 st.
- A bar-end approach a half step above the next root can equal the bar's own root (e.g. C♯7 → C): it sounds as a repeated note.
- Word structures: Duds and cards are screen-space layers, so a structure can pass "over" a Dud (it gets angry) and cards cover
  structures. A centre flyover only happens if the Desk channel is still on when the lined-up structure arrives.
- The timer readout covers the D1/D2 wall clock and can touch the right margin of a very wide EN card window.
- The Tempo/Key menus are plain `<select>`s; while one has keyboard focus, arrow keys may change it as well as switching eras.
- Living posters: the new time-left readout sits above the cards, so it can cover the top-right corner of a card or a word for the
  moment they overlap.
- Jukebox: the Overclock cartridges play at the score's 142.5 BPM / −3 st (no tempo/key menu there); no Contour intro; the key label
  reads "D♭" for C♯ minor (the template's flat-only note names).
- Dust Type: above ~5k grains it drops frames on Bryan's machine (fill rate + per-grain bake memory); the bake runs on the main
  thread, and every knob change re-bakes (~0.1–0.4 s).
- `tools/html_to_mp4.py`: for STEPPED players the music is recorded from a separate real-time run, so it takes the clip's length in
  real time and isn't locked to the picture; CD-ROM channel switches in `?manual` follow their own clock, not the music's bar lines.
  A stepped render takes roughly the clip's length (music) plus about the same again (frames).

## Next
1. **Move to Claude Code: DONE (Oct 20).** git repo, cleanup, `CLAUDE.md` + `STATUS.md`, gen dust layer wired in.
2. **Check the 9h builds (built Oct 20, in `players/`):** listen/watch: the jukebox's 10 new cartridges (levels next to the others) and a few minutes of
   `dist/cdrom-ambient.html` (Starfield should still go to hyperspace; the AMBIENT_VER stamp is unseen).
3. **Stage 5 extras:** fontTools subsetting for size (`pip install fonttools`), QA note, ZIP. Publish.
4. **Regression baseline: settled for Node 22** (see the Regression bullet); CI runs CHECK. Optional: install node@22 on the Mac.
5. Measure Overclock levels across a whole 9e set per chip (and the unmeasured items above); adjust `master_db` if a chip drifts.
6. Update `proj/cdrom/brief.md` with the 9c passes, the 9e long form and the 9h ambient version.
7. Check in passing: 9e long form and 9f airship in the player (built, not yet confirmed), and from Oct 8 Lounge (Chipped) levels →
   `LOUNGE_CHIPPED_TRIM`, louder Lounge speech.
8. **Living posters, parked by Bryan (Oct 7); build for ALL three players together (ssr, cs, ex), in the shared template/sound-timer:**
   a. **5-minute timer option:** add 5 to the `#tmin` select in the template's `#ui`.
   b. **Readout:** done Oct 9 (see Living posters). Left to decide: should it be a button/toggle in the UI instead of `?noclock`?
   c. **Random vine entry points:** word vines and card-bloom vines nearly always start at the bottom right now. Wanted: genuinely
      random entry. **Word vines** enter from the LEFT half of the screen (x < 0 with (0,0) at the screen centre, any y) and write
      left to right, so they never write over their own trail (right-to-left rejected: the letters would be drawn in reverse order).
      **Card-bloom vines** (`startFiddle` / `startTrio`) may enter from any direction. Check the leftward drift (7 px/s, `DRIFT`):
      a left-side start leaves the screen sooner, so give word starts room; `startWord` and `buildWord`'s lead-in tendril are the places.
   d. Rebuild the CS and SSR players to pick up the time-left readout (and CS's copy change + card 12).
9. **Dust Type:** check the gen knobs across their ranges. Then Bryan's call: use it in a real piece (a title or end-card shot in
   another cartridge), a brand palette, impact/whoosh sound. Ideas not yet tried: a bake in a Web Worker (no hitch on knob changes),
   a per-letter colour palette from a brand file.
10. **Real folders: DONE (Oct 20, open-source pass).** After merging: on the Mac, `git pull`; Thonny scripts are now `tools/<name>.py`.
11. **Community cartridges: DONE (Oct 20):** CONTRIBUTING.md, issue forms, CI on every pull request. Left: a `community/` folder if many arrive; watch the first CI runs on GitHub.
12. **Try the interview** (`/new-piece`) on the next new piece. A test of the idea: write a real brief for the PLTW promo
    with Bryan, rebuild it from a blank page in full creative mode, and compare it with r2.
13. **Context that follows the stage** (design approved in direction Oct 25): implement `notes/context-plan.md`
    (slim CLAUDE.md, split STATUS.md, nested per-folder CLAUDE.md, `brief/CRAFT.md`, `brief/taste/`, `/toolbox`, the peeking audit). Do it
    before the PLTW test in item 12, so the test runs in the new setup.

## Open taste questions
- Clear sampler for the Chips music on Their Finest Duds too (Chips is approved music: Bryan's call).
- Card 12 ES/PT wording (Claude's drafts).
- Tempo/Key menu for Lounge (Chipped) later?
- Jukebox blurb says every cartridge "plays forever without repeating"; the two ports loop by design and ignore the seed.
- Boot taglines: Bryan may want to cut or add some (`BOOT_LINES`, in `proj/cdrom/player-src.html`).
- Overclock set shape: always end on the lifted B, or sometimes skip the lift? (`FORM`, one line.)
- Ambient stamp: look, size and placement once seen (knobs at the top of `tools/cdrom_ambient.py`).
- Jukebox: 10 CD-ROM cartridges may be a lot; trim `JUKEBOX_CHIPS` (e.g. Overclock on all five, Lounge (Chipped) on two)?
- **Jukebox look (Bryan, Oct 20: "I hate the way the Jukebox looks now that we have so many tracks"; pinned for later):** 15 cartridges in one long list of cards. Redesign the layout in `jukebox/template.html` (e.g. grouped by family, compact rows), then rebuild and copy into `players/`.
