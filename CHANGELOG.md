# Changelog

All notable changes to this project are documented in this file.

Format follows Keep a Changelog style with practical engineering detail for this repo.

## [Unreleased]

### Added
- Dynamic item action API route: `PATCH/DELETE /api/items/[id]`.
- Branching/release governance document:
- `docs/branching-and-release-policy.md`.
- Type-specific card behavior in UI:
- checklist cards render interactive checkbox rows.
- workflow cards include status movement controls (`Backlog`, `Ready`, `In Progress`, `Review`, `Done`).
- timeline cards include quick due-date controls.
- Checklist merge controls for ambiguous cases:
- per-checklist `Merge with existing list...` selector and `Merge` action in UI.
- Timeline cards now show live due-state feedback (`Due in ...` and `Timer done`) with a completion checkbox.

### Changed
- Classification system hardened:
- richer workflow-vs-checklist fallback heuristics.
- context-aware AI classification using recent memory hints from existing items.
- README governance and environment formatting cleanup.
- Classification refined further:
- idea-like inputs (for example `testing something`) bias to `journal` unless explicit checklist markers exist.
- label canonicalization for related tags (for example `drift` and `config drift` -> `config-drift` in matching context).
- Task card typography and layout tightened for more professional readability.
- Checklist ingestion behavior:
- if clear tag match exists on an open checklist, new checklist-like input auto-merges into existing list instead of creating a duplicate card.
- Checklist tags now inferred when missing (for example grocery/shopping/work/idea contexts).
- Timeline classification strengthened:
- relative reminders like `in 15 minutes` now parse to concrete `due_at`.
- reminder-like inputs (`remind`, `due tomorrow`, etc.) are post-corrected to `timeline` when a due time can be inferred.
- Timeline handling polished:
- time-only reminders like `Check on Rex at 4 PM` now resolve to `timeline` with day rollover when the same-day time has already passed.
- timeline cards are now prioritized in feed ordering when overdue, with visual alert styling until marked done.
- timeline cards show a live due-state countdown and clearer completion state text.
- Timeline parsing coverage extended:
- AI timeline outputs with missing `due_at` now get deterministic due-date backfill from input text.
- 24-hour time expressions (for example `16:30`) are now parsed for due time inference.
- Timeline card controls simplified by removing duplicate bottom action buttons and keeping top-level actions plus inline completion indicator.
- Timeline acknowledgement and due-time consistency improved:
- timeline cards now rely only on top action buttons (`Done`, `Edit`, `Delete`) and no longer show an extra checkbox acknowledgment control.
- timeline `due_at` now prefers deterministic parser output over AI-provided dates for reminder/time inputs, preventing stale/far-future mismatches.
- Mockup alignment pass (task cards):
- replaced symbol text buttons with stable inline SVG icon actions for card controls and workflow status controls.
- added card entrance/attention motion: subtle card-in animation and overdue timeline pulse (with reduced-motion fallback).
- standardized metadata chips (`date` and `#tags`) for cleaner scanability.
- added workflow `time spent` display in metadata based on item age.
- Timeline/local-time correction and compact card polish:
- item creation now sends `clientNow` from browser and timeline parsing uses that local clock context to avoid server-timezone drift.
- timeline title for time-based reminders preserves user time phrasing when AI strips it.
- timeline due-progress rail aligned to trailing segment (mockup style) instead of full-width row.
- reduced card vertical footprint (padding/gap/heading size) for denser feed readability.
- Countdown/sorting and reminder-title polish:
- timeline minute countdown now avoids upward rounding drift (`in 2 minutes` no longer appears as `3 min` at creation).
- timeline cards preserve relative reminder phrasing in title when AI emits generic labels.
- non-timeline items now sort by newest `created_at` when timeline priority tie is equal.
- Reminder/timer classification and due-rail clarity:
- added support for second-level relative timers (`in 30 seconds`) in deterministic due parsing.
- reminder-like phrases now force `timeline` kind in auto mode, preventing reminder entries from falling back to `workflow`.
- timeline due rail now has stronger visibility (thicker track, rounded fill, minimum visible fill width when active).
- Card layout simplification pass:
- timeline cards now remove duplicate body/explanatory lines and show a single compact bottom row with date, tags, due-time ticker, and inline progress rail.
- workflow cards now place date/tags and workflow status controls on the same bottom row.
- Timeline meta-row cleanup:
- removed redundant due-time chip from left-side timeline metadata.
- right-side timer block now renders as `Time (<remaining>)` followed by progress bar, with only date/tags left-aligned.
- Timeline chip/label polish:
- overdue state now appears as a left-side inverted tag chip (`OVER DUE`) instead of a separate right-side pill.
- right-side timer label is now forced to remain on one line beside the progress bar.
- Completion-state visual parity:
- done/acknowledged items now render with a green-highlighted card treatment (similar emphasis model as overdue red).
- Completed-card control simplification:
- done items now show only `Undo` and `Delete` actions; edit/done controls are hidden until item is undone.
- completed highlight is now border-only green (no internal/background tint changes).

### Fixed
- Broken CRUD item actions in production by restoring proper dynamic route mounting for `/api/items/[id]`.
- Removed auth subtitle text on sign-in page per UX request.
- Checklist auto-merge false positives reduced:
- auto-merge now ignores generic labels (`personal`, `work`, `idea`, etc.) and requires specific label overlap.
- prevents unrelated lists from merging just because of broad tags.
- Merge controls visibility tightened:
- checklist `Merge with existing list...` UI now appears only for ambiguous lists with actual candidate targets.

### Files
- `app/api/items/[id]/route.ts`
- `app/api/items/route.ts`
- `src/server/ai/classifier-service.ts`
- `src/shared/domain/classifier.ts`
- `app/page.tsx`
- `app/globals.css`
- `src/server/ai/classifier-service.ts`
- `src/shared/domain/classifier.ts`
- `README.md`
- `docs/branching-and-release-policy.md`
- `tests/unit/classifier.test.ts`
- `app/globals.css`

## [2026-05-13] - CRUD + UI iteration + auth polish

### Added
- Item-level CRUD actions in UI:
- `Done/Undo` action per item.
- `Edit` with inline title/body editing and `Save/Cancel`.
- `Delete` action per item.

### Changed
- Refined app layout and visual hierarchy:
- stronger typography and spacing.
- cleaner action grouping in item cards.
- improved top bar, capture panel, and card contrast.

### Fixed
- Auth card subtitle text removed from sign-in page (`Email + password only`) per UX feedback.

### Files
- `app/page.tsx`
- `app/globals.css`

## [2026-05-13] - Supabase migration application + diagnostics

### Added
- Detailed save error surfacing in UI so backend issues are visible directly to users.

### Fixed
- Diagnosed and resolved missing-table runtime issue:
- Root cause: `public.items` table missing in remote Supabase project.
- Applied migration `supabase/migrations/001_init.sql` to linked Supabase project.
- Normalized migration file encoding to UTF-8 without BOM to avoid SQL parse failure.

### Notes
- Error observed before fix:
- `Insert failed: Could not find the table 'public.items' in the schema cache`.

### Files
- `app/api/items/route.ts`
- `app/page.tsx`
- `supabase/migrations/001_init.sql`

## [2026-05-09] - v1 foundation bootstrap

### Added
- Next.js App Router + TypeScript foundation.
- Server routes:
- `POST /api/classify`
- `GET /api/items`
- `POST /api/items`
- Supabase schema and RLS migration baseline.
- OpenAI-backed classification service with deterministic fallback.
- CI workflows for verify, preview deploy, production deploy, and release-tag deploy.
- Release/versioning tooling and rollback docs.
- Environment templates (`.env.example`, `.env.local.example`).

### Changed
- Migrated from static prototype structure to modular app/server/shared structure.

### Security
- Removed exposed secret-like values from tracked env template.
- Added `.env.local` to `.gitignore` to prevent local secret leaks.

### Files (high impact)
- `app/**`
- `src/server/**`
- `src/shared/**`
- `supabase/migrations/001_init.sql`
- `.github/workflows/**`
- `README.md`
- `docs/git-versioning-and-rollback.md`
- `docs/vercel-setup.md`

---

## Changelog maintenance rules

For each meaningful push, add or update an entry with:

1. Date (`YYYY-MM-DD`)
2. Scope summary (what changed and why)
3. Sections used as needed:
- Added
- Changed
- Fixed
- Removed
- Security
4. File list for high-impact touched areas
5. Any known follow-up items
