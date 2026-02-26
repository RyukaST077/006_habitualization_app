import { expect } from "vitest";

import type {
  ConsentAcceptanceId,
  ConsentCaseDefinition,
  ConsentPerspective,
  ConsentRequirementId,
} from "../fixtures/fnc-002-003-cases";

const T037_IMPLEMENTATION_STATE = "pending" as const;

export interface ConsentTestHarness {
  assertRequirementTrace(
    cases: readonly ConsentCaseDefinition[],
    requiredRequirementIds: readonly ConsentRequirementId[],
    requiredAcceptanceIds: readonly ConsentAcceptanceId[],
  ): void;
  assertPerspectiveCoverage(
    cases: readonly ConsentCaseDefinition[],
    requiredPerspectives: readonly ConsentPerspective[],
  ): void;
  assertReconsentRiskBinding(cases: readonly ConsentCaseDefinition[]): void;
  assertConstraintBoundaries(cases: readonly ConsentCaseDefinition[]): void;
  assertRedPlanningCase(testCase: ConsentCaseDefinition): void;
  getT037ImplementationState(): typeof T037_IMPLEMENTATION_STATE;
}

export function createConsentTestHarness(): ConsentTestHarness {
  return {
    assertRequirementTrace(
      cases: readonly ConsentCaseDefinition[],
      requiredRequirementIds: readonly ConsentRequirementId[],
      requiredAcceptanceIds: readonly ConsentAcceptanceId[],
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
    assertPerspectiveCoverage(
      cases: readonly ConsentCaseDefinition[],
      requiredPerspectives: readonly ConsentPerspective[],
    ): void {
      const perspectiveSet = new Set(cases.map((testCase) => testCase.perspective));
      requiredPerspectives.forEach((perspective) => {
        expect(perspectiveSet.has(perspective)).toBe(true);
      });
    },
    assertReconsentRiskBinding(cases: readonly ConsentCaseDefinition[]): void {
      const target = cases.find((testCase) => testCase.riskId === "T-RSK-003");
      expect(target).toBeDefined();
      expect(target?.interfaceId).toBe("IF-004");
      expect(target?.notes).toContain("re-consent");
      expect(target?.notes).toContain("policy_settings");
    },
    assertConstraintBoundaries(cases: readonly ConsentCaseDefinition[]): void {
      const con006Case = cases.find((testCase) => testCase.constraints?.includes("CON-006"));
      const con007Case = cases.find((testCase) => testCase.constraints?.includes("CON-007"));

      expect(con006Case).toBeDefined();
      expect(con006Case?.notes).toContain("uq_policy_consents_user_type_ver");
      expect(con007Case).toBeDefined();
      expect(con007Case?.notes).toContain("terms");
      expect(con007Case?.notes).toContain("privacy");
    },
    assertRedPlanningCase(testCase: ConsentCaseDefinition): void {
      expect(testCase.traceId).toContain("T-036");
      expect(testCase.traceId).toContain(testCase.requirementId);
      expect(testCase.traceId).toContain(testCase.acceptanceId);
      expect(testCase.title.length).toBeGreaterThan(0);
      expect(testCase.notes.length).toBeGreaterThan(0);
    },
    getT037ImplementationState(): typeof T037_IMPLEMENTATION_STATE {
      return T037_IMPLEMENTATION_STATE;
    },
  };
}
