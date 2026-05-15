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

### B. Capture and Classification (Core)
5. Empty capture keeps add disabled. (`Positive`)
6. Enter key submits capture when valid. (`Positive`)
7. Add journal text creates journal card. (`Positive`)
8. Add checklist text creates checklist card with rows. (`Positive`)
9. Add timeline text (`in 10 mins`) creates due time + due rail. (`Positive`)
10. Add workflow text creates workflow with Backlog status. (`Positive`)
11. Save flow never remains stuck busy. (`Positive`)
12. Invalid timeline in past is rejected with user-visible error. (`Negative`)
13. Simulated transient save failure shows error and recovers next submit. (`Negative`)

### C. Classification Deep Coverage
14. Journal detection: `jj said the pet is boring` => journal with meaningful subject/body split. (`Positive`)
15. Checklist detection: comma-separated grocery values => checklist with distinct rows (not one line). (`Positive`)
16. Checklist detection: numbered list inline (`1. eggs 2. milk`) => parsed as separate checklist entries. (`Positive`)
17. Workflow detection: action + assignee (`collect books from jj`) => workflow, not checklist. (`Positive`)
18. Timeline detection: explicit relative (`in 20 mins`) => timeline with due_at. (`Positive`)
19. Timeline detection: absolute time today (`at 7 pm`) => timeline with same-day future due. (`Positive`)
20. Timeline detection: weekday (`on monday`) => timeline with correct upcoming weekday date. (`Positive`)
21. Timeline detection: noon keyword => timeline at 12:00 local. (`Positive`)
22. Timeline detection: midnight keyword => timeline at 00:00 local with correct day rollover. (`Positive`)
23. Timeline detection: 24h time (`16:30`) => due_at parsed correctly. (`Positive`)
24. Timeline negative: `yesterday at 7 pm` rejected and creates no task. (`Negative`)
25. Timeline negative: impossible time text (`at 32:77`) rejected gracefully. (`Negative`)
26. Ambiguous short input (`watermellon`) follows current intended heuristic and is consistent run-to-run. (`Positive`)
27. Subject quality: timeline subject retains explicit time phrase if user included it. (`Positive`)
28. Body quality: journal keeps useful narrative sentence, no generic filler. (`Positive`)
29. Tag quality: generated tags avoid filler tokens (`#not`, `#thing`, `#are`). (`Positive`)
30. Tag quality: person/entity extraction includes names like `#jj` when present. (`Positive`)
31. Tag quality: time/meta tags (`#reminder`, `#notification`) are minimized when better topic tags exist. (`Positive`)
32. Pet quip quality: add-task quip is contextual and non-duplicative across consecutive submissions. (`Positive`)

### D. Tagging and Tag Filters
33. Tags generated are topic/entity focused (no filler tags like `#not`, `#thing`). (`Positive`)
34. Tag window opens/closes from toolbar button. (`Positive`)
35. Tag chip click in window filters results. (`Positive`)
36. AND mode requires all selected tags. (`Positive`)
37. OR mode matches any selected tag. (`Positive`)
38. Clear tags resets only tag filters. (`Positive`)
39. Clicking card tag toggles same filter state and opens tag window if closed. (`Positive`)
40. Color tags remain visible as tag chips and reflected in border color. (`Positive`)
41. Tag filter stacks correctly with search text filter. (`Positive`)
42. Tag filter stacks correctly with classification mode filter. (`Positive`)
43. Tag filter stacks correctly with color filter. (`Positive`)

### E. Checklist Behaviors
44. Sub-item toggle persists checked state. (`Positive`)
45. All checklist items checked marks parent done. (`Positive`)
46. Done card shows Undo/Hide actions only. (`Positive`)
47. Undo restores active action set. (`Positive`)
48. Edit checklist title/items add/remove/update persists correctly. (`Positive`)
49. Multi-line checklist edit stays separate rows. (`Positive`)
50. Merge controls appear with at least two open checklists. (`Positive`)
51. Merge deduplicates and removes source card. (`Positive`)

### F. Timeline Behaviors
52. Timeline edit exact datetime save works. (`Positive`)
53. Timeline `In minutes` apply/save works and updates due time. (`Positive`)
54. Timeline edit prefills remaining minutes from due time. (`Positive`)
55. Overdue unchecked timeline shows overdue styling and chip. (`Positive`)
56. Timeline due time is local-time consistent (no unexpected day shift for same input context). (`Positive`)
57. Two timeline tasks created same minute show coherent local timestamps (no mixed-zone drift). (`Positive`)
58. Overdue notice tone is warning (distinct from invalid-input error tone). (`Positive`)

### G. Workflow Behaviors
59. Workflow defaults to Backlog on creation. (`Positive`)
60. Workflow rail has only Backlog, Paused, In Progress. (`Positive`)
61. No duplicate done control in workflow rail. (`Positive`)
62. Time spent appears only after first In Progress transition. (`Positive`)
63. Done stops time spent growth; Undo reopens correctly. (`Positive`)
64. Workflow summary/comments edit persists. (`Positive`)

### H. Hide, Search, Feed Order
65. Search filters by title/body/tags. (`Positive`)
66. Hide toggle includes/excludes hidden tasks from feed. (`Positive`)
67. If everything hidden, empty-state text appears (not blank list box). (`Positive`)
68. Hide mode notice text updates correctly on toggle. (`Positive`)
69. Feed sort order remains stable: overdue timelines first, then timeline due order, then newest others. (`Positive`)

### I. Settings Modal and Runtime Theming (Core)
70. Settings icon opens modal and outside click closes. (`Positive`)
71. Modal top-right save applies changes immediately. (`Positive`)
72. Modal cancel discards draft changes. (`Positive`)
73. Pet control modes (`no/professional/meh/nuclear`) update behavior:
- `no` disables pet UI and uses fallback notice area.
- non-`no` re-enables pet UI.
74. Font selection updates app typography and persists after refresh. (`Positive`)
75. Text size control updates and persists after refresh. (`Positive`)
76. Color palette updates reflect in:
- card color borders
- color chips/swatches
- color-active controls
77. Settings persist across sign-out/sign-in for same account. (`Positive`)
78. Settings persist across desktop + mobile/PWA for same account. (`Positive`)
79. Invalid settings payload rejected by API with no partial corrupt state. (`Negative`)

### J. Settings Validation and Edge Cases (Expanded)
80. Save blocked while settings request in-flight (no duplicate writes on double-click). (`Positive`)
81. API error in settings save shows clear inline error and keeps modal open. (`Negative`)
82. After failed save, retry with valid values succeeds without reload. (`Positive`)
83. Each allowed font key (`avenir`,`inter`,`plex`,`mono`,`rounded`) saves and reloads correctly. (`Positive`)
84. Font payload rejects unknown value (`comic-sans`) with 4xx and no state mutation. (`Negative`)
85. Font size rejects unknown value (`xl`) with 4xx and no state mutation. (`Negative`)
86. Color palette rejects invalid hex (`#12`) with 4xx and no partial update. (`Negative`)
87. Color palette accepts lowercase and uppercase valid hex consistently. (`Positive`)
88. Pet disabled state suppresses quips but still shows non-pet system warnings (invalid timer/overdue). (`Positive`)
89. Settings modal keyboard escape closes modal without save. (`Positive`)
90. Focus returns to settings trigger button when modal closes. (`Positive`)
91. Modal remains within viewport on narrow mobile widths. (`Positive`)
92. Changing settings does not clear existing task data or hidden-task local state. (`Positive`)

### K. API Contract Smoke
93. `GET /api/items` => 200 authenticated + `{ items: [] }`. (`Positive`)
94. `GET /api/items` => 401 unauthenticated. (`Negative`)
95. `POST /api/items` valid payload => 200 + `{ item, classification }`. (`Positive`)
96. `PATCH /api/items/:id` valid update persists. (`Positive`)
97. `DELETE /api/items/:id` returns success and item no longer appears. (`Positive`)
98. `POST /api/classify` valid payload returns `{ result, remaining }`. (`Positive`)
99. `POST /api/classify` rate-limit path returns expected error envelope and message. (`Negative`)
100. `GET /api/settings` returns effective settings object. (`Positive`)
101. `PATCH /api/settings` valid payload persists and rehydrates on reload. (`Positive`)
102. `PATCH /api/settings` invalid enum/hex rejected. (`Negative`)
103. `PATCH /api/settings` partial payload updates only specified fields. (`Positive`)

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
5. Classification quality (type + subject + tag relevance).
6. Settings validation safety (invalid payload rejection without partial writes).

## Release Pass Criteria
- Zero open Critical/High defects.
- All core positive scenarios (Auth, Capture, Settings, Checklist, Timeline, Workflow, API) pass.
- All negative scenarios return correct rejection behavior with no state corruption.
