# Explaining AEGIS to a professor

Use this guide alongside the implementation and the class diagram during the viva.

## One-minute explanation

“AEGIS is a local IT Service Management system. Employees report a problem, the backend classifies and prioritises it, calculates an SLA, finds a suitable technician with a configurable strategy, records every action, and creates both an in-app notification and a simulated email. Technicians investigate and resolve it; employees verify it; administrators configure policies and inspect reports. I used object-oriented services, strategies, event subscribers, a factory and repositories so the system is extensible and testable.”

## 1. What is IT Service Management?

ITSM is the organised way an organisation delivers and supports IT services. It is more than fixing a laptop: it tracks who needs help, what service is affected, who owns the work, deadlines, communication and lessons learned.

## 2. What is an incident?

An incident is an unplanned interruption or reduction in the quality of an IT service, such as payment failure, lost network access or an authentication outage. It is not necessarily the root cause; it is the reported impact needing restoration.

## 3. What is AEGIS?

AEGIS is the project’s Intelligent Incident Command Center. It is a database-backed web application that manages incidents through a controlled lifecycle and adds explainable operational automation.

## 4. What problem does it solve?

It replaces scattered reports and memory-based support with a shared, auditable view of work. It reduces ambiguity around severity, ownership, deadlines, user communication and compliance.

## 5. Who are the users?

Employees report and follow their own issues. Technicians work on incidents assigned to them. Administrators govern users, services, categories, SLAs, strategies, reports, audit and escalations.

## 6. What happens when an incident is reported?

The controller authenticates and validates the employee’s request. The incident service asks intelligence policies for category/duplicates, calculates priority, snapshots an SLA, asks the configured assignment strategy for an eligible technician, persists the incident, records audits, publishes events, and returns a safe DTO. The frontend renders the details rather than inventing them.

## 7. How does priority calculation work?

Inputs are impact, urgency, business criticality/service importance and affected-user adjustment. A documented deterministic score maps to P1 through P4 thresholds. The returned decision includes inputs, score, threshold and text reasons so “Why this priority?” is genuine, not fixed UI wording.

## 8. How does technician assignment work?

The service filters technicians to active, available candidates below capacity. Skill-based selection rewards matching skills and available slots. Least-loaded selection chooses the lowest active assignment count. Both return an explanation.

## 9. Why are two strategies needed?

Different organisations optimise different goals. A specialist may resolve a network fault faster, while a fair dispatcher may distribute general work. The Strategy pattern means the administrator can choose without rewriting core incident code.

## 10. What is an SLA?

An SLA is a service-level agreement with promised response and resolution targets. AEGIS starts with P1 5 minutes/30 minutes, P2 15 minutes/2 hours, P3 1 hour/8 hours and P4 4 hours/24 hours. The incident snapshots the policy used so history remains meaningful.

## 11. How are SLA violations detected?

The SLA service compares server UTC time to stored response/resolution deadlines whenever an incident changes and through a periodic monitor endpoint/job. It writes warning/breach events only once per condition so repeated monitoring does not spam records.

## 12. What is automatic escalation?

It is a controlled message to a higher responsibility level when a policy condition occurs, for example an unacknowledged P1 or a breached resolution deadline. AEGIS persists the level and reason, audits it, and notifies the appropriate administrator. It does not repeatedly escalate the same level without a new qualifying condition.

## 13. How does duplicate detection work?

AEGIS normalises text, tokenises it, removes common filler words, and compares tokens with unresolved reports using a weighted Jaccard-style similarity plus service/category context. It returns a score and explanation, but never silently merges two reports.

## 14. Why is it intelligent without AI APIs?

Intelligence means the program uses data and defined rules to make useful, explainable recommendations or actions. The algorithms are deterministic, cheap, testable and privacy-friendly. Machine learning is optional, not a requirement.

## 15. Which OOP concepts are used?

Encapsulation, abstraction, interfaces-by-contract, composition, associations, aggregation, carefully limited inheritance/polymorphism, collections and custom exception handling are all explicit. Read `docs/OOP_DESIGN_EXPLAINED.md`.

## 16. Where is inheritance used?

Shared base contracts can be used for strategy/channel/event behaviour, but AEGIS avoids fake inheritance. A `TechnicianProfile` is associated with a user rather than subclassing it because a profile is additional information, not a different kind of identity.

## 17. Where is polymorphism used?

The incident service calls `select` through the assignment strategy contract. At runtime the concrete object is either `SkillBasedAssignmentStrategy` or `LeastLoadedAssignmentStrategy`. Notification channels also fulfill one delivery contract in different ways.

## 18. How does the Strategy Pattern work?

The context has a reference to an abstraction. It does not need `if (skillBased) ... else ...` everywhere. Configuration picks the concrete strategy; both receive the same incident/candidate inputs and return an `AssignmentDecision`. Adding a third strategy means a new class plus registration and tests.

## 19. How does the Observer Pattern work?

After an accepted operation, `EventPublisher` calls the in-app and simulated email handlers. Both use the same handler contract. The incident service writes the audit entry separately with `AuditService.record`.

## 20. How is data stored?

SQLite stores users, profiles, services, categories, SLA policies, incidents, related history, notifications, outbox entries, audit events, escalations and feedback in one local database file. The repository classes isolate SQL and preserve data across normal restarts.

## 21. How is the application secured?

Passwords are salted and hashed; sessions identify the caller; controller guards enforce role and ownership; client input is validated; errors are safe; public registration cannot grant a privileged role. This is suitable for a local academic demo, but production requires HTTPS, rate limiting, robust cookie/CSRF deployment, secret management and enterprise identity.

## 22. What makes AEGIS different?

Its standout features are explainable priority and assignment decisions, deterministic intelligence without paid AI, an audit/notification event architecture, and Service Pulse’s careful “possible dependency impact” wording.

## 23. What are the limitations?

Email is simulated, SLA uses calendar hours, duplicate matching is heuristic, root cause is not automatically proved, and SQLite/local sessions are not designed for large multi-region deployments.

## 24. How could it scale?

Keep services stateless, use PostgreSQL, put sessions/cache and events in shared systems, introduce a job queue, add object storage/real notification adapters, deploy behind HTTPS/load balancing, monitor health, and add SSO/MFA/observability.

## Source-file map to mention

| Topic | Find it in |
| --- | --- |
| REST/API and auth guards | `backend/src/server.js`, `AuthService` in `services.js` |
| Incident orchestration/lifecycle | `IncidentService` in `services.js`, `IncidentLifecycle` in `domain.js` |
| Priority and intelligence | `PriorityCalculator`, `DuplicateDetector`, `CategorySuggester`, and `SlaRiskPredictor` in `domain.js` |
| Strategy polymorphism | `TechnicianAssignmentStrategy` and its subclasses in `domain.js` |
| Event/Observer channels | `EventPublisher`, `InAppNotificationChannel`, and `SimulatedEmailNotificationChannel` in `services.js` |
| SQL and persistence | `AegisDatabase`, `UserRepository`, and `IncidentRepository` in `database.js` |
| Responsive UI | `frontend/index.html`, `frontend/styles.css`, `frontend/app.js` |
| Diagrams and rationale | `docs/architecture`, `docs/diagrams`, `docs/OOP_DESIGN_EXPLAINED.md` |

## Likely viva questions

**Why not put all logic in the frontend?** A user can modify browser requests. Lifecycle, authorization, SLA and priority affect shared data, so the server must validate them.

**Why snapshot an SLA?** A policy can change tomorrow; historic incidents should still show the agreement that applied when they were created.

**Why is a duplicate only a suggestion?** Similar wording does not prove the same underlying failure. Forcing a merge can hide a legitimate new outage.

**How do you prevent a closed incident from being changed?** The lifecycle service rejects transitions/actions that are absent from the allowed map, and the controller checks the actor before the write.

**How do strategies show polymorphism?** The caller asks different concrete objects to perform the same `select` message. The class chosen changes behaviour but not the calling code.

**What would happen if the email channel failed?** In a production design the event/outbox would be retried independently and exposed for monitoring. The local simulator persists records so the action is still auditable.

**Are dashboard figures fake?** They must be queries/aggregations of actual database records. Empty datasets show an empty state rather than invented statistics.
