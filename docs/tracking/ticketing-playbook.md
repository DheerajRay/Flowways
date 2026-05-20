# FlowWays Ticketing Playbook (GitHub + Figma SOT)

Date: 2026-05-20  
Canonical tracker: GitHub Issues  
Design/spec truth: FlowWays SOT Figma files

## 1) Ticket Types

1. Epic (`epic.yml`)
- Umbrella scope, dependencies, and completion definition.

2. Feature Story (`feature-story.yml`)
- Execution unit mapped to one epic and one Figma SOT file.

3. Bug Regression (`bug-regression.yml`)
- Defect or regression ticket with evidence and status markers.

4. Smoke Regression (`smoke-regression.yml`)
- QA-run specific regression tracking.

## 2) Ticket Lifecycle

Status marker progression:
1. `Open` at creation.
2. `In Progress` when work branch/PR opens.
3. `Verified` only after deployed smoke evidence is linked.

Rules:
- Do not skip states.
- If regression appears after `Verified`, reopen and reset to `In Progress`.

## 3) Story Creation Checklist

Before creating a story, confirm:
1. Story ID exists in [implementation-backlog-source-of-truth.md](/F:/Task/FlowWays/docs/tracking/implementation-backlog.md).
2. Parent epic exists and is linked.
3. Labels include:
- `story`
- one phase label
- one area label
- one persona label
- `qa:required`
- `figma-linked`
4. Exactly one Figma SOT link is included.
5. Acceptance criteria are explicit and testable.

## 4) PR Workflow

Every PR must:
1. Link epic and story IDs.
2. Include Figma SOT reference URL.
3. Include smoke report path(s).
4. Include issue-marker transition proof comments in linked issues.
5. Satisfy PR template checks, including:
- desktop smoke pass
- iPhone 390x844 smoke pass
- manifest route check
- PWA icon route check

## 5) QA Evidence Standard

For story verification:
1. Link test report path under `tests/smoke/results/`.
2. Include expected vs actual summary in issue.
3. Include screenshot or route-output evidence for visual/PWA changes.

Special gates:
- Classification stories must include:
  - versatility suite results
  - negative parsing probe results
- PWA stories must include:
  - `/manifest.webmanifest` route proof
  - icon route proof

## 6) Figma Sync Rules

1. Every story references one SOT file:
- Overall workflow
- Persona testing
- Visual QA
- Classification/help

2. Update relevant Figma section when behavior/design changes.
3. Include Figma update note in PR notes.
4. Story cannot move to `Verified` unless Figma and smoke evidence are both current.

## 7) Weekly Governance Cadence

1. PM + Eng backlog review:
- validate phase alignment
- validate dependencies
- prune/merge stale stories

2. Reliability review:
- check SLO trends and regression rates
- update risk stories as needed

3. Release governance review:
- verify phase-now stories meet all gates before release cut.
