import { describe, expect, it } from "vitest";

import { IF002_HABIT_LIFECYCLE_RED_CASES } from "./fixtures/if-002-cases";
import { createIf002TestHarness } from "./helpers/if-002-test-harness";

function requireLifecycleCase(acceptanceId: "AC-008" | "AC-009") {
  const testCase = IF002_HABIT_LIFECYCLE_RED_CASES.find((candidate) => candidate.acceptanceId === acceptanceId);
  expect(testCase).toBeDefined();
  return testCase!;
}

describe("T-040 PR-004 IF-002 habits archive/resume status green tests", () => {
  it("AC-008/AC-009: archive/resume 観点をケースに含む", () => {
    const archiveCase = IF002_HABIT_LIFECYCLE_RED_CASES.find((testCase) => testCase.acceptanceId === "AC-008");
    const resumeCase = IF002_HABIT_LIFECYCLE_RED_CASES.find((testCase) => testCase.acceptanceId === "AC-009");

    expect(archiveCase?.endpoint).toContain("archive");
    expect(resumeCase?.endpoint).toContain("resume");
  });

  it.each([
    { acceptanceId: "AC-008" as const, expectedStatus: "archived" as const, expectedRequirementId: "FR-008" },
    { acceptanceId: "AC-009" as const, expectedStatus: "active" as const, expectedRequirementId: "FR-009" },
  ])(
    "$acceptanceId: status 遷移と IF-002 契約（200/SUCCESS）を維持する",
    async ({ acceptanceId, expectedStatus, expectedRequirementId }) => {
      const harness = createIf002TestHarness();
      const transitionCase = requireLifecycleCase(acceptanceId);

      const result = await harness.runHabitLifecycleCase(transitionCase);

      expect(result.status).toBe(200);
      expect(result.body.code).toBe("SUCCESS");
      expect(result.body.requirement_id).toBe(expectedRequirementId);
      harness.assertHabitStatus(result.body, expectedStatus);
    },
  );

});
