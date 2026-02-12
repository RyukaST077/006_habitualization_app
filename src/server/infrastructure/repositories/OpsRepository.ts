import type { SupabaseClient } from '@supabase/supabase-js';

import type { DeletionJobStatus } from './types';

type AuditLogRecord = Record<string, unknown>;
type DailyKpiRow = Record<string, unknown>;
type DeletionJob = Record<string, unknown>;
type MonitoringAlertEvent = Record<string, unknown>;
type ReportFilter = Record<string, unknown>;

export class OpsRepository {
  constructor(private readonly client: SupabaseClient) {}

  async insertAuditLog(record: AuditLogRecord): Promise<void> {
    const { error } = await this.client.from('audit_logs').insert(record);
    if (error) {
      throw new Error(`AUDIT_INSERT_FAILED:${error.message}`);
    }
  }

  async upsertDailyKpi(rows: DailyKpiRow[]): Promise<void> {
    const { error } = await this.client
      .from('analytics_daily_kpi')
      .upsert(rows, { onConflict: 'metric_date,metric_key,dimension_hash' });

    if (error) {
      throw new Error(`KPI_UPSERT_FAILED:${error.message}`);
    }
  }

  async createDeletionJob(job: DeletionJob): Promise<void> {
    const { error } = await this.client.from('account_deletion_jobs').insert(job);
    if (error) {
      throw new Error(`DELETION_JOB_FAILED:${error.message}`);
    }
  }

  async updateDeletionJobStatus(jobId: string, status: DeletionJobStatus): Promise<void> {
    // transaction boundary in service layer keeps queued -> in_progress -> completed/failed consistent.
    const { error } = await this.client
      .from('account_deletion_jobs')
      .update({ status })
      .eq('id', jobId);

    if (error) {
      throw new Error(`DELETION_JOB_FAILED:${error.message}`);
    }
  }

  async listPendingDeletionJobs(now: string): Promise<unknown[]> {
    const { data, error } = await this.client
      .from('account_deletion_jobs')
      .select('*')
      .lte('execute_after', now)
      .in('status', ['queued', 'in_progress']);

    if (error) {
      throw new Error(`DELETION_JOB_FAILED:${error.message}`);
    }

    return data ?? [];
  }

  async insertMonitoringAlertEvent(event: MonitoringAlertEvent): Promise<void> {
    const { error } = await this.client.from('monitoring_alert_events').insert(event);
    if (error) {
      throw new Error(`ALERT_EVENT_FAILED:${error.message}`);
    }
  }

  async markAlertDispatched(id: string, result: 'sent' | 'failed'): Promise<void> {
    // pending -> sent/failed
    const { error } = await this.client
      .from('monitoring_alert_events')
      .update({ status: result })
      .eq('id', id)
      .eq('status', 'pending');

    if (error) {
      throw new Error(`ALERT_EVENT_FAILED:${error.message}`);
    }
  }

  async queryKpiForReport(filter: ReportFilter): Promise<unknown[]> {
    const { data, error } = await this.client.from('analytics_daily_kpi').select('*').match(filter);
    if (error) {
      throw new Error(`KPI_UPSERT_FAILED:${error.message}`);
    }

    return data ?? [];
  }

  async queryAuditLogsForReport(filter: ReportFilter): Promise<unknown[]> {
    const { data, error } = await this.client.from('audit_logs').select('*').match(filter);
    if (error) {
      throw new Error(`AUDIT_INSERT_FAILED:${error.message}`);
    }

    return data ?? [];
  }
}

