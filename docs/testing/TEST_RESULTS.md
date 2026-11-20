# Test results — 20 November 2026 (IST)

| Command or check | Observed result |
| --- | --- |
| `node --test backend/test` | **53 passed, 0 failed, 0 skipped** on Node 24.18.0, including 11 Phase 4 tests and all 42 baseline tests. |
| `npm.cmd run check` | Exit 0. All browser and primary backend JavaScript files passed syntax validation. |
| `node scripts/browser-smoke.mjs` (Edge with Playwright Core) | **14 smoke groups passed.** Retests all three roles, the incident lifecycle, notifications, reports, SLA filters, appearance, and sign-out. Checks real historical suggestions, clearly labelled fallback, SLA Rescue access, deadline refresh, reminders, campus branding and mobile layout. No JavaScript exceptions or HTTP 5xx responses were observed. |
| Fresh default startup (earlier check) | HTTP 200 from `/api/health`. SQLite contained four seeded incidents with assigned, in-progress, waiting and closed states. |
| Independent restart (earlier check) | After one Node process created a file-backed incident, a second process reopened the file and returned the same public code, assignment and audit entries via HTTP. |
| Phase 3 isolated restart | A separate Node process reopened the test database and confirmed the incident remained closed, with resolution, verification and closure audit entries and exactly one response breach. |
| Phase 4 isolated restart | A separate Node process reopened the test database and confirmed the historical recommendation, closure audit, response breach, and that a replayed reminder produced no second audit or simulated email. |

The Phase 2 backend tests cover acknowledgement before, at, and after the deadline, both monitor orderings, verification ownership and state rules, HTTP date validation, and category word and phrase matching.

The Phase 4 tests cover Wi-Fi and authentication terminology, case and punctuation, contextual scoring and sorting, missing and unrelated history, staff access and redaction, curated fallback, exact response and resolution deadlines, inactive lifecycle states, missed acknowledgement, warning and breach deduplication, queue urgency, and the administrator reminder API.

## Repeat the browser smoke check

In PowerShell, install the optional QA tool in a temporary directory. Microsoft Edge must be available. The app and backend suite have zero package dependencies.

```powershell
npm.cmd install --prefix "$env:TEMP\aegis-qa-tools" playwright-core
$env:AEGIS_PLAYWRIGHT_MODULE = ([uri]::new("$env:TEMP\aegis-qa-tools\node_modules\playwright-core\index.mjs")).AbsoluteUri
node scripts/browser-smoke.mjs
```

The browser script uses an ephemeral port and an isolated in-memory database. Set `AEGIS_SCREENSHOTS_DIR` to capture the dashboard, sign-in screen, loader, account menu, incident detail, Smart Fix, and SLA Rescue. The long-title check used 1440, 1120, 768, 390, and 320 pixels. Browser coverage is limited to Edge.
