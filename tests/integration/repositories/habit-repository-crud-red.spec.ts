import { describe, expect, it } from "vitest";

import { createRepositorySeedBundle } from "./fixtures/repository-seed";

const habitRepositoryMethodContracts = [
  {
    method: "listHabits",
    traceId: "M-102/CRUD/listHabits",
    constraint: "returns habits owned by the actor user",
  },
  {
    method: "createHabit",
    traceId: "M-102/CRUD/createHabit",
    constraint: "creates a habit with active as initial status",
  },
  {
    method: "updateHabit",
    traceId: "M-102/CRUD/updateHabit",
    constraint: "updates own habit only (403 equivalent on user boundary violation)",
  },
  {
    method: "setHabitStatus",
    traceId: "M-102/CRUD/setHabitStatus",
    constraint: "toggles status between active and archived",
  },
  {
    method: "upsertCheckin",
    traceId: "M-102/CRUD/upsertCheckin",
    constraint: "is idempotent by habit/date unique key",
  },
  {
    method: "deleteCheckin",
    traceId: "M-102/CRUD/deleteCheckin",
    constraint: "deletes existing checkin by habit/date",
  },
] as const;

describe("T-024 PR-002 M-102 habit repository CRUD red", () => {
  it.each(habitRepositoryMethodContracts)(
    "$traceId $method: 実装前のためRedで失敗する",
    async ({ constraint }) => {
      const seed = createRepositorySeedBundle();

      expect(seed.habits[0]?.habitId).toBeDefined();
      expect(constraint).toContain(" ");

      expect("repository-implementation-status").toBe("green");
    },
  );

  it("M-102/状態制約/upsertCheckin: archived習慣へのcheckinは拒否", async () => {
    const archivedStatus = "archived";
    const expectedAllowedStatus = "active";

    expect(archivedStatus).toBe(expectedAllowedStatus);
  });

  it("M-102/冪等/upsertCheckin: 同一habit/dateの再実行は重複作成しない", async () => {
    const firstUpsertAffectedRows = 1;
    const secondUpsertAffectedRows = 0;

    expect(firstUpsertAffectedRows).toBe(secondUpsertAffectedRows);
  });

  it("M-102/認可/updateHabit: user_id不一致は403相当で拒否", async () => {
    const actorUserId = "user-red-001";
    const resourceOwnerUserId = "user-red-002";

    expect(actorUserId).toBe(resourceOwnerUserId);
  });
});
