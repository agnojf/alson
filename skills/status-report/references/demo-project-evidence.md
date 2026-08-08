# Demo Project Evidence

Use this evidence pack for the first demo build. Replace with real project evidence in production use.

---

## Project Identity

| Field | Value |
|-------|-------|
| Project name | Mercury Payroll Integration |
| Project slug | mercury-payroll |
| Sponsor | Carla Reyes, VP Finance |
| Owner | Marcus Chen, Senior PM |
| Report period | July 1-14, 2026 |
| Report date | July 15, 2026 |
| Cadence | Biweekly |
| Data currency date | July 14, 2026 |

---

## Schedule

| Milestone | Baseline Date | Forecast Date | Variance | Status | Owner |
|-----------|--------------|--------------|----------|--------|-------|
| Requirements sign-off | Jun 15 | Jun 15 | 0 days | Complete | Ana Lopez |
| API contract agreed | Jun 22 | Jun 29 | +7 days | Complete | Dev Team |
| Sandbox environment ready | Jul 6 | Jul 13 | +7 days | Complete | Ops |
| Integration dev complete | Jul 20 | Jul 27 | +7 days | In progress | Dev Team |
| UAT start | Jul 27 | Aug 3 | +7 days | Not started | QA Team |
| Go-live | Aug 17 | Aug 24 | +7 days | Not started | PM |

Critical path is sandbox to integration dev to UAT to go-live. The +7 day variance on API contract and sandbox has not been recovered. No recovery plan yet.

---

## Cost

| Item | Budget | Actual to Jul 14 | Forecast EAC | Variance |
|------|--------|-----------------|-------------|----------|
| Vendor license | $12,000 | $12,000 | $12,000 | $0 |
| Dev resources | $40,000 | $22,000 | $46,000 | -$6,000 |
| QA resources | $15,000 | $4,000 | $16,000 | -$1,000 |
| Ops/infra | $8,000 | $3,500 | $8,500 | -$500 |
| Contingency | $10,000 | $0 | $10,000 | $0 |
| **Total** | **$85,000** | **$41,500** | **$92,500** | **-$7,500** |

EAC is based on actual burn rate extended through the +7 day schedule delay. Contingency has not been tapped.

---

## Scope

| Item | Status | Notes |
|------|--------|-------|
| Requirements baseline | Approved Jun 15 | No changes requested |
| Integration scope | Stable | One minor refinement to error handling scope |
| Change requests | 0 open | No formal CRs submitted |

---

## Quality

| Metric | Target | Current | Trend |
|--------|--------|---------|-------|
| Unit test coverage | 80% | 72% | Stable |
| Integration test pass rate | 95% | 88% | Worsening |
| Defects found (this period) | N/A | 3 | New |
| Critical defects open | 0 | 1 | New |

One critical defect: payroll data mapping in sandbox environment produces off-by-one error for salaried employees in a specific pay code. Root cause identified. Fix in progress, estimated 3 days.

---

## Risks

| # | Risk | Probability | Impact | Exposure | Response | Owner |
|---|------|-----------|--------|----------|----------|-------|
| R1 | Sandbox environment delay | High | High | Schedule slip | Workaround: using staging env in parallel | Ops |
| R2 | Payroll data mapping defect | Medium | High | Quality issue, UAT delay | Fix in progress, root cause known | Dev Lead |
| R3 | Vendor API rate limiting in prod | Low | Medium | Performance degradation | Caching strategy designed, not implemented | Dev Team |
| R4 | Resource contention with Q3 product release | Medium | Medium | Staffing shortfall | Not yet escalated to sponsor | PM |

---

## Issues

| # | Issue | Impact | Status | Owner | Target Resolution |
|---|-------|--------|--------|-------|-------------------|
| I1 | Sandbox provisioned 7 days late | Schedule +7 days | Closed | Ops | Resolved |
| I2 | API contract negotiation delayed | Schedule +7 days | Monitoring | Dev Lead | Resolved but impact not recovered |
| I3 | Payroll data mapping defect | UAT may start late | Active | Dev Lead | Jul 20 |

---

## Key Dependencies

| Dependency | Owner | Status | Risk |
|-----------|-------|--------|------|
| Vendor API rate limit confirmation | Vendor | Awaiting response | Low |
| Staging environment availability | Ops | Available | None |
| Payroll data extract from legacy system | IT Ops | Ready | None |
| Q3 product release staffing | Product | Not yet coordinated | Medium |

---

## Actions

| # | Action | Owner | Due Date | Status |
|---|--------|-------|----------|--------|
| A1 | Submit recovery plan for +7 day schedule variance | Marcus Chen | Jul 18 | Not started |
| A2 | Resolve payroll data mapping defect | Dev Lead | Jul 20 | In progress |
| A3 | Escalate resource contention with Q3 release | Marcus Chen | Jul 18 | Not started |
| A4 | Confirm vendor API rate limits | Dev Team | Jul 22 | Waiting on vendor |
| A5 | Prepare UAT test environment | QA Team | Jul 25 | Not started |

---

## Evidence Notes

- Cost forecast EAC derived from actuals through Jul 14 plus remaining plan adjusted for +7 day delay. Basis: PM estimate.
- Milestone forecast dates assume no recovery. PM has indicated a recovery plan is being prepared.
- No RAID log exists for this project. Status was compiled from email, meeting notes, and schedule updates.
