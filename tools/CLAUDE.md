# tools/: the Python scripts Bryan runs

Status, the regression history and known limits: `tools/STATUS.md`.

## Rules for every script here
- **Thonny-friendly:** run with the Run button, no command-line arguments, every setting a variable in a `SETTINGS`
  block at the top.
- Each script resolves paths from the repo root (its parent folder), so it runs from anywhere.
- Don't read `dist/` builds (big, mostly base64 fonts) unless the task is debugging a build.

## Scripts
| Script | What it does |
|---|---|
| `build.py` | Living posters + jukebox (`living/CLAUDE.md`, `jukebox/CLAUDE.md`) |
| `build_cdrom.py`, `cdrom_ambient.py` | The CD-ROM screensaver and its ambient version (`proj/cdrom/CLAUDE.md`) |
| `gen_export.py` | Tk GUI for one gen cartridge → standalone HTML and/or MP4 with its music (`gen/CLAUDE.md`) |
| `html_to_mp4.py` | Tk GUI: pick a player .html, get an .mp4. FILM players (the Academies master: `DHS.film`) render frame-exact with offline music; STEPPED players (`?manual` + `advance()`: CD-ROM, living posters, gen with `cart=<name>`) are stepped frame by frame and their music is recorded from a real-time run (not locked to the picture). Needs ffmpeg (found automatically, or BROWSE) and Playwright + Chromium |
| `render_piece.py` | Renders a one-off score (`proj/<name>/music.js` setting `PIECE.render(sr)`) to WAV + MP3 at `TARGET_LUFS`, true-peak limited, ffmpeg-checked |
| `calibrate.py`, `porter.py`, `midi.py`, `regress.py` | Music library tools (`audio/CLAUDE.md`) |
| `hershey_words.py` | Makes the `living/words*.json` files for any word list (`VARIANT`) |

`engine/tools/html_to_mp4.py` is the starter engine's original MP4 script; `html_to_mp4.py` here replaces it.

## Video
Never render an MP4 by hand in a sandbox: use `html_to_mp4.py` (it drives `?manual` + `advance()`/`renderAt()`, or
`DHS.film.render` for the film), or `gen_export.py` for gen.

## Publishing a build
`players/` holds published copies of `dist/jukebox.html`, `pltw-cse.html`, `cdrom-player.html`, `cdrom-ambient.html`,
`living-player.html`, `living-player-cs.html`, `living-player-ex.html` and `gen/dist/gen-player.html`. After rebuilding
one, copy it into `players/` and commit, so the public copies don't go stale. Only publish a build that loads without
script errors. Adding or renaming a player: update `index.html` (the Pages landing page; `.nojekyll` must stay, or Pages
hides `gen/carts/_bundle.js`) and keep `README.md` true.

## Folders the tools use
`fonts/` (OFL TTFs `build_cdrom.py` downloads + every `OFL-*.txt` license; ship the licenses in any ZIP), `font_cache/`
(`build.py`'s font cache, git-ignored), `dist/` (builds, git-ignored), `players/` (published copies), `media/` (README
images, e.g. `pltw-cse-preview.jpg` cut from the MP4).

## Tools on the Mac
Node via Homebrew (`/opt/homebrew/bin/node`), ffmpeg at `/opt/homebrew/bin/ffmpeg`. Thonny starts without Homebrew on
its PATH, so a script with a `NODE_EXE` or `FFMPEG_EXE` setting may need the full path there (`regress.py` already has
it; `html_to_mp4.py` finds ffmpeg itself).
