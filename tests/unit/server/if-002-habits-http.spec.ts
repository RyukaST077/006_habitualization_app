import { describe, expect, it } from "vitest";

import {
  isUuidLike,
  mapHabitRowToResponse,
  validateCreateHabitBody,
  validateListHabitsQuery,
  type HabitRow,
} from "../../../src/server/application/if-002/habits-http";

describe("IF-002 habits http utility tests", () => {
  it("list query: userId が UUID の場合のみ通す", () => {
    expect(validateListHabitsQuery(null)).toEqual({ ok: false, message: "userId is required" });
    expect(validateListHabitsQuery("not-uuid")).toEqual({ ok: false, message: "userId is required" });
    expect(validateListHabitsQuery("67fbf952-c525-44a4-a76e-ee409d323c8d")).toEqual({
      ok: true,
      userId: "67fbf952-c525-44a4-a76e-ee409d323c8d",
    });
  });

  it("create body: 必須項目が揃わない場合は拒否する", () => {
    expect(validateCreateHabitBody({})).toEqual({
      ok: false,
      message: "userId, name, display_order are required",
    });
    expect(
      validateCreateHabitBody({
        userId: "67fbf952-c525-44a4-a76e-ee409d323c8d",
        name: "Read Book",
        display_order: "1",
      }),
    ).toEqual({
      ok: false,
      message: "userId, name, display_order are required",
    });
    expect(
      validateCreateHabitBody({
        userId: "invalid",
        name: "Read Book",
        display_order: 1,
      }),
    ).toEqual({
      ok: false,
      message: "userId, name, display_order are required",
    });
  });

  it("create body: 正常payloadを抽出する", () => {
    expect(
      validateCreateHabitBody({
        userId: "67fbf952-c525-44a4-a76e-ee409d323c8d",
        name: "Read Book",
        display_order: 1,
      }),
    ).toEqual({
      ok: true,
      userId: "67fbf952-c525-44a4-a76e-ee409d323c8d",
      name: "Read Book",
      displayOrder: 1,
    });
  });

  it("habit row を API レスポンスへ変換する", () => {
    const row: HabitRow = {
      id: 12,
      user_id: "67fbf952-c525-44a4-a76e-ee409d323c8d",
      name: "Meditate",
      display_order: 3,
      status: "active",
      archived_at: null,
      created_at: "2026-03-03T00:00:00.000Z",
      updated_at: "2026-03-03T00:00:00.000Z",
      version: 1,
    };

    expect(mapHabitRowToResponse(row)).toEqual({
      habitId: "12",
      userId: "67fbf952-c525-44a4-a76e-ee409d323c8d",
      name: "Meditate",
      displayOrder: 3,
      status: "active",
      archivedAt: null,
      version: 1,
      createdAt: "2026-03-03T00:00:00.000Z",
      updatedAt: "2026-03-03T00:00:00.000Z",
    });
  });

  it("UUID判定を固定する", () => {
    expect(isUuidLike("67fbf952-c525-44a4-a76e-ee409d323c8d")).toBe(true);
    expect(isUuidLike("67fbf952-c525-74a4-a76e-ee409d323c8d")).toBe(false);
  });
});
