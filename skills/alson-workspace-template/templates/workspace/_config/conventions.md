# Workspace Conventions

## File Rules

- Prefer plain text or markdown for agent-readable instructions and intermediate state.
- Use stable, descriptive file names.
- Separate reference material from run-specific working artifacts.
- Do not duplicate a source unless duplication is required for the workflow.

## Stage Interface Rules

Every stage must declare:

```text
Inputs -> Transform -> Outputs
```

- **Inputs** define exactly what the stage may read.
- **Transform** defines the one job the stage performs.
- **Outputs** define exactly what the stage produces and where it writes it.
- A downstream stage must explicitly declare any upstream output it consumes.
- Avoid hidden state and undeclared side effects.
- A missing required input is a stop condition.
- A failed verification is a stop condition.

## Output Rules

- Write outputs to the stage's declared output location.
- Use templates or schemas when defined.
- Include source references when the stage requires traceability.
- Flag unresolved assumptions rather than presenting them as facts.
- Do not pass known-invalid outputs downstream.

## Change Rules

- Small one-off correction: edit the output when appropriate.
- Repeated correction: improve the source instruction, reference, or routing rule.
- Structural change: update `CONTEXT.md` and affected stage contracts.
- Interface change: update both the producing and consuming stage contracts.
