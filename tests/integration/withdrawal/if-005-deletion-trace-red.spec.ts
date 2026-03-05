import { describe, expect, it } from "vitest";

import { HardDeleteJobRunner } from "../../../src/server/application/withdrawal/HardDeleteJobRunner";
import { WithdrawalService } from "../../../src/server/application/withdrawal/WithdrawalService";
import { OpsRepository } from "../../../src/server/infrastructure/repositories/OpsRepository";
import { UserRepository } from "../../../src/server/infrastructure/repositories/UserRepository";
import { createSupabaseRepositoryClient } from "../../../src/server/infrastructure/repositories/supabase-repository-client";

describe("T-029 C-005 IF-005 deletion trace regression", () => {
  it("account_deletion_jobs の追跡列を IF-005 互換で抽出できる", async () => {
    const client = createSupabaseRepositoryClient({
      profiles: [
        {
          userId: "user-trace-001",
          displayName: "Trace User",
          timezone: "UTC",
          dayCutoffTime: "04:00:00",
          accountStatus: "active",
          version: 1,
        },
      ],
    });
    const userRepository = new UserRepository(client);
    const opsRepository = new OpsRepository(client);
    const withdrawalService = new WithdrawalService(userRepository, opsRepository);

    await withdrawalService.requestWithdrawal(
      "user-trace-001",
      "2026-03-01T00:00:00.000Z",
      "trace-if005-001",
    );
    const job = [...client.deletionJobs.values()][0];
    expect(job).toBeDefined();

    const row = {
      user_id: job!.userId,
      job_status: job!.status,
      requested_at: job!.requestedAt,
      disabled_at: job!.disabledAt,
      hard_deleted_at: job!.hardDeletedAt,
      last_error: job!.lastError,
    };

    expect(row.user_id).toBe("user-trace-001");
    expect(row.job_status).toBe("queued");
    expect(row.requested_at).toBe("2026-03-01T00:00:00.000Z");
    expect(row.disabled_at).toBe("2026-03-01T00:00:00.000Z");
    expect(row.hard_deleted_at).toBeNull();
    expect(row.last_error).toBeNull();
  });

  it("failed 記録 -> 再実行 -> completed を IF-005 追跡列で回帰する", async () => {
    const client = createSupabaseRepositoryClient({
      deletionJobs: [
        {
          jobId: "job-trace-002",
          userId: "user-trace-002",
          status: "in_progress",
          requestedAt: "2026-03-01T00:00:00.000Z",
          disableDueAt: "2026-03-01T00:01:00.000Z",
          disabledAt: "2026-03-01T00:00:10.000Z",
          hardDeleteDueAt: "2026-03-01T00:05:00.000Z",
          hardDeletedAt: null,
          retryCount: 0,
          lastError: null,
        },
      ],
    });

    const userRepository = new UserRepository(client);
    const opsRepository = new OpsRepository(client);
    const runner = new HardDeleteJobRunner(userRepository, opsRepository);

    const failedBatch = await runner.run("2026-03-01T00:06:00.000Z");
    expect(failedBatch.failedJobs).toBe(1);

    const failedRow = client.deletionJobs.get("job-trace-002");
    expect(failedRow?.status).toBe("failed");
    expect(failedRow?.retryCount).toBe(1);
    expect(failedRow?.lastError).toContain("profile not found");

    await runner.rerunFailedJob("job-trace-002");
    client.profiles.set("user-trace-002", {
      userId: "user-trace-002",
      displayName: "Trace Retry User",
      timezone: "UTC",
      dayCutoffTime: "04:00:00",
      accountStatus: "disabled",
      version: 1,
    });
    const completedBatch = await runner.run("2026-03-01T00:06:00.000Z");
    expect(completedBatch.completedJobs).toBe(1);

    const completedRow = client.deletionJobs.get("job-trace-002");
    expect(completedRow?.status).toBe("completed");
    expect(completedRow?.retryCount).toBe(1);
    expect(completedRow?.lastError).toContain("profile not found");
    expect(completedRow?.hardDeletedAt).not.toBeNull();
  });
});
