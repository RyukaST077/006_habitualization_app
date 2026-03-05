import { describe, expect, it, vi } from "vitest";

import { SettingsService } from "../../../src/server/application/settings/SettingsService";
import type { UserRepositoryContract } from "../../../src/server/domain/repositories/contracts";
import { createRepositoryError } from "../../../src/server/domain/repositories/errors";
import type { Profile, UserDailyActivity } from "../../../src/server/domain/repositories/types";

function createProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    userId: "user-settings-001",
    displayName: "Settings Tester",
    timezone: "UTC",
    dayCutoffTime: "03:00:00",
    accountStatus: "active",
    version: 1,
    ...overrides,
  };
}

function createUserRepository(profile: Profile | null): UserRepositoryContract {
  return {
    findProfile: vi.fn(async () => profile),
    getProfileSettings: vi.fn(async () =>
      profile
        ? ({
            timezone: profile.timezone,
            dayCutoffTime: profile.dayCutoffTime,
            version: profile.version,
          })
        : null),
    updateProfileSettings: vi.fn(async (_userId: string, timezone: string, cutoff: string, version: number) => {
      if (profile === null) {
        throw createRepositoryError("REPOSITORY_ERROR", "profile not found");
      }
      if (profile.version !== version) {
        throw createRepositoryError("OPTIMISTIC_LOCK_CONFLICT", "profile version conflict");
      }

      const updated: Profile = {
        ...profile,
        timezone,
        dayCutoffTime: cutoff,
        version: profile.version + 1,
      };
      return updated;
    }),
    updateProfileSettingsSnapshot: vi.fn(async (_userId: string, timezone: string, cutoff: string, version: number) => {
      if (profile === null) {
        throw createRepositoryError("REPOSITORY_ERROR", "profile not found");
      }
      if (profile.version !== version) {
        throw createRepositoryError("OPTIMISTIC_LOCK_CONFLICT", "profile version conflict");
      }
      return {
        timezone,
        dayCutoffTime: cutoff,
        version: profile.version + 1,
      };
    }),
    incrementDailyActivity: vi.fn(
      async (_userId: string, _logDate: string, _loginDelta: number, _checkinDelta: number): Promise<UserDailyActivity> => {
        throw new Error("not implemented");
      },
    ),
    findDailyActivitiesByDateRange: vi.fn(async () => []),
    markAccountDisabled: vi.fn(async () => {
      throw new Error("not implemented");
    }),
  };
}

describe("SettingsService", () => {
  it("getProfileSettings: timezone/dayCutoffTime/version を返す", async () => {
    const service = new SettingsService(createUserRepository(createProfile({ dayCutoffTime: "05:15:00" })));

    const result = await service.getProfileSettings("user-settings-001", "trace-settings-get-001");

    expect(result).toEqual({
      timezone: "UTC",
      dayCutoffTime: "05:15",
      version: 1,
    });
  });

  it("updateProfileSettings: FR-020 に従い profiles の設定値のみ更新し saved/effectiveFrom を返す", async () => {
    const userRepository = createUserRepository(createProfile());
    const service = new SettingsService(userRepository, () => "2026-03-05T12:34:56.000Z");

    const result = await service.updateProfileSettings(
      "user-settings-001",
      {
        timezone: "Asia/Tokyo",
        dayCutoffTime: "05:30",
        version: 1,
      },
      "trace-settings-update-001",
    );

    expect(result).toEqual({
      saved: true,
      timezone: "Asia/Tokyo",
      dayCutoffTime: "05:30",
      version: 2,
      effectiveFrom: "2026-03-05T12:34:56.000Z",
    });

    expect(userRepository.updateProfileSettingsSnapshot).toHaveBeenCalledWith(
      "user-settings-001",
      "Asia/Tokyo",
      "05:30:00",
      1,
    );
    expect(userRepository.incrementDailyActivity).not.toHaveBeenCalled();
    expect(userRepository.findDailyActivitiesByDateRange).not.toHaveBeenCalled();
  });

  it("updateProfileSettings: 不正な timezone は AppError(VALIDATION_ERROR) に正規化する", async () => {
    const service = new SettingsService(createUserRepository(createProfile()));

    await expect(
      service.updateProfileSettings(
        "user-settings-001",
        {
          timezone: "Asia/Invalid",
          dayCutoffTime: "03:00",
          version: 1,
        },
        "trace-settings-update-002",
      ),
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      requirementId: "FR-021",
      traceId: "trace-settings-update-002",
    });
  });

  it("updateProfileSettings: 不正な dayCutoffTime は AppError(VALIDATION_ERROR) に正規化する", async () => {
    const service = new SettingsService(createUserRepository(createProfile()));

    await expect(
      service.updateProfileSettings(
        "user-settings-001",
        {
          timezone: "UTC",
          dayCutoffTime: "24:00",
          version: 1,
        },
        "trace-settings-update-003",
      ),
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      requirementId: "FR-021",
      traceId: "trace-settings-update-003",
    });
  });

  it("updateProfileSettings: version 競合は DOMAIN_CONFLICT に写像する", async () => {
    const service = new SettingsService(createUserRepository(createProfile({ version: 2 })));

    await expect(
      service.updateProfileSettings(
        "user-settings-001",
        {
          timezone: "UTC",
          dayCutoffTime: "03:00",
          version: 1,
        },
        "trace-settings-update-004",
      ),
    ).rejects.toMatchObject({
      code: "DOMAIN_CONFLICT",
      requirementId: "FR-020",
      traceId: "trace-settings-update-004",
    });
  });

  it("getProfileSettings: profile 未存在時は FORBIDDEN", async () => {
    const service = new SettingsService(createUserRepository(null));

    await expect(service.getProfileSettings("user-settings-001", "trace-settings-get-002")).rejects.toMatchObject({
      code: "FORBIDDEN",
      requirementId: "FR-019",
      traceId: "trace-settings-get-002",
    });
  });
});
