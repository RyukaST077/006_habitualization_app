import type { OpsRepositoryContract } from "../../domain/repositories/contracts";
import { createRepositoryError } from "../../domain/repositories/errors";
import type {
  AccountDeletionJob,
  AccountDeletionJobInput,
  AlertDispatchResult,
  AuditLogRecord,
  AuditLogRecordInput,
  AuditLogReportFilter,
  DailyKpiInput,
  DailyKpiRow,
  DeletionJobStatus,
  KpiReportFilter,
  MonitoringAlertEvent,
  MonitoringAlertEventInput,
} from "../../domain/repositories/types";
import { buildDailyKpiKeyForRepository, type SupabaseRepositoryClient } from "./supabase-repository-client";

const ALLOWED_TRANSITIONS: Record<DeletionJobStatus, DeletionJobStatus[]> = {
  queued: ["in_progress"],
  in_progress: ["completed", "failed"],
  completed: [],
  failed: [],
};

function cloneAuditLog(record: AuditLogRecord): AuditLogRecord {
  return {
    ...record,
    detail: { ...record.detail },
  };
}

function cloneDailyKpi(row: DailyKpiRow): DailyKpiRow {
  return { ...row };
}

function cloneDeletionJob(job: AccountDeletionJob): AccountDeletionJob {
  return { ...job };
}

function cloneAlertEvent(event: MonitoringAlertEvent): MonitoringAlertEvent {
  return { ...event };
}

function isAllowedTransition(current: DeletionJobStatus, next: DeletionJobStatus): boolean {
  return ALLOWED_TRANSITIONS[current].includes(next);
}

function getNextAuditLogTimestamp(existingLogs: Iterable<AuditLogRecord>, fallbackIso: string): string {
  let maxMs = Number.NEGATIVE_INFINITY;

  for (const log of existingLogs) {
    const createdAtMs = Date.parse(log.createdAt);
    if (!Number.isNaN(createdAtMs) && createdAtMs > maxMs) {
      maxMs = createdAtMs;
    }
  }

  return maxMs === Number.NEGATIVE_INFINITY ? fallbackIso : new Date(maxMs + 1).toISOString();
}

export class OpsRepository implements OpsRepositoryContract {
  public constructor(private readonly client: SupabaseRepositoryClient) {}

  public async insertAuditLog(record: AuditLogRecordInput): Promise<AuditLogRecord> {
    const now = this.client.now();
    const created: AuditLogRecord = {
      id: this.client.nextAuditLogId(),
      actorUserId: record.actorUserId,
      action: record.action,
      resourceType: record.resourceType,
      resourceId: record.resourceId,
      detail: { ...(record.detail ?? {}) },
      createdAt: getNextAuditLogTimestamp(this.client.auditLogs.values(), now),
    };

    this.client.auditLogs.set(created.id, created);
    return cloneAuditLog(created);
  }

  public async upsertDailyKpi(rows: DailyKpiInput[]): Promise<DailyKpiRow[]> {
    const updatedAt = this.client.now();
    const upsertedRows: DailyKpiRow[] = [];

    for (const row of rows) {
      const key = buildDailyKpiKeyForRepository(row.kpiDate, row.metricName);
      const next: DailyKpiRow = {
        kpiDate: row.kpiDate,
        metricName: row.metricName,
        metricValue: row.metricValue,
        updatedAt,
      };

      this.client.dailyKpis.set(key, next);
      upsertedRows.push(cloneDailyKpi(next));
    }

    return upsertedRows;
  }

  public async createDeletionJob(job: AccountDeletionJobInput): Promise<AccountDeletionJob> {
    const created: AccountDeletionJob = {
      jobId: this.client.nextDeletionJobId(),
      userId: job.userId,
      status: "queued",
      requestedAt: job.requestedAt,
      disableDueAt: job.disableDueAt,
      disabledAt: null,
      hardDeleteDueAt: job.hardDeleteDueAt,
      hardDeletedAt: null,
      retryCount: 0,
      lastError: null,
    };

    this.client.deletionJobs.set(created.jobId, created);
    return cloneDeletionJob(created);
  }

  public async updateDeletionJobStatus(jobId: string, status: DeletionJobStatus): Promise<AccountDeletionJob> {
    const current = this.client.deletionJobs.get(jobId);
    if (current === undefined) {
      throw createRepositoryError("REPOSITORY_ERROR", `deletion job not found: ${jobId}`);
    }

    if (current.status !== status && !isAllowedTransition(current.status, status)) {
      throw createRepositoryError("REPOSITORY_ERROR", `invalid deletion job status transition: ${current.status}->${status}`);
    }

    if (current.status === status) {
      return cloneDeletionJob(current);
    }

    const now = this.client.now();
    const updated: AccountDeletionJob = {
      ...current,
      status,
      disabledAt: status === "in_progress" ? now : current.disabledAt,
      hardDeletedAt: status === "completed" ? now : current.hardDeletedAt,
      retryCount: status === "failed" ? current.retryCount + 1 : current.retryCount,
    };

    this.client.deletionJobs.set(jobId, updated);
    return cloneDeletionJob(updated);
  }

  public async listPendingDeletionJobs(now: string): Promise<AccountDeletionJob[]> {
    const jobs = [...this.client.deletionJobs.values()].filter((job) => {
      if (job.status === "queued") {
        return job.disableDueAt <= now;
      }
      if (job.status === "in_progress") {
        return job.hardDeleteDueAt <= now;
      }
      return false;
    });

    jobs.sort((a, b) => a.requestedAt.localeCompare(b.requestedAt));
    return jobs.map(cloneDeletionJob);
  }

  public async insertMonitoringAlertEvent(event: MonitoringAlertEventInput): Promise<MonitoringAlertEvent> {
    const created: MonitoringAlertEvent = {
      eventId: this.client.nextMonitoringAlertEventId(),
      alertLevel: event.alertLevel,
      alertType: event.alertType,
      thresholdRule: event.thresholdRule,
      observedValue: event.observedValue,
      windowStartAt: event.windowStartAt,
      windowEndAt: event.windowEndAt,
      notificationTarget: event.notificationTarget,
      notificationStatus: "pending",
      notifiedAt: null,
      errorMessage: null,
      createdAt: this.client.now(),
    };

    this.client.monitoringAlertEvents.set(created.eventId, created);
    return cloneAlertEvent(created);
  }

  public async markAlertDispatched(id: string, result: AlertDispatchResult): Promise<MonitoringAlertEvent> {
    const current = this.client.monitoringAlertEvents.get(id);
    if (current === undefined) {
      throw createRepositoryError("REPOSITORY_ERROR", `monitoring alert not found: ${id}`);
    }

    if (
      current.notificationStatus === result.notificationStatus &&
      current.notifiedAt === result.notifiedAt &&
      current.errorMessage === (result.errorMessage ?? null)
    ) {
      return cloneAlertEvent(current);
    }

    const updated: MonitoringAlertEvent = {
      ...current,
      notificationStatus: result.notificationStatus,
      notifiedAt: result.notifiedAt,
      errorMessage: result.errorMessage ?? null,
    };

    this.client.monitoringAlertEvents.set(id, updated);
    return cloneAlertEvent(updated);
  }

  public async queryKpiForReport(filter: KpiReportFilter): Promise<DailyKpiRow[]> {
    const metricNameSet = filter.metricNames === undefined ? null : new Set(filter.metricNames);
    const rows = [...this.client.dailyKpis.values()].filter((row) => {
      if (row.kpiDate < filter.fromDate || row.kpiDate > filter.toDate) {
        return false;
      }
      if (metricNameSet !== null && !metricNameSet.has(row.metricName)) {
        return false;
      }
      return true;
    });

    rows.sort((a, b) => {
      const byDate = a.kpiDate.localeCompare(b.kpiDate);
      if (byDate !== 0) {
        return byDate;
      }
      return a.metricName.localeCompare(b.metricName);
    });

    return rows.map(cloneDailyKpi);
  }

  public async queryAuditLogsForReport(filter: AuditLogReportFilter): Promise<AuditLogRecord[]> {
    const actions = filter.actions === undefined ? null : new Set(filter.actions);
    const resourceTypes = filter.resourceTypes === undefined ? null : new Set(filter.resourceTypes);
    const limit = filter.limit ?? Number.POSITIVE_INFINITY;

    const rows = [...this.client.auditLogs.values()].filter((row) => {
      if (row.createdAt < filter.from || row.createdAt > filter.to) {
        return false;
      }
      if (filter.actorUserId !== undefined && row.actorUserId !== filter.actorUserId) {
        return false;
      }
      if (actions !== null && !actions.has(row.action)) {
        return false;
      }
      if (resourceTypes !== null && !resourceTypes.has(row.resourceType)) {
        return false;
      }
      return true;
    });

    rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return rows.slice(0, limit).map(cloneAuditLog);
  }
}
