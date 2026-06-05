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
-- =============================================
insert into players (name, pin_hash, is_admin) values
('Admin', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', true)
on conflict (name) do nothing;

-- =============================================
-- WC 2026 Group Stage — Official FIFA Schedule
-- kickoff_at stored in UTC. All times converted from PKT (UTC+5).
-- =============================================

truncate matches cascade;

insert into matches (match_date, match_time, group_name, team1, team2, kickoff_at, stage) values

-- =============================================
-- MATCHDAY 1
-- =============================================

-- Fri 12 Jun PKT
('2026-06-11', '19:00', 'A', 'Mexico',              'South Africa',           '2026-06-11 19:00:00+00', 'group'),  --  1
('2026-06-12', '02:00', 'A', 'Korea Republic',       'Czechia',                '2026-06-12 02:00:00+00', 'group'),  --  2

-- Sat 13 Jun PKT
('2026-06-12', '19:00', 'B', 'Canada',               'Bosnia and Herzegovina', '2026-06-12 19:00:00+00', 'group'),  --  3
('2026-06-13', '01:00', 'D', 'United States',         'Paraguay',               '2026-06-13 01:00:00+00', 'group'),  --  4

-- Sun 14 Jun PKT
('2026-06-13', '19:00', 'B', 'Qatar',                'Switzerland',            '2026-06-13 19:00:00+00', 'group'),  --  5
('2026-06-13', '22:00', 'C', 'Brazil',               'Morocco',                '2026-06-13 22:00:00+00', 'group'),  --  6
('2026-06-14', '01:00', 'C', 'Haiti',                'Scotland',               '2026-06-14 01:00:00+00', 'group'),  --  7
('2026-06-14', '04:00', 'D', 'Australia',            'Türkiye',                '2026-06-14 04:00:00+00', 'group'),  --  8
('2026-06-14', '17:00', 'E', 'Germany',              'Curaçao',                '2026-06-14 17:00:00+00', 'group'),  --  9

-- Mon 15 Jun PKT
('2026-06-14', '20:00', 'F', 'Netherlands',          'Japan',                  '2026-06-14 20:00:00+00', 'group'),  -- 10
('2026-06-14', '23:00', 'E', 'Côte d''Ivoire',       'Ecuador',                '2026-06-14 23:00:00+00', 'group'),  -- 11
('2026-06-15', '02:00', 'F', 'Sweden',               'Tunisia',                '2026-06-15 02:00:00+00', 'group'),  -- 12
('2026-06-15', '16:00', 'H', 'Spain',                'Cabo Verde',             '2026-06-15 16:00:00+00', 'group'),  -- 13

-- Tue 16 Jun PKT
('2026-06-15', '19:00', 'G', 'Belgium',              'Egypt',                  '2026-06-15 19:00:00+00', 'group'),  -- 14
('2026-06-15', '22:00', 'H', 'Saudi Arabia',         'Uruguay',                '2026-06-15 22:00:00+00', 'group'),  -- 15
('2026-06-16', '01:00', 'G', 'IR Iran',              'New Zealand',            '2026-06-16 01:00:00+00', 'group'),  -- 16

-- Wed 17 Jun PKT
('2026-06-16', '19:00', 'I', 'France',               'Senegal',                '2026-06-16 19:00:00+00', 'group'),  -- 17
('2026-06-16', '22:00', 'I', 'Iraq',                 'Norway',                 '2026-06-16 22:00:00+00', 'group'),  -- 18
('2026-06-17', '01:00', 'J', 'Argentina',            'Algeria',                '2026-06-17 01:00:00+00', 'group'),  -- 19
('2026-06-17', '04:00', 'J', 'Austria',              'Jordan',                 '2026-06-17 04:00:00+00', 'group'),  -- 20
('2026-06-17', '17:00', 'K', 'Portugal',             'Congo DR',               '2026-06-17 17:00:00+00', 'group'),  -- 21

-- Thu 18 Jun PKT
('2026-06-17', '20:00', 'L', 'England',              'Croatia',                '2026-06-17 20:00:00+00', 'group'),  -- 22
('2026-06-17', '23:00', 'L', 'Ghana',                'Panama',                 '2026-06-17 23:00:00+00', 'group'),  -- 23
('2026-06-18', '02:00', 'K', 'Uzbekistan',           'Colombia',               '2026-06-18 02:00:00+00', 'group'),  -- 24
('2026-06-18', '16:00', 'A', 'Czechia',              'South Africa',           '2026-06-18 16:00:00+00', 'group'),  -- 25

-- =============================================
-- MATCHDAY 2
-- =============================================

-- Fri 19 Jun PKT
('2026-06-18', '19:00', 'B', 'Switzerland',          'Bosnia and Herzegovina', '2026-06-18 19:00:00+00', 'group'),  -- 26
('2026-06-18', '22:00', 'B', 'Canada',               'Qatar',                  '2026-06-18 22:00:00+00', 'group'),  -- 27
('2026-06-19', '01:00', 'A', 'Mexico',               'Korea Republic',          '2026-06-19 01:00:00+00', 'group'),  -- 28

-- Sat 20 Jun PKT
('2026-06-19', '19:00', 'D', 'United States',         'Australia',              '2026-06-19 19:00:00+00', 'group'),  -- 29
('2026-06-19', '22:00', 'C', 'Scotland',             'Morocco',                '2026-06-19 22:00:00+00', 'group'),  -- 30
('2026-06-20', '00:30', 'C', 'Brazil',               'Haiti',                  '2026-06-20 00:30:00+00', 'group'),  -- 31
('2026-06-20', '03:00', 'D', 'Türkiye',              'Paraguay',               '2026-06-20 03:00:00+00', 'group'),  -- 32
('2026-06-20', '17:00', 'F', 'Netherlands',          'Sweden',                 '2026-06-20 17:00:00+00', 'group'),  -- 33

-- Sun 21 Jun PKT
('2026-06-20', '20:00', 'E', 'Germany',              'Côte d''Ivoire',          '2026-06-20 20:00:00+00', 'group'),  -- 34
('2026-06-21', '00:00', 'E', 'Ecuador',              'Curaçao',                '2026-06-21 00:00:00+00', 'group'),  -- 35
('2026-06-21', '04:00', 'F', 'Tunisia',              'Japan',                  '2026-06-21 04:00:00+00', 'group'),  -- 36
('2026-06-21', '16:00', 'H', 'Spain',                'Saudi Arabia',           '2026-06-21 16:00:00+00', 'group'),  -- 37

-- Mon 22 Jun PKT
('2026-06-21', '19:00', 'G', 'Belgium',              'IR Iran',                '2026-06-21 19:00:00+00', 'group'),  -- 38
('2026-06-21', '22:00', 'H', 'Uruguay',              'Cabo Verde',             '2026-06-21 22:00:00+00', 'group'),  -- 39
('2026-06-22', '01:00', 'G', 'New Zealand',          'Egypt',                  '2026-06-22 01:00:00+00', 'group'),  -- 40
('2026-06-22', '17:00', 'J', 'Argentina',            'Austria',                '2026-06-22 17:00:00+00', 'group'),  -- 41

-- Tue 23 Jun PKT
('2026-06-22', '21:00', 'I', 'France',               'Iraq',                   '2026-06-22 21:00:00+00', 'group'),  -- 42
('2026-06-23', '00:00', 'I', 'Norway',               'Senegal',                '2026-06-23 00:00:00+00', 'group'),  -- 43
('2026-06-23', '03:00', 'J', 'Jordan',               'Algeria',                '2026-06-23 03:00:00+00', 'group'),  -- 44
('2026-06-23', '17:00', 'K', 'Portugal',             'Uzbekistan',             '2026-06-23 17:00:00+00', 'group'),  -- 45

-- Wed 24 Jun PKT
('2026-06-23', '20:00', 'L', 'England',              'Ghana',                  '2026-06-23 20:00:00+00', 'group'),  -- 46
('2026-06-23', '23:00', 'L', 'Panama',               'Croatia',                '2026-06-23 23:00:00+00', 'group'),  -- 47
('2026-06-24', '02:00', 'K', 'Colombia',             'Congo DR',               '2026-06-24 02:00:00+00', 'group'),  -- 48

-- =============================================
-- MATCHDAY 3 (simultaneous pairs within each group)
-- =============================================

-- Thu 25 Jun PKT
('2026-06-24', '19:00', 'B', 'Switzerland',          'Canada',                 '2026-06-24 19:00:00+00', 'group'),  -- 49
('2026-06-24', '19:00', 'B', 'Bosnia and Herzegovina','Qatar',                 '2026-06-24 19:00:00+00', 'group'),  -- 50
('2026-06-24', '22:00', 'C', 'Scotland',             'Brazil',                 '2026-06-24 22:00:00+00', 'group'),  -- 51
('2026-06-24', '22:00', 'C', 'Morocco',              'Haiti',                  '2026-06-24 22:00:00+00', 'group'),  -- 52
('2026-06-25', '01:00', 'A', 'Czechia',              'Mexico',                 '2026-06-25 01:00:00+00', 'group'),  -- 53
('2026-06-25', '01:00', 'A', 'South Africa',         'Korea Republic',          '2026-06-25 01:00:00+00', 'group'),  -- 54

-- Fri 26 Jun PKT
('2026-06-25', '20:00', 'E', 'Ecuador',              'Germany',                '2026-06-25 20:00:00+00', 'group'),  -- 55
('2026-06-25', '20:00', 'E', 'Curaçao',              'Côte d''Ivoire',          '2026-06-25 20:00:00+00', 'group'),  -- 56
('2026-06-25', '23:00', 'F', 'Japan',                'Sweden',                 '2026-06-25 23:00:00+00', 'group'),  -- 57
('2026-06-25', '23:00', 'F', 'Tunisia',              'Netherlands',            '2026-06-25 23:00:00+00', 'group'),  -- 58
('2026-06-26', '02:00', 'D', 'Türkiye',              'United States',           '2026-06-26 02:00:00+00', 'group'),  -- 59
('2026-06-26', '02:00', 'D', 'Paraguay',             'Australia',              '2026-06-26 02:00:00+00', 'group'),  -- 60

-- Sat 27 Jun PKT
('2026-06-26', '19:00', 'I', 'Norway',               'France',                 '2026-06-26 19:00:00+00', 'group'),  -- 61
('2026-06-26', '19:00', 'I', 'Senegal',              'Iraq',                   '2026-06-26 19:00:00+00', 'group'),  -- 62
('2026-06-27', '00:00', 'H', 'Cabo Verde',           'Saudi Arabia',           '2026-06-27 00:00:00+00', 'group'),  -- 63
('2026-06-27', '00:00', 'H', 'Uruguay',              'Spain',                  '2026-06-27 00:00:00+00', 'group'),  -- 64
('2026-06-27', '03:00', 'G', 'Egypt',                'IR Iran',                '2026-06-27 03:00:00+00', 'group'),  -- 65
('2026-06-27', '03:00', 'G', 'New Zealand',          'Belgium',                '2026-06-27 03:00:00+00', 'group'),  -- 66

-- Sun 28 Jun PKT
('2026-06-27', '21:00', 'L', 'Panama',               'England',                '2026-06-27 21:00:00+00', 'group'),  -- 67
('2026-06-27', '21:00', 'L', 'Croatia',              'Ghana',                  '2026-06-27 21:00:00+00', 'group'),  -- 68
('2026-06-27', '23:30', 'K', 'Colombia',             'Portugal',               '2026-06-27 23:30:00+00', 'group'),  -- 69
('2026-06-27', '23:30', 'K', 'Congo DR',             'Uzbekistan',             '2026-06-27 23:30:00+00', 'group'),  -- 70
('2026-06-28', '02:00', 'J', 'Algeria',              'Austria',                '2026-06-28 02:00:00+00', 'group'),  -- 71
('2026-06-28', '02:00', 'J', 'Jordan',               'Argentina',              '2026-06-28 02:00:00+00', 'group');  -- 72
