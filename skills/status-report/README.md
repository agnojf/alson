# Alson Status Report

Turns project evidence into an audited project status report through a disciplined Build-Measure-Learn pipeline.

When you need a scan-fast, evidence-driven view of a project's current health, this skill produces a Markdown report that leads with the overall RAG and key metrics, then covers decisions, health per dimension, progress, milestones, finance, exceptions, actions, and evidence notes.

## Installation

### OpenCode

Add to your `opencode.json`:

```json
{
  "skills": {
    "paths": ["./status-report"]
  }
}
```

### Agent tools with .agents/skills/ support

```bash
cp -r status-report ~/.agents/skills/
```

### Manual

Place the `status-report/` folder in any skill search path your agent tool supports.

## Usage

Trigger the skill by saying one of these keywords:

- "status report"
- "produce a status report"
- "build a status report"
- "project status report"

Then name the project and supply available source material: registers, schedules, notes, financial records, or pasted text. The skill runs three stages:

1. **Build** -- Guided intake. Asks one question at a time. Produces the status report and internal audit handoff.
2. **Measure** -- Checks the report against acceptance criteria. Scores quality on a 10-dimension rubric (95% threshold). Failed criteria return to Build for targeted revision.
3. **Learn** -- Assesses the outcome, presents draft next actions for human review, then produces a prioritized next-action handoff.

The skill asks where to save pipeline files before starting. Outputs are organized in a run folder.

### Project Source

The report is built from a project's evidence. If the request does not name a project, the skill asks for the project source before proceeding. A demo evidence pack is included for first-run validation but is used only when the user explicitly selects it.

### Repeat Runs

If a run folder already has a prior `what-now.md`, the skill loads it as input before starting. Use this when continuing work on the same report after receiving feedback or additional evidence.

### Status

Say `status` during or after a run to see which stages have completed and where their output files are.

## Output Files

| File | Contents |
|---|---|
| `run-manifest.md` | Run metadata |
| `stages/01-build/<project-slug>-status-report.md` | Evidence-driven status report |
| `stages/01-build/build-handoff.md` | Internal handoff for audit |
| `stages/02-measure/audit-findings.md` | Pass/fail per criterion, quality score, gaps |
| `stages/03-learn/what-now.md` | Next-action handoff with human-approved decisions |

## Validation

Run the scenarios in `references/test-scenarios.md` to verify the skill works correctly. For each scenario, confirm the report leads with the answer, every health claim traces to evidence, and missing evidence is marked Gray, not Green.

## What It Does Not Do

- Does not reconcile status updates into project documents
- Does not perform a performance-domain review or project health review
- Does not prioritize the user's daily work
- Does not fabricate evidence or mark missing evidence Green

## Requirements

An agent tool that supports Agent Skills (loads `SKILL.md` from a skill directory).

## License

MIT
