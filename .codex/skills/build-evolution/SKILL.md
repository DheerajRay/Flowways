---
name: build-evolution
description: Extend FlowWays using inherited product-memory, verification, connected-data, mobile, and PWA rules, plus owned UI templates and browser evidence for variable language inputs. Use for feature work, fixes, refactors, and release preparation in this repository.
---

# Build Evolution

Use the documented build history as the starting point, then close the loop
between variable language, predictable UI, and observable browser behavior.

## Inherited rules

- Read `README.md`, `docs/architecture.md`, and relevant `CHANGELOG.md` entries.
- Preserve explicit ownership boundaries and explain behavioral changes.
- Keep authentication and persistence behind the shared Supabase paths.
- Keep runtime AI server-side and validate its output before use.
- Plan desktop and mobile behavior together and preserve PWA support.
- Maintain focused unit tests and run the complete verification commands.

## FlowWays rules

- AI may classify an input. It must not generate arbitrary interface markup.
- Render validated item types with owned, reusable component templates.
- Apply typography, theme, density, and layout settings through the shared
  settings contract.
- Add a representative sentence scenario when classification or template
  behavior changes.
- Use Playwright to capture the rendered outcome at desktop and mobile sizes.
- Turn a visible failure into a reproducible issue containing the input,
  expected result, actual result, environment, and evidence.

## Completion contract

A change is complete only when the schema remains valid, the template behaves
across relevant task types, settings remain consistent, unit tests pass, and the
browser scenario provides evidence for the rendered result.
