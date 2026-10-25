"""eval_new_piece.py: the first-question eval (context plan step 10).

Asks Claude Code for a new piece in one sentence, the way a client would, and checks what happens before its first
question: which files it opened, how big the context was, whether it asked instead of designing, and what it cost.
A control run in an empty folder measures Claude Code's own overhead, so harness growth isn't blamed on the repo.

Runs on a copy of the repo (nothing here can be changed), with Sonnet, read-only tools allowed, a turn cap and a
dollar cap. Needs the `claude` CLI, logged in (a subscription works locally; CI uses an ANTHROPIC_API_KEY secret).
Run it in Thonny with the Run button. Prints PASS or FAIL; exit code 1 on FAIL (CI opens an issue then).
Cost: roughly $0.25-0.35 per run with Sonnet.
"""
import json, os, re, shutil, subprocess, sys, tempfile, time

# ===================== SETTINGS =====================
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # the repo root (this script sits in tools/)
PROMPT = 'Make a promo video for the robotics club.'
MODEL = 'sonnet'                      # the model most clients use
MAX_TURNS = 15
MAX_BUDGET_USD = 0.50                 # hard cap per run (Claude Code stops there)
CLAUDE_EXE = shutil.which('claude') or '/opt/homebrew/bin/claude'
OUT_DIR = os.environ.get('EVAL_OUT') or os.path.join(ROOT, 'dist', 'eval')    # dist/ is git-ignored
RUN_CONTROL = True                    # also measure Claude Code's own overhead in an empty folder
CONTROL_PROMPT = 'Say OK.'
ALLOWED_TOOLS = ['Read', 'Grep', 'Glob', 'Skill']    # anything else (Write, Edit, Bash ...) is refused, but still logged

# Pass/fail budget (notes/context-plan.md step 10)
MAX_REPO_SHARE_TOKENS = 12000         # context at the first question minus the control's context at start
MAX_COST_USD = 0.35
ALLOWED_BEFORE_QUESTION = ['brief/', '.claude/skills/', 'STATUS.md', 'CLAUDE.md']   # + the new piece's own proj/<name>/
# ====================================================


def run_claude(prompt, cwd, turns, log_path):
    cmd = [CLAUDE_EXE, '-p', prompt, '--model', MODEL, '--output-format', 'stream-json', '--verbose',
           '--max-turns', str(turns), '--max-budget-usd', str(MAX_BUDGET_USD),
           '--allowedTools', *ALLOWED_TOOLS, '--no-session-persistence']
    t0 = time.time()
    p = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=900, stdin=subprocess.DEVNULL)
    with open(log_path, 'w', encoding='utf-8') as fh:
        fh.write(p.stdout)
    events = []
    for line in p.stdout.splitlines():
        try:
            events.append(json.loads(line))
        except ValueError:
            pass
    if not events:
        raise RuntimeError(f'claude printed no events (exit {p.returncode}):\n{p.stderr[-2000:]}')
    return events, time.time() - t0


def context_of(ev):
    u = (ev.get('message') or {}).get('usage') or {}
    return u.get('input_tokens', 0) + u.get('cache_creation_input_tokens', 0) + u.get('cache_read_input_tokens', 0)


def rel(path, base):
    if not path:
        return path
    if os.path.isabs(path):
        r = os.path.relpath(path, base)
        return path if r.startswith('..') else r.replace(os.sep, '/')
    return path[2:] if path.startswith('./') else path


def analyse(events, workdir, existing_proj):
    assistants = [e for e in events if e.get('type') == 'assistant']
    result = next((e for e in events if e.get('type') == 'result'), {})
    version = next((e.get('claude_code_version') or e.get('version') for e in events
                    if e.get('type') == 'system' and e.get('subtype') == 'init'), None)
    opened, writes, q_index = [], [], None
    for i, e in enumerate(assistants):
        blocks = (e.get('message') or {}).get('content') or []
        asked = False
        for b in blocks:
            if b.get('type') == 'tool_use':
                name, ti = b.get('name'), b.get('input') or {}
                if name == 'AskUserQuestion':
                    asked = True
                elif name in ('Write', 'Edit', 'NotebookEdit', 'MultiEdit'):
                    target = rel(str(ti.get('file_path', '')), workdir)
                    m = re.match(r'proj/([^/]+)/', target)
                    if not (m and m.group(1) not in existing_proj):    # the new piece's own brief is fine
                        writes.append(name + ' ' + target)
                elif q_index is None:
                    if name == 'Skill':
                        opened.append('skill:' + str(ti.get('skill', ti.get('command', ''))))
                    elif name == 'Bash':
                        opened.append('bash:' + str(ti.get('command', ''))[:200])
                    else:
                        for k in ('file_path', 'path', 'pattern'):
                            if ti.get(k):
                                opened.append(rel(str(ti[k]), workdir))
            elif b.get('type') == 'text' and re.search(r'\?\s*(\*\*)?\s*$', b.get('text', ''), re.M):
                asked = True
        if asked and q_index is None:
            q_index = i
    final_text = result.get('result', '') or ''
    ends_on_question = '?' in final_text[-600:]

    def allowed(p):
        if p.startswith('skill:'):
            return True
        if p.startswith('bash:'):    # fine only if every path in the command is allowed (or is the bare proj/ list)
            toks = re.findall(r'[\w.*-]+/[\w./*-]*', p[5:])
            return all(t.rstrip('/') == 'proj' or allowed(t) for t in toks)
        if any(p == a.rstrip('/') or p.startswith(a) for a in ALLOWED_BEFORE_QUESTION):
            return True
        m = re.match(r'proj/([^/]+)/', p)
        return bool(m and m.group(1) not in existing_proj)

    return {
        'claude_code_version': version,
        'context_at_start': context_of(assistants[0]) if assistants else 0,
        'context_at_first_question': context_of(assistants[q_index]) if q_index is not None else None,
        'opened_before_question': opened,
        'not_allowed': [p for p in opened if not allowed(p)],
        'write_attempts': writes,
        'asked_a_question': q_index is not None,
        'ends_on_question': ends_on_question,
        'cost_usd': result.get('total_cost_usd'),
        'turns': result.get('num_turns'),
        'stop': result.get('subtype'),
    }


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    if not os.path.exists(CLAUDE_EXE):
        sys.exit(f'claude not found: set CLAUDE_EXE (now {CLAUDE_EXE})')
    report = {'prompt': PROMPT, 'model': MODEL, 'when': time.strftime('%Y-%m-%d %H:%M')}

    if RUN_CONTROL:
        empty = tempfile.mkdtemp(prefix='eomd-eval-control-')
        ev, _ = run_claude(CONTROL_PROMPT, empty, 1, os.path.join(OUT_DIR, 'control.jsonl'))
        ctrl = analyse(ev, empty, set())
        report['control_context_at_start'] = ctrl['context_at_start']
        report['control_cost_usd'] = ctrl['cost_usd']
        shutil.rmtree(empty, ignore_errors=True)

    work = tempfile.mkdtemp(prefix='eomd-eval-repo-')
    shutil.copytree(ROOT, os.path.join(work, 'repo'), ignore=shutil.ignore_patterns(
        '.git', 'dist', 'font_cache', 'node_modules', '__pycache__', 'porter_work'))
    repo = os.path.join(work, 'repo')
    existing = {d for d in os.listdir(os.path.join(repo, 'proj')) if os.path.isdir(os.path.join(repo, 'proj', d))}
    log = os.path.join(OUT_DIR, 'stream.jsonl')
    ev, secs = run_claude(PROMPT, repo, MAX_TURNS, log)
    r = analyse(ev, repo, existing)
    shutil.rmtree(work, ignore_errors=True)
    report.update(r)
    report['seconds'] = round(secs)

    base = report.get('control_context_at_start')
    q = r['context_at_first_question']
    report['repo_share_at_first_question'] = (q - base) if (q is not None and base) else None
    checks = {
        'repo share of context at the first question <= %d tokens' % MAX_REPO_SHARE_TOKENS:
            report['repo_share_at_first_question'] is not None and report['repo_share_at_first_question'] <= MAX_REPO_SHARE_TOKENS,
        'files opened before the first question are allowed': not r['not_allowed'],
        'it asks before it designs (no Write/Edit, ends on a question)':
            r['asked_a_question'] and not r['write_attempts'] and r['ends_on_question'],
        'cost <= $%.2f' % MAX_COST_USD: r['cost_usd'] is not None and r['cost_usd'] <= MAX_COST_USD,
    }
    report['checks'] = checks
    report['verdict'] = 'PASS' if all(checks.values()) else 'FAIL'

    with open(os.path.join(OUT_DIR, 'report.json'), 'w', encoding='utf-8') as fh:
        json.dump(report, fh, indent=1)
    lines = [f"# First-question eval: {report['verdict']}", '',
             f"Prompt: \"{PROMPT}\" · model {MODEL} · Claude Code {r['claude_code_version']} · {report['when']}", '',
             '| Measure | Value |', '|---|---|',
             f"| Control context at start (Claude Code's own overhead) | {base} |",
             f"| Context at start, repo | {r['context_at_start']} |",
             f"| Context at first question | {q} |",
             f"| Repo share at first question | {report['repo_share_at_first_question']} (budget {MAX_REPO_SHARE_TOKENS}) |",
             f"| Cost of the repo run | ${r['cost_usd']} (budget ${MAX_COST_USD}); control ${report.get('control_cost_usd')} |",
             f"| Turns, stop reason | {r['turns']}, {r['stop']} |", '',
             '## Checks'] + [f"- {'PASS' if ok else 'FAIL'}: {name}" for name, ok in checks.items()] + [
             '', '## Opened before the first question'] + [f"- `{p}`" for p in r['opened_before_question']] + [
             '', f"Not allowed: {r['not_allowed'] or 'none'} · Write/Edit attempts: {r['write_attempts'] or 'none'}"]
    text = '\n'.join(lines) + '\n'
    with open(os.path.join(OUT_DIR, 'report.md'), 'w', encoding='utf-8') as fh:
        fh.write(text)
    with open(log, encoding='utf-8') as fh:
        head = ''.join(fh.readlines()[:200])
    with open(os.path.join(OUT_DIR, 'issue.md'), 'w', encoding='utf-8') as fh:
        fh.write(text + '\n## First 200 lines of the stream\n\n<details><summary>stream.jsonl</summary>\n\n```\n'
                 + head[:50000] + '\n```\n</details>\n\nThe full log is attached to the workflow run as an artifact. '
                 'Close this issue after a fix to turn the eval back on.\n')
    print(text)
    print('Files:', OUT_DIR)
    return report['verdict'] == 'PASS'


if __name__ == '__main__':
    sys.exit(0 if main() else 1)
