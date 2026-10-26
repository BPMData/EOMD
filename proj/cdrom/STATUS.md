# CS Lab Screensaver ("CD-ROM"): status

_Moved from the root `STATUS.md` on Oct 25, 2026 (context plan step 2); the root file is now a short index. Update this file when working on the CD-ROM screensaver._

## Status
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
  - **Oct 26 fix, eras never swapped:** the era dwell (240-300 s) ran on `T`, which advances at most 0.05 s per frame, so a slow
    frame rate or a throttled/hidden tab stretched it (Bryan left it 10 min on era 1). It now runs on real time (`RT` in `player-src.html`).
    Checked in the browser by simulating 5 fps; rebuilt `dist/`, `players/` copy not yet refreshed. Bryan: confirm on the real machine.
  - **Built, still unheard (Oct 8):** Previous Era / Next Era, Lounge (Chipped), Lounge speech ~3 dB louder (`LOUNGE_SPK` 1.4).
  - **How Overclock works in the player** (details in the files' header comments): `audio/style-overclock.js` cuts the piece into
    endless 8-bar sections (intro once, then passes), voices each bar through `TRACK2R2.chipEvents`, adds chip-voiced Dud speech from
    the bar's chord, applies clear mode + post EQ + master_db. `score/cdrom-overclock.json`: bpm 142.5, tr −3, `bpms` menu list,
    `lead` strings, `clear` ["snes"], `vary` 1, master_db per chip (fm −15.38, tia −9.29, beep −17.87, snes −11.9, arcade −13.11;
    measured on the A+B loop). `proj/cdrom/music.js`: modes Overclock (default) → Chips → Lounge → Lounge (Chipped); segmented tempo
    grid; Tempo/Key menus while Overclock plays; `?music=`, `?bpm=`, `?tr=`, `?plain`.
- **Track 2 history** is in the brief (rounds 1–3; Overclock chosen; 142.5 BPM, −3 st; clear sampler). The audition pages were
  deleted Oct 20 (not kept in git).

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

## Next
2. **Check the 9h builds (built Oct 20, in `players/`):** listen/watch: the jukebox's 10 new cartridges (levels next to the others) and a few minutes of
   `dist/cdrom-ambient.html` (Starfield should still go to hyperspace; the AMBIENT_VER stamp is unseen).
3. **Stage 5 extras:** fontTools subsetting for size (`pip install fonttools`), QA note, ZIP. Publish.
5. Measure Overclock levels across a whole 9e set per chip (and the unmeasured items above); adjust `master_db` if a chip drifts.
6. Update `proj/cdrom/brief.md` with the 9c passes, the 9e long form and the 9h ambient version.
7. Check in passing: 9e long form and 9f airship in the player (built, not yet confirmed), and from Oct 8 Lounge (Chipped) levels →
   `LOUNGE_CHIPPED_TRIM`, louder Lounge speech.

## Open taste questions
- Clear sampler for the Chips music on Their Finest Duds too (Chips is approved music: Bryan's call).
- Card 12 ES/PT wording (Claude's drafts).
- Tempo/Key menu for Lounge (Chipped) later?
- Boot taglines: Bryan may want to cut or add some (`BOOT_LINES`, in `proj/cdrom/player-src.html`).
- Overclock set shape: always end on the lifted B, or sometimes skip the lift? (`FORM`, one line.)
- Ambient stamp: look, size and placement once seen (knobs at the top of `tools/cdrom_ambient.py`).
