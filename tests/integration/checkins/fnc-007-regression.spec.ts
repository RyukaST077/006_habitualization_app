import { describe, expect, it } from "vitest";

import {
  FNC007_RED_CASES,
  FNC007_REQUIRED_PERSPECTIVES,
  type Fnc007CaseDefinition,
  type Fnc007Perspective,
} from "./fixtures/fnc-007-cases";
import { createIf002TestHarness } from "../api/helpers/if-002-test-harness";

const FNC007_REGRESSION_GATE_COMMAND = "npm run test -- tests/integration/checkins/fnc-007-regression.spec.ts";

function findCase(perspective: Fnc007Perspective): Fnc007CaseDefinition {
  const targetCase = FNC007_RED_CASES.find((entry) => entry.perspective === perspective);
  expect(targetCase).toBeDefined();
  return targetCase!;
}

describe("T-026 C-005 FNC-007 regression gate", () => {
  it("FR-014 正常: 当日チェックインの取消に成功する", async () => {
    const harness = createIf002TestHarness();
    const targetCase = findCase("CANCEL_TODAY_SUCCESS");

    await harness.runPlannedCase({
      traceId: `${targetCase.traceId}/register`,
      endpoint: "/api/checkins",
      method: "POST",
      requirementId: "FR-011",
      expectedMessage: "register for same-day cancellation",
      request: {
        actorUserId: "user-red-001",
        body: {
          habit_id: "habit-red-001",
          log_date: "2026-03-24",
          now_utc: "2026-03-24T12:00:00.000Z",
        },
      },
    });

    const result = await harness.runPlannedCase({
      traceId: `${targetCase.traceId}/execute`,
      endpoint: "/api/checkins/{habitId}",
      method: "DELETE",
      requirementId: targetCase.requirementId,
      expectedMessage: targetCase.title,
      request: {
        actorUserId: "user-red-001",
        body: {
          habit_id: "habit-red-001",
          now_utc: "2026-03-24T13:00:00.000Z",
        },
      },
    });

    expect(result.status).toBe(targetCase.expected.httpStatus);
    harness.assertCheckinCanceled(result.body, true);
    harness.assertCheckinLogDate(result.body, "2026-03-24");
  });

  it("FR-014 異常: 当日外取消は 409 DOMAIN_CONFLICT を返す", async () => {
    const harness = createIf002TestHarness();
    const targetCase = findCase("CANCEL_OUTSIDE_DAY_REJECT");

    await harness.runPlannedCase({
      traceId: `${targetCase.traceId}/register`,
      endpoint: "/api/checkins",
      method: "POST",
      requirementId: "FR-011",
      expectedMessage: "register for outside-day rejection",
      request: {
        actorUserId: "user-red-001",
        body: {
          habit_id: "habit-red-001",
          log_date: "2026-03-25",
          now_utc: "2026-03-25T12:00:00.000Z",
        },
      },
    });

    const result = await harness.runPlannedCase({
      traceId: `${targetCase.traceId}/execute`,
      endpoint: "/api/checkins/{habitId}",
      method: "DELETE",
      requirementId: targetCase.requirementId,
      expectedMessage: targetCase.title,
      request: {
        actorUserId: "user-red-001",
        body: {
          habit_id: "habit-red-001",
          now_utc: "2026-03-26T12:00:00.000Z",
        },
      },
    });

    harness.assertErrorMapping(result.status, result.body, {
      status: targetCase.expected.httpStatus,
      code: "DOMAIN_CONFLICT",
      requirementId: targetCase.requirementId,
    });
    expect(targetCase.expected.domainErrorCode).toBe("CHECKIN_CANCEL_NOT_ALLOWED");
  });

  it("FR-025 認可: 他ユーザー習慣の取消は 403 FORBIDDEN を返す", async () => {
    const harness = createIf002TestHarness();
    const targetCase = findCase("CROSS_USER_FORBIDDEN");

    const result = await harness.runPlannedCase({
      traceId: `${targetCase.traceId}/execute`,
      endpoint: "/api/checkins/{habitId}",
      method: "DELETE",
      requirementId: targetCase.requirementId,
      expectedMessage: targetCase.title,
      request: {
        actorUserId: "user-red-001",
        body: {
          habit_id: "habit-user-red-002",
          now_utc: "2026-03-25T12:00:00.000Z",
        },
      },
    });

    expect(result.status).toBe(targetCase.expected.httpStatus);
    harness.assertForbiddenError(result.body, targetCase.requirementId);
    expect(targetCase.expected.domainErrorCode).toBe("FORBIDDEN");
  });

  it("FR-014 の正常/異常/認可 3観点を固定し、回帰コマンドを固定する", () => {
    const perspectiveSet = new Set(FNC007_RED_CASES.map((entry) => entry.perspective));
    FNC007_REQUIRED_PERSPECTIVES.forEach((perspective) => {
      expect(perspectiveSet.has(perspective)).toBe(true);
    });
    expect(FNC007_RED_CASES).toHaveLength(3);
    expect(FNC007_REGRESSION_GATE_COMMAND).toBe("npm run test -- tests/integration/checkins/fnc-007-regression.spec.ts");
  });
});
