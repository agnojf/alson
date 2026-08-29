# Stage Contract: [Stage Name]

## Purpose

[One job only. State the outcome this stage is responsible for.]

## Trigger

Run this stage when:
- [User intent or upstream condition]

Do not run this stage when:
- [Exclusion]

## Interface Contract

Treat this stage as a small composable unit with one explicit interface:

```text
[Declared Inputs] -> [One Transformation] -> [Declared Outputs]
```

| Interface | Declaration |
|---|---|
| Inputs | [What this stage is allowed to read] |
| Transform | [The single transformation this stage performs] |
| Outputs | [What this stage guarantees to produce] |

Contract rules:
- Read only the working inputs and references declared below.
- Perform only the transformation owned by this stage.
- Write only the outputs declared below.
- Do not silently add another stage's responsibility.
- Stop when a required input is missing or invalid.
- Do not continue downstream when a review or approval gate is active.

## Inputs

| Layer | Source | Required | Use |
|---|---|---:|---|
| 3 | `../../_config/[file].md` | Yes/No | [Constraint] |
| 3 | `references/[file].md` | Yes/No | [Reference] |
| 4 | `input/[file or INPUTS.md]` | Yes/No | [Working input] |
| 4 | `../[prior-stage]/output/[file]` | Yes/No | [Prior output] |

## Input Gate

Before execution:
- confirm every required input exists,
- confirm each input is the intended source,
- confirm the input is usable for the declared transformation,
- stop and ask for the missing or invalid input if a required item fails the gate.

## Transform

1. [Read the declared input.]
2. [Apply only the references and constraints declared for this stage.]
3. [Perform the stage's single transformation.]
4. [Produce the declared output.]

Do not perform downstream work here.

## Outputs

| Output | Location | Format | Intended consumer |
|---|---|---|---|
| [Artifact] | `output/[file]` | [Markdown/JSON/etc.] | [User / next stage / external system] |

Output guarantees:
- [Required structure or schema]
- [Required source traceability]
- [Required quality or completeness condition]

## Verify

Check before completion:
- [Accuracy check]
- [Completeness check]
- [Interface check: output matches the declared contract]
- [Cross-stage consistency check, if relevant]
- [Source traceability check, if relevant]

If verification fails, report the failure and stop. Do not pass a known-invalid output downstream.

## Review Gate

[None / Review / Approval]

If review is required, stop after producing the reviewable output.

## User-Facing Response

Report only what the user needs:
- outcome,
- important findings,
- decisions needed,
- risks or constraints,
- next action.

Keep internal stage mechanics hidden unless requested.
