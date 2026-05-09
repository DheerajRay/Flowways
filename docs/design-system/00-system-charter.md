# FlowWays Design System Charter

## Purpose

FlowWays needs a design system that optimizes for daily clarity, low cognitive load, and fast capture-to-action loops across Checklist, Journal, Workflow, and Timeline modes.

This system is not a visual style sheet only. It is a product operating language for:
- Decision velocity
- Feature consistency
- Predictable interaction behavior
- Scalable implementation tokens

## Design Intent: Theme + Language + Style

## Theme

`Calm Operational Clarity`

The interface should feel:
- Focused, not decorative
- Warm and humane, not sterile
- Structured, not rigid
- Quiet, but decisive for primary actions

## Visual Language

- Surfaces: warm light neutrals for long-session comfort.
- Accents: functional, mode-based accents only (Checklist/Journal/Workflow/Timeline).
- Contrast model: ink-first hierarchy with secondary muted text.
- Structure model: panelized information with clear separators and predictable spacing rhythm.

## Interaction Language

- Primary action always singular per context block.
- Feedback hierarchy:
1. Structural feedback (layout/state change)
2. Color feedback (semantic)
3. Motion feedback (subtle, optional)
- Focus and keyboard states are first-class, not fallback.

## Content Language

- Sentence case by default.
- Labels are verbs when actionable, nouns when navigational.
- Metadata stays concise and scannable.
- Error copy is corrective and specific.

## Product Principles

1. Reduce decision friction.
2. Make status legible at a glance.
3. Keep capture faster than classification.
4. Keep layout stable across modes.
5. Make accessibility defaults non-optional.

## Core Constraints

- Do not introduce color that has no semantic job.
- Do not create one-off components without token mapping.
- Do not ship states without disabled/focus/error behavior.
- Do not mix spacing scales outside the official ladder.

## Design System Scope (Phase 1)

- Foundations: color, type, spacing, elevation, radius, motion
- Layout system: shell, grids, responsive rules, page templates
- Component system: primitives + composite patterns + states
- Usage rules: behavior, copy, accessibility, handoff contracts

