# House taste profile

The default taste for every piece, distilled from the client verdicts kept in this repo (Bryan's, Oct 2026). Most first
requests carry little taste, so these apply unless the brief overrides them. Hard rules live in `CLAUDE.md`, not here.

**How to use it**
- One line per item: `ID · strength · area · [condition ·] the preference — the verdict it came from`.
- **strength:** `strong` = the default; overriding it needs a reason in the brief. `soft` = a lean.
- **area:** motion, type, color, music, sound, structure, process.
- **condition:** the item applies only once the interview has answered it ("How it's watched"): `plays once` /
  `repeats`, `sound on` / `off` / `unreliable`, `walk-up` / `seated` / `scrolling`, `short` (< 30 s) / `medium` /
  `long` (> 5 min), `far` / `near`, and (from §9) `more than one language`. No condition = every piece. No format is assumed until the client says it.
- **In the brief (§13):** `Taste: house. Applies: T01–T06, T09 (repeats), T19 (sound unreliable). Overrides: T18 off
  (the client wants a hard cut back to the start).` QA (§17) checks that every applicable `strong` item is honored or overridden there.
- **New verdicts flow in:** when a brief's Decisions log records a verdict that would hold for other pieces, add an
  item (next free ID) or adjust one. IDs are never reused; retire an item by marking it `retired`.
- Parse with `^T\d+ · (strong|soft) ·`.

## Items
T01 · strong · structure · Words and picture belong to one idea: no captions laid over unrelated imagery. (Building the words out of the picture is not required either.) — PLTW r1, Oct 20: "words on top of unconnected visuals ... looks bad"; the words-inside-the-picture rule "should stay dead" (Oct 25)
T02 · strong · motion · Every effect is there because the beat needs it, not because the tool can do it. — PLTW r2, Oct 20: "looks cheesy as hell, but it's exactly what I asked for"
T03 · strong · music · Each piece gets music written for it; never another piece's score. — PLTW r1, Oct 20: the seven-academy music made no sense for CS
T04 · strong · process · Let the client choose by looking and listening: a page of options (choice panel), not descriptions. — Academies hero marks: the demo-sheet pickers "were a great methodology" (Oct 25)
T05 · strong · process · Show something rough early; rough and early beats polished and lost. — CLAUDE.md Process (Bryan's rule)
T06 · strong · structure · Avoid the subject's clichés: no "the future", no stock-corporate energy, no ranking one part above another. — Academies brief
T07 · strong · music · when long or repeats · Breathers beat repetition: sections that thin out and come back. — CD-ROM 9c: "the breather periods really do break up the samey-sameyness"
T08 · strong · music · when long or repeats · Contrast beats a loop of the same bars: a half-time passage, a solo, a key lift. — CD-ROM Track 2 lessons; the 9e long form: "sounds good on all chips"
T09 · strong · sound · when repeats · Nothing that grates on the hundredth hearing: no piercing tones, alarm- or bell-like sounds, harsh risers, big drops. — Academies brief
T10 · strong · sound · Cut tinny, buzzy or abrasive timbres, and never open on the harshest one. — CD-ROM: brass lead "way too tinny and brassy"; a buzzy duck "way too abrasive"; the 2600 chip too abrasive to open with (Oct 9)
T11 · strong · sound · Check the mix on small laptop speakers: a part that vanishes there must be revoiced. — CD-ROM: the mallet vanished on MacBook Air speakers
T12 · strong · music · when seated and long · Music under reading or work stays out of the way: no lead that pulls focus. — SSR: Direction B rejected, "the flute is too distracting"
T13 · strong · music · Dense, worked-out writing (real changes, counter-lines, fills) over sparse riff-and-pedal ideas. — CD-ROM Track 2: sparse riff sketches rejected; dense late-80s fusion "10x better"
T14 · soft · music · For a sampled lead, warm strings before flute, horn, reed or brass. — CD-ROM Oct 9: strings settled; flute and horn sound alike
T15 · soft · sound · Gibberish speech blips are short and clipped, with silence between them, or they smear into a buzz. — CD-ROM Dud speech (Oct 8)
T16 · strong · structure · when walk-up · Every beat makes sense to someone who just arrived. — Academies brief
T17 · strong · structure · when repeats · The core message is readable more than once per loop, not only on the end card. — Academies brief
T18 · strong · structure · when repeats · The loop point is a breath, not a restart: mid-motion, no fade to black, no silence gap. — Academies brief
T19 · strong · structure · when sound off or unreliable · The picture tells the whole story on its own. — Academies brief
T20 · strong · color · Dark text on yellow and other light brights, never white; tint a brand color that fails contrast rather than use it for text. — Academies brief; PLTW r2 (PLTW Blue tinted for dots and accents)
T21 · strong · type · when far · Heavy weights, big sizes, short lines: no thin weights or small text on a distant screen. — Academies brief
T22 · strong · motion · Redraw brand marks from the official logo's own shapes at one consistent line weight; never trace or invent. — Academies icons redrawn from the logo hexes (approved)
T23 · strong · motion · Hero marks play once and hold, keeping a little life (a gear turning) rather than looping busily. — Academies hero marks (approved Oct 9)
T24 · soft · motion · Small ambient life in icons (a tassel in a breeze, waves pulsing out) beats a static icon. — Academies: the tower's waves "way better"; the book approved
T25 · strong · motion · Growing or accumulating visuals never pile up into clutter. — SSR poster: growth must never pile up
T26 · strong · motion · Check every shape and move for unintended readings before showing it. — SSR: Matisse fronds rejected (the scale-in read as phallic)
T27 · soft · structure · Evocative over literal: a look that suggests the subject beats one that illustrates it. — SSR: the field-journal look rejected as too literal; the Kells look chosen
T28 · soft · structure · Humor is welcome: a dry joke in the copy, characters played wildly over the top. — SSR's quotidian joke; CD-ROM 9d airship Duds (Bryan loved it)
T29 · strong · motion · A retro look is period-true: pixel grids, dithering, hard edges, few frames; no smooth vector pretending. — CD-ROM 9f airship: "exactly what I was thinking of. Absolutely peak."
T30 · strong · process · A finished deliverable carries no tool UI: no galleries, knob panels or menus. — PLTW standalone (Oct 20): it must not carry the gen gallery UI
T31 · strong · process · The final video comes from a one-click tool, not a manual procedure. — Oct 20: "that CANNOT be how we generate the final video"
T32 · soft · process · A study stays a study: don't turn an experiment into a standalone product unless asked. — Dust Type: "it was never meant to be a standalone anything"
T33 · soft · structure · when more than one language · Multilingual moments as a flourish: close cognates and greetings morphing across languages, Brazilian Portuguese spelling. — Academies brief
