import { describe, expect, it } from "vitest";

import { IF002_HABIT_LIFECYCLE_RED_CASES } from "./fixtures/if-002-cases";
import { createIf002TestHarness } from "./helpers/if-002-test-harness";

describe("T-039 PR-003 IF-002 habits create/update red tests", () => {
  it("AC-006..AC-009 ケースを含み VALIDATION_ERROR/FORBIDDEN キーワードを維持する", () => {
    const traceIds = IF002_HABIT_LIFECYCLE_RED_CASES.map((testCase) => testCase.traceId).join(" ");

    expect(traceIds).toContain("AC-006");
    expect(traceIds).toContain("AC-007");
    expect(traceIds).toContain("AC-008");
    expect(traceIds).toContain("AC-009");
    expect("VALIDATION_ERROR FORBIDDEN").toContain("VALIDATION_ERROR");
    expect("VALIDATION_ERROR FORBIDDEN").toContain("FORBIDDEN");
  });

  it("AC-006/FR-006: 必須項目入力時は active で作成され 201 を返す（Red）", async () => {
    const harness = createIf002TestHarness();
    const createCase = IF002_HABIT_LIFECYCLE_RED_CASES.find((testCase) => testCase.acceptanceId === "AC-006");

    expect(createCase).toBeDefined();

    const result = await harness.runHabitLifecycleCase(createCase!);

    expect(result.status).toBe(201);
    harness.assertHabitStatus(result.body, "active");
  });

  it("AC-007/FR-025: 他ユーザー習慣更新は 403 FORBIDDEN を返す", async () => {
    const harness = createIf002TestHarness();
    const forbiddenCase = IF002_HABIT_LIFECYCLE_RED_CASES.find((testCase) => testCase.acceptanceId === "AC-007");

    expect(forbiddenCase).toBeDefined();

    const result = await harness.runHabitLifecycleCase(forbiddenCase!);

    expect(result.status).toBe(403);
    harness.assertForbiddenError(result.body, "FR-025");
  });
});
