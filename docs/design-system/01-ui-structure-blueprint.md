# FlowWays UI Structure Blueprint

## Global Shell Architecture

Desktop baseline:
- Left rail: `240px`
- Main content: fluid
- Optional context panel: `320px`
- Outer canvas padding: `24px`

Tablet (`<=1040px`):
- Rail compresses to horizontal sticky nav band
- Context panel collapses below main content

Mobile (`<=720px`):
- Single-column stack
- Composer and controls full-width
- Status/filters become vertically grouped

## Layout Ladder

Allowed spacing ladder:
- `4, 8, 12, 16, 24, 32, 40, 56, 72`

Layout rhythm defaults:
- Section-to-section: `24-32`
- Card-to-card: `12-16`
- Label-to-field: `8`
- Field-to-help/error: `6-8`

## Page Archetypes

## A. Dashboard

Order:
1. Capture composer
2. Status strip
3. Metrics band
4. Main task stream
5. Optional contextual map/panel

Rules:
- No more than 4 metric cards in primary row
- Primary CTA anchored near composer, not deep in content

## B. Task List

Order:
1. Section heading + mode selector
2. Filter/sort controls
3. Item list
4. Inline detail/edit states

Rules:
- Filters remain sticky in scrollable contexts
- Row actions stay right-aligned and predictable

## C. Workflow Board

Order:
1. Board controls
2. Horizontal columns
3. Card content summary

Rules:
- Minimum column width `180px`
- Keep column count stable to avoid spatial disorientation

## D. Timeline

Order:
1. Date range and filtering
2. Chronological sections
3. Event/item cards

Rules:
- Temporal labels always visible
- Critical deadlines require dual encoding (icon + color)

## E. Settings & Data Ops

Order:
1. Account/status context
2. Export/import controls
3. Preferences and safeguards

Rules:
- Use narrow readable form width (`max ~760px`)
- Destructive actions isolated and visually distinct

## Information Hierarchy Model

Each screen block must map to one of:
- `Action`: capture/create/commit
- `State`: counts, status, mode
- `Content`: task/journal/workflow item body
- `Meta`: dates, labels, tags, reminders

If a block cannot be classified, redesign it.

## Responsive Behavior Contracts

- Priority order on collapse:
1. Keep action controls visible
2. Keep current content visible
3. Move context panels below fold
- Never hide active task state on breakpoint changes.

## Accessibility Structure Rules

- Heading levels must remain semantically ordered per page.
- Keyboard traversal follows visual order.
- Focus trap required for modal/dialog contexts.
- Any sticky region must not block primary content at 200% zoom.

