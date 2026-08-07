# Test Scenarios

Use these scenarios to validate the workspace. For each scenario, run the full intake pipeline and check the results against the expected outcome.

## Plain-Language Check

Every question the agent asks the user must use plain English  -  no terms like "deliverable," "acceptance criteria," "acceptance conditions," "stakeholders," "scope," "dependencies," "constraints," "decision criteria," or "environment." The agent may use these terms internally in the brief but must not use them when talking to the user.

## Scenario 1: Clear Task

**Input:** "Please reset the staging server database. It needs to be wiped and restored from the latest production backup. I need this done by end of day. I'll verify it works afterward."

**Expected:**
- Type: Task
- Core questions asked: 1-2 (deliverable, acceptance conditions)
- Branch: Task (deliverable, acceptance, dependencies)
- Questions asked: 4 or fewer
- Brief fields: Most stated, few or no inferences needed

## Scenario 2: Vague Solution-Led Request

**Input:** "We need a chatbot. Support costs are too high and customers are frustrated. Engineering says it's easy. Figure out what to build."

**Expected:**
- Type: Project or Mixed (project with elements of decision/idea)
- Agent separates need (high support costs, frustrated customers) from proposed solution (chatbot)
- Core questions needed: Outcome, ownership, completion criteria, context
- Brief flags: Missing owner, success criteria vague, scope unclear

## Scenario 3: Cross-Team Project

**Input:** "Build a customer portal where users can view their order history, track shipments, and update their profile. This involves the web team, customer support, and warehouse systems. Marketing wants it for Q2 next year. No budget approved yet."

**Expected:**
- Type: Project
- Core questions: Ownership, approval authority, scope boundaries
- Branch: Project (current state, future state, scope, sponsor, stakeholders, budget, risks)
- Triggers activated: Cross-team, Funding, Approval
- Brief flags: No sponsor, no budget, cross-team coordination needed

## Scenario 4: Urgent Issue with Personal Data

**Input:** "Urgent -- our customer support portal is showing other users' names and email addresses when agents search for customers. This has been happening for about two hours. IT is aware but no fix yet. We need this fixed immediately."

**Expected:**
- Type: Issue
- Core questions: Impact, severity, workaround
- Branch: Issue (symptoms, impact, severity, timing, environment, workaround)
- Triggers activated: Sensitive data, Regulatory (data privacy)
- Brief flags: Personal data exposure, regulatory/privacy risk noted
- No assumption of compliance clearance without evidence

## Scenario 5: Decision Request

**Input:** "Help me decide whether we should migrate our CRM from Salesforce to HubSpot. HubSpot is cheaper but Salesforce has more features. We have about 50 users. Our contract with Salesforce renews in 4 months."

**Expected:**
- Type: Decision
- Core questions: Decision criteria, authority, deadline
- Branch: Decision (options, criteria, authority, deadline)
- Triggers activated: Fixed deadline (4 months), potentially Funding
- Brief flags: Missing decision criteria or authority would be noted
