import { describe, expect, it, vi } from "vitest";

import { NAVIGATION_FLOW } from "../../../src/app/navigation-flow";
import { ROUTE_MAP } from "../../../src/app/route-map";
import { SCR002HomePage } from "../../../src/screens/SCR-002HomePage";
import {
  requestCancelCheckinRuntime,
  requestHomeHabitsRuntime,
  requestRegisterCheckinRuntime,
} from "../../../src/main";
import {
  SCR002_HOME_EMPTY_STATE_EXPECTATION,
  SCR002_HOME_ERROR_STATE_EXPECTATION,
  SCR002_HOME_RUNTIME_ENDPOINTS,
  SCR002_TRACEABILITY_IDS,
  SCR002_UI_REQUIREMENT_TRACE_CASES,
  T054_C003_COMPLETION_GATE_COMMANDS,
} from "../../helpers/ui/common-ui-fixtures";

describe("T-054 C-003 SCR-002 home runtime red tests", () => {
  it("TC-IT-FR-011-001/012-002/013-003/014-001/015-001/TC-ST-FR-016-003 の要求トレースを固定する", () => {
    expect(SCR002_TRACEABILITY_IDS).toEqual([
      "FR-011",
      "FR-012",
      "FR-013",
      "FR-014",
      "FR-015",
      "FR-016",
      "AC-011",
      "AC-012",
      "AC-013",
      "AC-014",
      "AC-015",
      "AC-016",
      "SCR-002",
    ]);
    expect(SCR002_UI_REQUIREMENT_TRACE_CASES.map((testCase) => testCase.testCaseId)).toEqual([
      "TC-IT-FR-011-001",
      "TC-IT-FR-012-002",
      "TC-IT-FR-013-003",
      "TC-IT-FR-014-001",
      "TC-IT-FR-015-001",
      "TC-ST-FR-016-003",
    ]);
    expect(SCR002_UI_REQUIREMENT_TRACE_CASES.map((testCase) => testCase.acceptanceId)).toEqual([
      "AC-011",
      "AC-012",
      "AC-013",
      "AC-014",
      "AC-015",
      "AC-016",
    ]);
    expect(SCR002_UI_REQUIREMENT_TRACE_CASES.every((testCase) => testCase.traceId.startsWith("T-054/C-004/"))).toBe(
      true,
    );
  });

  it("初期表示で GET /api/home/habits を実行し、ロード後に一覧データを返す", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        habits: [
          {
            habit_id: "habit-red-001",
            name: "朝の散歩",
            status: "active",
            streak_days: 3,
            last_checkin_log_date: null,
          },
        ],
      }),
    } as Response);

    const result = await requestHomeHabitsRuntime(fetchMock, { userId: "user-red-001" });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/home/habits?userId=user-red-001",
      expect.objectContaining({ method: "GET" }),
    );
    expect(result).toEqual({
      kind: "success",
      habits: [
        {
          habitId: "habit-red-001",
          name: "朝の散歩",
          status: "active",
          streakDays: 3,
          lastCheckinLogDate: null,
        },
      ],
    });
  });

  it("GET /api/home/habits が items/streak/log_date 形式でも一覧データへ変換できる", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: [
          {
            habit_id: 1001,
            name: "夜の読書",
            status: "active",
            streak: 7,
            log_date: "2026-03-04",
          },
        ],
      }),
    } as Response);

    const result = await requestHomeHabitsRuntime(fetchMock, { userId: "user-red-001" });

    expect(result).toEqual({
      kind: "success",
      habits: [
        {
          habitId: "1001",
          name: "夜の読書",
          status: "active",
          streakDays: 7,
          lastCheckinLogDate: "2026-03-04",
        },
      ],
    });
  });

  it("0件時は空状態CTA(/habits/new)を表示する導線を要求する", () => {
    expect(ROUTE_MAP["SCR-002"]).toBe("/home");
    expect(SCR002_HOME_EMPTY_STATE_EXPECTATION.ctaPath).toBe(ROUTE_MAP["SCR-003"]);
    expect(NAVIGATION_FLOW["SCR-002"]).toContain("SCR-003");
  });

  it("チェックイン押下で POST /api/checkins を呼び、失敗時は楽観更新を復元する", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          checkin: {
            idempotent: false,
            log_date: "2026-03-04",
          },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          code: "INTERNAL_ERROR",
          trace_id: "trace-register-500",
        }),
      } as Response);

    const success = await requestRegisterCheckinRuntime(fetchMock, {
      userId: "user-red-001",
      habitId: "habit-red-001",
      logDate: "2026-03-04",
      nowUtc: "2026-03-04T10:00:00.000Z",
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/checkins",
      expect.objectContaining({
        method: "POST",
        headers: { "content-type": "application/json" },
      }),
    );
    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1] && (fetchMock.mock.calls[0][1] as RequestInit).body));
    expect(body).toEqual({
      userId: "user-red-001",
      habit_id: "habit-red-001",
      log_date: "2026-03-04",
      now_utc: "2026-03-04T10:00:00.000Z",
    });
    expect(success).toEqual({
      kind: "success",
      idempotent: false,
      logDate: "2026-03-04",
    });

    const page = SCR002HomePage({
      screenId: "SCR-002",
      handlers: {
        onLoadHabits: async () => ({
          kind: "success",
          habits: [
            {
              habitId: "habit-red-001",
              name: "朝の散歩",
              status: "active",
              streakDays: 3,
              lastCheckinLogDate: null,
            },
          ],
        }),
        onRegisterCheckin: async ({ habitId, logDate }) =>
          requestRegisterCheckinRuntime(fetchMock, {
            userId: "user-red-001",
            habitId,
            logDate,
            nowUtc: "2026-03-04T10:00:00.000Z",
          }),
      },
    });
    await page.actions.loadHabits();
    const failurePromise = page.actions.registerTodayCheckin({
      habitId: "habit-red-001",
      logDate: "2026-03-04",
    });
    expect(page.ui.habits.items[0]?.lastCheckinLogDate).toBe("2026-03-04");

    const failure = await failurePromise;
    expect(failure.error?.status).toBe(500);
    expect(page.ui.habits.items[0]?.lastCheckinLogDate).toBeNull();
  });

  it("取消押下で DELETE /api/checkins/{habitId} を呼び、実行中はボタン状態が無効化される", async () => {
    let release: (() => void) | undefined;
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async () => {
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      return {
        ok: true,
        status: 200,
        json: async () => ({
          checkin: {
            canceled: true,
            log_date: "2026-03-04",
          },
        }),
      } as Response;
    });

    const page = SCR002HomePage({
      screenId: "SCR-002",
      handlers: {
        onCancelCheckin: async ({ habitId, nowUtc }) =>
          requestCancelCheckinRuntime(fetchMock, {
            userId: "user-red-001",
            habitId,
            nowUtc,
          }),
      },
    });

    const first = page.actions.cancelTodayCheckin({
      habitId: "habit-red-001",
      nowUtc: "2026-03-04T10:00:00.000Z",
    });
    expect(page.ui.cancelCheckin.isSubmitting).toBe(true);
    const second = await page.actions.cancelTodayCheckin({
      habitId: "habit-red-001",
      nowUtc: "2026-03-04T10:00:00.000Z",
    });
    expect(second).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/checkins/habit-red-001",
      expect.objectContaining({ method: "DELETE" }),
    );

    if (!release) {
      throw new Error("release was not assigned");
    }
    release();
    await first;
    expect(page.ui.cancelCheckin.isSubmitting).toBe(false);
  });

  it("500/通信エラー時はリトライ導線を表示する契約を満たす", async () => {
    const httpErrorFetch = vi.fn<typeof fetch>().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        code: "INTERNAL_ERROR",
        trace_id: "trace-home-500",
      }),
    } as Response);
    const networkErrorFetch = vi.fn<typeof fetch>().mockRejectedValue(new Error("network down"));

    const httpError = await requestHomeHabitsRuntime(httpErrorFetch, { userId: "user-red-001" });
    const networkError = await requestHomeHabitsRuntime(networkErrorFetch, { userId: "user-red-001" });

    expect(httpError).toEqual({
      kind: "error",
      status: 500,
      code: "INTERNAL_ERROR",
      traceId: "trace-home-500",
    });
    expect(networkError).toEqual({
      kind: "error",
      status: 500,
      code: "INTERNAL_ERROR",
    });
    expect(SCR002_HOME_ERROR_STATE_EXPECTATION.retryLabel).toBe("再試行");
  });

  it("409 archived競合時は SCR-004 再開導線を返す", () => {
    const page = SCR002HomePage({ screenId: "SCR-002" });
    const result = page.actions.resolveCheckinResult({
      kind: "error",
      status: 409,
      code: "DOMAIN_CONFLICT",
      domainConflictReason: "CHECKIN_CANCEL_NOT_ALLOWED",
    });

    expect(result.lastCheckinLogDate).toBeNull();
    expect(result.error?.status).toBe(409);
    expect(result.error?.code).toBe("DOMAIN_CONFLICT");
    expect(result.error?.recoveryAction).toEqual({
      label: "再開してチェックインする",
      targetScreenId: "SCR-004",
    });
  });

  it("完了ゲート: C-003 の runtime 検証コマンドを固定する", () => {
    expect(SCR002_HOME_RUNTIME_ENDPOINTS).toEqual([
      "/api/home/habits",
      "/api/checkins",
      "/api/checkins/{habitId}",
    ]);
    expect(T054_C003_COMPLETION_GATE_COMMANDS).toEqual([
      "npm run test -- tests/integration/ui/scr-002-home-runtime-red.spec.ts",
      "npm run test -- tests/integration/api/if-002-checkins-register-red.spec.ts tests/integration/api/if-002-checkins-cancel-red.spec.ts",
    ]);
  });
});
