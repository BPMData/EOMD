# Academies hallway film: status

_Moved from the root `STATUS.md` on Oct 25, 2026 (context plan step 2); the root file is now a short index. Update this file when working on the Academies film._

## Status
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
