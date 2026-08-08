The skill's Identity section governs this template. The identity rules determine writing style, section order, and what to include or omit. The template defines required content, not a mandatory document shape.

# {{Project Name}} Status Report

As of: {{YYYY-MM-DD}}
Overall: **{{On track / At risk / Off track / Insufficient data}}** (trend: {{Improving / Stable / Worsening / Unknown}})

Next critical date: {{date}}
Next critical item: {{item}}

## Pulse

| Fact | Value |
|---|---|
| {{Label}} | {{Value}} |

## Key Metrics

| Metric | Value |
|---|---|
| Current milestone | {{Name}} |
| Completion | {{NN%}} ({{x/y}}) |
| Target date | {{Date}} |
| Days to target | {{N days left / N days overdue / Due today / Insufficient data}} |

## Health Dashboard

| Dimension | RAG | Trend | Confidence | Metric | Finding | Evidence |
|---|---|---|---|---|---|---|
| Scope | **On track** | Stable | High | {{Metric}} | {{One sentence}} | {{Source}} |
| Schedule | **At risk** | Worsening | Medium | {{Metric}} | {{One sentence}} | {{Source}} |
| Cost | {{RAG}} | {{Trend}} | {{High / Medium / Low}} | {{Metric}} | {{One sentence}} | {{Source}} |
| Quality | {{RAG}} | {{Trend}} | {{Confidence}} | {{Metric}} | {{One sentence}} | {{Source}} |
| Risk | {{RAG}} | {{Trend}} | {{Confidence}} | {{Metric}} | {{One sentence}} | {{Source}} |
| Resources | **Insufficient data** | Unknown | Low | None | {{One sentence}} | {{Source}} |

## Decisions

| Decision | Needed By | Owner | Priority |
|---|---|---|---|
| {{Decision}} | {{Date}} | {{Owner}} | {{High / Medium / Low}} |

## Progress

**Achievements**

- {{Achievement}} ({{Owner}})

**Commitments**

- {{Commitment}} ({{Owner}})

## Milestones

| Milestone | Baseline | Forecast | Variance | Status | Owner |
|---|---|---|---|---|---|
| {{Name}} | {{Date}} | {{Date}} | {{+N days / 0 days}} | {{Complete / In progress / Not started / Delayed}} | {{Owner}} |

## Finance

| Item | Budget | Actual | EAC | Variance |
|---|---|---|---|---|
| {{Item}} | {{$}} | {{$}} | {{$}} | {{$}} |

| Note | Value |
|---|---|
| {{Label}} | {{Value}} |

## Exceptions

**Risks**

| ID | Risk | Detail | Status | Owner |
|---|---|---|---|---|
| {{ID}} | {{Description}} | {{Detail}} | {{Active / Monitoring}} | {{Owner}} |

**Issues**

| ID | Issue | Detail | Status | Owner | Target |
|---|---|---|---|---|---|
| {{ID}} | {{Description}} | {{Detail}} | {{Status}} | {{Owner}} | {{Date}} |

**Assumptions**

| ID | Assumption | Status | Owner |
|---|---|---|---|
| {{ID}} | {{Description}} | {{Active / Validated / Invalidated}} | {{Owner}} |

**Dependencies**

| ID | Dependency | Status | Owner |
|---|---|---|---|
| {{ID}} | {{Description}} | {{Open / Met / Awaiting / Ready}} | {{Owner}} |

**Changes**

| ID | Change | Status | Owner |
|---|---|---|---|
| {{ID}} | {{Description}} | {{Status}} | {{Owner}} |

## Actions

| ID | Action | Owner | Due | Status |
|---|---|---|---|---|
| {{ID}} | {{Action}} | {{Owner}} | {{Date}} | {{Not started / In progress / Completed / Blocked}} |

## Evidence Notes

- {{Limitation or confidence note}}

---

Omit any section with no content. Mark dimensions without current evidence as **Insufficient data**, never Green.
