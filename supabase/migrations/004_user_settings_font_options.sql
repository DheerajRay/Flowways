alter table public.user_settings drop constraint if exists user_settings_font_family_check;

alter table public.user_settings
  add constraint user_settings_font_family_check
  check (font_family in ('avenir','inter','plex','mono','rounded'));

update public.user_settings
set font_family = 'inter'
where font_family = 'combo';

