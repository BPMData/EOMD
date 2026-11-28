# tools/build_kit.py: BUILD THE KIT. Run in Thonny (the Run button; no command-line arguments).
# The kit (kit/) is EOMD's engine parts packaged for other projects (ProofEr copies a pinned version into
# vendor/eomd-kit/). Each kit file is a copy of an engine source with a header on top; kit/KIT.json lists every file
# with its sha256. The format is agreed with ProofEr (TODO.md §0): change it only together with ProofEr.
#   MODE 'build'  copies the sources into kit/, adds the headers, rewrites KIT.json (keeps the version you set there)
#   MODE 'check'  changes nothing; lists every problem (stale copy, wrong hash, unlisted file, no changelog entry).
#                 CI runs this and fails on any problem.
# Releasing a new kit version: change the sources, set "version" in kit/KIT.json by hand (semver), add a
# "## <version>" section to kit/CHANGELOG.md, then run this with MODE 'build' and commit kit/ with the sources.
import os, re, json, hashlib

# ===================== SETTINGS =====================
PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # the repo root
KIT_DIR = os.path.join(PROJECT_DIR, 'kit')
MODE = 'build'  # 'build' or 'check'
# Generated kit files: path under kit/  ->  source path in the repo. Add a part here to ship it.
PARTS = {
    'fx/lens.js': 'engine/src/fx/lens.js',
    'audio/dsp.js': 'engine/src/audio/dsp.js',
}
# Hand-written kit files (listed and hashed in KIT.json, never generated)
DOCS = ['README.md', 'CHANGELOG.md']
LICENSE_ID = 'AGPL-3.0-only'
COPYRIGHT = 'Copyright (C) 2026 Bryan Patrick Murphy'
REPO_URL = 'https://github.com/BPMData/EOMD'
FIRST_VERSION = '0.1.0'  # used only when kit/KIT.json doesn't exist yet
# ====================================================

SEMVER = re.compile(r'^\d+\.\d+\.\d+$')


def header(kit_path, src):
    return (
        f'/* EOMD kit: {kit_path}. {COPYRIGHT}. SPDX-License-Identifier: {LICENSE_ID}\n'
        f'   Copied from {src} ({REPO_URL}) by tools/build_kit.py: change the source in EOMD, not this copy. */\n'
    )


def expected(kit_path):
    """The exact bytes a generated kit file should have."""
    src = PARTS[kit_path]
    with open(os.path.join(PROJECT_DIR, src), encoding='utf-8', newline='') as f:
        body = f.read().replace('\r\n', '\n')
    return (header(kit_path, src) + body).encode('utf-8')


def sha(data):
    return hashlib.sha256(data).hexdigest()


def kit_files():
    """Every file in kit/ except KIT.json, as forward-slash paths under kit/."""
    out = []
    for root, _, names in os.walk(KIT_DIR):
        for n in names:
            rel = os.path.relpath(os.path.join(root, n), KIT_DIR).replace(os.sep, '/')
            if rel != 'KIT.json' and n != '.DS_Store':
                out.append(rel)
    return sorted(out)


def read_manifest():
    p = os.path.join(KIT_DIR, 'KIT.json')
    if not os.path.exists(p):
        return None
    with open(p, encoding='utf-8') as f:
        return json.load(f)


def changelog_has(version):
    p = os.path.join(KIT_DIR, 'CHANGELOG.md')
    if not os.path.exists(p):
        return False
    with open(p, encoding='utf-8') as f:
        return re.search(r'^## ' + re.escape(version) + r'(\s|$)', f.read(), re.M) is not None


def check(log=print):
    """Return a list of problems (empty = the kit is consistent)."""
    problems = []
    m = read_manifest()
    if m is None:
        return ['kit/KIT.json is missing: run tools/build_kit.py with MODE "build"']
    if set(m) != {'version', 'license', 'files'}:
        problems.append(f'KIT.json keys are {sorted(m)}; expected exactly version, license, files')
    v = m.get('version', '')
    if not SEMVER.match(str(v)):
        problems.append(f'KIT.json version "{v}" is not x.y.z')
    elif not changelog_has(v):
        problems.append(f'kit/CHANGELOG.md has no "## {v}" section')
    if m.get('license') != LICENSE_ID:
        problems.append(f'KIT.json license is "{m.get("license")}"; expected "{LICENSE_ID}"')
    listed = m.get('files', {})
    on_disk = kit_files()
    for p in on_disk:
        if p not in PARTS and p not in DOCS:
            problems.append(f'kit/{p} is not a known part: add it to PARTS or DOCS, or remove it')
    for p in list(PARTS) + DOCS:
        if p not in on_disk:
            problems.append(f'kit/{p} is missing')
    for p in on_disk:
        with open(os.path.join(KIT_DIR, p), 'rb') as f:
            data = f.read()
        if p in PARTS and data != expected(p):
            problems.append(f'kit/{p} is out of date with {PARTS[p]}: run tools/build_kit.py')
        if p not in listed:
            problems.append(f'kit/{p} is not listed in KIT.json')
        elif listed[p] != sha(data):
            problems.append(f'KIT.json has the wrong sha256 for {p}')
    for p in listed:
        if p not in on_disk:
            problems.append(f'KIT.json lists {p}, which is not in kit/')
    for p in problems:
        log('  PROBLEM: ' + p)
    log(
        f'kit {v}: {len(on_disk)} files, '
        + ('consistent.' if not problems else f'{len(problems)} problem(s).')
    )
    return problems


def build(log=print):
    old = read_manifest() or {}
    version = old.get('version', FIRST_VERSION)
    extra = [p for p in (kit_files() if os.path.isdir(KIT_DIR) else []) if p not in PARTS and p not in DOCS]
    if extra:
        log('Stopped: these files in kit/ are not parts or docs (add them to PARTS or DOCS, or remove them):')
        for p in extra:
            log('  kit/' + p)
        return False
    for p in DOCS:
        if not os.path.exists(os.path.join(KIT_DIR, p)):
            log(f'Stopped: kit/{p} is missing (it is hand-written; create it first).')
            return False
    for p in PARTS:
        dst = os.path.join(KIT_DIR, *p.split('/'))
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        with open(dst, 'wb') as f:
            f.write(expected(p))
    files = {}
    for p in kit_files():
        with open(os.path.join(KIT_DIR, p), 'rb') as f:
            files[p] = sha(f.read())
    manifest = {'version': version, 'license': LICENSE_ID, 'files': files}
    with open(os.path.join(KIT_DIR, 'KIT.json'), 'w', encoding='utf-8', newline='\n') as f:
        f.write(json.dumps(manifest, indent=2) + '\n')
    changed = sorted(p for p in files if old.get('files', {}).get(p) != files[p])
    log(f'Built kit {version}: {len(files)} files -> kit/KIT.json')
    if old and changed and old.get('version') == version:
        log('  Changed since the last build: ' + ', '.join(changed))
        log('  If this is a release, set a new "version" in kit/KIT.json, add it to kit/CHANGELOG.md, and run again.')
    if not changelog_has(version):
        log(f'  kit/CHANGELOG.md needs a "## {version}" section (CI checks this).')
    return True


if __name__ == '__main__':
    if MODE == 'check':
        check()
    else:
        build()
