import { describe, expect, it, vi } from "vitest";

import { WithdrawalService } from "../../../src/server/application/withdrawal/WithdrawalService";
import type {
  OpsRepositoryContract,
  UserRepositoryContract,
} from "../../../src/server/domain/repositories/contracts";
import { createRepositoryError } from "../../../src/server/domain/repositories/errors";
import type {
  AccountDeletionJob,
  AlertDispatchResult,
  AuditLogRecord,
  AuditLogRecordInput,
  AuditLogReportFilter,
  DailyKpiInput,
  DailyKpiRow,
  KpiReportFilter,
  MonitoringAlertEvent,
  MonitoringAlertEventInput,
  Profile,
  UserDailyActivity,
} from "../../../src/server/domain/repositories/types";

function createProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    userId: "user-withdrawal-001",
    displayName: "Withdrawal Tester",
    timezone: "UTC",
    dayCutoffTime: "04:00:00",
    accountStatus: "active",
    version: 1,
    ...overrides,
  };
}

function createUserRepository(profile: Profile | null): UserRepositoryContract {
  return {
    findProfile: vi.fn(async () => profile),
    updateProfileSettings: vi.fn(async () => {
      throw new Error("not implemented");
    }),
    incrementDailyActivity: vi.fn(
      async (_userId: string, _logDate: string, _loginDelta: number, _checkinDelta: number): Promise<UserDailyActivity> => {
        throw new Error("not implemented");
      },
    ),
    findDailyActivitiesByDateRange: vi.fn(async () => []),
    markAccountDisabled: vi.fn(async (_userId: string, _disabledAt: string) => {
      if (profile === null) {
        throw createRepositoryError("REPOSITORY_ERROR", "profile not found");
      }
      const updated: Profile = { ...profile, accountStatus: "disabled", version: profile.version + 1 };
      return updated;
    }),
    hardDeleteAccountData: vi.fn(async () => undefined),
  };
}

function createOpsRepository(): OpsRepositoryContract {
  return {
    insertAuditLog: vi.fn(async (auditRecord: AuditLogRecordInput): Promise<AuditLogRecord> => ({
      id: "audit-1",
      actorRole: auditRecord.actorRole ?? "user",
      action: auditRecord.action,
      targetType: auditRecord.targetType ?? "profiles",
      targetId: auditRecord.targetId ?? "unknown",
      result: auditRecord.result ?? "success",
      requirementId: auditRecord.requirementId ?? "",
      traceId: auditRecord.traceId ?? "",
      metadata: { ...(auditRecord.metadata ?? {}) },
      actorUserId: auditRecord.actorUserId ?? null,
      resourceType: auditRecord.resourceType ?? "profiles",
      resourceId: auditRecord.resourceId ?? "unknown",
      detail: { ...(auditRecord.detail ?? {}) },
      occurredAt: "2026-03-05T00:00:00.000Z",
      createdAt: "2026-03-05T00:00:00.000Z",
    })),
    upsertDailyKpi: vi.fn(async (_rows: DailyKpiInput[]): Promise<DailyKpiRow[]> => []),
    createDeletionJob: vi.fn(
      async (job): Promise<AccountDeletionJob> => ({
        jobId: "job-001",
        userId: job.userId,
        status: "queued",
        requestedAt: job.requestedAt,
        disableDueAt: job.disableDueAt,
        disabledAt: job.disabledAt ?? null,
        hardDeleteDueAt: job.hardDeleteDueAt,
        hardDeletedAt: null,
        retryCount: 0,
        lastError: null,
      }),
    ),
    updateDeletionJobStatus: vi.fn(async () => {
      throw new Error("not implemented");
    }),
    listPendingDeletionJobs: vi.fn(async () => []),
    insertMonitoringAlertEvent: vi.fn(async (_event: MonitoringAlertEventInput): Promise<MonitoringAlertEvent> => {
      throw new Error("not implemented");
    }),
    markAlertDispatched: vi.fn(async (_id: string, _result: AlertDispatchResult): Promise<MonitoringAlertEvent> => {
      throw new Error("not implemented");
    }),
    queryKpiForReport: vi.fn(async (_filter: KpiReportFilter): Promise<DailyKpiRow[]> => []),
    queryAuditLogsForReport: vi.fn(async (_filter: AuditLogReportFilter): Promise<AuditLogRecord[]> => []),
  };
}

function createAuditPort() {
  return {
    record: vi.fn(async () => undefined),
  };
}

describe("WithdrawalService", () => {
  it("requestWithdrawal: account を disabled にして queued ジョブを起票し監査2件を記録する", async () => {
    const userRepository = createUserRepository(createProfile());
    const opsRepository = createOpsRepository();
    const auditPort = createAuditPort();
    const service = new WithdrawalService(
      userRepository,
      opsRepository,
      () => "2026-03-05T10:00:00.000Z",
      auditPort,
    );

    const result = await service.requestWithdrawal(
      "user-withdrawal-001",
      "2026-03-05T10:00:00.000Z",
      "trace-withdrawal-001",
    );

    expect(result).toEqual({
      userId: "user-withdrawal-001",
      accountStatus: "disabled",
      requestedAt: "2026-03-05T10:00:00.000Z",
      disableDueAt: "2026-03-05T10:01:00.000Z",
      hardDeleteDueAt: "2026-03-05T10:05:00.000Z",
      jobId: "job-001",
      jobStatus: "queued",
    });
    expect(userRepository.markAccountDisabled).toHaveBeenCalledWith(
      "user-withdrawal-001",
      "2026-03-05T10:00:00.000Z",
    );
    expect(opsRepository.createDeletionJob).toHaveBeenCalledWith({
      userId: "user-withdrawal-001",
      requestedAt: "2026-03-05T10:00:00.000Z",
      disableDueAt: "2026-03-05T10:01:00.000Z",
      hardDeleteDueAt: "2026-03-05T10:05:00.000Z",
      disabledAt: "2026-03-05T10:00:00.000Z",
    });
    expect(auditPort.record).toHaveBeenCalledTimes(2);
    expect(auditPort.record).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        action: "WITHDRAW_REQUEST",
        requirementId: "FR-023",
        result: "success",
        actorUserId: "user-withdrawal-001",
      }),
    );
    expect(auditPort.record).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        action: "WITHDRAW_RESULT",
        requirementId: "FR-024",
        result: "success",
        actorUserId: "user-withdrawal-001",
      }),
    );
  });

  it("requestWithdrawal: 重複要求は WITHDRAWAL_ALREADY_REQUESTED に写像する", async () => {
    const userRepository = createUserRepository(createProfile({ accountStatus: "disabled" }));
    userRepository.markAccountDisabled = vi.fn(async () => {
      throw createRepositoryError("UNIQUE_CONFLICT", "withdrawal already requested");
    });
    const opsRepository = createOpsRepository();
    const auditPort = createAuditPort();
    const service = new WithdrawalService(userRepository, opsRepository, () => "2026-03-05T10:00:00.000Z", auditPort);

    await expect(
      service.requestWithdrawal("user-withdrawal-001", "2026-03-05T10:00:00.000Z", "trace-withdrawal-002"),
    ).rejects.toMatchObject({
      code: "WITHDRAWAL_ALREADY_REQUESTED",
      requirementId: "FR-023",
      traceId: "trace-withdrawal-002",
    });

    expect(opsRepository.createDeletionJob).not.toHaveBeenCalled();
    expect(auditPort.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "WITHDRAW_RESULT",
        result: "failure",
        requirementId: "FR-024",
      }),
    );
  });

  it("requestWithdrawal: 監査記録失敗は元エラーを上書きしない", async () => {
    const userRepository = createUserRepository(createProfile());
    const opsRepository = createOpsRepository();
    opsRepository.createDeletionJob = vi.fn(async () => {
      throw new Error("unexpected");
    });
    const auditPort = {
      record: vi.fn(async () => {
        throw new Error("audit failed");
      }),
    };
    const service = new WithdrawalService(userRepository, opsRepository, () => "2026-03-05T10:00:00.000Z", auditPort);

    await expect(
      service.requestWithdrawal("user-withdrawal-001", "2026-03-05T10:00:00.000Z", "trace-withdrawal-003"),
    ).rejects.toMatchObject({
      code: "INTERNAL_ERROR",
      requirementId: "FR-023",
      traceId: "trace-withdrawal-003",
    });
  });
});
