import { expect } from "vitest";

import type {
  Fnc005AcceptanceId,
  Fnc005CaseDefinition,
  Fnc005RequirementId,
  Fnc005TestCaseId,
} from "../fixtures/fnc-005-cases";

const T043_IMPLEMENTATION_STATE = "pending" as const;

export interface Fnc005TestHarness {
  assertRequirementTrace(
    cases: readonly Fnc005CaseDefinition[],
    requiredRequirementIds: readonly Fnc005RequirementId[],
    requiredAcceptanceIds: readonly Fnc005AcceptanceId[],
    requiredCaseIds: readonly Fnc005TestCaseId[],
  ): void;
  assertFixedInputAxes(cases: readonly Fnc005CaseDefinition[]): void;
  assertRedPlanningCase(testCase: Fnc005CaseDefinition): void;
  getT043ImplementationState(): typeof T043_IMPLEMENTATION_STATE;
}

export function createFnc005TestHarness(): Fnc005TestHarness {
  return {
    assertRequirementTrace(
      cases: readonly Fnc005CaseDefinition[],
      requiredRequirementIds: readonly Fnc005RequirementId[],
      requiredAcceptanceIds: readonly Fnc005AcceptanceId[],
      requiredCaseIds: readonly Fnc005TestCaseId[],
    ): void {
      const requirementSet = new Set(cases.map((entry) => entry.requirementId));
      const acceptanceSet = new Set(cases.map((entry) => entry.acceptanceId));
      const testCaseSet = new Set(cases.map((entry) => entry.testCaseId));

      requiredRequirementIds.forEach((requirementId) => {
        expect(requirementSet.has(requirementId)).toBe(true);
      });
      requiredAcceptanceIds.forEach((acceptanceId) => {
        expect(acceptanceSet.has(acceptanceId)).toBe(true);
      });
      requiredCaseIds.forEach((testCaseId) => {
        expect(testCaseSet.has(testCaseId)).toBe(true);
      });
    },
    assertFixedInputAxes(cases: readonly Fnc005CaseDefinition[]): void {
      cases.forEach((testCase) => {
        expect(testCase.input.timezone === "Asia/Tokyo" || testCase.input.timezone === "UTC").toBe(true);
        expect(testCase.input.day_cutoff_time).toBe("03:00");
        expect(testCase.input.nowUtc).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00Z$/);
      });
    },
    assertRedPlanningCase(testCase: Fnc005CaseDefinition): void {
      expect(testCase.traceId).toContain("T-042");
      expect(testCase.traceId).toContain(testCase.testCaseId);
      expect(testCase.traceId).toContain(testCase.requirementId);
      expect(testCase.traceId).toContain(testCase.acceptanceId);
      expect(testCase.title.length).toBeGreaterThan(0);
      expect(testCase.notes.length).toBeGreaterThan(0);
    },
    getT043ImplementationState(): typeof T043_IMPLEMENTATION_STATE {
      return T043_IMPLEMENTATION_STATE;
    },
  };
}
