# Alson Project Intake

Turns vague requests into structured, audited briefs through a guided conversation pipeline.

When someone says "I need..." or "Can you..." and nobody is sure what they actually want, this skill runs a disciplined intake process. It asks one question at a time, adapts depth to complexity, and produces traceable outputs.

## Installation

### OpenCode

Add to your `opencode.json`:

```json
{
  "skills": {
    "paths": ["./project-intake"]
  }
}
```

### Agent tools with .agents/skills/ support

```bash
cp -r project-intake ~/.agents/skills/
```

### Manual

Place the `project-intake/` folder in any skill search path your agent tool supports.

## Usage

Trigger the skill by saying one of these keywords:

- "project intake"
- "intake this request"
- "intake"
- "clarify this request"

Then paste or describe the request. The skill runs three stages:

1. **Build** -- Guided conversation. Asks one question at a time. Produces a structured request brief and internal audit handoff.
2. **Measure** -- Checks the brief against mandatory acceptance criteria (universal and artifact-specific). Scores quality on a diagnostic rubric with a 95% threshold. Failed criteria return to Build for targeted clarification.
3. **Learn** -- Assesses the outcome, presents draft next actions for human review, then produces a prioritized next-action handoff.

The skill asks where to save pipeline files before starting. Outputs are organized in a dated run folder.

### Repeat Runs

If a run folder already has a prior `what-now.md`, the skill loads it as input before starting. Use this when continuing work on the same request.

### Status

Say `status` during or after a run to see which stages have completed and where their output files are.

## Output Files

| File | Contents |
|---|---|
| `run-manifest.md` | Run metadata |
| `stages/01-build/request-brief.md` | Structured brief with source notation |
| `stages/01-build/build-handoff.md` | Internal handoff for audit |
| `stages/02-measure/audit-findings.md` | Pass/fail per criterion, quality score, gaps, blockers |
| `stages/03-learn/what-now.md` | Next-action handoff with human-approved decisions |

## Validation

Run the five scenarios in `references/test-scenarios.md` to verify the skill works correctly. For each scenario, confirm the conversation is in plain English, the brief is complete, and all acceptance criteria pass.

## What It Does Not Do

- Does not authorize work or approve requests
- Does not write project charters, business cases, or requirements documents
- Does not make decisions for the requester
- Not suitable for detailed requirements gathering or scope document creation

## Requirements

An agent tool that supports Agent Skills (loads `SKILL.md` from a skill directory).

## License

MIT
