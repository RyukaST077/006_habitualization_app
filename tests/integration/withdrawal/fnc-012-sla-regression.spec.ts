import { describe, expect, it } from "vitest";

import { CheckinService } from "../../../src/server/application/checkin/CheckinService";
import { HardDeleteJobRunner } from "../../../src/server/application/withdrawal/HardDeleteJobRunner";
import { WithdrawalService } from "../../../src/server/application/withdrawal/WithdrawalService";
import { HabitRepository } from "../../../src/server/infrastructure/repositories/HabitRepository";
import { OpsRepository } from "../../../src/server/infrastructure/repositories/OpsRepository";
import { UserRepository } from "../../../src/server/infrastructure/repositories/UserRepository";
import { createSupabaseRepositoryClient } from "../../../src/server/infrastructure/repositories/supabase-repository-client";
import {
  FNC012_EXPECTED_JOB_STATUS,
  FNC012_SLA_POLLING,
} from "./fixtures/fnc-012-cases";

function secondsBetween(startIso: string, endIso: string): number {
  return Math.floor((Date.parse(endIso) - Date.parse(startIso)) / 1000);
}

describe("T-029 C-005 FNC-012 SLA regression", () => {
  it("AC-023: disable_due_at(+60s) / hard_delete_due_at(+5m) を時刻比較で固定する", async () => {
    const client = createSupabaseRepositoryClient({
      profiles: [
        {
          userId: "user-sla-001",
          displayName: "SLA User",
          timezone: "UTC",
          dayCutoffTime: "04:00:00",
          accountStatus: "active",
          version: 1,
        },
      ],
    });
    const withdrawalService = new WithdrawalService(new UserRepository(client), new OpsRepository(client));

    const requestedAt = "2026-03-01T00:00:00.000Z";
    const requested = await withdrawalService.requestWithdrawal("user-sla-001", requestedAt, "trace-sla-001");

    expect(requested.jobStatus).toBe(FNC012_EXPECTED_JOB_STATUS.requested);
    expect(secondsBetween(requested.requestedAt, requested.disableDueAt)).toBe(FNC012_SLA_POLLING.disableWithinSeconds);
    expect(secondsBetween(requested.requestedAt, requested.hardDeleteDueAt)).toBe(
      FNC012_SLA_POLLING.hardDeleteWithinSeconds,
    );
  });

  it("AC-024: 退会完了後は再利用不可(認証後API契約で FORBIDDEN) を固定する", async () => {
    const client = createSupabaseRepositoryClient({
      profiles: [
        {
          userId: "user-sla-002",
          displayName: "SLA Deleted User",
          timezone: "UTC",
          dayCutoffTime: "04:00:00",
          accountStatus: "active",
          version: 1,
        },
      ],
      habits: [
        {
          habitId: "habit-sla-002",
          userId: "user-sla-002",
          name: "run",
          note: null,
          displayOrder: 1,
          status: "active",
          version: 1,
          createdAt: "2026-03-01T00:00:00.000Z",
          updatedAt: "2026-03-01T00:00:00.000Z",
        },
      ],
    });
    const userRepository = new UserRepository(client);
    const opsRepository = new OpsRepository(client);
    const withdrawalService = new WithdrawalService(userRepository, opsRepository);
    const runner = new HardDeleteJobRunner(userRepository, opsRepository);

    const requestedAt = "2026-03-01T00:00:00.000Z";
    await withdrawalService.requestWithdrawal("user-sla-002", requestedAt, "trace-sla-002");
    await runner.run("2026-03-01T00:06:00.000Z");

    expect(client.profiles.has("user-sla-002")).toBe(false);

    const checkinService = new CheckinService(userRepository, new HabitRepository(client));
    await expect(
      checkinService.registerCheckin("user-sla-002", "habit-sla-002", "2026-03-01T12:00:00.000Z", "trace-sla-002-login"),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("EX-007: failed -> rerun -> completed と retry_count/last_error を回帰する", async () => {
    const client = createSupabaseRepositoryClient({
      deletionJobs: [
        {
          jobId: "job-sla-003",
          userId: "user-sla-003",
          status: "in_progress",
          requestedAt: "2026-03-01T00:00:00.000Z",
          disableDueAt: "2026-03-01T00:01:00.000Z",
          disabledAt: "2026-03-01T00:00:00.000Z",
          hardDeleteDueAt: "2026-03-01T00:05:00.000Z",
          hardDeletedAt: null,
          retryCount: 0,
          lastError: null,
        },
      ],
    });
    const runner = new HardDeleteJobRunner(new UserRepository(client), new OpsRepository(client));

    await runner.run("2026-03-01T00:06:00.000Z");
    const failed = client.deletionJobs.get("job-sla-003");
    expect(failed?.status).toBe(FNC012_EXPECTED_JOB_STATUS.failed);
    expect(failed?.retryCount).toBe(1);
    expect(failed?.lastError).toContain("profile not found");

    await runner.rerunFailedJob("job-sla-003");
    expect(client.deletionJobs.get("job-sla-003")?.status).toBe(FNC012_EXPECTED_JOB_STATUS.rerun);

    client.profiles.set("user-sla-003", {
      userId: "user-sla-003",
      displayName: "SLA Retry User",
      timezone: "UTC",
      dayCutoffTime: "04:00:00",
      accountStatus: "disabled",
      version: 1,
    });

    await runner.run("2026-03-01T00:06:00.000Z");
    const completed = client.deletionJobs.get("job-sla-003");
    expect(completed?.status).toBe(FNC012_EXPECTED_JOB_STATUS.completed);
    expect(completed?.retryCount).toBe(1);
    expect(completed?.lastError).toContain("profile not found");
    expect(completed?.hardDeletedAt).not.toBeNull();
  });
});
