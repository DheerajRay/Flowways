# Local Issue Tracker Operations

This file defines how to operate [local-issue-tracker.md](/F:/Task/FlowWays/docs/local-issue-tracker.md) as the canonical execution tracker while GitHub connector automation is unavailable.

## 1) Cadence

1. Daily:
- Move stories between `Open`, `In Progress`, `Blocked`, `In Review`, `Verified`, `Closed`.
- Append changes to the `Update Log`.

2. Per PR:
- Ensure linked story status is `In Progress`.
- Before merge, attach smoke report path and move to `In Review`.
- After deployed smoke pass, move to `Verified`.

3. Weekly:
- Review Phase Now queue order.
- Re-check dependency rails for blocked items.
- Promote eligible Next stories only if Now queue has capacity.

## 2) Status Transition Rules

1. `Open -> In Progress`
- Assignee and implementation branch exist.

2. `In Progress -> Blocked`
- External dependency, environment, or decision gap blocks progress.

3. `In Progress -> In Review`
- Code done and PR opened with smoke run scheduled.

4. `In Review -> Verified`
- Deployed smoke evidence linked (`tests/smoke/results/*`) and acceptance criteria met.

5. `Verified -> Closed`
- Post-release confirmation complete and no immediate rollback item open.

## 3) Minimum Evidence by Story Type

1. All stories:
- Desktop smoke result.
- iPhone 390x844 smoke result.

2. PWA stories:
- `/manifest.webmanifest` check.
- icon route checks.

3. Classification stories:
- versatility suite results.
- negative parsing probe results.

## 4) Reconciliation Back to GitHub (When Connector Returns)

1. Create missing Epic and Story issues from local tracker IDs.
2. Copy current status and update history into issue bodies/comments.
3. Preserve local IDs (`EPIC-*`, `STORY-*`) as canonical keys.
4. Keep local tracker as fallback mirror for 1 sprint, then optionally reduce to index-only.

