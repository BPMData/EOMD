# Motion starter

A reusable engine for looping motion-design pieces: time-driven canvas animation, synthesized music and sound effects, a kiosk player, and a dev player. This is the stripped-down base of the Academies of DHS hallway film.

**Try it:** open `dev.html` (scrubber and controls) or run `node tools/build-player.js` and open `dist/player.html`.

**Edit:** all content lives in `config.js`: sections, words, colors, icons, the lead instrument per section, and bar lengths. At 96 BPM, 1 bar = 2.5 s.

**Commands** (Node 18+; Playwright only for stills and smoke tests):
- `node tools/build-player.js` builds the self-contained `dist/player.html`.
- `node tools/render-audio.js` writes `build/audio/` stems and a loudness report.
- `node tools/stills.js outDir 1920 1080 3 13 23` renders stills; `python3 tools/sheet.py out.png 4 0.25 files…` makes a contact sheet.
- `node tools/smoke.js` runs a headless test of the player.
- `tools/html_to_mp4.py`, run in Thonny, exports an MP4 with audio (edit the paths at the top).

**Structure:**
- `src/core`: math, easing, color, timeline, embedded font.
- `src/draw`: shapes and 21 line icons.
- `src/scenes`: shared helpers plus `card.js`, the example scene to copy.
- `src/film.js`: assembly.
- `src/fx/lens.js`: optional WebGL2 finish over the 2D canvas (see below).
- `src/audio`: DSP, music, SFX, master.
- `src/player/runtime.js`: clock, audio, fitting.

**Lens (optional finish):** `src/fx/lens.js` runs the finished 2D frame through the GPU: glow on bright parts, a soft
horizontal streak, a colour fringe at the edges, an optional film tone curve, vignette and grain. Turn it on with
`lens: {}` in `config.js` (or set any knob from `DHS.lens.DEFAULTS`); try it on any player with `?lens=1`, compare with
`?lens=0`. The scenes don't change. It is a pure function of the frame and `t` (grain is seeded by time), so stills
(`render.html`) and MP4s (`tools/html_to_mp4.py`) match the player. Without WebGL2 the plain canvas plays. With every
knob at 0 it passes the picture through unchanged. Watch for these: the glow haloes white type (keep `bloom` low and
re-check legibility); `vignette` darkens the corners, so re-check footer contrast; `tone: 'film'` darkens whites by
about 20%, so it is off by default to keep brand colours. Cost: about 2 ms a frame at 1920×1080. It needs only the
`DHS` namespace, so other builds can inline it.

The working rules are in `CLAUDE.md` at the repo root; a new piece starts with the interview in `brief/INTERVIEW.md`.

**Font:** Bricolage Grotesque (SIL OFL 1.1), license in `fonts/OFL.txt`.
