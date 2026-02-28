import { expect } from "vitest";

import type {
  ConsentAcceptanceId,
  ConsentCaseDefinition,
  ConsentConflictKind,
  ConsentConflictOutcome,
  ConsentLinkedRequirementId,
  ConsentPerspective,
  ConsentRequirementId,
} from "../fixtures/fnc-002-003-cases";

const T037_IMPLEMENTATION_STATE = "implemented" as const;

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
  assertSinglePlanTraceability(
    cases: readonly ConsentCaseDefinition[],
    requiredRequirementIds: readonly ("FR-003" | "FR-005")[],
    requiredLinkedRequirementIds: readonly ConsentLinkedRequirementId[],
  ): void;
  assertConflictCase(
    cases: readonly ConsentCaseDefinition[],
    options: {
      testCaseId: ConsentCaseDefinition["testCaseId"];
      requirementId: ConsentRequirementId;
      acceptanceId: ConsentAcceptanceId;
      conflictKind: ConsentConflictKind;
      conflictOutcome: ConsentConflictOutcome;
      conflictReasonCode: NonNullable<ConsentCaseDefinition["conflictReasonCode"]>;
      notesIncludes: readonly string[];
      requireRiskId?: "T-RSK-003";
      requireInterfaceId?: "IF-004";
      requireLinkedRequirement?: "FR-026";
    },
  ): ConsentCaseDefinition;
  assertRaceConflictResult(
    race: readonly { status: "fulfilled" | "rejected"; reason?: unknown }[],
    options: {
      conflictCode: string;
      status: number;
    },
  ): void;
  assertGreenRegressionCase(testCase: ConsentCaseDefinition): void;
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
      expect(target?.conflictKind).toBe("STALE_VERSION_SUBMISSION");
      expect(target?.conflictReasonCode).toBe("POLICY_VERSION_MISMATCH");
      expect(target?.linkedRequirementIds).toContain("FR-026");
      expect(target?.notes).toContain("old-version");
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
    assertSinglePlanTraceability(
      cases: readonly ConsentCaseDefinition[],
      requiredRequirementIds: readonly ("FR-003" | "FR-005")[],
      requiredLinkedRequirementIds: readonly ConsentLinkedRequirementId[],
    ): void {
      const requirementSet = new Set(
        cases
          .filter(
            (testCase) =>
              testCase.requirementId === "FR-003" ||
              testCase.requirementId === "FR-005",
          )
          .map((testCase) => testCase.requirementId),
      );
      requiredRequirementIds.forEach((requirementId) => {
        expect(requirementSet.has(requirementId)).toBe(true);
      });

      const linkedRequirements = new Set(
        cases.flatMap((testCase) => testCase.linkedRequirementIds ?? []),
      );
      requiredLinkedRequirementIds.forEach((requirementId) => {
        expect(linkedRequirements.has(requirementId)).toBe(true);
      });

      const reconsentConflict = cases.find(
        (testCase) => testCase.testCaseId === "TC-IT-FR-003-003",
      );
      expect(reconsentConflict?.conflictKind).toBe("STALE_VERSION_SUBMISSION");
      expect(reconsentConflict?.conflictOutcome).toBe("REJECT_WITH_409");
      expect(reconsentConflict?.linkedRequirementIds).toContain("FR-026");

      const historyCase = cases.find(
        (testCase) => testCase.testCaseId === "TC-IT-FR-005-001",
      );
      expect(historyCase?.requirementId).toBe("FR-005");

      const auditConflict = cases.find(
        (testCase) => testCase.testCaseId === "TC-IT-FR-005-003",
      );
      expect(auditConflict?.perspective).toBe("AUDIT");
      expect(auditConflict?.conflictKind).toBe("UPDATE_CONFLICT_ROLLBACK");
      expect(auditConflict?.conflictOutcome).toBe("KEEP_PREVIOUS_VERSION");
      expect(auditConflict?.linkedRequirementIds).toContain("FR-026");
    },
    assertConflictCase(
      cases: readonly ConsentCaseDefinition[],
      options: {
        testCaseId: ConsentCaseDefinition["testCaseId"];
        requirementId: ConsentRequirementId;
        acceptanceId: ConsentAcceptanceId;
        conflictKind: ConsentConflictKind;
        conflictOutcome: ConsentConflictOutcome;
        conflictReasonCode: NonNullable<ConsentCaseDefinition["conflictReasonCode"]>;
        notesIncludes: readonly string[];
        requireRiskId?: "T-RSK-003";
        requireInterfaceId?: "IF-004";
        requireLinkedRequirement?: "FR-026";
      },
    ): ConsentCaseDefinition {
      const target = cases.find((entry) => entry.testCaseId === options.testCaseId);

      expect(target).toBeDefined();
      expect(target?.requirementId).toBe(options.requirementId);
      expect(target?.acceptanceId).toBe(options.acceptanceId);
      expect(target?.conflictKind).toBe(options.conflictKind);
      expect(target?.conflictOutcome).toBe(options.conflictOutcome);
      expect(target?.conflictReasonCode).toBe(options.conflictReasonCode);
      options.notesIncludes.forEach((fragment) => {
        expect(target?.notes).toContain(fragment);
      });

      if (options.requireRiskId) {
        expect(target?.riskId).toBe(options.requireRiskId);
      }
      if (options.requireInterfaceId) {
        expect(target?.interfaceId).toBe(options.requireInterfaceId);
      }
      if (options.requireLinkedRequirement) {
        expect(target?.linkedRequirementIds).toContain(options.requireLinkedRequirement);
      }

      return target!;
    },
    assertRaceConflictResult(
      race: readonly { status: "fulfilled" | "rejected"; reason?: unknown }[],
      options: {
        conflictCode: string;
        status: number;
      },
    ): void {
      const rejected = race.filter((result) => result.status === "rejected");
      const fulfilled = race.filter((result) => result.status === "fulfilled");

      expect(rejected).toHaveLength(1);
      expect(fulfilled).toHaveLength(1);
      expect(rejected[0]?.reason).toMatchObject({
        code: options.conflictCode,
        status: options.status,
      });
    },
    assertGreenRegressionCase(testCase: ConsentCaseDefinition): void {
      expect(testCase.traceId).toContain("T-037");
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
