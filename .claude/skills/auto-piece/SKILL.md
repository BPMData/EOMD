---
name: auto-piece
description: >-
  Run EOMD's build, audio calibration, frame rendering, and isolated fresh-eyes visual/audio QA pipeline once
  the brief (efficient mode) or storyboard, stills, and sound concept (full creative mode) are approved.
---

# Guided-Brief + Autonomous Build & Fresh-Eyes QA (`auto-piece`)

## Stage 1 — Always Align With the User First (`Stage: interview -> brief / storyboard`)
1. Unless the user explicitly instructed otherwise, **always interview first** (`brief/INTERVIEW.md`, Round 1+): confirm viewing context, tone, voice, mode (`efficient` vs. `full creative`), and `Budget: light | standard | deep`.
2. In `full creative` mode, draft concepts and `proj/<name>/storyboard.md` + stills (`proj/<name>/stills/*.png`), run an **isolated fresh-eyes subagent review** (`brief/CRAFT.md` §11) writing `proj/<name>/stills/review.md`, fix clear mistakes, and present to the user until `APPROVED`.

## Budget & model rules
- **Antigravity:** Run the coordinator on **Hydrogen High**; leave subagent model overrides unset unless requested.
- **Claude Code / Codex:** Never use `fable`, `turbo`, or effort above `high` (`max`, `xhigh`, `extra`). On `Budget: light`, route reviewer/helper subagents to `sonnet` (or `haiku` for narrow checks) and ask before spawning `>3` subagents (`Budget-Override: approved`). On `Budget: standard`, Opus (`medium` effort) is fine for coordination with `sonnet` workers.

## Stage 2 — Build & Audio Verification (`Stage: build`)
1. Open `/toolbox` at the gate, write the **Build plan** in `proj/<name>/brief.md`, and share the plain-words plan before building if not yet confirmed.
2. Build the player (`players/<name>.html`) and synthesized audio (48 kHz, true peak ≤ −1.5 dBTP). Verify audio via `ffmpeg` (`ebur128=peak=true:framelog=quiet`, `showspectrumpic`, `showwavespic`, `silencedetect`), `tools/render_piece.py`, or `tools/regress.py`.

## Stage 3 — Isolated Fresh-Eyes QA (`proj/<name>/qa/`)
1. Capture ≥ 2 frame PNGs (`proj/<name>/qa/`, plus loop-seam / cut frames if applicable) and inspect them via `Read`/`view_image`.
2. Launch an **isolated fresh-eyes reviewer subagent** (`subagent_type: "fresh-eyes-reviewer"`, `.claude/agents/fresh-eyes-reviewer.md`) giving it ONLY `proj/<name>/brief.md`, `storyboard.md`, the `qa/*.png` frames, and the ffmpeg audio measurement sheet (no source code). Have it write `proj/<name>/qa/review.md`.
3. Fix any reported mistakes, re-capture & re-inspect affected frames/audio, update `index.html` and `STATUS.md` if publishing, and present the verified piece + review summary.
