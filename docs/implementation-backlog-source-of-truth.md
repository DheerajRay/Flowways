# FlowWays Implementation Backlog Source of Truth

Date: 2026-05-20  
Source inputs:
- [pm-optimization-master-plan-2026-05-20.md](/F:/Task/FlowWays/docs/pm-optimization-master-plan-2026-05-20.md)
- Figma SOT Index: https://www.figma.com/board/IvZzIu6fJRdj6mTRyNZ3a1

## 1) Label Taxonomy

Core:
- `epic`
- `story`
- `qa:required`
- `figma-linked`

Phase:
- `phase:now`
- `phase:next`
- `phase:later`

Area:
- `area:auth`
- `area:capture`
- `area:classification`
- `area:lifecycle`
- `area:feed`
- `area:visual`
- `area:pwa`
- `area:ops`

Persona:
- `persona:power`
- `persona:casual`
- `persona:time`
- `persona:journal`
- `persona:workflow`
- `persona:all`

Status marker (issue form field): `Open`, `In Progress`, `Verified`

## 2) Figma Ticket Map (Epic -> SOT File)

- `EPIC-001` to `EPIC-007` -> Overall Workflow: https://www.figma.com/board/FBzgDc1EwQ6KRwVDAWYbvd
- `EPIC-008` to `EPIC-012` -> Index/Governance: https://www.figma.com/board/IvZzIu6fJRdj6mTRyNZ3a1
- Persona-heavy stories -> Persona Testing: https://www.figma.com/board/Voll6ovclQAY1D2ofO0qj6
- Visual-heavy stories -> Visual QA: https://www.figma.com/board/VEPG0ZE4Se6fVxdWLRmG6x
- Classification/help stories -> Classification and Help: https://www.figma.com/board/7Ti2ONP4vGS3T6hXCLnjIP

Rule: every story must map to exactly one of the above Figma files.

## 3) Epic Catalog

### EPIC-001 Auth and Session Foundation
- Area: `area:auth`
- Completion: onboarding, session expiry UX, account lifecycle management shipped with smoke coverage.
- Dependencies: none.

### EPIC-002 Capture and Submit Throughput
- Area: `area:capture`
- Completion: create/search intent split, rapid capture feedback, desktop/mobile input accelerators.
- Dependencies: EPIC-011 (experimentation) for A/B rollout.

### EPIC-003 Classification Trust and Control
- Area: `area:classification`
- Completion: confidence visibility, recast workflow, strict/flexible profile behavior.
- Dependencies: EPIC-008 (analytics), EPIC-009 (SLOs).

### EPIC-004 Item Lifecycle Depth
- Area: `area:lifecycle`
- Completion: checklist dedupe preview, journal facets, timeline snooze/exceptions, expanded workflow states.
- Dependencies: EPIC-003.

### EPIC-005 Feed and Retrieval UX
- Area: `area:feed`
- Completion: saved views, quick filter chips, active filter summary and counts.
- Dependencies: EPIC-002.

### EPIC-006 Settings and Visual Utility
- Area: `area:visual`
- Completion: readability presets, accessibility panel, mobile-first action layout and density presets.
- Dependencies: EPIC-005.

### EPIC-007 PWA and Platform Reliability
- Area: `area:pwa`
- Completion: install diagnostics, version/cache prompts, iOS/Android install guidance.
- Dependencies: EPIC-010 (support incident policy).

### EPIC-008 Product Analytics Taxonomy
- Area: `area:ops`
- Completion: event taxonomy instrumented and validated.
- Dependencies: none.

### EPIC-009 Reliability and SLO Framework
- Area: `area:ops`
- Completion: latency/save-success SLOs and weekly review workflow active.
- Dependencies: EPIC-008.

### EPIC-010 Support and Incident Workflow
- Area: `area:ops`
- Completion: user-visible error IDs and incident runbook.
- Dependencies: EPIC-009.

### EPIC-011 Experimentation and Feature Flags
- Area: `area:ops`
- Completion: feature flag policy and A/B framework for UX changes.
- Dependencies: EPIC-008, EPIC-009.

### EPIC-012 Release Governance and QA Gates
- Area: `area:ops`
- Completion: mandatory smoke/visual gates and release-note policy enforced.
- Dependencies: none (foundational gate epic).

## 4) Story Catalog by Phase

## Phase Now (`phase:now`)

- `STORY-101` (EPIC-002): Capture intent split (`Create` vs `Search`) with no behavior regressions.  
- `STORY-102` (EPIC-003): Classification confidence badge + "why this type" panel.
- `STORY-103` (EPIC-003): One-click recast between journal/checklist/timeline/workflow.
- `STORY-104` (EPIC-005): Saved views (`Today`, `Overdue`, `Deep Work`, `Journal`).
- `STORY-105` (EPIC-005): Active filter summary bar with result count.
- `STORY-106` (EPIC-007): In-app install diagnostics panel (manifest/icon/service worker).
- `STORY-107` (EPIC-007): Version stamp and cache refresh prompt.
- `STORY-108` (EPIC-012): Enforce PR smoke gate checklist + report links.

## Phase Next (`phase:next`)

- `STORY-201` (EPIC-004): Workflow state expansion (`Ready`, `Review`, `Done`) UI/API parity.
- `STORY-202` (EPIC-004): Timeline snooze and recurring exception controls.
- `STORY-203` (EPIC-006): Mobile progressive action disclosure + thumb-zone primaries.
- `STORY-204` (EPIC-006): Density presets (`Comfort`, `Balanced`, `Dense`).
- `STORY-205` (EPIC-008): Analytics taxonomy instrumentation and event QA.
- `STORY-206` (EPIC-009): SLO dashboard and weekly reliability review hooks.
- `STORY-207` (EPIC-011): Feature flag scaffolding for major UX rollouts.

## Phase Later (`phase:later`)

- `STORY-301` (EPIC-004): Journal daily timeline with mood/sentiment facets.
- `STORY-302` (EPIC-004): Checklist merge dedupe preview and conflict resolution.
- `STORY-303` (EPIC-002): Capture templates and bulk import parser.
- `STORY-304` (EPIC-001): Account lifecycle screens (reset, change email, device sessions).
- `STORY-305` (EPIC-006): Desktop optional 3-column power-user layout.
- `STORY-306` (EPIC-010): Error IDs in UI + support runbook integration.
- `STORY-307` (EPIC-003): Strict vs flexible classification user profile.
- `STORY-308` (EPIC-004): Weekly review queue for overdue/stalled workflows.
- `STORY-309` (EPIC-004): Priority and effort scoring fields.
- `STORY-310` (EPIC-004): Collaboration-ready audit trail per item.
- `STORY-311` (EPIC-004): Shareable read-only views.
- `STORY-312` (EPIC-004): Export paths (markdown/csv/json).

## 5) Acceptance Contract (Required in Every Story)

Every story must include:
1. Behavior acceptance criteria.
2. Data/API acceptance criteria.
3. Visual/UX acceptance criteria.
4. Figma SOT link.
5. QA evidence requirements:
- Desktop smoke result
- iPhone 390x844 smoke result
- Report path in `tests/smoke/results/`

Additional gates:
- PWA stories must include manifest/icon route checks.
- Classification stories must include versatility + negative parsing probes.

## 6) Dependency Rails

1. `EPIC-008` before `EPIC-011`.
2. `EPIC-009` baseline before major throughput UX changes in `EPIC-002`/`EPIC-006`.
3. `EPIC-012` blocks closure of all feature epics until smoke gates are satisfied.
