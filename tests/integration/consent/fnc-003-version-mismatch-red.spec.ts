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

    expect(rejection).toMatchObject({
      code: "POLICY_VERSION_MISMATCH",
      status: 409,
    });
    const latest = await repository.findUserLatestConsents(userId);
    expect(latest.find((consent) => consent.policyType === "terms")?.policyVersion).toBe("5");
  });

  it("FNC-003 観点: policy_version mismatch 拒否ケースを固定する", () => {
    const mismatchCase = CONSENT_RED_CASES.find((entry) => entry.testCaseId === "TC-IT-FR-005-003");

    expect(mismatchCase?.requirementId).toBe("FR-005");
    expect(mismatchCase?.acceptanceId).toBe("AC-005");
    expect(mismatchCase?.notes).toContain("FR-026");
  });

  it("red: T-037 未実装のため FNC-003 版不一致拒否を失敗状態で固定する", () => {
    expect(harness.getT037ImplementationState()).toBe("implemented");
  });
});
