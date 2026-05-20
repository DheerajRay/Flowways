# Concrete Implementation Plan (Mapped to Figma Issue Tree)

Reference board: `FlowWays Mobile QA Annotations - 2026-05-20`  
Reference URL: https://www.figma.com/board/b3R5uoQcVDaIzXPMPSrjy9

## A) Blocking Failures

Status legend: `Open`, `In Progress`, `Verified`

### A1. Fix `Add task` disabled after mode switch (P1)
Status: `In Progress`
- Owner area: capture input state + mode actions in [app/page.tsx](/F:/Task/FlowWays/app/page.tsx)
- Implementation:
1. Isolate add-button enablement into a derived boolean `canSubmit` that uses trimmed input and explicit busy/auth guards.
2. Ensure mode-switch handlers do not indirectly clear/overwrite `sourceText`.
3. Add a defensive sync test in UI logic: after every mode click, recompute `canSubmit` from current input value.
4. Add unit/integration tests for mode transitions while input contains text.
- Verification:
1. Workflow -> Journal -> Add succeeds.
2. Workflow -> Timeline -> Add succeeds.
3. Workflow -> Checklist -> Add succeeds.
4. Workflow -> Auto -> Add succeeds.

### A2. Restore production manifest route (P1)
Status: `In Progress`
- Owner area: static asset routing + manifest placement
- Implementation:
1. Ensure `manifest.webmanifest` is served from `public/manifest.webmanifest` (not project root only).
2. Confirm icon references point to existing files under `public/icons/*`.
3. Keep metadata icons in [app/layout.tsx](/F:/Task/FlowWays/app/layout.tsx) aligned with manifest icons.
- Verification:
1. `https://flowways.vercel.app/manifest.webmanifest` returns JSON (not 404).
2. Browser console has no manifest fetch error on app load.
3. Reinstall PWA and confirm new icon appears.

## B) Component and Structure Checks

### B1. Capture bar reliability
Status: `Open`
- Owner area: capture shell CSS + action button states in [app/globals.css](/F:/Task/FlowWays/app/globals.css), [app/page.tsx](/F:/Task/FlowWays/app/page.tsx)
- Implementation:
1. Keep `input` font-size at `16px` on mobile.
2. Ensure action buttons remain centered and tappable at `390x844`.
3. Keep settings dock collapse behavior so no dead vertical space when closed.
- Verification:
1. iPhone-size screenshot pass for spacing/readability.
2. Tap targets remain usable without overlap.

### B2. Search loop regression guard
Status: `Open`
- Owner area: `runSearch`, filtered list behavior in [app/page.tsx](/F:/Task/FlowWays/app/page.tsx)
- Implementation:
1. Add test data-independent search assertions (search only after successful creation precondition).
2. Add UI smoke assertion that clear-search restores baseline list state.
- Verification:
1. Search-by-keyword returns created item.
2. Clear-search restores expected list.

## C) Design Experiments (Non-blocking)

### C1. Compressed vertical rhythm experiment
Status: `Open`
- Goal: reduce perceived dead space while preserving readability.
- Output: one CSS variant branch and before/after snapshots.

### C2. Stronger card hierarchy experiment
Status: `Open`
- Goal: improve scanning for power users with long content.
- Output: typography scale + metadata contrast variant with snapshot comparison.

### C3. Long-text stress experiment
Status: `Open`
- Goal: guarantee no clipping/overflow in body/chips/actions under dense text.
- Output: stress-test fixture tasks and mobile screenshots.

## Execution Order

1. A2 Manifest route fix (fast unblock for PWA reliability)  
2. A1 Add-button mode-switch fix (core functional blocker)  
3. B1/B2 regression hardening and smoke rerun  
4. C1/C2/C3 design experiment pass with Figma annotation updates

## Done Criteria

1. All A-blockers pass in Playwright smoke on production URL.  
2. `manifest.webmanifest` serves valid JSON and icon URLs return 200.  
3. Desktop + iPhone (`390x844`) smoke matrix has no functional failures.  
4. Figma board updated with status tags: `Open`, `In Progress`, `Verified`.
