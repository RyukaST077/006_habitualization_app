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

create table policy_settings (
  policy_type varchar(16) primary key,
  current_version varchar(20) not null,
  effective_from timestamptz not null default now(),
  document_url varchar(255) not null,
  updated_by uuid,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table policy_consents (
  id bigserial primary key,
  user_id uuid not null,
  policy_type varchar(16) not null,
  policy_version varchar(20) not null,
  consented_at timestamptz not null default now(),
  consent_source varchar(16) not null default 'web',
  user_agent text,
  created_at timestamptz not null default now()
);

create table audit_logs (
  id bigserial primary key,
  occurred_at timestamptz not null default now(),
  actor_user_id uuid,
  actor_role varchar(32) not null,
  action varchar(64) not null,
  target_type varchar(64) not null,
  target_id varchar(128) not null,
  result varchar(16) not null,
  reason text,
  requirement_id varchar(16),
  trace_id uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table profiles
  add constraint chk_profiles_cutoff
  check (day_cutoff_time >= time '00:00:00' and day_cutoff_time <= time '23:59:00');

create index idx_profiles_status on profiles (account_status);
create index idx_profiles_updated_at on profiles (updated_at);

alter table habits
  add constraint chk_habits_status
  check (status in ('active', 'archived'));

alter table habits
  add constraint chk_habits_name_len
  check (char_length(name) between 1 and 80);

create index idx_habits_user_status_order on habits (user_id, status, display_order);
create index idx_habits_user_updated on habits (user_id, updated_at desc);

alter table habit_logs
  add constraint uq_habit_logs_habit_date
  unique (habit_id, log_date);

alter table habit_logs
  add constraint fk_habit_logs_habit
  foreign key (habit_id) references habits (id);

create index idx_habit_logs_user_date on habit_logs (user_id, log_date desc);
create index idx_habit_logs_habit_date on habit_logs (habit_id, log_date desc);

create or replace function fn_set_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create or replace function fn_set_habits_archived_at()
returns trigger as $$
begin
  if new.status = 'archived' and coalesce(old.status, '') <> 'archived' and new.archived_at is null then
    new.archived_at := now();
  end if;
  return new;
end;
$$ language plpgsql;

create or replace function fn_validate_active_habit()
returns trigger as $$
declare
  target_status varchar(16);
begin
  select status into target_status from habits where id = new.habit_id;
  if target_status is distinct from 'active' then
    raise exception 'habit is not active';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated_at
before update on profiles
for each row
execute function fn_set_updated_at();

create trigger trg_habits_archive
before update on habits
for each row
execute function fn_set_habits_archived_at();

create trigger trg_habit_logs_validate_active
before insert on habit_logs
for each row
execute function fn_validate_active_habit();

create trigger trg_habit_logs_updated_at
before update on habit_logs
for each row
execute function fn_set_updated_at();

alter table profiles enable row level security;
alter table habits enable row level security;
alter table habit_logs enable row level security;

create policy p_profiles_user_scope on profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy p_habits_user_scope on habits for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy p_habit_logs_user_scope on habit_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

commit;
