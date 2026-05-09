# Git Connection, Versioning, and Rollback

## Git connection (GitHub)

Repository remote is configured as:

```bash
git remote -v
# origin https://github.com/DheerajRay/Flowways.git
```

If you need to reset it:

```bash
git remote set-url origin https://github.com/DheerajRay/Flowways.git
```

Recommended local auth options:

1. GitHub CLI login: `gh auth login`
2. Or Git credential manager with PAT
3. Or SSH remote (`git@github.com:DheerajRay/Flowways.git`)

## Versioning model

- Use Semantic Versioning tags: `vMAJOR.MINOR.PATCH`.
- Every production release is tied to a tag.
- `main` can move fast; tags are immutable rollback anchors.

Release helpers:

```bash
npm run release:patch
npm run release:minor
npm run release:major
```

These update `package.json` version and print next git steps.

## Release flow

```bash
npm run release:patch
git add package.json
git commit -m "release: vX.Y.Z"
git tag vX.Y.Z
git push origin main --tags
```

Pushing a `v*` tag triggers:

- `.github/workflows/vercel-release-tag.yml`

## Rollback options

### Option A: redeploy previous tag (preferred)

1. Identify last good tag:
```bash
git tag --list
```
2. Check out that tag to detached HEAD and create rollback branch:
```bash
git checkout vX.Y.Z
git checkout -b rollback/vX.Y.Z
```
3. Push branch and redeploy production from that commit.

### Option B: Vercel dashboard rollback

Use Vercel project deployments page and promote a previous successful production deployment.

## Guardrails

- Never force-push release tags.
- Keep release tags signed if possible.
- Require CI green before tagging.
