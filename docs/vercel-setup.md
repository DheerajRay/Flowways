# Vercel Connection and Deployment Setup

## 1) Connect local repo to Vercel project

From repo root:

```bash
vercel login
vercel link
```

When prompted:
- Scope: choose your Vercel account/team
- Link to existing project: choose existing if already created, otherwise create new
- Project name: `flowways` (or your preferred production name)

This creates `.vercel/project.json` locally (already ignored by git).

## 2) Configure environment variables in Vercel

In Vercel Dashboard -> Project -> Settings -> Environment Variables, set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`
- `OPENAI_CLASSIFIER_MODEL` (default `gpt-4.1-mini`)
- Optional future: `SUPABASE_SERVICE_ROLE_KEY`, `REMINDER_PROVIDER_API_KEY`

Apply to:
- Development
- Preview
- Production

## 3) GitHub integration and branch behavior

- Connect GitHub repo: `DheerajRay/Flowways`
- Production branch: `main`
- Preview deployments: all PR branches

## 4) Deploy commands

Local preview deploy:

```bash
vercel
```

Local production deploy:

```bash
vercel --prod
```

Tag-based production release (recommended):

```bash
npm run release:patch
git add package.json
git commit -m "release: vX.Y.Z"
git tag vX.Y.Z
git push origin main --tags
```

This triggers `.github/workflows/vercel-release-tag.yml`.

## 5) Verify deployment health

After deploy:
- Open deployment URL
- Check auth gate loads
- Create item and verify classification preview
- Confirm item persistence and filters

## 6) Rollback

- Preferred: redeploy previous good tag/commit
- Alternative: promote prior successful deployment in Vercel dashboard
- Full rollback runbook: `docs/git-versioning-and-rollback.md`
