-- Enable RLS on all tables
alter table public.sessions enable row level security;
alter table public.messages enable row level security;
alter table public.stars enable row level security;
alter table public.room_progress enable row level security;

-- Rooms table RLS policies
-- legacy `rooms` table policies removed

-- Room metadata RLS policies
-- legacy `room_metadata` table policies removed

-- Room users RLS policies
-- legacy `room_users` table policies removed

-- Sessions table RLS policies (backward compatibility)
drop policy if exists "sessions_select" on public.sessions;
create policy "sessions_select" on public.sessions for select using (true);

drop policy if exists "sessions_insert" on public.sessions;
create policy "sessions_insert" on public.sessions for insert with check (true);

drop policy if exists "sessions_update" on public.sessions;
create policy "sessions_update" on public.sessions for update using (true) with check (true);

-- Messages table RLS policies
drop policy if exists "messages_select" on public.messages;
create policy "messages_select" on public.messages for select using (true);

drop policy if exists "messages_insert" on public.messages;
create policy "messages_insert" on public.messages for insert with check (true);

-- Stars table RLS policies
drop policy if exists "stars_select" on public.stars;
create policy "stars_select" on public.stars for select using (true);

drop policy if exists "stars_insert" on public.stars;
create policy "stars_insert" on public.stars for insert with check (true);

drop policy if exists "stars_update" on public.stars;
create policy "stars_update" on public.stars for update using (true) with check (true);

-- Capsules table RLS policies
-- legacy `capsules` table policies removed

-- Room progress RLS policies
drop policy if exists "room_progress_select" on public.room_progress;
create policy "room_progress_select" on public.room_progress for select using (true);

drop policy if exists "room_progress_insert" on public.room_progress;
create policy "room_progress_insert" on public.room_progress for insert with check (true);

drop policy if exists "room_progress_update" on public.room_progress;
create policy "room_progress_update" on public.room_progress for update using (true) with check (true);

-- Enable Realtime for real-time synchronization
alter publication supabase_realtime add table public.sessions;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.stars;
alter publication supabase_realtime add table public.room_progress;
