"""End-to-end unit tests for EOMD .agents/hooks/stage_gate.py across Antigravity, Claude Code, and Codex CLI."""
import json
import os
import re
import subprocess
import sys
import tempfile
import time
import tomllib
import unittest
from pathlib import Path

GATE = Path(__file__).resolve().parent / "stage_gate.py"
REPO_ROOT = Path(__file__).resolve().parents[2]


def _run_gate(harness: str, event: str, payload: dict) -> tuple[int, str, str]:
    p = subprocess.run(
        [sys.executable, str(GATE), "--harness", harness, "--event", event],
        input=json.dumps(payload),
        text=True,
        capture_output=True,
    )
    return p.returncode, p.stdout.strip(), p.stderr.strip()


class EomdStageGateTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        (self.root / "proj" / "demo" / "stills").mkdir(parents=True)
        (self.root / "proj" / "demo" / "qa").mkdir(parents=True)
        (self.root / "players").mkdir(parents=True)
        (self.root / "proj" / "demo" / "brief.md").write_text(
            "# Brief: Demo\n\nStatus: DRAFT · Stage: interview · Mode: full creative · Budget: standard\n",
            encoding="utf-8",
        )

    def tearDown(self):
        self.tmp.cleanup()

    def test_full_creative_and_fresh_eyes_pipeline(self):
        # 1. Storyboard blocked during interview
        rc, out, _ = _run_gate("antigravity", "PreToolUse", {
            "cwd": str(self.root),
            "toolCall": {"name": "write_file", "args": {"Path": "proj/demo/storyboard.md"}},
        })
        self.assertEqual(json.loads(out)["decision"], "deny")

        # 2. Approve brief -> storyboard allowed; players/demo.html still blocked
        (self.root / "proj" / "demo" / "brief.md").write_text(
            "# Brief: Demo\n\nStatus: APPROVED today · Stage: storyboard · Mode: full creative · Budget: standard\n",
            encoding="utf-8",
        )
        rc, out, _ = _run_gate("antigravity", "PreToolUse", {
            "cwd": str(self.root),
            "toolCall": {"name": "write_file", "args": {"Path": "proj/demo/storyboard.md"}},
        })
        self.assertEqual(json.loads(out)["decision"], "allow")
        rc, out, _ = _run_gate("antigravity", "PreToolUse", {
            "cwd": str(self.root),
            "toolCall": {"name": "write_file", "args": {"Path": "players/demo.html"}},
        })
        self.assertEqual(json.loads(out)["decision"], "deny")

        # 3. Approve storyboard + inspect still PNG + fresh-eyes reviewer receipt -> players/demo.html allowed
        (self.root / "proj" / "demo" / "storyboard.md").write_text("Stage: storyboard · APPROVED\n", encoding="utf-8")
        (self.root / "proj" / "demo" / "stills" / "s1.png").write_bytes(b"PNG")
        _run_gate("antigravity", "PostToolUse", {
            "cwd": str(self.root),
            "toolCall": {"name": "read_file", "args": {"Path": "proj/demo/stills/s1.png"}},
        })
        # Still blocked without fresh-eyes review receipt + stills/review.md
        rc, out, _ = _run_gate("antigravity", "PreToolUse", {
            "cwd": str(self.root),
            "toolCall": {"name": "write_file", "args": {"Path": "players/demo.html"}},
        })
        self.assertEqual(json.loads(out)["decision"], "deny")
        self.assertIn("Fresh-eyes", json.loads(out)["reason"])

        _run_gate("antigravity", "PostToolUse", {
            "cwd": str(self.root),
            "toolCall": {
                "name": "invoke_subagent",
                "args": {"Role": "Fresh-eyes Reviewer", "Prompt": "Review proj/demo/stills/ per CRAFT.md"},
            },
        })
        (self.root / "proj" / "demo" / "stills" / "review.md").write_text("Checked: " + "ok " * 35, encoding="utf-8")
        rc, out, _ = _run_gate("antigravity", "PreToolUse", {
            "cwd": str(self.root),
            "toolCall": {"name": "write_file", "args": {"Path": "players/demo.html"}},
        })
        self.assertEqual(json.loads(out)["decision"], "allow")

        # 4. Stop blocked once players/demo.html exists until QA command + >=2 QA PNGs + fresh-eyes qa/review.md
        html = self.root / "players" / "demo.html"
        html.write_text("<html>player</html>", encoding="utf-8")
        rc, out, _ = _run_gate("antigravity", "Stop", {
            "cwd": str(self.root), "terminationReason": "NO_TOOL_CALL", "continuationActive": False,
        })
        self.assertEqual(json.loads(out)["decision"], "continue")

        time.sleep(0.01)
        _run_gate("antigravity", "PostToolUse", {
            "cwd": str(self.root),
            "toolCall": {"name": "run_command", "args": {"CommandLine": "ffmpeg -i out.wav -af ebur128=peak=true -f null -"}},
        })
        for shot in ("frame1.png", "frame2.png"):
            (self.root / "proj" / "demo" / "qa" / shot).write_bytes(b"PNG")
            _run_gate("antigravity", "PostToolUse", {
                "cwd": str(self.root),
                "toolCall": {"name": "read_file", "args": {"Path": f"proj/demo/qa/{shot}"}},
            })
        # Still blocked without fresh-eyes QA review for current HTML
        rc, out, _ = _run_gate("antigravity", "Stop", {
            "cwd": str(self.root), "terminationReason": "NO_TOOL_CALL", "continuationActive": False,
        })
        self.assertEqual(json.loads(out)["decision"], "continue")
        self.assertIn("qa/review.md", json.loads(out)["reason"])

        _run_gate("antigravity", "PostToolUse", {
            "cwd": str(self.root),
            "toolCall": {
                "name": "invoke_subagent",
                "args": {"Role": "Fresh-eyes QA Reviewer", "Prompt": "Review proj/demo/qa/"},
            },
        })
        (self.root / "proj" / "demo" / "qa" / "review.md").write_text("QA verified: " + "ok " * 35, encoding="utf-8")
        rc, out, _ = _run_gate("antigravity", "Stop", {
            "cwd": str(self.root), "terminationReason": "NO_TOOL_CALL", "continuationActive": False,
        })
        self.assertEqual(json.loads(out), {})

    def test_claude_codex_budget_caps_and_manifests(self):
        # 1. Prohibited model/effort blocked on Claude Code & Codex
        rc, _, err = _run_gate("claude", "PreToolUse", {
            "cwd": str(self.root),
            "tool_name": "Agent",
            "tool_input": {"model": "fable-1", "prompt": "Review"},
        })
        self.assertEqual(rc, 2)
        self.assertIn("fable", err.lower())

        rc, _, err = _run_gate("codex", "PreToolUse", {
            "cwd": str(self.root),
            "tool_name": "spawn_agent",
            "tool_input": {"reasoning_effort": "xhigh", "prompt": "Review"},
        })
        self.assertEqual(rc, 2)

        # 2. Declared hook manifests execute cleanly
        ag = json.loads((REPO_ROOT / ".agents" / "hooks.json").read_text(encoding="utf-8"))
        cl = json.loads((REPO_ROOT / ".claude" / "settings.json").read_text(encoding="utf-8"))
        cx = json.loads((REPO_ROOT / ".codex" / "hooks.json").read_text(encoding="utf-8"))
        cx_cfg = tomllib.loads((REPO_ROOT / ".codex" / "config.toml").read_text(encoding="utf-8"))
        self.assertTrue(cx_cfg.get("features", {}).get("hooks"))
        self.assertIn("eomd-stage-gate", ag)
        self.assertIn("hooks", cl)
        self.assertIn("hooks", cx)

        # 3. Skills have valid YAML frontmatter and house.md preserves grammar
        for sf in list((REPO_ROOT / ".agents" / "skills").glob("*/SKILL.md")) + list(
            (REPO_ROOT / ".claude" / "skills").glob("*/SKILL.md")
        ):
            txt = sf.read_text(encoding="utf-8")
            m = re.match(r"^---\s*\n(.*?)\n---\s*\n", txt, re.S)
            self.assertIsNotNone(m, f"Missing YAML frontmatter in {sf}")
            self.assertRegex(m.group(1), re.compile(r"^name:\s*\S+", re.M))
            self.assertRegex(m.group(1), re.compile(r"^description:\s*\S+", re.M))

        house = (REPO_ROOT / "brief" / "taste" / "house.md").read_text(encoding="utf-8")
        for ln in [ln for ln in house.splitlines() if re.match(r"^T\d+\b", ln)]:
            self.assertRegex(ln, r"^T\d+ · (strong|soft) · ")


if __name__ == "__main__":
    unittest.main()
