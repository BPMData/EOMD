# proj__cdrom__brief.md: CS Lab Screensaver ("the CD-ROM one"), v3.1 (Oct 9: Overclock default; timer readout; Their Finest Duds word structures)

## Pitch
A 90s CD-ROM screensaver left running on a lab CRT, starring failed virtual pets. Up-tempo, funny,
readable. Plays in CS work time (incl. 7 am) once students are working on their own. It's a reskin of the
CS living poster: reuse its timer/TICKET OUT, controls, music streaming, wake lock, reduced motion.

## Files
- `proj__cdrom__dud.js`: the Dud, Bryan's original 16×15 sprite (exact), plus mutation parts (antennae,
  eyes, mouth, legs, palette), angry/happy/squint/grimace faces, tuck legs and the goggles overlay. Use it everywhere.
- `proj__cdrom__channel-d.html`: the approved D1/D2 sketch (105 KB, mostly the embedded font).
- `proj__cdrom__sketch.js`: the approved Stage 1 vibe-board code. Reuse its raycaster, card window, marquee
  words, contour desk, starfield and channel-surf dither dissolve.
- `proj__cdrom__player-src.html`: the player source (Stage 2b). `tools__build_cdrom.py` builds `dist/cdrom-player.html` from it,
  swapping in `proj__cdrom__music.js` and applying its PATCHES (fold them into the source in Stage 5).
- Copy: `proj__cs__copy.md` + `proj__cdrom__cards.md`, word for word. Code words: `living__words-cs.json` (the words only).
- Fonts (OFL, embedded): VT323 (card headlines, window labels, SAVE card, D1/D2 big headlines; Oct 8: Pixelify was too
  hard to read, E looked like 8/B), Pixelify Sans (marquee words, STAR VOYAGE title, boot punch lines), Atkinson Hyperlegible
  (body), Jacquard 24 (Their Finest Duds title, boot logo). Source: github.com/google/fonts (ofl/…); licenses are in
  `fonts__OFL-*.txt`. D1/D2 use Source Code Pro (license already in the project).
- Music: `audio__chips.js` + `audio__style-chip.js` + `score__cdrom-{fm,tia,beep,snes,arcade}.json` (chips);
  `audio__style-lounge.js` + `score__encyclopedia-lounge.json` + voices in `audio__instruments-cdrom.js` (Lounge);
  `audio__style-loungechip.js` (Lounge (Chipped); its five scores are derived at build);
  `proj__cdrom__track2-r2.js` (Overclock's notes) + `audio__style-overclock.js` + `score__cdrom-overclock.json` (Overclock).
  Player sound block: `proj__cdrom__music.js` (Oct 9: the build's music patches are folded into it).

## Cast: the Duds (failed virtual pets)
- **Dud 2D** (flat pixels) lives in Contour Desk and DOS Prompt. **Dud 3D** (glossy voxels on the same parts)
  lives in Lab Maze and Starfield, except the goggled Dud 2D in Starfield.
- Every Dud entering the screen rolls a random mutation (`DUD.random`). Up to 3 on screen; each one randomly
  wanders in from or out through an edge.
- Tama movement: jerky whole-step hops over the X–Y plane (not just left/right), with irregular pauses.
- Duds bounce off each other. Bouncing words bounce off Duds, and the hit Dud shows the angry face for ~1 s.
- On a corner hit, nearby Duds cheer (happy face + hop) while pixel confetti pops and a soft 2-note ding plays in the music.
- **Speaker:** before a card appears, one Dud stops, faces out and "speaks" it.
- Glorp is dropped.

## Boot screen (Oct 8, built; Bryan: "looks great")
- A cheesy CD-ROM title card when the player opens; the click that leaves it starts the sound (browsers block audio until a click).
- Original design, inspired by early-90s publisher logos (not a copy of any): a dithered gray-marble plaque with a raised edge and
  engraved inner line, a goggled "cool Dud" mascot that hops every 3 s, a gold **Dud Lab** logo (Jacquard 24, extrude, glint
  sweep every 3.5 s), a joke "TM", "P R E S E N T S". Then a setup line types out (VT323) and a punch line zooms in with a bounce
  (Pixelify, one Dud color per letter). "CLICK OR PRESS ANY KEY TO BEGIN" blinks (1 Hz); "press M to begin without sound".
- Taglines rotate one per open (`BOOT_LINES` in `tools__build_cdrom.py`, editable; `?line=N`). Bryan's two, word for word:
  NOW EMBARKING UPON... A CYBER ADVENTURE! · Preparing to Float Upon.... THE TEMPORAL SUPERHIGHWAY!. Six more by Claude: The future
  is now... AND ALSO 1980! · Please insert disc 1 of... INFINITY! · You are about to experience... TOTAL EDUTAINMENT! · Fasten
  your seatbelt for... THE DUD DIMENSION! · Warning: may contain... MAXIMUM MULTIMEDIA! · Strap in! Next stop... THE INFORMATION
  SUPERHIGHWAY!
- Click / any key = begin with sound (+ a short C-major "ta-daa" chime, `BOOT_CHIME`); M = silent; F = fullscreen. The card dithers
  into Tomb of the Duds!. Unattended, it begins silently after 90 s (`?bootwait=N`). `?noboot` / `?manual` skip it. A "LOADING...
  PLEASE WAIT" line shows while the channels are built. Reduced motion: no zoom, hop or glint.

## Cards
- **Three separate windows**, never stacked into one: EN → ES → PT, each arriving ~0.8 s after the last and
  popping from the speaking Dud (90s bevel zoom, ≤0.4 s). Fixed slot and color per language, as in the CS poster:
  EN cream/charcoal, ES charcoal + mustard title, PT mustard/charcoal. The title bar is the language name only
  (English / Español / Português). No tip counter.
- Hold 12–15 s, close, then ~15–25 s card-free.
- Order: shuffled bag (no repeats until all are shown). Decided Oct 7.
- As built (2a): windows pop at 0 / 1.4 / 2.4 s so each speech phrase finishes before the next starts. Long cards split
  into sentence pages (~12.5 s each) with "1/2" in the title bar.
- Legibility: ≥44 px body, ≥90 px headlines. Three full-size windows cover most of the screen while up; that's
  accepted because they clear. Long cards (6, 14) get split rather than shrunk. Report contrast honestly.

## Channels ("eras"): final output = Channel Surf
Order (Oct 8): chronological, `ORDER = ascii → dos → stars → desk → maze`; the saver boots on the first. Internal keys are unchanged.
When a channel starts, its title shows top-left for ~4 s (waits while a card is up, fades early if a card pops). Names are Bryan's,
exact punctuation: **Tomb of the Duds!** (D2, 1980 · 2-voice TV chip) · **Duds.EXE** (D1, 1984 · 1-bit PC speaker) · **STAR VOYAGE**
(Starfield, 1988 · 4-op FM + PSG) · **Their Finest Duds** (Contour Desk, 1991 · 16-bit sampler) · **Circuit Maze 3D** (Lab Maze,
1993 · FM sound card). Each title uses its era's lettering.
The saver rotates eras on its own (~4–5 min each) with an ordered-dither dissolve; **Previous Era / Next Era** buttons (keys P / N,
← / →) switch by hand. The picture dissolves within about one bar; the music crossfades on a bar line. The cards and Duds persist
across a dissolve.
1. **Contour Desk** (old SSR sketch #3 look): a Mode 7 flight over an endless navy contour map of a mountain range
   (FF6-airship feel): tileable fBm heightmap drawn once at boot (tinted bands, index contours, map grid, peak
   marks). True perspective, steep view (Oct 8: tilted ~12° further down, closer, faster): horizon at y 215 under a dithered navy sky with flat pixel clouds, near ground ~3× magnified,
   one pattern-filled 4 px strip per row with ripmaps (~32 MB) so far lines don't shimmer; horizon haze; fixed compass
   rose. No breathing. Reduced motion: map holds still.
   **Code words as structures (Oct 9b, replaces the DVD bounce):** three block-letter words (the faux-3D marquee lettering) stand
   on dark slabs on the contour map, drawn in the map's own Mode 7 perspective. Each rises out of the ground far ahead, grows as the
   airship approaches (≥44 px letters for ~26 s, ~190 px at the bottom), passes beneath and returns far ahead with a new word.
   A structure sweeping over a Dud makes it angry (soft color swap ≤0.5 s). Every ~3–4 min one is lined up to pass dead centre
   under the airship: nearby Duds cheer, the 2-note ding plays, confetti bursts from the bottom centre. Reduced motion: they stand
   still, fully grown. Code: `proj__cdrom__addons.js`.
   **Duds in the air (Oct 9d):** the speaker rides a zeppelin at bottom centre (cards pop from it; the cheer fires when it passes over
   the lined-up word); the other Duds fly faux-3D fighter planes on any heading, never colliding (a close pass makes both pilots scowl).
2. **Lab Maze**: original first-person raycaster at low res, upscaled. Circuit-board walls, school floor tiles, drop
   ceiling with light panels.
   - Generated maze; the camera follows the right-hand wall, so it reaches dead ends and turns around.
   - Framed paintings on the walls: Dud 2D mutations and code words.
   - Walls (Oct 8): mostly plain circuit board; ~10% with a chip; ~30% hold readable 128 px panels from a no-repeat bag:
     the 15 code words, 8 short Python snippets (lore: `pet.evolve()  # FAILED`, `# Duds are / # failed / # virtual pets`),
     4 Dud paintings. Text faces read correctly (mirroring fixed).
   - ~85% of dead ends hold a slowly rotating floating **Dud 3D "boss"** (none shall pass), assigned in route order from a
     no-repeat bag of 8 distinct mutations (never the same model twice in a row; iPod-shuffle rule). The camera approaches,
     pauses ~1 s face to face, then turns 180°.
   - Cards are spoken by a Dud 2D that pops up from the bottom edge (HUD guide).
3. **Starfield**: many more stars, and real hyperspace streaks.
   - Speed varies randomly between calm cruise and hyperspace, ramping over ≥1.5 s with no white flash. Hyperspace
     only happens in card-free gaps; cards land at cruise. An original doppler whoosh (band-passed noise + saw, pitch up
     going in, down coming out) plays on entry/exit.
   - The field sometimes banks left or right. Code words fly at the cockpit like stars and pass by. Dud 3D planets
     drift past now and then.
   - A Dud 2D in a starfighter helmet (Oct 9e; the ill-fitting aviator goggles moved to the zeppelin captain) flies a little space
     fighter along the bottom (Oct 9d; it used to walk). He staggers dramatically with each
     bank, and in hyperspace he shows the squint + grimace face with tuck legs, "pressed back into his seat". He
     speaks the cards.
4. **DOS Prompt (D1)** and 5. **ASCII World (D2)**. Bryan kept both (Oct 7); they replace Tiled Desktop.
   - Both use a 72×24 grid at 44 px in Source Code Pro (subset, OFL).
   - Shared text-mode cards: 16-color palette with EN grey/black + blue title (5.7:1 title, 9.0:1 body), ES magenta
     + yellow title/white body (6.0/6.4:1), PT cyan/black (7.3:1). Double-line borders, inverse label chip, black
     shadow. Headlines are pixel text rendered small, thresholded, then scaled 5× (90 px).
   - **D1:** a blue text-mode "Dud Lab": the prompt types code words and the Lab answers with failed-pet jokes;
     F-key bar (Feed/Clean/Praise/Respawn; moves up one row when the timer is on). Every 7th command
     is `type readme.txt`, which prints lore lines about failed virtual pets. The Dud is drawn in half-blocks from a 12×12 cut of the sprite
     (12×6 cells), max 2 Duds. Cursor blinks ≤2/s.
   - **D2:** a zero-player roguelike (2a fix): one generated lab room per screen (walls, 2–3 doors, partitions, desks,
     racks, plants, coolers, shelves, loot, cables; always connected for a 5×3 Dud). The party explores 40–70 s, then
     between cards walks out a door; a text-mode wipe sweeps the next room in from that side and they walk in the
     opposite door. New Duds arrive through doors; expired ones leave through the nearest. Cards wait during a room
     change. Code words bounce off walls, partitions, furniture and loot (a word left inside one after a room change
     ghosts out). Status row shows ROOM nn. Duds are 5×3 ASCII
     critters, e.g. `[o_o]`; mutations are character swaps (brackets per color, eyes, antennae, legs). Max 3 Duds.
   - Code to reuse: `proj__cdrom__channel-d.html` (sim, grid renderer, box drawing, cards, speech). Bryan kept
     its joke lines (Oct 7).
   - No real OS names, startup text or logos.

## Dud speech (Star Fox-style gibberish)
- When a Dud speaks a card, it plays a short blip burst: ~1.3 s for the EN window, ~0.9 s each for ES and PT.
- Blips are 32nd notes on the song's tempo grid, pitched from the current chord or scale, so the speech sits in the
  groove. Each phrase drops in pitch at the end.
- The voice comes from the mutation color: octave + wave (yellow square, green low saw, lilac high triangle, etc.).
- In Overclock, Chips and Lounge (Chipped) the speech is voiced by the current channel's chip inside the rendered music (in Overclock
  on Overclock's own grid and from the chord of the bar it falls in, whatever the tempo). In Lounge it is a soft WebAudio blip
  (Bryan, Oct 8: keep the soft blips, a bit louder; raised ~3 dB, `LOUNGE_SPK`).

## Music (v3.0)
**Audition (Oct 8).** Sources are `proj__cdrom__audition.js` / `proj__cdrom__audition2.js` (Node, sandbox only) and the voices in `audio__instruments-cdrom.js`.
The six styles were A Night Drive (city pop),
B Local Forecast (smooth-jazz fusion), C Encyclopedia Lounge (edutainment bossa, 116 BPM, G major ii–V, marimba + vibes,
nylon pluck, clave, CD-ROM "ding" bleeps), D Tracker Funk (pulse arps, 4-bit triangle bass), E1 Lab Maze FM and E2 Adventure 2600.
Bryan's verdict: C was the clear winner of A–D and D came second; E1 and E2 "rule super hard".

**Music button (key L) cycles four modes (Oct 9):** Overclock → Chips → Lounge → Lounge (Chipped). The player starts in
Overclock (Bryan, Oct 9: Chips on the TIA is too abrasive to open with). `?music=overclock|chips|lounge|chipped` starts in one.

**Mode 1, Overclock (Track 2, default; Oct 9, heard and loved).** "Stage 1 · Overclock", an original fast
action-stage theme in late-80s arcade/console fusion style (line clichés, circle of fifths, secondary dominants, chromatic pivot
E minor → F♯ minor, slap bass with octave pops and chromatic approaches, twin lead in 3rds/6ths with 16th runs, 16th hats + ghost
snares). 4-bar intro once, then A (8 bars) + B (8 bars) loop. The notes live in `proj__cdrom__track2-r2.js` (shared with the
audition page); `audio__style-overclock.js` cuts it into 8-bar sections and adds chip speech.
- Each channel plays it on its own chip, exactly as auditioned: twin lead on fm / snes / arcade; tia and beep play the melody
  alone; the TIA drops sour notes an octave. Era switches re-voice it on a bar line, as in Chips.
- **Tempo + key (Overclock only):** default **142.5 BPM, −3 semitones (C♯ minor)**. A Tempo and a Key menu sit next to the
  Music button while Overclock plays (tempos 116–168 from the score's `bpms`; keys +2 … −6); `?bpm=` / `?tr=` set them at load
  (any value; it joins the menu). A change crossfades at the next section boundary and keeps the place in the tune. Chips and
  Lounge stay at 116 (their tempo is tied to the Contour intro timing and the TIA frame grid).
- **Their Finest Duds:** the intro motif (below) plays first, then Overclock restarts at its head exactly where the motif ends
  (its timpani/bass G→C♯ drop lands on C♯ minor at −3 st). If the channel changes during the motif, the motif still finishes and
  the next chip starts Overclock at that moment.
- **Clear sampler** on Their Finest Duds (`clear` in the score): pre-emphasized samples, lighter echo, slap bass, 16 kHz output EQ.
  The sampler melody uses `strings` (score field `lead`; Bryan, Oct 9: the leads all sound alike, strings is fine).
- Loudness: −23 LUFS per chip at 142.5 BPM / −3 (master_db per chip in the score, measured over two A+B loops in the sandbox);
  other tempos and keys are not re-measured.
- Entering Overclock from another mode starts it at its head.
- **Variations + energy (Oct 9c):** after the intro, Overclock plays as seeded passes (full / var / sparse / build / break / lift)
  in sets of ~2.5–3.5 min: melodic variations, twin 3rd/6th flips, tom fills, sparse verses, a half-time breakdown, snare-roll
  builds and a whole-step key lift. Every session plays a different chain; `?plain` plays the bare A+B loop. A longer composed form
  (C/D sections) is planned on top (`FORM` in `audio__style-overclock.js`).

**Mode 2, Chips: a chip per channel.** Each channel's backing track is played by its own era's sound chip, as if the
scene were a real game. All five chips play the SAME generative composition, so an era switch re-voices the tune on a bar line.
A skin survives only as gentle post-EQ (for example the TV-speaker lowpass on the TIA).
- Lab Maze: FM card (OPL2-style 2-operator FM with feedback, 4 waveforms, rhythm-mode drums, mono, dry). Model: E1.
- D2 ASCII World: 2600-style TIA (2 channels, 31.4 kHz dividers, 60 Hz frame sequencer, 4-bit volume). Pitches snap to
  the chip, so some notes go sour on purpose. Drums and Dud speech steal channels. Model: E2.
- D1 DOS Prompt: 1-bit PC beeper (one 50% square, no volume; per-sample priority snare > kick > speech > bass thump > lead > arp).
  Chosen Oct 8 over a 3-square PSG (too sophisticated for the era). Bryan loves its noise-click snare: keep it.
- Contour Desk (3c): 16-bit sampler (8 voices at 32 kHz, priority stealing, 4-bit BRR, cubic interpolation, ADSR,
  dotted-8th echo). Lead `split`: strings sing, the vibraphone mallet answers in bars 5–6 (layered, the mallet vanished on
  MacBook Air speakers). Brass lead rejected as "way too tinny and brassy"; flute/horn sound alike; reed reads Mega Man X.
  Every 4th section is the original airship passage (relative minor, harp sweeps, string stabs, soaring lead).
  **Intro (Oct 8, approved):** each time Their Finest Duds starts in Chips or Overclock mode, an original 8-bar motif by Bryan's
  friend plays first on the sampler (3/4, 123 BPM, G Lydian / B minor; harp runs, B drone, timpani/bass G→C# drop). In Chips the
  snes stream fades in on the next bar line after it. `?nointro`. Oct 9b (Bryan: the drop bars sounded underwater): the intro uses
  the clear sampler and a bright low `pulse` sample for the octave pulse, at the approved Oct 8 loudness. The Chips sampler itself
  is not clear-mode (Bryan's call).
- Starfield (3c): 4-op FM (brass, bass, EP, pad) + PSG (arp, arp echo, thin lead double, noise drums). Bryan: "perfect
  in every way".
- Bryan (Oct 8): he loves the chips' soundscapes but isn't sold on the generative chip melody itself (hence Overclock).

**Mode 3, Lounge (3d, approved Oct 8).** Encyclopedia Lounge on every channel.
Built as the generative style `lounge`: C()'s tune is the head every 6th section; generative choruses in between (motifs
from the head's rhythms, chord-tone/chord-scale walks). The vibraphone (`loungeVibes`) answers in bars 5–6, leads every
4th chorus and doubles every other head; every 5th chorus is a breather. Keys G → B♭ → G → E♭ (3 sections each), with
turnarounds re-aimed at the next key. Cartridge `score__encyclopedia-lounge.json` (−23.0 LUFS), in the jukebox. Entering from
another mode, it restarts at its head.

**Mode 4, Lounge (Chipped) (built Oct 8, not yet heard).** Lounge's real notes (same seed + section = same tune) played by each
channel's chip within its limits, not a filter. `audio__style-loungechip.js` mirrors the lounge generator call for call
(`MUSIC.loungeEvents`), then gives each line to a part the chip has (`MUSIC.loungeChipEvents`):
- fm: marimba line → FM lead; vibes answers, breather arps, bleeps → glass bell; guitar comping → organ stabs; clave → soft rim; shaker → hats.
- tia: the whole tune on ch0, bass on ch1, clave as a noise tick; no comping, no shaker.
- beep: tune on the speaker; comping as quick 3-note broken chords in the gaps; clave as a blip.
- snes: tune on the score's lead (`split`: strings, the mallet answers in bars 5–6 = Lounge's own answer bars); comping → harp; clave → soft snare; hats.
- arcade: tune on 4-op brass (+ PSG double); vibes answers + bleeps on the PSG with its echo; comping → FM electric piano; noise hats.
The tune moves by whole octaves toward each chip's lead register, then single notes fold in. Kick on beats 1 and 3 only. The head's
vibes double is dropped. Lounge ↔ Lounge (Chipped) keeps its place in the tune (crossfade at the next section); an era switch in
Chipped mode re-voices the same tune on the next chip on a bar line. The build derives one score per chip (`lc_<chip>`: the lounge
score + that chip's tail, lead and master_db + `LOUNGE_CHIPPED_TRIM`). Loudness not measured yet (trims all 0 dB).

**Shared rules**
- Grid (Oct 9): 8-bar sections on a segmented grid. Chips and Lounge share 116 BPM (the Lounge tempo) and a related key family;
  Overclock runs at its own tempo. A mode change or an Overclock tempo/key change starts a new grid segment at a section boundary,
  so dissolves always cross on the playing mode's bar lines and Dud speech stays on its grid. The TIA approximates the tempo with
  frame-length 16ths.
- Chip music inside each chip's limits (voice count, tuning, volume steps). No quotes of real game music; every chip is an
  original simulation, with no real samples, ROM sounds or startup jingles.
- Music crossfades ≥1 s with the dither dissolve; mode changes crossfade 1.5 s at a section boundary.
- Dud speech level (approved Oct 8): the speech window reads ~+1.5 dB over the music alone. Blips must be short and
  clipped (silence between 32nds) or they smear into a buzz. FM ducks the music −5 dB under the Dud (−9 dB plus a buzzy
  patch was "way too abrasive").
- Loudness: every chip, Lounge and Overclock (at its defaults) reads −23 LUFS, peak ≤ −1.5 dBTP. (Not yet measured: the Contour
  intro, Lounge (Chipped), the boot chime, Overclock at other tempos/keys.)
- No 1-bit clipper on a polyphonic mix. The beeper is monophonic by nature, so it's fine there.

## Track 2 history (Oct 8–9; supersedes "Future: Track 2")
- Round 1 (three sparse 116 BPM riff + pedal sketches): rejected. Don't go back to sparse riff + pedal ideas.
- Round 2 "Stage 1 · Overclock" (late-80s fusion): "10x better", the direction. Round 3 "Stage 2 · Belfry" (gothic B minor) lost to
  Overclock; it stays in the audition page only.
- Final settings (Oct 9): 142.5 BPM, −3 st, clear sampler on the 16-bit sampler. Audition files: `claude/proj__cdrom__track2-*`,
  `claude/tools__build_track2.py`.

## Timer
- Options 5 / 10 / 15 / 20 / 25 / 30 min + Other… (1–240). `?min=` still works.
- **Time-left readout (Oct 9b, Bryan):** top-right, big retro-terminal digits (VT323 88 px, hi-vis yellow on a dark plate,
  ~14:1), in **10-second steps rounded up**: a 20-minute timer shows 20:00 at once, 19:50 after 10 s, 19:40 … 00:00. Students see
  how long is left without second-by-second doom-peeking. The bottom progress bar stays. Code: `proj__cdrom__addons.js`.

## Lore
- Duds = failed virtual pets, hinted in-world: D1 README lines, maze code panels. The trilingual "What Is a Dud?" card (D1)
  is in the shuffle; it lives in `proj__cdrom__cards.md` (CD-ROM only, so the CS poster is unaffected).

## Hard rules
- One self-contained offline HTML, 1920×1080, embedded OFL fonts.
- Must hold 60 fps on a school Chromebook: the raycaster stays ≤320×180, static layers are pre-rendered, and Dud 3D
  rotations are pre-rendered to sprite frames at boot.

## Stages (one per chat)
- ~~1. Mascots + still + vibe board~~ (done Oct 7)
- ~~2a. Player shell + 2D channels~~ (built Oct 7)
- ~~2b. Lab Maze + Starfield with Dud 3D~~ (built Oct 7)
- ~~3. Music style audition~~ (done Oct 8: chips per channel + Lounge option chosen).
- ~~3b. Chip engines, part 1 (fm, tia, beep)~~ (done Oct 8, approved)
- ~~3c. Chip engines, part 2 (snes + airship, arcade)~~ (done Oct 8, approved)
- ~~3d. Lounge as a generative cartridge~~ (done Oct 8, approved)
- ~~4. Full player~~ (running on Bryan's Mac Oct 8): per-channel chip streams crossfading at dissolves, Chips/Lounge toggle,
  chip-voiced speech, switch fix, channel titles, chronological order, Contour intro.
- 4b. Extras (built Oct 8; boot screen OK'd, the rest not yet heard): boot screen, Previous Era / Next Era, Lounge (Chipped),
  louder Lounge speech. Next: rebuild, listen, set `LOUNGE_CHIPPED_TRIM`.
- ~~4c. Overclock in the player~~ (Oct 9; Bryan: "soooo much better than chips"): default mode, Tempo/Key menu, intro before
  Overclock, clear sampler.
- 4d. Oct 9b (built, not yet seen): timer readout, Clear Names card, Their Finest Duds word structures, brighter intro.
- 5. QA note, fold PATCHES into the player source, fontTools for size, handoff update, ZIP. Publish.
