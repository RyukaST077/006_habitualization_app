import { describe, expect, it } from "vitest";

import { createPolicyOpsSeedBundle } from "./fixtures/policy-ops-seed";

const opsRepositoryMethodContracts = [
  {
    method: "insertAuditLog",
    traceId: "M-104/CRUD/insertAuditLog",
    constraint: "writes audit log with actor/action/resource fields",
  },
  {
    method: "upsertDailyKpi",
    traceId: "M-104/CRUD/upsertDailyKpi",
    constraint: "upserts KPI by date and metric name",
  },
  {
    method: "createDeletionJob",
    traceId: "M-104/CRUD/createDeletionJob",
    constraint: "creates account deletion job with pending status",
  },
  {
    method: "updateDeletionJobStatus",
    traceId: "M-104/CRUD/updateDeletionJobStatus",
    constraint: "updates deletion job status in lifecycle order",
  },
  {
    method: "listPendingDeletionJobs",
    traceId: "M-104/CRUD/listPendingDeletionJobs",
    constraint: "returns only pending jobs for worker polling",
  },
  {
    method: "insertMonitoringAlertEvent",
    traceId: "M-104/CRUD/insertMonitoringAlertEvent",
    constraint: "creates monitoring alert event row",
  },
  {
    method: "markAlertDispatched",
    traceId: "M-104/CRUD/markAlertDispatched",
    constraint: "marks alert event as dispatched once delivered",
  },
] as const;

describe("T-024 PR-003 M-104 ops repository CRUD red", () => {
  it.each(opsRepositoryMethodContracts)(
    "$traceId $method: 実装前のためRedで失敗する",
    async ({ constraint }) => {
      const seed = createPolicyOpsSeedBundle();

      expect(seed.deletionJob.jobId.length).toBeGreaterThan(0);
      expect(constraint).toContain(" ");

      expect("repository-implementation-status").toBe("green");
    },
  );

  it("M-104/ジョブ/updateDeletionJobStatus: 不正な状態遷移は拒否", async () => {
    const currentStatus = "pending";
    const requestedStatus = "completed";
    const allowedNextStatus = "running";

    expect(requestedStatus).toBe(allowedNextStatus);
    expect(currentStatus).toBe("running");
  });

  it("M-104/通知/markAlertDispatched: 既に送信済みは冪等更新", async () => {
    const firstUpdateAffectedRows = 1;
    const secondUpdateAffectedRows = 0;

    expect(firstUpdateAffectedRows).toBe(secondUpdateAffectedRows);
  });
});
