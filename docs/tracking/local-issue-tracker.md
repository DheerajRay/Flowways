# FlowWays Local Issue Tracker (Docs-Native)

Date initialized: 2026-05-20  
Tracker owner: PM + Eng  
Status model: `Open` -> `In Progress` -> `Blocked` -> `In Review` -> `Verified` -> `Closed`

Related source docs:
- [PM Optimization Master Plan](/F:/Task/FlowWays/docs/product/pm-optimization-master-plan.md)
- [Implementation Backlog Source of Truth](/F:/Task/FlowWays/docs/tracking/implementation-backlog.md)
- [Ticketing Playbook](/F:/Task/FlowWays/docs/tracking/ticketing-playbook.md)

Figma source-of-truth set:
- Index: https://www.figma.com/board/IvZzIu6fJRdj6mTRyNZ3a1
- Overall Workflow: https://www.figma.com/board/FBzgDc1EwQ6KRwVDAWYbvd
- Persona Testing: https://www.figma.com/board/Voll6ovclQAY1D2ofO0qj6
- Visual QA: https://www.figma.com/board/VEPG0ZE4Se6fVxdWLRmG6x
- Classification & Help: https://www.figma.com/board/7Ti2ONP4vGS3T6hXCLnjIP

---

## 1) Working Rules

1. Every story must map to exactly one epic.
2. Every story must map to exactly one Figma SOT file.
3. No item can move to `Verified` without smoke evidence under `tests/smoke/results/`.
4. PWA stories require explicit manifest + icon route checks.
5. Classification stories require versatility + negative parsing probe evidence.

---

## 2) Epic Board

| Epic ID | Title | Phase | Area | Depends On | Status | Figma File | Completion Definition |
|---|---|---|---|---|---|---|---|
| EPIC-001 | Auth and Session Foundation | Later | auth | none | In Progress | Overall Workflow | onboarding + session expiry UX + account lifecycle shipped |
| EPIC-002 | Capture and Submit Throughput | Now | capture | EPIC-011 (rollout) | Open | Overall Workflow | create/search split + throughput interactions stable |
| EPIC-003 | Classification Trust and Control | Now | classification | EPIC-008, EPIC-009 | Open | Classification & Help | confidence + recast + control profile delivered |
| EPIC-004 | Item Lifecycle Depth | Next | lifecycle | EPIC-003 | Open | Overall Workflow | deeper checklist/journal/timeline/workflow behavior |
| EPIC-005 | Feed and Retrieval UX | Now | feed | EPIC-002 | Open | Overall Workflow | saved views + chips + summary/counts live |
| EPIC-006 | Settings and Visual Utility | Next | visual | EPIC-005 | Open | Visual QA | readability/accessibility + mobile action UX |
| EPIC-007 | PWA and Platform Reliability | Now | pwa | EPIC-010 | Open | Visual QA | install diagnostics + cache refresh + guidance |
| EPIC-008 | Product Analytics Taxonomy | Next | ops | none | Open | Index | event taxonomy instrumented |
| EPIC-009 | Reliability and SLO Framework | Next | ops | EPIC-008 | Open | Index | SLO baselines + weekly reliability cadence |
| EPIC-010 | Support and Incident Workflow | Later | ops | EPIC-009 | Open | Index | error IDs + incident runbook integration |
| EPIC-011 | Experimentation and Feature Flags | Next | ops | EPIC-008, EPIC-009 | Open | Index | feature flag and A/B framework ready |
| EPIC-012 | Release Governance and QA Gates | Now | ops | none | Open | Index | pre-merge and post-deploy gates enforced |

---

## 3) Story Board

### 3.1 Phase Now

| Story ID | Epic | Title | Persona | Status | Priority | Figma File | QA Required |
|---|---|---|---|---|---|---|---|
| STORY-101 | EPIC-002 | Capture intent split (Create vs Search) | all | Open | P0 | Overall Workflow | Yes |
| STORY-102 | EPIC-003 | Classification confidence and rationale | all | Open | P0 | Classification & Help | Yes |
| STORY-103 | EPIC-003 | One-click recast across item kinds | power | Open | P1 | Classification & Help | Yes |
| STORY-104 | EPIC-005 | Saved views (Today/Overdue/Deep Work/Journal) | power | Open | P1 | Persona Testing | Yes |
| STORY-105 | EPIC-005 | Filter summary bar with result count | power | Open | P1 | Overall Workflow | Yes |
| STORY-106 | EPIC-007 | In-app install diagnostics | all | Open | P0 | Visual QA | Yes |
| STORY-107 | EPIC-007 | Version stamp + cache refresh prompt | all | Open | P1 | Visual QA | Yes |
| STORY-108 | EPIC-012 | Enforce PR smoke/report checklist | workflow | Open | P0 | Index | Yes |

### 3.2 Phase Next

| Story ID | Epic | Title | Persona | Status | Priority | Figma File | QA Required |
|---|---|---|---|---|---|---|---|
| STORY-201 | EPIC-004 | Workflow state expansion (Ready/Review/Done) | workflow | Open | P0 | Overall Workflow | Yes |
| STORY-202 | EPIC-004 | Timeline snooze + recurrence exceptions | time | Open | P0 | Classification & Help | Yes |
| STORY-203 | EPIC-006 | Mobile progressive action disclosure | power | Open | P0 | Visual QA | Yes |
| STORY-204 | EPIC-006 | Density presets (Comfort/Balanced/Dense) | power | Open | P1 | Visual QA | Yes |
| STORY-205 | EPIC-008 | Analytics taxonomy instrumentation | all | Open | P0 | Index | Yes |
| STORY-206 | EPIC-009 | SLO dashboard and weekly reliability hooks | workflow | Open | P1 | Index | Yes |
| STORY-207 | EPIC-011 | Feature-flag framework for UX rollouts | workflow | Open | P1 | Index | Yes |

### 3.3 Phase Later

| Story ID | Epic | Title | Persona | Status | Priority | Figma File | QA Required |
|---|---|---|---|---|---|---|---|
| STORY-301 | EPIC-004 | Journal daily timeline + mood facets | journal | Open | P2 | Persona Testing | Yes |
| STORY-302 | EPIC-004 | Checklist dedupe preview | power | Open | P2 | Overall Workflow | Yes |
| STORY-303 | EPIC-002 | Capture templates + bulk import parser | power | Open | P2 | Overall Workflow | Yes |
| STORY-304 | EPIC-001 | Account lifecycle screens | casual | Open | P2 | Overall Workflow | Yes |
| STORY-305 | EPIC-006 | Desktop optional 3-column layout | power | Open | P2 | Visual QA | Yes |
| STORY-306 | EPIC-010 | Error IDs + support runbook integration | all | Open | P2 | Index | Yes |
| STORY-307 | EPIC-003 | Strict vs flexible classification profile | power | Open | P2 | Classification & Help | Yes |
| STORY-308 | EPIC-004 | Weekly review queue for stalled work | workflow | Open | P2 | Persona Testing | Yes |
| STORY-309 | EPIC-004 | Priority + effort scoring fields | workflow | Open | P2 | Overall Workflow | Yes |
| STORY-310 | EPIC-004 | Audit trail per item | workflow | Open | P2 | Overall Workflow | Yes |
| STORY-311 | EPIC-004 | Shareable read-only views | workflow | Open | P2 | Overall Workflow | Yes |
| STORY-312 | EPIC-004 | Export paths (md/csv/json) | workflow | Open | P2 | Overall Workflow | Yes |

---

## 4) Active Sprint Queue (Now Phase)

| Order | Story ID | Goal | Owner | Status | Notes |
|---|---|---|---|---|---|
| 1 | STORY-106 | Restore install confidence with diagnostics | Unassigned | Open | unblock PWA confusion |
| 2 | STORY-101 | Remove create/search ambiguity | Unassigned | Open | impacts capture conversion |
| 3 | STORY-102 | Improve classification trust | Unassigned | Open | requires UI + API signal path |
| 4 | STORY-105 | Improve retrieval clarity | Unassigned | Open | low risk UX gain |
| 5 | STORY-108 | Governance enforcement | Unassigned | Open | blocks story verification integrity |
| 6 | STORY-103 | Fast correction workflow | Unassigned | Open | reduce edit friction |
| 7 | STORY-104 | Saved views for power users | Unassigned | Open | high UX payoff |
| 8 | STORY-107 | Cache refresh prompt | Unassigned | Open | post-deploy hygiene |

---

## 4.1 Epic Demonstration: EPIC-001 Process Walkthrough

Purpose: show the exact operating process before bulk updates.

Current example state:
1. `EPIC-001` moved from `Open` to `In Progress` for process demonstration.
2. Candidate child story selected: `STORY-304` (account lifecycle screens).
3. Draft decomposition for `STORY-304`:
- reset password flow UX
- change email flow UX
- session/device management view
- smoke + visual QA acceptance
4. Completion rule for this epic remains unchanged:
- Do not move to `Verified` until deployed smoke evidence is linked and Figma status is updated.

Next action for this epic:
- create and move `STORY-304` to `In Progress` once implementation begins.

---

## 5) Update Log

Use this log for every status move or scope change.

| Date | ID | Change | From | To | By | Evidence |
|---|---|---|---|---|---|---|
| 2026-05-20 | EPIC-001..EPIC-012 | Tracker initialized | n/a | Open | Codex | this document |
| 2026-05-20 | EPIC-001 | Demonstration kickoff | Open | In Progress | Codex | section 4.1 in this document |

---

## 6) Story Update Template

Copy this block for any story detail page/update:

```md
### STORY-XYZ Title
- Epic:
- Phase:
- Area:
- Persona:
- Status:
- Priority:
- Figma:
- Dependencies:

Acceptance Criteria
1.
2.
3.

QA Evidence
- Desktop smoke:
- iPhone 390x844 smoke:
- Report path:
- Notes:
```

