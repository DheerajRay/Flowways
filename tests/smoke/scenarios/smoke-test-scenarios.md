# FlowWays Smoke + System Regression Test Rubric

## 1) Objective
Execute a high-confidence, evidence-rich test pass that validates:
- authentication/session integrity
- capture/classification correctness
- data persistence and mutation safety
- settings/runtime theming behavior
- timeline/timezone correctness
- checklist/workflow behavioral integrity
- API contract and rejection paths

This document is the runbook and scoring rubric for smoke execution.

## 2) Source of Truth
- UI and behavior: `app/page.tsx`, `app/globals.css`
- API contracts:
  - `app/api/settings/route.ts`
  - `app/api/classify/route.ts`
  - `app/api/items/route.ts`
  - `app/api/items/[id]/route.ts`
- Shared schemas:
  - `src/shared/types/schemas.ts`
  - `src/shared/types/settings.ts`

## 3) Execution Modes
- Desktop browser run (required)
- Mobile viewport run (required)
- API contract verification run (required)

## 4) Environment & Account Rules
### 4.1 Environment Metadata (must capture)
- Base URL
- Browser + version
- Device profile (desktop/mobile)
- Date/time and timezone
- Build/runtime mode (dev/prod)

### 4.2 Account Provisioning Rule (mandatory)
If no valid test account credentials exist at run start:
1. Open auth gate.
2. Switch to `Create Account`.
3. Create a new test account using alias pattern: `flowways.smoke+YYYYMMDDHHmmss@example.com`.
4. Record masked identity in report (example: `flowways.smoke+********@example.com`).
5. Confirm immediate session entry.

If account already exists:
- Use sign in flow.

### 4.3 Clean-State Rule (mandatory)
Before first scenario group:
- clear local-only hidden state:
```js
localStorage.removeItem("flowways:hidden-items")
```
- ensure no pending modal/dialog
- ensure feed is loaded and stable

## 5) Test Evidence Standard
For each failed scenario, attach:
- screenshot path
- concise repro sequence
- expected vs actual
- console/network excerpt
- severity

For each API scenario, attach:
- endpoint + method
- auth state
- status code
- response shape summary
- schema mismatch note if any

Per run minimum evidence:
- at least 1 desktop screenshot
- at least 1 mobile screenshot
- at least 1 network payload excerpt for create/update path

## 6) Defect Severity Rubric
- Critical: auth bypass, data loss/corruption, app unusable
- High: core user flow broken, wrong persisted state, major regression
- Medium: behavior incorrect with workaround available
- Low: cosmetic/minor UX inconsistency

## 7) Pass/Fail Gates
### 7.1 Release Pass Criteria
- 0 open Critical defects
- 0 open High defects
- all core positive scenarios pass
- all negative scenarios reject correctly without state corruption

### 7.2 Scenario Stability Rule
Any scenario that initially fails and is fixed must pass twice consecutively in retest.

## 8) Report Contract (must follow exactly)
1. `Environment`
- Base URL
- Browser + version
- Device profile
- Date/time + timezone
- Test account (masked)

2. `Summary`
- Total scenarios executed
- Passed / Failed / Blocked
- Critical/High count

3. `Scenario Results`
- Columns: `ID`, `Scenario`, `Type`, `Status`, `Evidence`, `Defect ID`

4. `Defects`
- Severity
- Repro steps
- Expected vs actual
- Screenshot/video
- Network payload/response excerpt

5. `API Findings`
- Endpoint, status code, response shape
- Schema mismatch notes

6. `Console/Network Errors`
- Exact error text + URL/request id

7. `Retest List`
- Scenario IDs to rerun after fixes

## 9) Playwright MCP Testing Protocol
After every major action:
1. capture MCP snapshot
2. validate route/state
3. inspect console/network
4. save evidence if unexpected behavior appears

Selector policy:
- prefer role/name selectors
- prefer semantic labels/inputs
- avoid brittle CSS selectors unless unavoidable

If element lookup fails:
1. re-snapshot
2. verify app state and auth state
3. patch accessibility label/test id only if needed
4. rerun scenario

## 10) Data Set for Repeatability
### 10.1 Core Inputs
- Journal: `jj said the pet is boring`
- Checklist: `1. eggs 2. milk 3. bread #grocery`
- Timeline: `remind me to book tickets at 7 pm`
- Workflow: `Prepare release handoff and draft rollout spec #release`
- Invalid timeline: `remind me yesterday at 7 pm`

### 10.2 Extra Edge Inputs
- Ambiguous text: `watermellon`
- Impossible time: `at 32:77`
- 24h time: `16:30`
- Noon/midnight tokens
- Relative offsets (`in 10 mins`, `in 20 mins`)

### 10.3 Classification Versatility Suite (Task Typing)
Run each input at least twice (fresh submit) and verify consistent `kind` output.

Expected `journal`:
- `I feel burned out after that meeting`
- `today was chaos but I learned a lot`
- `note to self: stop overcommitting`

Expected `checklist`:
- `buy eggs, milk, spinach, soap`
- `1. call mom 2. pay rent 3. clean desk`
- `packing list: charger, passport, socks`

Expected `timeline`:
- `remind me to stretch in 15 minutes`
- `submit report at 7 pm`
- `doctor follow-up on friday at noon`
- `backup job at 00:00`
- `deploy freeze at 16:30`

Expected `workflow`:
- `prepare release handoff and assign QA review to JJ`
- `draft migration plan, get security signoff, then launch`
- `coordinate onboarding rollout with ops`

Ambiguous/mixed intent probes (validate current heuristic + stability):
- `watermellon`
- `book flights and remind me tomorrow 8am`
- `meeting notes: action items send invoice and follow up friday`
- `jj said ship it in 2 days`

Negative typing/time parsing probes:
- `remind me yesterday at 7 pm` (must reject)
- `remind me at 32:77` (must reject)
- `in -5 minutes` (must reject)
- `on february 30 at 9 am` (must reject or safely normalize with explicit behavior)

## 11) Scenario Matrix

### A. Auth, Provisioning, Session
A01. Logged-out gate shows `Sign In` and `Create Account`. (Positive)
A02. If no account exists, create-account flow succeeds and enters app shell. (Positive)
A03. Existing account sign-in succeeds and enters app shell. (Positive)
A04. Invalid password rejects with user-visible message and no session entry. (Negative)
A05. Sign out returns to auth gate. (Positive)
A06. Refresh while signed in preserves session and feed. (Positive)
A07. Multi-tab session consistency: sign out in one tab reflects in another on refresh/navigation. (Positive)
A08. Unauthorized API access returns 401 while logged out. (Negative)

### B. Capture and Save Core
B01. Empty capture keeps add disabled. (Positive)
B02. Enter key submits when valid. (Positive)
B03. Journal input creates journal card. (Positive)
B04. Checklist input creates checklist card with rows. (Positive)
B05. Timeline relative input creates due time and due rail. (Positive)
B06. Workflow input creates workflow in Backlog. (Positive)
B07. Save flow exits busy state reliably. (Positive)
B08. Simulated save failure shows clear error and recovers next attempt. (Negative)
B09. Past-time timeline input is rejected with visible error. (Negative)
B10. Save action does not duplicate card on single submit. (Positive)
B11. Double-submit prevention while busy. (Positive)

### C. Classification Quality and Consistency
C01. Journal detection subject/body split is meaningful for `jj said the pet is boring`. (Positive)
C02. Checklist comma-separated values split into separate rows. (Positive)
C03. Checklist numbered inline values split correctly. (Positive)
C04. Workflow action+assignee maps to workflow, not checklist. (Positive)
C05. Timeline absolute `at 7 pm` resolves to same-day future when valid. (Positive)
C06. Timeline weekday (`on monday`) maps to next valid weekday date. (Positive)
C07. Noon parses to 12:00 local. (Positive)
C08. Midnight parses to 00:00 local with correct rollover. (Positive)
C09. 24h time `16:30` parses correctly. (Positive)
C10. Impossible time rejected gracefully with no task. (Negative)
C11. Past explicit expression rejected with no task. (Negative)
C12. Ambiguous short text remains heuristic-consistent run-to-run. (Positive)
C13. Timeline subject preserves user time phrase when provided. (Positive)
C14. Journal body retains narrative, avoids generic filler. (Positive)
C15. Tags avoid filler tokens (`#not`, `#thing`, `#are`). (Positive)
C16. Entity tags include names like `#jj` when present. (Positive)
C17. Meta time tags are minimized when stronger topic tags exist. (Positive)
C18. Pet quips are contextual and not duplicated back-to-back. (Positive)
C19. Mixed-intent input chooses intended dominant type consistently across reruns. (Positive)
C20. Inputs with both narrative and explicit reminder phrase prioritize timeline when due intent is explicit. (Positive)
C21. Inputs with list syntax and time phrase document and preserve current precedence rule (no silent flapping). (Positive)
C22. Rejected timeline parses never create partial/ghost items in feed. (Negative)
C23. Typo/noise tolerant parsing does not misclassify obvious workflow inputs as checklist by default. (Positive)

### D. Tagging and Filter Logic
D01. Tag panel opens from toolbar and closes reliably. (Positive)
D02. Tag chip click toggles filter state. (Positive)
D03. AND mode requires all selected tags. (Positive)
D04. OR mode matches any selected tag. (Positive)
D05. Clear tags clears only tag filters. (Positive)
D06. Card-tag click syncs with panel filters and opens panel if closed. (Positive)
D07. Color tags visible and reflected in border color. (Positive)
D08. Tag filter stacks correctly with search text filter. (Positive)
D09. Tag filter stacks correctly with capture mode filter. (Positive)
D10. Tag filter stacks correctly with color filter. (Positive)
D11. Filter removal restores expected card set deterministically. (Positive)

### E. Checklist Behaviors
E01. Sub-item toggle persists checked state. (Positive)
E02. All sub-items checked sets parent done. (Positive)
E03. Done card shows only Undo/Hide actions. (Positive)
E04. Undo restores full active actions. (Positive)
E05. Checklist edit add/remove/update persists correctly. (Positive)
E06. Multi-line checklist edit remains split rows. (Positive)
E07. Merge controls appear with >=2 open checklists. (Positive)
E08. Merge deduplicates expected entries and removes source card. (Positive)
E09. Merge does not corrupt unrelated card fields. (Positive)

### F. Timeline Behaviors
F01. Exact datetime edit/save persists. (Positive)
F02. `In minutes` apply/save updates due time correctly. (Positive)
F03. Remaining-minutes prefill reflects current due time. (Positive)
F04. Overdue unchecked task shows overdue styling/chip. (Positive)
F05. Timeline time remains local-time consistent (no unexpected day shift). (Positive)
F06. Two tasks created same minute show coherent timestamps. (Positive)
F07. Overdue notice tone differs from invalid-input error tone. (Positive)
F08. Count-up subtype displays elapsed time progression correctly. (Positive)
F09. Recurring subtype shows expected next occurrence label. (Positive)

### G. Workflow Behaviors
G01. Workflow defaults to Backlog on creation. (Positive)
G02. Workflow rail only includes Backlog, Paused, In Progress. (Positive)
G03. No duplicate done control in workflow rail/actions. (Positive)
G04. Time-spent appears after first In Progress transition only. (Positive)
G05. Done state stops time growth; Undo reopens correctly. (Positive)
G06. Workflow summary/comments edit persists. (Positive)
G07. Status transitions do not erase comments/summary. (Positive)

### H. Hide, Search, Feed Order
H01. Search matches title/body/tags. (Positive)
H02. Hide toggle includes/excludes hidden tasks. (Positive)
H03. Fully hidden feed shows proper empty-state text. (Positive)
H04. Hide-mode notice text updates correctly. (Positive)
H05. Feed ordering remains stable: overdue timelines first, then timeline due order, then newest others. (Positive)
H06. Hidden-item local state survives refresh for same browser profile. (Positive)

### I. Settings Modal and Runtime Theming
I01. Settings icon opens modal; outside click closes. (Positive)
I02. Save applies changes immediately. (Positive)
I03. Cancel discards unsaved draft. (Positive)
I04. Pet mode behavior updates correctly for all modes. (Positive)
I05. Pet `no` disables pet UI and fallback notice behavior is valid. (Positive)
I06. Non-`no` mode re-enables pet UI. (Positive)
I07. Font selection updates and persists after refresh. (Positive)
I08. Text size updates and persists after refresh. (Positive)
I09. Palette updates reflect in borders/chips/active controls. (Positive)
I10. Settings persist across sign-out/sign-in for same account. (Positive)
I11. Settings persist across desktop and mobile for same account. (Positive)
I12. Settings changes do not clear tasks or hidden local state. (Positive)

### J. Settings Validation and Error Recovery
J01. Save is blocked while in-flight (no double-write). (Positive)
J02. API save error shows inline error and modal remains open. (Negative)
J03. Retry after failed save succeeds without reload. (Positive)
J04. Allowed fonts (`avenir`,`inter`,`plex`,`mono`,`rounded`) persist correctly. (Positive)
J05. Unknown font (`comic-sans`) rejected 4xx, no mutation. (Negative)
J06. Unknown text size (`xl`) rejected 4xx, no mutation. (Negative)
J07. Invalid hex (`#12`) rejected 4xx, no partial write. (Negative)
J08. Valid lowercase/uppercase hex accepted consistently. (Positive)
J09. Esc closes modal without save. (Positive)
J10. Focus returns to settings trigger on close. (Positive)
J11. Modal remains inside viewport on mobile widths. (Positive)

### K. API Contract Smoke
K01. `GET /api/items` authenticated -> 200 + `{ items: []|[...] }`. (Positive)
K02. `GET /api/items` unauthenticated -> 401. (Negative)
K03. `POST /api/items` valid -> 200 + `{ item, classification }`. (Positive)
K04. `PATCH /api/items/:id` valid update persists. (Positive)
K05. `DELETE /api/items/:id` success + item absent on refetch. (Positive)
K06. `POST /api/classify` valid -> `{ result, remaining }`. (Positive)
K07. `POST /api/classify` rate-limit path -> expected error envelope. (Negative)
K08. `GET /api/settings` -> effective settings object. (Positive)
K09. `PATCH /api/settings` valid persists and reloads. (Positive)
K10. `PATCH /api/settings` invalid enum/hex rejected. (Negative)
K11. `PATCH /api/settings` partial payload updates only specified fields. (Positive)

### L. Console, Network, and Resilience
L01. No uncaught runtime exception during core flows. (Positive)
L02. No repeated fatal request failures under idle session. (Positive)
L03. Missing static asset errors are documented and severity-triaged. (Positive)
L04. Dev-only HMR noise is separated from product defects in report. (Positive)

## 12) Run Order
1. Environment capture
2. Account provisioning/sign-in (A)
3. Core capture/classification (B,C)
4. Filters/checklist/timeline/workflow (D,E,F,G)
5. Search/hide/order (H)
6. Settings + validation (I,J)
7. API contract sweep (K)
8. Console/network reconciliation (L)
9. Retest failed/fixed scenarios twice

## 13) Regression Priorities
1. Settings persistence cross-session and cross-device
2. Tag quality + AND/OR logic correctness
3. Timeline timezone/local-time integrity
4. Checklist edit/merge integrity
5. Classification quality (type, subject, labels)
6. Settings payload validation without partial writes
7. Classification precedence stability for mixed-intent prompts

## 15) Classification Defect Checklist (must evaluate on every run)
- Wrong `kind` selected for clear-intent input
- Inconsistent `kind` for same input across repeated submissions
- Timeline parse accepted invalid/past/impossible time
- Rejected timeline still created an item or mutated state
- Subject degraded to generic filler despite specific input
- Body loses key user intent tokens (assignee, time phrase, action verb)
- Tags dominated by filler/meta instead of topical/entity labels
- Mixed-intent precedence changed unexpectedly from prior baseline

## 14) Completion Definition
A run is complete only when:
- report contract sections are fully populated
- each failed scenario has evidence and severity
- retest list exists
- pass/fail gate decision is explicit
