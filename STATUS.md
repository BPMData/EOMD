# STATUS.md: the index (read at session start; keep it short)

> **Visitors:** this is the project's working log, kept for the people and AI assistants working on it. For what
> EOMD is and how to use it, start with [README.md](README.md).

_Last updated: Oct 25, 2026 (CSE hallway loop published). Each piece's history, limits and open questions live in its
folder's `STATUS.md`; repo-wide history in `notes/history.md`._

## Pieces
| Piece | State | Next | Status file |
|---|---|---|---|
| CS Lab Screensaver ("CD-ROM") | Stage 4 on Bryan's Mac; extras through 9h built | Check the 9h builds; stage 5 extras | `proj/cdrom/STATUS.md` |
| Academies hallway film | Done; Bryan rendered the MP4 (Oct 20) | Watch hero size and chip icons | `academies-film/STATUS.md` |
| Living posters (SSR, CS, Exploration) | Done | Parked items (5-min timer, random vine entry); rebuild CS + SSR | `living/STATUS.md` |
| CSE hallway loop (new, full creative) | Done; published Oct 25 (`players/cse-loop.html`) | ES/PT check; real-TV check | `proj/cse-loop/STATUS.md` |
| PLTW CSE promo | r2 published ("cheesy as hell, but exactly what I asked for") | The PLTW test below | `proj/pltw/STATUS.md` |
| gen library (incl. Dust Type) | Working; `tools/gen_export.py` | Check Dust Type knobs | `gen/STATUS.md` |
| Jukebox | 15 cartridges | Redesign its look | `jukebox/STATUS.md` |

## Across the repo
- **CI** runs the gen build + smoke test and the audio regression CHECK (Node 22) on every push; the stage-read audit
  (warnings only) and the first-question eval (only with an `ANTHROPIC_API_KEY` secret) are new.
- **Regression baseline:** settled for Node 22; the Mac's Node 26 doesn't match it (`tools/STATUS.md`).
- **New pieces:** interview → brief → concepts → storyboard → build; tools open at the gate via `/toolbox`
  (`notes/context-plan.md`). Taste defaults: `brief/taste/house.md`.
- **Peeking audit (step 9):** 0 of 1 new pieces so far (CSE hallway loop: no restricted reads before its gate). Decision rule: peeks in 2 of the next 3 new pieces (or once
  in a way that shaped a design) → make the stage hook blocking. Record each piece's count here.

## Next
1. **The interview worked (Oct 25).** The CSE hallway loop went interview → brief → concepts → storyboard → build in
   full creative mode on the same subject as the PLTW promo; Bryan: "much better than the original PLTW video". Keep
   `/new-piece` as the way in. Lessons are in `proj/cse-loop/brief.md` (Decisions log).
2. **Context check (plan step 8):** first-question eval PASS (repo share at the first question 7.7k tokens, was ~31k;
   $0.08, was $0.28): `notes/context-check.md`.
3. **First-question eval:** add an `ANTHROPIC_API_KEY` repo secret to run it in CI, or run `tools/eval_new_piece.py`
   locally (Bryan's call).
4. Choice panels: used for the CSE loop's concepts and three rounds of sound (16-s samples inlined); they worked.

