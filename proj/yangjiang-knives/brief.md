# Brief: Yangjiang knives (scrolling infographic)

Status: DRAFT · Stage: interview · Mode: full creative · Client: Bryan Murphy · Sign-off: **ASK**
Usage: <model, effort> · <share of a 5-hour limit, per stage, as the Claude app or Claude Code shows it>

_Copy to `proj/<name>/brief.md` once round 1 of the interview is answered (`brief/INTERVIEW.md`) and update `Stage:` at each gate. Write it in the client's words where
possible and keep the reasons. **ASK** = missing, **DRAFT** = Claude's draft (translations, suggested copy),
**Claude's call** = delegated by the client. `brief/example-academies.md` shows the level of detail to aim for._

## 1. The ask
An infographic on the history of knife-making in China, especially Yangjiang: how Germany and Japan became the
go-to "good knife countries", and how China is working to win that title back through fast technology growth and a
vertically integrated supply chain. Form: a **scrolling web page** people open on a phone or laptop and scroll at
their own pace. Deadline: **ASK**.

## 2. Purpose and tone
**Audience:** "nerds on the internet, not specific to any class" — people who would happily read a long infographic
about knives. Adults; not for students.

- **Know:** Yangjiang makes most of China's knives (needs a source, §5); what makes a good knife and good knife steel.
- **Feel:** the "best knife" label is something countries win and lose.
- **Do:** look at where their own knives were made.
- **The real question it answers:** how much does it matter where a knife is made, if at all, or does it come down to
  the individual manufacturer? Reason: most readers don't know enough about chef knives to follow the history, so the
  page does double duty: knife primer + history.
- **Tone:** "fun, knowledgeable, and a very Chinese time in my life." Dark jokes allowed (see §4).
- **Must NOT feel like:** default AI-written CSS ("curved bezels and shit everywhere"); homework.

## 3. How it's watched
A scrolling web page on a phone or laptop, read once at the reader's own pace, sitting down by choice. Long-form is
fine. Phone share, sound, where it's linked from: **ASK**.

## 4. How the subject works
Three threads: (1) knife-making history in China and Yangjiang; (2) how Germany and Japan became the go-to "good knife
countries"; (3) how China is working to take the title back (fast technology growth, vertically integrated supply
chain). Plus the primer: the major choices in a good chef knife (shape, single or double bevel, grind angle, spine
thickness, weight, length, steel and heat treatment).

Jokes: Bryan allows dark humor about Germany and Japan, e.g. "the personality type that's good at running
industrial-scale genocides is also good at making knives, what's up with that?" Claude's suggestion (pending Bryan's
call): ground it in sourced history (the knife towns' own arms-making past) rather than national character.

## 5. Content and facts
Primer facts (knife design and steel): Bryan's sources are mostly history, so a research prompt covers the primer:
`proj/yangjiang-knives/research-prompt.md`. Its results count as Bryan's sources once he passes them on.
_Every fact that appears on screen, with its source. Fixed copy: the path of the copy file, used word for word._

Bryan supplies the facts (round 1: "I'll supply them"). Nothing goes on the page that isn't in this table.

| Fact | Source |
|---|---|
| **ASK** (Bryan's notes / articles) | |

## 6. Structure and hierarchy
_Beats; hero vs supporting text in each; whether every beat must stand alone; how often the name or message must be
readable; minimum holds; total length; loop rules._

## 7. Brand and contrast
_Colors (hex and role), fonts, logos; contrast rules (e.g. dark text on yellow, never white)._

## 8. Visual language
Bryan: "Use the interactivity of the format to your advantage." Custom SVG of knife styles. Interactive ways to show
the major choices in a chef knife (shape, bevel, grind angle, spine, weight, length). Spine: Claude's call.

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
- Hates: default AI-written CSS, rounded corners everywhere; anything that reads like homework.
- Loves: **ASK**.

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
- 2026-11-02 · Form: "Scrolling web page" · interactive page, not a poster or video.
- 2026-11-02 · Mode: "From scratch" · full creative mode; `/toolbox` only after storyboard, stills and sound concept.
- 2026-11-02 · Facts: "I'll supply them" · Claude uses only Bryan's sources.
