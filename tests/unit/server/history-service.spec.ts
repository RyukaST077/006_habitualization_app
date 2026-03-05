import { describe, expect, it, vi } from "vitest";

import { HistoryService } from "../../../src/server/application/history/HistoryService";
import type { HabitRepositoryContract } from "../../../src/server/domain/repositories/contracts";
import type { Habit, HabitLog, HabitStatus, HabitUpdatePayload } from "../../../src/server/domain/repositories/types";

function createHabitRepository(logs: HabitLog[] = []): HabitRepositoryContract {
  return {
    listHabits: vi.fn(async (_userId: string, _status?: HabitStatus): Promise<Habit[]> => []),
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

describe("HistoryService", () => {
  it("yearMonth の月範囲を算出し checked/missed/grace を返す", async () => {
    const repository = createHabitRepository([
      {
        userId: "user-red-001",
        habitId: "habit-red-001",
        logDate: "2026-02-01",
        checkedInAt: "2026-02-01T09:00:00.000Z",
      },
      {
        userId: "user-red-001",
        habitId: "habit-red-001",
        logDate: "2026-02-03",
        checkedInAt: "2026-02-03T09:00:00.000Z",
      },
    ]);
    const service = new HistoryService(repository);

    const result = await service.getCalendarHistory("user-red-001", "2026-02");

    expect(result.fromDate).toBe("2026-02-01");
    expect(result.toDate).toBe("2026-02-28");
    expect(result.days).toHaveLength(28);
    expect(result.days.find((day) => day.date === "2026-02-01")?.status).toBe("checked");
    expect(result.days.find((day) => day.date === "2026-02-02")?.status).toBe("grace");
    expect(result.days.find((day) => day.date === "2026-02-04")?.status).toBe("missed");

    expect(repository.findLogsByDateRange).toHaveBeenCalledWith(
      "user-red-001",
      "2026-02-01",
      "2026-02-28",
      false,
      undefined,
    );
  });

  it("includeArchived=true と habitId フィルタをリポジトリへ渡す", async () => {
    const repository = createHabitRepository();
    const service = new HistoryService(repository);

    await service.getCalendarHistory("user-red-001", "2026-03", true, "habit-red-001");

    expect(repository.findLogsByDateRange).toHaveBeenCalledWith(
      "user-red-001",
      "2026-03-01",
      "2026-03-31",
      true,
      "habit-red-001",
    );
  });

  it("不正な yearMonth は VALIDATION_ERROR", async () => {
    const repository = createHabitRepository();
    const service = new HistoryService(repository);

    await expect(service.getCalendarHistory("user-red-001", "2026/02")).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      message: "year_month must be yyyy-mm",
      requirementId: "FR-017",
    });
  });
});
