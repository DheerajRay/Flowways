# FlowWays

FlowWays is a local-first minimalist task management PWA based on the project PRD. The initial version is dependency-light and deploys as a static site.

## Features

- Guest-first local data stored in IndexedDB
- Dashboard with today, upcoming, overdue, and recent capture
- Checklist, Journal, Workflow Board, and Timeline modes
- Global quick capture with simple classification hints
- Search, filters, export/import, and reminder center
- PWA manifest and offline app shell service worker

## Local Development

```bash
npm run dev
```

Open `http://localhost:4173`.

## Validation

```bash
npm test
npm run build
```

## Vercel

This project is configured as a static Vercel deployment. Link and deploy with:

```bash
vercel link
vercel
```

Use `vercel --prod` for production once the preview is verified.
