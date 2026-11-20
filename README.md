# AEGIS - Intelligent Incident Command Center

AEGIS is a locally runnable IT Service Management (ITSM) and incident-resolution system for the CS F213 / MAC F212 OOP project. It supports the incident journey from **reporting** through **classification, prioritisation, assignment, investigation, resolution, verification, and closure**.

The application is deliberately local-first: a Node.js 24 server, a persistent SQLite database, and a responsive browser UI. It does not need API keys, Docker, or a cloud account.

## Core capabilities

- Separate employee, technician, and administrator experiences with server-side role checks.
- Persistent registration, opaque session login, salted scrypt password hashing, and protected APIs.
- Incident lifecycle rules, explainable deterministic priority scoring, configurable priority-to-SLA policies, and response/resolution monitoring.
- Interchangeable skill-based and least-loaded technician assignment strategies.
- Persistent in-app notifications and a simulated email outbox driven by domain events.
- Audit timeline, duplicate incident suggestions, rule-based category suggestions, SLA risk, escalations, and historical-resolution recommendations.
- Search/filtering, real database-derived reports, CSV export, administration screens, and Service Pulse dependency awareness.

## Prerequisites

- Windows, macOS, or Linux
- Node.js **24 or newer** (`node --version`)

No `npm install` is required for the self-contained implementation. Node 24 supplies the HTTP, crypto, test, and SQLite modules used by AEGIS.

## Launch on Windows / VS Code

Open the repository folder in VS Code and run:

```powershell
./scripts/start.ps1
```

Or launch directly:

```powershell
node backend/src/server.js
```

Then open [http://localhost:8080](http://localhost:8080). The server delivers the frontend directly. There is no compilation or bundling step.

On macOS/Linux:

```bash
sh ./scripts/start.sh
```

## Development-only demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Administrator | `admin@aegis.local` | `Admin@12345` |
| Employee | `employee@aegis.local` | `Employee@12345` |
| Technician — applications | `jamie.apps@aegis.local` | `Technician@12345` |
| Technician — network | `alex.network@aegis.local` | `Technician@12345` |

These are intentionally seeded local demonstration accounts, not production credentials.

## Test and quality commands

```powershell
node --test backend/test
npm.cmd run check
```

See [test cases](docs/testing/TEST_CASES.md), [test results](docs/testing/TEST_RESULTS.md), and [project status](docs/PROJECT_STATUS.md). Test-result status is updated only after the corresponding command runs.

## Reset demo data

Start with a new database path to get a fresh demo while keeping your existing records:

```powershell
$env:AEGIS_DATABASE_PATH = "backend/data/rehearsal.db"
node backend/src/server.js
```

After stopping the server, use `Remove-Item Env:AEGIS_DATABASE_PATH` to return to the default database. Demo seeding is disabled when `NODE_ENV=production`.

The optional browser smoke script uses Playwright Core and an installed Microsoft Edge. These are only needed for browser QA. See [verification instructions](docs/testing/TEST_RESULTS.md).

## Project map

```text
frontend/            Browser SPA: UI, routing, accessibility, API client
backend/src/          HTTP controllers, domain services, SQLite repositories
backend/test/         Automated Node test suite
backend/data/         Ignored local SQLite runtime database
docs/                 Requirements, architecture, OOP, diagrams, tests, report, demo
scripts/              Cross-platform start scripts
```

## Architecture at a glance

`Browser UI -> REST controllers -> application services -> repositories -> SQLite`

The class-based design uses `PriorityCalculator`, `TechnicianAssignmentStrategy` and its two implementations, `IncidentLifecycle`, `EventPublisher`, persistent notification channels, repositories, and domain errors.

Read [architecture](docs/architecture/ARCHITECTURE.md), [OOP design](docs/OOP_DESIGN_EXPLAINED.md), and the [beginner-friendly professor guide](docs/EXPLAIN_TO_PROFESSOR.md) before a presentation.

The submission materials include the [PDF report](output/pdf/AEGIS_PROJECT_REPORT.pdf), [requirements matrix](docs/requirements/COMPLIANCE_MATRIX.md), [UML and ER diagrams](docs/diagrams), and [demo script](docs/demo/DEMO_SCRIPT.md).

## Known limitations

- Email is simulated and kept in the administrator-visible local outbox; it never sends external mail.
- SLA targets use continuous calendar time, not office-hour calendars.
- Sessions are suitable for a local academic demonstration; a production deployment needs HTTPS-only cookies, CSRF protection tuned to the chosen hosting model, rate limiting, secret management, monitoring, backups, and an enterprise identity provider.
- Reports reflect the local SQLite database only.

## Submission checklist

- [x] Run the automated tests and record the result.
- [ ] Start the application and rehearse all three workflows in `docs/demo/DEMO_SCRIPT.md`.
- [ ] Review the requirements matrix and disclose any partial item.
- [ ] Replace team-member placeholders in the demo material.
- [ ] Record the required presentation separately; no video is included in this repository.
