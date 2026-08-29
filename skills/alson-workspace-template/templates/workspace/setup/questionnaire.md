# Workspace Setup Questionnaire

Answer these before finalizing a new workspace.

## 1. Outcome

What outcome should this workspace help the user achieve repeatedly?

## 2. Users

Who will use it?

What should they be able to ask in plain language?

## 3. Work Units

What are the smallest useful jobs or stages?

Can each stage be described as one transformation?

Which are sequential?

Which can be invoked independently?

## 4. Stage Interfaces

For each stage, define:

```text
Inputs -> Transform -> Outputs
```

What exact inputs may the stage read?

What single transformation does it own?

What exact outputs must it produce?

Which later stage or user consumes each output?

## 5. Inputs

Where do the stage inputs live?

Are inputs copied into the workspace or referenced externally?

What makes an input valid enough to proceed?

## 6. References

What stable rules, policies, templates, examples, or conventions should persist across runs?

## 7. Outputs

Where should the final artifact live?

What is the system of record?

What output formats or schemas must be guaranteed?

## 8. Review and Approval

Where should the agent stop for human review?

Which actions require explicit approval?

## 9. Verification

How can each stage prove that its output is complete, aligned, and traceable?

What verification failure should stop downstream work?

## 10. Routing

What user requests map to which stages?

What requests should not be supported?

## 11. Improvement Loop

Which recurring user corrections should trigger a source-level update to instructions or references?
