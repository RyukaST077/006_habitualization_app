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
  DeletionJobStatusUpdateInput,
  KpiReportFilter,
  MonitoringAlertEvent,
  MonitoringAlertEventInput,
} from "../../domain/repositories/types";
import {
  buildDailyKpiKeyForRepository,
  cloneAuditLogForRepository,
  cloneRepositoryValue,
  type SupabaseRepositoryClient,
} from "./supabase-repository-client";

const ALLOWED_TRANSITIONS: Record<DeletionJobStatus, DeletionJobStatus[]> = {
  queued: ["in_progress"],
  in_progress: ["completed", "failed"],
  completed: [],
  failed: ["in_progress"],
};

function isAllowedTransition(current: DeletionJobStatus, next: DeletionJobStatus): boolean {
  return ALLOWED_TRANSITIONS[current].includes(next);
}

function listDateRange(fromDate: string, toDate: string): string[] {
  if (fromDate > toDate) {
    return [];
  }

  const current = new Date(`${fromDate}T00:00:00.000Z`);
  const end = new Date(`${toDate}T00:00:00.000Z`);
  if (Number.isNaN(current.getTime()) || Number.isNaN(end.getTime())) {
    return [];
  }

  const dates: string[] = [];
  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

export class OpsRepository implements OpsRepositoryContract {
  public constructor(private readonly client: SupabaseRepositoryClient) {}

  public async insertAuditLog(auditRecord: AuditLogRecordInput): Promise<AuditLogRecord> {
    const now = this.client.now();
    const metadata = { ...(auditRecord.metadata ?? auditRecord.detail ?? {}) };
    const actorRole = auditRecord.actorRole ?? (auditRecord.actorUserId === null ? "system" : "user");
    const targetType = auditRecord.targetType ?? auditRecord.resourceType ?? "unknown";
    const targetId = auditRecord.targetId ?? auditRecord.resourceId ?? "";
    const occurredAt = this.client.nextAuditOccurredAt(now);
    const created: AuditLogRecord = {
      id: this.client.nextAuditLogId(),
      actorRole,
      action: auditRecord.action,
      targetType,
      targetId,
      result: auditRecord.result ?? "success",
      requirementId: auditRecord.requirementId ?? "",
      traceId: auditRecord.traceId ?? "",
      metadata,
      actorUserId: auditRecord.actorUserId ?? null,
      resourceType: auditRecord.resourceType ?? targetType,
      resourceId: auditRecord.resourceId ?? targetId,
      detail: metadata,
      occurredAt,
      createdAt: occurredAt,
    };

    this.client.auditLogs.set(created.id, created);
    return cloneAuditLogForRepository(created);
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
      upsertedRows.push(cloneRepositoryValue(next));
    }

    return upsertedRows;
  }

  public async createDeletionJob(job: AccountDeletionJobInput): Promise<AccountDeletionJob> {
    const hasActiveJob = [...this.client.deletionJobs.values()].some(
      (existing) => existing.userId === job.userId && existing.status !== "completed",
    );
    if (hasActiveJob) {
      throw createRepositoryError("UNIQUE_CONFLICT", "withdrawal already requested");
    }

    const created: AccountDeletionJob = {
      jobId: this.client.nextDeletionJobId(),
      userId: job.userId,
      status: "queued",
      requestedAt: job.requestedAt,
      disableDueAt: job.disableDueAt,
      disabledAt: job.disabledAt ?? null,
      hardDeleteDueAt: job.hardDeleteDueAt,
      hardDeletedAt: null,
      retryCount: 0,
      lastError: null,
    };

    this.client.deletionJobs.set(created.jobId, created);
    return cloneRepositoryValue(created);
  }

  public async updateDeletionJobStatus(
    jobId: string,
    statusOrInput: DeletionJobStatus | DeletionJobStatusUpdateInput,
  ): Promise<AccountDeletionJob> {
    const input: DeletionJobStatusUpdateInput = typeof statusOrInput === "string"
      ? { status: statusOrInput }
      : statusOrInput;
    const status = input.status;

    const current = this.client.deletionJobs.get(jobId);
    if (current === undefined) {
      throw createRepositoryError("REPOSITORY_ERROR", `deletion job not found: ${jobId}`);
    }

    if (current.status !== status && !isAllowedTransition(current.status, status)) {
      throw createRepositoryError("REPOSITORY_ERROR", `invalid deletion job status transition: ${current.status}->${status}`);
    }

    if (current.status === status) {
      return cloneRepositoryValue(current);
    }

    const now = this.client.now();
    const updated: AccountDeletionJob = {
      ...current,
      status,
      disabledAt: status === "in_progress" ? (current.disabledAt ?? now) : current.disabledAt,
      hardDeletedAt: status === "completed" ? now : current.hardDeletedAt,
      retryCount: status === "failed" ? current.retryCount + 1 : current.retryCount,
      lastError: status === "failed" ? (input.lastError ?? current.lastError ?? "hard delete failed") : current.lastError,
    };

    this.client.deletionJobs.set(jobId, updated);
    return cloneRepositoryValue(updated);
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
    return jobs.map(cloneRepositoryValue);
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
    return cloneRepositoryValue(created);
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
      return cloneRepositoryValue(current);
    }

    const updated: MonitoringAlertEvent = {
      ...current,
      notificationStatus: result.notificationStatus,
      notifiedAt: result.notifiedAt,
      errorMessage: result.errorMessage ?? null,
    };

    this.client.monitoringAlertEvents.set(id, updated);
    return cloneRepositoryValue(updated);
  }

  public async queryKpiForReport(filter: KpiReportFilter): Promise<DailyKpiRow[]> {
    const rows: DailyKpiRow[] = [];

    if (filter.metricNames !== undefined) {
      const dates = listDateRange(filter.fromDate, filter.toDate);
      for (const kpiDate of dates) {
        for (const metricName of filter.metricNames) {
          const row = this.client.dailyKpis.get(buildDailyKpiKeyForRepository(kpiDate, metricName));
          if (row !== undefined) {
            rows.push(row);
          }
        }
      }
    } else {
      for (const row of this.client.dailyKpis.values()) {
        if (row.kpiDate < filter.fromDate || row.kpiDate > filter.toDate) {
          continue;
        }
        rows.push(row);
      }
    }

    rows.sort((a, b) => {
      const byDate = a.kpiDate.localeCompare(b.kpiDate);
      if (byDate !== 0) {
        return byDate;
      }
      return a.metricName.localeCompare(b.metricName);
    });

    return rows.map(cloneRepositoryValue);
  }

  public async queryAuditLogsForReport(filter: AuditLogReportFilter): Promise<AuditLogRecord[]> {
    const actions = filter.actions === undefined ? null : new Set(filter.actions);
    const resourceTypes = filter.resourceTypes ?? filter.targetTypes;
    const resourceTypeSet = resourceTypes === undefined ? null : new Set(resourceTypes);
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
      if (resourceTypeSet !== null && !resourceTypeSet.has(row.resourceType)) {
        return false;
      }
      return true;
    });

    rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return rows.slice(0, limit).map(cloneAuditLogForRepository);
  }
}
