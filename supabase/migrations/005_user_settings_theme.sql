alter table public.user_settings
  add column if not exists theme text not null default 'classic';

update public.user_settings
set theme = 'classic'
where theme is null
   or theme not in ('classic', 'neo', 'midnight', 'bold');

alter table public.user_settings drop constraint if exists user_settings_theme_check;

alter table public.user_settings
  add constraint user_settings_theme_check
  check (theme in ('classic', 'neo', 'midnight', 'bold'));
