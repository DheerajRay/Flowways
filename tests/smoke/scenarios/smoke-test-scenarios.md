# FlowWays Smoke Test Scenarios (External Agent)

## Objective
Run a fast but high-confidence smoke pass on deployed FlowWays behavior and produce actionable output for regressions.

## Source of Truth
- App UI behavior: `app/page.tsx`, `app/globals.css`
- API contracts: `app/api/settings/route.ts`, `app/api/classify/route.ts`, `app/api/items/route.ts`, `app/api/items/[id]/route.ts`
- Schemas: `src/shared/types/schemas.ts`, `src/shared/types/settings.ts`

## Report Contract (must follow exactly)
1. `Environment`
- Base URL
- Browser + version
- Device profile (desktop/mobile)
- Date/time + timezone
- Test account (masked)
2. `Summary`
- Total scenarios
- Passed / Failed / Blocked count
- Critical/High defect count
3. `Scenario Results`
- Columns: `ID`, `Scenario`, `Type (Positive/Negative)`, `Status`, `Evidence`, `Defect ID`
4. `Defects`
- Severity (`Critical/High/Medium/Low`)
- Repro steps
- Expected vs actual
- Screenshot/video
- Network payload/response excerpt
5. `API Findings`
- Endpoint, status code, response shape
- Schema mismatch notes
6. `Console/Network Errors`
- Exact error text and URL/request id
7. `Retest List`
- Scenario IDs that must be rerun after fixes

## Evidence Rules
- Every failed scenario: screenshot + console/network snippet.
- Every API scenario: endpoint + status + compact JSON shape check.
- At least 1 mobile screenshot and 1 desktop screenshot per run.

## Preconditions
- Auth credentials available.
- Use clean account state when possible.
- Clear local-only UI state before run:
```js
localStorage.removeItem("flowways:hidden-items");
```

## Scenario Matrix

### A. Auth and Session
1. Auth gate shows Sign In/Create Account while logged out. (`Positive`)
2. Valid sign-in enters app shell. (`Positive`)
3. Sign out returns to auth gate. (`Positive`)
4. Refresh while signed in keeps session and restores feed. (`Positive`)

### B. Capture and Classification
5. Empty capture keeps add disabled. (`Positive`)
6. Enter key submits capture when valid. (`Positive`)
7. Add journal text creates journal card. (`Positive`)
8. Add checklist text creates checklist card with rows. (`Positive`)
9. Add timeline text (`in 10 mins`) creates due time + due rail. (`Positive`)
10. Add workflow text creates workflow with Backlog status. (`Positive`)
11. Save flow never remains stuck busy. (`Positive`)
12. Invalid timeline in past is rejected with user-visible error. (`Negative`)
13. Simulated transient save failure shows error and recovers next submit. (`Negative`)

### C. Tagging and Tag Filters
14. Tags generated are topic/entity focused (no filler tags like `#not`, `#thing`). (`Positive`)
15. Tag window opens/closes from toolbar button. (`Positive`)
16. Tag chip click in window filters results. (`Positive`)
17. AND mode requires all selected tags. (`Positive`)
18. OR mode matches any selected tag. (`Positive`)
19. Clear tags resets only tag filters. (`Positive`)
20. Clicking card tag toggles same filter state and opens tag window if closed. (`Positive`)
21. Color tags remain visible as tag chips and reflected in border color. (`Positive`)

### D. Checklist Behaviors
22. Sub-item toggle persists checked state. (`Positive`)
23. All checklist items checked marks parent done. (`Positive`)
24. Done card shows Undo/Hide actions only. (`Positive`)
25. Undo restores active action set. (`Positive`)
26. Edit checklist title/items add/remove/update persists correctly. (`Positive`)
27. Multi-line checklist edit stays separate rows. (`Positive`)
28. Merge controls appear with at least two open checklists. (`Positive`)
29. Merge deduplicates and removes source card. (`Positive`)

### E. Timeline Behaviors
30. Timeline edit exact datetime save works. (`Positive`)
31. Timeline `In minutes` apply/save works and updates due time. (`Positive`)
32. Timeline edit prefills remaining minutes from due time. (`Positive`)
33. Overdue unchecked timeline shows overdue styling and chip. (`Positive`)
34. Timeline due time is local-time consistent (no unexpected day shift for same input context). (`Positive`)

### F. Workflow Behaviors
35. Workflow defaults to Backlog on creation. (`Positive`)
36. Workflow rail has only Backlog, Paused, In Progress. (`Positive`)
37. No duplicate done control in workflow rail. (`Positive`)
38. Time spent appears only after first In Progress transition. (`Positive`)
39. Done stops time spent growth; Undo reopens correctly. (`Positive`)
40. Workflow summary/comments edit persists. (`Positive`)

### G. Hide, Search, Feed Order
41. Search filters by title/body/tags. (`Positive`)
42. Hide toggle includes/excludes hidden tasks from feed. (`Positive`)
43. If everything hidden, empty-state text appears (not blank list box). (`Positive`)
44. Feed sort order remains stable: overdue timelines first, then timeline due order, then newest others. (`Positive`)

### H. Settings Modal and Runtime Theming
45. Settings icon opens modal and outside click closes. (`Positive`)
46. Modal top-right save applies changes immediately. (`Positive`)
47. Modal cancel discards draft changes. (`Positive`)
48. Pet control modes (`no/professional/meh/nuclear`) update behavior:
- `no` disables pet UI and uses fallback notice area.
- non-`no` re-enables pet UI.
49. Font selection updates app typography and persists after refresh. (`Positive`)
50. Text size control updates and persists after refresh. (`Positive`)
51. Color palette updates reflect in:
- card color borders
- color chips/swatches
- color-active controls
52. Settings persist across sign-out/sign-in for same account. (`Positive`)
53. Invalid settings payload rejected by API with no partial corrupt state. (`Negative`)

### I. API Contract Smoke
54. `GET /api/items` => 200 authenticated + `{ items: [] }`. (`Positive`)
55. `GET /api/items` => 401 unauthenticated. (`Negative`)
56. `POST /api/items` valid payload => 200 + `{ item, classification }`. (`Positive`)
57. `PATCH /api/items/:id` valid update persists. (`Positive`)
58. `DELETE /api/items/:id` returns success and item no longer appears. (`Positive`)
59. `POST /api/classify` valid payload returns `{ result, remaining }`. (`Positive`)
60. `GET /api/settings` returns effective settings object. (`Positive`)
61. `PATCH /api/settings` valid payload persists and rehydrates on reload. (`Positive`)
62. `PATCH /api/settings` invalid enum/hex rejected. (`Negative`)

## Suggested Seed Inputs
- Journal: `jj said the pet is boring`
- Checklist: `1. eggs 2. milk 3. bread #grocery`
- Timeline: `remind me to book tickets at 7 pm`
- Workflow: `Prepare release handoff and draft rollout spec #release`
- Invalid timeline: `remind me yesterday at 7 pm`

## Severity Guide
- `Critical`: auth bypass, data loss, unusable app
- `High`: core flow broken or incorrect persisted state
- `Medium`: workaround available but behavior wrong
- `Low`: cosmetic/minor UX issue

## Current Regression Priorities
1. Settings persistence across devices/account sessions.
2. Tag quality and filter correctness (AND/OR logic).
3. Timeline local-time correctness and overdue rendering.
4. Checklist edit/merge data integrity.

## Release Pass Criteria
- Zero open Critical/High defects.
- All core positive scenarios (Auth, Capture, Settings, Checklist, Timeline, Workflow, API) pass.
- All negative scenarios return correct rejection behavior with no state corruption.
