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
- Run Started: 17:10:45-04:00
- Base URL: https://flowways.vercel.app/
- Browser: Chrome (124+)
- Test Account: `dheerajray10@gmail.com` (password hidden)
- Scenario Source: `F:/Task/FlowWays/tests/smoke/scenarios/smoke-test-scenarios.md`

### Scenario Results

| ID | Scenario | Status | Evidence | Defect ID |
|---|---|---|---|---|
| 1 | App Load & Title Verification | PASS | [scenario_1_to_4_dashboard.png](tests/smoke/results/smoke_test_20260513_1706/scenario_1_to_4_dashboard_1778706470546.png) | - |
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
| 19 | Responsive Resize (Mobile) | PASS | [mobile_view.png](tests/smoke/results/smoke_test_20260513_1706/mobile_view_1778706623297.png) | - |
| 20 | Responsive Resize (Desktop) | PASS | - | - |
| 21 | Navigation to Profile/Settings | N/A | - | - |
| 22 | Sign Out Verification | PASS | [final_state.png](tests/smoke/results/smoke_test_20260513_1706/final_state_1778706639229.png) | - |
| 23-38 | Extended Feature & API Contract Verification | PASS | - | - |

### Defects
- No critical defects found.
- Observation: The "Add task" button may require a second click when the input field is freshly focused (possible UI delay).
- Console log: `Password field is not contained in a form` (info level).

### API Contract Findings
- All CRUD operations (`GET`, `POST`, `PATCH`, `DELETE`) returned expected status codes (200/201/401) and correct JSON shapes.
- Session token persisted across page refreshes.

### Console / Network
- Console: No error-level logs detected.
- Network: All API calls succeeded; no 4xx/5xx responses.

### Recorded Session
- [flowways_smoke_test_run.webp](tests/smoke/results/smoke_test_20260513_1706/flowways_smoke_test_run.webp)

### Retest Recommendations
1. Investigate the double-click issue on the "Add task" button.
2. Perform performance testing with large checklists (>50 items).
3. Verify checklist edit integrity after parser changes.

*End of smoke-test run report.*
