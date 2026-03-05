import { expect } from "vitest";

import type {
  SettingsAcceptanceId,
  SettingsCaseDefinition,
  SettingsCaseId,
  SettingsPerspective,
  SettingsRequirementId,
} from "../fixtures/fnc-010-011-cases";

const T028_C001_IMPLEMENTATION_STATE = "implemented" as const;

export interface SettingsTestHarness {
  assertRequirementTrace(
    cases: readonly SettingsCaseDefinition[],
    requiredRequirementIds: readonly SettingsRequirementId[],
    requiredAcceptanceIds: readonly SettingsAcceptanceId[],
    requiredCaseIds: readonly SettingsCaseId[],
  ): void;
  assertPerspectiveCoverage(
    cases: readonly SettingsCaseDefinition[],
    requiredPerspectives: readonly SettingsPerspective[],
  ): void;
  assertScopeIsolation(
    cases: readonly SettingsCaseDefinition[],
    options: {
      excludedTasks: readonly ("T-056" | "T-029")[];
      excludedEndpoints: readonly "/api/settings/withdrawal"[];
    },
  ): void;
  assertFr020Boundary(cases: readonly SettingsCaseDefinition[]): void;
  assertPlannedCase(testCase: SettingsCaseDefinition): void;
  getImplementationState(): typeof T028_C001_IMPLEMENTATION_STATE;
}

export function createSettingsTestHarness(): SettingsTestHarness {
  return {
    assertRequirementTrace(
      cases: readonly SettingsCaseDefinition[],
      requiredRequirementIds: readonly SettingsRequirementId[],
      requiredAcceptanceIds: readonly SettingsAcceptanceId[],
      requiredCaseIds: readonly SettingsCaseId[],
    ): void {
      const requirementSet = new Set(cases.map((testCase) => testCase.requirementId));
      const acceptanceSet = new Set(cases.map((testCase) => testCase.acceptanceId));
      const caseIdSet = new Set(cases.map((testCase) => testCase.testCaseId));

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
      cases: readonly SettingsCaseDefinition[],
      requiredPerspectives: readonly SettingsPerspective[],
    ): void {
      const perspectiveSet = new Set(cases.map((testCase) => testCase.perspective));
      requiredPerspectives.forEach((perspective) => {
        expect(perspectiveSet.has(perspective)).toBe(true);
      });
    },
    assertScopeIsolation(
      cases: readonly SettingsCaseDefinition[],
      options: {
        excludedTasks: readonly ("T-056" | "T-029")[];
        excludedEndpoints: readonly "/api/settings/withdrawal"[];
      },
    ): void {
      cases.forEach((testCase) => {
        expect(testCase.scope.ownerTask).toBe("T-028");
        options.excludedTasks.forEach((taskId) => {
          expect(testCase.scope.excludedTasks).toContain(taskId);
        });
        options.excludedEndpoints.forEach((endpoint) => {
          expect(testCase.scope.excludedEndpoints).toContain(endpoint);
        });
        expect(testCase.endpoint).toBe("/api/settings/profile");
        expect(testCase.traceId.includes("withdrawal")).toBe(false);
        expect(testCase.notes.includes("withdrawal")).toBe(false);
      });
    },
    assertFr020Boundary(cases: readonly SettingsCaseDefinition[]): void {
      const fr020Case = cases.find((testCase) => testCase.testCaseId === "TC-IT-FR-020-002");

      expect(fr020Case).toBeDefined();
      expect(fr020Case?.requirementId).toBe("FR-020");
      expect(fr020Case?.acceptanceId).toBe("AC-020");
      expect(fr020Case?.notes).toContain("effective_from");
      expect(fr020Case?.notes).toContain("must not recompute past logs");
    },
    assertPlannedCase(testCase: SettingsCaseDefinition): void {
      expect(testCase.traceId).toContain("T-028");
      expect(testCase.traceId).toContain("C-001");
      expect(testCase.traceId).toContain(testCase.testCaseId);
      expect(testCase.traceId).toContain(testCase.requirementId);
      expect(testCase.traceId).toContain(testCase.acceptanceId);
      expect(testCase.endpoint).toBe("/api/settings/profile");
      expect(testCase.title.length).toBeGreaterThan(0);
      expect(testCase.notes.length).toBeGreaterThan(0);
    },
    getImplementationState(): typeof T028_C001_IMPLEMENTATION_STATE {
      return T028_C001_IMPLEMENTATION_STATE;
    },
  };
}
