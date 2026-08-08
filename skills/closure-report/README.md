# Alson Closure Report

Turns project context into an audited Project Closure Report through a disciplined Build-Measure-Learn pipeline.

When a project or phase is complete and you need a formal record of what was delivered, how it performed, what remains open, and what lessons were learned, this skill produces a structured report with audited quality.

## Installation

### OpenCode

Add to your `opencode.json`:

```json
{
  "skills": {
    "paths": ["./closure-report"]
  }
}
```

### Agent tools with .agents/skills/ support

```bash
cp -r closure-report ~/.agents/skills/
```

### Manual

Place the `closure-report/` folder in any skill search path your agent tool supports.

## Usage

Trigger the skill by saying one of these keywords:

- "closure report"
- "project closure report"
- "close project"
- "project closeout"
- "closeout report"

Then describe the project or phase being closed and supply any available source material. The skill runs three stages:

1. **Build** -- Guided intake. Asks one question at a time. Produces a closure report and internal audit handoff.
2. **Measure** -- Checks the report against mandatory acceptance criteria. Scores quality on an 8-dimension rubric. Failed criteria return to Build for targeted revision.
3. **Learn** -- Assesses the outcome, presents draft next actions for human review, then produces a prioritized next-action handoff.

The skill asks where to save pipeline files before starting. Outputs are organized in a run folder.

### Repeat Runs

If a run folder already has a prior `what-now.md`, the skill loads it as input before starting. Use this when continuing work on the same closure report after receiving feedback or additional evidence.

### Status

Say `status` during or after a run to see which stages have completed and where their output files are.

## Output Files

| File | Contents |
|---|---|
| `run-manifest.md` | Run metadata |
| `stages/01-build/closure-report.md` | Structured report with source notation |
| `stages/01-build/build-handoff.md` | Internal handoff for audit |
| `stages/02-measure/audit-findings.md` | Pass/fail per criterion, quality score, gaps |
| `stages/03-learn/what-now.md` | Next-action handoff with human-approved decisions |

## What It Does Not Do

- Does not authorize project closure or approve the report
- Does not produce a status report, lessons-learned register, or benefits management plan
- Does not perform a post-implementation review or benefits realization assessment

## Requirements

An agent tool that supports Agent Skills (loads `SKILL.md` from a skill directory).

## License

MIT
