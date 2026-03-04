import { describe, expect, it } from "vitest";

import { SCR002HomePage } from "../../../src/screens/SCR-002HomePage";
import {
  SCR002_HOME_ARCHIVED_CONFLICT_RECOVERY_EXPECTATION,
  SCR002_HOME_CANCEL_SINGLE_FLIGHT_EXPECTATION,
  SCR002_HOME_CHECKIN_OPTIMISTIC_EXPECTATION,
  SCR002_HOME_LOAD_STATE_TRANSITIONS,
  SCR002_TRACEABILITY_IDS,
  SCR002_UI_REQUIREMENT_TRACE_CASES,
  T054_C004_COMPLETION_GATE_COMMANDS,
  T054_C004_MINIMUM_REGRESSION_SET,
} from "../../helpers/ui/common-ui-fixtures";

describe("T-054 C-004 SCR-002 home page model", () => {
  it("TC-IT-FR-011-001/012-002/013-003/014-001/015-001/TC-ST-FR-016-003 の最終トレースを固定する", () => {
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

  it("一覧ロード前後の状態を loading -> loaded/error で遷移させる", async () => {
    const transitions = SCR002_HOME_LOAD_STATE_TRANSITIONS[0];
    const successPage = SCR002HomePage({
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
      },
    });
    expect(successPage.ui.habits.status).toBe(transitions.before);
    await successPage.actions.loadHabits();
    expect(successPage.ui.habits.status).toBe(transitions.success);
    expect(successPage.ui.habits.items).toHaveLength(1);
    expect(successPage.ui.habits.error).toBeNull();

    const errorPage = SCR002HomePage({
      screenId: "SCR-002",
      handlers: {
        onLoadHabits: async () => ({
          kind: "error",
          status: 500,
          code: "INTERNAL_ERROR",
        }),
      },
    });
    expect(errorPage.ui.habits.status).toBe(transitions.before);
    await errorPage.actions.loadHabits();
    expect(errorPage.ui.habits.status).toBe(transitions.failure);
    expect(errorPage.ui.habits.error?.status).toBe(500);
    expect(errorPage.ui.habits.error?.code).toBe("INTERNAL_ERROR");
  });

  it("チェックイン成功時に即時更新し、失敗時はロールバックする", async () => {
    let resolveSuccess: (() => void) | undefined;
    const successPage = SCR002HomePage({
      screenId: "SCR-002",
      handlers: {
        onLoadHabits: async () => ({
          kind: "success",
          habits: [
            {
              habitId: SCR002_HOME_CHECKIN_OPTIMISTIC_EXPECTATION.habitId,
              name: "筋トレ",
              status: "active",
              streakDays: 5,
              lastCheckinLogDate: SCR002_HOME_CHECKIN_OPTIMISTIC_EXPECTATION.previousLogDate,
            },
          ],
        }),
        onRegisterCheckin: async () => {
          await new Promise<void>((resolve) => {
            resolveSuccess = resolve;
          });
          return {
            kind: "success" as const,
            logDate: SCR002_HOME_CHECKIN_OPTIMISTIC_EXPECTATION.optimisticLogDate,
            idempotent: false as const,
          };
        },
      },
    });
    await successPage.actions.loadHabits();

    const successPromise = successPage.actions.registerTodayCheckin({
      habitId: SCR002_HOME_CHECKIN_OPTIMISTIC_EXPECTATION.habitId,
      logDate: SCR002_HOME_CHECKIN_OPTIMISTIC_EXPECTATION.optimisticLogDate,
    });

    expect(
      successPage.ui.habits.items.find((habit) => habit.habitId === SCR002_HOME_CHECKIN_OPTIMISTIC_EXPECTATION.habitId)
        ?.lastCheckinLogDate,
    ).toBe(SCR002_HOME_CHECKIN_OPTIMISTIC_EXPECTATION.optimisticLogDate);
    expect(successPage.ui.checkin.isSubmitting(SCR002_HOME_CHECKIN_OPTIMISTIC_EXPECTATION.habitId)).toBe(true);

    if (!resolveSuccess) {
      throw new Error("resolveSuccess was not assigned");
    }
    resolveSuccess();
    const success = await successPromise;
    expect(success).toEqual({
      lastCheckinLogDate: SCR002_HOME_CHECKIN_OPTIMISTIC_EXPECTATION.optimisticLogDate,
      error: null,
    });
    expect(successPage.ui.checkin.isSubmitting(SCR002_HOME_CHECKIN_OPTIMISTIC_EXPECTATION.habitId)).toBe(false);

    const rollbackPage = SCR002HomePage({
      screenId: "SCR-002",
      handlers: {
        onLoadHabits: async () => ({
          kind: "success",
          habits: [
            {
              habitId: SCR002_HOME_CHECKIN_OPTIMISTIC_EXPECTATION.habitId,
              name: "筋トレ",
              status: "active",
              streakDays: 5,
              lastCheckinLogDate: SCR002_HOME_CHECKIN_OPTIMISTIC_EXPECTATION.previousLogDate,
            },
          ],
        }),
        onRegisterCheckin: async () => ({
          kind: "error" as const,
          status: 500 as const,
          code: "INTERNAL_ERROR" as const,
        }),
      },
    });
    await rollbackPage.actions.loadHabits();
    const rollback = await rollbackPage.actions.registerTodayCheckin({
      habitId: SCR002_HOME_CHECKIN_OPTIMISTIC_EXPECTATION.habitId,
      logDate: SCR002_HOME_CHECKIN_OPTIMISTIC_EXPECTATION.optimisticLogDate,
    });
    expect(rollback.lastCheckinLogDate).toBe(SCR002_HOME_CHECKIN_OPTIMISTIC_EXPECTATION.rollbackLogDate);
    expect(rollback.error?.status).toBe(500);
    expect(
      rollbackPage.ui.habits.items.find((habit) => habit.habitId === SCR002_HOME_CHECKIN_OPTIMISTIC_EXPECTATION.habitId)
        ?.lastCheckinLogDate,
    ).toBe(SCR002_HOME_CHECKIN_OPTIMISTIC_EXPECTATION.rollbackLogDate);
  });

  it("TC-IT-FR-014-001: 取消実行中は二重送信を抑止する", async () => {
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
      nowUtc: "2026-03-04T10:00:00.000Z",
    });
    const second = await page.actions.cancelTodayCheckin({
      habitId: "habit-red-001",
      nowUtc: "2026-03-04T10:00:00.000Z",
    });

    expect(page.ui.cancelCheckin.isSubmitting).toBe(SCR002_HOME_CANCEL_SINGLE_FLIGHT_EXPECTATION.pendingSubmitting);
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
    expect(page.ui.cancelCheckin.isSubmitting).toBe(SCR002_HOME_CANCEL_SINGLE_FLIGHT_EXPECTATION.settledSubmitting);
  });

  it("取消成功後は対象習慣を未達成へ戻し、取消ボタンを非活性化できる", async () => {
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
              lastCheckinLogDate: "2026-03-04",
            },
          ],
        }),
        onCancelCheckin: async () => ({
          kind: "success",
          logDate: "2026-03-04",
          idempotent: false,
        }),
      },
    });

    await page.actions.loadHabits();
    expect(page.ui.habits.items[0]?.lastCheckinLogDate).toBe("2026-03-04");

    const result = await page.actions.cancelTodayCheckin({
      habitId: "habit-red-001",
      nowUtc: "2026-03-04T10:00:00.000Z",
    });

    expect(result).toEqual({
      lastCheckinLogDate: null,
      error: null,
    });
    expect(page.ui.habits.items[0]?.lastCheckinLogDate).toBeNull();
  });

  it("archived 競合(409)時は SCR-004 再開導線を返す", () => {
    const page = SCR002HomePage({ screenId: "SCR-002" });
    const result = page.actions.resolveCheckinResult({
      kind: "error",
      status: SCR002_HOME_ARCHIVED_CONFLICT_RECOVERY_EXPECTATION.status,
      code: SCR002_HOME_ARCHIVED_CONFLICT_RECOVERY_EXPECTATION.code,
    });
    expect(result.error?.recoveryAction).toEqual({
      label: SCR002_HOME_ARCHIVED_CONFLICT_RECOVERY_EXPECTATION.actionLabel,
      targetScreenId: SCR002_HOME_ARCHIVED_CONFLICT_RECOVERY_EXPECTATION.targetScreenId,
    });
  });

  it("完了ゲート: SCR-002 unit/runtime と T-032/T-058 前提の最小回帰セットを固定する", () => {
    expect(T054_C004_MINIMUM_REGRESSION_SET).toEqual([
      "tests/unit/screens/scr-002-home-page-red.spec.ts",
      "tests/integration/ui/scr-002-home-runtime-red.spec.ts",
      "tests/integration/api/if-002-checkins-register-red.spec.ts",
      "tests/integration/api/if-002-checkins-cancel-red.spec.ts",
    ]);
    expect(T054_C004_COMPLETION_GATE_COMMANDS).toEqual([
      "npm run test -- tests/unit/screens/scr-002-home-page-red.spec.ts tests/integration/ui/scr-002-home-runtime-red.spec.ts",
      "npm run test -- tests/unit/screens/scr-002-home-page-red.spec.ts tests/integration/ui/scr-002-home-runtime-red.spec.ts tests/integration/api/if-002-checkins-register-red.spec.ts tests/integration/api/if-002-checkins-cancel-red.spec.ts && npm run typecheck",
    ]);
  });
});
