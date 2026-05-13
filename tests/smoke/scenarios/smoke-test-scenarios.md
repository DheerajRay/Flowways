# FlowWays Smoke Test Scenarios (External Agent)

## Objective
Run a fast but high-confidence smoke pass on deployed FlowWays behavior and produce actionable output for regressions.

## Source of Truth
- App UI behavior: `app/page.tsx`
- API contracts: `app/api/classify/route.ts`, `app/api/items/route.ts`, `app/api/items/[id]/route.ts`
- Schemas: `src/shared/types/schemas.ts`

## Required Output Format (for every run)
The external agent must produce a report with these sections:
1. `Environment`
- Base URL tested
- Browser + version
- Date/time (with timezone)
- Test account used (masked email)
2. `Scenario Results Table`
- Columns: `ID`, `Scenario`, `Status (Pass/Fail/Blocked)`, `Evidence`, `Defect ID`
3. `Defects`
- One block per defect:
  - Severity (`Critical/High/Medium/Low`)
  - Repro steps
  - Expected vs actual
  - Screenshot/video reference
  - Network request/response reference (if applicable)
4. `API Contract Findings`
- Status codes observed for each endpoint
- Any payload/schema mismatches
5. `Console/Network Errors`
- Exact error text and request URL
6. `Retest Recommendations`
- Exact scenarios to rerun after fixes

## Evidence Requirements
For each failed scenario, capture:
- 1 screenshot at failure state
- Relevant request/response payload excerpt
- Console error snippet if present

For each passed API scenario, capture:
- Endpoint
- Status code
- Minimal JSON shape confirmation

## Preconditions
- User can sign in with email/password.
- At least one clean test account available.
- Browser localStorage is reset before run:
```js
localStorage.removeItem('flowways:hidden-items');
```

## Smoke Scenarios

### Auth and Session
1. Unauthenticated gate displays Sign In/Create Account and no feed.
2. Sign in succeeds and loads app shell.
3. Sign out returns to auth gate and clears feed.
4. Refresh while signed in preserves session and reloads items.

### Capture and Save
5. Empty capture input keeps Save disabled.
6. Save a journal-like text; expect success message and new card.
7. Save a checklist-like text; expect checklist card with actionable rows.
8. Save a timeline text (`in 10 mins`); expect due chip + due rail.
9. Save a workflow text; expect workflow status rail and Backlog default.
10. Save operation must always exit loading state (no stuck `Saving...`).

### Checklist Behaviors
11. Toggle single sub-item persists state.
12. Toggle all sub-items marks card done.
13. Done card shows only Undo/Hide actions.
14. Undo restores active controls.
15. Edit checklist title + entries (add/remove/rename) and save without corruption.
16. Multi-line checklist edits remain separate rows (no text concatenation).
17. Merge visible when at least two open checklist cards exist.
18. Merge appends deduplicated items into target and removes source card intentionally.

### Timeline Behaviors
19. Edit timeline with exact datetime and save.
20. Edit timeline with `In minutes` apply and save.
21. Overdue timeline shows overdue state/chip while unchecked.

### Workflow Behaviors
22. Move workflow state across all dots.
23. Setting workflow to Done marks item checked.
24. Moving from Done back to non-Done unchecks item.
25. Edit workflow summary/comments persists correctly.

### Item Lifecycle and Feed
26. Delete item removes it and does not reappear after refresh.
27. Hide done item removes it from visible feed.
28. If all cards are hidden, feed must show empty-state text (`No items yet.`), not a blank box.
29. Sorting sanity: overdue timelines first, then timeline due order, then newest non-timeline.

### API Contract Smoke
30. `GET /api/items` returns 200 + `{ items: [...] }` when authenticated.
31. `GET /api/items` returns 401 when unauthenticated.
32. `POST /api/items` returns 200 + `item` + `classification` on valid payload.
33. `PATCH /api/items/:id` persists valid fields and returns updated item.
34. `DELETE /api/items/:id` returns `{ ok: true }`.
35. `POST /api/classify` valid payload returns `{ result, remaining }`.

### Negative / Resilience
36. Invalid `PATCH` payload is rejected; data unchanged.
37. Invalid `POST /api/classify` payload is rejected.
38. Simulated transient network failure during save shows user-facing failure message and does not leave Save stuck.

## Suggested Seed Inputs
- Checklist: `1. Buy milk 2. Buy bread 3. Buy onion #grocery`
- Timeline: `Remind me in 10 mins to stretch`
- Workflow: `Prepare release handoff and draft rollout spec #release`
- Journal: `Testing idea: compare calmer onboarding copy against current flow.`

## Severity Guidance
- `Critical`: data loss, auth bypass, app unusable
- `High`: core flow broken, incorrect persistent state
- `Medium`: degraded UX with workaround
- `Low`: cosmetic/secondary behavior issue

## Regression Focus (Current)
Prioritize these during every smoke run:
1. Checklist edit data integrity (no entry corruption/duplication).
2. Checklist row separation in edit/save (no concatenation).
3. Save button busy-state recovery on failure and success.

## Pass Criteria for Release Candidate
- No open Critical/High defects.
- All Auth/Capture/Checklist/Timeline/Workflow core smoke scenarios pass.
- API contract smoke scenarios pass without schema drift.
