# 00_HANDOFF.md: status + next steps (rewrite at the end of each working chat)

_Last updated: Oct 15, 2026 (NEW: Dust Type study, stage 1 r2 approved; 9e: Overclock long form in the player style; 9f: retro airship fins, pods and propellers; 9g: build PATCHES folded into the player source, IDENTICAL; 9h: ambient screensaver + CD-ROM music in the jukebox (scripts delivered, not yet run); living posters: Oct 9 time-left readout; Academies film: new pathway icons + academy hero marks, patcher v3 with a trilingual word block on all 7 academies, plus `tools__patch_words.py` for Bryan's v2-patched copy (Oct 15))_

## Status
- **Dust Type (NEW Oct 15, study piece; stage 1 r2 seen and approved: "looks sick now"):** letters burst into coloured powder and
  dust coalesces back into crisp letters (the ALT VFX / Semi-Permanent packed-powder trick; one baked physics sim played forward and
  backward). Files: `claude/proj__dust__brief.md` (what it is, how it works, knobs, build steps), `claude/proj__dust__player-src.html`
  (source, `/*__FONT__*/` placeholder), `claude/fonts__OFL-Montserrat.txt`. Built player `dust-type.html` (~40 KB, subset Montserrat
  Bold) was a download, not in the Project. 3k grains default, 5k OK on Bryan's machine. **Not yet in `00_CLAUDE.md`'s file map:** add
  a "Dust Type" set (`proj__dust__*`, `fonts__OFL-Montserrat.txt`).
  - **Gen cartridge (Oct 15, same chat; delivered, NOT yet run in the repo):** `gen-dust-dropin.zip` = `gen/layers/dust.js` (layer
    `dust`: the same sim and renderer as the standalone, 39 knobs each with a help line; modes both / explode / assemble as a menu;
    colours from a `colors` hex list or the palette; font from the `font` knob, default GenDisplay = build.py's `DISPLAY_FONT`),
    `gen/carts/dust-type.json` (3 shots: DUST both ways 27.8 s = 2 loops, GEN burst 10.2 s, TYPE coalesce 9.3 s; shot lengths =
    whole loops), `gen/fonts/Montserrat-Bold.ttf` + OFL. Project copies: `claude/gen__layers__dust.js`, `claude/gen__carts__dust-type.json`.
    Tested in Node with a real canvas (@napi-rs/canvas): all 3 modes, 0 NaN, deterministic, a blank word draws nothing. Not tested:
    the repo's `smoke.js` stub canvas (the crack overlays sit in a try/catch), the knob panel (every knob change re-bakes, ~0.1-0.4 s).
    Bryan's steps: unzip into the Build folder, add `<script src="layers/dust.js"></script>` to `gen/player.html` after the other
    layers, set `DISPLAY_FONT` in `gen/build.py` to the Montserrat file (optional; the `type` layer shares GenDisplay), run build +
    smoke. The layer reloads the letters once the font finishes loading.
- **CS Lab Screensaver ("CD-ROM"): Stage 4 runs on Bryan's Mac; extras through 9f built.** Brief: `proj__cdrom__brief.md` v3.1
  (covers the music modes, Overclock, the timer readout, the word structures; does NOT yet describe the 9c passes or the 9e long form).
  - **Seen/heard and approved:** Overclock as the default mode (Oct 9: "soooo much better than chips"), clear sampler on Their Finest
    Duds, strings lead (settled), the 9c variations + energy arc ("the breather periods really do break up the samey-sameyness"),
    hi-vis yellow timer readout (10-s steps), card 12 "Clear Names" (EN approved; ES/PT are Claude's drafts), the word structures,
    Duds in the air (zeppelin captain, fighter planes, Starfield space fighter; 9d: wildly over the top, and Bryan loved it) with oversized
    pilots and per-world headgear (9e). Oct 8 approvals: switch fix, channel titles + chronological `ORDER`, the Their Finest Duds
    intro, the boot screen.
  - **Oct 9h, ambient version + CD-ROM music in the jukebox (Bryan asked; scripts delivered + `project_write`n, NOT yet run):**
    - **Ambient screensaver:** `tools__cdrom_ambient.py` (Thonny, run after `tools__build_cdrom.py`) reads `dist/cdrom-player.html`
      and writes `dist/cdrom-ambient.html`: `const CARDS=[]` (parsed as JSON, so card text can't trip it) and `CM.next=Infinity`
      (Starfield's hyperspace only fires in card-free gaps, `CM.next-t>10`; with no cards and the default `next:8` it would never fire
      after 8 s), plus the page title "CS Lab Screensaver · Ambient" and a card-free `aria-label` (both optional edits). With no cards
      nothing ever speaks: the chip speech (`prepCard`) and the Lounge blips (`speakCard`) only run for a card. Kept: music modes,
      boot screen, timer + "SAVE YOUR WORK!" end card, corner ding, whoosh, zeppelin captain (always spawned by `Desk.prototype.step`),
      Starfield pilot. The Lab Maze HUD guide never rises (he only appears to speak). Tested on a stand-in page (card text containing
      `];`, re-run). A post-processor, so no source or build-script edit; in Claude Code it can become a build target.
    - **AMBIENT_VER stamp (Bryan: keep the ding and the boot screen, stamp the boot card like an old CANCELED stamp; UNSEEN):** the script
      wraps `bootFrame` (`bootFrame` → `bootFrame0` + `stampAmbient`), so the stamp also dissolves out with the boot card (`bootOver`).
      A red rubber stamp, rounded double border, Atkinson Bold, rotated −10°, drawn at 1/3 res with hard edges and blotchy ink loss on
      the plaque's Bayer dither (two reds, lighter to the right), upscaled ×3 without smoothing (~1030 × 410 px, centre 1020, 330:
      across the plaque and logo). It slams in (1.6× → 1× in 0.13 s) 0.5 s after the punch line lands; reduced motion: appears at 0.9 s.
      Knobs at the top of the script: `STAMP_TEXT`, `STAMP_ANGLE`, `STAMP_X/Y`, `STAMP_SIZE`, `STAMP_INK/INK2`. Tested: edit + syntax +
      the drawing code against a stub canvas (no frame rendered in the sandbox); refuses to run on a page that already has a stamp.
    - **Jukebox:** `tools__build.py` (from the Project copy, the newest) adds, jukebox only: `JUKEBOX_LIB` = `audio__style-loungechip.js`,
      `proj__cdrom__track2-r2.js`, `audio__style-overclock.js`; per chip in `JUKEBOX_CHIPS` (chronological: tia, beep, arcade, snes, fm)
      an **Overclock** cartridge (`overclock-<chip>`: the overclock score + `chip`, `tonic` 40+tr for the key label) and a **Lounge
      (Chipped)** cartridge (`lounge-chipped-<chip>`, derived exactly like `tools__build_cdrom.py`: lounge score, style `loungechip`, the
      chip score's tail/lead, master_db + `LOUNGE_CHIPPED_TRIM`, keep the two trims in step). `JUKEBOX_SKIP_STYLES = ['chip']`: the plain
      Chips cartridges stay out (Bryan: "it's so bad lol"). The chip-less `score__cdrom-overclock.json` is not listed itself. The living
      poster's `AUDIO` is unchanged. Tested: cartridge list + fields on stand-in scores (15 cartridges, no chip ones). Not tested: audio
      in the jukebox page (same `MUSIC.run`/`MUSIC.section` path as the player's worker), levels vs the other cartridges (the CD-ROM
      master_db values were set in the player).
  - **Oct 9g, patches folded (DONE on the Mac):** `tools__fold_cdrom.py` built the reference, applied the build's 24 `PATCHES` to
    `proj__cdrom__player-src.html` (same order, exact single matches), emptied `PATCHES` in `tools__build_cdrom.py`, removed the
    unused `TITLES_JS`/`BOOT_JS`, rebuilt: **IDENTICAL (1,049,388 bytes)**. So the Mac's player source now holds the channel titles
    (`TITLES`), the boot screen (`BOOT_LINES`, `BOOT_AUTO`, `BOOT_CHIME`), the music hooks and the `/*__ADDONS__*/` marker;
    `proj__cdrom__addons.js` is still its own file, injected there by the build. `MUSIC_PATCHES` was already empty. New source edits
    go straight into the source (the empty `PATCHES` list stays for quick exact-match edits). Leftovers on the Mac: `*.prefold.bak`,
    `dist/cdrom-player.reference.html` (delete after opening the player once). The fold's check proves 9e and the airship patch are
    installed and in that build.
  - **Oct 9e, option 3 = the longer composed form (audition heard: "sounds good on all chips", approved; built Oct 9g, not yet
    confirmed heard in the player):**
    - `proj__cdrom__track2-r2.js`: bars 20–27 = **C**, a half-time breakdown (backbeat on 3, long bass notes, ♭VI → v → Am9 → D7 → G →
      ii–V; C7 brings the slap and 16ths back, C8 fills into A). Bars 28–35 = **D**, a **generated solo** over A's chords/bass/drums
      (`T.solo(seed, to)`: 2-bar phrases that get busier, a held chord tone + breath at the end of D2/D4/D6, the twin lead joins in 3rds
      for D7–D8, the last beat runs up into the next section's first note; register D5–G6). Pieces can now have an `order` (bar
      indices or `{bi, tr}` for key lifts); bass approach notes at a bar's end aim at the next bar in the order (flag `nx`; helpers
      `T.approach`, `T.firstBass`, `T.barLabel`). Piece `overclock` still plays bars 0–19 and is note-for-note unchanged (tested);
      piece `overclock-long` = Intro · A · B · A · C · A · D · B+2 (D8 pivots up, B8 drops home), ~1.6 min per loop at 142.5.
    - `claude/proj__cdrom__track2-r2-audition.html`: long form opens first, a Solo take menu (seeds 1–8), click a bar row to jump there;
      the Sampler lead / Clear handlers that a merged comment had disabled work again. `tools__build_track2.py` unchanged.
    - `claude/audio__style-overclock.js` (player): `FORM.sections` gains C and D; new pass types `breakC` (A C), `solo` (A D, a new
      solo take every pass, seeded by the pass) and `liftB` (B up a whole step). Every SET = `full` · 1–2 bag passes · `breakC` ·
      50% one var/build · `solo` · `liftB` = 72–104 bars, ~2–3 min at 142.5 (the 9c `lift` pass is no longer drawn). Variations only
      touch A and B. Bar-end bass approaches now aim at the bar that really follows (fixes "always aims at A1").
    - Tested (Node, stub chips with the real ranges + the real seeded rng): plain loop (`?plain`) identical to 9c on 5 chips × 3 seeds
      × 14 sections; the first pass (intro + full A B, with speech) identical; 2 h × 3 seeds × 5 chips at 120/142.5/168 BPM: 8.1 M
      events, none invalid or past a section end; 38,000 bar-end approaches all a half step from the real next root; 115–160 distinct
      solo openings per 6 h; Dud speech inside C/D bars works; top lead notes match 9c. Levels unmeasured.
    - `MUS.info().overclock.now` shows the pass type and section, e.g. `D3 · Em7`.
  - **Oct 9f, retro airship parts (Bryan approved the preview: "exactly what I was thinking of. Absolutely peak."; patched and built
    Oct 9g, not yet confirmed seen in the player):** fins lit per pixel from the envelope's light and Bayer-dithered into `ENV`
    (darker toward the tips, a rib, a darker rim, hidden where the envelope is in front: an envelope depth buffer `SB`); engine pods
    as dithered dark-metal ellipsoids (the 3 darkest `ENV` tones); propellers as pixel sprites: a thin X (1 sprite px = 5 screen px)
    in `ENV`, 4 frames per quarter turn stepped at `PROP_FPS` 8, counter-rotating; reduced motion holds frame 0. Knobs `PROP_R`,
    `PROP_FPS` (in `proj__cdrom__addons.js`). The Project's `claude/proj__cdrom__addons.js` is pre-patch; the Mac copy is current.
  - **Built, still unheard (Oct 8):** Previous Era / Next Era, Lounge (Chipped), Lounge speech ~3 dB louder (`LOUNGE_SPK` 1.4).
  - **How Overclock works in the player** (details in the files' header comments): `audio__style-overclock.js` cuts the piece into
    endless 8-bar sections (intro once, then passes), voices each bar through `TRACK2R2.chipEvents`, adds chip-voiced Dud speech from
    the bar's chord, applies clear mode + post EQ + master_db. `score__cdrom-overclock.json`: bpm 142.5, tr −3, `bpms` menu list,
    `lead` strings, `clear` ["snes"], `vary` 1, master_db per chip (fm −15.38, tia −9.29, beep −17.87, snes −11.9, arcade −13.11; sandbox,
    measured on the A+B loop). `proj__cdrom__music.js`: modes Overclock (default) → Chips → Lounge → Lounge (Chipped); segmented tempo
    grid; Tempo/Key menus while Overclock plays; `?music=`, `?bpm=`, `?tr=`, `?plain`.
- **Track 2 history** is in the brief (rounds 1–3; Overclock chosen; 142.5 BPM, −3 st; clear sampler). Audition files stay under `claude/`.
- **Moving to Claude Code** (Bryan, this weekend): one session for multi-stage tasks; a real folder + git. See Next 1.
- **Project file housekeeping (Bryan):** delete `claude/proj__cdrom__track2-r2.js` (older; the root copy is current),
  `claude/tools__patch_clear_sampler.py`, `claude/audio__style-loungechip.js`, `claude/proj__cdrom__music.js` (both superseded),
  `claude/fonts__OFL-Jacquard24.txt` (duplicate); delete `claude/tools__patch_overclock.py`, `claude/tools__patch_oct9b.py`,
  `claude/tools__patch_loaders.py`, `claude/tools__patch_airship.py` and `claude/tools__fold_cdrom.py` (all ran). The Project still has
  pre-patch/pre-fold copies of `tools__build_cdrom.py`, `proj__cdrom__player-src.html`, `audio__chips.js`, `proj__cs__copy.md`,
  `claude/proj__cdrom__addons.js` and the five tools. After the Claude Code move the Mac folder is the single source of truth and this
  Project only needs the handoff, if anything.
- **Tools:** Node v26 via Homebrew on the Mac; Thonny may need `NODE_EXE` set to the full path (`which node`).
- **Regression check: UNRESOLVED, do not SAVE BASELINE yet.** First CHECK on the Mac (Node v26) against the Oct 5 baseline (Node v22,
  Linux): `ssr-tv-science` 11/11 match; **16 mismatches** = all of `late-library` (11), `academies-hallway` (1), `corporate-calm` (4).
  Causes not yet separated: (a) Node 26 / Apple-silicon math in the piano + film voices; (b) a copy-paste slip in
  `audio__instruments.js` or `audio__instruments-film.js`; (c) the baseline came from different copies of those scores. Test (a):
  `brew install node@22`, point `NODE_EXE` in `tools__regress.py` at `/opt/homebrew/opt/node@22/bin/node`, CHECK. The CD-ROM player
  doesn't use those scores; no Overclock work changed an existing shared audio file.
- **Living posters (Kells engine, shared `living__template.html`; `LIVING_VARIANT` = 'ssr' | 'cs' | 'ex' in `tools__build.py`):**
  - **Exploration Seminar: DONE (Oct 7; Bryan watched it: "completely fine").** `dist/living-player-ex.html`. 17 trilingual trio cards
    parsed word for word from `proj__ex__copy.md` (ES/PT are Claude's drafts; Bryan trusts them), 11 cursive words
    (`living__words-ex.json`, made by `tools__hershey_words.py` with VARIANT='ex'), **no end card** (`TICKET=null` in
    `living__variant-ex.js`; the template guards `&&TICKET` are in), academy colors from `proj__academies__brand.md` via `CMAP` +
    `CARDSTYLE` in the variant (blue = rule/campus cards, teal = class cards, pair cards fill + edge; orange 4.31:1 is large-bold only,
    so orange cards use weight 700). "choose/pick" wording stays (Bryan: fine for 9th graders). Body text is below the 44 px rule on most
    cards (estimated 28–35 px); Bryan was fine with it on the board.
  - **File map changes (not yet in 00_CLAUDE.md):** the trio code now lives in `living__trio.js` (shared by cs + ex; optional
    per-card `CARDSTYLE`). `living__variant-cs.js` is now only the CS parts (title, Source Code Pro, TRIO, end card);
    `living__variant-ex.js` is the Exploration variant; `living__words-ex.json` (Project path `claude/living__words-ex.json`; drop the
    prefix). `tools__build.py` injects CSCARDS + `living__trio.js` + the variant (`copy` per variant: `proj__cs__copy.md`,
    `proj__ex__copy.md`). All of these were `project_write`n Oct 9. CS output was checked identical to the approved build (comments aside).
  - **Oct 9: time-left readout (all variants, in the template).** While the session timer runs, the time left shows top-right in
    yellow `#FFD100` Bagel Fat One (the card-title font) with a charcoal outline, updating in 10-second steps rounded up (a 20-min
    timer shows 20:00 for 10 s, then 19:50 ...), drawn on top of the cards. Knobs: `CLOCK` (step, size, ink, edge, margins);
    `?noclock` hides it. Built into `dist/living-player-ex.html` (syntax + clock logic tested in Node; **not watched on a screen**).
    **The CS and SSR players need a rebuild in Thonny** (LIVING_VARIANT = 'cs' / 'ssr') to pick it up.
  - **CS living poster: DONE (Oct 6)**; the "What Went Wrong?" copy change and card 12 land on its next rebuild.
    **SSR living poster (Kells):** done; 43-word bank not yet watched.
- **Jukebox cartridges (Oct 9h `tools__build.py`):** `ssr-tv-science`, `late-library`, `academies-hallway`, `corporate-calm`,
  `encyclopedia-lounge`, then `overclock-<chip>` and `lounge-chipped-<chip>` for tia, beep, arcade, snes, fm (15 in all). The plain
  `chip` cartridges are skipped (`JUKEBOX_SKIP_STYLES`).
- **Academies hallway film: Oct 9–15, new pathway icons + academy hero marks + word blocks.** Bryan ran patcher v2 (heroes, no word
  blocks) and may no longer have the ORIGINAL player, so the word blocks go on with `claude/tools__patch_words.py` (below). The
  film's real source is not in the Project (`engine__*` is only the stripped-down starter). The working copy is Bryan's finished player
  `danbury-academies-player.html` (354 KB, on his Windows PC). To read it, Bryan runs `claude/tools__strip_player.py` (Thonny; swaps the
  bare-base64 fonts for placeholders, ~121 KB) and uploads the stripped copy. The config sits in the player TWICE (the visuals and the
  audio worker's copy in `<script type="text/plain" id="dhs-audio-src">`); config edits must change both.
  - **Approved:** the 21 pathway icons redrawn from the official logo hexes (`claude/proj__academies__icons-new.js`; same ids as the
    config, so no config change), at line weight 0.08. Bryan's calls: Justice & Law = the helmet (the logo's hex; the scales are the
    crest), Audio Engineering = the media circle, Medical Technology & Engineering = the circuit bulb, Applied Engineering = the brain
    bulb, Sports & Human Performance = heart + pulse.
  - **Approved:** 8 animated hero marks (the symbol above each logo circle) in `claude/proj__academies__heroes.js`,
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
  - **`claude/tools__patch_heroes.py` v3** (Thonny; settings at the top; every edit must match exactly once, each config line exactly
    twice, or it writes nothing; writes a new file; run it on the ORIGINAL player only: it now says so plainly if the input already has
    the heroes (`DHS.heroCfg`) or if INPUT = OUTPUT): new icon shapes; icon weight 0.08 in the badge hexes and 0.11 in the tiny chip +
    ranking-list icons (`ICON_LW_SMALL`, Claude's call: 0.08 is about 1 px there); the icon drawer gains optional per-line weight (`w`)
    and opacity (`a`); the hero replaces the hat on each academy splash (half-size 72 landscape / 66 portrait, the hat was 46; orbit-ring
    gap 0.3 → 0.34); the Emerging Tech candlestick ticker fades out within `TICKER_GAP` (100 → 170 px) of the hero (it ran behind the
    team mark); the four new word blocks (`NEW_FLOURISH`) + the fit guard; the compass above "Every 9th grader starts in the Exploration
    Academy" (plays 1.5× so it finishes before the line leaves) and above the end card's "Explore. Find your fit." The hat stays on the
    hub, title and end-card lockup. Tested on the stripped code: all 17 edits matched, all scripts parse, frames render in Node
    (landscape + portrait; fallback fonts, so real text widths differ a little).
  - **`claude/tools__patch_words.py` (Oct 15, one-off):** adds ONLY the four word blocks + the fit guard (same `NEW_FLOURISH` table) to a
    player that already has the heroes (v2 output); also works on the original. Refuses a file that already has the words, a stripped
    copy, or INPUT = OUTPUT. Tested: v2-equivalent file + patch_words = byte-identical to a full v3 run on the original.
  - Demo sheets (downloads only, not in the Project): `academies-heroes.html` (8 heroes), `academies-motion-demos.html` (pencil A/B,
    tower, tassel), `academies-icons-compare.html` (21 icons now vs new).
  - **Watch for:** hero size; the chip icons at 0.11; knockout shapes (closed laptop lid, ruler ticks, compass sun) use the flat
    academy color, so a faint edge may show against the background's soft light falloff.

## Getting files to Bryan (true until the Claude Code move)
In a cloud chat, Project docs arrive only as text and Bryan's Mac folder is the working copy. Deliver new or changed files as
downloads (and `project_write` them). To change a big file Claude only has as text, prefer an exact-match patch (build-script
PATCHES or a one-time Thonny patcher). Several Project copies are older than the Mac's (see housekeeping), so never rebuild a
patched file from its Project copy.

## Music direction (approved, unchanged)
Lab Maze: FM card (`fm`) · D2 ASCII World: 2600 TIA (`tia`) · D1 DOS Prompt: beeper (`beep`) · Contour Desk: sampler + airship (`snes`) ·
Starfield: 4-op FM + PSG (`arcade`). Overclock (default) plays Track 2 on each channel's chip; Lounge plays Encyclopedia Lounge on every
channel; Lounge (Chipped) plays it on each channel's chip. Overclock knobs (score): `bpm`, `tr`, `bpms`, `lead`, `clear`, `vary`,
`master_db`; form knobs in `FORM` (`audio__style-overclock.js`). Lounge knobs (score): `split`, `altEvery`/`restEvery`, `keys`,
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
- The intro motif is fixed: its G→C♯ drop only lands on Overclock's key at −3 st. While it plays, cards wait; a mode or tempo change
  lands when it ends.
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
  thread at load and on every word/seed/count change.
- Academies film: if Bryan has lost the ORIGINAL player, later hero/icon changes can't be re-run with `tools__patch_heroes.py`; they
  need a small one-off patch against his current file (strip it with `tools__strip_player.py` and upload it first).

## Next
0. **Pre-move bookkeeping (in a web chat).** The Project was the source of truth for the docs, so the Mac may lack or have old
   copies of some. Put `00_CLAUDE.md`, `00_HANDOFF.md` (both Oct 9 fold versions) and `tools__sync_check.py` in the Build folder, run
   the check (read-only), download whatever it lists as MISSING or STALE from the Project (drop any `claude/` prefix), run it again
   until it says "Ready for the move." OPTIONAL = Track 2 history, Bryan's call. The fold leftovers (`*.prefold.bak`,
   `dist/cdrom-player.reference.html`) can go any time. **Living files to check on the Mac too (Oct 9):** `living__template.html`,
   `living__trio.js`, `living__variant-cs.js`, `living__variant-ex.js`, `living__words-ex.json`, `tools__build.py`,
   `tools__hershey_words.py`: the Project copies are the newest. **9h:** `tools__build.py` (Oct 9h, jukebox) and
   `tools__cdrom_ambient.py` (Project path `claude/tools__cdrom_ambient.py`) go in too; then run `tools__build.py` (TARGETS jukebox,
   or both) and `tools__build_cdrom.py` + `tools__cdrom_ambient.py`, and listen/watch: the jukebox's 10 new cartridges (levels next to
   the others) and a few minutes of `dist/cdrom-ambient.html` (Starfield should still go to hyperspace). **Dust Type (Oct 15):**
   `proj__dust__brief.md`, `proj__dust__player-src.html`, `fonts__OFL-Montserrat.txt` (all under `claude/`) go in too.
1. **Move to Claude Code** (in Claude Code, on the Mac folder):
   a. `cd .../EncartaBoi/Build01/Build`, `git init`; `.gitignore`: `dist/`, `*.bak`, `__pycache__/`, `.DS_Store`. First commit = the
      folder exactly as it is (the safety net; the folded source is in it).
   b. `00_CLAUDE.md` → `CLAUDE.md`, rewritten for a real folder: same file map and audio/legibility rules; drop the Project-only rules
      (`claude/` prefixes, project_write, "deliver a file every ~15 tool calls", patcher scripts, "patch, don't regenerate" becomes
      "edit in place, commit per stage"). Fix the map for the fold: `proj__cdrom__player-src.html` now holds the channel titles and
      boot screen (`TITLES`, `BOOT_LINES`); `tools__build_cdrom.py` no longer has `TITLES_JS`/`BOOT_JS` and its `PATCHES` is empty;
      drop the patcher/fold rows. Also fix the living rows (see "File map changes" above: `living__trio.js`, `living__variant-ex.js`,
      `living__words-ex.json`, the 'ex' variant). 9h rows: `tools__cdrom_ambient.py` (ambient post-processor; or fold it into
      `tools__build_cdrom.py` as a second output), and `tools__build.py`'s jukebox now loads the three CD-ROM style files
      (`JUKEBOX_LIB`) and makes the per-chip cartridges; the "loungechip and overclock live only in the CD-ROM build" exception in
      Builds becomes "CD-ROM build + jukebox". Add the Dust Type set (and, optionally, a tiny `tools__build_dust.py`: subset + embed
      the font, see the brief). This file stays the status file (or becomes `STATUS.md`).
   c. Delete the spent patchers (`tools__patch_overclock.py`, `tools__patch_oct9b.py`, `tools__patch_loaders.py`,
      `tools__patch_clear_sampler.py`, `tools__patch_airship.py`, `tools__fold_cdrom.py`), the `.bak`/`.prefold.bak` files and
      `dist/cdrom-player.reference.html`; commit.
   d. Optional, later: turn the `__` names into real folders (the build scripts already accept both); one commit, rebuild, diff.
2. **Stage 5 extras:** fontTools subsetting for size (`pip install fonttools`), QA note, ZIP. Publish.
3. **Settle the regression baseline** (see the Regression bullet) before any change to an existing shared audio file. Easier in Claude
   Code: run CHECK under Node 22 and 26 side by side.
4. Measure Overclock levels across a whole 9e set per chip (and the unmeasured items above); adjust `master_db` if a chip drifts.
5. Update `proj__cdrom__brief.md` with the 9c passes, the 9e long form and the 9h ambient version.
6. Check in passing: 9e long form and 9f airship in the player (built, not yet confirmed), and from Oct 8 Lounge (Chipped) levels →
   `LOUNGE_CHIPPED_TRIM`, louder Lounge speech.
7. **Living posters, parked by Bryan (Oct 7); build for ALL three players together (ssr, cs, ex), in the shared template/sound-timer:**
   a. **5-minute timer option:** add 5 to the `#tmin` select in the template's `#ui`.
   b. **Readout:** done Oct 9 (see Living posters). Left to decide: should it be a button/toggle in the UI instead of `?noclock`?
   c. **Random vine entry points:** word vines and card-bloom vines nearly always start at the bottom right now. Wanted: genuinely
      random entry. **Word vines** enter from the LEFT half of the screen (x < 0 with (0,0) at the screen centre, any y) and write
      left to right, so they never write over their own trail (right-to-left rejected: the letters would be drawn in reverse order).
      **Card-bloom vines** (`startFiddle` / `startTrio`) may enter from any direction. Check the leftward drift (7 px/s, `DRIFT`):
      a left-side start leaves the screen sooner, so give word starts room; `startWord` and `buildWord`'s lead-in tendril are the places.
8. **Academies film:** Bryan runs `tools__patch_words.py` on his v2-patched player (heroes) and watches the new file (landscape and, if
   used, portrait). If he finds the ORIGINAL player, `tools__patch_heroes.py` v3 on it gives the same result in one run. Keep the
   patched file as the new master. After the Claude Code move, bring the film's source into the folder so changes stop needing patchers.
9. **Dust Type:** run the gen drop-in (see Status). Then Bryan's call: use it in a real piece (title or end card in a film, a gen-library cartridge), a
   brand palette, impact/whoosh sound, or capture via `?manual`. Ideas not yet tried: a bake in a Web Worker (no load hitch), a
   per-letter colour palette from a brand file.

## Open taste questions
- Clear sampler for the Chips music on Their Finest Duds too (Chips is approved music: Bryan's call).
- Card 12 ES/PT wording (Claude's drafts).
- Tempo/Key menu for Lounge (Chipped) later?
- Jukebox blurb says every cartridge "plays forever without repeating"; the two ports loop by design and ignore the seed.
- Boot taglines: Bryan may want to cut or add some (`BOOT_LINES`, now in `proj__cdrom__player-src.html`).
- Overclock set shape: always end on the lifted B, or sometimes skip the lift? (`FORM`, one line.)
- Ambient stamp: look, size and placement once seen (knobs at the top of `tools__cdrom_ambient.py`).
- Jukebox: 10 CD-ROM cartridges may be a lot; trim `JUKEBOX_CHIPS` (e.g. Overclock on all five, Lounge (Chipped) on two)?
