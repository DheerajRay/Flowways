# FlowWays Mobile Persona Smoke Report

## Environment
- Base URL: https://flowways.vercel.app
- Date: 2026-05-19
- Timezone: America/New_York
- Browser: Edge via Playwright MCP
- Device Profiles (iPhone-sized):
  - `393x852` (iPhone 14-like)
  - `375x812` (iPhone X/11 Pro-like)
- Persona: Power user (task-management proficient, high-volume usage)
- Test Account: `flowways.mobile+********@example.com`

## Scope
- Mobile-first feature smoke
- Mobile visual/readability and dense-content usability
- Long-text and overflow stress testing

## Summary
- Scenarios Executed: 18
- Passed: 14
- Failed: 2
- At-risk UX findings: 2
- Critical defects: 0
- High defects: 1

## Scenario Results
| ID | Scenario | Status | Notes |
|---|---|---|---|
| MP-01 | Auth gate and app shell on iPhone-sized viewport | PASS | Verified at `393x852` and `375x812` |
| MP-02 | Power-user rapid multi-submit capture (4 varied tasks) | PASS | Items persisted; no stuck busy state |
| MP-03 | Long checklist parsing and render | PASS | Multi-line checklist rendered correctly |
| MP-04 | Long journal body readability | PASS | Body wraps correctly; no card overflow |
| MP-05 | Long token/word overflow stress | PASS | No layout break observed |
| MP-06 | Timeline reminder rendering with due metadata | PASS | Due/time chip visible and legible |
| MP-07 | Workflow rail action visibility on narrow width | PASS | Backlog/Paused/In Progress controls present |
| MP-08 | Done -> Undo/Hide action swap | PASS | Correct control set shown |
| MP-09 | Tag filters open and selectable | PASS | Tag chips are tappable |
| MP-10 | Tag filter correctly narrows feed | PASS | `#incident` reduced feed to matching item |
| MP-11 | Clear tags restores full feed | PASS | Full feed restored |
| MP-12 | Settings panel opens in iPhone viewport | PASS | Controls present; vertical scrolling needed |
| MP-13 | Settings + Tag panel simultaneous open state | FAIL | Overlapping active surfaces on narrow viewport |
| MP-14 | Dense feed readability for power-user scanning | AT-RISK | Metadata/action density high for narrow width |
| MP-15 | Search/filter toolbar touch ergonomics | AT-RISK | Compact icon cluster requires precision taps |
| MP-16 | Console/network health | PASS | No new runtime error pattern in rerun |
| MP-17 | Persisted final state sanity check | PASS | Feed coherent; no ghost items |
| MP-18 | Cross-size consistency (`393x852` vs `375x812`) | PASS | Same issue pattern, no new breakage at smaller width |

## Defects
### DEF-MOB-001 (High)
- Area: Mobile interaction model
- Issue: Settings panel and Tag filters window can remain open simultaneously.
- Impact: On iPhone widths, this creates stacked interactive regions competing for attention/touch.
- Expected: Opening one panel dismisses the other, or a single active surface policy applies.
- Actual: Both remain active and rendered.

### DEF-MOB-002 (Medium)
- Area: Information hierarchy
- Issue: Dense metadata + controls produce high visual load on mobile with long-content feed.
- Impact: Reduced scan speed for power users triaging many tasks quickly.
- Expected: Progressive disclosure for secondary metadata/chips.
- Actual: Persistent expanded detail across cards creates clutter.

## Visual/Readability Findings (Persona-Oriented)
- Long titles and long paragraphs wrap correctly; no clipping/overflow break found.
- Checklist rows remain readable and individually tappable.
- Card actions are functional but crowded under dense feed conditions.
- The main readability issue is cognitive density, not text overflow.

## Console/Network
- Observed in this iPhone rerun:
  - intermittent `400 /api/items` only for intentionally invalid timeline input path.
- No additional frontend runtime errors introduced by viewport switch.

## Evidence (iPhone rerun)
- `tests/smoke/results/evidence/iphone14-393x852.png`
- `tests/smoke/results/evidence/iphonex-375x812.png`
- `tests/smoke/results/evidence/iphone14-persona-dense-feed.png`
- `tests/smoke/results/evidence/iphone14-persona-settings-tags.png`
- `tests/smoke/results/evidence/iphone14-persona-filtered.png`
- `tests/smoke/results/evidence/iphonex-persona-base.png`

## Recommended Next Fix Pass
1. Enforce single-active-panel behavior on mobile (`Settings` vs `Tag filters`).
2. Introduce mobile-density mode for cards:
   - collapse secondary chips by default
   - keep primary due/status/action visible
   - expand details on tap
3. Increase touch target spacing in toolbar and card actions.
