alter table public.rooms
add column if not exists current_day integer not null default 0;
