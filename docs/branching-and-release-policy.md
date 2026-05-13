# Branching and Release Policy

This policy is the source of truth for branch management, versioning, and rollback safety.

## Branch model

- `main`
: always deployable, protected, production source.
- `codex/<scope>-<short-name>`
: implementation branches for feature/fix work.
- `release/vX.Y.Z`
: optional stabilization branch before a production tag.
- `rollback/vX.Y.Z`
: temporary branch to recover from a previous known-good tag.

## Required flow

1. Create a working branch from `main`.
2. Implement and validate locally:
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
3. Update `CHANGELOG.md` with exact scope and impacted files.
4. Open PR to `main` and merge only when CI is green.
5. For production release, create a SemVer tag (`vX.Y.Z`).

## Versioning

- Use SemVer tags only: `vMAJOR.MINOR.PATCH`.
- Patch: bug fixes and safe behavior updates.
- Minor: backward-compatible feature additions.
- Major: breaking behavior/API/schema changes.

Release helpers:

- `npm run release:patch`
- `npm run release:minor`
- `npm run release:major`

These commands update `package.json` version. Then:

1. Commit version bump.
2. Create tag `vX.Y.Z`.
3. Push `main` and tags.

## Rollback

Preferred rollback path:

1. Identify last good tag.
2. Create `rollback/vX.Y.Z` from that tag.
3. Redeploy from that rollback branch or promote older successful Vercel deployment.

Never force-push release tags.

## GitHub settings to enforce

Set these in repository settings:

- Protect `main`.
- Require PR before merge.
- Require status checks to pass.
- Require linear history (recommended).
- Restrict direct pushes to `main`.

