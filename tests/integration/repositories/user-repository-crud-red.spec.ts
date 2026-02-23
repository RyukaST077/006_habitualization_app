import { describe, expect, it } from "vitest";

import { UserRepository } from "../../../src/server/infrastructure/repositories/UserRepository";
import { createSupabaseRepositoryClient } from "../../../src/server/infrastructure/repositories/supabase-repository-client";
import { createRepositorySeedBundle } from "./fixtures/repository-seed";

function createUserRepository() {
  const seed = createRepositorySeedBundle();
  const dayCutoffTime = `${String(seed.profile.dayBoundaryHour).padStart(2, "0")}:00:00`;
  const client = createSupabaseRepositoryClient({
    profiles: [
      {
        userId: seed.profile.userId,
        displayName: seed.profile.displayName,
        timezone: seed.profile.timezone,
        dayCutoffTime,
        accountStatus: seed.profile.accountStatus,
        version: seed.profile.version,
      },
    ],
    userDailyActivities: seed.dailyActivities.map((activity) => ({
      userId: activity.userId,
      activityDate: activity.activityDate,
      loginCount: 0,
      checkinCount: activity.checkinCount,
      updatedAt: new Date().toISOString(),
    })),
  });

  return {
    repository: new UserRepository(client),
    userId: seed.profile.userId,
  };
}

describe("T-025 PR-002 M-101 user repository CRUD", () => {
  it("M-101/CRUD/findProfile: own profile を取得できる", async () => {
    const { repository, userId } = createUserRepository();

    const profile = await repository.findProfile(userId);

    expect(profile).not.toBeNull();
    expect(profile?.userId).toBe(userId);
  });

  it("M-101/CRUD/updateProfileSettings: version一致で更新、version不一致は競合", async () => {
    const { repository, userId } = createUserRepository();

    const before = await repository.findProfile(userId);
    expect(before).not.toBeNull();

    const updated = await repository.updateProfileSettings(userId, "UTC", "05:00:00", before!.version);
    expect(updated.timezone).toBe("UTC");
    expect(updated.dayCutoffTime).toBe("05:00:00");
    expect(updated.version).toBe(before!.version + 1);

    await expect(
      repository.updateProfileSettings(userId, "Asia/Tokyo", "03:00:00", before!.version),
    ).rejects.toMatchObject({
      code: "OPTIMISTIC_LOCK_CONFLICT",
      status: 409,
    });
  });

  it("M-101/CRUD/incrementDailyActivity: user/date でupsertされる", async () => {
    const { repository, userId } = createUserRepository();

    const first = await repository.incrementDailyActivity(userId, "2026-02-20", 1, 1);
    expect(first.loginCount).toBe(1);
    expect(first.checkinCount).toBe(1);

    const second = await repository.incrementDailyActivity(userId, "2026-02-20", 2, 3);
    expect(second.loginCount).toBe(3);
    expect(second.checkinCount).toBe(4);
  });

  it("M-101/CRUD/markAccountDisabled: account_status を disabled に更新", async () => {
    const { repository, userId } = createUserRepository();

    const updated = await repository.markAccountDisabled(userId, "2026-02-20T10:00:00.000Z");

    expect(updated.accountStatus).toBe("disabled");
    expect(updated.version).toBeGreaterThan(1);
  });
});
