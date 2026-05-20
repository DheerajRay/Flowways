# FlowWays Thorough Smoke Report

Date: 2026-05-20  
Target: `https://flowways.vercel.app/`  
Method: Playwright MCP (desktop + iPhone viewport)

## Scenario Results

1. Shell load -> Passed  
2. Create workflow task -> Passed  
3. Create journal task -> Failed (`Add task` disabled)  
4. Create timeline task -> Failed (`Add task` disabled)  
5. Create checklist task -> Failed (`Add task` disabled)  
6. Create auto long-text task -> Failed (`Add task` disabled)  
7. Search by keyword -> Failed (expected created item not visible)  
8. Clear search -> Passed  
9. Settings open/close -> Passed  
10. Mobile viewport 390x844 checks -> Passed (`inputFontSize: 16px`, `gapPx: 21`)  

## Deployment/Asset Route Validation

1. `/manifest.webmanifest` -> Failed (`404 This page could not be found`)  
2. `/icons/icon-192-v3.png` -> Passed (asset is reachable)  

## Consolidated Active Issues

1. P1: `Add task` enablement breaks across mode switches (Journal/Timeline/Checklist/Auto).  
2. P1: Production `manifest.webmanifest` route is missing (404), risking PWA install/update fidelity.  
3. P2: Search assertion failure likely downstream from failed item creation (re-verify after P1 fix).  
