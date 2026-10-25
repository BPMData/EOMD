# CLAUDE.md

EOMD (Efficient Offline Motion Designer) makes motion-design pieces for clients: self-contained HTML players and MP4s
with synthesized music. The repo is maintained by Bryan Murphy; a client can be anyone, and is usually not technical.

Read the root `STATUS.md` index at the start of every session; read a piece's own `STATUS.md` (in its folder) when
working on that piece. Update both at the end of a working session.

## Rules for every piece
- **Never invent facts:** names, dates, programs, places, numbers. If it isn't in a brief, copy file or config, ask.
- **Copy is word for word:** text from the client's copy files appears exactly as written. Don't reword, shorten or
  "fix" it. Translations Claude drafted are marked **DRAFT** in the brief or the piece's `STATUS.md`.
- **A player is a single offline HTML file:** fonts, data, audio code and images inlined; nothing loads from the
  internet.
- **Motion is time-based:** frame rate never changes speed; `render` is a pure function of time where possible.
  Nothing flashes more than 3×/s. If it loops, the seam is mid-shot, never on a cut.
- **Player defaults:** fullscreen; controls hidden until mouse-move or tap, fading after 3 s; safe-area padding;
  prefers-reduced-motion respected; a Start sound button (browsers block autoplay audio); a main-thread fallback for
  audio (blob workers may be blocked).
- **Audio:** synthesized at 48 kHz. Loudness comes from the brief ("How it's watched", "Music and sound"); true peak
  ≤ −1.5 dBTP. Verify with ffmpeg `ebur128=peak=true:framelog=quiet`.
- **Legibility:** type sizes come from the viewing distance in the brief. Check WCAG contrast and report honestly.
  Languages come from the brief.
- **Client context:** once the interview shows who the client is, read their file in `brief/clients/` if there is one
  (Bryan: `brief/clients/bryan.md`).

## New pieces: interview first
Before any NEW piece (a new video, poster or player; not a change to an existing one), run `/new-piece`: interview
the client, then write `proj/<name>/brief.md` and get it approved. A one-line request is the start of the interview,
not the brief. Details: `brief/INTERVIEW.md`.
- **Gates:** interview → brief approved → concepts → storyboard, stills and sound concept → build. The brief's status
  line carries `Stage:`, so any session knows where it is.
- **Design comes before tools.** During design, stay out of the picture, sound and tool folders (`gen/`, `living/`,
  `engine/`, `academies-film/`, `players/`, `dist/`, `media/`, `audio/`, `score/`, `jukebox/`, `tools/`), other
  pieces' `proj/` folders and their `STATUS.md` files (the full list: `notes/context-plan.md`, "The restricted
  list"). They open with `/toolbox` at the gate: right after the brief is approved in efficient mode (ready-made
  parts); after the storyboard, stills and sound concept are approved in full creative mode (from scratch).
- **Earlier pieces are examples, not a menu.** Take mechanisms and lessons from them, never their look or music.
- **The client reads no jargon.** Everyday words in every question and everything they see.

## Process
Stages, each ending in a delivered file and a commit: 0 interview and approved brief · 1 sketches or stills
(and the sound concept) · 2 playable visuals · 3 music samples · 4 full player · 5 extras. Rough and early beats
polished and lost.

## Where to go
| Task | Go to |
|---|---|
| A new piece | `/new-piece`; `/toolbox` at its gate |
| A change to an existing piece | Its folder: `proj/cdrom/` (CS Lab Screensaver), `academies-film/` (Academies hallway film), `living/` (SSR, CS and Exploration living posters), `proj/pltw/` (PLTW promo). Each folder's `CLAUDE.md` loads by itself when you open a file there; its `STATUS.md` holds the history |
| Library or tool work | That folder: `gen/`, `audio/` + `score/`, `engine/`, `jukebox/`, `tools/` (each has a `CLAUDE.md`) |
| How new pieces start | `brief/`: `INTERVIEW.md`, `TEMPLATE.md`, `CRAFT.md`, `example-academies.md`, `taste/house.md` (default taste), `clients/` |
| The public face | `README.md` (keep it true when tools or builds change), `CONTRIBUTING.md`, `LICENSE`, `index.html` (the Pages landing page; `.nojekyll` must stay) |
| CI | `.github/workflows/ci.yml` |
| Why context is staged | `notes/context-plan.md`; repo-wide history: `notes/history.md` |

## Maintainer rules (for working on this repo)
- **Scripts Bryan runs are Thonny-friendly:** the Run button, no command-line arguments, every setting in a `SETTINGS`
  block at the top (`tools/CLAUDE.md`).
- **Edit in place, commit per stage:** change the source files directly (no patcher scripts), and commit at the end
  of each stage or delivered change with a message that says what changed.
- **Open only the files the task needs.** Don't read `dist/` builds unless the task is debugging a build.
- **Verdicts are kept:** every client verdict ("approved", "looks cheesy") goes into the brief's Decisions log, in the
  client's words. A verdict that would hold for other pieces becomes or adjusts an item in `brief/taste/house.md`.
