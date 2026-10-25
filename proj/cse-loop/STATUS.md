# STATUS: CSE hallway loop

_Last updated: Oct 25, 2026._

- **Stage:** build, stage 3 done (Oct 25): full 48-s music (S2 Glass Lobby, mallet snaps, tight snare) scored to the picture cues, synthesized in the player (blob Worker, main-thread fallback), mastered in the browser to -16 LUFS / -1.5 dBTP (checked in Node: -16.00 / -1.50; ffmpeg on the MP3: -16.3 LUFS, peak -1.7). Loop seam clean (a one-pass low-cut was clicking; now circular). `render_music.py` makes a listening MP3. Next: stage 4 polish.
- **What it is:** a 30–60 s looping HTML player about PLTW's Computer Science Essentials for the Information
  Technology & Cybersecurity Academy hallway TVs at Danbury High School; also shared with CS educators via GitHub Pages.
- **Sources:** `sources/CSE_CourseOutline_CS.pdf` (PLTW course outline, BR015.06.2026), `sources/itc-academy-badge.webp`
  (Bryan's Academy badge). PLTW colors from pltw.org/about/brand-assets.
- **Peeking audit:** 0 reads of restricted folders so far (`access.jsonl`).
- **Code:** `src/` (core, blocks = port of Bryan's MakeCode geometry, line, art, film, runtime = adapted engine runtime), `build.py` (one offline HTML), `music.js` + `render_samples.py`. Fonts in `fonts/` (Poppins, Source Code Pro, OFL); PLTW logo shapes from pltw.org in `src/art.js`.
- **Known rough spots (stage 2):** row 1's first seconds are sparse; the end card leaves ~0.8 s of empty blue before the seam; ES/PT lines are small (40 px); blocks in the micro:bit row are at 1.35x (26 px text, under the 32-px target); reduced motion not handled yet.
- **Keep in step:** `music.js` CUES are copied from `src/film.js` times; change both together.
- **Next:** stage 4 polish (rough spots above, reduced motion, QA), stage 5 publish to `players/`; then (dead last) a second player with S3 Maker Bench.
- **Note:** `make_stills.py` saves PNGs with headless Chrome (mock keychain, throwaway profile, to avoid the macOS popup Bryan saw on the first run); set `MAKE_PNGS = False` to skip it. Quick Look (`qlmanage`) mis-scales SVGs, so it is not used.
- **Debug note (Oct 25):** two early Bash calls failed because `echo ======` in zsh is an `=command` lookup; use `---`
  or quote it. Not a repo bug.
