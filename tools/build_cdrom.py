# tools/build_cdrom.py: builds the CD-ROM screensaver player (one offline HTML).
# Run in Thonny. Settings are the variables below.
# Stage 4 (+ Oct 8: switch fix, channel titles + chronological order, Contour intro in the music block; boot screen,
# Previous Era / Next Era buttons, Lounge (Chipped) music mode): the Stage 2a sound block of proj/cdrom/player-src.html is swapped for proj/cdrom/music.js, the audio library
# (chips + lounge + the five chip scores + the lounge score) is embedded, and the PATCHES below hook the music into the
# player's channel switch, card timing, pause and button row. Every patch must match exactly once or the build stops.
# Oct 9: Overclock (Track 2) is the default music mode: AUDIO_LIB adds its notes (proj/cdrom/track2-r2.js) and style
# (audio/style-overclock.js), MUSIC_SCORES adds score/cdrom-overclock.json; the music patches are folded into proj/cdrom/music.js.
# Oct 9b: proj/cdrom/addons.js (timer readout, Their Finest Duds word structures) is injected before the channel-surf section.
# Oct 9 fold (tools__fold_cdrom.py): the old PATCHES, the channel titles and the boot screen now live in proj/cdrom/player-src.html.
import base64, io, json, os, re, urllib.request

PROJECT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # the repo root (this script sits in tools/)
FONT_DIR = os.path.join(PROJECT, 'fonts')            # downloaded OFL fonts are cached here
OUT = os.path.join(PROJECT, 'dist', 'cdrom-player.html')
SUBSET = True                                        # shrink fonts with fontTools if installed (pip install fonttools)

# music: load order matters (dsp, instruments, chips, arranger core, then the styles)
AUDIO_LIB = ['engine/src/audio/dsp.js', 'audio/instruments.js', 'audio/instruments-film.js', 'audio/instruments-cdrom.js',
             'audio/chips.js', 'audio/arranger.js', 'audio/style-chip.js', 'audio/style-lounge.js', 'audio/style-loungechip.js',
             'proj/cdrom/track2-r2.js', 'audio/style-overclock.js']
MUSIC_SCORES = {'fm': 'score/cdrom-fm.json', 'tia': 'score/cdrom-tia.json', 'beep': 'score/cdrom-beep.json',
                'snes': 'score/cdrom-snes.json', 'arcade': 'score/cdrom-arcade.json', 'lounge': 'score/encyclopedia-lounge.json',
                'overclock': 'score/cdrom-overclock.json'}
# Lounge (Chipped) (Oct 8): the build derives one score per chip (lc_<chip>) from the lounge score: Lounge's notes, played by that
# chip with its own tail, lead sample and master_db + this trim (dB). Not loudness-measured yet: nudge a trim if a channel's
# Lounge (Chipped) sounds louder or quieter than its Chips music (+1 = louder).
LOUNGE_CHIPPED_TRIM = {'fm': 0.0, 'tia': 0.0, 'beep': 0.0, 'snes': 0.0, 'arcade': 0.0}

GF = 'https://raw.githubusercontent.com/google/fonts/main/ofl/'
FONTS = {'VT': 'vt323/VT323-Regular.ttf',
         'JQ': 'jacquard24/Jacquard24-Regular.ttf',             # Their Finest Duds title + boot screen logo (pixel blackletter)
         'PIX': 'pixelifysans/PixelifySans%5Bwght%5D.ttf',
         'ATK': 'atkinsonhyperlegible/AtkinsonHyperlegible-Regular.ttf',
         'ATKB': 'atkinsonhyperlegible/AtkinsonHyperlegible-Bold.ttf'}

# Channel titles (TITLES) and the boot screen (BOOT_LINES, BOOT_AUTO, BOOT_CHIME): now in proj/cdrom/player-src.html.


# (name, old, new): exact, single-match edits to the player source. Fold them into proj/cdrom/player-src.html when convenient.
PATCHES = []   # folded Oct 9 (tools__fold_cdrom.py); add new edits here, fold again later

# (name, old, new): exact, single-match edits to proj/cdrom/music.js, applied after it is swapped in
MUSIC_PATCHES = []   # Oct 9: the 14 earlier patches are folded into proj/cdrom/music.js; add new ones here

def src(name):
    return open(os.path.join(PROJECT, name), encoding='utf-8').read()   # name is relative to the repo root, e.g. 'audio/chips.js'

def font(key):
    os.makedirs(FONT_DIR, exist_ok=True)
    path = os.path.join(FONT_DIR, FONTS[key].split('/')[-1].replace('%5B', '[').replace('%5D', ']'))
    if not os.path.exists(path):
        print('downloading', FONTS[key])
        urllib.request.urlretrieve(GF + FONTS[key], path)
    data = open(path, 'rb').read()
    if SUBSET:
        try:
            from fontTools import subset
            from fontTools.ttLib import TTFont
            f = TTFont(io.BytesIO(data))
            s = subset.Subsetter()
            s.populate(unicodes=list(range(0x20, 0x7F)) + list(range(0xA0, 0x180)) + list(range(0x2010, 0x2028)))
            s.subset(f)
            out = io.BytesIO(); f.save(out); data = out.getvalue()
        except ImportError:
            print('fontTools not installed: embedding full fonts')
    return base64.b64encode(data).decode()

def cards():  # word for word from proj/cs/copy.md + proj/cdrom/cards.md (CD-ROM-only cards, ids D1, D2...); Python cards flagged, ?python turns them on
    out, cur = [], None
    for ln in (src('proj/cs/copy.md') + '\n' + src('proj/cdrom/cards.md')).split('\n'):
        m = re.match(r'### ([PD]?\d+)\.', ln)
        if m:
            cur = {'id': m.group(1), 'py': m.group(1).startswith('P')}; out.append(cur); continue
        m = re.match(r'- \*\*(EN|ES|PT):\*\* (.+)$', ln.strip())
        if m and cur is not None:
            t, b = m.group(2).split(' / ', 1)
            cur[m.group(1).lower()] = [t.strip(), b.strip()]
    return [c for c in out if all(k in c for k in ('en', 'es', 'pt'))]

def audio_lib():
    lib = 'globalThis.DHS = globalThis.DHS || {};\n' + '\n'.join(src(f) for f in AUDIO_LIB)
    scores = {k: json.loads(src(f)) for k, f in MUSIC_SCORES.items()}
    for chip, trim in LOUNGE_CHIPPED_TRIM.items():   # Lounge (Chipped): one derived score per chip
        cs = scores[chip]
        lc = dict(scores['lounge'], style='loungechip', chip=chip, tail=cs.get('tail', 2), master_db=round(cs.get('master_db', 0) + trim, 2))
        if 'lead' in cs:
            lc['lead'] = cs['lead']
        scores['lc_' + chip] = lc
    lib += '\nglobalThis.CDM_SCORES = ' + json.dumps(scores) + ';\n'
    assert '</script' not in lib.lower(), 'the audio library contains a closing script tag'
    return lib

def patch(text, patches, what):
    for name, old, new in patches:
        assert text.count(old) == 1, 'patch "%s" does not match %s exactly once (found %d). The file changed: update the patch list.' % (name, what, text.count(old))
        text = text.replace(old, new, 1)
    return text

def swap_sound_block(html):
    a = html.index('/* ================= sound:')
    b = html.index('/* ---------- session timer')
    assert a < b
    return html[:a] + patch(src('proj/cdrom/music.js'), MUSIC_PATCHES, 'proj/cdrom/music.js') + '\n' + html[b:]

html = patch(src('proj/cdrom/player-src.html'), PATCHES, 'the player source')
html = swap_sound_block(html)
html = html.replace('__AUDIOLIB__', audio_lib(), 1)
html = html.replace('/*__ADDONS__*/', src('proj/cdrom/addons.js'), 1)   # Oct 9b: timer readout + word structures
mono = re.search(r'base64,([A-Za-z0-9+/=]+)', src('proj/cdrom/channel-d.html')).group(1)  # Source Code Pro subset from the D1/D2 sketch
for k in FONTS:
    html = html.replace('__%s__' % k, font(k), 1)
html = html.replace('__MONO__', mono, 1)
html = html.replace('/*__DUD__*/', src('proj/cdrom/dud.js').replace("if(typeof module!=='undefined')module.exports=DUD;", ''), 1)
cs = cards()
html = html.replace('/*__CARDS__*/', 'const CARDS=' + json.dumps(cs, ensure_ascii=False) + ';', 1)
html = html.replace('/*__WORDS__*/', 'const CODEWORDS=' + json.dumps(list(json.loads(src('living/words-cs.json')).keys())) + ';', 1)
assert '/*__ADDONS__*/' not in html and '__PIX__' not in html and '__VT__' not in html and '__JQ__' not in html and '/*__CARDS__*/' not in html and '__AUDIOLIB__' not in html
os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, 'w', encoding='utf-8').write(html)
print('wrote', OUT, '%d KB' % (len(html.encode()) // 1024), '| cards:', len(cs), '| music scores:', ', '.join(MUSIC_SCORES))
