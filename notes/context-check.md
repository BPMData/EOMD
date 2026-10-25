# Context check (context plan step 8), Oct 25, 2026

Measured with `tools/eval_new_piece.py` (Claude Code 2.1.310, Sonnet, this cloud container), prompt "Make a promo
video for the robotics club.", after steps 1–7, 9 and 10 were in.

## What's in context at the start
- Root `CLAUDE.md`: 788 words (was ~3,400). It names no cartridge, layer, chip or score; folders only.
- Skill descriptions: `/new-piece` and `/toolbox` (one line each; the bodies load only when invoked).
- Repo share at start: **2.4k tokens** (39.5k with the repo vs 37.1k in an empty folder). Was ~11k.

## What it opened before the first question
| Run | Opened before asking | Repo share at first question | Cost | Verdict |
|---|---|---|---|---|
| Baseline, Oct 25 (before the plan) | `/new-piece`, all of STATUS.md (~5,500 words), INTERVIEW.md, a grep | ~31k | $0.28 | — |
| Run 1 (steps 1–7) | `/new-piece`, INTERVIEW.md, STATUS index, TEMPLATE.md; tried to create the brief file (Bash, then Write) | 12.7k | $0.13 | FAIL |
| Run 2 (fix below) | `/new-piece`, INTERVIEW.md | **7.7k** | **$0.08** | PASS |

Run 1's failure was this plan's own step 7: INTERVIEW said to create the brief "at the start of the interview", so
the model read the template and wrote a file before asking anything. Now the brief is started once round 1 is
answered, and nothing else is opened before round 1. Both runs asked the plain-words round 1 (what and where, the
mode question with usage estimates, who it's for); neither opened anything on the restricted list.

## Not done here (needs Bryan)
- **The real test:** brief the PLTW promo properly with Bryan, rebuild it in full creative mode, compare with r2.
  Check then: which files open before the storyboard is approved (`tools/check_stage_reads.py` reads the stage log),
  and whether `/toolbox` is opened only at the gate.
- A change to an existing piece (does its folder's `CLAUDE.md` load when its files are opened) was not run as an
  eval; the nested files follow Claude Code's documented lazy loading.
- The control's overhead here (37k) includes this container's extra tools; on a Mac or in CI it will be lower, so
  re-measure the control whenever the Claude Code version changes (the eval does it on every run).
