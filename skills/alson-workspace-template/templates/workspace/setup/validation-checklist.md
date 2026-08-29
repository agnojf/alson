# Workspace Validation Checklist

## Structure

- [ ] `AGENTS.md` contains workspace-wide behavior only.
- [ ] `CONTEXT.md` can route common user requests.
- [ ] Each stage has one clear job.
- [ ] Each stage declares an explicit `Inputs -> Transform -> Outputs` interface.
- [ ] Stable references are separated from working artifacts.

## Stage Interfaces

- [ ] Every required input is explicitly named.
- [ ] The transformation is narrow enough to describe as one job.
- [ ] Every output has a declared location and format.
- [ ] Downstream consumers explicitly declare upstream outputs they depend on.
- [ ] Stages do not depend on hidden state.
- [ ] Stages do not write undeclared outputs or perform undeclared downstream work.

## Context Discipline

- [ ] No stage requires loading the full workspace by default.
- [ ] Required context is explicitly named.
- [ ] Missing or invalid inputs cause a stop, not an assumption.

## Flow

- [ ] Sequential dependencies are explicit.
- [ ] Independent stages can be invoked independently.
- [ ] Review or approval gates are clear.
- [ ] Re-running one stage does not require rebuilding unrelated stages.
- [ ] Changed inputs or rules make only dependent downstream outputs stale.

## User Experience

- [ ] Users can ask for outcomes in plain language.
- [ ] Internal architecture is hidden unless requested.
- [ ] User-facing responses surface decisions, risks, and next actions.

## Traceability

- [ ] Important outputs can be traced to their inputs or references.
- [ ] Verification checks exist for important cross-stage alignment.
- [ ] Known-invalid outputs are not passed downstream.
- [ ] Repeated output corrections have a path back to source instructions.
