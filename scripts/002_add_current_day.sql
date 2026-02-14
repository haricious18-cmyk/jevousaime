alter table public.rooms
add column if not exists current_day integer not null default 1;

alter table public.rooms
alter column current_day set default 1;

alter table public.rooms
alter column current_stage set default 1;

update public.rooms
set current_day = 1
where current_day < 1;

update public.rooms
set current_stage = 1
where current_stage < 1;
