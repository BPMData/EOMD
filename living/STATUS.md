# Living posters: status

_Moved from the root `STATUS.md` on Oct 25, 2026 (context plan step 2); the root file is now a short index. Update this file when working on a living poster._

## Status
- **Living posters (Kells engine, shared `living/template.html`; `LIVING_VARIANT` = 'ssr' | 'cs' | 'ex' in `tools/build.py`):**
  - **Exploration Seminar: DONE (Oct 7; Bryan watched it: "completely fine").** `dist/living-player-ex.html` (built in the old Build folder; this folder's `dist/` doesn't have it yet). 17 trilingual trio cards
    parsed word for word from `proj/ex/copy.md` (Oct 9 added 7 academy cards, cards 18–24, so the build now has 24; those 7
    haven't been watched yet) (ES/PT are Claude's drafts; Bryan trusts them), 11 cursive words
    (`living/words-ex.json`, made by `tools/hershey_words.py` with VARIANT='ex'), **no end card** (`TICKET=null` in
    `living/variant-ex.js`; the template guards `&&TICKET` are in), academy colors from `proj/academies/brand.md` via `CMAP` +
    `CARDSTYLE` in the variant (blue = rule/campus cards, teal = class cards, pair cards fill + edge; orange 4.31:1 is large-bold only,
    so orange cards use weight 700). "choose/pick" wording stays (Bryan: fine for 9th graders). Body text is below the 44 px rule on most
    cards (estimated 28–35 px); Bryan was fine with it on the board.
  - **Oct 9: time-left readout (all variants, in the template).** While the session timer runs, the time left shows top-right in
    yellow `#FFD100` Bagel Fat One (the card-title font) with a charcoal outline, updating in 10-second steps rounded up (a 20-min
    timer shows 20:00 for 10 s, then 19:50 ...), drawn on top of the cards. Knobs: `CLOCK` (step, size, ink, edge, margins);
    `?noclock` hides it. Built into the old folder's `dist/living-player-ex.html` (syntax + clock logic tested in Node; **not watched on a screen**).
    **The CS and SSR players need a rebuild** (LIVING_VARIANT = 'cs' / 'ssr') to pick it up.
  - **CS living poster: DONE (Oct 6)**; the "What Went Wrong?" copy change and card 12 land on its next rebuild.
    **SSR living poster (Kells):** done; 43-word bank not yet watched.

## Known limits
- Living posters: the new time-left readout sits above the cards, so it can cover the top-right corner of a card or a word for the
  moment they overlap.

## Next
8. **Living posters, parked by Bryan (Oct 7); build for ALL three players together (ssr, cs, ex), in the shared template/sound-timer:**
   a. **5-minute timer option:** add 5 to the `#tmin` select in the template's `#ui`.
   b. **Readout:** done Oct 9 (see Living posters). Left to decide: should it be a button/toggle in the UI instead of `?noclock`?
   c. **Random vine entry points:** word vines and card-bloom vines nearly always start at the bottom right now. Wanted: genuinely
      random entry. **Word vines** enter from the LEFT half of the screen (x < 0 with (0,0) at the screen centre, any y) and write
      left to right, so they never write over their own trail (right-to-left rejected: the letters would be drawn in reverse order).
      **Card-bloom vines** (`startFiddle` / `startTrio`) may enter from any direction. Check the leftward drift (7 px/s, `DRIFT`):
      a left-side start leaves the screen sooner, so give word starts room; `startWord` and `buildWord`'s lead-in tendril are the places.
   d. Rebuild the CS and SSR players to pick up the time-left readout (and CS's copy change + card 12).
