# Brief: Yangjiang knives (scrolling infographic)

Status: APPROVED 2026-11-02 by Bryan Murphy · Stage: build · Mode: full creative · Client: Bryan Murphy · Sign-off: Bryan
Usage: <model, effort> · <share of a 5-hour limit, per stage, as the Claude app or Claude Code shows it>

_**ASK** = missing, **DRAFT** = Claude's draft, **Claude's call** = delegated by the client._

## 1. The ask
An infographic on the history of knife-making in China, especially Yangjiang: how Germany and Japan became the
go-to "good knife countries", and how China is working to win that title back through fast technology growth and a
vertically integrated supply chain. Form: a **long scrolling web page** people open on a phone or laptop and read at
their own pace. Published on the GitHub Pages site alongside the three pieces already there. No deadline.

## 2. Purpose and tone
**Audience:** "nerds on the internet, not specific to any class": the kind of people who would read a long
infographic about knives. Adults; not for students.

- **Know:** Yangjiang makes most of China's knives (needs a source, §5); what makes a good knife and good knife steel.
- **Feel:** the "best knife" label is something countries win and lose.
- **Do:** look at where their own knives were made.
- **The question it answers:** how much does it matter where a knife is made, if at all, or does it come down to the
  individual manufacturer? Reason: most readers don't know enough about chef knives to follow the history, so the
  page does "double duty": knife primer + history.
- **Before → after:** "Germany and Japan make the good knives; Chinese knives are cheap" → "the title moves; judge
  the maker and the knife, and now I know what to look at."
- **Tone:** "fun, knowledgeable, and a very Chinese time in my life." Dark humor allowed (§4).
- **Must NOT feel like:** default AI-written CSS ("curved bezels and shit everywhere"); homework.

## 3. How it's watched
- A scrolling web page, read once, seated, by choice. Long-form is fine; this audience reads to the end if it's good.
- Phone and laptop both. Assume phone first (links get shared on social), so every interactive works by touch and at
  phone width, and nothing depends on hover.
- **Silent.** "Everyone hates music on web pages." No music, no sound effects.
- No player chrome: no fullscreen, no hidden controls, no Start sound button (§15).

## 4. How the subject works
Three threads plus a primer:
1. Knife-making history in China and Yangjiang.
2. How Germany and Japan became the go-to "good knife countries".
3. How China is working to take the title back: fast technology growth, a vertically integrated supply chain.
- **Primer:** the major choices in a chef knife: shape, single or double bevel, grind angle, spine thickness, weight,
  length, steel and heat treatment. It must leave the reader able to judge a knife, and to say how much country of
  origin matters vs the individual maker.

**Jokes:** dark humor about Germany and Japan is allowed, but grounded in sourced history (the knife towns' own
arms-making past), not national character. Bryan: "the actual history not my dumb joke". The humor aims at companies, marketing and myths; facts about
forced laborers and other victims are stated plainly, never joked about (approved).

**Never:** "we are NOT doing the ching chong riff." No fake-Chinese "chop suey" lettering, no gong, no lederhosen, no
samurai ("samurai are fake though fuck those wannabes"). **Allowed if it fits:** red and gold ("chinese people
fucking love red and gold"), cherry blossoms ("japanese people legitimately loving cherry blossoms"): used the way
those cultures use them, not as wallpaper. Chinese characters only where they're real and correct (place names,
terms like 菜刀), each checked.

## 5. Content and facts
Bryan supplies the facts (round 1: "I'll supply them"). Nothing goes on the page that isn't in this table with a
source. Primer facts: Bryan's sources are mostly history, so `research-prompt.md` covers the primer; its results
count as Bryan's sources once he passes them on and checks them.

Bryan's reports are in `sources/` (q1–q4); Claude's read of them, with conflicts and gaps, is `research-notes.md`.
Rows get filled from them at the concept stage, using the conflict rules in the notes.

| Fact | Source |
|---|---|
| (to fill from `sources/`) | |

## 6. Structure and hierarchy
Claude's call, within this: primer early enough that the history makes sense, but the page opens on story, not a
lesson. Every section has one hero (a picture or interactive) and short copy. Long page, read once; no loop rules.

## 7. Brand and contrast
No brand. Palette and fonts: Claude's call, from §13's references, not from Chinese/German/Japanese clichés (§4).
Fonts are self-hosted and inlined (no Google Fonts). Contrast: WCAG AA for all text, AAA for body copy where it's easy.

## 8. Visual language
Bryan: "Use the interactivity of the format to your advantage, write custom SVG to show different styles of knives."
- Custom SVG knife illustrations (shapes, cross-sections of bevels and grinds, spine taper, steel structure).
- Interactive ways to show the major choices (shape, bevel, grind angle, spine, weight, length) so the reader learns
  by trying, not reading.
- Spine of the page: Claude's call.

## 9. Language
English only (internet audience, not Bryan's classroom). Chinese and Japanese terms
appear with their characters and romanization where they're real terms (§4).

## 10. Call to action
"Look at where your own knives were made" (§2). No URLs, shops or brand recommendations unless Bryan adds them.

## 11. Music and sound
None. Silent page (§3).

## 12. Hard limits
- No ranking claims ("the best knife country", "best steel") stated as fact; the page shows evidence and trade-offs.
- Brand names only with a sourced fact attached (e.g. a documented OEM relationship); nothing implied.
- No photos of real people; no product photos copied from makers' sites. Illustrations are drawn from scratch.

## 13. Taste references
`Taste: house. Applies: T01, T02, T04, T05, T06, T19 (sound off), T20, T25, T26, T27, T28, T30, T34. Overrides: none.
Off by condition: music and sound items (silent), loop and walk-up items (read once, scrolling).`
- **Loves:** "The NYTimes Sushi piece": "The Untold Story of Sushi in America" (Daniel Fromson, illustrations by
  Igor Bastidas, Nov 5 2021, https://www.nytimes.com/interactive/2021/11/05/magazine/sushi-us.html). What Claude took
  from its source (Bryan supplied it): an investigative story told as a hidden history, opening on short, cadenced
  lines ("In the beginning, God did not create a sushi company. / The sushi came later."); flat, simple animated
  illustrations that morph from one scene into the next; each section sets its own background color; on desktop the
  illustration holds beside the text while you scroll, on phones the pictures sit inline; a serif for reading, a
  sans for labels. Take the mechanisms, not the look; "those great hardcover
  reference books Barnes and Noble sells with names just like 'THE GREATEST BATTLES' or 'FIREARMS' for Christmas
  presents": big illustrated encyclopedias, labeled cutaways, specimen spreads, dense captions.
- **Hates:** default AI-written, globally homogeneous CSS, rounded corners everywhere; anything that reads like
  homework; the "ching chong riff"; samurai.

## 14. Creative expectations
Default craft bar, adapted to a scrolling page:
- Editorial interactive quality (NYT / The Pudding / reference-book craft). Quality matters more than speed.
- One memorable signature idea, made for this subject, that recurs.
- Sections share one system, yet each feels specific to its content; no repeated card templates.
- Motion is scroll-driven and earns its place: reveals, diagrams that build, comparisons that morph. No parallax for
  its own sake. No default easings.
- Considered typography: a real editorial type system, strong hierarchy, comfortable reading measure.
- None of the subject's clichés (§4).

## 15. Technical
Repo defaults where they apply: one self-contained offline HTML file (fonts, SVG, data inlined; nothing loads from the
internet); motion time- or scroll-based, never frame-rate-based; nothing flashes more than 3×/s;
prefers-reduced-motion respected. Exceptions: it's a page, not a player: no fullscreen, no hidden controls, no audio,
no Start sound button. Works on phone width (16 px gutters, no horizontal scroll) and with keyboard.

## 16. Deliverables
- One HTML file, added to the GitHub Pages site next to the three pieces already there, with a link from the landing
  page (`index.html`).
- No MP4, no portrait version.

## 17. QA
- Facts: everything on the page is in §5 with a source; Chinese characters checked.
- Contrast: every text/background pair meets WCAG AA, reported honestly.
- Phone: tested at 375 px width by touch; no hover-only content; no horizontal scroll.
- Reduced motion: every section readable with motion off.
- Offline: opens with the network off.
- Performance: smooth scroll on a mid-range phone; page size reported.
- Taste: every applicable `strong` item honored or overridden in §13.
- A short report: what was verified, what wasn't, known limits.

## 18. Approval and success
Bryan signs off; no one else. Success: a knife nerd reads to the end, learns how to judge a knife, and
checks where theirs was made.

## 19. Open questions
1. None blocking. Small checks in `research-notes.md` (Bourdain quote, carbide line).
3. Brief approval.

## Build plan
Route: a scrolling HTML page (DOM + inline SVG + a little JS), not a canvas player; none of the film/stream engines
fit a reader-paced page. Built by `proj/yangjiang-knives/build.py` (Thonny-friendly, SETTINGS block) from
`page.html` + `page.css` + `page.js` + `content/` into one offline file, then published as `players/yangjiang-knives.html`.

| Element (storyboard row) | Route |
|---|---|
| Fonts | **Reuse plumbing:** the inline-font build pattern (`proj/cse-loop/build.py`). **New fonts** (OFL, licenses added to `fonts/`): Source Serif 4 (reading), Archivo with its width axis (stamps, labels), Noto Serif SC subset to the characters used (阳江, 十八子, 関, 日本製…) |
| The strike (rows 0, 3–7, 9, 11) | **Build new:** one reusable SVG "die + deboss" component driven by scroll progress (pure function of progress; reduced motion shows the finished mark) |
| The belt (rows 3–10) | **Build new:** a fixed SVG belt whose plate and position are set by which chapter is on screen; tap opens the lineage |
| Chapter color fields + text column | **Build new:** CSS system (paper, ink, red/gold, iron blue, indigo, grey), sticky picture beside text on laptop, inline on phone (the NYT mechanism) |
| Specimen plates 1–7 | **Build new:** one plate template (header, drawing, callouts, controls) + seven small SVG interactives: carbon slider, bolster grind-down, edge-angle slider + bevel toggle, Wenwudao chop/slice, sandwich overlay, heat-treat toggle, garlic smash |
| Charts (Sheffield workforce, export bars, OEM split) | **Build new:** hand-drawn SVG charts from data in `content/data.json`, each value with its source id (dataviz skill for colors/marks) |
| Label decoder (row 11) | **Build new:** tap a phrase, it stamps onto the blade with its legal meaning |
| Sources (row 12) | **Build new:** numbered list generated from `content/sources.json`; every on-page fact links to its number |
| Copy | **Build new:** `content/copy.md`, all DRAFT in Bryan's voice (T35), facts only from `sources/` |
| Sound | None (silent page) |
| Publishing | **Reuse plumbing:** copy to `players/`, link from `index.html`, update `README.md` |

Stages: (2) playable rough: the system, the strike, the belt and rows 0–4 · (4) the full page, all plates and
charts · (5) extras: polish, QA report, publish.

## Decisions log
_Date · the decision or verdict, in the client's words · what changed._
- 2026-11-02 · Form: "Scrolling web page" · interactive page, not a poster or video.
- 2026-11-02 · Mode: "From scratch" · full creative mode; `/toolbox` only after storyboard and stills.
- 2026-11-02 · Facts: "I'll supply them" · Claude uses only Bryan's sources; research prompt written for the primer.
- 2026-11-02 · Audience: "nerds on the internet", "it's not for students" · adult tone, dark humor allowed.
- 2026-11-02 · Must not feel like "default globalhomo AI-written CSS with curved bezels and shit everywhere" or
  homework · no rounded-card template look.
- 2026-11-02 · Sound: "silent lol, everyone hates music on web pages and we are NOT doing the ching chong riff" ·
  no audio.
- 2026-11-02 · Loves: "The NYTimes Sushi piece", the B&N hardcover reference books ("THE GREATEST BATTLES",
  "FIREARMS") · reference-book/editorial look.
- 2026-11-02 · Publish: "add to the github pages site alongside the 3 already there".
- 2026-11-02 · Joke: "the actual history not my dumb joke lmao" · humor grounded in sourced arms-making history.
- 2026-11-02 · Clichés: red and gold OK ("chinese people fucking love red and gold"), cherry blossoms OK, "samurai
  are fake though fuck those wannabes" · §4 updated.
- 2026-11-02 · "globalhomo = global homogeneous" · the hate is same-everywhere generic web design.
- 2026-11-02 · No deadline; Bryan is the only sign-off; English only.
- 2026-11-02 · Sources delivered: five research reports (q1–q4) · saved to `sources/`; notes in `research-notes.md`.
  Bryan: "don't actually start coding anything" until usage resets.
- 2026-11-02 · Premise: "yes" to building on the flipped story (China barred from the game, not dethroned) ·
  spine of the history. Cheap-to-quality: "interesting, it also happened to japan with i.e. ceramics" · added to
  the gap research.
- 2026-11-02 · Gap research delivered (q5a, q5b): "okay THIS had better be enough lol" · saved to `sources/`;
  gaps 1–3 filled; no more research rounds planned.
- 2026-11-02 · Tone rule and brief: "yes yes" · humor never aimed at victims; brief APPROVED, stage → concepts.
- 2026-11-02 · Concept: "let's try A with the moving belt idea" · The Mark, with the title belt as a running gag;
  storyboard drafted (`storyboard.md`).
- 2026-11-02 · Storyboard and stills: "looks good to me let's go" · stage → build.
- 2026-11-02 · Copy voice: clipped parallel lines like "Thinner cuts easier. Thinner breaks easier." "read claude-coded
  as fuck"; Bryan would say "Thinner: cuts easier, but breaks easier, too." He is "a wordy pretentious fuck who loves
  colons and semi-colons and run-on sentences" · all DRAFT copy is written in that voice: long, clause-heavy
  sentences, colons and semicolons; no stacked three-word sentences, no "X. Y. Z." punchlines (house taste T35).
