import { describe, expect, it } from "vitest";

import { HardDeleteJobRunner } from "../../../src/server/application/withdrawal/HardDeleteJobRunner";
import { OpsRepository } from "../../../src/server/infrastructure/repositories/OpsRepository";
import { UserRepository } from "../../../src/server/infrastructure/repositories/UserRepository";
import { createSupabaseRepositoryClient } from "../../../src/server/infrastructure/repositories/supabase-repository-client";

function createRunnerFixture() {
  const client = createSupabaseRepositoryClient({
    profiles: [
      {
        userId: "user-hard-delete-001",
        displayName: "Hard Delete User",
        timezone: "UTC",
        dayCutoffTime: "04:00:00",
        accountStatus: "disabled",
        version: 2,
      },
    ],
    habits: [
      {
        habitId: "habit-hard-delete-001",
        userId: "user-hard-delete-001",
        name: "run",
        note: null,
        displayOrder: 10,
        status: "active",
        version: 1,
        createdAt: "2026-03-01T00:00:00.000Z",
        updatedAt: "2026-03-01T00:00:00.000Z",
      },
    ],
    habitLogs: [
      {
        userId: "user-hard-delete-001",
        habitId: "habit-hard-delete-001",
        logDate: "2026-03-01",
        checkedInAt: "2026-03-01T08:00:00.000Z",
      },
    ],
    userDailyActivities: [
      {
        userId: "user-hard-delete-001",
        activityDate: "2026-03-01",
        loginCount: 1,
        checkinCount: 1,
        updatedAt: "2026-03-01T09:00:00.000Z",
      },
    ],
    deletionJobs: [
      {
        jobId: "job-complete-001",
        userId: "user-hard-delete-001",
        status: "queued",
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
  const runner = new HardDeleteJobRunner(userRepository, opsRepository, () => "2026-03-01T00:06:00.000Z");

  return { client, runner, opsRepository };
}

describe("T-029 C-003 BAT-004 hard delete runner", () => {
  it("queued -> in_progress -> completed で完全削除を実行する", async () => {
    const { client, runner } = createRunnerFixture();

    const result = await runner.run("2026-03-01T00:06:00.000Z");
    expect(result).toEqual({
      processedJobs: 1,
      completedJobs: 1,
      failedJobs: 0,
    });

    const job = client.deletionJobs.get("job-complete-001");
    expect(job?.status).toBe("completed");
    expect(job?.hardDeletedAt).not.toBeNull();
    expect(client.profiles.has("user-hard-delete-001")).toBe(false);
    expect(
      [...client.habits.values()].filter((habit) => habit.userId === "user-hard-delete-001"),
    ).toHaveLength(0);
    expect(
      [...client.habitLogs.values()].filter((log) => log.userId === "user-hard-delete-001"),
    ).toHaveLength(0);
    expect(
      [...client.userDailyActivities.values()].filter((activity) => activity.userId === "user-hard-delete-001"),
    ).toHaveLength(0);
  });

  it("失敗時は failed 記録し、再実行で in_progress -> completed へ遷移できる", async () => {
    const client = createSupabaseRepositoryClient({
      deletionJobs: [
        {
          jobId: "job-rerun-001",
          userId: "user-rerun-001",
          status: "in_progress",
          requestedAt: "2026-03-01T00:00:00.000Z",
          disableDueAt: "2026-03-01T00:01:00.000Z",
          disabledAt: "2026-03-01T00:00:05.000Z",
          hardDeleteDueAt: "2026-03-01T00:05:00.000Z",
          hardDeletedAt: null,
          retryCount: 0,
          lastError: null,
        },
      ],
    });
    const runner = new HardDeleteJobRunner(new UserRepository(client), new OpsRepository(client), () => "2026-03-01T00:06:00.000Z");

    const first = await runner.run("2026-03-01T00:06:00.000Z");
    expect(first).toEqual({
      processedJobs: 1,
      completedJobs: 0,
      failedJobs: 1,
    });

    const failed = client.deletionJobs.get("job-rerun-001");
    expect(failed?.status).toBe("failed");
    expect(failed?.retryCount).toBe(1);
    expect(failed?.lastError).toContain("profile not found");

    await runner.rerunFailedJob("job-rerun-001");
    expect(client.deletionJobs.get("job-rerun-001")?.status).toBe("in_progress");

    client.profiles.set("user-rerun-001", {
      userId: "user-rerun-001",
      displayName: "Rerun User",
      timezone: "UTC",
      dayCutoffTime: "04:00:00",
      accountStatus: "disabled",
      version: 1,
    });

    const second = await runner.run("2026-03-01T00:06:00.000Z");
    expect(second).toEqual({
      processedJobs: 1,
      completedJobs: 1,
      failedJobs: 0,
    });
    const completed = client.deletionJobs.get("job-rerun-001");
    expect(completed?.status).toBe("completed");
    expect(completed?.lastError).toContain("profile not found");
    expect(completed?.hardDeletedAt).not.toBeNull();
  });
});
