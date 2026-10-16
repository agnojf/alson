"""Tests for the ACTS structural validator."""

from __future__ import annotations

import re
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


TEMPLATE_ROOT = Path(__file__).resolve().parents[1]
VALIDATOR = TEMPLATE_ROOT / "scripts/validate.py"


def replace_text(path: Path, replacements: dict[str, str]) -> None:
    text = path.read_text(encoding="utf-8")
    for old, new in replacements.items():
        text = text.replace(old, new)
    path.write_text(text, encoding="utf-8")


def configured_context(source: Path, destination: Path, replacements: dict[str, str]) -> None:
    text = source.read_text(encoding="utf-8")
    text = re.sub(r"\[[^\]\n]+\]", "Configured", text)
    for old, new in replacements.items():
        text = text.replace(old, new)
    text = text.replace("| Configured mode | Configured |", "| Configured mode | Manifest-only |")
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(text, encoding="utf-8")


def make_configured_workflow(root: Path) -> None:
    shutil.copytree(TEMPLATE_ROOT, root, ignore=shutil.ignore_patterns("__pycache__"))
    registry = root / "_config/stage-registry.md"
    replace_text(
        registry,
        {
            "| 1..n | Production | [assigned during Build Stage] | Yes | Declared production output |": "| 1 | Production | `stages/01-build` | Yes | Final production handoff |",
            "| n+1 | Measure | [assigned during Add Quality] | Yes | `audit-findings.md` and quality decision |": "| 2 | Measure | `stages/02-measure` | Yes | `audit-findings.md` and quality decision |",
            "| n+2 | Learn | [assigned during Add Quality] | Yes | `what-now.md` and next action |": "| 3 | Learn | `stages/03-learn` | Yes | `what-now.md` and next action |",
        },
    )

    replace_text(
        root / "_config/workflow.md",
        {
            "[Name]": "Report Builder",
            "[Owner or team]": "Operations",
            "[What this workflow helps produce or control]": "A report",
            "[Type]": "Report",
            "[Tool]": "Markdown",
            "[Purpose]": "Create the report",
            "[Constraint]": "Use verified sources",
        },
    )

    initialization = root / "setup/initialization-record.md"
    shutil.copyfile(root / "setup/initialization-record-template.md", initialization)
    replace_text(
        initialization,
        {
            "[confirmed destination]": str(root),
            "[confirmed name]": "Report Builder",
            "[repeated outcome]": "A report",
            "[confirmed owner or team]": "Operations",
            "[confirmed run output root]": str(root / "outputs"),
        },
    )

    stage_paths = {
        "production": root / "stages/01-build",
        "measure": root / "stages/02-measure",
        "learn": root / "stages/03-learn",
    }
    for role, stage_path in stage_paths.items():
        stage_path.mkdir(parents=True, exist_ok=True)

    configured_context(
        root / "_templates/stage/CONTEXT.md",
        stage_paths["production"] / "CONTEXT.md",
        {
            "<stage>": "01-build",
            "<measure-stage>": "02-measure",
            "<prior-stage>": "01-build",
            "{{MEASURE_STAGE}}": "02-measure",
        },
    )
    with (stage_paths["production"] / "CONTEXT.md").open("a", encoding="utf-8") as stream:
        stream.write("\nDeclared handoff: `{{RUN_PATH}}/stages/01-build/build-handoff.md`.\n")
    (stage_paths["production"] / "references").mkdir(exist_ok=True)
    shutil.copyfile(
        root / "_templates/stage/references/input-schema.md",
        stage_paths["production"] / "references/input-schema.md",
    )

    for role in ("measure", "learn"):
        template_path = root / f"_templates/{role}/CONTEXT.md"
        context_path = stage_paths[role] / "CONTEXT.md"
        configured_context(
            template_path,
            context_path,
            {
                "{{MEASURE_STAGE}}": "02-measure",
                "{{LEARN_STAGE}}": "03-learn",
                "{{FINAL_PRODUCTION_STAGE}}": "01-build",
            },
        )
        shutil.copytree(
            root / f"_templates/{role}/references",
            stage_paths[role] / "references",
            dirs_exist_ok=True,
        )


class ValidatorTests(unittest.TestCase):
    def run_validator(self, *args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(VALIDATOR), *args],
            check=False,
            capture_output=True,
            text=True,
        )

    def test_template_passes(self) -> None:
        result = self.run_validator()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("Structure: PASS", result.stdout)

    def test_configured_workflow_passes(self) -> None:
        with tempfile.TemporaryDirectory(prefix="acts-configured-") as directory:
            root = Path(directory) / "report-builder"
            make_configured_workflow(root)
            result = self.run_validator("--workflow", str(root))
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            self.assertIn("Structure: PASS", result.stdout)

    def test_missing_registry_stage_fails(self) -> None:
        with tempfile.TemporaryDirectory(prefix="acts-missing-stage-") as directory:
            root = Path(directory) / "report-builder"
            make_configured_workflow(root)
            registry = root / "_config/stage-registry.md"
            replace_text(registry, {"`stages/01-build`": "`stages/01-missing`"})
            result = self.run_validator("--workflow", str(root))
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("stage registry path does not exist", result.stdout)

    def test_quality_output_path_must_match_registry(self) -> None:
        with tempfile.TemporaryDirectory(prefix="acts-quality-path-") as directory:
            root = Path(directory) / "report-builder"
            make_configured_workflow(root)
            measure = root / "stages/02-measure/CONTEXT.md"
            replace_text(
                measure,
                {
                    "{{RUN_PATH}}/stages/02-measure/audit-findings.md": "{{RUN_PATH}}/stages/01-build/audit-findings.md"
                },
            )
            result = self.run_validator("--workflow", str(root))
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("Measure audit path does not match the stage registry", result.stdout)

    def test_unresolved_stage_variable_fails(self) -> None:
        with tempfile.TemporaryDirectory(prefix="acts-unresolved-variable-") as directory:
            root = Path(directory) / "report-builder"
            make_configured_workflow(root)
            production = root / "stages/01-build/CONTEXT.md"
            with production.open("a", encoding="utf-8") as stream:
                stream.write("\nUnresolved route: `{{CUSTOM_STAGE}}`.\n")
            result = self.run_validator("--workflow", str(root))
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("unresolved variable {{CUSTOM_STAGE}}", result.stdout)


if __name__ == "__main__":
    unittest.main()
