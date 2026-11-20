# Requirements specification

## Stakeholders and problem

Modern organisations depend on services such as payment, network, database, authentication, and user portals. When a service fails, informal support via messages or spreadsheets makes it difficult to know who owns the issue, how urgent it is, whether a response deadline is missed, and what happened afterward. AEGIS provides a traceable incident lifecycle with role-specific workspaces.

## Functional requirements

| ID | Requirement | Acceptance criterion |
| --- | --- | --- |
| FR-01 | Employee registration/login | Public registration creates only an EMPLOYEE; valid credentials create a usable session |
| FR-02 | RBAC | Employee, technician, and admin protected operations reject unauthorized actors |
| FR-03 | Incident reporting | Valid report creates a persistent numbered incident with reporter, category/service, priority, SLA and audit data |
| FR-04 | Lifecycle | Only valid `NEW -> CLASSIFIED -> ASSIGNED -> ACKNOWLEDGED -> IN_PROGRESS -> RESOLVED -> VERIFIED -> CLOSED` actions succeed |
| FR-05 | Priority | Impact, urgency, service/business criticality, and affected users produce deterministic P1-P4 explanation |
| FR-06 | Assignment | Skill-based and least-loaded strategies select only eligible technicians; admin can change strategy/reassign |
| FR-07 | SLA | P1 5m/30m; P2 15m/2h; P3 1h/8h; P4 4h/24h defaults can be monitored/edited and breach history persists |
| FR-08 | Notifications | Relevant events create both in-app entries and simulated-email outbox rows |
| FR-09 | Audit | Important actions append immutable server-side timeline events |
| FR-10 | Intelligence | At least two meaningful features: duplicate detection, category suggestion, SLA risk, escalation, historical suggestions |
| FR-11 | Search/reporting | Combine at least five filters and calculate real data-driven analytics/export |
| FR-12 | Administration | Admin manages users, technicians, services, categories, SLAs, and assignment configuration |
| FR-13 | Demonstration | Seed data supports three end-to-end workflows |

## Non-functional requirements

| ID | Requirement |
| --- | --- |
| NFR-01 | Local install must not require paid APIs, Docker, or cloud credentials. |
| NFR-02 | User input is validated; password hashes and session controls are never exposed in API DTOs. |
| NFR-03 | SQLite data persists across a normal server restart. |
| NFR-04 | UI works on common desktop widths and adjusts for narrower screens; keyboard labels and focus states are provided. |
| NFR-05 | Dashboards, filters, and reports use database records rather than static totals. |
| NFR-06 | Errors use clear, safe messages and appropriate HTTP statuses. |
| NFR-07 | Code must make OOP abstractions, patterns, and exception boundaries understandable to a beginner. |

## Role permissions

| Operation | Employee | Technician | Administrator |
| --- | --- | --- |
| Register self | Yes, employee only | No | No |
| Report and view own incidents | Yes | No | All incidents |
| Reply / verify / feedback | Own incidents | Request information | Oversight as needed |
| Acknowledge / investigate / resolve | No | Assigned incidents | Monitored/authorized operations |
| Manage user/service/category/SLA configuration | No | No | Yes |
| Change assignment strategy / manual reassignment | No | No | Yes |
| View audit / outbox / reports / escalations | Own timeline only | Assigned timelines | Yes |

## Key business rules

1. Normal employees cannot create privileged accounts or view another employee's private incident.
2. A resolved incident must contain a resolution description; verification follows resolution; closure follows verification.
3. A technician must be active, available, have capacity, and be authorized before an assignment is made.
4. SLA timestamps are server-generated UTC calendar-time values. Breaches are historic facts and are not erased by a later resolution.
5. No duplicate detector auto-merges reports. It presents explainable possible relationships only.
6. Audits and notifications originate from accepted backend operations, not frontend examples.
