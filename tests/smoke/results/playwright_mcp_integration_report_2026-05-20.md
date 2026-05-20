# Playwright MCP Integration Report

Date: 2026-05-20
Target: `https://flowways.vercel.app/`
Viewport baseline: desktop then iPhone size (`390x844`)

## Scenario Results

1. `App shell boot` -> Passed
2. `Create task - Workflow mode` -> Passed
3. `Create task - Journal mode` -> Failed (`Add task` disabled)
4. `Create task - Auto mode ambiguous` -> Failed (`Add task` disabled)
5. `Create task - Timeline mode` -> Failed (`Add task` disabled)
6. `Create task - Checklist mode` -> Failed (`Add task` disabled)
7. `Create long text task` -> Failed (`Add task` disabled in Auto mode)
8. `Search keyword hotfix` -> Passed
9. `Clear search restore` -> Passed
10. `Mobile viewport iPhone 390x844` -> Passed (`input font-size: 16px`, measured section gap: `21px`)

## Blocking Issues Found

1. Classification modes intermittently disable task creation:
- After switching from `Workflow mode` to other modes, `Add task` stayed disabled despite non-empty input.
- Impacts: Journal/Auto/Timeline/Checklist and long-text smoke coverage.

2. Deployed icon assets are currently missing:
- Console error: `404` for `/icons/icon-192-v3.png`
- Console error: `404` for `/icons/icon-512-v3.png`
- Impact: installed PWA icon cannot update consistently on mobile.

## Suggested Fix Order

1. Fix `Add task` enablement state logic across all mode toggles.
2. Verify icon assets are present in deployed output and reachable.
3. Re-run this exact matrix and update this report with a clean pass set.
