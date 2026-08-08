# Changelog

## 1.0.0 (2026-08-08)

- Initial release from `workspaces/status-report`
- Build-Measure-Learn pipeline for producing audited project status reports
- Scan-fast Markdown report: header RAG, pulse, key metrics, health dashboard, decisions, progress, milestones, finance, exceptions, actions, evidence notes
- Status model with RAG health scale, trend labels, and evidence rules
- Every health claim requires evidence; missing evidence means Gray, not Green
- PMI reporting principles for report content
- Universal acceptance criteria (U-01 through U-13) and artifact-specific criteria (SR-01 through SR-13)
- Diagnostic quality rubric (10 dimensions, 95% passing threshold)
- Demo evidence pack for first-run validation, used only on explicit request
- Repeat-run support: loads prior `what-now.md` when run folder already exists
- Status command: reports stage completion from output file presence
- Self-contained portable package with no repository-specific dependencies
