# Test results — 20 November 2026 (IST)

| Command or check | Observed result |
| --- | --- |
| `node --test backend/test` | **30 passed, 0 failed, 0 skipped** on Node 24.18.0. All assertions in `core.test.js` passed. |
| `npm.cmd run check` | Exit 0. All browser and primary backend JavaScript files passed syntax validation. |
| Edge smoke automation | All three workflows passed. Critical report, category suggestion, duplicate link, role transfers, request/reply, investigation, resolution, verification, closure, feedback, SLA configuration, technician editing, strategy switching, escalations, outbox, report filters and CSV were exercised. Mobile navigation at 390px passed. No JavaScript exceptions or HTTP 5xx responses were observed. |
| Fresh default startup | HTTP 200 from `/api/health`. SQLite contained four seeded incidents with assigned, in-progress, waiting and closed states. |
| Independent restart check | After one Node process created a file-backed incident, a second process reopened the file and returned the same public code, assignment and audit entries via HTTP. |

## Repeat the browser smoke check

In PowerShell, install the optional QA tool in a temporary directory. Microsoft Edge must be available. The app and backend suite have zero package dependencies.

```powershell
npm.cmd install --prefix "$env:TEMP\aegis-qa-tools" playwright-core
$env:AEGIS_PLAYWRIGHT_MODULE = ([uri]::new("$env:TEMP\aegis-qa-tools\node_modules\playwright-core\index.mjs")).AbsoluteUri
node scripts/browser-smoke.mjs
```

The browser script uses an ephemeral port and an isolated in-memory database. Set `AEGIS_SCREENSHOTS_DIR` to capture the incident and administrator views. The verification covered Edge and the specified mobile viewport. It did not measure multi-user load or exhaustively test other browsers or assistive technologies.
