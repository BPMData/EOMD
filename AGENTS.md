# EOMD: notes for AI agents (Antigravity, Codex, and others)

Read `CLAUDE.md` and `STATUS.md` first: all ground rules apply to every agent (`never invent facts`,
`copy is word for word`, single offline HTML player, time-based motion, synthesized 48 kHz audio ≤ −1.5 dBTP,
restricted-path stage order).

- **Standard hybrid flow (`new-piece` + `auto-piece`):**
  1. **Interview first** (`brief/INTERVIEW.md`, looking at `proj/<name>/` and `brief/clients/` after Round 1): confirm
     purpose, audience, viewing context ("How it's watched"), voice, mode (`efficient` vs. `full creative`), and
     `Budget: light | standard | deep`.
  2. **Concepts, storyboard & stills** (`Stage: concepts -> storyboard`): `brief/CRAFT.md` + `brief/STORYBOARD.md`,
     with isolated **fresh-eyes subagent review** (`brief/CRAFT.md` §11) before showing stills or choice panels to the
     user.
  3. **Autonomous build & QA (`auto-piece`):** after brief (efficient) or storyboard/stills/sound concept (full
     creative) is `APPROVED`, open `/toolbox`, build `players/<name>.html`, run ffmpeg `ebur128` / spectrogram checks,
     render QA frames into `proj/<name>/qa/`, pass isolated **fresh-eyes subagent review** (`proj/<name>/qa/review.md`),
     and finish QA before presenting.
- **Programmatic gates:** `.agents/hooks/stage_gate.py` (wired in `.agents/hooks.json`, `.claude/settings.json`, and
  `.codex/hooks.json`) enforces stage order, budget limits, inspected stills/QA PNGs, and fresh-eyes review receipts.
- **Fast ops & bookkeeping:** For file moves, non-visual tweaks, or pure Q&A (unless asked), skip `STATUS.md` updates
  and Playwright/MP4 renders.
