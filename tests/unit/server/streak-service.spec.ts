import { describe, expect, it, vi } from "vitest";

import { StreakService } from "../../../src/server/application/streak/StreakService";
import type { HabitRepositoryContract } from "../../../src/server/domain/repositories/contracts";
import type { Habit, HabitLog, HabitStatus, HabitUpdatePayload } from "../../../src/server/domain/repositories/types";

function createHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    habitId: "habit-red-001",
    userId: "user-red-001",
    name: "exercise",
    note: null,
    status: "active",
    displayOrder: 1,
    archivedAt: null,
    createdAt: "2026-02-01T00:00:00.000Z",
    updatedAt: "2026-02-01T00:00:00.000Z",
    version: 1,
    ...overrides,
  };
}

function createHabitRepository(logs: HabitLog[], habits: Habit[] = [createHabit()]): HabitRepositoryContract {
  return {
    listHabits: vi.fn(async () => habits),
    createHabit: vi.fn(),
    updateHabit: vi.fn(async (_userId: string, _habitId: string, _payload: HabitUpdatePayload) => {
      throw new Error("not implemented");
    }),
    setHabitStatus: vi.fn(async (_userId: string, _habitId: string, _status: HabitStatus) => {
      throw new Error("not implemented");
    }),
    upsertCheckin: vi.fn(),
    deleteCheckin: vi.fn(),
    findLogsByDateRange: vi.fn(async () => logs),
  };
}

describe("StreakService", () => {
  it("1日未達のときはストリークを維持する（graceUsed=true）", async () => {
    const repository = createHabitRepository([
      {
        userId: "user-red-001",
        habitId: "habit-red-001",
        logDate: "2026-03-03",
        checkedInAt: "2026-03-03T09:00:00.000Z",
      },
      {
        userId: "user-red-001",
        habitId: "habit-red-001",
        logDate: "2026-03-01",
        checkedInAt: "2026-03-01T09:00:00.000Z",
      },
    ]);
    const service = new StreakService(repository);

    const result = await service.calculateCurrentStreak("user-red-001", "habit-red-001", "2026-03-04", "trace-001");

    expect(result).toEqual({
      current: 2,
      graceUsed: true,
      lastLogDate: "2026-03-03",
    });
  });

  it("2日連続未達のときはストリークをリセットする", async () => {
    const repository = createHabitRepository([
      {
        userId: "user-red-001",
        habitId: "habit-red-001",
        logDate: "2026-03-02",
        checkedInAt: "2026-03-02T09:00:00.000Z",
      },
    ]);
    const service = new StreakService(repository);

    const result = await service.calculateCurrentStreak("user-red-001", "habit-red-001", "2026-03-04", "trace-002");

    expect(result).toEqual({
      current: 0,
      graceUsed: false,
    });
  });

  it("未記録時は current=0 を返す", async () => {
    const repository = createHabitRepository([]);
    const service = new StreakService(repository);

    const result = await service.calculateCurrentStreak("user-red-001", "habit-red-001", "2026-03-04", "trace-003");

    expect(result).toEqual({
      current: 0,
      graceUsed: false,
    });
  });

  it("habit 未存在時は IF-002 で扱える DOMAIN_CONFLICT を返す", async () => {
    const repository = createHabitRepository([], []);
    const service = new StreakService(repository);

    await expect(service.calculateCurrentStreak("user-red-001", "habit-red-001", "2026-03-04", "trace-004")).rejects
      .toMatchObject({
        code: "DOMAIN_CONFLICT",
        message: "HABIT_NOT_FOUND",
        requirementId: "FR-015",
        traceId: "trace-004",
      });
  });
});
