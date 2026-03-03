import { describe, expect, it } from "vitest";

import {
  createHabitRepositoryFixture,
  snapshotHabitRecord,
} from "./helpers/repository-test-harness";

function readArchivedAt(value: unknown): string | null | undefined {
  return (value as { archived_at?: string | null }).archived_at;
}

describe("T-039 PR-004 M-102 habit lifecycle constraints (Red)", () => {
  it("M-102/CRUD/createHabit+setHabitStatus: chk_habits_name_len / chk_habits_status を満たさない入力を拒否する", async () => {
    const { repository, userId, habitId } = createHabitRepositoryFixture();

    await expect(repository.createHabit(userId, "", 10)).rejects.toMatchObject({
      constraint: "chk_habits_name_len",
    });
    await expect(repository.createHabit(userId, "x".repeat(81), 20)).rejects.toMatchObject({
      constraint: "chk_habits_name_len",
    });
    await expect(repository.setHabitStatus(userId, habitId, "paused" as never)).rejects.toMatchObject({
      constraint: "chk_habits_status",
    });
  });

  it("M-102/CRUD/setHabitStatus: archived_at を遷移状態に応じて更新する", async () => {
    const { repository, userId, habitId } = createHabitRepositoryFixture();

    const archived = await repository.setHabitStatus(userId, habitId, "archived");
    const resumed = await repository.setHabitStatus(userId, habitId, "active");

    expect(archived.status).toBe("archived");
    expect(readArchivedAt(archived)).toEqual(expect.any(String));
    expect(resumed.status).toBe("active");
    expect(readArchivedAt(resumed)).toBeNull();
  });

  it("M-102/CRUD/updateHabit: 他人習慣更新は RLS/FORBIDDEN で拒否し DB不変", async () => {
    const { repository, client, userId, otherUserId, habitId } = createHabitRepositoryFixture();
    const before = snapshotHabitRecord(client, habitId);

    await expect(
      repository.updateHabit(otherUserId, habitId, {
        name: "stolen-by-other-user",
        version: before.version,
      }),
    ).rejects.toMatchObject({
      status: 403,
      code: "FORBIDDEN",
      message: expect.stringContaining("RLS"),
    });

    const after = snapshotHabitRecord(client, habitId);
    expect(after).toEqual(before);

    const ownerView = await repository.listHabits(userId);
    expect(ownerView.find((habit) => habit.habitId === habitId)?.name).toBe(before.name);
  });
});
