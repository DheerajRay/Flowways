alter table public.items drop constraint if exists items_workflow_status_check;

alter table public.items
  add constraint items_workflow_status_check
  check (workflow_status in ('Backlog','Paused','In Progress','Ready','Review','Done'));
