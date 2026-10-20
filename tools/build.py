# Builds finished, self-contained players from the project files.
# Run in Thonny. Needs: pip install fonttools brotli   (internet the first time, to fetch fonts)
# Oct 9: the jukebox also plays the CD-ROM music: Overclock and Lounge (Chipped), one cartridge per chip (made here from
# score/cdrom-overclock.json, score/encyclopedia-lounge.json and the chip scores). The plain Chips cartridges stay out.
import os, json, glob, base64, urllib.request

# ===================== SETTINGS =====================
SRC_DIR    = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # the repo root (this script sits in tools/)
OUT_DIR    = os.path.join(SRC_DIR, 'dist')                   # finished HTML goes here (never upload these to the Project)
FONT_CACHE = os.path.join(SRC_DIR, 'font_cache')
TARGETS    = ['living', 'jukebox']                           # which players to build
LIVING_SCORE   = 'score/ssr-tv-science.json'                # music for the living poster
LIVING_VARIANT = 'ex'                                        # 'ssr' (reading poster), 'cs' (CS class) or 'ex' (Exploration Seminar); cs/ex = trilingual tip cards
CS_PYTHON      = False                                       # True adds the Python cards (P1-P3) once text coding starts
CS_CARDS_OFF   = []                                          # card ids to leave out, e.g. ['14'] once text coding has started
JUKEBOX_SCORES = 'all'                                       # 'all' or a list like ['score/ssr-tv-science.json']
JUKEBOX_SKIP_STYLES = ['chip']                               # styles left out of the jukebox (Bryan, Oct 9: not the Chips music)
JUKEBOX_CHIPS  = ['tia', 'beep', 'arcade', 'snes', 'fm']     # CD-ROM chips that get an Overclock + a Lounge (Chipped) cartridge ([] = none)
LOUNGE_CHIPPED_TRIM = {'fm': 0.0, 'tia': 0.0, 'beep': 0.0, 'snes': 0.0, 'arcade': 0.0}   # dB; keep in step with tools/build_cdrom.py
FONTS = {  # placeholder -> source TTF on github.com/google/fonts (all SIL OFL)
    '__BAGEL__': 'https://github.com/google/fonts/raw/main/ofl/bagelfatone/BagelFatOne-Regular.ttf',
    '__EBG__':   'https://github.com/google/fonts/raw/main/ofl/ebgaramond/EBGaramond%5Bwght%5D.ttf',
    '__EBGI__':  'https://github.com/google/fonts/raw/main/ofl/ebgaramond/EBGaramond-Italic%5Bwght%5D.ttf',
    '__MONO__':  'https://github.com/google/fonts/raw/main/ofl/sourcecodepro/SourceCodePro%5Bwght%5D.ttf',   # CS code spans
}
UNICODES = list(range(0x20, 0x7F)) + list(range(0xA0, 0x100)) + [0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D, 0x2022, 0x2026]
# ====================================================

VARIANTS = {'ssr': {'words': 'living/words.json',    'js': None,                     'out': 'living-player.html',    'copy': None},
            'cs':  {'words': 'living/words-cs.json', 'js': 'living/variant-cs.js', 'out': 'living-player-cs.html', 'copy': 'proj/cs/copy.md'},
            'ex':  {'words': 'living/words-ex.json', 'js': 'living/variant-ex.js', 'out': 'living-player-ex.html', 'copy': 'proj/ex/copy.md'}}

def src(name): return open(os.path.join(SRC_DIR, name), encoding='utf-8').read()

def font_b64(key):
    from fontTools import subset
    os.makedirs(FONT_CACHE, exist_ok=True)
    ttf = os.path.join(FONT_CACHE, key.strip('_') + '.ttf'); out = ttf[:-4] + '.woff2'
    if not os.path.exists(out):
        if not os.path.exists(ttf):
            print('downloading', FONTS[key]); urllib.request.urlretrieve(FONTS[key], ttf)
        o = subset.Options(); o.flavor = 'woff2'; o.layout_features = ['kern', 'liga']
        f = subset.load_font(ttf, o); s = subset.Subsetter(o); s.populate(unicodes=UNICODES); s.subset(f); subset.save_font(f, out, o)
    return base64.b64encode(open(out, 'rb').read()).decode()

def fill_fonts(html):
    for key in FONTS:
        if key in html: html = html.replace(key, font_b64(key))
    return html

AUDIO_LIB = ['engine/src/audio/dsp.js', 'audio/instruments.js', 'audio/instruments-film.js', 'audio/instruments-cdrom.js',
             'audio/chips.js', 'audio/arranger.js',                                                                   # core first,
             'audio/style-comp4.js', 'audio/style-film24.js', 'audio/style-rounds.js', 'audio/style-lounge.js', 'audio/style-chip.js']   # then one file per style
STYLES = {'comp4', 'film24', 'rounds', 'lounge', 'chip'}   # styles the AUDIO_LIB above can play (the 'chip' cartridges join in Stage 4)
AUDIO = '\n'.join(src(f) for f in AUDIO_LIB)
# jukebox only (Oct 9): the CD-ROM styles. The living poster keeps AUDIO as it was.
JUKEBOX_LIB = ['audio/style-loungechip.js', 'proj/cdrom/track2-r2.js', 'audio/style-overclock.js']
JUKEBOX_STYLES = STYLES | {'loungechip', 'overclock'}
CHIP_NAMES = {'tia': '1980 TV chip', 'beep': '1984 PC speaker', 'arcade': '1988 FM + PSG', 'snes': '1991 16-bit sampler', 'fm': '1993 FM sound card'}   # from the screensaver's channel titles

def cs_cards(copy):   # card copy comes straight from the variant's proj/*/copy.md, word for word
    import re
    cards, cur, py = [], None, False
    for ln in src(copy).split('\n'):
        if ln.startswith('## Python cards'): py = True
        m = re.match(r'### (\S+?)\.? ', ln)
        if m: cur = {'id': m.group(1), 'py': py}; cards.append(cur); continue
        m = re.match(r'- \*\*(EN|ES|PT):\*\* (.*)', ln)
        if m and cur: cur[m.group(1).lower()] = m.group(2).split(' / ', 1)
    keep = [c for c in cards if (CS_PYTHON or not c['py']) and c['id'] not in CS_CARDS_OFF]
    assert keep and all(len(c.get(k, [])) == 2 for c in keep for k in ('en', 'es', 'pt')), 'a card is missing a language or its " / "'
    print('cards:', ' '.join(c['id'] for c in keep)); return keep

def cdrom_cartridges():   # Overclock + Lounge (Chipped), one per chip, made the way tools/build_cdrom.py makes the player's streams
    if not JUKEBOX_CHIPS: return []
    oc, lounge = json.loads(src('score/cdrom-overclock.json')), json.loads(src('score/encyclopedia-lounge.json'))
    out = []
    for chip in JUKEBOX_CHIPS:
        out.append(dict(oc, id='overclock-' + chip, chip=chip, tonic=40 + oc.get('tr', 0),   # tonic: E minor moved by tr (C# minor at -3)
                        title='Overclock · ' + CHIP_NAMES.get(chip, chip),
                        notes='Track 2 from the CS Lab Screensaver on one chip: endless passes with variations, a half-time breakdown, '
                              'a generated solo and a key lift.'))
    for chip in JUKEBOX_CHIPS:
        cs = json.loads(src('score/cdrom-%s.json' % chip))
        lc = dict(lounge, style='loungechip', chip=chip, tail=cs.get('tail', 2), master_db=round(cs.get('master_db', 0) + LOUNGE_CHIPPED_TRIM.get(chip, 0), 2),
                  id='lounge-chipped-' + chip, title='Encyclopedia Lounge (Chipped) · ' + CHIP_NAMES.get(chip, chip),
                  notes="Encyclopedia Lounge's notes played by one chip, as in the screensaver's Lounge (Chipped) mode.")
        if 'lead' in cs: lc['lead'] = cs['lead']
        out.append(lc)
    return out

def write(name, html):
    assert '__AUDIOLIB__' not in html and '__SCORES__' not in html and '__WORDS__' not in html, 'a placeholder was not filled'
    os.makedirs(OUT_DIR, exist_ok=True); p = os.path.join(OUT_DIR, name)
    open(p, 'w', encoding='utf-8').write(html); print('wrote', p, round(len(html) / 1024), 'KB')

if 'living' in TARGETS:
    score = json.loads(src(LIVING_SCORE))
    lib = AUDIO + '\nglobalThis.SSRM = MUSIC.bind(' + json.dumps(score) + ');'
    V = VARIANTS[LIVING_VARIANT]
    vjs = '' if not V['js'] else 'const CSCARDS = ' + json.dumps(cs_cards(V['copy']), ensure_ascii=False) + ';\n' + src('living/trio.js') + '\n' + src(V['js'])
    html = src('living/template.html').replace('__AUDIOLIB__', lib).replace('__WORDS__', src(V['words'])) \
                                       .replace('/*__VARIANT__*/', vjs).replace('/*__SOUND_TIMER_WAKE__*/', src('living/sound-timer.js'))
    write(V['out'], fill_fonts(html))

if 'jukebox' in TARGETS:
    files = sorted(glob.glob(os.path.join(SRC_DIR, 'score/*.json'))) if JUKEBOX_SCORES == 'all' \
            else [os.path.join(SRC_DIR, f) for f in JUKEBOX_SCORES]
    scores = [json.load(open(f, encoding='utf-8')) for f in files]
    scores = [s for s in scores if not (s.get('style') in ('overclock', 'loungechip') and 'chip' not in s)]   # chip-less CD-ROM scores: made per chip below
    skip = [s['id'] for s in scores if s.get('style', 'comp4') not in JUKEBOX_STYLES or s.get('style', 'comp4') in JUKEBOX_SKIP_STYLES]
    if skip: print('jukebox: skipping', ', '.join(skip))
    scores = [s for s in scores if s['id'] not in skip] + cdrom_cartridges()
    lib = AUDIO + '\n' + '\n'.join(src(f) for f in JUKEBOX_LIB)
    assert '</script' not in lib.lower(), 'the audio library contains a closing script tag'
    print('jukebox:', len(scores), 'cartridges:', ', '.join(s['id'] for s in scores))
    html = src('jukebox/template.html').replace('__AUDIOLIB__', lib).replace('__SCORES__', json.dumps(scores))
    write('jukebox.html', fill_fonts(html))
