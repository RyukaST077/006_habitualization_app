-- Initial migration template for Habitualization App
--
-- Usage:
-- 1. Add DDL statements for new tables/indexes/functions from Phase 3 onward.
-- 2. Keep statements idempotent when possible.
-- 3. Validate with `supabase db reset` before `supabase db push`.

begin;

create table profiles (
  user_id uuid primary key,
  timezone varchar(64) not null default 'Asia/Tokyo',
  day_cutoff_time time not null default '03:00:00',
  account_status varchar(16) not null default 'active',
  withdrawal_requested_at timestamptz,
  withdrawal_disabled_at timestamptz,
  withdrawal_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1
);

create table habits (
  id bigserial primary key,
  user_id uuid not null,
  name varchar(80) not null,
  display_order integer not null default 100,
  status varchar(16) not null default 'active',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1
);

create table habit_logs (
  id bigserial primary key,
  user_id uuid not null,
  habit_id bigint not null,
  log_date date not null,
  checked_in_at timestamptz not null default now(),
  source varchar(16) not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1
);

commit;
