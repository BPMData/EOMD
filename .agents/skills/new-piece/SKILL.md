---
name: new-piece
description: Start any new EOMD piece (video, promo, poster, player, screensaver, or a screen loop made for an audience) by interviewing the client and getting a brief approved before any design or build. Use whenever someone asks for a new piece, however short the request. Not for changes to an existing piece.
---
Follow `brief/INTERVIEW.md` from the top: ask round 1 first (open nothing else before it), then start `proj/<name>/brief.md` from `brief/TEMPLATE.md` with `Stage: interview` and `Budget: light | standard | deep` (looking at `proj/<name>/` and `brief/clients/` before asking the client to re-type); interview in rounds (the ★ questions every time, mode + budget in round 1), weigh asides before elevating them, get the brief approved, then concepts, then storyboard + stills + sound concept (`brief/CRAFT.md`, with isolated fresh-eyes subagent review before showing the client). `brief/example-academies.md` is the level of detail to aim for.

Gates (update `Stage:` in the brief's status line at each one; enforced by `.agents/hooks/stage_gate.py`):
- interview → brief (APPROVED) → concepts → storyboard (table, stills, sound concept; fresh-eyes reviewed; APPROVED) → build & QA (`auto-piece`).
- **Efficient mode:** run `/toolbox` right after the brief is approved.
- **Full creative mode:** run `/toolbox` only after the storyboard, stills and sound concept are approved. Until then, read only `brief/`, this skill, the root `STATUS.md` index, the piece's own `proj/<name>/` and what the client supplied.
