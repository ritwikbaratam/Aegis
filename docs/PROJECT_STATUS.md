# Project status — 20 November 2026 (IST)

## Delivered

- Local-first Node 24 REST API, browser SPA and persistent SQLite.
- Distinct employee, technician and admin dashboards, protected workflows, SLA monitoring, audit history, in-app notifications and simulated email.
- Configurable assignment strategies, explainable priority and category rules, access-scoped duplicate linking, SLA-risk prediction, escalations and Service Pulse.
- User, technician, service, category, SLA and strategy administration. Incident filters, date/category reporting and CSV.
- Academic report in Markdown, HTML and PDF. UML, ER, OOP explanation, requirements matrix, tests and demo script are included.

## Verification

- Node: 42 passed, 0 failed, 0 skipped, including the original 30 tests.
- Edge: Six checks passed, covering the original workflows and mobile checks plus administrator-owned verification and SLA filtering.
- Startup: health endpoint responded with SQLite active and four seeded incidents.
- Persistence: newly created incident, assignment and audit survived reopening in a separate Node process.
- PDF: all five printed pages rendered and visually inspected.

## Phase 2 fixes

- Acknowledgements after the response deadline record a breach through the existing audit, notification and reporting paths. The existing breach guard prevents duplicates. An acknowledgement at the deadline is on time.
- Administrators can verify an incident they reported. The state machine still requires resolution before verification and verification before closure.
- The incident register uses the four backend SLA status values. Incident and report date filters share UTC calendar-date validation.
- Category suggestions match complete words and contiguous phrases, with Wi-Fi normalized to the configured `wifi` keyword.
- An isolated two-process restart preserved the tested incident's closure status, resolution, verification and closure audit entries, and its single response breach.

## Boundaries

Local email is simulated. SLA targets use continuous calendar time and are configurable by priority. Service-specific SLA overrides are not implemented. The demo uses fictional seeded accounts and local bearer sessions. The group must supply its team details and record the presentation.

See [test evidence](testing/TEST_RESULTS.md), [requirements matrix](requirements/COMPLIANCE_MATRIX.md), and [demo script](demo/DEMO_SCRIPT.md).
