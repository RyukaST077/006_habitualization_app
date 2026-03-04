import { expect } from "vitest";

import type {
  Fnc007AcceptanceId,
  Fnc007CaseDefinition,
  Fnc007Perspective,
  Fnc007RequirementId,
  Fnc007TestCaseId,
} from "../fixtures/fnc-007-cases";

export interface Fnc007TestHarness {
  assertRequirementTrace(
    cases: readonly Fnc007CaseDefinition[],
    requiredRequirementIds: readonly Fnc007RequirementId[],
    requiredAcceptanceIds: readonly Fnc007AcceptanceId[],
    requiredCaseIds: readonly Fnc007TestCaseId[],
  ): void;
  assertPerspectiveCoverage(
    cases: readonly Fnc007CaseDefinition[],
    requiredPerspectives: readonly Fnc007Perspective[],
  ): void;
  assertRedPlanningCase(testCase: Fnc007CaseDefinition): void;
}

export function createFnc007TestHarness(): Fnc007TestHarness {
  return {
    assertRequirementTrace(
      cases: readonly Fnc007CaseDefinition[],
      requiredRequirementIds: readonly Fnc007RequirementId[],
      requiredAcceptanceIds: readonly Fnc007AcceptanceId[],
      requiredCaseIds: readonly Fnc007TestCaseId[],
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
      cases: readonly Fnc007CaseDefinition[],
      requiredPerspectives: readonly Fnc007Perspective[],
    ): void {
      const perspectiveSet = new Set(cases.map((entry) => entry.perspective));
      requiredPerspectives.forEach((perspective) => {
        expect(perspectiveSet.has(perspective)).toBe(true);
      });

      const successCase = cases.find((entry) => entry.perspective === "CANCEL_TODAY_SUCCESS");
      expect(successCase?.expected.httpStatus).toBe(200);
      expect(successCase?.expected.dbDelta).toBe(-1);

      const outsideDayCase = cases.find((entry) => entry.perspective === "CANCEL_OUTSIDE_DAY_REJECT");
      expect(outsideDayCase?.expected.httpStatus).toBe(409);
      expect(outsideDayCase?.expected.domainErrorCode).toBe("CHECKIN_CANCEL_NOT_ALLOWED");
      expect(outsideDayCase?.expected.dbDelta).toBe(0);

      const forbiddenCase = cases.find((entry) => entry.perspective === "CROSS_USER_FORBIDDEN");
      expect(forbiddenCase?.expected.httpStatus).toBe(403);
      expect(forbiddenCase?.expected.domainErrorCode).toBe("FORBIDDEN");
      expect(forbiddenCase?.expected.dbDelta).toBe(0);
    },
    assertRedPlanningCase(testCase: Fnc007CaseDefinition): void {
      expect(testCase.traceId).toContain("T-026");
      expect(testCase.traceId).toContain("C-001");
      expect(testCase.traceId).toContain(testCase.testCaseId);
      expect(testCase.traceId).toContain(testCase.requirementId);
      expect(testCase.traceId).toContain(testCase.acceptanceId);
      expect(testCase.title.length).toBeGreaterThan(0);
      expect(testCase.notes.length).toBeGreaterThan(0);
    },
  };
}
