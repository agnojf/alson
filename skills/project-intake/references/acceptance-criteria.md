# Acceptance Criteria

## Result Scale

| Result | Meaning |
|---|---|
| Pass | Criterion is satisfied with clear evidence |
| Partial | Criterion is partly satisfied but has gaps, ambiguity, or weak evidence |
| Fail | Criterion is missing, contradicted, or unusable |
| Not Applicable | Criterion does not apply and the reason is documented |

## Universal Criteria (U-01 through U-13)

Apply these criteria to every artifact this workspace produces.

| ID | Criterion | Pass Condition |
|---|---|---|
| U-01 | Identity | Artifact has title, version/date, status, and owner |
| U-02 | Purpose | Artifact clearly states why it exists and what decision or operation it supports |
| U-03 | Scope | In-scope and out-of-scope content are clear where relevant |
| U-04 | Required structure | Required sections and tables are present |
| U-05 | Specificity | Uses actual names, roles, statuses, values, or placeholders explicitly marked TBD |
| U-06 | Plain language | Understandable by its intended readers; unexplained technical terms are avoided |
| U-07 | Traceability | References related artifacts, IDs, roles, workflows, capabilities, dependencies, or risks as needed |
| U-08 | Usability | A reader can use the artifact to operate, support, govern, decide, or accept |
| U-09 | Risk and limitation visibility | Assumptions, limitations, gaps, exceptions, and risks are visible |
| U-10 | Ownership and accountability | Owners, approvers, or responsible roles are identified for the artifact content and major decisions |
| U-11 | Consistency | Terms, role names, statuses, IDs, and scope are consistent with related documents |
| U-12 | Acceptance readiness | Artifact can be reviewed and signed off by the correct owner |
| U-13 | Concise writing | No filler paragraphs, repetition, or unnecessary sections. Document leads with the answer. |

## Critical Universal Criteria

These must pass for core acceptance. A Fail on any of these blocks acceptance:

- U-01 Identity
- U-02 Purpose
- U-04 Required structure
- U-07 Traceability
- U-08 Usability
- U-10 Ownership and accountability
- U-12 Acceptance readiness

## Artifact-Specific Criteria (Request Brief)

Apply these criteria to the request brief in addition to the Universal Criteria.

| ID | Criterion | Pass Condition |
|---|---|---|
| AS-01 | Request is understandable | A neutral reader can describe what is being asked in 1-2 sentences. |
| AS-02 | Problem or need is stated | The brief identifies what situation prompted the request. |
| AS-03 | Desired outcome is stated | The brief describes what should be different when complete. |
| AS-04 | Owner is identified | A person or role is named as accountable for the outcome. If unknown, this is flagged as a gap, not assumed. |
| AS-05 | Request type is classified | One of: Task, Project, Decision, Issue, Information, Idea, or Mixed. |
| AS-06 | Brief is complete | All applicable fields from the template are populated. Fields left blank are marked as unknown with a note. |
| AS-07 | Brief is ready to close | No open gaps exist that would prevent a recipient from understanding and acting on the request. |
| AS-08 | No fabricated information | Every populated field has a source notation (stated, inferred, unknown). No field contains invented content. |
| AS-09 | Safety-critical gaps flagged | Privacy, security, legal, regulatory, and irreversible-action gaps are explicitly noted if present. |
| AS-10 | Assumptions pass the gate | Every proceeding assumption passes all five assumption gate tests (reversible, impact, authority, compliance, visibility). |
| AS-11 | Inferred fields have a basis | When a field is marked as inferred, the brief notes what evidence supports the inference. |

### Critical Artifact-Specific Criteria

All artifact-specific criteria are critical for the request brief. A Fail on any of them blocks acceptance. The brief returns to the Build stage for targeted clarification.

## Acceptance Decisions

| Decision | Meaning |
|---|---|
| Accept | Artifact is complete, clear, traceable, usable, and ready for use |
| Accept with Conditions | Minor gaps exist but do not block handover; fixes are tracked |
| Revise and Resubmit | Important gaps prevent reliable use |
| Reject | Artifact is missing, inaccurate, contradictory, or unusable |

## Acceptance Thresholds

An artifact can be marked Accept only when:
- All critical universal criteria pass
- All artifact-specific criteria pass
- Required cross-references are consistent
- Known gaps are either fixed or recorded as accepted limitations

An artifact can be marked Accept with Conditions only when:
- Remaining issues are low or medium severity
- No issue prevents operation, support, governance, or handover
- Conditions are clearly listed with owners and target dates
- The accepting owner agrees to the conditions

An artifact should be Revise and Resubmit when:
- Required fields or sections are missing
- Traceability to related documents is incomplete
- Ownership is unclear
- Content is too vague for its intended use
- Contradictions exist but are fixable

An artifact should be Rejected when:
- It is the wrong artifact
- It cannot be used by the target audience
- It contradicts accepted scope or other accepted artifacts
- It falsely claims readiness despite missing critical content
- It omits ownership or known limitations in a way that creates acceptance risk

## Verifier Control Rules

### Automatic Fail Conditions

Fail the artifact if any of these are true:

1. Artifact is missing
2. Artifact type does not match the expected deliverable
3. Identity is missing
4. Owner is missing
5. Purpose is missing
6. Required structure is substantially missing
7. A critical universal criterion is marked Fail
8. A critical artifact-specific criterion is marked Fail
9. Artifact contradicts a previously accepted artifact
10. Artifact claims accepted or complete status while required acceptance evidence is missing

### Conditional Pass Conditions

Allow Accept with Conditions only if all are true:

1. No automatic fail condition exists
2. Conditional items are listed
3. Conditional items have owners or are assigned to the handover or open items list
4. The artifact remains usable despite the conditions

### Full Pass Conditions

Accept the artifact only if all are true:

1. All required universal criteria pass
2. All required artifact-specific criteria pass
3. Cross-references are valid
4. No required fixes remain
5. Acceptance owner is named
