import { expect } from "vitest";

import type {
  Fnc008AcceptanceId,
  Fnc008CaseDefinition,
  Fnc008Perspective,
  Fnc008RequirementId,
  Fnc008TestCaseId,
} from "../fixtures/fnc-008-cases";

export interface Fnc008TestHarness {
  assertRequirementTrace(
    cases: readonly Fnc008CaseDefinition[],
    requiredRequirementIds: readonly Fnc008RequirementId[],
    requiredAcceptanceIds: readonly Fnc008AcceptanceId[],
    requiredCaseIds: readonly Fnc008TestCaseId[],
  ): void;
  assertPerspectiveCoverage(
    cases: readonly Fnc008CaseDefinition[],
    requiredPerspectives: readonly Fnc008Perspective[],
  ): void;
  assertRedPlanningCase(testCase: Fnc008CaseDefinition): void;
}

export function createFnc008TestHarness(): Fnc008TestHarness {
  return {
    assertRequirementTrace(
      cases: readonly Fnc008CaseDefinition[],
      requiredRequirementIds: readonly Fnc008RequirementId[],
      requiredAcceptanceIds: readonly Fnc008AcceptanceId[],
      requiredCaseIds: readonly Fnc008TestCaseId[],
    ): void {
      const requirementSet = new Set(cases.map((entry) => entry.requirementId));
      const acceptanceSet = new Set(cases.map((entry) => entry.acceptanceId));
      const caseIdSet = new Set(cases.map((entry) => entry.testCaseId));

      requiredRequirementIds.forEach((requirementId) => {
        expect(requirementSet.has(requirementId)).toBe(true);
      });
      requiredAcceptanceIds.forEach((acceptanceId) => {
        expect(acceptanceSet.has(acceptanceId)).toBe(true);
      });
      requiredCaseIds.forEach((testCaseId) => {
        expect(caseIdSet.has(testCaseId)).toBe(true);
      });
    },
    assertPerspectiveCoverage(
      cases: readonly Fnc008CaseDefinition[],
      requiredPerspectives: readonly Fnc008Perspective[],
    ): void {
      const perspectiveSet = new Set(cases.map((entry) => entry.perspective));
      requiredPerspectives.forEach((perspective) => {
        expect(perspectiveSet.has(perspective)).toBe(true);
      });

      const streakVisibleCase = cases.find((entry) => entry.perspective === "CURRENT_STREAK_ON_HOME");
      expect(streakVisibleCase?.expected.httpStatus).toBe(200);
      expect(streakVisibleCase?.expected.invariant).toBe("streak-current-days-visible");

      const streakRuleCase = cases.find((entry) => entry.perspective === "STREAK_GRACE_AND_RESET_RULE");
      expect(streakRuleCase?.expected.httpStatus).toBe(200);
      expect(streakRuleCase?.expected.invariant).toBe("grace-1day-maintain-and-2day-reset");

      const calendarCase = cases.find((entry) => entry.perspective === "CALENDAR_HISTORY_MONTHLY_VIEW");
      expect(calendarCase?.expected.httpStatus).toBe(200);
      expect(calendarCase?.expected.surface).toBe("history-calendar");
      expect(calendarCase?.expected.invariant).toBe("monthly-cells-with-include-archived-toggle");

      const analyticsCase = cases.find((entry) => entry.perspective === "ANALYTICS_SUMMARY_RANGE");
      expect(analyticsCase?.expected.httpStatus).toBe(200);
      expect(analyticsCase?.expected.surface).toBe("analytics-user-summary");
      expect(analyticsCase?.expected.invariant).toBe("range-days-7-30-90-summary");
    },
    assertRedPlanningCase(testCase: Fnc008CaseDefinition): void {
      expect(testCase.traceId).toContain("T-027");
      expect(testCase.traceId).toContain("C-001");
      expect(testCase.traceId).toContain(testCase.testCaseId);
      expect(testCase.traceId).toContain(testCase.requirementId);
      expect(testCase.traceId).toContain(testCase.acceptanceId);
      expect(testCase.title.length).toBeGreaterThan(0);
      expect(testCase.notes.length).toBeGreaterThan(0);
    },
  };
}
