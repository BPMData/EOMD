"""Stage-read log (context plan step 9). A PostToolUse hook: NEVER blocks anything.

After every Read, Grep, Glob or Bash call, if a new piece is in a design stage (the newest proj/*/brief.md whose
status line says Stage: interview, brief, concepts or storyboard), append one JSON line to proj/<name>/access.jsonl:
time, stage, mode, tool and the paths touched (for Bash, the command). tools/check_stage_reads.py reads the logs.
Any error is swallowed: the hook must never get in the way of the session.
"""
import json, os, re, sys, time, glob

DESIGN = ('interview', 'brief', 'concepts', 'storyboard')


def piece_in_design(root):
    best = None
    for f in glob.glob(os.path.join(root, 'proj', '*', 'brief.md')):
        try:
            with open(f, encoding='utf-8') as fh:
                head = fh.read(1500)
        except OSError:
            continue
        m = re.search(r'Stage:\s*([a-z]+)', head)
        if not m or m.group(1) not in DESIGN:
            continue
        mode = re.search(r'Mode:\s*(efficient|full creative)\b', head)
        mt = os.path.getmtime(f)
        if best is None or mt > best[0]:
            best = (mt, os.path.basename(os.path.dirname(f)), m.group(1), mode.group(1) if mode else '')
    return best


def rel(root, p):
    if not p:
        return p
    a = os.path.abspath(os.path.join(root, p)) if not os.path.isabs(p) else os.path.abspath(p)
    r = os.path.relpath(a, root)
    return p if r.startswith('..') else r.replace(os.sep, '/')


def main():
    ev = json.load(sys.stdin)
    root = os.environ.get('CLAUDE_PROJECT_DIR') or ev.get('cwd') or os.getcwd()
    tool = ev.get('tool_name', '')
    if tool not in ('Read', 'Grep', 'Glob', 'Bash'):
        return
    found = piece_in_design(root)
    if not found:
        return
    _, name, stage, mode = found
    ti = ev.get('tool_input') or {}
    rec = {'t': time.strftime('%Y-%m-%dT%H:%M:%S%z'), 'stage': stage, 'mode': mode, 'tool': tool}
    if tool == 'Bash':
        rec['cmd'] = str(ti.get('command', ''))[:1000]
    else:
        paths = [ti.get('file_path'), ti.get('path')]
        if tool == 'Glob':
            paths.append(ti.get('pattern'))
        if tool == 'Grep' and ti.get('glob'):
            paths.append(ti.get('glob'))
        rec['paths'] = [rel(root, p) for p in paths if p] or ['.']
    with open(os.path.join(root, 'proj', name, 'access.jsonl'), 'a', encoding='utf-8') as fh:
        fh.write(json.dumps(rec, ensure_ascii=False) + '\n')


try:
    main()
except Exception:
    pass
sys.exit(0)
