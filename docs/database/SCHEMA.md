# Database design and schema notes

## Persistence choice

AEGIS stores its local data in a file-backed SQLite database at `backend/data/aegis.db`. SQLite gives the project genuine relational persistence, referential links, indexes, and restart durability without a remote service. The database is created and seeded only when needed; it must not be re-seeded over a user's existing data on every start.

## Core tables

| Table | Purpose | Important fields / constraints |
| --- | --- | --- |
| `users` | Accounts for all roles | unique lowercased email; password hash; role constrained to EMPLOYEE/TECHNICIAN/ADMINISTRATOR; active flag |
| `sessions` | Opaque local login sessions | unique token hash; user FK; expiry; revocable |
| `users` technician fields | Technician skills and capacity | `skills` JSON, `available`, and `capacity` in the account row |
| `it_services` | Managed services | unique name; criticality 1-3; active flag |
| `categories` | Configurable classification | unique name, keyword JSON, active flag |
| `sla_policies` | Editable response/resolution targets | unique priority and positive minute targets |
| `system_configuration` | Selected assignment strategy | key/value pair persisted across restarts |
| `incidents` | Current and historical incident state | globally unique public incident number; reporter/category/service FKs; controlled status; priority; timestamps; immutable initial SLA snapshot fields |
| `incident_assignments` | Assignment/reassignment history | incident, current or former technician, actor, reason, strategy and timestamp |
| `investigation_notes` | Technician investigation record | incident and author FKs; server timestamp |
| `incident_comments` | Request-for-information and reply conversation | incident, author, body, timestamp |
| `incident_relationships` | Related/possible duplicate incidents | source/related IDs; similarity/reason; unique pair; no self-link |
| `audit_events` | Append-only historical actions | timestamp, actor, role, incident, action, old/new value, metadata |
| `notifications` | In-app notification inbox | recipient, message, link/incident, read timestamp |
| `simulated_emails` | Local email-outbox simulator | recipient, subject, body, delivery status, incident, timestamp |
| `sla_breaches` | Breach history | incident, breach type, detected timestamp, unique incident/type. Warnings use flags and audit events. |
| `escalations` | Escalation levels and reason | incident, level, reason, destination, timestamp; prevent duplicate level |
| `feedback` | Employee assessment after closure | incident, employee, rating 1-5, comment |
| `service_dependencies` | Service Pulse graph edges | parent/child service FKs; unique edge; no self-edge |

## Keys, integrity, and indexes

- Internal IDs are integer primary keys. Public incident numbers use `INC-YYYYMMDD-####` with the UTC creation date.
- Foreign keys are enabled in SQLite. Historic data uses restrictive/no-cascade semantics rather than deleting audit or incident history when a user/service is deactivated.
- The server validates enum values and numeric ranges before writes; SQLite constraints supply a second safety net.
- The incident index set covers status, priority, reporter, assignee and creation time. Audit indexes use incident and time. Notifications index recipient, read time and creation time.
- Status, priority, SLA outcomes, and role permissions are always evaluated server-side; they are not trusted from UI values.

## SLA snapshot policy

At creation, an incident copies its applicable policy's targets and deadlines. Editing a policy changes future snapshots. Admin priority edits through the UI preserve the original deadlines. The API also accepts an explicit `recalculateSla` flag and audits the choice. Historical breach records are retained.

## Seed data

The seed creates Riya Shah, Avery Morgan and four technicians, plus six services and categories. The payment outage begins assigned and response-overdue. Campus Wi-Fi is under investigation, Student Portal is waiting for information, and the backup failure is closed. The script generates those records from the creation clock on an empty database.

## Persistence verification

The persistence test procedure is:

1. Create an incident through the authenticated API.
2. Stop and restart the Node server without deleting `backend/data/aegis.db`.
3. Authenticate again and fetch the same incident by ID.
4. Confirm its public number, reporter, assignment, status, and audit timeline remain.

The two-process check passed. See [test results](../testing/TEST_RESULTS.md).
