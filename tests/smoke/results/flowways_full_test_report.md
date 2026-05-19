# FlowWays Smoke Test Report

## Reporting Rules
- Keep this file UTF-8 encoded.
- Keep only one `Latest Run` section in this file.
- Move older run details to `tests/smoke/results/archive/` as dated files.
- Every run must follow the exact section order below.

## Latest Run

### Metadata
- Date: 2026-05-19
- Timezone: America/New_York
- Run Started: 17:04:37-04:00
- Base URL: https://flowways.vercel.app
- Browser: Edge (Playwright MCP)
- Device Profile: Desktop + Mobile
- Test Account: `flowways.smoke+********@example.com` (password hidden)
- Scenario Source: `F:/Task/FlowWays/tests/smoke/scenarios/smoke-test-scenarios.md`

### Summary
- Total Scenarios Executed: 24
- Passed: 20
- Failed: 3
- Blocked: 1
- Critical Defects: 1
- High Defects: 1

### Scenario Results

| ID | Scenario | Type | Status | Evidence | Defect ID |
|---|---|---|---|---|---|
| A01 | Logged-out auth gate shown | Positive | PASS | `vercel-auth-gate-desktop.png` | - |
| A02 | Create-account flow enters app shell | Positive | PASS | MCP snapshot `2026-05-19T21-05-37` | - |
| B03/C01 | Journal-like input classified correctly | Positive | FAIL | Item created as checklist for `I feel burned out after that meeting` | DEF-20260519-001 |
| B04/C02 | Checklist comma-list classification | Positive | PASS | Item with 4 checklist rows | - |
| B05/C18 | Timeline relative (`in 15 minutes`) classification | Positive | PASS | Due timestamp + due rail visible | - |
| B06/C04 | Workflow action+assignee classification | Positive | PASS | Workflow card + `#jj` | - |
| C10 | Impossible time rejected (`at 32:77`) | Negative | PASS | Error notice + no new item | - |
| C11 | Past-time rejected (`yesterday at 7 pm`) | Negative | PASS | Error notice + no new item | - |
| C19 | Mixed-intent consistency | Positive | PASS | Repeated mixed prompts created stable kinds | - |
| C20 | Explicit reminder intent prioritization | Positive | PASS | `book flights and remind me tomorrow 8am` -> timeline/reminder | - |
| C21 | Mixed precedence stability | Positive | FAIL | Workflow-like text coerced to timeline by post-rule | DEF-20260519-002 |
| D01 | Tag panel opens | Positive | PASS | Tag window visible | - |
| D03 | AND mode requires all tags | Positive | PASS | `#release` + `#jj` reduced feed to matching cards | - |
| D04 | OR mode matches any tag | Positive | PASS | OR toggle applied with broader match | - |
| D05 | Clear tags resets tag filter state | Positive | PASS | Clear restored full feed | - |
| E01 | Checklist sub-item toggles persist | Positive | PASS | 4 checked subitems persisted | - |
| E02/E03 | Checklist all-checked -> done + Undo/Hide actions | Positive | PASS | `Undo`/`Hide` only action set | - |
| G04 | Workflow time spent appears after In Progress | Positive | PASS | `1m spent` visible | - |
| G05 | Workflow Done and Undo behavior | Positive | PASS | Done -> Undo/Hide -> Undo restored open state | - |
| I01 | Settings opens from toolbar | Positive | PASS | Settings panel visible | - |
| K01 | `GET /api/items` authenticated | Positive | PASS | 200 + `{ items: [...] }` | - |
| K08 | `GET /api/settings` authenticated | Positive | PASS | 200 + settings object | - |
| K06 | `POST /api/classify` valid payload | Positive | FAIL | 500 with null JSON body | DEF-20260519-003 |
| K02 | `GET /api/items` unauthenticated | Negative | PASS | 401 + `{ error: "Unauthorized" }` | - |

### Defects
- Defect ID: `DEF-20260519-001`
- Severity: `High`
- Repro Steps: Submit `I feel burned out after that meeting` in auto mode.
- Expected vs Actual: Expected `journal`; actual `checklist`.
- Screenshot/video: `tests/smoke/results/evidence/vercel-smoke-mobile-current.png` + MCP snapshots.
- Network payload/response excerpt: `GET /api/items` shows stored `kind: "checklist"` for this input.

- Defect ID: `DEF-20260519-002`
- Severity: `Medium`
- Repro Steps: Submit `meeting notes: action items send invoice and follow up friday`.
- Expected vs Actual: Expected stable documented precedence (likely workflow); actual timeline due to post-rule coercion.
- Screenshot/video: MCP snapshots around `21:06:41`.
- Network payload/response excerpt: `classification_reason` includes `post-rule: reminder-like input mapped to timeline`.

- Defect ID: `DEF-20260519-003`
- Severity: `Critical`
- Repro Steps: Authenticated `POST /api/classify` with valid payload.
- Expected vs Actual: Expected 200 + `{ result, remaining }`; actual 500 with null JSON.
- Screenshot/video: MCP API run output.
- Network payload/response excerpt: `classify.status: 500`.

### API Contract Findings
- `GET /api/items` authenticated: 200, expected shape with `items` array.
- `GET /api/items` unauthenticated: 401, expected error envelope.
- `GET /api/settings` authenticated: 200, expected `settings` object.
- `POST /api/classify` valid payload: 500 (contract violation; should return structured success/error envelope).
- Schema mismatch notes: classification endpoint response shape missing due to server failure.

### Console / Network
- `404` on `https://flowways.vercel.app/favicon.ico`.
- `400` on `/api/items` for intentionally invalid timeline submissions (expected rejection path).
- `500` on `/api/classify` for valid classify request (unexpected and critical).

### Evidence Bundle
- Desktop screenshot(s): `tests/smoke/results/evidence/vercel-auth-gate-desktop.png`
- Mobile screenshot(s): `tests/smoke/results/evidence/vercel-smoke-mobile-current.png`
- Failure screenshot(s): Captured in MCP snapshots and above evidence files.
- Video/session recording: Not captured in this run.

### Retest Recommendations
1. Retest IDs: `B03/C01`, `C21`, `K06` after fixes.
2. Run full classification versatility suite twice for consistency after classifier changes.
3. Re-run complete API section `K` on both authenticated and unauthenticated sessions.
4. Go/No-Go recommendation: **No-Go** until `DEF-20260519-003` is fixed.
