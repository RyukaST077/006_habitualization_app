import { expect } from "vitest";

import type {
  Fnc006AcceptanceId,
  Fnc006CaseDefinition,
  Fnc006Perspective,
  Fnc006RequirementId,
  Fnc006TestCaseId,
} from "../fixtures/fnc-006-cases";

export interface Fnc006TestHarness {
  assertRequirementTrace(
    cases: readonly Fnc006CaseDefinition[],
    requiredRequirementIds: readonly Fnc006RequirementId[],
    requiredAcceptanceIds: readonly Fnc006AcceptanceId[],
    requiredCaseIds: readonly Fnc006TestCaseId[],
  ): void;
  assertPerspectiveCoverage(
    cases: readonly Fnc006CaseDefinition[],
    requiredPerspectives: readonly Fnc006Perspective[],
  ): void;
  assertRedPlanningCase(testCase: Fnc006CaseDefinition): void;
}

export function createFnc006TestHarness(): Fnc006TestHarness {
  return {
    assertRequirementTrace(
      cases: readonly Fnc006CaseDefinition[],
      requiredRequirementIds: readonly Fnc006RequirementId[],
      requiredAcceptanceIds: readonly Fnc006AcceptanceId[],
      requiredCaseIds: readonly Fnc006TestCaseId[],
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
      cases: readonly Fnc006CaseDefinition[],
      requiredPerspectives: readonly Fnc006Perspective[],
    ): void {
      const perspectiveSet = new Set(cases.map((entry) => entry.perspective));

      requiredPerspectives.forEach((perspective) => {
        expect(perspectiveSet.has(perspective)).toBe(true);
      });

      const idempotentCase = cases.find((entry) => entry.perspective === "IDEMPOTENT");
      expect(idempotentCase?.expected.idempotent).toBe(true);
      expect(idempotentCase?.expected.dbDelta).toBe(0);

      const archivedCase = cases.find((entry) => entry.perspective === "ARCHIVED_REJECT");
      expect(archivedCase?.expected.httpStatus).toBe(409);
      expect(archivedCase?.expected.domainErrorCode).toBe("DOMAIN_CONFLICT");
      expect(archivedCase?.expected.resumeCtaVisible).toBe(true);

      const forbiddenCase = cases.find((entry) => entry.perspective === "CROSS_USER_FORBIDDEN");
      expect(forbiddenCase?.expected.httpStatus).toBe(403);
      expect(forbiddenCase?.expected.domainErrorCode).toBe("FORBIDDEN");
      expect(forbiddenCase?.expected.dbDelta).toBe(0);
    },
    assertRedPlanningCase(testCase: Fnc006CaseDefinition): void {
      expect(testCase.traceId).toContain("T-025");
      expect(testCase.traceId).toContain("C-001");
      expect(testCase.traceId).toContain(testCase.testCaseId);
      expect(testCase.traceId).toContain(testCase.requirementId);
      expect(testCase.traceId).toContain(testCase.acceptanceId);
      expect(testCase.title.length).toBeGreaterThan(0);
      expect(testCase.notes.length).toBeGreaterThan(0);
    },
  };
}
