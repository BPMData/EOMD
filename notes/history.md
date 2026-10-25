# Repo history (moved out of STATUS.md)

_Moved from the root `STATUS.md` on Oct 25, 2026 (context plan step 2); the root file is now a short index. Update this file when working on repo-wide changes._

## Status entries
- **New pieces start with a client interview (Oct 25, Claude Code in the cloud; branch `ccr-1a9f3c89-1xqwn8`).** Bryan's
  worry: the cartridges made pieces cheaper, but the repo could no longer make another Academies film. Finding: the
  Academies film came from Bryan's ~1,800-word prompt (Claude web UI, no project files), a blank page and a written craft
  bar, not from a toolkit; PLTW had no brief at all, and a new-piece session here opens with ~8,500 words about other pieces.
  New:
  - `brief/INTERVIEW.md`: how to interview the client (rounds of 2–3 questions; ★ questions every time, both modes; ask
    about the problem, in experience terms; vague words turned into choices; landmines; facts with sources; delegation
    only for creative areas), then brief → approval → 2–3 concepts → design before tools (full creative mode).
  - `brief/TEMPLATE.md`: 19 sections + a Decisions log; the default craft bar (§14) and QA list (§17) are generalized from
    the Academies prompt.
  - `brief/example-academies.md`: Bryan's Academies prompt, word for word.
  - `/new-piece` skill (`.claude/skills/new-piece/SKILL.md`) starts the interview.
  - CLAUDE.md "New pieces" rewritten (interview first; the efficient/full creative question is in round 1; full creative
    designs before picking tools; the "words inside the picture" rule removed, Bryan: "should stay dead");
    Process gains stage 0. README, CONTRIBUTING, `gen/API.md` and `engine/README.md` point to it.
  - Mode question for a non-technical Pro user, in usage terms (Bryan, Oct 25): ready-made styles ≈ 5–20% of one
    5-hour limit; from scratch ≈ half to all of one, best started before the limit resets or before stepping away.
    No dollar estimates (pay-per-use developers are on their own). Rough: each brief logs its real usage; replace the
    ranges after three pieces per mode. Interview questions go in everyday words ("church tag sale" test).
  Not yet tried on a real piece.
- **Open-source pass (Oct 20, Claude Code in the cloud; branch `claude/loving-mccarthy-83ac1l`, one PR into main).**
  Bryan approved all four parts:
  - **Real folders.** The ~95 flat files moved with `git mv` (history follows: the rename commit changes no content):
    `audio/`, `score/` (+ `FORMAT.md`), `tools/`, `proj/<piece>/` (academies, cdrom, cs, ex, pltw, ssr), `living/`, `jukebox/`,
    `engine/` (now the real tree: `engine/src/audio/dsp.js`), `notes/`, `tests/hashes.json`, `fonts/OFL-*.txt` (next to the TTFs).
    `tools__unpack.py` deleted (nothing left to unpack). Every `tools/*.py` resolves paths from the repo root (its parent folder),
    so Thonny's Run button still works: **open `tools/build.py` instead of `tools__build.py`**. All five audio loaders,
    `tools/build_cdrom.py`, comments, CLAUDE.md, README.md, gen/API.md and this file use the new paths (names of files deleted
    before Oct 20 are left as history). Old notes may still say `audio__x.js`: that's `audio/x.js`.
  - **Checked in the cloud (Linux, Node 22.22, Python 3.13, Chromium 141):** regression CHECK 0 mismatches of 93 after the move;
    every published player rebuilt from the new layout (jukebox, cdrom-player, cdrom-ambient, the three living posters, gen-player,
    pltw-cse) and compared with builds of the untouched clone: same code apart from file names in comments (CD-ROM fonts differ
    only by fontTools' build timestamp). Each loaded headless with no page errors, canvases drawing, and sound measured after
    pressing the button (Web Audio players: signal at the speakers; gen: the embedded 60-s MP3 playing). The PLTW MP3 was
    re-rendered first with `tools/render_piece.py` (-16.3 LUFS, -1.5 dBTP, same length; differs from the published one only by
    MP3 encoder noise). The non-GUI scripts were run by path from another folder (build, build_cdrom, cdrom_ambient, render_piece,
    calibrate, midi, hershey_words); the GUI ones (gen_export, html_to_mp4, porter, regress) opened their windows, and
    gen_export's MAKE HTML and the porter's score picker were driven. **Not run in the cloud:** an MP4 export (the sandbox's
    Playwright wanted a newer Chromium), anything on a Mac or in Thonny itself. The starter engine's missing fonts are fixed: `engine/fonts/`
    now holds `DHSDisplay.ttf` + `DHSText.ttf` + `OFL.txt` (Bricolage Grotesque, copied from `academies-film/source/fonts/`) and the
    generated `engine/src/core/fontdata.js`, so `engine/dev.html` opens and `node tools/build-player.js` builds and plays (tested headless).
  - **CI** (`.github/workflows/ci.yml`, badge on README): gen build + smoke test + "generated files committed" check, and the
    audio regression CHECK on Node 22, on every push and PR. First run on GitHub still to be confirmed.
  - **CONTRIBUTING.md** + issue forms (bug, cartridge idea); README's "planned" paragraph now links to it. README's
    "Why the file names look like `audio__style-lounge.js`" section became "Where things are".
  - **STATUS.md** visitor header (top of this file).
  - Cloud notes: `tools/build.py`'s font URLs (`github.com/.../raw/...`) were blocked by the sandbox proxy, so its font cache was
    filled from `raw.githubusercontent.com` (same files; `tools/build_cdrom.py` already uses that host). Commits use the noreply address.
- **Repo made presentable for Bryan's CS class (Oct 20):** README leads with the PLTW promo (link + `media/pltw-cse-preview.jpg`),
  a "How the PLTW video works" section for students, a note on the `__` file names, stale MP4/music lines fixed; GitHub
  homepage set to the Pages site, topics added.
- **Rule added Oct 20:** CLAUDE.md "New pieces": ask efficient vs full creative mode first; words inside the picture;
  one-off music scored to picture. `tools/html_to_mp4.py` renders picture-only when a page is silent (no more crash).
  Known gap: `tools/html_to_mp4.py` still can't hear a gen cartridge's `<audio>` track (use `tools/gen_export.py`).
- **Public on GitHub (Oct 20): https://github.com/BPMData/EOMD** (Efficient Offline Motion Designer), MIT license (Bryan Patrick Murphy), `README.md` for visitors. Commits use the noreply address `123925276+BPMData@users.noreply.github.com`.
- **Prebuilt players in `players/` (Oct 20):** every build made fresh from the current sources (jukebox, CD-ROM + ambient, the three
  living posters, gen) and copied in. Each one was loaded headless: no script errors, sound starts, frames render. That means the 9h
  scripts (jukebox CD-ROM cartridges, ambient version) have now run; their levels and the AMBIENT_VER stamp are still unheard/unseen by Bryan.
- **Moved to Claude Code (Oct 20, DONE).** This folder (`MotionDesign`) is the single source of truth, in git. Deleted: the spent patchers and one-off tools (`tools__patch_*.py`, `tools__fold_cdrom.py`, `tools__strip_player.py`, `tools__rebuild_living.py`, `tools__sync_check.py`, `tools__check_files.py`), the Track 2 audition files (`proj__cdrom__track2-audition.html`, `-r2-audition.html`, `-r3.js`, `-sketches.js`, `tools__build_track2.py`) and `academies-film/danbury-academies-player_ORIGINAL.html`. `motif.txt` → `proj/cdrom/intro-motif.md`. `00_CLAUDE.md` → `CLAUDE.md`, `00_HANDOFF.md` → this file.

## Done items from Next
1. **Move to Claude Code: DONE (Oct 20).** git repo, cleanup, `CLAUDE.md` + `STATUS.md`, gen dust layer wired in.
10. **Real folders: DONE (Oct 20, open-source pass).** After merging: on the Mac, `git pull`; Thonny scripts are now `tools/<name>.py`.
11. **Community cartridges: DONE (Oct 20):** CONTRIBUTING.md, issue forms, CI on every pull request. Left: a `community/` folder if many arrive; watch the first CI runs on GitHub.

## Old "Last updated" line
_Last updated: Oct 25, 2026 (new pieces start with a client interview and an approved brief: `brief/`). Before that, Oct 20 (open-source pass in the cloud: real folders instead of `__` names, CI, CONTRIBUTING, regression baseline settled for Node 22. Before that: moved to Claude Code: git repo, spent patchers and Track 2 auditions deleted, CLAUDE.md + this file; gen dust layer wired in; `tools/html_to_mp4.py`. Earlier: Oct 15 Dust Type study; 9e Overclock long form; 9f airship parts; 9g PATCHES folded into the player source; 9h ambient screensaver + CD-ROM music in the jukebox (not yet run); living posters' time-left readout; Academies film heroes, icons and word blocks)_
