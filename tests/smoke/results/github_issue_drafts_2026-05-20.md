# GitHub Issue Drafts (Ready to Paste)

Repository: `DheerajRay/Flowways`
Source run: `tests/smoke/results/playwright_mcp_integration_report_2026-05-20.md`

## 1) [Smoke][P1] Add task stays disabled after switching classification modes

### Body
During Playwright MCP smoke testing on production (`https://flowways.vercel.app/`), `Add task` becomes disabled after switching away from Workflow mode, even with non-empty input.

#### Repro
1. Open app and wait for shell load.
2. Enter text in `Add task | Search`.
3. Select `Workflow mode` and add task (works).
4. Enter new text, switch to `Journal mode` (or `Auto`, `Timeline`, `Checklist`).
5. Try to click `Add task`.

#### Actual
`Add task` remains disabled despite non-empty input.

#### Expected
`Add task` should be enabled whenever input has non-whitespace content and no blocking state is present.

#### Impact
- Blocks multi-mode capture workflow.
- Breaks classification smoke scenarios.

#### Evidence
`tests/smoke/results/playwright_mcp_integration_report_2026-05-20.md`

---

## 2) [Deploy][P1] manifest.webmanifest returns 404 on production

### Body
Production URL `https://flowways.vercel.app/manifest.webmanifest` currently returns a 404 page, which can break PWA install/update behavior.

#### Repro
1. Open `https://flowways.vercel.app/manifest.webmanifest`.
2. Observe response page.

#### Actual
Returns `404 - This page could not be found`.

#### Expected
Manifest should return valid JSON with icon references and app metadata.

#### Impact
- PWA install/update behavior is unreliable.
- Icon/title propagation can fail or be stale.

#### Evidence
- Playwright snapshot during validation showed 404 content for manifest route.
- Prior console errors tied to icon/manifest fetch in smoke runs.
