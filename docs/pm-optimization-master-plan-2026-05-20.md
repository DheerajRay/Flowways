# FlowWays PM Optimization Master Plan

Date: 2026-05-20  
Role lens: Product Manager  
Scope: End-to-end improvements across process, functionality depth, UX utility, and application operating structure.

## 1) Product-Level Objectives

1. Increase task capture reliability and speed.
2. Reduce ambiguity in classification outcomes.
3. Improve readability and execution flow for power users on mobile and desktop.
4. Add missing app-operational structure for scale: analytics, quality gates, incident workflow, and release governance.

## 2) Current Process Review and Improvements

### 2.1 Auth and Session
Current:
- Email/password auth gate, session restore, sign-out flow.

Improve:
1. Add first-login onboarding step (30-second guided flow).
2. Add explicit session-expiry banner with one-click re-auth.
3. Add account lifecycle screens: reset password, change email, device/session management.

Impact:
- Fewer drop-offs during first-run and fewer support failures around session confusion.

### 2.2 Capture and Submit
Current:
- Single input, mode buttons, add/search actions, color tag option.

Improve:
1. Split input intent states clearly: `Create` vs `Search` as a segmented control (not mixed mental model).
2. Add optimistic “queued save” indicator for fast repeated captures.
3. Introduce keyboard-first shortcuts on desktop and hold-to-record quick capture on mobile.

Impact:
- Faster throughput for power users and lower interaction ambiguity.

### 2.3 Classification Pipeline
Current:
- AI-first classification with fallback and mode hints.

Improve:
1. Add confidence badges and “why this type” explainer per created item.
2. Add one-click recast: convert item type without full edit flow.
3. Add user-tunable classification profile (strict mode vs flexible mode).

Impact:
- Better trust and correction speed when classification is imperfect.

### 2.4 Item Lifecycles
Current:
- Checklist merge logic, journal diary behavior, timeline validation, workflow states.

Improve:
1. Checklist: add duplicate detection preview before merge.
2. Journal: add daily timeline view and sentiment/mood tag facets.
3. Timeline: add snooze, “done for now,” and recurring exceptions.
4. Workflow: support `Ready`, `Review`, `Done` states consistently in UI and API.

Impact:
- Moves from task storage to active execution management.

### 2.5 Feed and Filtering
Current:
- Mode filter, search text, tags AND/OR, color filters, hidden items, timeline-priority sorting.

Improve:
1. Add saved views (e.g., “Today,” “Overdue,” “Deep Work,” “Journal Only”).
2. Add quick chips for frequent filters and one-tap reset.
3. Add result count and active-filter summary bar.

Impact:
- Better retrieval and control in dense datasets.

### 2.6 Settings and Theming
Current:
- Theme/font/size/palette/pet settings.

Improve:
1. Add “Readability mode” preset for mobile-heavy users.
2. Add accessibility panel: contrast check, reduced motion, touch target validator.
3. Add per-device preference sync fallback and reset-to-default profile.

Impact:
- Higher usability consistency and accessibility confidence.

### 2.7 PWA and Install
Current:
- Manifest and icon set with cache sensitivity.

Improve:
1. Add in-app install status diagnostics panel (manifest/icon/service-worker checks).
2. Add version stamp and cache-refresh prompt after deploys.
3. Add platform-specific install help cards (iOS vs Android).

Impact:
- Reduces install confusion and stale asset support burden.

## 3) Visual and UX Usefulness Upgrades

### Desktop
1. Introduce three-column optional layout for power users: capture, active list, context/detail.
2. Promote metadata hierarchy with subtle separators and clearer action grouping.
3. Add batch action mode for list operations.

### Mobile
1. Convert action rows into progressive disclosure to reduce visual crowding.
2. Keep primary actions sticky near thumb-zone; secondary actions in expandable row.
3. Use dynamic spacing rules tied to settings dock state to prevent dead whitespace.
4. Tooltips: replace hover semantics with tap-hints and guided labels.

### Cross-platform
1. Add “density presets” (Comfort, Balanced, Dense).
2. Add text truncation strategy with expand-on-tap for long content.
3. Add explicit empty states and zero-result guidance.

## 4) Functionality Deepening Roadmap

### Capture Intelligence
1. Quick templates: meeting note, grocery list, release checklist, daily reflection.
2. Context-aware defaults based on time/day and recent behavior.
3. Bulk import parser from plain text block into multiple tasks.

### Execution Layer
1. Smart review queue for overdue and stalled workflow items.
2. Priority and effort fields with lightweight scoring.
3. Weekly review summary card with recommended cleanups.

### Collaboration-Ready Foundation
1. Shareable read-only views.
2. Export options (markdown/csv/json).
3. Audit trail per item (major edits, type recasts, status transitions).

## 5) Missing Application Structure (Must Add)

1. Product analytics taxonomy:
- capture_started, capture_submitted, classify_succeeded, classify_corrected, search_used, filter_saved, install_completed.

2. Reliability framework:
- SLOs for classification latency and save success.
- Error budget alerting and weekly reliability review.

3. Experimentation structure:
- Feature flags for major UX changes.
- A/B framework for capture bar and filter discoverability.

4. Support and incident workflow:
- Error IDs in UI.
- Incident runbook for API degradation.

5. Release governance:
- Required pre-merge smoke matrix and post-deploy validation checks.
- Versioned release notes tied to UX/behavior changes.

## 6) Prioritized Delivery Plan

### Phase 1 (Now, 1-2 sprints)
1. Stabilize capture/search mental model split.
2. Add classification confidence + recast action.
3. Implement saved views and filter summary bar.
4. Implement install diagnostics and cache-refresh messaging.

### Phase 2 (Next, 2-4 sprints)
1. Add workflow state expansion + timeline snooze/exception features.
2. Mobile progressive action layout + density presets.
3. Analytics taxonomy and reliability dashboards.

### Phase 3 (Later)
1. Collaboration-ready export/share layer.
2. Weekly review intelligence and template marketplace.
3. Advanced personalization and predictive defaults.

## 7) KPI Model

Primary:
1. Capture success rate.
2. Time-to-first-useful-task.
3. Classification correction rate.
4. Search-to-open success rate.
5. 7-day retention for mobile-only users.

Secondary:
1. Average actions per session.
2. Overdue reduction rate.
3. Install completion rate and stale-icon support tickets.

## 8) Execution Rules for This Plan

1. Every improvement maps to one of the SOT boards and one issue marker status.
2. No feature ships without smoke + visual QA update.
3. Major UX changes require before/after snapshots and KPI hypothesis.
