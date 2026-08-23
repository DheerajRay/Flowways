# FlowWays Architecture

## Product intent

FlowWays accepts a task in ordinary language, classifies its intent, and renders
an interface suited to the work. A meeting, checklist, timeline, journal entry,
or workflow can share one application without sharing one generic layout.

The product does not ask AI to invent the interface. AI interprets the input;
owned components decide how that interpretation is presented and edited.

## System boundaries

### Classification

`src/server/ai/classifier-service.ts` and the classifier domain code translate
user language into the validated item schema. Classification is variable, so
its output must be parsed and checked before it reaches persistence or UI.

### Schemas and domain behavior

Shared schemas and item types define the contract between classification, API
routes, persistence, and rendering. Timeline, journal, checklist, and workflow
behaviors belong in domain or server modules, not in presentation event
handlers.

### Owned UI templates

The application chooses a known task template from the validated item type.
Templates may adapt their fields and actions, but their structure remains owned
and testable. AI classification can select a template; it cannot generate
arbitrary markup or styling.

### Settings and themes

Application settings control typography, density, colors, and related component
choices through one shared contract. A setting must be reflected consistently
across task types and both desktop and mobile layouts.

### Persistence and authentication

API routes use the authenticated Supabase boundary. Browser requests use the
shared authenticated fetch path. Local browser state may support presentation
preferences, but it must not create a separate identity or data model.

## Invariants

1. Natural language is variable; the stored item schema is explicit.
2. AI classifies intent, while owned templates render the interface.
3. Settings apply through one shared component system.
4. Desktop and mobile expose the same task capabilities.
5. Authentication behaves consistently in a normal window and an embedded
   presentation viewport.
6. Classification and UI changes retain unit coverage and browser evidence.
7. A failed scenario is recorded with enough evidence to reproduce it.

## Verification layers

- Unit tests verify classification precedence, schema parsing, authentication,
  checklist behavior, timeline behavior, and shared fetch contracts.
- Integration tests verify boundaries between schemas and services.
- Playwright smoke scenarios exercise real sentence variations and capture the
  rendered result at desktop and mobile sizes.

The canonical browser scenario library is
`tests/smoke/scenarios/smoke-test-scenarios.md`. A regression report should name
the input, expected classification, actual UI, viewport, and supporting image or
trace.

