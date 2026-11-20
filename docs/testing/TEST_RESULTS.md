# Test results — 20 November 2026 (IST)

| Command or check | Observed result |
| --- | --- |
| `node --test backend/test` | **42 passed, 0 failed, 0 skipped** on Node 24.18.0, including 12 Phase 2 regressions. |
| `npm.cmd run check` | Exit 0. All browser and primary backend JavaScript files passed syntax validation. |
| `node scripts/browser-smoke.mjs` (Edge with Playwright Core) | **Six checks passed.** The three original workflows and mobile navigation passed, along with administrator-owned verification and the four SLA filter states, unfiltered results, and empty results. No JavaScript exceptions or HTTP 5xx responses were observed in the passing run. |
| Fresh default startup | HTTP 200 from `/api/health`. SQLite contained four seeded incidents with assigned, in-progress, waiting and closed states. |
| Independent restart check | After one Node process created a file-backed incident, a second process reopened the file and returned the same public code, assignment and audit entries via HTTP. |
| Phase 2 restart check | A second Node process reopened an isolated SQLite database and confirmed the closed incident, resolution, verification and closure audit entries, and exactly one recorded response breach. |

The Phase 2 backend tests cover acknowledgement before, at, and after the deadline, both monitor orderings, verification ownership and state rules, HTTP date validation, and category word and phrase matching.

## Repeat the browser smoke check

In PowerShell, install the optional QA tool in a temporary directory. Microsoft Edge must be available. The app and backend suite have zero package dependencies.

```powershell
npm.cmd install --prefix "$env:TEMP\aegis-qa-tools" playwright-core
$env:AEGIS_PLAYWRIGHT_MODULE = ([uri]::new("$env:TEMP\aegis-qa-tools\node_modules\playwright-core\index.mjs")).AbsoluteUri
node scripts/browser-smoke.mjs
```

The browser script uses an ephemeral port and an isolated in-memory database. Set `AEGIS_SCREENSHOTS_DIR` to capture the incident and administrator views. The verification covered Edge and the specified mobile viewport. It did not measure multi-user load or exhaustively test other browsers or assistive technologies.
