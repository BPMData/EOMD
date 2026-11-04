"""Build the classroom versions of the Academies pieces: each master plus a wall clock and a session timer.

For each target: takes the master, adds the timer controls to its control bar and injects
academies-film/clock-timer.js. The masters are not changed, so re-run this after any master edit. Press Run in Thonny.
  - hallway: the 60-s Academies hallway film (academies-film/danbury-academies-player.html)
  - study:   the 20-min Sanctioned Corporate Calm study loop (academies-film/sanctioned-corporate-calm.html)
"""
from pathlib import Path
import shutil

# ---------------- SETTINGS ----------------
TARGETS = ['hallway', 'study']                      # which versions to build
ADDON = 'academies-film/clock-timer.js'
MINUTES = [5, 10, 15, 20, 25, 30]                   # the Minutes menu (plus Other..., 1-240)
DEFAULT_MINUTES = 20
COPY_TO_PLAYERS = True                              # also copy each build into players/ (the published copies)
# ------------------------------------------

ROOT = Path(__file__).resolve().parent.parent

# Each target: master, output name, new title, and where the add-on goes (script = inserted before that text;
# hook = text after which the page has set DHS.film, so the add-on can wrap its render there).
PIECES = {
    'hallway': dict(
        master='academies-film/danbury-academies-player.html', out='danbury-academies-clock.html',
        title=('<title>The Academies of Danbury High School</title>',
               '<title>The Academies of Danbury High School (clock + timer)</title>'),
        script_before='<script>\n(async()=>{', hook=None),
    'study': dict(
        master='academies-film/sanctioned-corporate-calm.html', out='sanctioned-corporate-calm.html',
        title=('<title>Sanctioned Corporate Calm: Hatters Study Loop</title>',
               '<title>Sanctioned Corporate Calm: Hatters Study Loop (clock + timer)</title>'),
        script_before='<script>\n(async()=>{',
        # the study page builds DHS.film inside its boot script; Pause suspends its AudioContext, so the chime uses it
        # only while it is running
        hook=("anchor:'center',tIn:0},50);}};\n",
              "DHS.clockTimer.wrap();DHS.clockTimer.audio=()=>(ac&&ac.state==='running')?ac:null;\n")),
}

CSS = ('#bar select,#bar input{font:inherit;border:0;border-radius:8px;padding:7px 8px;background:#fff;color:#0A1633}'
       '#bar input{width:70px}#bar label{display:flex;gap:6px;align-items:center}#tbox{display:flex;gap:10px;align-items:center}'
       '#bar{flex-wrap:wrap;justify-content:center;max-width:calc(100vw - 32px)}')


def controls():
    opts = ''.join(f'<option{" selected" if m == DEFAULT_MINUTES else ""}>{m}</option>' for m in MINUTES)
    return ('<span id="tbox"><button id="tmr" type="button">Start timer</button><label>Minutes <select id="tmin">'
            f'{opts}<option value="c">Other…</option></select></label>'
            f'<input id="tcus" type="number" min="1" max="240" value="{DEFAULT_MINUTES}" aria-label="Custom minutes" hidden></span>')


def replace_once(html, old, new, what, master):
    n = html.count(old)
    if n != 1:
        raise SystemExit(f'{master}: expected one {what}, found {n}. Has the master changed?')
    return html.replace(old, new)


def build(name, addon):
    p = PIECES[name]
    html = (ROOT / p['master']).read_text(encoding='utf-8')
    r = lambda h, old, new, what: replace_once(h, old, new, what, p['master'])
    html = r(html, *p['title'], 'title')
    html = r(html, '</style></head>', CSS + '</style></head>', 'end of the style block')
    html = r(html, '<span id="st"></span></div>', controls() + '<span id="st"></span></div>', 'control bar')
    html = r(html, p['script_before'], '<script>\n' + addon + '\n</script>\n' + p['script_before'], 'boot script')
    if p['hook']:
        html = r(html, p['hook'][0], p['hook'][0] + p['hook'][1], 'film hook')
    out = ROOT / 'dist' / p['out']
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding='utf-8')
    print(f'Built dist/{p["out"]} ({out.stat().st_size // 1024} KB)')
    if COPY_TO_PLAYERS:
        shutil.copyfile(out, ROOT / 'players' / p['out'])
        print(f'  copied to players/{p["out"]}')


def main():
    addon = (ROOT / ADDON).read_text(encoding='utf-8')
    for name in TARGETS:
        build(name, addon)


if __name__ == '__main__':
    main()
