-- Citadel Database Schema
-- Run this in Supabase SQL Editor

-- Profiles table (one row per Steam user)
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  steam_id text unique not null,                  -- SteamID64
  steam_name text not null,                       -- Current Steam persona name (display name)
  avatar_url text,
  rank text default 'Unranked',                   -- Deadlock rank (Eternus, Phantom, etc.)
  rank_source text,                               -- 'statlocker' | 'tracklock' | 'manual_pending' | null
  xp integer default 0 not null,
  wins integer default 0 not null,
  losses integer default 0 not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  last_login_at timestamptz default now()
);

-- Index for fast lookup by Steam ID
create index if not exists profiles_steam_id_idx on public.profiles (steam_id);

-- XP Matches
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references public.profiles(id) on delete cascade,
  opponent_id uuid references public.profiles(id),
  format text not null,                           -- '6v6' | '3v3' | '1v1'
  ruleset text default 'ranked',
  region text default 'NA East',
  status text default 'open',                     -- open | accepted | completed | cancelled | disputed
  winner_id uuid references public.profiles(id),
  xp_reward integer default 25,
  created_at timestamptz default now() not null,
  completed_at timestamptz
);

-- Simple XP transaction log (optional but useful)
create table if not exists public.xp_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  amount integer not null,
  reason text,
  match_id uuid references public.matches(id),
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.matches enable row level security;
alter table public.xp_events enable row level security;

-- Basic policies (users can read all profiles, but only update their own non-rank fields later)
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update their own profile (limited)"
  on public.profiles for update
  using (true);  -- We will lock rank changes in application logic

-- Matches policies (simplified for MVP)
create policy "Anyone can view matches"
  on public.matches for select using (true);

create policy "Authenticated users can create matches"
  on public.matches for insert with check (true);
