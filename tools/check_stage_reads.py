"""check_stage_reads.py: the peeking audit for new pieces (context plan step 9).

Reads every proj/<piece>/access.jsonl (written by the stage-read hook, .claude/hooks/stage_log.py) and lists the
reads of restricted paths (picture, sound and music, tools, other pieces) made before the piece's toolbox gate:
  efficient mode     -> before the brief was approved      (stages interview, brief)
  full creative mode -> before the storyboard was approved (stages interview, brief, concepts, storyboard)
It only reports (as GitHub warning annotations in CI); it never fails, so it can't block a push.
Run it in Thonny with the Run button, or `python tools/check_stage_reads.py` (CI does).
"""
import fnmatch, glob, json, os, re

# ===================== SETTINGS =====================
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # the repo root (this script sits in tools/)

# The restricted list (notes/context-plan.md, "The restricted list"). Folders end in '/'; '*' patterns use fnmatch.
RESTRICTED = [
    # picture
    'gen/', 'living/', 'engine/', 'academies-film/', 'players/', 'dist/', 'media/',
    # sound and music
    'audio/', 'score/', 'jukebox/', 'tests/hashes.json', 'notes/audio-ports.md',
    'proj/*/music.js', 'proj/cdrom/track2-r2.js', 'proj/cdrom/intro-motif.md',
    # tools
    'tools/',
]
# every proj/<other piece>/ is restricted too (handled in code), and so are the per-piece STATUS.md files
BEFORE_GATE = {'efficient': {'interview', 'brief'},
               'full creative': {'interview', 'brief', 'concepts', 'storyboard'},
               '': {'interview', 'brief', 'concepts', 'storyboard'}}   # mode not set yet: count every design stage
# ====================================================


def restricted(path, own):
    p = path[2:] if path.startswith('./') else path
    if p.startswith('proj/'):
        parts = p.split('/')
        if len(parts) > 1 and parts[1] and parts[1] != own and not parts[1].startswith('*'):
            return True
    for r in RESTRICTED:
        if '*' in r:
            if fnmatch.fnmatch(p, r):
                return True
        elif p == r.rstrip('/') or p.startswith(r):
            return True
    return False


def bash_hits(cmd, own):
    hits = []
    for r in RESTRICTED:
        probe = r.split('*')[0] if '*' in r else r
        if '*' in r:
            tail = r.split('*')[-1]
            for m in re.finditer(r'proj/([\w.-]+)' + re.escape(tail), cmd):
                if m.group(1) != own:
                    hits.append(m.group(0))
        elif probe in cmd and probe not in hits:
            hits.append(probe)
    for m in re.finditer(r'proj/([\w.-]+)/', cmd):
        if m.group(1) != own and m.group(0) not in hits:
            hits.append(m.group(0))
    return hits


def audit():
    gh = os.environ.get('GITHUB_ACTIONS') == 'true'
    total = 0
    logs = sorted(glob.glob(os.path.join(ROOT, 'proj', '*', 'access.jsonl')))
    for log in logs:
        own = os.path.basename(os.path.dirname(log))
        relog = os.path.relpath(log, ROOT).replace(os.sep, '/')
        peeks = []
        with open(log, encoding='utf-8') as fh:
            for n, line in enumerate(fh, 1):
                try:
                    rec = json.loads(line)
                except ValueError:
                    continue
                if rec.get('stage') not in BEFORE_GATE.get(rec.get('mode', ''), BEFORE_GATE['']):
                    continue
                if rec.get('tool') == 'Bash':
                    hits = bash_hits(rec.get('cmd', ''), own)
                else:
                    hits = [p for p in rec.get('paths', []) if restricted(p, own)]
                if hits:
                    peeks.append((n, rec, hits))
        total += len(peeks)
        print(f'{own}: {len(peeks)} restricted read(s) before the toolbox gate')
        for n, rec, hits in peeks:
            msg = f"{own}: {rec.get('tool')} at stage {rec.get('stage')} touched {', '.join(hits)}"
            print(f'::warning file={relog},line={n}::{msg}' if gh else f'  line {n}: {msg}')
    if not logs:
        print('No stage logs yet (proj/*/access.jsonl).')
    print(f'Total: {total} restricted read(s) before the gate, in {len(logs)} piece(s). '
          'Record the count in STATUS.md (decision rule: notes/context-plan.md step 9).')
    return total


if __name__ == '__main__':
    audit()
