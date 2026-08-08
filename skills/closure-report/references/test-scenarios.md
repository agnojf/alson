# Test Scenarios -- Closure Report Skill

## Scenario 1: Complete Project Closure

**Input:** A structured brief describing a completed project with known scope, schedule, cost, quality, all deliverables accepted, no open items, signed approvals, and repository path.

**Expected outcome:** The pipeline produces a complete closure report. All 12 acceptance criteria pass. Quality score meets or exceeds 95%.

**Verification:**
- Report leads with the answer in the first 3 lines.
- All template sections contain substantive content.
- Every claim cites a specific source.
- All 12 acceptance criteria pass.
- Quality score meets or exceeds 95%.

## Scenario 2: Missing Approval Evidence

**Input:** A brief describing a completed project where deliverables were accepted but the decision owner has not signed the closure yet.

**Expected outcome:** The report is produced but marks approval evidence as unknown. Acceptance criterion 9 (approvals) fails. The Measure stage returns to Build for revision. The Learn stage produces a what-now handoff prioritizing obtaining the missing signature.

**Verification:**
- Report is produced without fabricating approval status.
- Missing approval is explicitly noted as unknown.
- Criterion 9 fails with documented gap.
- Learn handoff recommends the smallest action to fill the gap.

## Scenario 3: Open Handoff Items

**Input:** A brief describing a project with three deliverables accepted and one pending handoff item with no assigned owner.

**Expected outcome:** The report includes the open item. Acceptance criterion 5 (outstanding items tracked) fails because the item has no owner. Audit findings document the gap. Measure returns to Build for targeted revision.

**Verification:**
- Open item appears in the report.
- Criterion 5 fails due to missing owner.
- Revision adds a placeholder or escalates the gap.
- After revision all criteria pass.

## Scenario 4: Conflicting Source Evidence

**Input:** Source material stating both "project completed on time" and "schedule overrun of 2 weeks" for the same project.

**Expected outcome:** The Build stage flags the conflict. The Measure stage identifies the inconsistency. The Learn stage recommends resolving the conflicting evidence before finalizing.

**Verification:**
- Build stage flags conflicting evidence to the user.
- Measure identifies and documents the inconsistency.
- Learn stage prioritizes resolution.
- Report is not finalized with unresolved conflict.

## Scenario 5: Targeted Revision and Continuation

**Input:** A run folder exists with a prior `what-now.md` requesting a specific missing item (e.g., add repository path). The user says "continue."

**Expected outcome:** The skill detects the existing `stages/03-learn/what-now.md`. Loads it as input. Targets revision only on the missing item. Produces a delta revision.

**Verification:**
- Skill detects existing what-now at setup.
- Prior what-now content influences the new build.
- New build is a delta revision (lists only what changed).
- New handoff supersedes the prior one.

## Scenario 6: Status Reporting

**Input:** User says `status` during or after a run.

**Expected outcome:** The skill checks output files under each stage and reports which stages are complete and where their output files are.

**Verification:**
- Reports Build complete when `stages/01-build/closure-report.md` exists.
- Reports Measure complete when `stages/02-measure/audit-findings.md` exists.
- Reports Learn complete when `stages/03-learn/what-now.md` exists.
- Omits or labels missing stages correctly.
- Includes file paths for present stages.
