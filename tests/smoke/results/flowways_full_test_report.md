# FlowWays Smoke Test Report

## Reporting Rules
- Keep this file UTF-8 encoded.
- Keep only one `Latest Run` section in this file.
- Move older run details to `tests/smoke/results/archive/` as dated files.
- Every run must follow the exact section order below.

## Latest Run

### Metadata
- Date: YYYY-MM-DD
- Timezone: America/New_York
- Run Started: HH:MM:SS-04:00
- Base URL: https://flowways.vercel.app/
- Browser: Chrome (version)
- Device Profile: Desktop + Mobile
- Test Account: `masked@example.com` (password hidden)
- Scenario Source: `F:/Task/FlowWays/tests/smoke/scenarios/smoke-test-scenarios.md`

### Summary
- Total Scenarios: 62
- Passed: 0
- Failed: 0
- Blocked: 0
- Critical Defects: 0
- High Defects: 0

### Scenario Results

| ID | Scenario | Type | Status | Evidence | Defect ID |
|---|---|---|---|---|---|
| 1 | Auth gate while logged out | Positive | PASS/FAIL/BLOCKED | link-or-`-` | DEF-### or `-` |
| 12 | Invalid past timeline rejected | Negative | PASS/FAIL/BLOCKED | link-or-`-` | DEF-### or `-` |
| 45 | Settings modal open/close behavior | Positive | PASS/FAIL/BLOCKED | link-or-`-` | DEF-### or `-` |
| 53 | Invalid settings payload rejected | Negative | PASS/FAIL/BLOCKED | link-or-`-` | DEF-### or `-` |
| ... | Complete all scenario IDs from scenario file | Mixed | ... | ... | ... |

### Defects
Use one block per defect:
- Defect ID: `DEF-###`
- Severity: `Critical/High/Medium/Low`
- Scenario IDs impacted:
- Repro Steps:
- Expected:
- Actual:
- Evidence:
- API/Network details (if applicable):

### API Contract Findings
- `GET /api/items`:
- `POST /api/items`:
- `PATCH /api/items/:id`:
- `DELETE /api/items/:id`:
- `POST /api/classify`:
- `GET /api/settings`:
- `PATCH /api/settings`:
- Schema mismatches:

### Console / Network
- Console Errors:
- Console Warnings:
- Network 4xx/5xx:
- Notable latency/retry behavior:

### Evidence Bundle
- Desktop screenshot(s):
- Mobile screenshot(s):
- Failure screenshot(s):
- Video/session recording:

### Retest Recommendations
1. Scenario IDs to rerun after fixes:
2. Risk areas for focused regression:
3. Go/No-Go recommendation:

*End of latest smoke-test report.*
