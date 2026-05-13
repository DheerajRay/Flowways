# FlowWays External QA Test Scenarios

## Purpose
This document defines manual and semi-automated scenarios for an external testing agent to validate that current FlowWays functionality works as expected.

## Scope Covered
- Auth gate and session behavior
- Capture and save flow (`POST /api/items`)
- Item list retrieval (`GET /api/items`)
- Item update and delete (`PATCH` / `DELETE /api/items/:id`)
- Classification endpoint behavior (`POST /api/classify`)
- Checklist behaviors (sub-items, completion, merge)
- Timeline behaviors (due parsing, overdue state, progress rail)
- Workflow behaviors (status rail, comments, time-spent chip)
- Hidden items local persistence behavior
- Error handling and validation responses

## Prerequisites
- Environment variables are configured (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `OPENAI_API_KEY`)
- Database migration `supabase/migrations/001_init.sql` is applied
- App is running and reachable (local or deployed)
- Test account credentials are available (or sign-up enabled)
- Browser devtools network tab available

## Test Data Set
Use these exact sample inputs during testing.

- `Checklist sample A`: `Buy milk, onion, tomato #grocery #home`
- `Checklist sample B`: `1. Buy milk 2. Buy bread 3. Buy onion #grocery`
- `Timeline sample relative`: `Remind me in 10 mins to stretch`
- `Timeline sample absolute`: `Tell baby to eat at 1 pm tomorrow #reminder #baby`
- `Workflow sample`: `Prepare release handoff and draft rollout spec #release`
- `Journal sample`: `Testing idea: explore a calmer onboarding flow and compare drop-off behavior after copy adjustments.`

## Execution Notes
- Execute scenarios in order where possible.
- Capture screenshot + request/response payload for failures.
- For API checks, include response status code and JSON payload.
- If a step depends on elapsed time (timeline), note the exact clock time used.

## Scenario 1: Auth Gate - Unauthenticated User
1. Open app in a clean browser session.
2. Verify the auth gate is shown instead of item feed.
3. Verify both tabs exist: `Sign In`, `Create Account`.
4. Verify submit button is disabled until email + password are filled.

Expected
- App does not show capture/feed while unauthenticated.
- Auth UI is interactive and stable.

## Scenario 2: Sign Up + Auto Session
1. Switch to `Create Account`.
2. Create a new test user.
3. Observe post-submit state.

Expected
- User is either signed in immediately, or given a clear message requiring confirmation then sign-in.
- On success, app transitions to main shell (`FlowWays` title + `Sign Out` button + capture form).

## Scenario 3: Sign In Existing User
1. Sign out if already authenticated.
2. Use known valid credentials in `Sign In`.

Expected
- Successful sign-in restores main app shell.
- Item feed loads without manual refresh.

## Scenario 4: Sign Out
1. Click `Sign Out`.

Expected
- Session clears.
- User returns to auth gate.
- Previously loaded items are no longer shown.

## Scenario 5: Create Item - Basic Save Path
1. Sign in.
2. Enter `Journal sample` in capture textarea.
3. Click `Save`.

Expected
- Save button shows transient busy state (`Saving...`).
- Success message appears (`Saved as ...`).
- New item appears in feed.
- `POST /api/items` returns 200 JSON with `item` and `classification`.

## Scenario 6: Create Item - Empty Input Guard
1. Ensure capture textarea is blank.

Expected
- Save button is disabled.
- No API request is sent.

## Scenario 7: GET Items Contract
1. Reload while signed in.
2. Inspect `GET /api/items` response.

Expected
- Status 200.
- JSON shape: `{ items: [...] }`.
- Items are user-scoped (no cross-user leakage).
- On unauthenticated request, status 401.

## Scenario 8: Checklist Rendering + Sub-item Toggle
1. Save `Checklist sample B`.
2. Verify checklist renders as multiple checkboxes.
3. Toggle one sub-item.
4. Toggle all sub-items checked.

Expected
- Sub-item toggles persist to backend (`PATCH /api/items/:id`).
- Item `checked` becomes true when all checklist entries are checked.
- UI switches to done-state actions (Undo + Hide only).

## Scenario 9: Checklist Done/Undo Actions
1. For a not-done item, click Done icon.
2. Verify done styling and actions change.
3. Click Undo.

Expected
- Done sets `checked=true` via PATCH.
- Undo sets `checked=false` via PATCH.
- Item returns to active action set.

## Scenario 10: Checklist Merge Controls and Merge Outcome
1. Ensure at least two open checklist items exist.
2. On one source item, choose another in merge dropdown.
3. Click `Merge`.

Expected
- Source item is deleted.
- Target checklist body contains deduplicated union of entries.
- Labels are merged (set union).
- Success message confirms merge target title.

## Scenario 11: Auto-Merge on Create (Server Side)
1. Create an open checklist with specific labels (for example `#grocery`).
2. Save another checklist input with overlapping specific labels.
3. Inspect `POST /api/items` response.

Expected
- Server may return `merged: true` and `mergedIntoId`.
- No duplicate standalone item is inserted when auto-merge occurs.
- Existing checklist updates with incoming items.

## Scenario 12: Edit Checklist In-Place
1. Open edit mode on checklist item.
2. Modify title.
3. Add entry, edit entry, remove entry.
4. Save.

Expected
- Changes persist through PATCH.
- Body is stored as markdown checklist lines (`- [ ] ...`, `- [x] ...`).
- `checked` reflects all-subitems-complete rule.

## Scenario 13: Timeline Create - Relative Due Parsing
1. Save `Timeline sample relative`.
2. Verify created item kind is timeline.
3. Verify due chip appears.
4. Verify due rail appears while not overdue.

Expected
- Timeline item has due timestamp in near future (~10 min window).
- Status label shows `Due in ...`.
- Progress bar has non-zero or increasing fill over time.

## Scenario 14: Timeline Create - Absolute Due Parsing
1. Save `Timeline sample absolute`.
2. Verify due date corresponds to tomorrow at ~1:00 PM local time.

Expected
- Timeline due_at aligns with parsed absolute date/time intent.
- Item labels include provided hashtags (normalized).

## Scenario 15: Timeline Edit Controls
1. Edit a timeline item.
2. Set exact time via datetime control and save.
3. Re-open edit, set `In minutes`, click `Apply`, then save.

Expected
- Exact datetime update persists.
- Minutes offset apply fills datetime-local input.
- PATCH payload uses `dueAt` (ISO string or null).

## Scenario 16: Timeline Overdue State
1. Set a timeline due time in the past.
2. Return to feed.

Expected
- Item visually enters overdue state.
- `OVER DUE` chip is visible for unchecked overdue timelines.
- Time state indicates completion threshold reached (`Timer done` logic).

## Scenario 17: Workflow Item Creation + Defaults
1. Save `Workflow sample`.

Expected
- Item kind resolves to workflow.
- Initial workflow status defaults to `Backlog`.
- Workflow status rail (Backlog, Ready, In Progress, Review, Done) is visible.

## Scenario 18: Workflow Status Progression
1. For workflow item, click each status dot sequentially.
2. End on `Done`, then move back to non-Done state.

Expected
- Each click sends PATCH with `workflowStatus`.
- `Done` sets item checked true.
- Moving away from Done sets checked false.

## Scenario 19: Workflow Edit Summary + Comments
1. Edit workflow item.
2. Update summary text.
3. Add multiple comments.
4. Remove one comment.
5. Save.

Expected
- Body is persisted in expected format:
  - Summary text
  - Blank line
  - `Comments:` block with `- comment` lines
- Display mode shows summary and bullet-style comments.

## Scenario 20: Workflow Time-Spent Chip
1. Keep workflow item active for at least 2 minutes.
2. Observe time-spent chip.

Expected
- Time spent is shown (for example `2m spent`, `1h 5m spent`).
- Value updates with time progression.

## Scenario 21: Generic Journal/Note Edit
1. Create a journal or non-checklist/non-workflow/non-timeline item.
2. Edit title + body.
3. Save.

Expected
- Edits persist via PATCH.
- Rendered body updates accordingly.

## Scenario 22: Delete Item
1. Delete an active item.

Expected
- Item is removed from feed.
- `DELETE /api/items/:id` returns `{ ok: true }`.
- Deleted item does not reappear after reload.

## Scenario 23: Hide Done Item + Local Persistence
1. Mark item done.
2. Click Hide.
3. Reload page.

Expected
- Hidden item remains hidden after reload for same browser profile.
- Hidden IDs persist in localStorage key `flowways:hidden-items`.

## Scenario 24: Sort Order Behavior
1. Create multiple items across kinds (timeline/checklist/workflow).
2. Include one overdue unchecked timeline.

Expected
- Overdue unchecked timeline ranks highest.
- Other timelines are ordered by due date ascending.
- Non-timeline items fall back to created_at descending.

## Scenario 25: Labels and Tag Chips
1. Create items with hashtags in text (`#reminder #baby`, `#grocery`).

Expected
- Labels are normalized and shown as chips (`#label`).
- No duplicate label chips on same item.

## Scenario 26: PATCH Validation - Invalid Payload
1. Send direct API request with invalid update payload (for example empty `title`, invalid `dueAt` datetime, non-positive `position`).

Expected
- Request is rejected (4xx or structured server error depending path).
- Item data remains unchanged.

## Scenario 27: AuthZ Guard on Item Mutation
1. Attempt PATCH/DELETE against another user item id (or with no session).

Expected
- Unauthorized/forbidden behavior enforced.
- No cross-user mutation is possible.

## Scenario 28: `/api/classify` Happy Path
1. Call `POST /api/classify` with valid body:
   - `text`: non-empty string
   - `modeHint`: one of allowed values

Expected
- Status 200.
- Response contains `{ result, remaining }`.
- `result` aligns with schema fields:
  - `kind`, `title`, `body`, `labels`, `due_at`, `workflow_status`, `confidence`, `reason`, `fallbackUsed`

## Scenario 29: `/api/classify` Validation Errors
1. Call classify with invalid body (`text` empty, invalid `modeHint`, missing required fields).

Expected
- Request fails with validation-driven error response.
- No server crash; response remains structured.

## Scenario 30: `/api/classify` Rate Limit Behavior
1. Repeatedly call classify until limit threshold is reached.

Expected
- Before threshold: allowed responses with decremented `remaining`.
- At/after threshold: status 429 with `Daily classification limit reached`.

## Scenario 31: API Failure Messaging in UI
1. Simulate backend failure (for example temporary DB/API interruption).
2. Attempt save/update/delete from UI.

Expected
- UI surfaces readable message (`Save failed (...)`, `Update failed`, `Delete failed`, or server-sent error).
- UI remains usable after failure (no hard crash).

## Scenario 32: Cross-Browser Smoke
1. Run Scenarios 1, 5, 8, 13, 17, 22 in at least two browsers.

Expected
- Core behavior is consistent.
- No browser-specific UI breakage for primary flows.

## Scenario 33: Mobile Responsive Smoke
1. Run on narrow viewport (mobile width).
2. Validate auth, capture, item actions, edit modes.

Expected
- No blocking layout breakages.
- Critical actions remain accessible.

## Scenario 34: Accessibility Spot Checks
1. Keyboard navigate primary flows.
2. Verify icon buttons expose accessible names.
3. Validate progress bar ARIA values on timeline rail.

Expected
- Interactive controls are keyboard reachable.
- Icon actions have meaningful `aria-label`s.
- No obvious a11y blockers in core flows.

## Scenario 35: Regression - Reload + Session Continuity
1. Sign in and create at least one item.
2. Hard refresh.

Expected
- Session is preserved.
- Items reload correctly.
- No duplicate inserts from refresh.

## Pass/Fail Template
For each scenario, record:
- Scenario ID
- Result: Pass / Fail / Blocked
- Evidence: screenshot + request/response snippets
- Notes: observed vs expected behavior
- Defect ID (if filed)

## Suggested Automation Priority
Highest-value candidates for immediate automation:
1. Scenario 1 (auth gate)
2. Scenario 5 (create item)
3. Scenario 8 (checklist toggle)
4. Scenario 13 (timeline creation)
5. Scenario 17 + 18 (workflow status progression)
6. Scenario 22 (delete)
7. Scenario 28 + 30 (`/api/classify` contract + rate limit)
