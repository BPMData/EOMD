# STATUS: CSE hallway loop

_Last updated: Oct 25, 2026._

- **Stage:** build, stage 4 done (Oct 25): polished and checked (QA below). Next: stage 5, publish to `players/` + `index.html` (Bryan's OK first), then the S3 Maker Bench second player.
- **What it is:** a 30–60 s looping HTML player about PLTW's Computer Science Essentials for the Information
  Technology & Cybersecurity Academy hallway TVs at Danbury High School; also shared with CS educators via GitHub Pages.
- **Sources:** `sources/CSE_CourseOutline_CS.pdf` (PLTW course outline, BR015.06.2026), `sources/itc-academy-badge.webp`
  (Bryan's Academy badge). PLTW colors from pltw.org/about/brand-assets.
- **Peeking audit:** 0 reads of restricted folders so far (`access.jsonl`).
- **Code:** `src/` (core, blocks = port of Bryan's MakeCode geometry, line, art, film, runtime = adapted engine runtime), `build.py` (one offline HTML), `music.js` + `render_samples.py`. Fonts in `fonts/` (Poppins, Source Code Pro, OFL); PLTW logo shapes from pltw.org in `src/art.js`.
- **Keep in step:** `music.js` CUES are copied from `src/film.js` times; change both together.
- **Next:** stage 4 polish (rough spots above, reduced motion, QA), stage 5 publish to `players/`; then (dead last) a second player with S3 Maker Bench.
- **Note:** `make_stills.py` saves PNGs with headless Chrome (mock keychain, throwaway profile, to avoid the macOS popup Bryan saw on the first run); set `MAKE_PNGS = False` to skip it. Quick Look (`qlmanage`) mis-scales SVGs, so it is not used.
- **Debug note (Oct 25):** two early Bash calls failed because `echo ======` in zsh is an `=command` lookup; use `---`
  or quote it. Not a repo bug.

## QA (stage 4, Oct 25)
Verified:
- **Loop:** picture seam is mid-wipe (by construction: every scene is a function of time, checked at t +- 48); audio seam step 363 vs a typical 172 / p99 1917 (the click from a one-pass low-cut was fixed).
- **Audio:** the player's own synthesis code measured in Node: -16.00 LUFS, -1.50 dBTP, 48 s, ~10 s to make; ffmpeg on the MP3: -16.3 LUFS, peak -1.6 dBFS. Above 5 kHz sits ~26 dB under the mix (nothing harsh).
- **Picture:** 60 fps in Chrome on Bryan's Mac, including the dot burst; no console errors; the film steps 0-48 s in 0.1-s steps with no exceptions.
- **Contrast (WCAG):** ink on yellow 13.8; white on Danbury Blue 10.6, on PLTW Blue 7.8, on Academy Red 5.4; yellow on Danbury Blue 7.3, on PLTW Blue 5.3; code strips 13.8-20.1. MakeCode's own block colors with white text: blue 3.2, green 3.1, teal 3.0 (pass only as large text, 26-34 px), red 5.2, pins 6.3, purple 4.7. Phone "Tap me!" 3.2 (34 px bold).
- **Flashes:** none over 3/s (the propeller shimmer, ~10 Hz, was replaced by a steady blur). One soft ring at the burst.
- **Facts:** every on-screen name is in brief section 5 (CSE, PLTW, MIT App Inventor, VEXcode VR/EXP, Python, BBC micro:bit, CoDrone EDU, the Academy, Danbury High School). Code is plausible editor code: the drone lines are Robolink's own; block labels and the VEX/micro:bit code are drafts written to look like each editor. ES/PT lines and the counselor line are **DRAFT**.
- **Reduced motion:** opens paused on the end card with a note; Play runs it.
Not verified:
- Real hallway TVs (65-75", cheap 4K upscaling), real TV or laptop speakers, a slow school PC (sound takes ~10 s to make there or longer; the picture runs meanwhile).
- The ES/PT lines (need Bryan or a named checker).
Known limits: micro:bit row blocks are 26 px text (target 32 px); MakeCode Pins red is approximate; a brief crossfade overlap as the opening hero shrinks (~0.25 s).
