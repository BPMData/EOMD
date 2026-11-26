#!/usr/bin/env python3
"""Programmatic stage-gate & receipt hook for EOMD across Antigravity, Claude Code, and Codex CLI.

Enforces EOMD's interview -> brief -> concepts -> storyboard/stills/sound -> build -> fresh-eyes QA pipeline:
- PostToolUse records inspected PNGs, ffmpeg/QA command runs, and isolated fresh-eyes reviewer subagents.
- PreToolUse blocks writing storyboard/stills before brief APPROVED, and blocks players/<name>.html before
  storyboard APPROVED + inspected stills + fresh-eyes review (in full creative mode), plus budget model caps.
- Stop blocks completing a locally edited players/<name>.html until QA checks, >=2 inspected QA frame PNGs,
  and an isolated fresh-eyes review (proj/<name>/qa/review.md) pass for the current HTML.
"""
from __future__ import annotations

import argparse
import glob
import hashlib
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path

TOOL_ROOT = Path(__file__).resolve().parents[2]
RECEIPT_NAMES = (
    ".qa_checked.json",
    ".inspected_pngs.json",
    ".subagent_receipts.jsonl",
    ".review_receipts.jsonl",
)


def _read_text(path: Path, limit: int | None = None) -> str:
    try:
        with path.open("r", encoding="utf-8") as fh:
            return fh.read(limit) if limit else fh.read()
    except OSError:
        return ""


def _load_json(path: Path, default):
    txt = _read_text(path)
    if not txt:
        return default
    try:
        return json.loads(txt)
    except ValueError:
        return default


def _file_sha256(path: Path) -> str:
    try:
        return hashlib.sha256(path.read_bytes()).hexdigest()
    except OSError:
        return ""


def _parse_brief_meta(root: Path, piece: str) -> tuple[str, str, str, bool]:
    """Return (stage, mode, budget, budget_override) from proj/<piece>/brief.md."""
    brief = root / "proj" / piece / "brief.md"
    head = _read_text(brief, 2500)
    stage_m = re.search(r"Stage:\s*([a-zA-Z_-]+)", head)
    stage = stage_m.group(1).lower() if stage_m else ""
    mode_m = re.search(r"Mode:\s*([^\n·|]+)", head, re.I)
    mode = mode_m.group(1).strip().lower() if mode_m else ""
    budget_m = re.search(r"Budget:\s*([a-zA-Z_-]+)", head, re.I)
    budget = budget_m.group(1).lower() if budget_m else "standard"
    override = bool(
        re.search(r"Budget-Override:\s*(approved|yes|true)", head, re.I)
        or (root / "proj" / piece / ".budget_override").exists()
    )
    return stage, mode, budget, override


def _newest_active_piece(root: Path) -> str | None:
    best: tuple[float, str] | None = None
    for brief in glob.glob(str(root / "proj" / "*" / "brief.md")):
        p = Path(brief)
        try:
            mt = p.stat().st_mtime
        except OSError:
            continue
        if best is None or mt > best[0]:
            best = (mt, p.parent.name)
    return best[1] if best else None


def _rel_path(root: Path, raw: str) -> str:
    if not raw:
        return ""
    p = Path(raw)
    p = (root / p).resolve() if not p.is_absolute() else p.resolve()
    try:
        return p.relative_to(root.resolve()).as_posix()
    except ValueError:
        return raw.replace("\\", "/")


def _extract_paths_from_shell(cmd: str) -> list[str]:
    paths: list[str] = []
    for m in re.finditer(r"(?:^|[\s'\"(=])((?:\./)?(?:proj|players|dist)/[^\s'\"`;|>&)]+)", cmd):
        paths.append(m.group(1))
    return paths


def _extract_target_paths(root: Path, tool_name: str, args: dict) -> list[str]:
    low = tool_name.lower()
    raw_paths: list[str] = []
    for key in ("Path", "file_path", "path", "target_file"):
        val = args.get(key)
        if isinstance(val, str) and val:
            raw_paths.append(val)
    if "patch" in low or "apply_patch" in low:
        patch_text = str(args.get("patch") or args.get("input") or args.get("Patch") or "")
        for m in re.finditer(r"^\*\*\*\s+(?:Add|Update|Delete)\s+File:\s*(.+)$", patch_text, re.M):
            raw_paths.append(m.group(1).strip())
    if low in ("run_command", "bash", "shell", "command"):
        cmd = str(args.get("CommandLine") or args.get("command") or "")
        if re.search(r"(>|>>|\btee\b|\bmv\b|\bcp\b|write_text|open\s*\()", cmd):
            raw_paths.extend(_extract_paths_from_shell(cmd))
    return [_rel_path(root, p) for p in raw_paths if p]


def _normalize_input(harness: str, event: str, payload: dict) -> dict:
    cwd_raw = payload.get("cwd") or os.environ.get("CLAUDE_PROJECT_DIR")
    if not cwd_raw and isinstance(payload.get("workspacePaths"), list) and payload["workspacePaths"]:
        cwd_raw = payload["workspacePaths"][0]
    root = Path(cwd_raw).resolve() if cwd_raw else TOOL_ROOT

    if harness == "antigravity":
        tc = payload.get("toolCall") or {}
        tool_name = str(tc.get("name") or "")
        args = tc.get("args") if isinstance(tc.get("args"), dict) else {}
        error = payload.get("error")
        term = str(payload.get("terminationReason") or "")
        active = bool(payload.get("continuationActive", False))
        return {
            "root": root,
            "tool": tool_name,
            "args": args,
            "error": error,
            "stop_active": active or (event == "Stop" and term not in ("", "NO_TOOL_CALL")),
        }

    tool_name = str(payload.get("tool_name") or (payload.get("toolCall") or {}).get("name") or "")
    args = payload.get("tool_input") or (payload.get("toolCall") or {}).get("args") or {}
    if not isinstance(args, dict):
        args = {}
    error = payload.get("error")
    tr = payload.get("tool_response")
    if not error and isinstance(tr, dict):
        if tr.get("is_error") or tr.get("exit_code", 0) != 0 or tr.get("returncode", 0) != 0:
            error = "tool_response error"
    active = bool(payload.get("stop_hook_active", False))
    return {
        "root": root,
        "tool": tool_name,
        "args": args,
        "error": error,
        "stop_active": active,
    }


def _subagent_receipts_path(root: Path, piece: str) -> Path:
    return root / "proj" / piece / ".subagent_receipts.jsonl"


def _review_receipts_path(root: Path, piece: str) -> Path:
    return root / "proj" / piece / ".review_receipts.jsonl"


def _inspected_pngs_path(root: Path, piece: str) -> Path:
    return root / "proj" / piece / ".inspected_pngs.json"


def _qa_checked_path(root: Path, piece: str) -> Path:
    return root / "proj" / piece / ".qa_checked.json"


def _piece_has_local_changes(root: Path, piece: str) -> bool:
    if not (root / ".git").exists():
        return True
    try:
        p = subprocess.run(
            ["git", "status", "--porcelain", "--", f"proj/{piece}", f"players/{piece}.html"],
            cwd=str(root),
            capture_output=True,
            text=True,
            timeout=3,
        )
    except OSError:
        return True
    if p.returncode != 0:
        return True
    for line in p.stdout.splitlines():
        path = line[3:].strip().strip('"')
        if not path.endswith(RECEIPT_NAMES):
            return True
    return False


def _player_html_has_local_changes(root: Path, piece: str) -> bool:
    if not (root / ".git").exists():
        return True
    try:
        p = subprocess.run(
            ["git", "status", "--porcelain", "--", f"players/{piece}.html"],
            cwd=str(root),
            capture_output=True,
            text=True,
            timeout=3,
        )
    except OSError:
        return True
    if p.returncode != 0:
        return True
    return bool(p.stdout.strip())


def _is_fresh_eyes_subagent(args: dict) -> bool:
    sub_type = str(args.get("subagent_type") or args.get("TypeName") or args.get("agent_type") or "").lower()
    role = str(args.get("Role") or args.get("role") or args.get("name") or "").lower()
    prompt = str(args.get("Prompt") or args.get("prompt") or "").lower()
    if "fresh-eyes" in sub_type or "fresh_eyes" in sub_type or "reviewer" in sub_type:
        return True
    if "fresh" in role or "review" in role:
        return True
    return any(tok in prompt for tok in ("fresh-eyes", "fresh eyes", "stills/review.md", "qa/review.md", "craft.md"))


def _extract_piece_from_subagent(root: Path, args: dict) -> list[str]:
    blob = " ".join(
        str(args.get(k) or "")
        for k in ("Prompt", "prompt", "Role", "role")
    )
    found: list[str] = []
    for m in re.finditer(r"proj/([a-zA-Z0-9_-]+)/", blob):
        name = m.group(1)
        if (root / "proj" / name / "brief.md").exists() and name not in found:
            found.append(name)
    if found:
        return found
    newest = _newest_active_piece(root)
    return [newest] if newest else []


def _record_post_tool(root: Path, tool_name: str, args: dict, error) -> None:
    if error:
        return
    low = tool_name.lower()
    now = time.time()

    # 1. Subagent / fresh-eyes reviewer execution receipt
    if low in ("invoke_subagent", "agent", "task", "spawn_agent"):
        targets = _extract_piece_from_subagent(root, args)
        is_review = _is_fresh_eyes_subagent(args)
        for piece in targets:
            stage, _, _, _ = _parse_brief_meta(root, piece)
            rpath = _subagent_receipts_path(root, piece)
            rpath.parent.mkdir(parents=True, exist_ok=True)
            with rpath.open("a", encoding="utf-8") as fh:
                fh.write(json.dumps({"ts": now, "tool": tool_name, "review": is_review}) + "\n")
            if is_review:
                html = root / "players" / f"{piece}.html"
                rec = {
                    "ts": now,
                    "tool": tool_name,
                    "stage": stage,
                    "html_sha256": _file_sha256(html) if html.exists() else "",
                }
                rev_path = _review_receipts_path(root, piece)
                with rev_path.open("a", encoding="utf-8") as fh:
                    fh.write(json.dumps(rec) + "\n")
        return

    # 2. PNG inspection receipt
    if low in ("read_file", "read", "view_file", "view_image"):
        for raw_key in ("Path", "file_path", "path"):
            val = args.get(raw_key)
            if not isinstance(val, str) or not val.lower().endswith(".png"):
                continue
            rel = _rel_path(root, val)
            m = re.match(r"proj/([^/]+)/(.+\.png)$", rel, re.I)
            if not m:
                continue
            piece = m.group(1)
            abs_png = root / rel
            if not abs_png.exists():
                continue
            ipath = _inspected_pngs_path(root, piece)
            data = _load_json(ipath, {})
            data[rel] = max(now, abs_png.stat().st_mtime)
            if not rel.startswith(f"proj/{piece}/stills/"):
                html = root / "players" / f"{piece}.html"
                sha = _file_sha256(html)
                if sha:
                    by_sha = data.setdefault("_sha256_pngs", {})
                    lst = by_sha.setdefault(sha, [])
                    if rel not in lst:
                        lst.append(rel)
            ipath.parent.mkdir(parents=True, exist_ok=True)
            ipath.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
        return

    # 3. Audio / render / player QA command receipt
    if low in ("run_command", "bash", "shell", "command"):
        cmd = str(args.get("CommandLine") or args.get("command") or "")
        if any(k in cmd for k in ("ebur128", "render_piece.py", "regress", "html_to_mp4.py", "gen_export.py", "playwright")):
            for brief in glob.glob(str(root / "proj" / "*" / "brief.md")):
                piece = Path(brief).parent.name
                html = root / "players" / f"{piece}.html"
                qpath = _qa_checked_path(root, piece)
                if html.exists() and (not qpath.exists() or _piece_has_local_changes(root, piece)):
                    qpath.write_text(
                        json.dumps({"ts": now, "sha256": _file_sha256(html), "cmd": cmd[:200]}) + "\n",
                        encoding="utf-8",
                    )


def _check_pre_subagent(root: Path, harness: str, tool_name: str, args: dict) -> str | None:
    low = tool_name.lower()
    if low not in ("agent", "task", "spawn_agent", "invoke_subagent"):
        return None

    if harness in ("claude", "codex"):
        model = str(args.get("model") or args.get("Model") or "").lower()
        effort = str(args.get("reasoning_effort") or args.get("effort") or "").lower()
        if "fable" in model or "turbo" in model:
            return "Budget gate: 'fable' and 'turbo' models are prohibited for subagents at any budget tier."
        if effort in ("max", "xhigh", "extra", "turbo"):
            return "Budget gate: subagent reasoning effort above 'high' is prohibited."

    targets = _extract_piece_from_subagent(root, args)
    piece = targets[0] if targets else _newest_active_piece(root)
    if not piece:
        return None

    _, _, budget, override = _parse_brief_meta(root, piece)
    if budget != "light" or override:
        return None

    rpath = _subagent_receipts_path(root, piece)
    prior = len([ln for ln in _read_text(rpath).splitlines() if ln.strip()])
    if prior >= 3:
        return (
            f"Light budget gate: {piece} already ran {prior} subagent(s). "
            f"Ask the user before exceeding the 3-subagent light budget (Budget-Override: approved)."
        )
    return None


def _has_review_receipt(root: Path, piece: str, html_sha: str = "", min_ts: float = 0.0) -> bool:
    rpath = _review_receipts_path(root, piece)
    for ln in _read_text(rpath).splitlines():
        ln = ln.strip()
        if not ln:
            continue
        try:
            rec = json.loads(ln)
        except ValueError:
            continue
        if html_sha:
            if rec.get("html_sha256") == html_sha or float(rec.get("ts", 0.0)) >= min_ts:
                return True
        else:
            return True
    return False


def _check_pre_write(root: Path, rel_path: str) -> str | None:
    m_sb = re.match(r"^proj/([^/]+)/(storyboard\.md|stills/[^/]+\.(?:html|svg))$", rel_path)
    if m_sb:
        piece = m_sb.group(1)
        stage, _, _, _ = _parse_brief_meta(root, piece)
        brief_txt = _read_text(root / "proj" / piece / "brief.md")
        if stage == "interview" or not re.search(r"\bAPPROVED\b", brief_txt):
            return (
                f"Stage gate: proj/{piece}/brief.md must be marked APPROVED (and past Stage: interview) "
                f"before creating {rel_path}."
            )
        return None

    m_player = re.match(r"^(?:players|dist)/([^/]+)\.html$", rel_path)
    if m_player:
        piece = m_player.group(1)
        brief = root / "proj" / piece / "brief.md"
        if not brief.exists():
            return None
        stage, mode, _, _ = _parse_brief_meta(root, piece)
        brief_txt = _read_text(brief)
        if stage == "interview" or not re.search(r"\bAPPROVED\b", brief_txt):
            return f"Stage gate: proj/{piece}/brief.md must be marked APPROVED before building {rel_path}."
        if "efficient" not in mode:
            sb = root / "proj" / piece / "storyboard.md"
            if not re.search(r"\bAPPROVED\b", _read_text(sb)):
                return (
                    f"Stage gate: proj/{piece}/storyboard.md must be marked APPROVED before building {rel_path} "
                    f"in full creative mode."
                )
            stills_dir = root / "proj" / piece / "stills"
            png_stills = list(stills_dir.glob("*.png")) if stills_dir.is_dir() else []
            inspected = _load_json(_inspected_pngs_path(root, piece), {})
            inspected_stills = [k for k in inspected if k.startswith(f"proj/{piece}/stills/") and (root / k).exists()]
            if not png_stills or not inspected_stills:
                return (
                    f"Visual gate: render and inspect at least 1 still PNG in proj/{piece}/stills/ via "
                    f"read_file/Read/view_image before building {rel_path}."
                )
            review_md = stills_dir / "review.md"
            if not _has_review_receipt(root, piece) or len(_read_text(review_md).strip()) < 80:
                return (
                    f"Fresh-eyes gate: run an isolated fresh-eyes reviewer subagent on proj/{piece}/stills/ "
                    f"writing proj/{piece}/stills/review.md before building {rel_path}."
                )
        return None

    return None


def _check_stop(root: Path, stop_active: bool) -> str | None:
    if stop_active:
        return None
    for brief_str in glob.glob(str(root / "proj" / "*" / "brief.md")):
        piece = Path(brief_str).parent.name
        stage, _, _, _ = _parse_brief_meta(root, piece)
        if stage in ("done", "published"):
            continue
        html = root / "players" / f"{piece}.html"
        if not html.exists() or not _player_html_has_local_changes(root, piece):
            continue
        html_mtime = html.stat().st_mtime
        html_sha = _file_sha256(html)

        qa_rec = _load_json(_qa_checked_path(root, piece), {})
        qa_ok = bool(qa_rec) and (
            (html_sha and qa_rec.get("sha256") == html_sha) or float(qa_rec.get("ts", 0.0)) >= html_mtime
        )
        if not qa_ok:
            return (
                f"Run audio/render QA (`ebur128`, `render_piece.py`, `regress.py`, or `html_to_mp4.py`) "
                f"after the final edit to players/{piece}.html before finishing."
            )

        inspected = _load_json(_inspected_pngs_path(root, piece), {})
        mtime_pngs = [
            k for k, ts in inspected.items()
            if not k.startswith("_")
            and not k.startswith(f"proj/{piece}/stills/")
            and isinstance(ts, (int, float))
            and (root / k).exists()
            and float(ts) >= html_mtime
        ]
        sha_pngs = [
            k for k in (inspected.get("_sha256_pngs") or {}).get(html_sha, [])
            if (root / k).exists()
        ] if html_sha else []
        if len(set(mtime_pngs) | set(sha_pngs)) < 2:
            return (
                f"Capture and inspect >=2 QA frame PNGs of players/{piece}.html "
                f"(under proj/{piece}/qa/) via read_file/Read/view_image before finishing."
            )

        qa_review = root / "proj" / piece / "qa" / "review.md"
        if not _has_review_receipt(root, piece, html_sha=html_sha, min_ts=html_mtime) or len(_read_text(qa_review).strip()) < 80:
            return (
                f"Run an isolated fresh-eyes reviewer subagent on proj/{piece}/qa/ writing proj/{piece}/qa/review.md "
                f"for the current players/{piece}.html before finishing."
            )
    return None


def _emit(harness: str, event: str, reason: str | None) -> int:
    if event == "PostToolUse":
        print("{}")
        return 0
    if not reason:
        if harness == "antigravity":
            print(json.dumps({"decision": "allow"} if event == "PreToolUse" else {}))
        return 0
    if harness == "antigravity":
        if event == "PreToolUse":
            print(json.dumps({"decision": "deny", "reason": reason}))
        else:
            print(json.dumps({"decision": "continue", "reason": reason}))
        return 0
    print(reason, file=sys.stderr)
    return 2


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--harness", choices=("antigravity", "claude", "codex"), required=True)
    ap.add_argument("--event", choices=("PreToolUse", "PostToolUse", "Stop"), required=True)
    opts = ap.parse_args(argv)

    try:
        raw = sys.stdin.read()
        payload = json.loads(raw) if raw.strip() else {}
    except ValueError:
        payload = {}

    info = _normalize_input(opts.harness, opts.event, payload)
    root = info["root"]

    if opts.event == "PostToolUse":
        _record_post_tool(root, info["tool"], info["args"], info["error"])
        return _emit(opts.harness, opts.event, None)

    if opts.event == "PreToolUse":
        sub_reason = _check_pre_subagent(root, opts.harness, info["tool"], info["args"])
        if sub_reason:
            return _emit(opts.harness, opts.event, sub_reason)
        for rel in _extract_target_paths(root, info["tool"], info["args"]):
            reason = _check_pre_write(root, rel)
            if reason:
                return _emit(opts.harness, opts.event, reason)
        return _emit(opts.harness, opts.event, None)

    if opts.event == "Stop":
        reason = _check_stop(root, info["stop_active"])
        return _emit(opts.harness, opts.event, reason)

    return 0


if __name__ == "__main__":
    sys.exit(main())
