create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  pet_enabled boolean not null default true,
  pet_mode text not null default 'sweet' check (pet_mode in ('sweet','meh','monster')),
  font_family text not null default 'avenir' check (font_family in ('avenir','combo','mono','rounded')),
  font_size text not null default 'm' check (font_size in ('s','m','l')),
  color_palette jsonb not null default '{"red":"#d24f4f","blue":"#2b7fca","green":"#2f9e66","amber":"#de8a2d","violet":"#7666c8"}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

create policy "user_settings_owner" on public.user_settings
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

