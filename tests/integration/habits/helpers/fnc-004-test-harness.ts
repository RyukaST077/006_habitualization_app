import { expect } from "vitest";

import type {
  Fnc004AcceptanceId,
  Fnc004CaseDefinition,
  Fnc004ExceptionId,
  Fnc004LifecycleOperation,
  Fnc004RequirementId,
  Fnc004Tbl002ConstraintId,
} from "../fixtures/fnc-004-cases";

const T040_IMPLEMENTATION_STATE = "implemented" as const;

export interface Fnc004TestHarness {
  assertRequirementTrace(
    cases: readonly Fnc004CaseDefinition[],
    requiredRequirementIds: readonly Fnc004RequirementId[],
    requiredAcceptanceIds: readonly Fnc004AcceptanceId[],
  ): void;
  assertLifecycleCoverage(
    cases: readonly Fnc004CaseDefinition[],
    requiredOperations: readonly Fnc004LifecycleOperation[],
  ): void;
  assertExceptionCoverage(
    cases: readonly Fnc004CaseDefinition[],
    requiredExceptionIds: readonly Fnc004ExceptionId[],
  ): void;
  assertTbl002Constraints(
    cases: readonly Fnc004CaseDefinition[],
    requiredConstraintIds: readonly Fnc004Tbl002ConstraintId[],
  ): void;
  assertRedPlanningCase(testCase: Fnc004CaseDefinition): void;
  getT040ImplementationState(): typeof T040_IMPLEMENTATION_STATE;
}

export function createFnc004TestHarness(): Fnc004TestHarness {
  return {
    assertRequirementTrace(
      cases: readonly Fnc004CaseDefinition[],
      requiredRequirementIds: readonly Fnc004RequirementId[],
      requiredAcceptanceIds: readonly Fnc004AcceptanceId[],
    ): void {
      const requirementSet = new Set(cases.map((testCase) => testCase.requirementId));
      const acceptanceSet = new Set(cases.map((testCase) => testCase.acceptanceId));

      requiredRequirementIds.forEach((requirementId) => {
        expect(requirementSet.has(requirementId)).toBe(true);
      });
      requiredAcceptanceIds.forEach((acceptanceId) => {
        expect(acceptanceSet.has(acceptanceId)).toBe(true);
      });
    },
    assertLifecycleCoverage(
      cases: readonly Fnc004CaseDefinition[],
      requiredOperations: readonly Fnc004LifecycleOperation[],
    ): void {
      const operationSet = new Set(cases.map((testCase) => testCase.operation));

      requiredOperations.forEach((operation) => {
        expect(operationSet.has(operation)).toBe(true);
      });

      const archiveCase = cases.find((testCase) => testCase.operation === "archive");
      expect(archiveCase?.statusTransition).toEqual(["active", "archived"]);

      const resumeCase = cases.find((testCase) => testCase.operation === "resume");
      expect(resumeCase?.statusTransition).toEqual(["archived", "active"]);
    },
    assertExceptionCoverage(
      cases: readonly Fnc004CaseDefinition[],
      requiredExceptionIds: readonly Fnc004ExceptionId[],
    ): void {
      const exceptionSet = new Set(cases.flatMap((testCase) => testCase.exceptionIds ?? []));

      requiredExceptionIds.forEach((exceptionId) => {
        expect(exceptionSet.has(exceptionId)).toBe(true);
      });

      const ex003Cases = cases.filter((testCase) => testCase.exceptionIds?.includes("EX-003"));
      expect(ex003Cases.length).toBeGreaterThan(0);
      ex003Cases.forEach((testCase) => {
        expect(testCase.expectedErrorCode).toBe("VALIDATION_ERROR");
      });

      const ex004Cases = cases.filter((testCase) => testCase.exceptionIds?.includes("EX-004"));
      expect(ex004Cases.length).toBeGreaterThan(0);
      ex004Cases.forEach((testCase) => {
        expect(testCase.expectedErrorCode).toBe("FORBIDDEN");
      });
    },
    assertTbl002Constraints(
      cases: readonly Fnc004CaseDefinition[],
      requiredConstraintIds: readonly Fnc004Tbl002ConstraintId[],
    ): void {
      const constraintSet = new Set(cases.flatMap((testCase) => testCase.tbl002ConstraintIds ?? []));

      requiredConstraintIds.forEach((constraintId) => {
        expect(constraintSet.has(constraintId)).toBe(true);
      });

      const nameLengthCase = cases.find((testCase) =>
        testCase.tbl002ConstraintIds?.includes("chk_habits_name_len"),
      );
      expect(nameLengthCase).toBeDefined();
      expect(nameLengthCase?.notes).toContain("1..80");

      const statusConstraintCases = cases.filter((testCase) =>
        testCase.tbl002ConstraintIds?.includes("chk_habits_status"),
      );
      expect(statusConstraintCases.length).toBeGreaterThan(0);

      const rlsCase = cases.find(
        (testCase) =>
          testCase.perspective === "TBL002_RLS_ENFORCEMENT" &&
          testCase.tbl002ConstraintIds?.includes("rls_auth_uid_user_id"),
      );
      expect(rlsCase).toBeDefined();
      expect(rlsCase?.notes).toContain("auth.uid() = user_id");
    },
    assertRedPlanningCase(testCase: Fnc004CaseDefinition): void {
      expect(testCase.traceId).toContain("T-039");
      expect(testCase.traceId).toContain(testCase.requirementId);
      expect(testCase.traceId).toContain(testCase.acceptanceId);
      expect(testCase.title.length).toBeGreaterThan(0);
      expect(testCase.notes.length).toBeGreaterThan(0);
    },
    getT040ImplementationState(): typeof T040_IMPLEMENTATION_STATE {
      return T040_IMPLEMENTATION_STATE;
    },
  };
}
