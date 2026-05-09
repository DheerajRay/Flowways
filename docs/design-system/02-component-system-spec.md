# FlowWays Component System Spec

## Component Taxonomy

## Foundations

- Color tokens
- Typography tokens
- Spacing tokens
- Radius tokens
- Elevation tokens
- Motion tokens (phase 2)

## Primitives

- Button
- Input
- Select/Dropdown
- Toggle/Segment
- Chip/Tag
- Icon button
- Status pill
- Divider

## Composite Components

- Capture composer
- Task row
- Metric card
- Board card
- Timeline event row
- Filter toolbar
- Reminder list item
- Empty state block
- Dialog shell

## Stateful Requirements (Mandatory)

All interactive components must include:
1. Default
2. Hover
3. Pressed/Active
4. Focus-visible
5. Disabled

Form controls must also include:
1. Error
2. Success (where relevant)
3. Helper text

## Button Specification

Variants:
- `Primary`
- `Secondary`
- `Ghost`
- `Destructive`

Sizes:
- `sm` (`36h`)
- `md` (`40h`)
- `lg` (`44h`)

Rules:
- One primary button per decision region
- Icon-only buttons require accessible label
- Disabled buttons cannot be the only path to completion

## Input/Select Specification

Input anatomy:
- Label
- Field container
- Value/placeholder
- Assistive text (helper or error)

Rules:
- Label always present (or explicit aria-label contract)
- Error state must include explanatory copy
- Placeholder is not a label replacement

## Task Row Pattern

Required zones:
1. Completion affordance
2. Title/editable text
3. Metadata strip
4. Quick action zone

Rules:
- Row height must remain stable between default and hover
- Actions should not shift text baseline
- Color accent indicates mode, not completion

## Cards and Panels

Defaults:
- Radius: `8`
- Border: `1px line token`
- Internal padding: `16`

Rules:
- Card headers should use title + optional meta, never overload with actions
- Use internal separators for dense card content

## Navigation System

Patterns:
- Rail nav item
- Horizontal condensed nav item

States:
- Default
- Hover
- Active
- Disabled

Rules:
- Active state must be visible without color-only dependence
- Current page indicator should be persistent across breakpoints

## Color and Semantic Contracts

Mode accents:
- Checklist: green
- Journal: blue
- Workflow: amber
- Timeline: red

Status semantics:
- Success, warning, error colors reserved for state semantics
- Mode accent colors should not be reused for validation errors

## Accessibility Contracts

- Minimum touch target: `44x44` mobile, `40x40` desktop
- Focus ring token required for all keyboard-focusable elements
- Text contrast and control contrast must meet WCAG AA

## Governance

A new component can be added only if:
1. Existing component cannot satisfy the use case with variants.
2. It has full state coverage.
3. It maps to existing tokens or proposes reviewed new tokens.
4. It includes usage, do/don't examples, and accessibility notes.

