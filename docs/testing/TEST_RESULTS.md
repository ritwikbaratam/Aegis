# Test results — 20 November 2026 (IST)

| Command or check | Observed result |
| --- | --- |
| `node --test backend/test` | **42 passed, 0 failed, 0 skipped** on Node 24.18.0, including 12 Phase 2 regressions. |
| `npm.cmd run check` | Exit 0. All browser and primary backend JavaScript files passed syntax validation. |
| `node scripts/browser-smoke.mjs` (Edge with Playwright Core) | **12 smoke groups passed.** Covers all three roles, incident reporting and notifications, the technician workflow through closure, administration and reporting, administrator-owned verification, SLA filters, mobile navigation, branding, layout, account menu, appearance, and loading and sign-out. No JavaScript exceptions or HTTP 5xx responses were observed. |
| Fresh default startup (earlier check) | HTTP 200 from `/api/health`. SQLite contained four seeded incidents with assigned, in-progress, waiting and closed states. |
| Independent restart (earlier check) | After one Node process created a file-backed incident, a second process reopened the file and returned the same public code, assignment and audit entries via HTTP. |
| Phase 3 isolated restart | A separate Node process reopened the test database and confirmed the incident remained closed, with resolution, verification and closure audit entries and exactly one response breach. |

The Phase 2 backend tests cover acknowledgement before, at, and after the deadline, both monitor orderings, verification ownership and state rules, HTTP date validation, and category word and phrase matching.

## Repeat the browser smoke check

In PowerShell, install the optional QA tool in a temporary directory. Microsoft Edge must be available. The app and backend suite have zero package dependencies.

```powershell
npm.cmd install --prefix "$env:TEMP\aegis-qa-tools" playwright-core
$env:AEGIS_PLAYWRIGHT_MODULE = ([uri]::new("$env:TEMP\aegis-qa-tools\node_modules\playwright-core\index.mjs")).AbsoluteUri
node scripts/browser-smoke.mjs
```

The browser script uses an ephemeral port and an isolated in-memory database. Set `AEGIS_SCREENSHOTS_DIR` to capture the dashboard, sign-in screen, loader, account menu, and incident detail. The Phase 3 run covered desktop, laptop, tablet, and mobile widths in Edge. The long-title check used 1440, 1120, 768, 390, and 320 pixels. Browser coverage is limited to Edge.
