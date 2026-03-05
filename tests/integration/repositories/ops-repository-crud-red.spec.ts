import { describe, expect, it } from "vitest";

import { OpsRepository } from "../../../src/server/infrastructure/repositories/OpsRepository";
import { createSupabaseRepositoryClient } from "../../../src/server/infrastructure/repositories/supabase-repository-client";
import { createPolicyOpsSeedBundle } from "./fixtures/policy-ops-seed";

function createOpsRepository() {
  const seed = createPolicyOpsSeedBundle();
  const now = new Date().toISOString();
  const client = createSupabaseRepositoryClient({
    auditLogs: [
      {
        id: "1",
        actorRole: "user",
        actorUserId: seed.auditLog.actorUserId,
        action: seed.auditLog.action,
        targetType: seed.auditLog.resourceType,
        targetId: seed.auditLog.resourceId,
        result: "success",
        requirementId: "",
        traceId: "",
        metadata: {},
        resourceType: seed.auditLog.resourceType,
        resourceId: seed.auditLog.resourceId,
        detail: {},
        occurredAt: "2026-02-20T00:00:00.000Z",
        createdAt: "2026-02-20T00:00:00.000Z",
      },
    ],
    dailyKpis: [
      {
        kpiDate: seed.dailyKpi.kpiDate,
        metricName: seed.dailyKpi.metricName,
        metricValue: seed.dailyKpi.metricValue,
        updatedAt: now,
      },
    ],
    deletionJobs: [
      {
        jobId: seed.deletionJob.jobId,
        userId: seed.deletionJob.userId,
        status: "queued",
        requestedAt: "2026-02-20T00:00:00.000Z",
        disableDueAt: "2026-02-20T00:01:00.000Z",
        disabledAt: null,
        hardDeleteDueAt: "2026-02-20T00:06:00.000Z",
        hardDeletedAt: null,
        retryCount: 0,
        lastError: null,
      },
    ],
    monitoringAlertEvents: [
      {
        eventId: seed.monitoringAlertEvent.eventId,
        alertLevel: "P1",
        alertType: seed.monitoringAlertEvent.alertType,
        thresholdRule: "active_users < 5",
        observedValue: 3,
        windowStartAt: "2026-02-20T00:00:00.000Z",
        windowEndAt: "2026-02-20T00:15:00.000Z",
        notificationTarget: "ops@example.com",
        notificationStatus: "pending",
        notifiedAt: null,
        errorMessage: null,
        createdAt: "2026-02-20T00:16:00.000Z",
      },
    ],
  });

  return {
    repository: new OpsRepository(client),
    queuedJobId: seed.deletionJob.jobId,
    alertEventId: seed.monitoringAlertEvent.eventId,
  };
}

describe("T-025 PR-003 M-104 ops repository CRUD", () => {
  it("M-104/CRUD/insertAuditLog + queryAuditLogsForReport: 監査ログを登録/検索", async () => {
    const { repository } = createOpsRepository();

    const inserted = await repository.insertAuditLog({
      actorUserId: "admin-red-002",
      action: "deletion.request",
      resourceType: "account_deletion_jobs",
      resourceId: "job-2",
      detail: { trace: "T-025" },
    });

    expect(inserted.id.length).toBeGreaterThan(0);
    expect(inserted.detail).toEqual({ trace: "T-025" });

    const logs = await repository.queryAuditLogsForReport({
      from: "2026-02-19T00:00:00.000Z",
      to: "2026-02-22T00:00:00.000Z",
      actorUserId: "admin-red-002",
      actions: ["deletion.request"],
    });
    expect(logs).toHaveLength(1);
    expect(logs[0]?.resourceType).toBe("account_deletion_jobs");
  });

  it("M-104/CRUD/upsertDailyKpi + queryKpiForReport: date/metricでupsert", async () => {
    const { repository } = createOpsRepository();

    await repository.upsertDailyKpi([
      {
        kpiDate: "2026-02-20",
        metricName: "active_users",
        metricValue: 12,
      },
      {
        kpiDate: "2026-02-21",
        metricName: "active_users",
        metricValue: 13,
      },
    ]);

    const rows = await repository.queryKpiForReport({
      fromDate: "2026-02-20",
      toDate: "2026-02-21",
      metricNames: ["active_users"],
    });

    expect(rows).toHaveLength(2);
    expect(rows[0]?.metricValue).toBe(12);
    expect(rows[1]?.metricValue).toBe(13);
  });

  it("M-104/CRUD/createDeletionJob/updateDeletionJobStatus/listPendingDeletionJobs", async () => {
    const { repository, queuedJobId } = createOpsRepository();

    const created = await repository.createDeletionJob({
      userId: "user-red-002",
      requestedAt: "2026-02-20T01:00:00.000Z",
      disableDueAt: "2026-02-20T01:01:00.000Z",
      hardDeleteDueAt: "2026-02-20T01:06:00.000Z",
    });
    expect(created.status).toBe("queued");

    const running = await repository.updateDeletionJobStatus(queuedJobId, "in_progress");
    expect(running.status).toBe("in_progress");

    await expect(repository.updateDeletionJobStatus(queuedJobId, "queued")).rejects.toMatchObject({
      code: "REPOSITORY_ERROR",
      status: 500,
    });

    const pendingAtT1 = await repository.listPendingDeletionJobs("2026-02-20T01:02:00.000Z");
    expect(pendingAtT1.some((job) => job.jobId === created.jobId)).toBe(true);

    const completed = await repository.updateDeletionJobStatus(queuedJobId, "completed");
    expect(completed.status).toBe("completed");
  });

  it("M-104/CRUD/deletionJob failed再実行時に retry_count と last_error を保持する", async () => {
    const { repository, queuedJobId } = createOpsRepository();

    await repository.updateDeletionJobStatus(queuedJobId, "in_progress");
    const failed = await repository.updateDeletionJobStatus(queuedJobId, {
      status: "failed",
      lastError: "auth.users delete failed",
    });

    expect(failed.status).toBe("failed");
    expect(failed.retryCount).toBe(1);
    expect(failed.lastError).toBe("auth.users delete failed");

    const rerun = await repository.updateDeletionJobStatus(queuedJobId, "in_progress");
    expect(rerun.status).toBe("in_progress");
    expect(rerun.retryCount).toBe(1);
    expect(rerun.lastError).toBe("auth.users delete failed");
  });

  it("M-104/CRUD/insertMonitoringAlertEvent/markAlertDispatched: 通知イベント更新", async () => {
    const { repository, alertEventId } = createOpsRepository();

    const created = await repository.insertMonitoringAlertEvent({
      alertLevel: "P2",
      alertType: "kpi.threshold",
      thresholdRule: "checkin_rate < 0.4",
      observedValue: 0.2,
      windowStartAt: "2026-02-20T02:00:00.000Z",
      windowEndAt: "2026-02-20T02:15:00.000Z",
      notificationTarget: "ops@example.com",
    });
    expect(created.notificationStatus).toBe("pending");

    const sent = await repository.markAlertDispatched(alertEventId, {
      notificationStatus: "sent",
      notifiedAt: "2026-02-20T02:16:00.000Z",
      errorMessage: null,
    });
    expect(sent.notificationStatus).toBe("sent");

    const sentAgain = await repository.markAlertDispatched(alertEventId, {
      notificationStatus: "sent",
      notifiedAt: "2026-02-20T02:16:00.000Z",
      errorMessage: null,
    });
    expect(sentAgain).toEqual(sent);
  });
});
