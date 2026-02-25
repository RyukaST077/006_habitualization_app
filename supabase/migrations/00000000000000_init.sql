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

create or replace function public.touch_analytics_daily_kpi_upsert()
returns trigger
language plpgsql
as $$
begin
  new.aggregated_at := now();
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

create table if not exists user_daily_activity (
  id bigserial not null,
  user_id uuid not null,
  activity_date date not null,
  login_count integer not null default 0,
  checkin_count integer not null default 0,
  timezone_snapshot varchar(64) not null default 'Asia/Tokyo',
  cutoff_snapshot time not null default '03:00:00',
  aggregated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pk_user_daily_activity primary key (id),
  constraint fk_user_daily_activity_user foreign key (user_id) references profiles (user_id) on delete cascade,
  constraint uq_user_daily_activity_user_date unique (user_id, activity_date),
  constraint chk_user_daily_activity_counts check (login_count >= 0 and checkin_count >= 0)
);

create index if not exists idx_user_daily_activity_date on user_daily_activity (activity_date desc);

create table if not exists analytics_daily_kpi (
  id bigserial not null,
  metric_date date not null,
  metric_key varchar(64) not null,
  metric_value numeric(14, 2) not null default 0,
  dimension_json jsonb not null default '{}'::jsonb,
  dimension_hash varchar(64) not null,
  aggregated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint pk_analytics_daily_kpi primary key (id),
  constraint uq_analytics_daily_kpi_key unique (metric_date, metric_key, dimension_hash),
  constraint chk_analytics_daily_kpi_non_negative check (metric_value >= 0)
);

create index if not exists idx_analytics_daily_kpi_date_key
  on analytics_daily_kpi (metric_date desc, metric_key);

create table if not exists account_deletion_jobs (
  id bigserial not null,
  user_id uuid not null,
  job_status varchar(16) not null default 'queued',
  requested_at timestamptz not null default now(),
  disable_due_at timestamptz not null default (now() + interval '60 second'),
  disabled_at timestamptz,
  hard_delete_due_at timestamptz not null default (now() + interval '5 minute'),
  hard_deleted_at timestamptz,
  retry_count smallint not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pk_account_deletion_jobs primary key (id),
  constraint fk_account_deletion_jobs_user foreign key (user_id) references profiles (user_id) on delete cascade,
  constraint uq_account_deletion_jobs_user unique (user_id),
  constraint chk_account_deletion_jobs_status check (job_status in ('queued', 'in_progress', 'completed', 'failed'))
);

create index if not exists idx_account_deletion_jobs_status_due
  on account_deletion_jobs (job_status, hard_delete_due_at);

create table if not exists monitoring_alert_events (
  id bigserial not null,
  alert_level varchar(8) not null,
  alert_type varchar(32) not null,
  threshold_rule varchar(128) not null,
  observed_value numeric(10, 4) not null,
  window_start_at timestamptz not null,
  window_end_at timestamptz not null,
  notification_target varchar(255) not null,
  notification_status varchar(16) not null default 'pending',
  notified_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  constraint pk_monitoring_alert_events primary key (id),
  constraint chk_monitoring_alert_events_level check (alert_level in ('P1', 'P2')),
  constraint chk_monitoring_alert_events_status check (notification_status in ('pending', 'sent', 'failed'))
);

create index if not exists idx_monitoring_alert_events_status
  on monitoring_alert_events (notification_status, created_at desc);
create index if not exists idx_monitoring_alert_events_level_time
  on monitoring_alert_events (alert_level, created_at desc);

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

create or replace trigger trg_user_daily_activity_upsert
before update on user_daily_activity
for each row
execute function public.set_updated_at();

create or replace trigger trg_analytics_daily_kpi_upsert
before update on analytics_daily_kpi
for each row
execute function public.touch_analytics_daily_kpi_upsert();

create or replace trigger trg_account_deletion_jobs_updated_at
before update on account_deletion_jobs
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

alter table public.user_daily_activity enable row level security;
drop policy if exists user_daily_activity_select_own on public.user_daily_activity;
create policy user_daily_activity_select_own on public.user_daily_activity
for select
using (auth.uid() = user_id);

drop policy if exists user_daily_activity_insert_own on public.user_daily_activity;
create policy user_daily_activity_insert_own on public.user_daily_activity
for insert
with check (auth.uid() = user_id);

drop policy if exists user_daily_activity_update_own on public.user_daily_activity;
create policy user_daily_activity_update_own on public.user_daily_activity
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists user_daily_activity_delete_own on public.user_daily_activity;
create policy user_daily_activity_delete_own on public.user_daily_activity
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

-- RLS security baseline: deny by default.
-- Every table below is FORCEd to ensure no owner bypass and explicit policy-based allow only.
alter table public.profiles force row level security;
alter table public.habits force row level security;
alter table public.habit_logs force row level security;
alter table public.user_daily_activity force row level security;
alter table public.policy_consents force row level security;
alter table public.policy_settings enable row level security;
alter table public.policy_settings force row level security;
alter table public.audit_logs enable row level security;
alter table public.audit_logs force row level security;
alter table public.analytics_daily_kpi enable row level security;
alter table public.analytics_daily_kpi force row level security;

-- Personal data tables must satisfy auth.uid() = user_id and reject ROLE-002.
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
for select
using (auth.uid() = user_id and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'role_002');

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
for insert
with check (auth.uid() = user_id and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'role_002');

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
for update
using (auth.uid() = user_id and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'role_002')
with check (auth.uid() = user_id and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'role_002');

drop policy if exists profiles_delete_own on public.profiles;
create policy profiles_delete_own on public.profiles
for delete
using (auth.uid() = user_id and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'role_002');

drop policy if exists habits_select_own on public.habits;
create policy habits_select_own on public.habits
for select
using (auth.uid() = user_id and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'role_002');

drop policy if exists habits_insert_own on public.habits;
create policy habits_insert_own on public.habits
for insert
with check (auth.uid() = user_id and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'role_002');

drop policy if exists habits_update_own on public.habits;
create policy habits_update_own on public.habits
for update
using (auth.uid() = user_id and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'role_002')
with check (auth.uid() = user_id and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'role_002');

drop policy if exists habits_delete_own on public.habits;
create policy habits_delete_own on public.habits
for delete
using (auth.uid() = user_id and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'role_002');

drop policy if exists habit_logs_select_own on public.habit_logs;
create policy habit_logs_select_own on public.habit_logs
for select
using (auth.uid() = user_id and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'role_002');

drop policy if exists habit_logs_insert_own on public.habit_logs;
create policy habit_logs_insert_own on public.habit_logs
for insert
with check (auth.uid() = user_id and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'role_002');

drop policy if exists habit_logs_update_own on public.habit_logs;
create policy habit_logs_update_own on public.habit_logs
for update
using (auth.uid() = user_id and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'role_002')
with check (auth.uid() = user_id and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'role_002');

drop policy if exists habit_logs_delete_own on public.habit_logs;
create policy habit_logs_delete_own on public.habit_logs
for delete
using (auth.uid() = user_id and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'role_002');

drop policy if exists user_daily_activity_select_own on public.user_daily_activity;
create policy user_daily_activity_select_own on public.user_daily_activity
for select
using (auth.uid() = user_id and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'role_002');

drop policy if exists user_daily_activity_insert_own on public.user_daily_activity;
create policy user_daily_activity_insert_own on public.user_daily_activity
for insert
with check (auth.uid() = user_id and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'role_002');

drop policy if exists user_daily_activity_update_own on public.user_daily_activity;
create policy user_daily_activity_update_own on public.user_daily_activity
for update
using (auth.uid() = user_id and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'role_002')
with check (auth.uid() = user_id and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'role_002');

drop policy if exists user_daily_activity_delete_own on public.user_daily_activity;
create policy user_daily_activity_delete_own on public.user_daily_activity
for delete
using (auth.uid() = user_id and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'role_002');

drop policy if exists policy_consents_select_own on public.policy_consents;
create policy policy_consents_select_own on public.policy_consents
for select
using (auth.uid() = user_id and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'role_002');

drop policy if exists policy_consents_insert_own on public.policy_consents;
create policy policy_consents_insert_own on public.policy_consents
for insert
with check (auth.uid() = user_id and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'role_002');

drop policy if exists policy_consents_update_own on public.policy_consents;
create policy policy_consents_update_own on public.policy_consents
for update
using (auth.uid() = user_id and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'role_002')
with check (auth.uid() = user_id and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'role_002');

drop policy if exists policy_consents_delete_own on public.policy_consents;
create policy policy_consents_delete_own on public.policy_consents
for delete
using (auth.uid() = user_id and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'role_002');

-- policy_settings update path must be privileged (service_role only).
drop policy if exists policy_settings_select_authenticated on public.policy_settings;
create policy policy_settings_select_authenticated on public.policy_settings
for select
using (coalesce(current_setting('request.jwt.claim.role', true), '') in ('authenticated', 'role_002', 'service_role'));

drop policy if exists policy_settings_insert_service_role on public.policy_settings;
create policy policy_settings_insert_service_role on public.policy_settings
for insert
with check (coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role');

drop policy if exists policy_settings_update_service_role on public.policy_settings;
create policy policy_settings_update_service_role on public.policy_settings
for update
using (coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role')
with check (coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role');

drop policy if exists policy_settings_delete_service_role on public.policy_settings;
create policy policy_settings_delete_service_role on public.policy_settings
for delete
using (coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role');

-- audit logs are privileged operation records; only service_role can access directly.
drop policy if exists audit_logs_select_service_role on public.audit_logs;
create policy audit_logs_select_service_role on public.audit_logs
for select
using (coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role');

drop policy if exists audit_logs_insert_service_role on public.audit_logs;
create policy audit_logs_insert_service_role on public.audit_logs
for insert
with check (coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role');

drop policy if exists audit_logs_update_service_role on public.audit_logs;
create policy audit_logs_update_service_role on public.audit_logs
for update
using (coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role')
with check (coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role');

drop policy if exists audit_logs_delete_service_role on public.audit_logs;
create policy audit_logs_delete_service_role on public.audit_logs
for delete
using (coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role');

-- ROLE-002 can read only anonymized KPI table.
drop policy if exists analytics_daily_kpi_select_ops on public.analytics_daily_kpi;
create policy analytics_daily_kpi_select_ops on public.analytics_daily_kpi
for select
using (coalesce(current_setting('request.jwt.claim.role', true), '') in ('role_002', 'service_role'));

drop policy if exists analytics_daily_kpi_insert_service_role on public.analytics_daily_kpi;
create policy analytics_daily_kpi_insert_service_role on public.analytics_daily_kpi
for insert
with check (coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role');

drop policy if exists analytics_daily_kpi_update_service_role on public.analytics_daily_kpi;
create policy analytics_daily_kpi_update_service_role on public.analytics_daily_kpi
for update
using (coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role')
with check (coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role');

drop policy if exists analytics_daily_kpi_delete_service_role on public.analytics_daily_kpi;
create policy analytics_daily_kpi_delete_service_role on public.analytics_daily_kpi
for delete
using (coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role');
