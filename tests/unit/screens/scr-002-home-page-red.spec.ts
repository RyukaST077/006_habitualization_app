import { describe, expect, it } from "vitest";

import { SCR002HomePage } from "../../../src/screens/SCR-002HomePage";

describe("T-026 C-004 SCR-002 cancel checkin ui tests", () => {
  it("archived拒否(409)時は SCR-004 への再開導線を表示する", () => {
    const page = SCR002HomePage({ screenId: "SCR-002" });
    const result = page.actions.resolveCheckinResult({
      kind: "error",
      status: 409,
      code: "DOMAIN_CONFLICT",
    });

    expect(result.lastCheckinLogDate).toBeNull();
    expect(result.error?.status).toBe(409);
    expect(result.error?.code).toBe("DOMAIN_CONFLICT");
    expect(result.error?.recoveryAction).toEqual({
      label: "再開してチェックインする",
      targetScreenId: "SCR-004",
    });
  });

  it("冪等成功時はエラーを表示せず状態のみ更新する", () => {
    const page = SCR002HomePage({ screenId: "SCR-002" });
    const result = page.actions.resolveCheckinResult({
      kind: "success",
      logDate: "2026-02-23",
      idempotent: true,
    });

    expect(result.error).toBeNull();
    expect(result.lastCheckinLogDate).toBe("2026-02-23");
  });

  it("403/500 エラー時は再開導線を表示しない", () => {
    const page = SCR002HomePage({ screenId: "SCR-002" });
    const forbidden = page.actions.resolveCheckinResult({
      kind: "error",
      status: 403,
      code: "FORBIDDEN",
    });
    const internal = page.actions.resolveCheckinResult({
      kind: "error",
      status: 500,
      code: "INTERNAL_ERROR",
      traceId: "SCR002-500",
    });

    expect(forbidden.error?.recoveryAction).toBeNull();
    expect(internal.error?.recoveryAction).toBeNull();
  });

  it("取消成功時は当日達成状態を未達成へ再描画する", async () => {
    const page = SCR002HomePage({
      screenId: "SCR-002",
      handlers: {
        onCancelCheckin: async () => ({
          kind: "success",
          logDate: null,
          idempotent: false,
        }),
      },
    });

    const result = await page.actions.cancelTodayCheckin({
      habitId: "habit-red-001",
      nowUtc: "2026-03-11T10:00:00.000Z",
    });

    expect(result).toEqual({
      lastCheckinLogDate: null,
      error: null,
    });
    expect(page.ui.cancelCheckin.isSubmitting).toBe(false);
  });

  it("当日外取消(409)時は条件エラーメッセージを表示する", async () => {
    const page = SCR002HomePage({
      screenId: "SCR-002",
      handlers: {
        onCancelCheckin: async () => ({
          kind: "error",
          status: 409,
          code: "DOMAIN_CONFLICT",
          domainConflictReason: "CHECKIN_CANCEL_NOT_ALLOWED",
          traceId: "SCR002-CANCEL-OUTSIDE-DAY",
        }),
      },
    });

    const result = await page.actions.cancelTodayCheckin({
      habitId: "habit-red-001",
      nowUtc: "2026-03-12T10:00:00.000Z",
    });

    expect(result?.lastCheckinLogDate).toBeNull();
    expect(result?.error?.message).toBe("当日分以外のチェックインは取り消せません");
    expect(result?.error?.recoveryAction).toEqual({
      label: "再開してチェックインする",
      targetScreenId: "SCR-004",
    });
  });

  it("取消実行中は二重送信を抑止する", async () => {
    let releaseFirst: (() => void) | undefined;
    let callCount = 0;
    const page = SCR002HomePage({
      screenId: "SCR-002",
      handlers: {
        onCancelCheckin: async () => {
          callCount += 1;
          await new Promise<void>((resolve) => {
            releaseFirst = resolve;
          });
          return {
            kind: "success" as const,
            logDate: null,
            idempotent: false as const,
          };
        },
      },
    });

    const firstPromise = page.actions.cancelTodayCheckin({
      habitId: "habit-red-001",
      nowUtc: "2026-03-11T10:00:00.000Z",
    });
    const second = await page.actions.cancelTodayCheckin({
      habitId: "habit-red-001",
      nowUtc: "2026-03-11T10:00:00.000Z",
    });

    expect(page.ui.cancelCheckin.isSubmitting).toBe(true);
    expect(callCount).toBe(1);
    expect(second).toBeNull();

    if (!releaseFirst) {
      throw new Error("releaseFirst was not assigned");
    }
    releaseFirst();
    const first = await firstPromise;
    expect(first).toEqual({
      lastCheckinLogDate: null,
      error: null,
    });
    expect(page.ui.cancelCheckin.isSubmitting).toBe(false);
  });

  it("onCancelCheckin 未設定時は INTERNAL_ERROR(500) を返す", async () => {
    const page = SCR002HomePage({ screenId: "SCR-002" });

    const result = await page.actions.cancelTodayCheckin({
      habitId: "habit-red-001",
      nowUtc: "2026-03-11T10:00:00.000Z",
    });

    expect(result?.lastCheckinLogDate).toBeNull();
    expect(result?.error?.status).toBe(500);
    expect(result?.error?.code).toBe("INTERNAL_ERROR");
  });

  it("onCancelCheckin が例外時は INTERNAL_ERROR(500) を返す", async () => {
    const page = SCR002HomePage({
      screenId: "SCR-002",
      handlers: {
        onCancelCheckin: async () => {
          throw new Error("network failed");
        },
      },
    });

    const result = await page.actions.cancelTodayCheckin({
      habitId: "habit-red-001",
      nowUtc: "2026-03-11T10:00:00.000Z",
    });

    expect(result?.lastCheckinLogDate).toBeNull();
    expect(result?.error?.status).toBe(500);
    expect(result?.error?.code).toBe("INTERNAL_ERROR");
    expect(page.ui.cancelCheckin.isSubmitting).toBe(false);
  });
});
