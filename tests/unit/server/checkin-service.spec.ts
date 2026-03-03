import { describe, expect, it, vi } from "vitest";

import { CheckinService } from "../../../src/server/application/checkin/CheckinService";
import type {
  HabitAuthorizationPolicyPort,
  HabitRepositoryContract,
  UserRepositoryContract,
} from "../../../src/server/domain/repositories/contracts";
import { createRepositoryError } from "../../../src/server/domain/repositories/errors";
import type { Habit, HabitLog, HabitStatus, HabitUpdatePayload, Profile } from "../../../src/server/domain/repositories/types";

function createProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    userId: "user-red-001",
    displayName: "Tester",
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
    updateProfileSettings: vi.fn(),
    incrementDailyActivity: vi.fn(),
    markAccountDisabled: vi.fn(),
  };
}

function createHabitRepository(
  upsertImpl: HabitRepositoryContract["upsertCheckin"],
): HabitRepositoryContract {
  return {
    listHabits: vi.fn(async () => [] as Habit[]),
    createHabit: vi.fn(),
    updateHabit: vi.fn(async (_userId: string, _habitId: string, _payload: HabitUpdatePayload) => {
      throw new Error("not implemented");
    }),
    setHabitStatus: vi.fn(async (_userId: string, _habitId: string, _status: HabitStatus) => {
      throw new Error("not implemented");
    }),
    upsertCheckin: vi.fn(upsertImpl),
    deleteCheckin: vi.fn(async () => false),
    findLogsByDateRange: vi.fn(async () => [] as HabitLog[]),
  };
}

function createAuthorizationPolicy(): HabitAuthorizationPolicyPort {
  return {
    assertSelf: vi.fn(),
  };
}

describe("CheckinService", () => {
  it("profile 未存在時は FORBIDDEN を返す", async () => {
    const userRepository = createUserRepository(null);
    const habitRepository = createHabitRepository(async () => {
      throw new Error("should not be called");
    });
    const service = new CheckinService(userRepository, habitRepository, createAuthorizationPolicy());

    await expect(service.registerCheckin("user-red-001", "habit-red-001", "2026-03-01T12:00:00.000Z", "trace-001")).rejects
      .toMatchObject({
        code: "FORBIDDEN",
        requirementId: "FR-011",
        traceId: "trace-001",
      });
  });

  it("dayCutoffTime が HH:mm:ss でも正規化して logDate を計算する", async () => {
    const userRepository = createUserRepository(createProfile({ timezone: "UTC", dayCutoffTime: "04:00:00" }));
    const habitRepository = createHabitRepository(async (_userId, habitId, logDate, checkedInAt) => ({
      log: {
        userId: "user-red-001",
        habitId,
        logDate,
        checkedInAt,
      },
      idempotent: false,
    }));
    const service = new CheckinService(userRepository, habitRepository, createAuthorizationPolicy());

    const result = await service.registerCheckin("user-red-001", "habit-red-001", "2026-03-01T18:00:00.000Z", "trace-002");

    expect(result).toEqual({
      logDate: "2026-03-01",
      idempotent: false,
    });
    expect(habitRepository.upsertCheckin).toHaveBeenCalledWith(
      "user-red-001",
      "habit-red-001",
      "2026-03-01",
      "2026-03-01T18:00:00.000Z",
    );
  });

  it("CHECKIN_CONFLICT は DOMAIN_CONFLICT に写像する", async () => {
    const userRepository = createUserRepository(createProfile());
    const habitRepository = createHabitRepository(async () => {
      throw createRepositoryError("CHECKIN_CONFLICT", "archived habit");
    });
    const service = new CheckinService(userRepository, habitRepository, createAuthorizationPolicy());

    await expect(service.registerCheckin("user-red-001", "habit-red-001", "2026-03-01T18:00:00.000Z", "trace-003")).rejects
      .toMatchObject({
        code: "DOMAIN_CONFLICT",
        requirementId: "FR-011",
        traceId: "trace-003",
      });
  });

  it("想定外例外は INTERNAL_ERROR に写像する", async () => {
    const userRepository = createUserRepository(createProfile());
    const habitRepository = createHabitRepository(async () => {
      throw new Error("unexpected");
    });
    const service = new CheckinService(userRepository, habitRepository, createAuthorizationPolicy());

    await expect(service.registerCheckin("user-red-001", "habit-red-001", "2026-03-01T18:00:00.000Z", "trace-004")).rejects
      .toMatchObject({
        code: "INTERNAL_ERROR",
        requirementId: "FR-011",
        traceId: "trace-004",
      });
  });
});
