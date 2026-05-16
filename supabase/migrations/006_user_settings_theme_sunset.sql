update public.user_settings
set theme = 'classic'
where theme is null
   or theme not in ('classic', 'neo', 'midnight', 'bold', 'sunset');

alter table public.user_settings drop constraint if exists user_settings_theme_check;

alter table public.user_settings
  add constraint user_settings_theme_check
  check (theme in ('classic', 'neo', 'midnight', 'bold', 'sunset'));
