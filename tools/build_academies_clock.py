"""Build the classroom version of the Academies hallway film: the 60-s loop plus a wall clock and a session timer.

Takes the master (academies-film/danbury-academies-player.html), adds the timer controls to its control bar and
injects academies-film/clock-timer.js before the player starts. The master is not changed, so re-run this after any
master edit. Press Run in Thonny.
"""
from pathlib import Path
import shutil

# ---------------- SETTINGS ----------------
MASTER = 'academies-film/danbury-academies-player.html'
ADDON = 'academies-film/clock-timer.js'
OUT = 'dist/danbury-academies-clock.html'
PUBLISH = 'players/danbury-academies-clock.html'   # '' = don't copy into players/
TITLE = 'The Academies of Danbury High School (clock + timer)'
MINUTES = [5, 10, 15, 20, 25, 30]                   # the Minutes menu (plus Other..., 1-240)
DEFAULT_MINUTES = 20
# ------------------------------------------

ROOT = Path(__file__).resolve().parent.parent

CSS = ('#bar select,#bar input{font:inherit;border:0;border-radius:8px;padding:7px 8px;background:#fff;color:#0A1633}'
       '#bar input{width:70px}#bar label{display:flex;gap:6px;align-items:center}#tbox{display:flex;gap:10px;align-items:center}'
       '#bar{padding-bottom:calc(10px + env(safe-area-inset-bottom,0px));flex-wrap:wrap;justify-content:center;max-width:calc(100vw - 32px)}')


def controls():
    opts = ''.join(f'<option{" selected" if m == DEFAULT_MINUTES else ""}>{m}</option>' for m in MINUTES)
    return ('<span id="tbox"><button id="tmr" type="button">Start timer</button><label>Minutes <select id="tmin">'
            f'{opts}<option value="c">Other…</option></select></label>'
            f'<input id="tcus" type="number" min="1" max="240" value="{DEFAULT_MINUTES}" aria-label="Custom minutes" hidden></span>')


def replace_once(html, old, new, what):
    if html.count(old) != 1:
        raise SystemExit(f'Could not find exactly one {what} in the master ({html.count(old)} found). Has it changed?')
    return html.replace(old, new)


def main():
    html = (ROOT / MASTER).read_text(encoding='utf-8')
    addon = (ROOT / ADDON).read_text(encoding='utf-8')
    html = replace_once(html, '<title>The Academies of Danbury High School</title>', f'<title>{TITLE}</title>', 'title')
    html = replace_once(html, '</style></head>', CSS + '</style></head>', 'end of the style block')
    html = replace_once(html, '<span id="st"></span></div>', controls() + '<span id="st"></span></div>', 'control bar')
    # the add-on runs after DHS.film exists and before the player boots
    html = replace_once(html, '<script>\n(async()=>{', '<script>\n' + addon + '\n</script>\n<script>\n(async()=>{', 'boot script')
    out = ROOT / OUT
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding='utf-8')
    print(f'Built {out.relative_to(ROOT)} ({out.stat().st_size // 1024} KB)')
    if PUBLISH:
        shutil.copyfile(out, ROOT / PUBLISH)
        print(f'Copied to {PUBLISH}')


if __name__ == '__main__':
    main()
