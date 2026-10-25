# Brief: <piece name>

Status: DRAFT | APPROVED <date> by <name> · Stage: interview | brief | concepts | storyboard | build · Mode: efficient | full creative · Client: <name> · Sign-off: <names>
Usage: <model, effort> · <share of a 5-hour limit, per stage, as the Claude app or Claude Code shows it>

_Copy to `proj/<name>/brief.md` once round 1 of the interview is answered (`brief/INTERVIEW.md`) and update `Stage:` at each gate. Write it in the client's words where
possible and keep the reasons. **ASK** = missing, **DRAFT** = Claude's draft (translations, suggested copy),
**Claude's call** = delegated by the client. `brief/example-academies.md` shows the level of detail to aim for._

## 1. The ask
_What it is, where it plays, how long it runs, by when._

## 2. Purpose and tone
_What viewers should know, feel and do afterwards; what they believe now vs after; the tone in three words; what it
must not feel like (clichés, energy)._

## 3. How it's watched
_This drives every design decision. Screen, orientation, distance, room light, sound (on / off / drowned out),
attention (sits and watches, or walks past for three seconds), loop or once, how often the same people see and hear
it, what plays it._

## 4. How the subject works
_The system or story the piece must get right, and the words or promises to avoid._

## 5. Content and facts
_Every fact that appears on screen, with its source. Fixed copy: the path of the copy file, used word for word._

| Fact | Source |
|---|---|
| | |

## 6. Structure and hierarchy
_Beats; hero vs supporting text in each; whether every beat must stand alone; how often the name or message must be
readable; minimum holds; total length; loop rules._

## 7. Brand and contrast
_Colors (hex and role), fonts, logos; contrast rules (e.g. dark text on yellow, never white)._

## 8. Visual language
_Brand shapes, symbols, nicknames and motifs to build from (recreate them in the same spirit; never trace a logo);
verified real details that may be shown; a suggested spine (optional; beat it if you have better)._

## 9. Language
_Languages, which lines, cognate flourishes or full translations, who checks them._

## 10. Call to action
_The next step. Nothing invented: no URL, deadline, QR code or contact that isn't in section 5._

## 11. Music and sound
_Feel; where it plays and how often people hear it; what to avoid; sound effects synced to motion or not; loudness
from how and where it's heard (a client file in `brief/clients/` may have targets that held before)._

## 12. Hard limits
_Claims, likenesses, photos, anything admin or legal won't allow._

## 13. Taste references
`Taste: house. Applies: <the IDs from brief/taste/house.md whose condition this brief meets>. Overrides: <ID off or
changed, with the reason>.`
_Then the client's own loves and hates, with why._

## 14. Creative expectations
Default craft bar (from the Academies brief); this piece adds or relaxes: _..._
- Contemporary motion graphics at portfolio quality (Motionographer / Behance / Awwwards-level craft). Quality
  matters more than speed.
- One memorable signature visual idea, made for this subject, that recurs.
- Several beats share one system, yet each feels specific to its content.
- Expressive motion: anticipation, overshoot, follow-through, staggered reveals, match cuts and shape-morph
  transitions, camera-style moves (push, parallax, rotate), rhythm locked to the music.
- No slideshow logic, no repeated templates, no default easings.
- Considered typography: strong hierarchy, a tight type system, kinetic type where it earns it, sized for the viewing
  distance; no thin weights or small text on a distant screen.
- If it loops: a loop point that feels like a breath, not a restart.
- None of the subject's clichés.

## 15. Technical
Repo defaults (CLAUDE.md "Rules for every piece": a single offline HTML file, time-based motion, synthesized
audio, nothing flashing more than 3×/s; legibility and loudness targets from sections 3 and 11). Exceptions for this piece: _..._

## 16. Deliverables
_Files (HTML player, MP4 with and without sound, portrait version, ZIP), length, where it's published (`players/`,
the Pages site)._

## 17. QA
Default checks; add the piece's own:
- If it loops: the last second and the first second back to back show no jump and no click, gap or loudness change.
- Legibility: hero text readable with the frame at 25% scale; supporting text legible on pause.
- Walk-up test: every beat makes sense to someone who just arrived (if viewers walk past).
- Sound-off test: the story holds with the audio drowned out (if it plays somewhere noisy).
- Contrast: every text/background pair meets WCAG AA (stronger in bright rooms), reported honestly.
- Audio: loudness, true peak and clipping measured (ffmpeg `ebur128`); nothing harsh on repeat.
- Motion: smooth transitions, no dropped or duplicated frames.
- Facts: everything on screen is in section 5 with a source.
- Taste: every applicable `strong` item in `brief/taste/house.md` is honored, or overridden in section 13 with a reason.
- A short report: what was verified, what wasn't, known limits.

## 18. Approval and success
_Who signs off; what makes them say "that's it"; how we'll know it worked._

## 19. Open questions
_Every ASK above, in one list._

## Decisions log
_Date · the decision or verdict, in the client's words · what changed._
