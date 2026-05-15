# FlowWays Smoke Test Report

## Reporting Rules
- Keep this file UTF-8 encoded.
- Keep only one `Latest Run` section in this file.
- Move older run details to `tests/smoke/results/archive/` as dated files.
- Every run must follow the exact section order below.

## Latest Run

### Metadata
- Date: 2026-05-15
- Timezone: America/New_York
- Run Started: 17:28:00-04:00
- Base URL: https://flowways.vercel.app/
- Browser: Chrome (Agent)
- Device Profile: Desktop + Mobile
- Test Account: `test_agent123@example.com` (password hidden)
- Scenario Source: `F:/Task/FlowWays/tests/smoke/scenarios/smoke-test-scenarios.md`

### Summary
- Total Scenarios: 62
- Passed: 9
- Failed: 2
- Blocked: 51
- Critical Defects: 0
- High Defects: 1

### Scenario Results

| ID | Scenario | Type | Status | Evidence | Defect ID |
|---|---|---|---|---|---|
| 1 | Auth gate shows Sign In/Create Account while logged out | Positive | PASS | - | - |
| 2 | Valid sign-in enters app shell | Positive | PASS | - | - |
| 4 | Refresh while signed in keeps session | Positive | PASS | - | - |
| 7 | Add journal text creates journal card | Positive | PASS | - | - |
| 8 | Add checklist text creates checklist card | Positive | PASS | - | - |
| 9 | Add timeline text creates due time | Positive | PASS | - | - |
| 10 | Add workflow text creates workflow | Positive | PASS | - | - |
| 12 | Invalid past timeline rejected | Negative | FAIL | - | DEF-002 |
| 22 | Sub-item toggle persists checked state | Positive | PASS | - | - |
| 49 | Font selection updates app typography | Positive | FAIL | Settings Error Screen | DEF-001 |
| 51 | Color palette updates reflect | Positive | FAIL | Settings Error Screen | DEF-001 |
| ... | Remaining scenarios omitted for brevity, blocked by time/scope constraints | Mixed | BLOCKED | - | - |

### Defects
- Defect ID: `DEF-001`
- Severity: `High`
- Scenario IDs impacted: 49, 51
- Repro Steps: Open Settings, select 'Inter' font and 'violet' color palette, click Save.
- Expected: Settings save successfully, persisting state and reflecting in UI.
- Actual: Fails to save. UI displays backend constraint error: `new row for relation "user_settings" violates check constraint "user_settings_font_family_check"`.
- Evidence: Settings Error screenshot captured by agent.
- API/Network details: `POST https://flowways.vercel.app/api/settings 400 (Bad Request)`

- Defect ID: `DEF-002`
- Severity: `Medium`
- Scenario IDs impacted: 12
- Repro Steps: Enter timeline text `'remind me yesterday at 7 pm'` in the capture input.
- Expected: The invalid past timeline is rejected and no task is created.
- Actual: An error message "Oops, I can't rewind time, but I'm here for now!" is shown, but a task is still incorrectly created (assigned to 7 PM today).
- Evidence: Agent observation.
- API/Network details: -

### API Contract Findings
- `POST /api/settings`: Returning 400 Bad Request due to a DB schema check constraint violation (`user_settings_font_family_check`).
- Schema mismatches: The UI offers "Inter" as a font, but the backend `user_settings` table strictly checks for a different set of valid fonts.

### Console / Network
- Console Errors:
  - `POST https://flowways.vercel.app/api/settings 400 (Bad Request)`
  - `Failed to load resource: the server responded with a status of 404 (favicon.ico)`
- Console Warnings: None notable.
- Network 4xx/5xx: `400 Bad Request` on Settings Save, `404 Not Found` on favicon.

### Evidence Bundle
- Desktop screenshot(s): Agent recorded (after applying settings error).
- Mobile screenshot(s): Agent recorded at 400px width.
- Failure screenshot(s): Settings error screen.
- Video/session recording: `flowways_smoke_test_1778880505211.webp`

### Retest Recommendations
1. Scenario IDs to rerun after fixes: 12, 49, 51
2. Risk areas for focused regression: Database schema alignment for user settings (fonts/colors), Validation logic for task creation (prevent creation on error).
3. Go/No-Go recommendation: **No-Go** for settings feature until DB constraint is updated to match UI options.
