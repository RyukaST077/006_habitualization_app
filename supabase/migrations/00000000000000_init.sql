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

alter table policy_settings
  add constraint chk_policy_settings_type
  check (policy_type in ('terms', 'privacy'));

create index idx_policy_settings_updated on policy_settings (updated_at desc);

alter table policy_consents
  add constraint chk_policy_consents_type
  check (policy_type in ('terms', 'privacy'));

alter table policy_consents
  add constraint uq_policy_consents_user_type_ver
  unique (user_id, policy_type, policy_version);

alter table policy_consents
  add constraint fk_policy_consents_user
  foreign key (user_id) references profiles (user_id);

alter table policy_consents
  add constraint fk_policy_consents_type
  foreign key (policy_type) references policy_settings (policy_type);

create index idx_policy_consents_user_type_time
  on policy_consents (user_id, policy_type, consented_at desc);

alter table audit_logs
  add constraint chk_audit_logs_result
  check (result in ('success', 'failure'));

alter table audit_logs
  add constraint chk_audit_logs_required
  check (
    char_length(action) > 0
    and char_length(target_type) > 0
    and char_length(target_id) > 0
  );

create index idx_audit_logs_occurred on audit_logs (occurred_at desc);
create index idx_audit_logs_actor on audit_logs (actor_user_id, occurred_at desc);
create index idx_audit_logs_action_result on audit_logs (action, result, occurred_at desc);

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

create or replace function fn_policy_consents_insert_audit()
returns trigger as $$
begin
  insert into audit_logs (
    occurred_at,
    actor_user_id,
    actor_role,
    action,
    target_type,
    target_id,
    result,
    requirement_id,
    metadata_json,
    created_at
  ) values (
    now(),
    new.user_id,
    'user',
    'policy_consent_insert',
    'policy_consents',
    new.id::varchar(128),
    'success',
    'FR-026',
    jsonb_build_object(
      'policy_type', new.policy_type,
      'policy_version', new.policy_version,
      'consent_source', new.consent_source
    ),
    now()
  );
  return new;
end;
$$ language plpgsql;

create or replace function fn_policy_settings_update_audit()
returns trigger as $$
begin
  insert into audit_logs (
    occurred_at,
    actor_user_id,
    actor_role,
    action,
    target_type,
    target_id,
    result,
    requirement_id,
    metadata_json,
    created_at
  ) values (
    now(),
    new.updated_by,
    case
      when new.updated_by is null then 'system'
      else 'service_role'
    end,
    'policy_settings_update',
    'policy_settings',
    new.policy_type,
    'success',
    'FR-026',
    jsonb_build_object(
      'old_version', old.current_version,
      'new_version', new.current_version,
      'policy_type', new.policy_type
    ),
    now()
  );
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

create trigger trg_policy_consents_insert_audit
after insert on policy_consents
for each row
execute function fn_policy_consents_insert_audit();

create trigger trg_policy_settings_update_audit
after update on policy_settings
for each row
execute function fn_policy_settings_update_audit();

alter table profiles enable row level security;
alter table habits enable row level security;
alter table habit_logs enable row level security;
alter table policy_consents enable row level security;

create policy p_profiles_user_scope on profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy p_habits_user_scope on habits for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy p_habit_logs_user_scope on habit_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy p_policy_consents_user_scope on policy_consents for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

commit;
