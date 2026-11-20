# MASTER AUTONOMOUS DEVELOPMENT PROMPT
## AEGIS — Intelligent IT Service Management & Incident Resolution System
### Complete OOP Semester Project | CS F213 / MAC F212 | Semester I 2026–2027

## 0. YOUR ROLE AND MISSION

You are acting as an autonomous senior full-stack software engineer, software architect, UI/UX designer, object-oriented programming specialist, database engineer, QA engineer, and technical documentation writer.

Your responsibility is to **design, implement, integrate, test, debug, document, and prepare a complete working academic software project** called:

**AEGIS — Intelligent IT Service Management & Incident Resolution System**

This project must satisfy the official 17-page OOP assignment specification and aim to perform strongly across all evaluation criteria totaling 120 marks.

I am a student using VS Code with Codex. I want an actual working, locally executable, database-backed application, not a mockup, conceptual architecture, set of pseudocode files, or unfinished frontend.

You must execute the project autonomously using the permissions and tools already available.

### Autonomous execution instructions

1. Do not repeatedly ask me what to implement next.
2. Do not stop after providing an implementation plan.
3. Do not request confirmation for routine architecture decisions, file creation, package installation, development commands, testing, or ordinary workspace changes when your environment already permits them.
4. Make reasonable technical decisions independently and document them.
5. Create, edit, organize, and complete actual source files in the workspace.
6. Run installations, application builds, tests, and debugging commands whenever permitted.
7. Fix errors and retry instead of immediately asking me to intervene.
8. Continue from one subsystem to the next without waiting for additional prompts.
9. Do not bypass operating-system protections, tool approval boundaries, authentication requirements, or sandbox restrictions.
10. If a necessary operation is blocked, attempt a permitted alternative, document the blocker, and continue all other feasible work.
11. Do not delete existing working project code or unrelated files without examining them first.
12. Do not execute destructive cleanup commands on unrelated directories or use force-push.
13. Do not commit secrets, API keys, credentials, or machine-specific private configuration.
14. Never claim functionality is working unless it has been implemented and appropriately verified.
15. Complete as much of the actual application as possible in this single uninterrupted task.

**CRITICAL: I want you to build the project, not simply respond with instructions telling me how to build it.**

---

# 1. READ THE OFFICIAL PROJECT SPECIFICATION

The official assignment PDF should be present at:

`docs/reference/OOP_S1_2026-2027_Project.pdf`

It may also be named:

`OOP_S1_2026-2027_Project.pdf`

Find the actual PDF in the project workspace and read all 17 pages.

Treat the official assignment as the source of truth for compulsory requirements.

Do not replace the official requirements with your own generic interpretation of an ITSM product.

If the PDF is not available locally, use the comprehensive requirements included in this prompt and record that the original document could not be inspected in the execution environment.

The project concerns managing the entire incident lifecycle:

**REPORT → CLASSIFY → PRIORITIZE → ASSIGN → INVESTIGATE → RESOLVE → VERIFY → CLOSE**

Mandatory categories include:

- User management: Employee, Technician, Administrator
- Incident management
- Priority management
- Technician assignment using at least two strategies
- SLA calculation and deadline monitoring
- SLA violation detection
- At least two notification mechanisms
- Complete audit history
- At least five search/filter criteria
- At least two intelligent or automated features
- Persistent storage
- Sound object-oriented architecture
- At least two actual design patterns
- Authentication, authorization, and basic security
- Reports and analytics
- Documentation, architecture diagrams, UML, database design
- At least 15 meaningful documented test cases
- At least three complete demonstration workflows

Do not consider the project complete if any of these mandatory areas is missing.

## Project deadline

The official PDF states a hard submission deadline of **22 November 2026**.

Therefore, prioritize a completely working, understandable, well-tested application over unnecessary infrastructure or difficult third-party integrations.

Implement advanced features only after the mandatory application is functional.

---

# 2. INSPECT AND PRESERVE MY EXISTING PROJECT

The workspace is expected to contain the existing `AEGIS` project.

Before modifying anything:

1. Inspect the complete existing folder structure.
2. Identify the programming languages, frameworks, package files, configuration, and existing application functionality.
3. Identify which features already work.
4. Identify incomplete or broken code.
5. Identify whether a frontend or backend already exists.
6. Identify any Git repository and uncommitted changes.
7. Read any existing README, AGENTS.md, development notes, and reference documentation.
8. Preserve functional code and relevant user work.
9. Reuse existing dependencies and architecture where appropriate.
10. Refactor or replace weak implementations only when there is a clear benefit.
11. Avoid creating a second unrelated project inside this project.

Create `docs/PROJECT_AUDIT.md` explaining:

- Existing implementation
- Missing assignment requirements
- Existing defects
- Architectural decisions
- Changes made
- Preserved components

If the existing project is empty or unusable, initialize the application cleanly.

Do not duplicate entire source trees or leave confusing directories such as `final-final`, `new-project`, or `project-v2`.

---

# 3. TECHNOLOGY STACK AND ARCHITECTURE

Use a professional but manageable technology stack that demonstrates OOP clearly.

## Preferred stack for a new implementation

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- Lucide icons
- Recharts for dashboard analytics
- React Router
- A small, consistent component library
- Responsive HTML/CSS

### Backend
- Java 21
- Spring Boot
- Maven
- Spring Web
- Spring Data JPA
- Spring Security
- Bean Validation
- Appropriate application-level services and domain objects

### Database
- H2 file-based relational database for easy local execution and persistent storage
- Use an appropriate relational schema and JPA entities
- Ensure the data survives application restarts

### Testing
- JUnit 5
- Mockito
- Spring Boot integration tests
- Frontend component tests where practical
- Browser-level tests where the environment supports them

### Documentation
- Markdown
- Mermaid diagrams
- PlantUML if useful and available
- A print-ready project report

Use compatible stable versions of packages. Verify actual API compatibility rather than assuming examples from older versions are valid.

## Existing code exception

If the workspace already has a functioning technology stack, preserve that stack where reasonable.

Do not unnecessarily rewrite an almost-complete application merely to use Java.

However, the final architecture must clearly demonstrate the required object-oriented concepts.

If you choose to retain an existing TypeScript or other OOP-capable backend, explicitly document how its classes, interfaces, inheritance, polymorphism, encapsulation, and design patterns meet the assignment's expectations.

## Architecture requirements

Use a clean layered or modular architecture:

**React UI → REST Controllers → Application Services → Domain Objects / Business Rules → Repositories → Database**

Avoid placing all business logic directly inside API controllers or frontend components.

Use explicit domain classes and interfaces.

Separate presentation, business logic, and persistence.

Do not use unnecessary microservices, Kubernetes, cloud infrastructure, or paid services.

The default application must run locally without requiring API keys or third-party accounts.

---

# 4. PROJECT BRANDING AND UI DESIGN

Create an impressive, consistent, and professional interface.

Project name: **AEGIS**

Product subtitle: **Intelligent Incident Command Center**

Design inspiration:

- Modern enterprise SaaS dashboards
- Incident operations centers
- Clean administrative interfaces
- Professional cybersecurity and DevOps software

Do not directly copy a proprietary product interface.

## Visual requirements

- Refined deep-navy and neutral color palette
- Teal/cyan accents
- Amber warnings
- Red critical alerts
- Green success/resolution indicators
- Consistent rounded cards
- Clean typography
- Modern icons
- Comfortable spacing
- Responsive layouts
- Attractive tables and analytics
- Smooth but restrained transitions
- Professional hover, focus, and active states

Add light/dark theme support if practical without jeopardizing compulsory functionality.

Use a distinctive AEGIS wordmark or simple CSS/SVG logo.

Do not spend excessive time generating decorative assets.

## UI quality standards

Every interactive control must have a purpose.

Implement:

- Proper navigation
- Searchable data tables
- Search and filter controls
- Pagination or appropriate handling of longer lists
- Status and priority badges
- Loading states
- Empty states
- Success messages
- Validation errors
- Confirmation before destructive actions
- Helpful error screens
- Accessible labels
- Keyboard-accessible forms
- Toast notifications
- Responsive sidebar navigation
- Consistent page headers and breadcrumbs

Avoid:
- Decorative buttons that do nothing
- Fake analytics unrelated to database records
- Broken navigation links
- Placeholder content presented as functionality
- Oversized unnecessary animations
- Unreadable dashboards
- Hardcoded incident totals
- Inconsistent interfaces

## Role-based visual experience

The UI must change according to the user's role.

### Employee
Simple, user-friendly support portal emphasizing incident reporting and tracking.

### Technician
Operational workspace emphasizing assigned incidents, acknowledgements, investigation, workload, and SLA urgency.

### Administrator
Management dashboard emphasizing team workload, escalations, service health, SLA violations, configuration, and analytics.

The three roles must not simply see identical dashboards with different headings.

---

# 5. USER MANAGEMENT AND AUTHENTICATION

Implement real backend authentication and role-based authorization.

## Roles

### EMPLOYEE
Can:
- Register
- Log in and log out
- Report an incident
- View their incidents
- Track progress
- Supply more details
- Respond to technician requests
- Read resolutions
- Verify or reject a proposed resolution as appropriate
- Provide feedback

### TECHNICIAN
Can:
- Log in
- View assigned incidents
- Acknowledge assignments
- Investigate incidents
- Add notes
- Request information
- Update permitted statuses
- Provide resolution details
- Resolve incidents
- View workload and deadlines

### ADMINISTRATOR
Can:
- Manage users
- Manage technicians
- Create and update IT services
- Configure incident categories
- Configure SLA policies
- Select assignment strategies
- Monitor incidents
- Perform authorized manual reassignment
- Inspect escalations
- View audit logs
- View all reports
- Monitor service health

## Authentication security

Implement:

- Password hashing
- Secure login verification
- Backend authorization checks
- Restricted API endpoints
- Validation of all inputs
- Prevention of unauthorized role escalation
- Appropriate session or token handling
- Secure cookie/CSRF handling where applicable
- Proper error responses
- No plaintext password storage

Do not allow public users to register themselves as administrators or technicians.

Use administrator-managed creation of privileged accounts.

Create development-only demo accounts with clearly documented credentials.

Demo credentials must be seeded locally and must never be presented as secure production credentials.

---

# 6. COMPLETE INCIDENT MANAGEMENT

Create a real persistent incident model.

Every incident should include:

- Unique incident ID
- Incident title
- Detailed description
- Reporter ID
- Reporter name
- Incident category
- Affected IT service
- Impact
- Urgency
- Business criticality
- Number of affected users
- Automatically calculated priority
- Creation timestamp
- Current lifecycle status
- Assigned technician
- Assignment history
- Acknowledgement timestamp
- Investigation notes
- Resolution information
- Resolution timestamp
- Verification information
- Closure timestamp
- SLA policy snapshot
- Response deadline
- Resolution deadline
- SLA warning and breach indicators
- Related incident references
- Feedback where available
- Full audit history

The backend must enforce required fields, valid references, and allowed operations.

## Incident creation process

When an employee submits an incident:

1. Validate input.
2. Create a unique incident ID.
3. Identify or suggest an incident category.
4. Look up the affected service.
5. Retrieve business criticality.
6. Calculate priority.
7. Determine applicable SLA.
8. Calculate deadlines.
9. Check for similar incidents.
10. Identify an appropriate technician.
11. Assign automatically if eligible.
12. Record audit events.
13. Generate notifications.
14. Persist the incident.
15. Display the resulting incident to the reporter.

This must be an integrated backend workflow, not a collection of unrelated frontend simulations.

## Incident lifecycle

Support:

`NEW → CLASSIFIED → ASSIGNED → ACKNOWLEDGED → IN_PROGRESS → RESOLVED → VERIFIED → CLOSED`

Include a carefully controlled waiting-for-information state if helpful.

Implement legitimate transitions, role restrictions, and meaningful preconditions.

Examples:

- An employee cannot directly close a newly created incident.
- A technician cannot resolve an unrelated incident without authorization.
- A resolved incident must have a resolution description.
- Verification requires a proposed resolution.
- Closure requires the appropriate verification/closure process.
- Closed incidents should not be arbitrarily edited.

If you introduce reopening, define and test those transitions.

Use a state-transition service or actual State pattern.

Document the reason for the chosen lifecycle design.

---

# 7. INTELLIGENT PRIORITY CALCULATION

Implement automated priority determination.

**Do not use a paid AI service.**

Create a clear, deterministic, explainable priority algorithm.

## Inputs
- Impact
- Urgency
- Business criticality
- Number of affected users
- Affected service

Use a documented scoring approach.

For example:

`baseScore = impact × urgency × businessCriticality`

Use integer levels of 1–3 for impact, urgency, and business criticality.

Optionally add a small, documented affected-user adjustment.

Provide well-defined thresholds for:

- P1 — Critical
- P2 — High
- P3 — Medium
- P4 — Low

Keep threshold logic deterministic and testable.

## Explainable Priority feature

This is a distinctive AEGIS feature.

On the incident details page, include an **"Why this priority?"** explanation.

Example:

"Priority P1 was assigned because the payment service has critical business importance, urgency is high, and a large number of users are affected."

Display:
- Input values
- Calculated score
- Priority threshold
- Final priority
- Reasons

This explanation must come from the actual priority calculation, not hardcoded frontend text.

Allow authorized administrators to change incident impact/urgency and trigger proper recalculation with audit logging.

Document any policy on whether recalculation changes active SLA deadlines.

---

# 8. TECHNICIAN ASSIGNMENT — TWO REAL STRATEGIES

Implement at least two interchangeable technician assignment strategies.

Use the **Strategy Design Pattern**.

Create an interface such as:

`TechnicianAssignmentStrategy`

Implement at least:

### Strategy A — Skill-based intelligent assignment

Consider:
- Technician skill tags
- Required incident category
- Availability
- Current workload
- Workload capacity
- Relevant experience
- Previous service experience, if tracked

Recommend or assign the most appropriate available technician.

Use consistent and documented scoring/tie-breaking logic.

### Strategy B — Least-loaded assignment

Find an available technician with sufficient capacity and assign based primarily on active workload.

Use deterministic tie-breaking.

### Optional Strategy C — Round Robin

Implement only if the main system and testing are already complete.

## Strategy configuration

Administrators must be able to select the current assignment strategy in the actual UI.

Store the selected strategy persistently.

Changing the strategy must affect subsequent incident assignments.

Allow manual technician reassignment by an authorized administrator with a recorded reason.

## Explainable Assignment feature

Display an assignment explanation such as:

"Assigned to Technician Alex because their Network skill matches the incident, they are available, and they currently have 2 of 6 active incident slots occupied."

Handle:
- No matching technician
- Technician unavailable
- Workload exceeded
- No technicians registered
- Manual reassignment
- Technician becoming unavailable

If no technician is eligible, keep the incident safely unassigned and notify administrators.

Do not silently assign to an invalid technician.

---

# 9. SLA MANAGEMENT

Implement actual Service Level Agreement calculations.

Use configurable priority-based policies, with service-specific overrides where appropriate.

Use the following initial policy from the specification:

| Priority | Response target | Resolution target |
|---|---|---|
| P1 | 5 minutes | 30 minutes |
| P2 | 15 minutes | 2 hours |
| P3 | 1 hour | 8 hours |
| P4 | 4 hours | 24 hours |

These are initial configurable defaults, not immutable hardcoded rules.

## Required SLA functionality

- Determine applicable policy
- Persist policy information
- Calculate response deadline
- Calculate resolution deadline
- Record actual acknowledgement time
- Record actual resolution time
- Detect overdue response
- Detect overdue resolution
- Generate advance warning
- Persist SLA breach events
- Show SLA status on relevant dashboards
- Provide administrator controls for policy editing

Use server-side timestamps as the authoritative source.

Store timestamps consistently in UTC and present user-friendly local times.

Clearly document whether the application uses calendar time or business hours.

For this academic implementation, continuous calendar time is acceptable if consistently documented.

## SLA monitoring

Implement a scheduled server-side monitoring service if feasible.

It should:
- Evaluate active incidents periodically
- Detect approaching deadlines
- Detect breaches
- Trigger notifications
- Avoid duplicate breach records
- Avoid sending identical alerts repeatedly

Also recalculate relevant SLA status when an incident changes.

An incident resolved after its deadline must retain the historical SLA violation.

## SLA visualizations

Display:
- Time remaining
- Overdue duration
- Response SLA
- Resolution SLA
- Warning indicators
- Breach status

For active incidents, show meaningful progress bars or countdown displays.

Do not merely display a static label.

---

# 10. NOTIFICATION SYSTEM — TWO MECHANISMS

Implement at least two genuinely distinguishable notification channels.

Use a modular notification interface such as:

`NotificationChannel`

### Mechanism 1 — In-app notifications

Implement persistent notifications displayed within AEGIS.

Support:
- Unread count
- Notification list
- Mark as read
- Relevant incident links
- Timestamps

### Mechanism 2 — Simulated email notifications

Implement an email notification simulator.

A local email outbox should persist:
- Recipient
- Subject
- Message body
- Timestamp
- Associated incident
- Delivery simulation status

Create a simple admin-accessible page to inspect these simulated emails.

This mechanism must use actual generated notification events; it should not be a decorative static inbox.

External SMTP, SMS gateways, paid services, and API keys are not required.

## Notification events

Notify appropriate recipients when:
- Incident created
- Technician assigned
- Assignment changed
- Priority changed
- Technician acknowledged
- Additional information requested
- User replied
- SLA approaching
- SLA violated
- Escalation occurred
- Incident resolved
- Incident verified
- Incident closed

Use an event-driven design or Observer Pattern so new notification channels can be added later.

Prevent duplicate notifications from repeated polling.

---

# 11. COMPLETE AUDIT HISTORY

Every important incident action must create a persistent audit record.

Include:
- Event ID
- Timestamp
- Actor ID
- Actor role
- Incident ID
- Action type
- Old state/value
- New state/value
- Description
- Relevant metadata

Examples:

- Incident created
- Category suggested/selected
- Priority calculated
- Technician assigned
- Technician acknowledged
- Investigation started
- Note added
- SLA warning generated
- SLA violation detected
- Escalation triggered
- Resolution submitted
- Verification performed
- Incident closed

Build an attractive incident timeline component.

Administrators must be able to view and filter audit events.

Use server-generated audit events, not manually constructed frontend examples.

Avoid allowing ordinary users to modify or delete audit records.

---

# 12. INTELLIGENT AUTOMATED FEATURES

Implement multiple meaningful intelligent features without requiring machine learning, external AI integration, or paid APIs.

The PDF requires at least two.

**Prioritize the first four features below.**

## Feature 1 — Duplicate Incident Detection

When a user submits an incident, check whether similar unresolved incidents already exist.

Implement:
- Text normalization
- Keyword/token extraction
- Stop-word removal where useful
- Similarity scoring
- Category and affected-service matching
- Configurable match threshold

A deterministic method such as weighted Jaccard similarity is acceptable.

Example:
- "Payment application unavailable"
- "Unable to make payment"
- "Payment transactions failing"

These should receive higher similarity when they involve the same affected service.

Display potential duplicates before final submission when possible.

Provide actions to:
- View existing incident
- Continue with a new incident
- Link incidents as related

Do not force automatic merging.

Record related-incident links persistently.

Explain the similarity decision in the UI.

Ensure unrelated incidents with generic similar words are not incorrectly treated as definitely identical.

## Feature 2 — Automatic Escalation

Automatically detect incidents requiring management attention.

Examples:
- P1 incident not acknowledged within its permitted response time
- Technician workload exceeds configured capacity
- Incident approaching a critical SLA deadline
- Resolution SLA violated

Implement a documented escalation policy.

Use a logical escalation chain:
- Assigned technician / support queue
- Team-lead escalation level
- Administrator / IT-manager oversight

You may model escalation levels without adding unnecessary login roles.

Persist:
- Escalation level
- Escalation reason
- Timestamp
- Incident
- Responsible destination/recipient

Generate audit entries and notifications.

Do not repeatedly escalate the same level without a new qualifying condition.

Display escalations on the admin dashboard.

## Feature 3 — SLA Risk Prediction

Implement a deterministic SLA-risk indicator based on:
- Remaining deadline time
- Current lifecycle stage
- Whether an incident has been acknowledged
- Elapsed resolution time
- Priority
- Current assignment status

Display:
- Low risk
- Moderate risk
- High risk
- Already breached

Clearly distinguish a heuristic prediction from an actual recorded SLA violation.

Show a short explanation.

Example:
"This P1 incident is high risk because only 4 minutes remain until the resolution deadline and investigation is still in progress."

No machine learning is necessary.

## Feature 4 — Smart Incident Categorization

Suggest incident categories using rule-based keyword matching.

Example mappings:
- Wi-Fi, router, DNS, VPN → Network
- Login, password, MFA → Authentication
- SQL, query, database → Database
- Crash, application, error → Software/Application
- Server, virtual machine, cloud → Cloud
- Malware, suspicious access → Security

Return:
- Suggested category
- Explanation or matching keywords
- A transparent confidence-like score if implemented

Allow users to override the recommendation.

Do not represent a rule-based score as a statistically calibrated machine-learning probability.

Administrators must be able to manage incident categories.

## Feature 5 — Suggested Resolution

When a technician opens an incident, search previously resolved incidents.

Recommend historical resolutions based on:
- Matching service
- Category
- Similar description
- Previously successful resolutions

Display:
- Related incident
- Similarity reason
- Previous resolution summary

Keep the suggestion optional and technician-reviewed.

Do not automatically declare an incident resolved.

If insufficient historical data exists, show an appropriate empty state.

---

# 13. AEGIS INNOVATION FEATURE — SERVICE PULSE

Implement this only after all mandatory modules are complete.

Create a distinctive feature called:

**Service Pulse — Dependency-Aware Incident Intelligence**

This is a lightweight service-health and incident-correlation feature.

## Concept

IT services often depend on other services.

For example:

- Payment Application → Authentication Service
- Payment Application → Database
- Student Portal → Authentication Service
- Student Portal → Database
- Email Service → Network

When a foundational service experiences incidents, dependent services may also experience problems.

## Implementation

Allow administrators to define service dependencies.

Store service-to-service dependency relationships in the database.

Prevent invalid self-dependencies and preferably prevent cycles.

Create a simple visual dependency graph or clearly structured dependency view.

For services affected by active incidents, show:
- Active incident count
- Critical incident count
- Related dependent services
- Possible downstream impact

Highlight services experiencing clusters of related incidents.

Example:

"If the Authentication Service is unavailable, the Payment Application and Student Portal may also be affected."

**Do not claim a definitive root cause unless there is evidence.**

Label the information as a potential dependency impact.

Allow the administrator to open relevant incidents from the service map.

If graphical visualization threatens core functionality or schedule, implement a simpler working dependency table first.

This feature is intended to be understandable and defensible during a demonstration.

---

# 14. SEARCH, FILTERING, AND REPORTING

Implement at least five meaningful filtering criteria.

Preferably support all of the following:

1. Incident ID
2. Search text/title
3. Status
4. Priority
5. Category
6. Affected service
7. Assigned technician
8. Reporter where authorized
9. Creation date/date range
10. SLA status

Combine filters correctly.

Apply role-based data restrictions on the backend.

## Dashboard analytics

Display real data derived from the persistent database:

- Total incidents
- Active incidents
- Resolved incidents
- Closed incidents
- Critical incidents
- SLA violations
- SLA compliance rate
- Average response time
- Average resolution time
- Incidents by category
- Incidents by priority
- Incidents by status
- Incidents by service
- Technician workload
- Recent incident activity

Use meaningful charts, including:
- Bar chart
- Donut/pie chart
- Trend chart if sufficient date-based data exists
- Technician workload visualization

Handle empty or sparse data gracefully.

## Reporting page

Provide filters by date and category.

Provide CSV export if practical.

Do not use fake charts with data unrelated to the database.

---

# 15. ADMINISTRATION AND CONFIGURATION

Create actual administrative pages for:

## User management
- List users
- Create technician/admin accounts
- Update profile information
- Activate/deactivate accounts
- View user roles

## Technician management
- Edit skills
- Set availability
- Set workload capacity
- Inspect active workload
- View assigned incidents

## IT service management
- Create service
- Edit service
- Assign business criticality
- Activate/deactivate service
- Configure dependencies where implemented

## Category management
- Create categories
- Edit categories
- Manage category keywords for automatic suggestions

## SLA policy management
- View default SLA targets
- Edit SLA targets
- Configure service overrides if supported

## Assignment configuration
- View available strategies
- Switch strategies
- See current strategy

Persist all supported changes.

Prevent unauthorized modification.

---

# 16. OBJECT-ORIENTED DESIGN — HIGH PRIORITY

This is an OOP assignment, not merely a full-stack development assignment.

Demonstrate the following concepts explicitly.

## Encapsulation
Protect internal class state.

Use meaningful constructors, private fields, validation, and carefully controlled methods.

Avoid allowing arbitrary mutation of incident lifecycle fields.

## Abstraction
Use interfaces and services that represent meaningful business behavior.

Example:
- PriorityCalculator
- TechnicianAssignmentStrategy
- NotificationChannel
- IncidentLifecycleService

## Inheritance
Use inheritance where a genuine is-a relationship exists.

Examples may include:
- Appropriate notification types
- Well-justified user hierarchy
- Domain event hierarchy

Do not force inheritance into every class.

## Polymorphism
Demonstrate interchangeable implementations.

For example:

`TechnicianAssignmentStrategy`

implemented by:
- SkillBasedAssignmentStrategy
- LeastLoadedAssignmentStrategy

## Interfaces
Use interfaces to establish clear contracts.

## Composition
Use composition for collaborating domain objects and services.

## Association and Aggregation
Model real relationships between incidents, users, services, technicians, and SLA policies.

## Collections
Use appropriate collections such as:
- List
- Set
- Map
- PriorityQueue where justified

Avoid introducing unnecessary algorithms solely to show off a data structure.

## Exception Handling
Create meaningful domain exceptions for:
- Invalid incident
- Invalid lifecycle transition
- Unauthorized operation
- Service not found
- Technician unavailable
- Capacity exceeded
- Missing SLA policy
- Invalid configuration
- Duplicate user registration
- Invalid input

Translate exceptions into appropriate HTTP responses.

Never return raw server stack traces to normal users.

---

# 17. DESIGN PATTERNS — IMPLEMENT AT LEAST TWO

Prefer to implement these actual patterns.

## Pattern 1 — Strategy

Used for technician assignment.

The selected strategy must affect actual backend behavior.

## Pattern 2 — Observer / Event Publisher

Used for incident events, notifications, and audit processing.

The architecture must make it reasonably easy to add a new subscriber.

## Pattern 3 — Factory

Use a meaningful factory for incident creation, notification creation, or another genuine creation problem.

Do not introduce a trivial factory that merely wraps a constructor without value.

## Pattern 4 — Repository

Use repositories to abstract persistence.

You may use Spring Data repository interfaces.

## Optional State Pattern

If genuinely implemented, use it for lifecycle transitions.

Otherwise describe the actual transition-service implementation accurately rather than claiming a State Pattern that does not exist.

### Documentation requirements

In `docs/OOP_DESIGN_EXPLAINED.md`, document:
- Each OOP principle
- Exact classes implementing it
- Why the design is appropriate
- Exact design patterns
- How polymorphism works
- Why composition was preferred where appropriate
- How additional assignment strategies can be added
- How new notification channels can be added

Include small code examples taken from the actual implementation.

---

# 18. DATABASE DESIGN

Use a proper persistent relational database.

Suggested core entities:

- User
- TechnicianProfile
- ITService
- ServiceDependency
- Incident
- IncidentCategory
- InvestigationNote
- IncidentComment
- IncidentAssignment
- SLAPolicy
- IncidentSLASnapshot
- SLABreach
- Notification
- SimulatedEmail
- AuditEvent
- Escalation
- IncidentRelationship
- Feedback
- SystemConfiguration

This is a suggested model, not a command to create unnecessary tables.

Normalize where sensible.

Add:
- Primary keys
- Foreign keys
- Uniqueness constraints
- Appropriate indexes
- Required-field constraints
- Appropriate cascading rules

Avoid accidentally deleting audit histories or historical incidents when deleting user/service records.

Provide:

`docs/database/SCHEMA.md`

`docs/diagrams/ER_DIAGRAM.md`

A working seed-data mechanism.

## Persistence test

Create an incident, restart the backend, and verify that it still exists.

Document this behavior as a test.

---

# 19. APPLICATION SCREENS AND ROUTES

Build a genuinely navigable application.

## Public screens
- Welcome/login
- Employee registration
- Not-found page
- Unauthorized page

## Employee screens
- Employee dashboard
- New incident form
- My incidents
- Incident details
- Incident activity timeline
- Notifications
- Feedback form
- Profile

## Technician screens
- Technician dashboard
- Assigned incidents
- Incident investigation workspace
- Workload page
- Notifications
- Profile

## Admin screens
- Admin dashboard
- All incidents
- Incident details
- SLA monitor
- Technician management
- User management
- IT service management
- Category management
- SLA configuration
- Assignment settings
- Notifications / simulated email outbox
- Audit logs
- Reports and analytics
- Escalations
- Service Pulse, if implemented

Prefer reusable page layouts and components over copying the same UI repeatedly.

## Incident details page

Make this a showcase screen.

Include:
- Header and status/priority
- Incident metadata
- Current assigned technician
- SLA deadlines
- Impact and urgency
- Priority explanation
- Assignment explanation
- Investigation notes
- Comments/conversation
- Activity timeline
- Suggested resolutions
- Related incidents
- Appropriate status actions
- Resolution details

Use tabs or a clean multi-column layout where helpful.

---

# 20. INTEGRATED API AND BUSINESS LOGIC

Build actual working frontend-to-backend communication.

Possible REST endpoints:

### Authentication
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me

### Incidents
- GET /api/incidents
- POST /api/incidents
- GET /api/incidents/{id}
- PATCH /api/incidents/{id}
- POST /api/incidents/{id}/assign
- POST /api/incidents/{id}/acknowledge
- POST /api/incidents/{id}/start-investigation
- POST /api/incidents/{id}/notes
- POST /api/incidents/{id}/request-information
- POST /api/incidents/{id}/reply
- POST /api/incidents/{id}/resolve
- POST /api/incidents/{id}/verify
- POST /api/incidents/{id}/close
- POST /api/incidents/{id}/feedback

### Intelligence
- POST /api/intelligence/suggest-category
- POST /api/intelligence/check-duplicates
- GET /api/incidents/{id}/related
- GET /api/incidents/{id}/recommendations
- GET /api/incidents/{id}/priority-explanation
- GET /api/incidents/{id}/assignment-explanation

### SLA
- GET /api/sla/policies
- GET /api/sla/violations
- GET /api/sla/monitor

### Administration
- GET /api/admin/users
- GET /api/admin/technicians
- GET /api/admin/services
- GET /api/admin/categories
- GET /api/admin/audit
- GET /api/admin/escalations
- GET /api/admin/assignment-strategy

Include corresponding validated mutation endpoints.

### Reports
- GET /api/reports/overview
- GET /api/reports/workload
- GET /api/reports/services
- GET /api/reports/trends

### Notifications
- GET /api/notifications
- PATCH /api/notifications/{id}/read
- GET /api/admin/email-outbox

Endpoint names can be adjusted to follow a consistent REST convention.

**Do not leave endpoints disconnected from the UI.**

Use DTOs and validation.

Do not expose password hashes or sensitive user properties in public API responses.

Apply backend authorization consistently.

---

# 21. SAMPLE DATA AND DEMONSTRATION ENVIRONMENT

Make the app immediately demonstrable after setup.

Seed realistic fictional data.

Include:
- Several employees
- At least four technicians with differing skills
- One administrator
- Several IT services
- Several categories
- SLA policies
- A variety of incidents
- Historical resolved incidents
- Some active incidents
- Related incidents
- Different priorities
- Examples of SLA warnings and violations
- Notifications and audit histories

Use fictional identities and clearly label the dataset as demo data.

Provide a reliable mechanism to initialize or reset the demo database without destroying unrelated files.

Create demo accounts for all three roles.

Document all demo usernames/passwords in the local development setup instructions.

Seed data should support visual dashboards and the three required demonstrations.

Ensure active incident timestamps are generated relative to the current time so demonstrations remain meaningful on future dates.

Use deterministic test fixtures for time-dependent tests.

---

# 22. THREE COMPLETE DEMONSTRATION WORKFLOWS

Implement and verify these scenarios.

## Demo 1 — Employee Reports Critical Incident

1. Log in as employee.
2. Open new incident form.
3. Report that the payment application is unavailable.
4. System suggests category.
5. System evaluates priority.
6. System calculates SLA.
7. System selects technician.
8. Incident is saved.
9. Employee sees incident details.
10. Technician receives notification.
11. Simulated email is generated.
12. Audit timeline records the actions.

This demonstrates the complete initial workflow.

## Demo 2 — Technician Resolves Incident

1. Log in as assigned technician.
2. Open assigned incident.
3. Acknowledge incident.
4. Begin investigation.
5. Add investigation notes.
6. Request more information if needed.
7. Employee responds.
8. Technician checks relevant SLA information.
9. Technician provides resolution.
10. Mark incident resolved.
11. Employee receives notification.
12. Employee verifies resolution.
13. Incident is closed.
14. Employee provides feedback.
15. Audit history shows the lifecycle.

## Demo 3 — Intelligent Detection and Escalation

1. Employee reports a second issue similar to an existing active incident.
2. Duplicate detection identifies possible related incidents.
3. Similarity explanation appears.
4. Incidents may be linked.
5. Administrator views related incidents.
6. An SLA risk or escalation scenario is demonstrated.
7. Escalation record is generated.
8. Admin notification appears.
9. Admin reviews the situation.
10. Reports reflect the updated operational state.

Provide realistic seeded demo scenarios or safe development-only controls to demonstrate time-sensitive behavior without waiting for actual SLA periods.

Do not fabricate audit records as though actions occurred when they did not.

---

# 23. AUTOMATED TESTING AND QUALITY ASSURANCE

Write at least 15 meaningful documented test cases.

Aim for 20–30 actual automated tests where practical.

Include test cases for:

1. Valid employee registration
2. Duplicate email registration rejected
3. Valid login
4. Invalid login
5. Unauthorized endpoint access rejected
6. Employee cannot access another employee's private incident
7. Valid incident creation
8. Invalid incident input rejected
9. Automatic priority calculation
10. Priority threshold boundary
11. Skill-based assignment
12. Least-loaded assignment
13. Unavailable technician handling
14. Technician workload capacity enforcement
15. Valid lifecycle transition
16. Invalid lifecycle transition
17. SLA response deadline calculation
18. SLA resolution deadline calculation
19. SLA violation detection
20. Duplicate SLA alert prevention
21. Notification creation
22. Audit entry creation
23. Duplicate incident similarity
24. Similarity false-positive handling
25. Category suggestion
26. Admin configuration persistence
27. Role-based authorization
28. Incident persistence across restart or equivalent integration validation
29. Escalation behavior
30. Search and filtering

## Testing standards

Run actual automated tests.

Do not merely generate a list of tests and assume they pass.

Where browser testing is available, exercise complete user workflows through the frontend.

Use Spring Boot integration tests for backend workflows.

Use dependency injection and an injectable Clock for reliable time-dependent tests.

Mock external boundaries where necessary, but test real business logic.

Fix discovered bugs.

Create:

`docs/testing/TEST_CASES.md`

`docs/testing/TEST_RESULTS.md`

Include:
- Test ID
- Scenario
- Inputs/preconditions
- Expected result
- Actual result
- Pass/fail status
- Relevant automated test location

Never mark unexecuted tests as passed.

---

# 24. ERROR HANDLING AND EDGE CASES

Handle realistic failures.

Examples:

- Incorrect password
- Expired or invalid session
- Unauthorized role access
- Invalid incident ID
- Missing service
- Invalid category
- Incident already closed
- Invalid state transition
- Technician unavailable
- Workload capacity reached
- Missing SLA policy
- Duplicate registration
- Empty description
- Invalid impact/urgency value
- Network request failure
- Backend unavailable
- Database exception
- Invalid search query
- No matching search results
- Notification already read
- Multiple users updating the same incident
- Repeated SLA monitoring job

Use appropriate backend exceptions and frontend error messages.

Use transactions where multi-step business operations require consistency.

Avoid partial writes where an incident operation fails halfway through.

---

# 25. PERFORMANCE AND SECURITY

Keep the application efficient and reasonably secure.

Implement:
- Password hashing
- Authorization
- Validation
- Reasonable pagination
- Appropriate database indexing
- Safe query handling
- Controlled CORS configuration
- Protection of administrator endpoints
- No hardcoded production secrets
- Error handling
- Prevention of unauthorized data modification

Use environment configuration where required.

Include `.env.example` or appropriate example application configuration without real secrets.

Do not expose unrestricted debug or demo-reset endpoints in production configurations.

Document:
- Security decisions
- Known limitations
- What production hardening would require

Do not exaggerate security guarantees.

---

# 26. ORGANIZE THE PROJECT PROPERLY

Create a clean and understandable folder structure.

Use something similar to:

```text
AEGIS/
├── README.md
├── AGENTS.md
├── .gitignore
├── frontend/
│   ├── package.json
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── layout/
│   │   │   ├── incidents/
│   │   │   ├── dashboard/
│   │   │   └── notifications/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── employee/
│   │   │   ├── technician/
│   │   │   └── admin/
│   │   ├── routes/
│   │   ├── types/
│   │   ├── utils/
│   │   └── styles/
│   └── ...
├── backend/
│   ├── pom.xml
│   ├── mvnw
│   ├── mvnw.cmd
│   └── src/
│       ├── main/
│       │   ├── java/
│       │   │   └── .../
│       │   │       ├── config/
│       │   │       ├── controller/
│       │   │       ├── domain/
│       │   │       ├── dto/
│       │   │       ├── exception/
│       │   │       ├── repository/
│       │   │       ├── security/
│       │   │       ├── service/
│       │   │       ├── strategy/
│       │   │       ├── notification/
│       │   │       ├── intelligence/
│       │   │       ├── scheduler/
│       │   │       └── events/
│       │   └── resources/
│       └── test/
├── docs/
│   ├── reference/
│   │   └── OOP_S1_2026-2027_Project.pdf
│   ├── requirements/
│   ├── architecture/
│   ├── diagrams/
│   ├── database/
│   ├── testing/
│   ├── demo/
│   ├── report/
│   ├── PROJECT_AUDIT.md
│   ├── PROJECT_STATUS.md
│   ├── OOP_DESIGN_EXPLAINED.md
│   └── EXPLAIN_TO_PROFESSOR.md
├── scripts/
│   ├── start.ps1
│   ├── start.sh
│   └── ...
└── ...
```

Adapt the structure to the actual chosen stack.

Do not generate empty directories or useless files merely to imitate this tree.

Do not overwrite the assignment PDF.

Avoid committing:
- node_modules
- target/build output
- Database runtime files
- Local credentials
- Logs
- Temporary files

---

# 27. COMPLETE DOCUMENTATION DELIVERABLES

The official assignment requires substantial documentation.

Create genuine documentation based on implemented code.

## A. Problem analysis

Explain:
- Organizational problem
- Stakeholders
- Challenges
- Existing manual workflows
- Proposed AEGIS solution
- Assumptions

## B. Requirements specification

Document:
- Functional requirements
- Non-functional requirements
- Role permissions
- Business rules
- Acceptance criteria

## C. System architecture

Create a real architecture diagram showing:
- Frontend
- Backend API
- Authentication
- Incident service
- Priority engine
- Assignment engine
- SLA monitor
- Notification system
- Persistence layer
- Database

## D. UML diagrams

At minimum:

### Use Case Diagram
Include all three roles and principal operations.

### Class Diagram
Include:
- Major classes
- Attributes
- Important methods
- Interfaces
- Inheritance
- Associations
- Aggregation/composition

Ensure the class diagram reflects the actual implementation.

Create additional sequence/activity diagrams for the incident workflow if useful.

## E. Database design

Provide:
- ER diagram
- Tables/entities
- Primary keys
- Foreign keys
- Relationships
- Important constraints
- Sample data

## F. Technology selection report

Answer all nine required questions from the official assignment:

1. Why this programming language?
2. Why this frontend?
3. Why this backend?
4. Why this database?
5. Why this architecture?
6. Which alternatives were considered?
7. What are advantages and limitations?
8. How does the stack support OOP?
9. How would the system scale to many more users?

Be technically accurate.

## G. Testing documentation

Document at least 15 cases and actual results.

## H. Project report

Create a coherent final report in:

`docs/report/PROJECT_REPORT.md`

Also produce a professional print-ready HTML and a PDF if the environment supports reliable PDF generation.

The report should contain:
- Title page
- Project overview
- Problem definition
- Objectives
- Scope
- Architecture
- Major modules
- OOP principles
- Design patterns
- Intelligent algorithms
- Database design
- Security
- UI screenshots where obtainable
- Testing
- Results
- Limitations
- Innovations
- Future improvements
- Conclusion

Use actual project details.

Do not invent test results, screenshots, citations, or deployment links.

## I. Requirements compliance matrix

Create:

`docs/requirements/COMPLIANCE_MATRIX.md`

For every important requirement:
- Requirement ID
- PDF section/page
- Implementation location
- Verification method
- Status

Clearly distinguish:
- Implemented and verified
- Implemented but unverified
- Partially implemented
- Not implemented

Never automatically label everything complete.

---

# 28. MAKE THE PROJECT EASY FOR A BEGINNER TO UNDERSTAND

This is extremely important.

Although you are generating the project, I must understand, demonstrate, and defend it in an academic evaluation and potentially explain it in interviews.

Create:

`docs/EXPLAIN_TO_PROFESSOR.md`

Explain in beginner-friendly language:

1. What is IT Service Management?
2. What is an incident?
3. What is AEGIS?
4. What problem does AEGIS solve?
5. Who are the users?
6. What happens when an incident is reported?
7. How does priority calculation work?
8. How does technician assignment work?
9. Why are two strategies needed?
10. What is an SLA?
11. How are SLA violations detected?
12. What is automatic escalation?
13. How does duplicate detection work?
14. Why is the system considered intelligent without AI APIs?
15. Which OOP concepts are used?
16. Where is inheritance used?
17. Where is polymorphism used?
18. How does the Strategy Pattern work?
19. How does the Observer Pattern work?
20. How is data stored?
21. How is the application secured?
22. What makes AEGIS different?
23. What are the limitations?
24. How could the system be scaled?

Explain both conceptual and code-level operation.

Identify exact relevant source files for important concepts.

Add a short interview-ready explanation of the project.

Provide an appendix with likely professor questions and technically correct answers.

Explain the design choices rather than merely saying they are "best practices."

---

# 29. PRESENTATION AND VIDEO DEMO PREPARATION

The official assignment requires a 15–20 minute group presentation demonstrating at least three workflows.

Create:

`docs/demo/DEMO_SCRIPT.md`

Include:
- A 15–20 minute presentation outline
- Suggested speaking points
- Three complete live workflows
- Exact account to log in with
- Exact incident to open/create
- Which screens to show
- Which feature to explain
- Expected results
- How to switch between employee, technician, and admin
- How to demonstrate SLA behavior
- How to demonstrate intelligent features
- How to demonstrate audit history
- How to show the OOP architecture

Create:

`docs/demo/DEMO_CHECKLIST.md`

Include all preparation steps.

Provide an outline for splitting the presentation among 3–5 team members.

Do not invent member names or claim particular students implemented modules without evidence.

Provide placeholders for real team members and responsibilities.

A genuine recorded presentation must still be made by the students; do not claim a finished video exists without actually producing one.

---

# 30. LOCAL EXECUTION AND DEVELOPER EXPERIENCE

Make running the project as straightforward as possible on Windows using VS Code.

## Setup

Inspect installed tools first:
- Java
- Maven or Maven wrapper
- Node.js
- npm
- Git

Use installed compatible versions where practical.

Do not require Docker or cloud services merely to run the application.

Provide startup scripts, preferably:

`./scripts/start.ps1`

and

`./scripts/start.sh`

These scripts should launch the backend and frontend using the project's documented configuration.

If wrappers or commands need adjustment, implement that properly.

Provide exact startup instructions in the README.

## README requirements

Include:
- Project description
- Features
- Prerequisites
- Installation
- Backend startup
- Frontend startup
- Local URL
- Demo credentials
- Resetting demo data
- Running tests
- Project structure
- Screenshots if available
- Architecture summary
- Known limitations
- Troubleshooting
- Submission checklist

## Final boot verification

Where the environment permits:

1. Install dependencies.
2. Compile backend.
3. Run backend tests.
4. Build frontend.
5. Start backend.
6. Check backend health.
7. Start frontend.
8. Check frontend availability.
9. Exercise authentication.
10. Exercise a complete incident workflow.
11. Verify persistent data.
12. Check browser console and server errors if browser tools are available.
13. Fix failures.

Do not assume compilation success means the application is fully working.

---

# 31. IMPLEMENTATION ORDER — DO NOT SKIP CORE FUNCTIONALITY

You must internally organize work in the following dependency order.

## Phase 1 — Inspect and establish foundation
- Inspect current code
- Read project PDF
- Audit requirements
- Decide stack
- Set up clean project structure
- Configure persistence
- Configure frontend/backend communication

## Phase 2 — Core user functionality
- Authentication
- Roles
- User management
- Services
- Categories
- Incident creation
- Incident listing
- Incident details
- Incident lifecycle

## Phase 3 — Compulsory business automation
- Priority determination
- Technician assignment strategies
- SLA policies
- SLA monitoring
- Notifications
- Audit trails

## Phase 4 — Intelligent features
- Duplicate detection
- Automatic escalation
- SLA risk detection
- Category suggestions
- Historical resolution suggestions

## Phase 5 — Administrative and reporting interfaces
- Role-specific dashboards
- Filtering
- Reports
- Administration screens
- Analytics

## Phase 6 — Innovation and polish
- Service Pulse
- UI refinements
- Accessibility
- Responsive behavior
- Improved explanations

## Phase 7 — Quality assurance
- Unit tests
- Integration tests
- Edge cases
- Security verification
- Complete workflow tests
- Bug fixing

## Phase 8 — Documentation and handover
- Architecture
- UML
- ER diagrams
- Compliance matrix
- Project report
- Presentation guide
- Beginner explanation
- Final README

These phases are for your internal execution, not checkpoints at which to stop and request further instructions.

Do not postpone all testing until the end; continuously test changes.

If time or execution resources become constrained, prioritize completion and verification of compulsory requirements.

---

# 32. FINAL QUALITY REQUIREMENTS

Before declaring completion, check the following.

### Functional completeness
- All three roles work
- Authentication is real
- Authorization is enforced
- Incidents are persistent
- Lifecycle works
- Priority calculation works
- Two assignment strategies work
- SLA tracking works
- SLA violations are detected
- Two notification mechanisms work
- Audit histories persist
- Search and filtering work
- At least two intelligent features work
- Reporting uses real data

### Technical correctness
- Backend compiles
- Frontend builds
- Tests run
- Error handling works
- Core API endpoints function
- Object-oriented abstractions are genuine
- At least two design patterns are demonstrable
- Database survives restart
- No critical hardcoded mock functionality
- No unnecessary external API dependency

### UI quality
- Modern appearance
- Functional navigation
- Responsive layout
- Proper forms
- Clear validation
- Useful dashboards
- Role-specific experiences
- No dead buttons
- No obviously unfinished screens

### Academic requirements
- Problem analysis completed
- Requirements specification completed
- Architecture diagram completed
- UML diagrams completed
- Database documentation completed
- Technology rationale completed
- Source code organized
- At least 15 test cases documented
- Three workflows demonstrable
- Report prepared
- Presentation script prepared

### Honesty requirements
- No fabricated tests
- No fabricated screenshots
- No fabricated external integrations
- No false production-readiness claims
- No hidden critical blockers
- No hardcoded dashboard statistics masquerading as real analytics

---

# 33. CONTINUOUS SELF-REVIEW

As development progresses:

1. Review code for bugs.
2. Look for unused components.
3. Check that API calls correspond to actual endpoints.
4. Check database relationships.
5. Check role restrictions.
6. Check error handling.
7. Check UI responsiveness.
8. Check lifecycle restrictions.
9. Check the SLA rules.
10. Check documentation against actual implementation.

When you find a bug, fix it and rerun the relevant tests.

Do not stop merely because files have been generated.

The deliverable is a working integrated system, not a large collection of files.

Maintain a concise `docs/PROJECT_STATUS.md` containing:
- Completed features
- Verification evidence
- Remaining limitations
- Current blockers
- Next executable steps if any work remains

Do not mark unfinished work as complete.

---

# 34. FINAL HANDOVER RESPONSE

Only after completing the feasible implementation and validation, provide a concise final report to me containing:

### 1. What was built
Summarize the complete application and implemented modules.

### 2. What works
Identify verified functional features.

### 3. What could not be completed
Clearly disclose incomplete or unverified requirements.

### 4. How to launch
Provide exact Windows VS Code terminal commands.

### 5. Demo accounts
Provide local demonstration usernames and passwords.

### 6. How to demonstrate
Explain the three workflows in simple terms.

### 7. Tests
Provide actual test counts and pass/fail results.

### 8. Project files
Identify important source folders and documentation locations.

### 9. Innovations
Explain the implemented intelligent features without exaggeration.

### 10. Professor preparation
Explain where I can find the beginner-friendly architecture and OOP notes.

Do not simply respond "Project completed successfully" without evidence.

---

# 35. FINAL EXECUTION DIRECTIVE

You have the complete assignment requirements, technical direction, UI expectations, intelligent feature specifications, testing obligations, documentation requirements, and implementation priorities.

**START IMPLEMENTING NOW.**

Inspect the workspace, read the official project specification, preserve useful existing work, and then autonomously build the full AEGIS application.

Do not stop at planning.

Do not generate only frontend code.

Do not create nonfunctional placeholders for mandatory features.

Do not substitute hardcoded demo screens for actual functionality.

Complete the database, backend, frontend, OOP architecture, intelligent algorithms, testing, documentation, and demo preparation.

Use your available tools to write files, run commands, inspect errors, test, debug, and repair problems.

Make reasonable decisions without repeatedly asking me questions.

Operate within the permissions provided by the execution environment. If an action requires an unavailable permission or credential, do not bypass that protection; document the issue and continue everything else.

Prefer a reliable, fully working, polished project over excessive complexity.

**Your ultimate objective is a complete, demonstrable, maintainable, professional AEGIS project that fulfills the official OOP requirements and that a student can genuinely understand and defend.**

BEGIN EXECUTION.