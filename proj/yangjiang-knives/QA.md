# QA report: Knife Country (Nov 3, 2026)

Build: `proj/yangjiang-knives/knife-country.html`, published as `players/yangjiang-knives.html`, about 889 KB, one
offline file (fonts subset and inlined; the build fails if anything would load from the internet).

## Verified
- **Runs cleanly:** no script errors in Chromium at phone (390×844) and laptop (1440×900) sizes. The whole page was
  walked screen by screen at both sizes.
- **Interactions:** every plate (1–7), the export-permit scene, the porcelain stamps, 李 → 十八子, the scorecard, the
  label decoder and the belt lineage were exercised and looked over in screenshots.
- **Keyboard:** Tab reaches every link, drill-down, button, slider and chart point. Sliders move with the arrow keys;
  toggles and the belt's lineage dialog work with Enter; Escape closes the dialog.
- **Contrast:** every text/background pair is at least 4.5:1 (WCAG AA). The lowest is gold on red, 4.67.
- **Facts:** every figure on the page links to a numbered source (71 in all), each with a confidence note.
  - Reuleaux is cited from his own *Briefe aus Philadelphia* (1877, p. 16), found by Bryan.
  - The Bourdain passage is quoted word for word from Bryan's copy of *Kitchen Confidential*.
  - Plates 3 and 6 were checked against the Knife Steel Nerds articles Bryan supplied. One error was found and fixed
    on Plate 6: a point of hardness is about 15.8 mm of test card, not 5–10% of edge life. Plate 3's bar is still
    labelled as an illustration of the trend.
- **Copy:** in Bryan's voice (house taste T35). Name-drops are explained in drill-downs (T36). Chapter titles are
  as loud as their answers (T37).

## Not verified / known limits
- Not tested on iPhone/Safari or with reduced motion turned on. The code shows finished states and skips travel when
  reduced motion is on.
- Medium-confidence sources stay on the page with their confidence noted:
  - the one-wok-one-axe allowance
  - the 70/25/5 OEM split
  - Cangshan's own CATRA results
  - Seki's wartime counts
  - war-production details from militaria dealers
- Yangjiang's shares (75% / 85%) are self-reported, and the page says so.
- The title "Knife Country" is still a working title.
- The page is long: about 60 phone screens.
