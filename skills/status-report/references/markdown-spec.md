# Status Report Markdown Format Spec

These are the formatting rules for the generated status report Markdown file.

---

## Layout

1. Single Markdown file. Renders in any Markdown viewer.
2. Title: `# {{Project Name}} Status Report`
3. As-of line: `As of: {{YYYY-MM-DD}}`
4. Use `##` for the ten content sections. Use bold lead-ins for subsections such as exception types.
5. Use tables for structured data: facts, key metrics, health dashboard, decisions, milestones, finance, exceptions, actions.
6. Use bullet lists for achievements, commitments, and evidence notes.

## RAG Labels

1. RAG states are text labels, never color. Plain Markdown has no color.
2. Labels match the status model: Green = "On track", Amber = "At risk", Red = "Off track", Gray = "Insufficient data".
3. Render each RAG as bold text in the header and health dashboard.
4. Trend labels: Improving, Stable, Worsening, Unknown.

## Content Rules

1. Lead with the answer. The first three lines state overall RAG and the next critical item.
2. Every health claim has a one-sentence finding and an evidence citation.
3. Cite evidence as source names or register IDs, for example `Risk register (R-04)`.
4. Omit empty sections.
5. No filler paragraphs. Every sentence adds information.
6. Use plain English. Avoid jargon.
7. No em dashes. Use commas, colons, or two hyphens.

## Structure

1. Header: project name, as-of date, overall RAG and trend, next critical date and item.
2. Pulse: headline facts as a two-column table.
3. Key metrics: current milestone, completion, target date, days to target.
4. Health dashboard: one row per dimension with RAG, trend, confidence, metric, finding, evidence.
5. Decisions: decision, needed by, owner, priority.
6. Progress: achievements and commitments.
7. Milestones: name, baseline, forecast, variance, status, owner.
8. Finance: summary rows and notes.
9. Exceptions: risks, issues, assumptions, dependencies, changes.
10. Actions: action, owner, due date, status.
11. Evidence notes: limitations, confidence notes, sources.
