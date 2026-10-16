#!/usr/bin/env python3
"""Run deterministic structural checks for an ACTS workflow template or assembly."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


SCRIPT_ROOT = Path(__file__).resolve().parents[1]

COMMON_FILES = (
    "AGENTS.md",
    "CONTEXT.md",
    "README.md",
    "_config/workflow.md",
    "_config/conventions.md",
    "_config/stage-registry.md",
    "_config/review-policy.md",
    "_config/quality-policy.md",
    "_config/run-manifest-template.md",
    "_config/run-input-template.md",
    "_config/run-state-template.md",
    "setup/CONTEXT.md",
    "setup/questionnaire.md",
    "setup/validation-checklist.md",
)

SETUP_OPERATIONS = (
    "define",
    "build-stage",
    "build-router",
    "build-agent",
    "add-quality",
    "validate",
)

TEMPLATE_FILES = (
    "_templates/stage/CONTEXT.md",
    "_templates/stage/references/README.md",
    "_templates/stage/references/input-schema.md",
    "_templates/measure/CONTEXT.md",
    "_templates/measure/references/acceptance-criteria.md",
    "_templates/measure/references/quality-rubric.md",
    "_templates/learn/CONTEXT.md",
    "_templates/learn/references/what-now-template.md",
    "setup/initialization-record-template.md",
    "references/README.md",
    "references/specialized-conventions.md",
)

CONFIGURATION_MARKERS = (
    "[Name]",
    "[Owner or team]",
    "[What this workflow helps produce or control]",
    "[Type]",
    "[Tool]",
    "[Constraint]",
    "[assigned during",
    "[Manifest-only / Stage record required]",
    "{{MEASURE_STAGE}}",
    "{{LEARN_STAGE}}",
    "{{FINAL_PRODUCTION_STAGE}}",
)


class Validator:
    def __init__(self, root: Path, configured: bool) -> None:
        self.root = root
        self.configured = configured
        self.errors: list[str] = []
        self.notes: list[str] = []

    def error(self, message: str) -> None:
        self.errors.append(message)

    def note(self, message: str) -> None:
        self.notes.append(message)

    def relative(self, path: Path) -> str:
        return path.relative_to(self.root).as_posix()

    def require_file(self, relative: str) -> Path | None:
        path = self.root / relative
        if not path.is_file():
            self.error(f"missing required file: {relative}")
            return None
        return path

    def read(self, path: Path) -> str:
        try:
            return path.read_text(encoding="utf-8")
        except OSError as exc:
            self.error(f"cannot read {self.relative(path)}: {exc}")
            return ""

    def check_common_files(self) -> None:
        for relative in COMMON_FILES:
            self.require_file(relative)

        for operation in SETUP_OPERATIONS:
            self.require_file(f"setup/{operation}/CONTEXT.md")

        if self.configured:
            self.require_file("setup/initialization-record.md")

    def check_template_layout(self) -> None:
        for relative in TEMPLATE_FILES:
            self.require_file(relative)

        shared = self.root / "shared"
        if shared.exists() and any(child.is_file() for child in shared.rglob("*")):
            self.error("obsolete Layer 3 directory exists: shared/")

        stages = self.root / "stages"
        if not stages.is_dir():
            self.error("missing stages/ directory")
            return

        stage_entries = [
            entry
            for entry in stages.iterdir()
            if entry.name != ".gitkeep"
            and (entry.is_file() or any(child.is_file() for child in entry.rglob("*")))
        ]
        if stage_entries:
            names = ", ".join(self.relative(entry) for entry in stage_entries)
            self.error(f"template contains configured stage entries: {names}")

        self.check_contract(self.root / "_templates/stage/CONTEXT.md", template=True)
        self.check_contract(self.root / "_templates/measure/CONTEXT.md", template=True)
        self.check_contract(self.root / "_templates/learn/CONTEXT.md", template=True)

        stale_paths = ("stages/02-measure", "stages/03-learn", "stages/_TEMPLATE")
        for path in self.root.rglob("*.md"):
            text = self.read(path)
            for stale_path in stale_paths:
                if stale_path in text:
                    self.error(f"stale stage path {stale_path} in {self.relative(path)}")

    def parse_registry(self) -> list[dict[str, str]]:
        path = self.root / "_config/stage-registry.md"
        if not path.is_file():
            return []

        rows: list[dict[str, str]] = []
        in_stage_table = False
        for line in self.read(path).splitlines():
            if line.strip() == "## Stage Order":
                in_stage_table = True
                continue
            if in_stage_table and line.startswith("## "):
                break
            if not in_stage_table or not line.strip().startswith("|"):
                continue

            cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
            if len(cells) < 5 or cells[0] == "Order" or set(cells[0]) <= {"-", ":"}:
                continue

            rows.append(
                {
                    "order": cells[0],
                    "role": cells[1],
                    "path": cells[2].strip("`").rstrip("/"),
                    "required": cells[3],
                    "handoff": cells[4],
                }
            )
        return rows

    def check_registry(self) -> list[dict[str, str]]:
        rows = self.parse_registry()
        if not rows:
            self.error("stage registry has no Stage Order rows")
            return []

        roles = [row["role"].lower() for row in rows]
        if "measure" not in roles:
            self.error("stage registry has no Measure role")
        if "learn" not in roles:
            self.error("stage registry has no Learn role")

        if not self.configured:
            self.note("template stage registry intentionally leaves production and quality paths unresolved")
            return rows

        production_rows = [row for row in rows if row["role"].lower() == "production"]
        measure_rows = [row for row in rows if row["role"].lower() == "measure"]
        learn_rows = [row for row in rows if row["role"].lower() == "learn"]
        if not production_rows:
            self.error("configured stage registry has no production stage")
        if len(measure_rows) != 1:
            self.error("configured stage registry must have exactly one Measure role")
        if len(learn_rows) != 1:
            self.error("configured stage registry must have exactly one Learn role")

        ordered: list[tuple[int, dict[str, str]]] = []
        paths: set[str] = set()
        for row in rows:
            try:
                order = int(row["order"])
            except ValueError:
                self.error(f"stage registry order is not numeric: {row['order']}")
                continue

            stage_path = row["path"]
            if not stage_path.startswith("stages/") or "[" in stage_path or "{{" in stage_path:
                self.error(f"stage registry path is unresolved or outside stages/: {stage_path}")
                continue
            if stage_path in paths:
                self.error(f"duplicate stage registry path: {stage_path}")
            paths.add(stage_path)

            stage_dir = self.root / stage_path
            if not stage_dir.is_dir():
                self.error(f"stage registry path does not exist: {stage_path}")
            elif not (stage_dir / "CONTEXT.md").is_file():
                self.error(f"stage is missing CONTEXT.md: {stage_path}")

            if not re.fullmatch(r"\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*", stage_dir.name):
                self.error(f"sequential stage path is not zero-padded and lowercase: {stage_path}")
            ordered.append((order, row))

        ordered.sort(key=lambda item: item[0])
        if [order for order, _ in ordered] != list(range(1, len(ordered) + 1)):
            self.error("stage registry order must be contiguous starting at 1")

        ordered_roles = [row["role"].lower() for _, row in ordered]
        if len(ordered_roles) < 3 or ordered_roles[-2:] != ["measure", "learn"]:
            self.error("Measure and Learn must be the final two stage roles")

        return rows

    def check_contract(self, path: Path, template: bool = False) -> None:
        if not path.is_file():
            return
        text = self.read(path)
        label = self.relative(path)
        for heading in ("## Interface Contract", "## Inputs", "## Input Gate", "## Outputs", "## Verify"):
            if heading not in text:
                self.error(f"{label} is missing {heading}")
        if "| Inputs |" not in text or "| Transform |" not in text or "| Outputs |" not in text:
            self.error(f"{label} is missing an explicit Inputs/Transform/Outputs table")
        if not template:
            match = re.search(r"\| Configured mode \|\s*([^|]+)\|", text)
            mode = match.group(1).strip().strip("`") if match else ""
            if mode not in {"Manifest-only", "Stage record required"}:
                self.error(f"{label} does not select a valid input resolution mode")

    def check_configured_stages(self, rows: list[dict[str, str]]) -> None:
        stage_rows = [row for row in rows if row["role"].lower() in {"production", "measure", "learn"}]
        for row in stage_rows:
            path = self.root / row["path"]
            contract = path / "CONTEXT.md"
            if contract.is_file():
                self.check_contract(contract)

        production_rows = [row for row in rows if row["role"].lower() == "production"]
        measure_rows = [row for row in rows if row["role"].lower() == "measure"]
        learn_rows = [row for row in rows if row["role"].lower() == "learn"]
        if production_rows:
            final_production = self.root / production_rows[-1]["path"] / "CONTEXT.md"
            if final_production.is_file() and "build-handoff.md" not in self.read(final_production):
                self.error(f"final production stage does not declare build-handoff.md: {self.relative(final_production)}")

        if measure_rows:
            measure = self.root / measure_rows[0]["path"] / "CONTEXT.md"
            if measure.is_file():
                text = self.read(measure)
                for token in ("audit-findings.md", "quality-policy.md", "Passed"):
                    if token not in text:
                        self.error(f"Measure contract is missing {token}: {self.relative(measure)}")
                expected_audit = f"{{{{RUN_PATH}}}}/{measure_rows[0]['path']}/audit-findings.md"
                if expected_audit not in text:
                    self.error(f"Measure audit path does not match the stage registry: {self.relative(measure)}")
                if production_rows:
                    expected_build = f"{{{{RUN_PATH}}}}/{production_rows[-1]['path']}/build-handoff.md"
                    if expected_build not in text:
                        self.error(f"Measure input path does not match the final production stage: {self.relative(measure)}")

        if learn_rows:
            learn = self.root / learn_rows[0]["path"] / "CONTEXT.md"
            if learn.is_file():
                text = self.read(learn)
                for token in ("what-now.md", "Passed"):
                    if token not in text:
                        self.error(f"Learn contract is missing {token}: {self.relative(learn)}")
                expected_handoff = f"{{{{RUN_PATH}}}}/{learn_rows[0]['path']}/what-now.md"
                if expected_handoff not in text:
                    self.error(f"Learn handoff path does not match the stage registry: {self.relative(learn)}")
                if measure_rows:
                    expected_audit = f"{{{{RUN_PATH}}}}/{measure_rows[0]['path']}/audit-findings.md"
                    if expected_audit not in text:
                        self.error(f"Learn audit input path does not match the Measure registry path: {self.relative(learn)}")
                if production_rows:
                    expected_build = f"{{{{RUN_PATH}}}}/{production_rows[-1]['path']}/build-handoff.md"
                    if expected_build not in text:
                        self.error(f"Learn input path does not match the final production stage: {self.relative(learn)}")

    def check_configured_placeholders(self) -> None:
        paths = [
            self.root / "AGENTS.md",
            self.root / "CONTEXT.md",
            self.root / "_config/workflow.md",
            self.root / "_config/stage-registry.md",
            self.root / "setup/initialization-record.md",
        ]
        paths.extend(path for path in (self.root / "stages").glob("*/CONTEXT.md"))
        for path in paths:
            if not path.is_file():
                continue
            text = self.read(path)
            for marker in CONFIGURATION_MARKERS:
                if marker in text:
                    self.error(f"unresolved setup marker {marker} in {self.relative(path)}")
            for match in re.finditer(r"\{\{(?!RUN_PATH\}\})[A-Za-z][A-Za-z0-9_]*\}\}", text):
                self.error(f"unresolved variable {match.group(0)} in {self.relative(path)}")

    def check_router(self) -> None:
        path = self.root / "CONTEXT.md"
        if not path.is_file():
            return
        text = self.read(path)
        if "_config/stage-registry.md" not in text:
            self.error("CONTEXT.md does not route through _config/stage-registry.md")
        if "Measure" not in text or "Learn" not in text:
            self.error("CONTEXT.md does not expose Measure and Learn roles")

    def run(self) -> int:
        self.check_common_files()
        self.check_router()
        if self.configured:
            rows = self.check_registry()
            self.check_configured_stages(rows)
            self.check_configured_placeholders()
        else:
            self.check_template_layout()
            self.check_registry()

        if self.errors:
            print("Structure: FAIL")
            for error in self.errors:
                print(f"- {error}")
            return 1

        print("Structure: PASS")
        for note in self.notes:
            print(f"- {note}")
        return 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--workflow",
        type=Path,
        help="configured workflow path; omit this option to validate the canonical template",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.workflow is None:
        root = SCRIPT_ROOT
        configured = False
    else:
        root = args.workflow.expanduser().resolve()
        configured = True

    if not root.is_dir():
        print(f"Structure: FAIL\n- workflow path is not a directory: {root}")
        return 1

    return Validator(root, configured).run()


if __name__ == "__main__":
    sys.exit(main())
