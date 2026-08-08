# Test Scenarios

Use these scenarios to validate the skill. For each scenario, run the full pipeline and check the results against the expected outcome.

## Plain-Language Check

Every question the agent asks the user must use plain English -- no terms like "deliverable," "acceptance criteria," "acceptance conditions," "stakeholders," "scope," "dependencies," "constraints," "decision criteria," or "environment." The agent may use these terms internally in the report but must not use them when talking to the user.

## Scenario 1: Complete Evidence Pack

**Input:** "Produce a status report for Mercury Payroll Integration. Use the demo evidence pack."

**Expected:**
- Project source confirmed: demo evidence pack (explicitly selected)
- Save location confirmed before any report questions
- Report leads with the overall RAG and next critical item in the first 3 lines
- All ten content sections present where evidence exists
- Every health claim has a one-sentence finding and an evidence citation
- Every RAG assignment follows the status model rules
- No fabricated numbers: cross-check 3 figures against the demo evidence
- Build handoff, audit findings, and what-now outputs all written

## Scenario 2: Partial Evidence

**Input:** "Build a status report for the website redesign. I have the schedule and a meeting note from this week. No budget data yet."

**Expected:**
- Cost dimension shows "Insufficient data", never Green
- Any dimension without current evidence is marked Gray
- Report states the overall RAG per the status model
- Missing evidence is listed as an open item in the build handoff
- Ask only for the project source; do not invent budget numbers

## Scenario 3: Repeat Run

**Input:** "Update the status report. I have new test results." (run path already contains `stages/03-learn/what-now.md`)

**Expected:**
- Prior `what-now.md` is loaded as input before Stage 1
- The first action from the prior handoff is executed
- The report is revised delta-only: what changed, what is still blocked, what is next
- The what-now output can be used directly as input without extra cleanup

## Scenario 4: Demo Evidence Only on Request

**Input:** "Produce a status report for the API migration project." (no evidence supplied)

**Expected:**
- Agent asks for the project source and does not proceed until one is provided
- Demo evidence pack is not used unless the user explicitly selects it
- Save location is not asked before the project source is confirmed
