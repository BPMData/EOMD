# Makes words.json: single-stroke cursive (Hershey Script Simplex, public domain) for the vine-writing effect.
# Run in Thonny. Edit WORDS, run, then rebuild with tools__build.py.
import os, json, urllib.request

# ===================== SETTINGS =====================
WORDS   = ['read', 'wonder', 'notice', 'quiet', 'imagine', 'story', 'page', 'chapter', 'listen', 'think', 'focus', 'curious', 'dream', 'discover', 'explore', 'question', 'pause', 'ponder', 'linger', 'savor', 'learn', 'words', 'books', 'breathe', 'slowly', 'reread', 'picture', 'connect', 'predict', 'believe', 'journey', 'voices', 'mystery', 'poems', 'unfold', 'gather', 'libro', 'livro', 'imaginar', 'explorar', 'aprender', 'curioso', 'pausa']
# lowercase a-z only (no accents in the font). Spanish/Portuguese: libro/livro, imaginar, explorar, aprender, curioso, pausa
VARIANT = 'ex'   # 'ssr' writes living__words.json from WORDS; 'cs' living__words-cs.json from WORDS_CS; 'ex' living__words-ex.json from WORDS_EX
WORDS_CS = ['debug', 'indent', 'loop', 'print', 'string', 'syntax', 'return', 'variable', 'function', 'input', 'while', 'error', 'comment', 'test', 'python']
WORDS_EX = ['explore', 'rank', 'pathway', 'academy', 'campus', 'future', 'choose', 'career', 'goal', 'lottery', 'research']
# 8 letters max fits the board best
JHF_URL = 'https://raw.githubusercontent.com/kamalmostafa/hershey-fonts/master/hershey-fonts/scripts.jhf'
SRC_DIR = os.path.dirname(os.path.abspath(__file__))
JHF     = os.path.join(SRC_DIR, 'font_cache', 'scripts.jhf')
LIST    = {'ssr': WORDS, 'cs': WORDS_CS, 'ex': WORDS_EX}[VARIANT]
OUT     = os.path.join(SRC_DIR, {'ssr': 'living__words.json', 'cs': 'living__words-cs.json', 'ex': 'living__words-ex.json'}[VARIANT])
# ====================================================

os.makedirs(os.path.dirname(JHF), exist_ok=True)
if not os.path.exists(JHF): urllib.request.urlretrieve(JHF_URL, JHF)
glyphs, buf = [], ''
for ln in open(JHF).read().split('\n'):            # records wrap across lines; vertex count says where each ends
    if not ln.strip(): continue
    buf += ln; need = 8 + 2 * int(buf[5:8])
    if len(buf) >= need: glyphs.append(buf[:need]); buf = ''
def parse(g):
    n = int(g[5:8]); pairs = [g[8 + i:10 + i] for i in range(0, 2 * n, 2)]
    L, R = ord(pairs[0][0]) - 82, ord(pairs[0][1]) - 82; strokes = [[]]
    for p in pairs[1:]:
        if p == ' R': strokes.append([]); continue          # pen up
        strokes[-1].append((ord(p[0]) - 82, ord(p[1]) - 82))
    return L, R, [s for s in strokes if s]
font = {chr(32 + i): parse(g) for i, g in enumerate(glyphs[:95])}   # file is in ASCII order from space
out = {}
for word in LIST:
    x, strokes = 0, []
    for ch in word:
        L, R, st = font[ch]
        strokes += [[(x + px - L, py) for px, py in s] for s in st]; x += R - L
    paths, lifts = [], []
    for s in strokes:   # touching strokes merge; tiny/short ones (i-dots, t-crosses) are drawn after, as "lifts"
        xs, ys = [p[0] for p in s], [p[1] for p in s]
        if paths and abs(paths[-1][-1][0] - s[0][0]) + abs(paths[-1][-1][1] - s[0][1]) <= 3.5: paths[-1] += s[1:]
        elif (max(xs) - min(xs) <= 4 and max(ys) - min(ys) <= 4) or (paths and len(s) <= 4): lifts.append(s)
        else: paths.append(list(s))
    ax = [p[0] for s in strokes for p in s]; ay = [p[1] for s in strokes for p in s]
    out[word] = {'paths': paths, 'lifts': lifts, 'bbox': [min(ax), min(ay), max(ax), max(ay)]}
json.dump(out, open(OUT, 'w'), separators=(',', ':'))
print('wrote', OUT, 'for', LIST)
