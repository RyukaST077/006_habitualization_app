create extension if not exists pgcrypto;

do $$
begin
  begin
    create schema if not exists auth;
  exception
    when insufficient_privilege then
      null;
  end;

  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'auth'
      and p.proname = 'uid'
      and pg_get_function_identity_arguments(p.oid) = ''
  ) then
    begin
      execute '
        create function auth.uid()
        returns uuid
        language sql
        stable
        as $func$
          select nullif(current_setting(''request.jwt.claim.sub'', true), '''')::uuid
        $func$
      ';
    exception
      when insufficient_privilege then
        null;
      when invalid_schema_name then
        null;
    end;
  end if;
end
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.set_habits_archived_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'archived' and old.status is distinct from 'archived' then
    new.archived_at := coalesce(new.archived_at, now());
  end if;

  return new;
end;
$$;

create or replace function public.validate_habit_logs_active_habit()
returns trigger
language plpgsql
as $$
declare
  habit_status text;
begin
  select h.status into habit_status
  from public.habits h
  where h.id = new.habit_id;

  if habit_status is distinct from 'active' then
    raise exception using message = 'habit must be active';
  end if;

  return new;
end;
$$;

create table if not exists profiles (
  user_id uuid not null,
  timezone varchar(64) not null default 'Asia/Tokyo',
  day_cutoff_time time not null default '03:00:00',
  account_status varchar(16) not null default 'active',
  withdrawal_requested_at timestamptz,
  withdrawal_disabled_at timestamptz,
  withdrawal_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1,
  constraint pk_profiles primary key (user_id),
  constraint chk_profiles_timezone check (char_length(timezone) > 0),
  constraint chk_profiles_cutoff check (day_cutoff_time >= time '00:00:00' and day_cutoff_time <= time '23:59:00'),
  constraint chk_profiles_account_status check (account_status in ('active', 'disabled', 'deleted'))
);

create index if not exists idx_profiles_status on profiles (account_status);
create index if not exists idx_profiles_updated_at on profiles (updated_at);

create table if not exists habits (
  id bigserial not null,
  user_id uuid not null,
  name varchar(80) not null,
  display_order integer not null default 100,
  status varchar(16) not null default 'active',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1,
  constraint pk_habits primary key (id),
  constraint fk_habits_user foreign key (user_id) references profiles (user_id),
  constraint chk_habits_status check (status in ('active', 'archived')),
  constraint chk_habits_name_len check (char_length(name) between 1 and 80)
);

create index if not exists idx_habits_user_status_order on habits (user_id, status, display_order);
create index if not exists idx_habits_user_updated on habits (user_id, updated_at desc);

create table if not exists habit_logs (
  id bigserial not null,
  user_id uuid not null,
  habit_id bigint not null,
  log_date date not null,
  checked_in_at timestamptz not null default now(),
  source varchar(16) not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1,
  constraint pk_habit_logs primary key (id),
  constraint fk_habit_logs_habit foreign key (habit_id) references habits (id) on delete cascade,
  constraint uq_habit_logs_habit_date unique (habit_id, log_date)
);

create index if not exists idx_habit_logs_user_date on habit_logs (user_id, log_date desc);
create index if not exists idx_habit_logs_habit_date on habit_logs (habit_id, log_date desc);

create or replace trigger trg_profiles_updated_at
before update on profiles
for each row
execute function public.set_updated_at();

create or replace trigger trg_habits_archive
before update on habits
for each row
execute function public.set_habits_archived_at();

create or replace trigger trg_habit_logs_validate_active
before insert or update of habit_id on habit_logs
for each row
execute function public.validate_habit_logs_active_habit();

create or replace trigger trg_habit_logs_updated_at
before update on habit_logs
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
for select
using (auth.uid() = user_id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
for insert
with check (auth.uid() = user_id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists profiles_delete_own on public.profiles;
create policy profiles_delete_own on public.profiles
for delete
using (auth.uid() = user_id);

alter table public.habits enable row level security;
drop policy if exists habits_select_own on public.habits;
create policy habits_select_own on public.habits
for select
using (auth.uid() = user_id);

drop policy if exists habits_insert_own on public.habits;
create policy habits_insert_own on public.habits
for insert
with check (auth.uid() = user_id);

drop policy if exists habits_update_own on public.habits;
create policy habits_update_own on public.habits
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists habits_delete_own on public.habits;
create policy habits_delete_own on public.habits
for delete
using (auth.uid() = user_id);

alter table public.habit_logs enable row level security;
drop policy if exists habit_logs_select_own on public.habit_logs;
create policy habit_logs_select_own on public.habit_logs
for select
using (auth.uid() = user_id);

drop policy if exists habit_logs_insert_own on public.habit_logs;
create policy habit_logs_insert_own on public.habit_logs
for insert
with check (auth.uid() = user_id);

drop policy if exists habit_logs_update_own on public.habit_logs;
create policy habit_logs_update_own on public.habit_logs
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists habit_logs_delete_own on public.habit_logs;
create policy habit_logs_delete_own on public.habit_logs
for delete
using (auth.uid() = user_id);
