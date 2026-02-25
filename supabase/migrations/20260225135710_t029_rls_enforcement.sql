-- T-029: Enforce RLS and privileged access boundaries for sensitive operational tables.

alter table public.policy_settings enable row level security;
alter table public.policy_settings force row level security;

alter table public.audit_logs enable row level security;
alter table public.audit_logs force row level security;

alter table public.analytics_daily_kpi enable row level security;
alter table public.analytics_daily_kpi force row level security;

-- policy_settings: read for authenticated/ops/service; writes only service_role.
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

-- audit_logs: direct access only for service_role.
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

-- analytics_daily_kpi: role_002 can read anonymized KPI only; writes only service_role.
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
