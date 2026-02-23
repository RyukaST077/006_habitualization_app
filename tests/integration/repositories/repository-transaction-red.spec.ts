import { describe, expect, it } from "vitest";

import { createRepositoryError } from "../../../src/server/domain/repositories/errors";
import { HabitRepository } from "../../../src/server/infrastructure/repositories/HabitRepository";
import { OpsRepository } from "../../../src/server/infrastructure/repositories/OpsRepository";
import { UserRepository } from "../../../src/server/infrastructure/repositories/UserRepository";
import {
  buildActivityKeyForRepository,
  createSupabaseRepositoryClient,
} from "../../../src/server/infrastructure/repositories/supabase-repository-client";
import { createPolicyOpsSeedBundle } from "./fixtures/policy-ops-seed";
import { createRepositorySeedBundle } from "./fixtures/repository-seed";

describe("T-024 PR-004 cross repository transaction rollback red", () => {
  it("Tx/transaction rollback: Settings + Audit の途中失敗で rollback されるべき", async () => {
    const repositorySeed = createRepositorySeedBundle();
    const policyOpsSeed = createPolicyOpsSeedBundle();
    const client = createSupabaseRepositoryClient({
      profiles: [
        {
          userId: repositorySeed.profile.userId,
          displayName: repositorySeed.profile.displayName,
          timezone: repositorySeed.profile.timezone,
          dayCutoffTime: `${String(repositorySeed.profile.dayBoundaryHour).padStart(2, "0")}:00:00`,
          accountStatus: repositorySeed.profile.accountStatus,
          version: repositorySeed.profile.version,
        },
      ],
      policySettings: policyOpsSeed.settings.map((setting) => ({
        policyType: setting.policyType,
        currentVersion: `${setting.version}`,
        effectiveFrom: "2026-02-20T00:00:00.000Z",
        updatedBy: "service_role:seed",
        updatedAt: "2026-02-20T00:00:00.000Z",
      })),
    });
    const userRepository = new UserRepository(client);
    const opsRepository = new OpsRepository(client);
    const userId = repositorySeed.profile.userId;

    const before = await userRepository.findProfile(userId);
    expect(before).not.toBeNull();

    await expect(
      client.withTransaction(async (txClient) => {
        const txUserRepository = new UserRepository(txClient);
        const txOpsRepository = new OpsRepository(txClient);
        await txUserRepository.updateProfileSettings(
          userId,
          "UTC",
          "05:00:00",
          before!.version,
        );
        await txOpsRepository.insertAuditLog({
          actorUserId: userId,
          action: "settings.update",
          resourceType: "profiles",
          resourceId: userId,
          detail: { source: "tx-test" },
        });
        throw createRepositoryError("REPOSITORY_ERROR", "forced failure after audit insert");
      }),
    ).rejects.toMatchObject({
      code: "REPOSITORY_ERROR",
      status: 500,
    });

    const after = await userRepository.findProfile(userId);
    expect(after).toEqual(before);

    const auditLogs = await opsRepository.queryAuditLogsForReport({
      from: "2026-02-01T00:00:00.000Z",
      to: "2026-03-01T00:00:00.000Z",
      actions: ["settings.update"],
    });
    expect(auditLogs).toHaveLength(0);
  });

  it("Tx/transaction rollback: Checkin + DailyActivity の atomic transaction を要求", async () => {
    const seed = createRepositorySeedBundle();
    const now = "2026-02-21T10:00:00.000Z";
    const client = createSupabaseRepositoryClient({
      profiles: [
        {
          userId: seed.profile.userId,
          displayName: seed.profile.displayName,
          timezone: seed.profile.timezone,
          dayCutoffTime: `${String(seed.profile.dayBoundaryHour).padStart(2, "0")}:00:00`,
          accountStatus: seed.profile.accountStatus,
          version: seed.profile.version,
        },
      ],
      habits: seed.habits.map((habit, index) => ({
        habitId: habit.habitId,
        userId: habit.userId,
        name: habit.name,
        note: null,
        displayOrder: (index + 1) * 10,
        status: habit.status,
        version: habit.version,
        createdAt: now,
        updatedAt: now,
      })),
    });
    const userRepository = new UserRepository(client);
    const habitRepository = new HabitRepository(client);
    const userId = seed.profile.userId;
    const habitId = seed.habits[0]!.habitId;
    const logDate = "2026-02-21";

    await expect(
      client.withTransaction(async (txClient) => {
        const txHabitRepository = new HabitRepository(txClient);
        const txUserRepository = new UserRepository(txClient);

        await txHabitRepository.upsertCheckin(userId, habitId, logDate, now);
        await txUserRepository.incrementDailyActivity(userId, logDate, 0, 1);
        throw createRepositoryError("REPOSITORY_ERROR", "force rollback");
      }),
    ).rejects.toMatchObject({
      code: "REPOSITORY_ERROR",
      status: 500,
    });

    const logs = await habitRepository.findLogsByDateRange(userId, logDate, logDate, true);
    expect(logs).toHaveLength(0);
    const activity = client.userDailyActivities.get(buildActivityKeyForRepository(userId, logDate));
    expect(activity).toBeUndefined();
    const profile = await userRepository.findProfile(userId);
    expect(profile?.version).toBe(seed.profile.version);
  });

  it("Tx/rollback with version conflict: profile version conflict 時は両更新が rollback", async () => {
    const seed = createRepositorySeedBundle({
      profile: {
        userId: "user-red-001",
        displayName: "Red Tester",
        timezone: "Asia/Tokyo",
        dayBoundaryHour: 4,
        version: 3,
        accountStatus: "active",
      },
    });
    const client = createSupabaseRepositoryClient({
      profiles: [
        {
          userId: seed.profile.userId,
          displayName: seed.profile.displayName,
          timezone: seed.profile.timezone,
          dayCutoffTime: `${String(seed.profile.dayBoundaryHour).padStart(2, "0")}:00:00`,
          accountStatus: seed.profile.accountStatus,
          version: seed.profile.version,
        },
      ],
    });
    const userRepository = new UserRepository(client);
    const opsRepository = new OpsRepository(client);
    const userId = seed.profile.userId;

    await expect(
      client.withTransaction(async (txClient) => {
        const txOpsRepository = new OpsRepository(txClient);
        const txUserRepository = new UserRepository(txClient);

        await txOpsRepository.insertAuditLog({
          actorUserId: userId,
          action: "settings.update",
          resourceType: "profiles",
          resourceId: userId,
          detail: { source: "tx-test" },
        });

        await txUserRepository.updateProfileSettings(userId, "UTC", "05:00:00", 2);
      }),
    ).rejects.toMatchObject({
      code: "OPTIMISTIC_LOCK_CONFLICT",
      status: 409,
    });

    const profile = await userRepository.findProfile(userId);
    expect(profile?.version).toBe(3);

    const auditLogs = await opsRepository.queryAuditLogsForReport({
      from: "2026-02-01T00:00:00.000Z",
      to: "2026-03-01T00:00:00.000Z",
      actions: ["settings.update"],
    });
    expect(auditLogs).toHaveLength(0);
  });
});
