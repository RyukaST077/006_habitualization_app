import { describe, expect, it } from "vitest";

import { PolicyRepository } from "../../../src/server/infrastructure/repositories/PolicyRepository";
import { createSupabaseRepositoryClient } from "../../../src/server/infrastructure/repositories/supabase-repository-client";
import { CONSENT_RED_CASES } from "./fixtures/fnc-002-003-cases";
import { createConsentTestHarness } from "./helpers/consent-test-harness";

const harness = createConsentTestHarness();

function createVersionMismatchRepository() {
  const now = new Date().toISOString();
  const userId = "user-fnc003-version-mismatch";
  const repository = new PolicyRepository(
    createSupabaseRepositoryClient({
      policySettings: [
        {
          policyType: "terms",
          currentVersion: "5",
          effectiveFrom: now,
          updatedBy: "service_role:seed",
          updatedAt: now,
        },
        {
          policyType: "privacy",
          currentVersion: "5",
          effectiveFrom: now,
          updatedBy: "service_role:seed",
          updatedAt: now,
        },
      ],
      policyConsents: [
        {
          userId,
          policyType: "terms",
          policyVersion: "5",
          consentedAt: "2026-02-26T03:00:00.000Z",
        },
      ],
    }),
  );

  return { repository, userId };
}

describe("T-036 PR-003 FNC-003 version mismatch red tests", () => {
  it("TC-IT-FR-005-003: FR-005 AC-005 policy_version 不一致は 409 相当で拒否し DB 不変にする", async () => {
    const { repository, userId } = createVersionMismatchRepository();
    let rejection: unknown = null;
    const before = await repository.findUserLatestConsents(userId);

    try {
      await repository.insertConsents(userId, [
        {
          policyType: "terms",
          policyVersion: "4",
          consentedAt: "2026-02-26T03:10:00.000Z",
        },
      ]);
    } catch (error) {
      rejection = error;
    }

    expect(rejection).toMatchObject({ code: "POLICY_VERSION_MISMATCH", status: 409 });
    const after = await repository.findUserLatestConsents(userId);
    expect(after).toEqual(before);
  });

  it("FNC-003 観点: 旧版送信拒否と更新競合ロールバック監査のトレースを固定する", () => {
    harness.assertConflictCase(CONSENT_RED_CASES, {
      testCaseId: "TC-IT-FR-003-003",
      requirementId: "FR-003",
      acceptanceId: "AC-003",
      conflictKind: "STALE_VERSION_SUBMISSION",
      conflictOutcome: "REJECT_WITH_409",
      conflictReasonCode: "POLICY_VERSION_MISMATCH",
      notesIncludes: ["old-version", "re-consent"],
      requireRiskId: "T-RSK-003",
      requireInterfaceId: "IF-004",
      requireLinkedRequirement: "FR-026",
    });
    harness.assertConflictCase(CONSENT_RED_CASES, {
      testCaseId: "TC-IT-FR-005-003",
      requirementId: "FR-005",
      acceptanceId: "AC-005",
      conflictKind: "UPDATE_CONFLICT_ROLLBACK",
      conflictOutcome: "KEEP_PREVIOUS_VERSION",
      conflictReasonCode: "POLICY_VERSION_CONFLICT",
      notesIncludes: ["FR-026", "keeps previous consent version", "audit trail"],
      requireInterfaceId: "IF-004",
      requireLinkedRequirement: "FR-026",
    });
  });

  it("red: T-037 未実装のため FNC-003 版不一致拒否を失敗状態で固定する", () => {
    expect(harness.getT037ImplementationState()).toBe("implemented");
  });
});
