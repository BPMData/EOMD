# STATUS: CSE hallway loop

_Last updated: Oct 25, 2026._

- **Stage:** storyboard (Snap + One Line), revised Oct 25: drone beat in Python, micro:bit sensing beat, three sound directions (S1–S3) to pick by ear after `/toolbox`. Waiting for approval.
- **What it is:** a 30–60 s looping HTML player about PLTW's Computer Science Essentials for the Information
  Technology & Cybersecurity Academy hallway TVs at Danbury High School; also shared with CS educators via GitHub Pages.
- **Sources:** `sources/CSE_CourseOutline_CS.pdf` (PLTW course outline, BR015.06.2026), `sources/itc-academy-badge.webp`
  (Bryan's Academy badge). PLTW colors from pltw.org/about/brand-assets.
- **Peeking audit:** 0 reads of restricted folders so far (`access.jsonl`).
- **Next:** brief approval → concepts (read `brief/CRAFT.md` first) → storyboard, stills, sound concept → `/toolbox`.
- **Note:** `make_stills.py` saves PNGs with headless Chrome (mock keychain, throwaway profile, to avoid the macOS popup Bryan saw on the first run); set `MAKE_PNGS = False` to skip it. Quick Look (`qlmanage`) mis-scales SVGs, so it is not used.
- **Debug note (Oct 25):** two early Bash calls failed because `echo ======` in zsh is an `=command` lookup; use `---`
  or quote it. Not a repo bug.
