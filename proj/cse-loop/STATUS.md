# STATUS: CSE hallway loop

_Last updated: Oct 25, 2026._

- **Stage:** build, stage 2 done (Oct 25): rough playable loop, picture only: `cse-loop.html` (built by `build.py`), contact sheet `stills/stage2-contact-sheet.png`. Sound picked: S2 Glass Lobby + mallet snaps + tight snare (`music.js`, 8 bars so far). Next: stage 3, the full 48-s music.
- **What it is:** a 30–60 s looping HTML player about PLTW's Computer Science Essentials for the Information
  Technology & Cybersecurity Academy hallway TVs at Danbury High School; also shared with CS educators via GitHub Pages.
- **Sources:** `sources/CSE_CourseOutline_CS.pdf` (PLTW course outline, BR015.06.2026), `sources/itc-academy-badge.webp`
  (Bryan's Academy badge). PLTW colors from pltw.org/about/brand-assets.
- **Peeking audit:** 0 reads of restricted folders so far (`access.jsonl`).
- **Code:** `src/` (core, blocks = port of Bryan's MakeCode geometry, line, art, film, runtime = adapted engine runtime), `build.py` (one offline HTML), `music.js` + `render_samples.py`. Fonts in `fonts/` (Poppins, Source Code Pro, OFL); PLTW logo shapes from pltw.org in `src/art.js`.
- **Known rough spots (stage 2):** row 1's first seconds are sparse; the end card leaves ~0.8 s of empty blue before the seam; ES/PT lines are small (40 px); blocks in the micro:bit row are at 1.35x (26 px text, under the 32-px target); reduced motion not handled yet.
- **Next:** stage 3 music (all 24 bars, cues from `src/film.js`), stage 4 polish + sound in the player, stage 5 publish to `players/`; then (dead last) a second player with S3 Maker Bench.
- **Note:** `make_stills.py` saves PNGs with headless Chrome (mock keychain, throwaway profile, to avoid the macOS popup Bryan saw on the first run); set `MAKE_PNGS = False` to skip it. Quick Look (`qlmanage`) mis-scales SVGs, so it is not used.
- **Debug note (Oct 25):** two early Bash calls failed because `echo ======` in zsh is an `=command` lookup; use `---`
  or quote it. Not a repo bug.
