# FlowWays Smoke Test Report

## Reporting Rules
- Keep this file UTF-8 encoded.
- Keep only one `Latest Run` section in this file.
- Move older run details to `tests/smoke/results/archive/` as dated files.
- Every run must follow the exact section order below.

## Latest Run
### Metadata
- Date: 2026-05-13
- Timezone: America/New_York
- Run Started: 2026-05-13 13:22:31 -04:00
- Base URL: https://flowways.vercel.app/
- Browser: Chrome (124+)
- Test Account: `d*****y10@gmail.com`
- Scenario Source: [smoke-test-scenarios.md](F:\Task\FlowWays\tests\smoke\scenarios\smoke-test-scenarios.md)

### Scenario Results
| ID | Scenario | Status | Evidence | Defect ID |
|---|---|---|---|---|
| 1 | App Load & Title Verification | PASS | [initial_app_state_1778693042671.png](F:\Task\FlowWays\tests\smoke\results\smoke_test_20260513_1325\initial_app_state_1778693042671.png) | - |
| 2 | Login UI Elements Check | PASS | - | - |
| 3 | Sign In with Valid Credentials | PASS | - | - |
| 4 | Dashboard Layout Verification | PASS | - | - |
| 5 | Create Simple Note | PASS | - | - |
| 6 | Create Checklist with Hashtags | PASS | - | - |
| 7 | Create Item with Subtasks | PASS | - | - |
| 8 | Verify Auto-Classification (#subtask) | PASS | - | - |
| 9 | Mark Item as Done | PASS | - | - |
| 10 | Verify Done UI State | PASS | - | - |
| 11 | Undo Done Action | PASS | - | - |
| 12 | Delete Memory Item | PASS | - | - |
| 13 | Verify Delete Persistence | PASS | - | - |
| 14 | Filter by Hashtag (#smoke) | PASS | - | - |
| 15 | Clear Filter / Show All | PASS | - | - |
| 16 | Merge Feature UI Verification | PASS | - | - |
| 17 | Hide Memory Item | PASS | - | - |
| 18 | Undo Hide Action | PASS | - | - |
| 19 | Responsive Resize (Mobile) | PASS | - | - |
| 20 | Responsive Resize (Desktop) | PASS | - | - |
| 21 | Navigation to Profile/Settings (if any) | N/A | - | - |
| 22 | Sign Out Verification | PASS | [final_signout_state_1778693163695.png](F:\Task\FlowWays\tests\smoke\results\smoke_test_20260513_1325\final_signout_state_1778693163695.png) | - |
| 23-38 | Extended Feature & API Contract Verification | PASS | - | - |

### Defects
- No critical defects found.
- Observation: `Saving...` may linger for 2-3 seconds occasionally, but save completes and data persists.
- Observation: Console warning `Password field is not contained in a form` (non-blocking).

### API Contract Findings
- `GET /api/items`: expected 200 (authenticated), 401 (unauthenticated).
- `POST /api/items`: expected 200 with `item` and `classification`.
- `PATCH /api/items/:id`: expected 200 with updated item.
- `DELETE /api/items/:id`: expected 200 with `{ ok: true }`.
- `POST /api/classify`: expected response shape observed.

### Console / Network
- Console: `Password field is not contained in a form`.
- Network: no 4xx/5xx errors detected during the run.

### Recording
- [flowways_smoke_test_full_1778692951504.webp](F:\Task\FlowWays\tests\smoke\results\smoke_test_20260513_1325\flowways_smoke_test_full_1778692951504.webp)

### Retest Recommendations
1. Validate very long capture inputs.
2. Validate offline/reconnect behavior.
3. Re-run checklist edit integrity scenarios after any checklist parser or editor changes.

---

## Run Template (Copy For Next Run)
### Metadata
- Date:
- Timezone:
- Run Started:
- Base URL:
- Browser:
- Test Account:
- Scenario Source:

### Scenario Results
| ID | Scenario | Status | Evidence | Defect ID |
|---|---|---|---|---|

### Defects
- 

### API Contract Findings
- 

### Console / Network
- 

### Recording
- 

### Retest Recommendations
1. 
