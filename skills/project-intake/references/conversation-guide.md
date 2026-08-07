# Conversation Guide

The agent runs a guided conversation, not a form. Ask one question at a time. Stop when enough is known to classify and assess the request.

## Step 1: Extract Everything Already Provided

Before asking anything, scan the input for every piece of information that maps to a brief field. Note what is stated, implied, or missing.

## Step 2: Restate and Confirm Briefly

State your understanding of the request in 1-2 sentences. Ask "Is that right?" Do not ask further questions yet.

Example: "You need a way for care group members to register online, replacing the current manual process. Is that correct?"

## Step 3: Classify the Request Type

Determine the primary type by reading what the user said.

| Type | Signal |
|---|---|
| Task / Action | "Do this thing", "Please fix", "I need you to", "Can someone" |
| Project / Change | "Build", "Create", "Implement", "Migrate", "Launch" + scope, stakeholders, timeline |
| Decision / Advice | "Should we", "Which option", "Help me decide", "Evaluate" |
| Issue / Support | "Broken", "Not working", "Error", "Problem with", "Incident" |
| Information / Content | "Research", "Summarize", "Write about", "Tell me about", "List" |
| Idea / Opportunity | "What if", "Possible to", "Consider", "Explore" |

## Step 4: Core Questions

Ask only the missing questions. One at a time. Adapt the wording naturally.

| # | Area | Question | Maps To |
|---|---|---|---|---|
| C1 | Request | What exactly do you need? Is it a task, a decision, a project, or something else? | Summary / Type |
| C2 | Need | What problem or situation led to this request? | Problem / Opportunity |
| C3 | Impact | Who is affected and how? | Impact / Stakeholders |
| C4 | Outcome | What should be different when this is done? | Desired outcome |
| C5 | Completion | How will you know this is complete or done right? | Success conditions |
| C6 | Ownership | Who asked for this, who is responsible for the result, and who needs to give the final OK? | Requester / Owner / Approver |
| C7 | Timing | When is this needed, and why does that timing matter? | Priority / Timing |
| C8 | Context | What else should I know -- any limits, things that must happen first, risks, or supporting details? | Supporting info / Constraints |

## Step 5: Adaptive Branches

After the core questions, classify the request and check which branch applies. Ask only the branch questions that have not been answered.

### Task / Action

| # | Question | Maps To |
|---|---|---|
| T1 | What exactly needs to be done or produced? | Deliverable |
| T2 | Who will do the work? | Assignee |
| T3 | How will you know it is done right? | Success conditions |
| T4 | What needs to happen before this can start? | Dependencies |

### Project / Change

| # | Question | Maps To |
|---|---|---|
| P1 | How does it work today? | Current state |
| P2 | What should it look like when done? | Future state |
| P3 | What should be included and what should not? | Scope boundaries |
| P4 | Who is the senior person who owns this? | Sponsor |
| P5 | Who is affected or needs to be involved? | Stakeholders |
| P6 | What budget or resources are available? | Constraints |
| P7 | What could go wrong or is uncertain? | Risks |

### Decision / Advice

| # | Question | Maps To |
|---|---|---|
| D1 | What do you need to decide? | Decision needed |
| D2 | What options are you considering? | Options |
| D3 | What matters most when choosing? | Decision criteria |
| D4 | Who has the final say? | Authority |
| D5 | When do you need the decision by? | Deadline |

### Issue / Support

| # | Question | Maps To |
|---|---|---|
| I1 | What exactly is happening or not working? | Symptoms |
| I2 | How is this affecting people or work? | Impact |
| I3 | How bad is it -- is it blocking work, annoying, or barely noticeable? | Severity |
| I4 | When did it start, and does it happen all the time or only sometimes? | Timing |
| I5 | Where or when does this happen? | Environment |
| I6 | Is there a temporary fix or workaround? | Workaround |

### Information / Content

| # | Question | Maps To |
|---|---|---|
| N1 | Who needs this information? | Audience |
| N2 | What will they do with it? | Intended use |
| N3 | What format should it be in (e.g. document, slide, email, spreadsheet)? | Format |
| N4 | Where should the information come from? | Sources |
| N5 | How detailed does it need to be? | Quality expectations |

### Idea / Opportunity

| # | Question | Maps To |
|---|---|---|
| O1 | What opportunity or idea are you exploring? | Opportunity |
| O2 | What benefit or value do you expect from it? | Expected value |
| O3 | What makes you think this is worth pursuing? | Evidence |
| O4 | Who or what would be affected? | Affected groups |
| O5 | What approaches or options should we look at? | Options |

## Step 6: Complexity, Risk, and Authority Triggers

Check these triggers. If any activate, ask the additional questions listed.

| Trigger | Condition | Additional Questions |
|---|---|---|---|
| Cross-team | The request involves 2+ teams or departments | Who needs to be involved from each team? Who makes sure everyone stays aligned? |
| Funding | Budget, cost, or money is mentioned or implied | What is the budget range? Who decides on the money? |
| Approval | Someone needs to say yes or sign off | Who has the authority to approve? What is the approval process? |
| Sensitive data | Personal, financial, health, or confidential information is involved | What kind of data is involved? What privacy or security rules apply? |
| Regulatory | Laws, rules, audit, or compliance requirements exist | What regulations or rules apply? Who makes sure we are following them? |
| External dependency | The request depends on an outside vendor, partner, or third party | Who is the outside party? What do they need to do? |
| Irreversible | The action cannot easily be undone | What makes it hard to undo? What checks are needed first? |
| High uncertainty | Key details, scope, or feasibility are unknown | What is the biggest thing we do not know yet? How could we find out? |
| Fixed deadline | A hard date or deadline is stated or implied | What happens if the deadline is missed? Is the date flexible? |
| Ongoing ownership | The request means someone must keep running, supporting, or maintaining it after delivery | Who will take care of it after it is delivered? What support is in place? |

## Step 7: Produce the Brief

Populate the request brief template with everything now known. Mark each field with its source:

- **Stated** -- the user directly said this.
- **Inferred** -- reasonably deduced from what was said. Note the basis.
- **Unknown** -- not discussed. Leave blank or mark as unknown.

## Step 8: Audit

Run the acceptance criteria from the 02-measure stage. If any criterion fails:

1. Identify the specific gap.
2. Ask only the question needed to fill the gap.
3. Do not re-ask answered questions.
4. Update the brief.
5. Re-run the audit.
