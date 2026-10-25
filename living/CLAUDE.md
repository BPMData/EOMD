# Living posters (SSR, CS, Exploration)

Status, history, known limits and the parked to-do list: `living/STATUS.md`. Architecture, knobs and lessons:
`living/README.md` (read it before touching `template.html`). Don't read `engine/` for living-poster work.

## Files
| File | What it is |
|---|---|
| `template.html` | The Kells "living poster" engine (continuous growth, fiddlehead text, cursive words), shared by every variant; has the time-left readout (`CLOCK`, `?noclock`) |
| `sound-timer.js` | Start sound, volume, timer, chime, worker/main-thread music |
| `trio.js` | Trilingual card trios (EN/ES/PT, three fiddleheads), shared by the cs and ex variants; optional per-card `CARDSTYLE` |
| `variant-cs.js` | CS variant: title, Source Code Pro, `TRIO`, CS end card. Injected at the template's VARIANT hook; card copy parsed from `proj/cs/copy.md` at build |
| `variant-ex.js` | Exploration Seminar variant: academy colors (`CMAP`, `CARDSTYLE`) from `proj/academies/brand.md`, no end card (`TICKET=null`); card copy parsed from `proj/ex/copy.md` |
| `words.json`, `words-cs.json`, `words-ex.json` | Hershey cursive strokes for vine-written words (ssr / cs / ex); made by `tools/hershey_words.py` (`VARIANT`); regenerate, don't hand-edit |

Copy files: `proj/cs/copy.md`, `proj/ex/copy.md`, `proj/ssr/poster-source.html` (SSR brief: `proj/ssr/brief.md`). Card
text is used word for word. Fonts: Bagel Fat One, EB Garamond, Source Code Pro.

## Build
Run `tools/build.py`; choose `TARGETS`, `LIVING_SCORE` and `LIVING_VARIANT` ('ssr' / 'cs' / 'ex') at the top. CS adds
`CS_PYTHON`, `CS_CARDS_OFF`. Output: `dist/living-player*.html`; publish by copying into `players/` (`tools/CLAUDE.md`).
Shared changes (template, sound-timer, trio) land in all three players: rebuild all three.
