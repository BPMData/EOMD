# STATUS: Knife Country (Yangjiang knives scrolling page)

_Last updated: Nov 3, 2026._ Brief: `brief.md` (approved; Stage: build). Storyboard: `storyboard.md` (approved).

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

- **Round 2 built (stage 4, full page):** chapters 5–11, all in the page now:
  - Solingen with Plate 2 (bolster hang), the 1938 law, the war, and the plain forced-labor panel
  - Japan with the scroll-driven porcelain stamps, the 関 strike and Plate 3 (an edge-angle slider; a cut that
    shows the single bevel steering)
  - Yangjiang with Plate 4 (the wenwudao: slice or chop), Plate 5 (the sandwich steels overlaid) and the 李 → 十八子
    split
  - the OEM years with a stacked bar
  - the comeback with a VG-10 composition chart, Plate 6 (heat treatment), Plate 7 (the garlic smash) and an
    export bar chart
  - the scorecard
  - the label decoder
  - The belt has five states (Sheffield, Solingen, split, the volume belt, vacant); the lineage lists every holder
    up to the current one.
- 52 sources, all cited; build is about 850 KB.

## Checked
- No script errors on phone (390×844) or laptop (1440×900) in Chromium: the whole page walked screen by screen, and
  every plate, the decoder, the scorecard and the belt lineage exercised.
- Text contrast: every pair ≥ 4.5:1 (lowest: gold on red, 4.67).

- **Round 2 review applied (Nov 3):** new opening, chapter transitions, drill-downs, the scroll-driven export permit,
  always-on dividing belts, a unitless Plate 3, a redrawn wenwudao, the export donut and the OEM legend, and big chapter
  titles (see the brief's Decisions log).

## Open
- Round 3: polish, QA report, publish to `players/` + `index.html` + `README.md`.
- To verify before launch: the CATRA edge-angle numbers (Plate 3), the Bourdain quote (don't quote until checked),
  the cut-off carbide line in q4.
- Not tested: Safari/iOS and reduced motion (Bryan has neither); a keyboard-only pass is still to do.
