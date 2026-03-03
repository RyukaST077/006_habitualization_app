import { describe, expect, it } from "vitest";

import { HabitService } from "../../../src/server/application/habit/HabitService";
import type { HabitAuditLogPort } from "../../../src/server/domain/repositories/contracts";
import { createHabitRepositoryFixture, snapshotHabitRecord } from "../repositories/helpers/repository-test-harness";

function createAuditCapture(): {
  records: Parameters<HabitAuditLogPort["record"]>[0][];
  auditLogPort: HabitAuditLogPort;
} {
  const records: Parameters<HabitAuditLogPort["record"]>[0][] = [];

  return {
    records,
    auditLogPort: {
      async record(input: Parameters<HabitAuditLogPort["record"]>[0]) {
        records.push(input);
      },
    } satisfies HabitAuditLogPort,
  };
}

describe("T-040 PR-002 M-003 HabitService green tests", () => {
  it("createHabit: active作成し HABIT_CREATE 監査を記録する", async () => {
    const { repository, userId } = createHabitRepositoryFixture();
    const capture = createAuditCapture();
    const service = new HabitService(repository, capture.auditLogPort);

    const created = await service.createHabit(userId, "drink water", 20, "trace-pr002-create");

    expect(created.status).toBe("active");
    expect(capture.records).toHaveLength(1);
    expect(capture.records[0]).toMatchObject({
      action: "HABIT_CREATE",
      targetType: "habit",
      targetId: created.habitId,
      requirementId: "FR-006",
      actorUserId: userId,
    });
  });

  it("updateHabit: 本人習慣のみ更新でき HABIT_UPDATE 監査を記録する", async () => {
    const { repository, userId, habitId, client } = createHabitRepositoryFixture();
    const capture = createAuditCapture();
    const service = new HabitService(repository, capture.auditLogPort);
    const before = snapshotHabitRecord(client, habitId);

    const updated = await service.updateHabit(
      userId,
      habitId,
      {
        name: "updated by owner",
        displayOrder: 88,
        version: before.version,
      },
      "trace-pr002-update",
    );

    expect(updated.name).toBe("updated by owner");
    expect(updated.displayOrder).toBe(88);
    expect(capture.records).toHaveLength(1);
    expect(capture.records[0]).toMatchObject({
      action: "HABIT_UPDATE",
      targetType: "habit",
      targetId: habitId,
      requirementId: "FR-007",
      actorUserId: userId,
    });
  });

  it("updateHabit: 他者更新を FORBIDDEN へマップする", async () => {
    const { repository, otherUserId, habitId, client } = createHabitRepositoryFixture();
    const capture = createAuditCapture();
    const service = new HabitService(repository, capture.auditLogPort);
    const before = snapshotHabitRecord(client, habitId);

    await expect(
      service.updateHabit(
        otherUserId,
        habitId,
        {
          name: "stolen",
          version: before.version,
        },
        "trace-pr002-forbidden",
      ),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      requirementId: "FR-007",
      traceId: "trace-pr002-forbidden",
    });
  });

  it("archiveHabit/resumeHabit: 状態遷移と監査アクションを実装する", async () => {
    const { repository, userId, habitId } = createHabitRepositoryFixture();
    const capture = createAuditCapture();
    const service = new HabitService(repository, capture.auditLogPort);

    const archived = await service.archiveHabit(userId, habitId, "trace-pr002-archive");
    const resumed = await service.resumeHabit(userId, habitId, "trace-pr002-resume");

    expect(archived.status).toBe("archived");
    expect(resumed.status).toBe("active");
    expect(capture.records).toHaveLength(2);
    expect(capture.records[0]).toMatchObject({
      action: "HABIT_ARCHIVE",
      requirementId: "FR-008",
      targetId: habitId,
    });
    expect(capture.records[1]).toMatchObject({
      action: "HABIT_RESUME",
      requirementId: "FR-009",
      targetId: habitId,
    });
  });

  it("create/update: 入力不正を INVALID_HABIT_INPUT で拒否する", async () => {
    const { repository, userId, habitId, client } = createHabitRepositoryFixture();
    const capture = createAuditCapture();
    const service = new HabitService(repository, capture.auditLogPort);
    const current = snapshotHabitRecord(client, habitId);

    await expect(service.createHabit(userId, "", 1, "trace-pr002-invalid-create")).rejects.toMatchObject({
      code: "INVALID_HABIT_INPUT",
      requirementId: "FR-006",
    });
    await expect(
      service.updateHabit(
        userId,
        habitId,
        {
          name: "x".repeat(81),
          version: current.version,
        },
        "trace-pr002-invalid-update",
      ),
    ).rejects.toMatchObject({
      code: "INVALID_HABIT_INPUT",
      requirementId: "FR-007",
    });
  });
});
