# STATUS.md: the index (read at session start; keep it short)

> **Visitors:** this is the project's working log, kept for the people and AI assistants working on it. For what
> EOMD is and how to use it, start with [README.md](README.md).

_Last updated: Oct 25, 2026 (context plan step 2: STATUS.md split). Each piece's history, known limits and open questions now live in its own
`STATUS.md`; read that one only when working on that piece. Repo-wide history: `notes/history.md`._

## Pieces
| Piece | State | Next | Status file |
|---|---|---|---|
| CS Lab Screensaver ("CD-ROM") | Stage 4 on Bryan's Mac; extras through 9h built | Check the 9h builds; stage 5 extras | `proj/cdrom/STATUS.md` |
| Academies hallway film | Done; Bryan rendered the MP4 (Oct 20) | Watch hero size and chip icons | `academies-film/STATUS.md` |
| Living posters (SSR, CS, Exploration) | Done | Parked items (5-min timer, random vine entry); rebuild CS + SSR | `living/STATUS.md` |
| PLTW CSE promo | r2 published ("cheesy as hell, but exactly what I asked for") | The PLTW test below | `proj/pltw/STATUS.md` |
| gen library (incl. Dust Type) | Working; `tools/gen_export.py` | Check Dust Type knobs | `gen/STATUS.md` |
| Jukebox | 15 cartridges | Redesign its look | `jukebox/STATUS.md` |

## Across the repo
- **CI** runs the gen build + smoke test and the audio regression CHECK (Node 22) on every push.
- **Regression baseline:** settled for Node 22; the Mac's Node 26 doesn't match it (`tools/STATUS.md`).
- **New pieces:** interview → brief → concepts → storyboard → build, with context that follows the stage
  (`notes/context-plan.md`; step 2 done, the rest in progress).

## Next
1. **Try the interview** (`/new-piece`) on the next new piece. The test of the idea: write a real brief for the PLTW
   promo with Bryan, rebuild it from a blank page in full creative mode, and compare it with r2.
2. **Context that follows the stage:** implement the rest of `notes/context-plan.md` (steps 5–10) before the PLTW
   test, so the test runs in the new setup.
