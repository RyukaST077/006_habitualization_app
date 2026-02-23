import { describe, expect, it } from "vitest";

import { HabitRepository } from "../../../src/server/infrastructure/repositories/HabitRepository";
import { createSupabaseRepositoryClient } from "../../../src/server/infrastructure/repositories/supabase-repository-client";
import { createRepositorySeedBundle } from "./fixtures/repository-seed";

function createHabitRepository() {
  const seed = createRepositorySeedBundle();
  const now = new Date().toISOString();
  const client = createSupabaseRepositoryClient({
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
    habitLogs: seed.checkins.map((checkin) => ({
      habitId: checkin.habitId,
      userId: checkin.userId,
      logDate: checkin.checkinDate,
      checkedInAt: now,
    })),
  });

  return {
    repository: new HabitRepository(client),
    userId: seed.profile.userId,
    habitId: seed.habits[0]!.habitId,
  };
}

describe("T-025 PR-002 M-102 habit repository CRUD", () => {
  it("M-102/CRUD/listHabits: actorの習慣のみ取得", async () => {
    const { repository, userId } = createHabitRepository();

    const habits = await repository.listHabits(userId);

    expect(habits.length).toBeGreaterThan(0);
    expect(habits.every((habit) => habit.userId === userId)).toBe(true);
  });

  it("M-102/CRUD/createHabit: active初期状態で作成", async () => {
    const { repository, userId } = createHabitRepository();

    const created = await repository.createHabit(userId, "read", 50);

    expect(created.status).toBe("active");
    expect(created.name).toBe("read");
    expect(created.habitId.length).toBeGreaterThan(0);
  });

  it("M-102/CRUD/updateHabit: version一致で更新し、本人境界外は拒否", async () => {
    const { repository, userId, habitId } = createHabitRepository();

    const list = await repository.listHabits(userId);
    const target = list.find((habit) => habit.habitId === habitId);
    expect(target).toBeDefined();

    const updated = await repository.updateHabit(userId, habitId, {
      name: "walk-2",
      version: target!.version,
    });
    expect(updated.name).toBe("walk-2");
    expect(updated.version).toBe(target!.version + 1);

    await expect(
      repository.updateHabit("user-red-002", habitId, { name: "hack", version: updated.version }),
    ).rejects.toMatchObject({
      status: 403,
      code: "FORBIDDEN",
    });
  });

  it("M-102/CRUD/setHabitStatus: active/archived を切替できる", async () => {
    const { repository, userId, habitId } = createHabitRepository();

    const archived = await repository.setHabitStatus(userId, habitId, "archived");
    expect(archived.status).toBe("archived");

    const restored = await repository.setHabitStatus(userId, habitId, "active");
    expect(restored.status).toBe("active");
  });

  it("M-102/CRUD/upsertCheckin: archived習慣拒否・冪等・unique競合", async () => {
    const { repository, userId, habitId } = createHabitRepository();

    await repository.setHabitStatus(userId, habitId, "archived");
    await expect(
      repository.upsertCheckin(userId, habitId, "2026-02-20", "2026-02-20T10:00:00.000Z"),
    ).rejects.toMatchObject({
      code: "CHECKIN_CONFLICT",
      status: 409,
    });

    await repository.setHabitStatus(userId, habitId, "active");
    const first = await repository.upsertCheckin(userId, habitId, "2026-02-20", "2026-02-20T10:00:00.000Z");
    const second = await repository.upsertCheckin(userId, habitId, "2026-02-20", "2026-02-20T10:00:00.000Z");
    expect(second).toEqual(first);

    await expect(
      repository.upsertCheckin(userId, habitId, "2026-02-20", "2026-02-20T11:00:00.000Z"),
    ).rejects.toMatchObject({
      code: "CHECKIN_CONFLICT",
      status: 409,
    });
  });

  it("M-102/CRUD/deleteCheckin: 対象日のcheckinを削除できる", async () => {
    const { repository, userId, habitId } = createHabitRepository();

    await repository.upsertCheckin(userId, habitId, "2026-02-21", "2026-02-21T09:00:00.000Z");
    const deleted = await repository.deleteCheckin(userId, habitId, "2026-02-21");
    expect(deleted).toBe(true);

    const deletedAgain = await repository.deleteCheckin(userId, habitId, "2026-02-21");
    expect(deletedAgain).toBe(false);
  });

  it("M-102/CRUD/findLogsByDateRange: archived含有フラグで絞り込み", async () => {
    const { repository, userId, habitId } = createHabitRepository();

    await repository.upsertCheckin(userId, habitId, "2026-02-18", "2026-02-18T09:00:00.000Z");
    await repository.upsertCheckin(userId, habitId, "2026-02-19", "2026-02-19T09:00:00.000Z");
    await repository.setHabitStatus(userId, habitId, "archived");

    const withoutArchived = await repository.findLogsByDateRange(userId, "2026-02-18", "2026-02-19", false);
    expect(withoutArchived).toHaveLength(0);

    const withArchived = await repository.findLogsByDateRange(userId, "2026-02-18", "2026-02-19", true);
    expect(withArchived).toHaveLength(2);
  });
});
