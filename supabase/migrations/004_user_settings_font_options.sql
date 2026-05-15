alter table public.user_settings drop constraint if exists user_settings_font_family_check;

update public.user_settings
set font_family = 'inter'
where font_family = 'combo';

update public.user_settings
set font_family = 'avenir'
where font_family is null
   or font_family not in ('avenir','inter','plex','mono','rounded');

alter table public.user_settings
  add constraint user_settings_font_family_check
  check (font_family in ('avenir','inter','plex','mono','rounded'));
