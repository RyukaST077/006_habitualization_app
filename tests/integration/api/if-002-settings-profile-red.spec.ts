import { describe, expect, it } from "vitest";

import { IF002_RED_CASES, IF002_SETTINGS_PROFILE_CASES } from "./fixtures/if-002-cases";
import { createIf002TestHarness } from "./helpers/if-002-test-harness";

describe("T-028 C-003 IF-002 settings profile green tests", () => {
  it("FR-019/AC-019: GET /api/settings/profile で現在設定を返す", async () => {
    const harness = createIf002TestHarness();
    const testCase = IF002_SETTINGS_PROFILE_CASES.find((entry) => entry.method === "GET");

    expect(testCase).toBeDefined();

    const result = await harness.runSettingsProfileCase(testCase!);

    expect(result.status).toBe(200);
    expect(result.body.requirement_id).toBe("FR-019");
    harness.assertSettingsProfile(result.body, {
      timezone: testCase!.expected.timezone,
      dayCutoffTime: testCase!.expected.dayCutoffTime,
      version: testCase!.expected.version,
    });
  });

  it("FR-020/AC-020: PATCH /api/settings/profile で saved/effective_from を返す", async () => {
    const harness = createIf002TestHarness();
    const testCase = IF002_SETTINGS_PROFILE_CASES.find((entry) => entry.method === "PATCH");

    expect(testCase).toBeDefined();

    const result = await harness.runSettingsProfileCase(testCase!);

    expect(result.status).toBe(200);
    expect(result.body.requirement_id).toBe("FR-020");
    harness.assertSettingsProfile(result.body, {
      timezone: testCase!.expected.timezone,
      dayCutoffTime: testCase!.expected.dayCutoffTime,
      version: testCase!.expected.version,
    });
    harness.assertSettingsSaveResult(result.body, { saved: true });
  });

  it("FR-021: 不正TZ/不正時刻は 400 VALIDATION_ERROR を返す", async () => {
    const harness = createIf002TestHarness();
    const settingsValidationCases = IF002_RED_CASES.filter(
      (testCase) => testCase.endpoint === "/api/settings/profile" && testCase.requirementId === "FR-021",
    );

    expect(settingsValidationCases.length).toBeGreaterThanOrEqual(2);

    for (const testCase of settingsValidationCases) {
      const result = await harness.runPlannedCase(testCase);
      harness.assertErrorMapping(result.status, result.body, {
        status: 400,
        code: "VALIDATION_ERROR",
        requirementId: "FR-021",
      });
    }
  });

  it("FR-025: settings/profile は self-only 制約を維持する", async () => {
    const harness = createIf002TestHarness();
    const result = await harness.runPlannedCase({
      traceId: "IF-002/AUTHZ/FR-025/settings/profile/get-other-user",
      endpoint: "/api/settings/profile",
      method: "GET",
      requirementId: "FR-025",
      expectedMessage: "access denied",
      request: {
        actorUserId: "user-red-001",
        targetUserId: "user-red-002",
        body: {},
      },
    });

    expect(result.status).toBe(403);
    harness.assertForbiddenError(result.body, "FR-025");
  });
});
