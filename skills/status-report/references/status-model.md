# Status Model

Rules for determining RAG health, trend, confidence, and evidence sufficiency.

---

## Health Scale

| Label | Meaning | When to Use |
|-------|---------|-------------|
| Green | On track. Within approved thresholds. No intervention needed. | Plans are meeting or exceeding baselines. Variance within threshold. |
| Amber | At risk. Outside threshold but recoverable. Intervention may be needed. | Variance exceeds threshold but corrective plan exists. One dimension off-track but contained. |
| Red | Off track. Outside threshold. Intervention required. | Variance significant. Baseline change likely. Sponsor escalation needed. |
| Gray | Insufficient data. Cannot determine. | Evidence missing, outdated, or unreliable for this dimension. |

## Trend

| Label | Meaning |
|-------|---------|
| Improving | Metric is moving toward the target or better than last period |
| Stable | Metric is within expected variation from last period |
| Worsening | Metric is moving away from target or worse than last period |
| Unknown | Insufficient trend data |

## Overall Project Health

The overall RAG is the most severe dimension RAG, except:
- Three or more Amber dimensions = Overall Amber
- Any Red dimension = Overall Red
- Any Gray dimension = report states "Insufficient data" unless overridden by explicit evidence

## Evidence Rules

1. Every RAG assignment cites specific evidence.
2. Missing evidence produces Gray, not Green.
3. Evidence must be current: within the reporting period or explicitly noted as "as of [date]".
4. Forecasts and trends require at least two data points.
5. Confidence is High (direct measurement), Medium (derived or estimated), or Low (assumption or guesstimate).
6. A dimension with Low confidence evidence defaults to Amber unless confirmed Green by High confidence evidence.
