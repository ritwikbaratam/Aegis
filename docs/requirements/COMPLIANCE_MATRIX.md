# Assignment compliance matrix

Official source: [OOP assignment](../reference/OOP_S1_2026-2027_Project.pdf). Page numbers refer to the PDF.

| ID | Requirement | PDF pp. | Implementation | Verification | Status |
| --- | --- | --- | --- | --- | --- |
| FR-01–02 | Three roles, registration, authentication and RBAC | 4–5, 13 | `AuthService`, protected routes, role workspaces | Core auth/RBAC cases + Edge | Verified |
| FR-03–04 | Persistent incident and full lifecycle | 3–6, 7 | `IncidentService`, `IncidentLifecycle`, SQLite | Lifecycle tests + Edge workflow 1–2 | Verified |
| FR-05 | Automatic priority | 6 | `PriorityCalculator`, priority explanation panel | Priority and creation tests + Edge | Verified |
| FR-06 | At least two assignment strategies | 4, 6–7 | Both subclasses of `TechnicianAssignmentStrategy` | Strategy tests + admin settings smoke | Verified |
| FR-07 | Deadline calculation, tracking and breach detection | 4, 7 | `IncidentService.monitorSla`, policy forms and live SLA timer | Snapshot/breach tests + Edge | Verified for priority policies |
| FR-08 | Two notification mechanisms | 4, 8 | `InAppNotificationChannel`, `SimulatedEmailNotificationChannel` | Persistence tests + Edge outbox | Verified |
| FR-09 | Full audit history | 4, 8 | `AuditService`, timeline and audit console | Event test + Edge incident timeline | Verified for exercised actions |
| FR-10 | At least two intelligent features | 4, 9–10 | Category, duplicate, SLA risk, escalation and history | Algorithm tests + Edge workflows | Core verified. Historical suggestions have limited seed coverage. |
| FR-11 | Five filters and database-derived reports | 4, 8–9 | Incident register, reports, CSV | Compound filters, report assertions, Edge filters and export | Verified |
| FR-12 | Administration | 4–5 | `AdminService` and admin routes/views | Settings and authorization tests + Edge | Core verified |
| NFR-03 | Persistent database | 4, 13–14 | `AegisDatabase`, file-backed SQLite | Reopen and two-process restart | Verified |
| NFR-04 | Different user views and GUI navigation | 17 | Role-scoped dashboards and sidebar | Edge desktop and mobile | Verified in Edge |
| DOC-01 | OOP and at least two patterns | 10–11 | Strategy, Observer, Factory, Repository | Class diagram and OOP design review | Implemented |
| DOC-02 | Analysis, requirements, architecture, UML, schema, rationale, test documentation, PDF report | 14–15 | `docs/` and `output/pdf/` | Artifact review and PDF visual check | Delivered |
| DOC-03 | 15–20 minute group video with at least 3 workflows | 15 | Demo script and checklist | Workflows passed in browser automation | Student recording pending |

Service-specific SLA overrides, a real email gateway and production hosting are outside the delivered demo. See the [test results](../testing/TEST_RESULTS.md) for verification details.
