# FlowWays v1 Foundation

FlowWays is an AI-assisted task memory application built on Next.js App Router, Supabase, and OpenAI.

## Stack

- Next.js 15 + React 19 + TypeScript
- Supabase Auth + Postgres + RLS
- OpenAI server-side classification route
- Vercel preview and production deployment workflows

## Architecture

- `app/`: routes, API handlers, and UI entrypoints
- `src/features/`: feature-level modules (task, workflow, timeline, reminders)
- `src/server/`: auth guard, classification service, DB composition
- `src/shared/`: domain fallback classifier, schemas, shared types
- `supabase/migrations/`: SQL schema and RLS policies
- `tests/`: unit and integration tests

## API Contracts

- `POST /api/classify`: classify free-form capture into structured task format
- `GET /api/items`: list user items
- `POST /api/items`: create item using AI classification + fallback
- `PATCH /api/items/:id`: update user-owned item

## Environment

Copy `.env.local.example` to `.env.local` and set:`n`n- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`
- optional `OPENAI_CLASSIFIER_MODEL`

## Local Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Supabase Setup

Run migration in Supabase SQL editor:

- `supabase/migrations/001_init.sql`

Enable auth providers in Supabase and verify RLS remains enabled.

## Vercel Deploy

1. `vercel link`
2. Add env vars in Vercel project settings
3. `vercel` for preview
4. `vercel --prod` for production

## Codex Chrome Plugin Integration Testing

Use the Chrome plugin to run repeatable smoke flows each PR:

1. Sign in flow reaches app shell
2. Capture text gets classification preview
3. Create item and verify it appears
4. Toggle done filter states
5. Open reminder permission action

Automate these as scripted checks in local runs and CI-adjacent validation.



## Git and Versioning

See docs/git-versioning-and-rollback.md for git connection setup, SemVer release tags, and rollback workflow.


Environment template with inline retrieval instructions: .env.local.example.


Vercel setup guide: docs/vercel-setup.md.


## Supabase Auth Setup (Email + Password Only)

In Supabase Dashboard:

1. Go to `Authentication -> Providers -> Email`.
2. Keep `Enable Email provider` ON.
3. Turn OFF magic link / email OTP sign-in options.
4. Keep password sign-in enabled.
5. Configure `URL Configuration` with your Vercel site URL and local callback URL.

Result: users can create account and sign in with email/password, and browser session is remembered for re-login.
