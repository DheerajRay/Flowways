create extension if not exists "pgcrypto";

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('checklist','journal','workflow','timeline')),
  title text not null,
  body text not null default '',
  labels text[] not null default '{}',
  workflow_status text check (workflow_status in ('Backlog','Ready','In Progress','Review','Done')),
  checked boolean not null default false,
  due_at timestamptz,
  position integer not null,
  source_text text not null,
  classification_confidence double precision not null default 0,
  classification_reason text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.item_metadata (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.item_events (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.classifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_text text not null,
  result jsonb not null,
  fallback_used boolean not null default false,
  status text not null default 'completed' check (status in ('completed','queued','failed')),
  created_at timestamptz not null default now()
);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  remind_at timestamptz not null,
  channel text not null default 'browser' check (channel in ('browser')),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.items enable row level security;
alter table public.item_metadata enable row level security;
alter table public.item_events enable row level security;
alter table public.classifications enable row level security;
alter table public.reminders enable row level security;

create policy "items_owner" on public.items
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "item_metadata_owner" on public.item_metadata
for all using (
  exists (select 1 from public.items i where i.id = item_metadata.item_id and i.user_id = auth.uid())
)
with check (
  exists (select 1 from public.items i where i.id = item_metadata.item_id and i.user_id = auth.uid())
);

create policy "item_events_owner" on public.item_events
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "classifications_owner" on public.classifications
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "reminders_owner" on public.reminders
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


