import { describe, expect, it } from "vitest";

import { IF002_HABIT_LIFECYCLE_RED_CASES } from "./fixtures/if-002-cases";
import { createIf002TestHarness } from "./helpers/if-002-test-harness";

describe("T-040 PR-004 IF-002 habits archive/resume status green tests", () => {
  it("AC-008/AC-009: archive/resume 観点をケースに含む", () => {
    const archiveCase = IF002_HABIT_LIFECYCLE_RED_CASES.find((testCase) => testCase.acceptanceId === "AC-008");
    const resumeCase = IF002_HABIT_LIFECYCLE_RED_CASES.find((testCase) => testCase.acceptanceId === "AC-009");

    expect(archiveCase?.endpoint).toContain("archive");
    expect(resumeCase?.endpoint).toContain("resume");
  });

  it("AC-008/FR-008: archive API 後に status は archived へ遷移する", async () => {
    const harness = createIf002TestHarness();
    const archiveCase = IF002_HABIT_LIFECYCLE_RED_CASES.find((testCase) => testCase.acceptanceId === "AC-008");

    expect(archiveCase).toBeDefined();

    const result = await harness.runHabitLifecycleCase(archiveCase!);

    expect(result.status).toBe(200);
    harness.assertHabitStatus(result.body, "archived");
  });

  it("AC-009/FR-009: resume API 後に status は active へ遷移する", async () => {
    const harness = createIf002TestHarness();
    const resumeCase = IF002_HABIT_LIFECYCLE_RED_CASES.find((testCase) => testCase.acceptanceId === "AC-009");

    expect(resumeCase).toBeDefined();

    const result = await harness.runHabitLifecycleCase(resumeCase!);

    expect(result.status).toBe(200);
    harness.assertHabitStatus(result.body, "active");
  });
});
