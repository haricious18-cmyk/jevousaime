-- Rooms table: stores room session data (primary table)
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  room_code text unique not null,
  current_day integer not null default 0,
  current_stage integer not null default 0,
  love_meter integer not null default 0,
  is_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Room metadata: stores state (matched pairs, compass selections, etc.)
create table if not exists public.room_metadata (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  door_state jsonb default '{"partner_a_input":"","partner_b_input":"","both_ready":false}',
  library_matches jsonb default '{}',
  compass_selections jsonb default '{"partner_a":null,"partner_b":null,"both_locked":false}',
  heartbeat_state jsonb default '{"partner_a_pressing":false,"partner_b_pressing":false,"fill_percentage":0}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(room_id)
);

-- Users in room (presence tracking)
create table if not exists public.room_users (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id text unique not null,
  role text not null check (role in ('partner_a', 'partner_b')),
  name text,
  is_online boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Legacy sessions table (for backward compatibility)
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  room_code text unique not null,
  player1_name text,
  player2_name text,
  current_phase text not null default 'lobby',
  love_meter integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Room progress: tracks completion of each room per session
create table if not exists public.room_progress (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  room_name text not null,
  completed boolean not null default false,
  data jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(session_id, room_name)
);

-- Messages: stores the "Library of Echoes" messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  sender text not null,
  content text not null,
  prompt text,
  created_at timestamptz not null default now()
);

-- Stars: stores constellation canvas star placements
create table if not exists public.stars (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  placed_by text not null,
  x float not null,
  y float not null,
  label text,
  created_at timestamptz not null default now()
);

-- Time capsules: stores future messages
create table if not exists public.capsules (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  author text not null,
  message text not null,
  unlock_date date not null,
  sealed boolean not null default false,
  created_at timestamptz not null default now()
);
