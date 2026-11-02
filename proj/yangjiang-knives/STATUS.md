# STATUS: Knife Country (Yangjiang knives scrolling page)

_Last updated: Nov 2, 2026._ Brief: `brief.md` (approved; Stage: build). Storyboard: `storyboard.md` (approved).

## Where it is
- **Round 1 built (stage 2, playable rough):** chapters 0–4 (cold open, the 1,400-year story, the ban, Sheffield
  with Plate 1, Made in Germany with the Sheffield chart), the strike component (steel deboss, seal, rubber stamp),
  the title belt (full on each change, then a slim gold strip at the screen edge; tap for the lineage) and the
  numbered source list.
- Build: `build.py` (Thonny Run; needs `pip install fonttools brotli`) → `knife-country.html` (about 750 KB, offline).
  Sources in `src/` (`page.html`, `page.css`, `page.js`, `sources.json`). Not published to `players/` yet
  (`PUBLISH_TO` is empty until round 3).
- Fonts: Source Serif 4, Archivo (width axis), Noto Serif SC subset to the characters used; licenses in
  `fonts/OFL-SourceSerif4.txt`, `OFL-Archivo.txt`, `OFL-NotoSerifSC.txt`.

- Plate 1 animates: the edge drops onto bone and bends, rolls, holds or chips (Bryan's request after round 1).

## Checked
- No script errors on phone (390×844) or laptop (1440×900) in Chromium; screenshots looked over at 14 scroll points.
- Text contrast: every pair ≥ 4.5:1 (lowest: gold on red, 4.67).

## Open
- Round 2: chapters 5–12 (Solingen with the war and forced-labor panel, Japan, 十八子, OEM, the comeback, the
  scorecard, the label decoder) and plates 2–7.
- Round 3: polish, QA report, publish to `players/` + `index.html` + `README.md`.
- To verify before launch: the CATRA edge-angle numbers (Plate 3), the Bourdain quote (don't quote until checked),
  the cut-off carbide line in q4; the Reuleaux source link (Cambridge chapter) may not be the page that quotes him.
- Not tested yet: Safari/iOS, keyboard-only pass, real reduced-motion run.
