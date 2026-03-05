import { expect } from "vitest";

import type {
  Fnc012AcceptanceId,
  Fnc012CaseDefinition,
  Fnc012ConstraintId,
  Fnc012Perspective,
  Fnc012RequirementId,
  Fnc012TestCaseId,
} from "../fixtures/fnc-012-cases";

const T029_C001_IMPLEMENTATION_STATE = "implemented" as const;

export interface WithdrawalTestHarness {
  assertRequirementTrace(
    cases: readonly Fnc012CaseDefinition[],
    requiredRequirementIds: readonly Fnc012RequirementId[],
    requiredAcceptanceIds: readonly Fnc012AcceptanceId[],
    requiredCaseIds: readonly Fnc012TestCaseId[],
  ): void;
  assertPerspectiveCoverage(
    cases: readonly Fnc012CaseDefinition[],
    requiredPerspectives: readonly Fnc012Perspective[],
  ): void;
  assertConstraintMarkers(
    cases: readonly Fnc012CaseDefinition[],
    requiredConstraintIds: readonly Fnc012ConstraintId[],
  ): void;
  assertScopeIsolation(cases: readonly Fnc012CaseDefinition[]): void;
  assertMockReplacementCondition(cases: readonly Fnc012CaseDefinition[]): void;
  assertPlannedCase(testCase: Fnc012CaseDefinition): void;
  getImplementationState(): typeof T029_C001_IMPLEMENTATION_STATE;
}

export function createWithdrawalTestHarness(): WithdrawalTestHarness {
  return {
    assertRequirementTrace(
      cases: readonly Fnc012CaseDefinition[],
      requiredRequirementIds: readonly Fnc012RequirementId[],
      requiredAcceptanceIds: readonly Fnc012AcceptanceId[],
      requiredCaseIds: readonly Fnc012TestCaseId[],
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
      requiredCaseIds.forEach((caseId) => {
        expect(caseIdSet.has(caseId)).toBe(true);
      });
    },
    assertPerspectiveCoverage(
      cases: readonly Fnc012CaseDefinition[],
      requiredPerspectives: readonly Fnc012Perspective[],
    ): void {
      const perspectiveSet = new Set(cases.map((entry) => entry.perspective));
      requiredPerspectives.forEach((perspective) => {
        expect(perspectiveSet.has(perspective)).toBe(true);
      });
    },
    assertConstraintMarkers(
      cases: readonly Fnc012CaseDefinition[],
      requiredConstraintIds: readonly Fnc012ConstraintId[],
    ): void {
      const notes = cases.map((entry) => entry.notes).join(" ");
      requiredConstraintIds.forEach((constraintId) => {
        expect(notes.includes(constraintId)).toBe(true);
      });
    },
    assertScopeIsolation(cases: readonly Fnc012CaseDefinition[]): void {
      cases.forEach((testCase) => {
        expect(testCase.scope.ownerTask).toBe("T-029");
        expect(testCase.scope.excludedTasks).toEqual(["T-056", "T-030", "T-031"]);
        expect(testCase.boundary).not.toBe("SCR-007");
      });
    },
    assertMockReplacementCondition(cases: readonly Fnc012CaseDefinition[]): void {
      cases.forEach((testCase) => {
        expect(testCase.mock.strategyId).toBe("S-MOCK-05");
        expect(testCase.mock.replacementDoneWhen).toContain("BAT-004");
        expect(testCase.mock.replacementDoneWhen).toContain("ops repository");
      });
    },
    assertPlannedCase(testCase: Fnc012CaseDefinition): void {
      expect(testCase.traceId).toContain("T-029");
      expect(testCase.traceId).toContain("C-001");
      expect(testCase.traceId).toContain(testCase.testCaseId);
      expect(testCase.traceId).toContain(testCase.requirementId);
      expect(testCase.traceId).toContain(testCase.acceptanceId);
      expect(testCase.title.length).toBeGreaterThan(0);
      expect(testCase.notes.length).toBeGreaterThan(0);
      expect(testCase.sla.disableWithinSeconds).toBe(60);
      expect(testCase.sla.hardDeleteWithinSeconds).toBe(300);
    },
    getImplementationState(): typeof T029_C001_IMPLEMENTATION_STATE {
      return T029_C001_IMPLEMENTATION_STATE;
    },
  };
}
