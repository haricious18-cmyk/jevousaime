-- Note: removed legacy `rooms`, `room_metadata`, and `room_users` tables.
-- This project now uses `sessions` + per-room `room_progress`, `messages`, and `stars` tables.

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
-- Note: `capsules` (time capsules) removed as unused by current rooms.
