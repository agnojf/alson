# Workspace Template

A reusable, vendor-neutral workspace skeleton for AI-assisted work.

## Purpose

Use this template to create a new workspace without redesigning the context architecture each time.

The template combines:

1. **Five-layer context architecture** for routing and focused context loading,
2. **Unix-style composability** for small stages with clear interfaces, and
3. **multi-pass workflow behavior** where one stage's declared output can become another stage's declared input.

## Core Stage Contract

Every stage follows one explicit interface:

```text
Declared Inputs -> One Transformation -> Declared Outputs
```

This is the main unit of composition in the workspace.

A stage should be independently understandable, executable, testable, replaceable, and reusable when its required inputs are available.

## Quick Start

1. Copy this folder and rename it for the workspace.
2. Complete `setup/questionnaire.md`.
3. Update `AGENTS.md` with workspace-wide operating rules.
4. Update `CONTEXT.md` with the workspace map and routing rules.
5. Copy `stages/_TEMPLATE/` for each task or stage you need.
6. Define each stage's `Inputs -> Transform -> Outputs` contract first.
7. Put stable rules in `_config/`, `references/`, or stage `references/`.
8. Put run-specific source files or pointers in the stage `input/` folder.
9. Run only the stage needed for the user's current request.
10. Verify the declared output and stop at any required review gate before continuing downstream.

When this workspace is invoked while it still contains placeholders, setup runs before any work stage.

## Context Layers

| Layer | File / Folder | Purpose |
|---|---|---|
| 0 | `AGENTS.md` | Global identity and operating rules |
| 1 | `CONTEXT.md` | Workspace map, routing, and what to load |
| 2 | `stages/<stage>/CONTEXT.md` | Stage interface: inputs, transform, outputs, verification |
| 3 | `_config/`, `references/`, `shared/`, stage `references/` | Stable constraints and reusable knowledge |
| 4 | stage `input/` and `output/` | Run-specific working artifacts |

## Design Rules

- One stage, one job.
- Every stage declares `Inputs -> Transform -> Outputs`.
- Load only the context needed for the current task.
- Keep stable rules separate from working artifacts.
- Do not depend on hidden state.
- Make every output inspectable and editable.
- Pass outputs downstream only through declared interfaces.
- Stop on missing required inputs or failed verification.
- Review before important downstream work.
- Re-run only affected stages when inputs or rules change.
- Fix recurring problems at the source instruction or reference file, not only in the output.
- Use numbering only when execution order matters.
- Keep the agent interface simple. The user should ask for outcomes, not navigate internals.

## Unix Mapping

| Unix idea | Workspace implementation |
|---|---|
| Do one thing well | One stage owns one transformation |
| Simple interfaces | Files and markdown define stage boundaries |
| Output becomes input | Downstream stages explicitly consume upstream outputs |
| Composition | Stages are connected only when required |
| Transparency | Inputs, rules, outputs, and verification are inspectable |
| Replaceability | A stage can change without redesigning unrelated stages |

## Folder Map

```text
/alson-workspace
├── AGENTS.md
├── CONTEXT.md
├── README.md
├── _config/
│   ├── workspace.md
│   ├── conventions.md
│   └── review-policy.md
├── references/
│   └── README.md
├── shared/
│   └── README.md
├── stages/
│   └── _TEMPLATE/
│       ├── CONTEXT.md
│       ├── references/
│       │   └── README.md
│       ├── input/
│       │   └── INPUTS.md
│       └── output/
│           └── .gitkeep
└── setup/
    ├── questionnaire.md
    └── validation-checklist.md
```

## Naming Guidance

Use numbered stages for sequential workflows:

```text
01_discovery/
02_analysis/
03_delivery/
```

Use capability names when stages are independently invoked:

```text
status-review/
risk-analysis/
artifact-builder/
```

The router in `CONTEXT.md` decides which stage to load. The stage contract decides exactly what it may read, what it transforms, and what it returns.
