begin;

create table user_daily_activity (
  id bigserial primary key,
  user_id uuid not null,
  activity_date date not null,
  login_count integer not null default 0,
  checkin_count integer not null default 0,
  timezone_snapshot varchar(64) not null default 'Asia/Tokyo',
  cutoff_snapshot time not null default '03:00:00',
  aggregated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table analytics_daily_kpi (
  id bigserial primary key,
  metric_date date not null,
  metric_key varchar(64) not null,
  metric_value numeric(14, 2) not null default 0,
  dimension_json jsonb not null default '{}'::jsonb,
  dimension_hash varchar(64) not null,
  aggregated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table account_deletion_jobs (
  id bigserial primary key,
  user_id uuid not null,
  job_status varchar(16) not null default 'queued',
  requested_at timestamptz not null default now(),
  disable_due_at timestamptz not null default now() + interval '60 second',
  disabled_at timestamptz,
  hard_delete_due_at timestamptz not null default now() + interval '5 minute',
  hard_deleted_at timestamptz,
  retry_count smallint not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table monitoring_alert_events (
  id bigserial primary key,
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
  created_at timestamptz not null default now()
);

alter table user_daily_activity
  add constraint uq_user_daily_activity_user_date
  unique (user_id, activity_date);

alter table user_daily_activity
  add constraint chk_user_daily_activity_counts
  check (login_count >= 0 and checkin_count >= 0);

create index idx_user_daily_activity_date
  on user_daily_activity (activity_date desc);

alter table analytics_daily_kpi
  add constraint uq_analytics_daily_kpi_key
  unique (metric_date, metric_key, dimension_hash);

alter table analytics_daily_kpi
  add constraint chk_analytics_daily_kpi_non_negative
  check (metric_value >= 0);

create index idx_analytics_daily_kpi_date_key
  on analytics_daily_kpi (metric_date desc, metric_key);

alter table account_deletion_jobs
  add constraint uq_account_deletion_jobs_user
  unique (user_id);

alter table account_deletion_jobs
  add constraint chk_account_deletion_jobs_status
  check (job_status in ('queued', 'in_progress', 'completed', 'failed'));

create index idx_account_deletion_jobs_status_due
  on account_deletion_jobs (job_status, hard_delete_due_at);

create trigger trg_account_deletion_jobs_updated_at
before update on account_deletion_jobs
for each row
execute function fn_set_updated_at();

-- role-002/service role only access marker (implemented in PR-003)
-- P2 is default disabled and only inserted on explicit opt-in setting.
alter table monitoring_alert_events
  add constraint chk_monitoring_alert_events_level
  check (alert_level in ('P1', 'P2'));

alter table monitoring_alert_events
  add constraint chk_monitoring_alert_events_status
  check (notification_status in ('pending', 'sent', 'failed'));

create index idx_monitoring_alert_events_status
  on monitoring_alert_events (notification_status, created_at desc);

create index idx_monitoring_alert_events_level_time
  on monitoring_alert_events (alert_level, created_at desc);

commit;
