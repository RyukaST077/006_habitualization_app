import { expect, test } from "@playwright/test";

import { SCR002HomePage } from "../../../src/screens/SCR-002HomePage";
import { FNC007_RED_CASES, type Fnc007Perspective } from "../../integration/checkins/fixtures/fnc-007-cases";

function getFnc007Case(perspective: Fnc007Perspective) {
  const targetCase = FNC007_RED_CASES.find((candidate) => candidate.perspective === perspective);
  if (!targetCase) {
    throw new Error(`FNC007 case not found for perspective: ${perspective}`);
  }
  return targetCase;
}

test.describe("TC-AUTO-E2E-CHECKINS-002 チェックイン取消導線", () => {
  test("FR-014: 当日チェックイン取消成功で未達成へ再描画する", async () => {
    const targetCase = getFnc007Case("CANCEL_TODAY_SUCCESS");
    const homeScreen = SCR002HomePage({
      screenId: "SCR-002",
      handlers: {
        onCancelCheckin: async () => ({
          kind: "success",
          logDate: null,
          idempotent: false,
        }),
      },
    });

    const result = await homeScreen.actions.cancelTodayCheckin({
      habitId: "habit-e2e-001",
      nowUtc: "2026-03-12T09:00:00.000Z",
    });

    expect(targetCase.expected.httpStatus).toBe(200);
    expect(result).toEqual({
      lastCheckinLogDate: null,
      error: null,
    });
    expect(homeScreen.ui.cancelCheckin.isSubmitting).toBe(false);
  });

  test("FR-014: 当日外取消は 409 CHECKIN_CANCEL_NOT_ALLOWED を表示する", async () => {
    const targetCase = getFnc007Case("CANCEL_OUTSIDE_DAY_REJECT");
    const homeScreen = SCR002HomePage({
      screenId: "SCR-002",
      handlers: {
        onCancelCheckin: async () => ({
          kind: "error",
          status: 409,
          code: "DOMAIN_CONFLICT",
          domainConflictReason: "CHECKIN_CANCEL_NOT_ALLOWED",
          traceId: targetCase.traceId,
        }),
      },
    });

    const result = await homeScreen.actions.cancelTodayCheckin({
      habitId: "habit-e2e-001",
      nowUtc: "2026-03-13T09:00:00.000Z",
    });

    expect(targetCase.expected.httpStatus).toBe(409);
    expect(targetCase.expected.domainErrorCode).toBe("CHECKIN_CANCEL_NOT_ALLOWED");
    expect(result?.error?.status).toBe(409);
    expect(result?.error?.code).toBe("DOMAIN_CONFLICT");
    expect(result?.error?.message).toBe("当日分以外のチェックインは取り消せません");
  });

  test("FR-025: 他ユーザー習慣の取消は 403 FORBIDDEN で拒否する", async () => {
    const targetCase = getFnc007Case("CROSS_USER_FORBIDDEN");
    const homeScreen = SCR002HomePage({
      screenId: "SCR-002",
      handlers: {
        onCancelCheckin: async () => ({
          kind: "error",
          status: 403,
          code: "FORBIDDEN",
          traceId: targetCase.traceId,
        }),
      },
    });

    const result = await homeScreen.actions.cancelTodayCheckin({
      habitId: "habit-other-user-001",
      nowUtc: "2026-03-12T09:00:00.000Z",
    });

    expect(targetCase.expected.httpStatus).toBe(403);
    expect(targetCase.expected.domainErrorCode).toBe("FORBIDDEN");
    expect(result?.error?.status).toBe(403);
    expect(result?.error?.code).toBe("FORBIDDEN");
    expect(result?.error?.recoveryAction).toBeNull();
  });
});
