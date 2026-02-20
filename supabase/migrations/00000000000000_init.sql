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

create table if not exists policy_settings (
  policy_type varchar(16) not null,
  current_version varchar(20) not null,
  effective_from timestamptz not null default now(),
  document_url varchar(255) not null,
  updated_by uuid,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint pk_policy_settings primary key (policy_type),
  constraint chk_policy_settings_type check (policy_type in ('terms', 'privacy'))
);

create index if not exists idx_policy_settings_updated on policy_settings (updated_at desc);

create table if not exists audit_logs (
  id bigserial not null,
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
  created_at timestamptz not null default now(),
  constraint pk_audit_logs primary key (id),
  constraint fk_audit_logs_actor foreign key (actor_user_id) references profiles (user_id),
  constraint chk_audit_logs_result check (result in ('success', 'failure')),
  constraint chk_audit_logs_required check (
    action is not null
    and target_type is not null
    and target_id is not null
  ),
  constraint chk_audit_logs_policy_settings_metadata check (
    action <> 'POLICY_SETTINGS_UPDATE'
    or (
      metadata_json ? 'old_version'
      and metadata_json ? 'new_version'
      and metadata_json ? 'policy_type'
    )
  )
);

create index if not exists idx_audit_logs_occurred on audit_logs (occurred_at desc);
create index if not exists idx_audit_logs_actor on audit_logs (actor_user_id, occurred_at desc);
create index if not exists idx_audit_logs_action_result on audit_logs (action, result, occurred_at desc);
-- retention policy note: BAT-003 maintenance job physically deletes records older than 90 days.

insert into policy_settings (policy_type, current_version, effective_from, document_url, updated_by, updated_at, created_at)
values
  ('terms', 'v1.0', now(), 'https://example.com/terms-v1.0', null, now(), now()),
  ('privacy', 'v1.0', now(), 'https://example.com/privacy-v1.0', null, now(), now())
on conflict (policy_type) do update
set current_version = excluded.current_version,
    effective_from = excluded.effective_from,
    document_url = excluded.document_url,
    updated_by = excluded.updated_by,
    updated_at = excluded.updated_at;

create or replace function public.audit_policy_settings_update()
returns trigger
language plpgsql
as $$
begin
  if to_regclass('public.audit_logs') is not null then
    insert into public.audit_logs (
      occurred_at,
      actor_user_id,
      actor_role,
      action,
      target_type,
      target_id,
      result,
      metadata_json,
      created_at
    )
    values (
      now(),
      new.updated_by,
      'service_role',
      'POLICY_SETTINGS_UPDATE',
      'policy_settings',
      new.policy_type,
      'success',
      jsonb_build_object(
        'old_version', old.current_version,
        'new_version', new.current_version,
        'policy_type', new.policy_type
      ),
      now()
    );
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create table if not exists policy_consents (
  id bigserial not null,
  user_id uuid not null,
  policy_type varchar(16) not null,
  policy_version varchar(20) not null,
  consented_at timestamptz not null default now(),
  consent_source varchar(16) not null default 'web',
  user_agent text,
  created_at timestamptz not null default now(),
  constraint pk_policy_consents primary key (id),
  constraint fk_policy_consents_user foreign key (user_id) references profiles (user_id),
  constraint fk_policy_consents_type foreign key (policy_type) references policy_settings (policy_type),
  constraint uq_policy_consents_user_type_ver unique (user_id, policy_type, policy_version),
  constraint chk_policy_consents_type check (policy_type in ('terms', 'privacy'))
);

create index if not exists idx_policy_consents_user_type_time
  on policy_consents (user_id, policy_type, consented_at desc);

create or replace function public.audit_policy_consents_insert()
returns trigger
language plpgsql
as $$
begin
  if to_regclass('public.audit_logs') is not null then
    insert into public.audit_logs (
      occurred_at,
      actor_user_id,
      actor_role,
      action,
      target_type,
      target_id,
      result,
      metadata_json,
      created_at
    )
    values (
      now(),
      new.user_id,
      'user',
      'POLICY_CONSENT_ACCEPT',
      'policy_consents',
      new.id::text,
      'success',
      jsonb_build_object(
        'policy_type', new.policy_type,
        'policy_version', new.policy_version,
        'consent_source', new.consent_source
      ),
      now()
    );
  end if;

  return new;
end;
$$;

create or replace trigger trg_profiles_updated_at
before update on profiles
for each row
execute function public.set_updated_at();

create or replace trigger trg_policy_settings_update_audit
before update on policy_settings
for each row
execute function public.audit_policy_settings_update();

create or replace trigger trg_policy_consents_insert_audit
after insert on policy_consents
for each row
execute function public.audit_policy_consents_insert();

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

alter table public.policy_consents enable row level security;
drop policy if exists policy_consents_select_own on public.policy_consents;
create policy policy_consents_select_own on public.policy_consents
for select
using (auth.uid() = user_id);

drop policy if exists policy_consents_insert_own on public.policy_consents;
create policy policy_consents_insert_own on public.policy_consents
for insert
with check (auth.uid() = user_id);

drop policy if exists policy_consents_update_own on public.policy_consents;
create policy policy_consents_update_own on public.policy_consents
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists policy_consents_delete_own on public.policy_consents;
create policy policy_consents_delete_own on public.policy_consents
for delete
using (auth.uid() = user_id);
