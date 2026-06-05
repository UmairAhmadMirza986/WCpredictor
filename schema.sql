-- =============================================
-- WC 2026 Predictor - Run this in Supabase SQL Editor
-- =============================================

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  pin_hash text not null,
  is_admin boolean default false,
  created_at timestamptz default now()
);

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  match_date date not null,
  match_time text not null,
  group_name text,
  team1 text not null,
  team2 text not null,
  score1 int,
  score2 int,
  kickoff_at timestamptz not null,
  stage text default 'group'
);

create table if not exists predictions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  match_id uuid not null references matches(id) on delete cascade,
  pred1 int not null check (pred1 >= 0),
  pred2 int not null check (pred2 >= 0),
  points int,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(player_id, match_id)
);

-- Disable RLS (trusted friend group)
alter table players disable row level security;
alter table matches disable row level security;
alter table predictions disable row level security;

-- =============================================
-- Default admin account - PIN is 1234
-- SHA-256 hash of "1234"
-- =============================================
insert into players (name, pin_hash, is_admin) values
('Admin', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', true)
on conflict (name) do nothing;

-- =============================================
-- WC 2026 Group Stage Matches
-- Times are in UTC. Matchday 1 starts June 11.
-- =============================================
insert into matches (match_date, match_time, group_name, team1, team2, kickoff_at, stage) values

-- Matchday 1
('2026-06-11', '23:00', 'A', 'Mexico', 'South Africa',      '2026-06-11 23:00:00+00', 'group'),
('2026-06-12', '02:00', 'B', 'Canada', 'Bosnia',            '2026-06-12 02:00:00+00', 'group'),
('2026-06-12', '19:00', 'C', 'Brazil', 'Morocco',           '2026-06-12 19:00:00+00', 'group'),
('2026-06-12', '22:00', 'D', 'United States', 'Paraguay',   '2026-06-12 22:00:00+00', 'group'),
('2026-06-13', '02:00', 'A', 'South Korea', 'Czechia',      '2026-06-13 02:00:00+00', 'group'),
('2026-06-13', '19:00', 'B', 'Qatar', 'Switzerland',        '2026-06-13 19:00:00+00', 'group'),
('2026-06-13', '22:00', 'C', 'Haiti', 'Scotland',           '2026-06-13 22:00:00+00', 'group'),
('2026-06-14', '01:00', 'D', 'Australia', 'Turkiye',        '2026-06-14 01:00:00+00', 'group'),
('2026-06-14', '18:00', 'E', 'Germany', 'Curacao',          '2026-06-14 18:00:00+00', 'group'),
('2026-06-14', '21:00', 'F', 'Netherlands', 'Japan',        '2026-06-14 21:00:00+00', 'group'),
('2026-06-15', '00:00', 'E', 'Ivory Coast', 'Ecuador',      '2026-06-15 00:00:00+00', 'group'),
('2026-06-15', '03:00', 'F', 'Sweden', 'Tunisia',           '2026-06-15 03:00:00+00', 'group'),
('2026-06-15', '17:00', 'G', 'Belgium', 'Egypt',            '2026-06-15 17:00:00+00', 'group'),
('2026-06-15', '20:00', 'H', 'Spain', 'Cape Verde',         '2026-06-15 20:00:00+00', 'group'),
('2026-06-16', '01:00', 'G', 'Iran', 'New Zealand',         '2026-06-16 01:00:00+00', 'group'),
('2026-06-16', '19:00', 'H', 'Saudi Arabia', 'Uruguay',     '2026-06-16 19:00:00+00', 'group'),
('2026-06-16', '22:00', 'I', 'France', 'Senegal',           '2026-06-16 22:00:00+00', 'group'),
('2026-06-17', '01:00', 'I', 'Iraq', 'Norway',              '2026-06-17 01:00:00+00', 'group'),
('2026-06-17', '18:00', 'J', 'Argentina', 'Algeria',        '2026-06-17 18:00:00+00', 'group'),
('2026-06-17', '21:00', 'J', 'Austria', 'Jordan',           '2026-06-17 21:00:00+00', 'group'),
('2026-06-18', '00:00', 'K', 'Portugal', 'Congo DR',        '2026-06-18 00:00:00+00', 'group'),
('2026-06-18', '03:00', 'L', 'England', 'Croatia',          '2026-06-18 03:00:00+00', 'group'),
('2026-06-18', '19:00', 'K', 'Nigeria', 'Colombia',         '2026-06-18 19:00:00+00', 'group'),
('2026-06-18', '22:00', 'L', 'Ghana', 'Panama',             '2026-06-18 22:00:00+00', 'group'),

-- Matchday 2
('2026-06-19', '19:00', 'A', 'South Africa', 'South Korea', '2026-06-19 19:00:00+00', 'group'),
('2026-06-19', '22:00', 'A', 'Mexico', 'Czechia',           '2026-06-19 22:00:00+00', 'group'),
('2026-06-20', '01:00', 'B', 'Bosnia', 'Switzerland',       '2026-06-20 01:00:00+00', 'group'),
('2026-06-20', '19:00', 'B', 'Canada', 'Qatar',             '2026-06-20 19:00:00+00', 'group'),
('2026-06-20', '22:00', 'C', 'Morocco', 'Haiti',            '2026-06-20 22:00:00+00', 'group'),
('2026-06-21', '01:00', 'C', 'Brazil', 'Scotland',          '2026-06-21 01:00:00+00', 'group'),
('2026-06-21', '19:00', 'D', 'Paraguay', 'Australia',       '2026-06-21 19:00:00+00', 'group'),
('2026-06-21', '22:00', 'D', 'United States', 'Turkiye',    '2026-06-21 22:00:00+00', 'group'),
('2026-06-22', '01:00', 'E', 'Curacao', 'Ivory Coast',      '2026-06-22 01:00:00+00', 'group'),
('2026-06-22', '19:00', 'E', 'Germany', 'Ecuador',          '2026-06-22 19:00:00+00', 'group'),
('2026-06-22', '22:00', 'F', 'Japan', 'Sweden',             '2026-06-22 22:00:00+00', 'group'),
('2026-06-23', '01:00', 'F', 'Netherlands', 'Tunisia',      '2026-06-23 01:00:00+00', 'group'),
('2026-06-23', '19:00', 'G', 'Egypt', 'Iran',               '2026-06-23 19:00:00+00', 'group'),
('2026-06-23', '22:00', 'G', 'Belgium', 'New Zealand',      '2026-06-23 22:00:00+00', 'group'),
('2026-06-24', '01:00', 'H', 'Cape Verde', 'Saudi Arabia',  '2026-06-24 01:00:00+00', 'group'),
('2026-06-24', '19:00', 'H', 'Spain', 'Uruguay',            '2026-06-24 19:00:00+00', 'group'),
('2026-06-24', '22:00', 'I', 'Senegal', 'Iraq',             '2026-06-24 22:00:00+00', 'group'),
('2026-06-25', '01:00', 'I', 'France', 'Norway',            '2026-06-25 01:00:00+00', 'group'),
('2026-06-25', '19:00', 'J', 'Algeria', 'Austria',          '2026-06-25 19:00:00+00', 'group'),
('2026-06-25', '22:00', 'J', 'Argentina', 'Jordan',         '2026-06-25 22:00:00+00', 'group'),
('2026-06-26', '01:00', 'K', 'Congo DR', 'Nigeria',         '2026-06-26 01:00:00+00', 'group'),
('2026-06-26', '19:00', 'K', 'Portugal', 'Colombia',        '2026-06-26 19:00:00+00', 'group'),
('2026-06-26', '22:00', 'L', 'Croatia', 'Ghana',            '2026-06-26 22:00:00+00', 'group'),
('2026-06-27', '01:00', 'L', 'England', 'Panama',           '2026-06-27 01:00:00+00', 'group'),

-- Matchday 3 (final group stage - played simultaneously)
('2026-06-28', '19:00', 'A', 'Czechia', 'South Africa',     '2026-06-28 19:00:00+00', 'group'),
('2026-06-28', '19:00', 'A', 'Mexico', 'South Korea',       '2026-06-28 19:00:00+00', 'group'),
('2026-06-28', '22:00', 'B', 'Switzerland', 'Canada',       '2026-06-28 22:00:00+00', 'group'),
('2026-06-28', '22:00', 'B', 'Bosnia', 'Qatar',             '2026-06-28 22:00:00+00', 'group'),
('2026-06-29', '01:00', 'C', 'Scotland', 'Morocco',         '2026-06-29 01:00:00+00', 'group'),
('2026-06-29', '01:00', 'C', 'Haiti', 'Brazil',             '2026-06-29 01:00:00+00', 'group'),
('2026-06-29', '19:00', 'D', 'Turkiye', 'Paraguay',         '2026-06-29 19:00:00+00', 'group'),
('2026-06-29', '19:00', 'D', 'Australia', 'United States',  '2026-06-29 19:00:00+00', 'group'),
('2026-06-29', '22:00', 'E', 'Ecuador', 'Germany',          '2026-06-29 22:00:00+00', 'group'),
('2026-06-29', '22:00', 'E', 'Curacao', 'Ivory Coast',      '2026-06-29 22:00:00+00', 'group'),
('2026-06-30', '01:00', 'F', 'Tunisia', 'Netherlands',      '2026-06-30 01:00:00+00', 'group'),
('2026-06-30', '01:00', 'F', 'Sweden', 'Japan',             '2026-06-30 01:00:00+00', 'group'),
('2026-06-30', '19:00', 'G', 'New Zealand', 'Egypt',        '2026-06-30 19:00:00+00', 'group'),
('2026-06-30', '19:00', 'G', 'Iran', 'Belgium',             '2026-06-30 19:00:00+00', 'group'),
('2026-06-30', '22:00', 'H', 'Uruguay', 'Cape Verde',       '2026-06-30 22:00:00+00', 'group'),
('2026-06-30', '22:00', 'H', 'Saudi Arabia', 'Spain',       '2026-06-30 22:00:00+00', 'group'),
('2026-07-01', '01:00', 'I', 'Norway', 'Senegal',           '2026-07-01 01:00:00+00', 'group'),
('2026-07-01', '01:00', 'I', 'Iraq', 'France',              '2026-07-01 01:00:00+00', 'group'),
('2026-07-01', '19:00', 'J', 'Jordan', 'Argentina',         '2026-07-01 19:00:00+00', 'group'),
('2026-07-01', '19:00', 'J', 'Algeria', 'Austria',          '2026-07-01 19:00:00+00', 'group'),
('2026-07-01', '22:00', 'K', 'Colombia', 'Congo DR',        '2026-07-01 22:00:00+00', 'group'),
('2026-07-01', '22:00', 'K', 'Nigeria', 'Portugal',         '2026-07-01 22:00:00+00', 'group'),
('2026-07-02', '01:00', 'L', 'Panama', 'Croatia',           '2026-07-02 01:00:00+00', 'group'),
('2026-07-02', '01:00', 'L', 'Ghana', 'England',            '2026-07-02 01:00:00+00', 'group');
