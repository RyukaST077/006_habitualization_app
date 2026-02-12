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

commit;
