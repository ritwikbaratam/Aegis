# Project status — 20 November 2026 (IST)

## Delivered

- Local-first Node 24 REST API, browser SPA and persistent SQLite.
- Distinct employee, technician and admin dashboards, protected workflows, SLA monitoring, audit history, in-app notifications and simulated email.
- Configurable assignment strategies, explainable priority and category rules, access-scoped duplicate linking, SLA-risk prediction, escalations and Service Pulse.
- User, technician, service, category, SLA and strategy administration. Incident filters, date/category reporting and CSV.
- Academic report in Markdown, HTML and PDF. UML, ER, OOP explanation, requirements matrix, tests and demo script are included.

## Earlier verification

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

## Phase 3

- BITS IT Support uses the supplied BITS Pilani emblem on the sign-in screen, sidebar, About page, favicon, and orbital loader. The reusable wordmark raises the I and T.
- Dashboard rows separate priority, title, incident ID, service, and status. The header stays in page flow. Cards and forms reflow on narrow screens, with wide tables scrolling inside their panels.
- The account menu provides a read-only profile, role-specific user guide, About, confirmed sign-out, and local appearance preferences. It supports Light, Dark, and System themes, five accents, appearance reset, and reduced motion.
- The orbital loader covers startup, successful sign-in, and administrator dashboard refresh. Startup failures offer a retry.
- Node passed 42 tests and Edge passed 12 smoke groups. Responsive checks covered 320, 390, 768, 1120, and 1440 pixels. A two-process check reconfirmed persistence with an isolated SQLite file.

## Phase 4

- Smart Fix Suggestions ranks viewable resolved incidents using shared symptoms, phrases, service, category, and resolution wording. The incident's Related & knowledge tab explains each match and labels curated guidance when historical matches are unavailable.
- SLA Rescue gives administrators a prioritized queue with response or resolution countdowns, an explanation for each risk, and suggested next steps. Manual reminders use the existing audit trail and both notification channels.
- The local Hyderabad library photograph appears on sign-in and in the employee, technician, and administrator dashboard headings. The BITS wordmark uses stronger weight and accent color on the I and T, with all letters on the same baseline.
- Phase 4 passed 53 backend tests, syntax checks, and 14 Edge smoke groups. A separate Node process reopened the isolated database and confirmed the historical match, SLA breach, and persisted reminder deduplication.

## Boundaries

Local email is simulated. SLA targets use continuous calendar time and are configurable by priority. Service-specific SLA overrides are not implemented. The demo uses fictional seeded accounts and local bearer sessions. The group must supply its team details and record the presentation.

Account editing and password changes are unavailable. Menu controls support keyboard navigation. The application has no global shortcuts.

See [test evidence](testing/TEST_RESULTS.md), [requirements matrix](requirements/COMPLIANCE_MATRIX.md), and [demo script](demo/DEMO_SCRIPT.md).
