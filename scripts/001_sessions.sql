-- Enable RLS on all tables
alter table public.rooms enable row level security;
alter table public.room_metadata enable row level security;
alter table public.room_users enable row level security;
alter table public.sessions enable row level security;
alter table public.messages enable row level security;
alter table public.stars enable row level security;
alter table public.capsules enable row level security;
alter table public.room_progress enable row level security;

-- Rooms table RLS policies
drop policy if exists "rooms_select" on public.rooms;
create policy "rooms_select" on public.rooms for select using (true);

drop policy if exists "rooms_insert" on public.rooms;
create policy "rooms_insert" on public.rooms for insert with check (true);

drop policy if exists "rooms_update" on public.rooms;
create policy "rooms_update" on public.rooms for update using (true) with check (true);

-- Room metadata RLS policies
drop policy if exists "room_metadata_select" on public.room_metadata;
create policy "room_metadata_select" on public.room_metadata for select using (true);

drop policy if exists "room_metadata_insert" on public.room_metadata;
create policy "room_metadata_insert" on public.room_metadata for insert with check (true);

drop policy if exists "room_metadata_update" on public.room_metadata;
create policy "room_metadata_update" on public.room_metadata for update using (true) with check (true);

-- Room users RLS policies
drop policy if exists "room_users_select" on public.room_users;
create policy "room_users_select" on public.room_users for select using (true);

drop policy if exists "room_users_insert" on public.room_users;
create policy "room_users_insert" on public.room_users for insert with check (true);

drop policy if exists "room_users_update" on public.room_users;
create policy "room_users_update" on public.room_users for update using (true) with check (true);

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
drop policy if exists "capsules_select" on public.capsules;
create policy "capsules_select" on public.capsules for select using (true);

drop policy if exists "capsules_insert" on public.capsules;
create policy "capsules_insert" on public.capsules for insert with check (true);

drop policy if exists "capsules_update" on public.capsules;
create policy "capsules_update" on public.capsules for update using (true) with check (true);

-- Room progress RLS policies
drop policy if exists "room_progress_select" on public.room_progress;
create policy "room_progress_select" on public.room_progress for select using (true);

drop policy if exists "room_progress_insert" on public.room_progress;
create policy "room_progress_insert" on public.room_progress for insert with check (true);

drop policy if exists "room_progress_update" on public.room_progress;
create policy "room_progress_update" on public.room_progress for update using (true) with check (true);

-- Enable Realtime for real-time synchronization
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.room_metadata;
alter publication supabase_realtime add table public.room_users;
alter publication supabase_realtime add table public.sessions;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.stars;
alter publication supabase_realtime add table public.capsules;
alter publication supabase_realtime add table public.room_progress;
