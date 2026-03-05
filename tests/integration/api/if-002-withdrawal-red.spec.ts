import { describe, expect, it } from "vitest";

import { IF002_RED_CASES, IF002_WITHDRAWAL_CASES } from "./fixtures/if-002-cases";
import { createIf002TestHarness } from "./helpers/if-002-test-harness";

describe("T-029 C-004 IF-002 withdrawal API tests", () => {
  it("FR-023/AC-023: POST /api/settings/withdrawal は 202 で queued ジョブを返す", async () => {
    const harness = createIf002TestHarness();
    const testCase = IF002_WITHDRAWAL_CASES.find((entry) => entry.requirementId === "FR-023" && entry.expectedStatus === 202);

    expect(testCase).toBeDefined();
    const result = await harness.runWithdrawalCase(testCase!);

    expect(result.status).toBe(202);
    expect(result.body.code).toBe("SUCCESS");
    expect(result.body.requirement_id).toBe("FR-023");
    harness.assertWithdrawalQueued(result.body);
  });

  it("FR-025: self-only 違反は 403 FORBIDDEN を返す", async () => {
    const harness = createIf002TestHarness();
    const forbiddenCase = IF002_RED_CASES.find(
      (entry) =>
        entry.endpoint === "/api/settings/withdrawal"
        && entry.expectedStatus === 403
        && entry.expectedCode === "FORBIDDEN",
    );

    expect(forbiddenCase).toBeDefined();
    const result = await harness.runPlannedCase(forbiddenCase!);

    harness.assertErrorMapping(result.status, result.body, {
      status: 403,
      code: "FORBIDDEN",
      requirementId: "FR-025",
    });
  });

  it("FR-023: 重複退会要求は 409 DOMAIN_CONFLICT を返す", async () => {
    const harness = createIf002TestHarness();
    const duplicateCase = IF002_WITHDRAWAL_CASES.find((entry) => entry.expectedStatus === 409);

    expect(duplicateCase).toBeDefined();
    const result = await harness.runWithdrawalCase(duplicateCase!);

    harness.assertErrorMapping(result.status, result.body, {
      status: 409,
      code: "DOMAIN_CONFLICT",
      requirementId: "FR-023",
    });
  });

  it("FR-025: 想定外失敗は 500 INTERNAL_ERROR + trace_id を返す", async () => {
    const harness = createIf002TestHarness();
    const internalCase = IF002_RED_CASES.find(
      (entry) =>
        entry.endpoint === "/api/settings/withdrawal"
        && entry.expectedStatus === 500
        && entry.expectedCode === "INTERNAL_ERROR",
    );

    expect(internalCase).toBeDefined();
    const result = await harness.runPlannedCase(internalCase!);

    harness.assertErrorMapping(result.status, result.body, {
      status: 500,
      code: "INTERNAL_ERROR",
      requirementId: "FR-025",
    });
    expect(result.body.trace_id).toContain("trace-");
  });
});
