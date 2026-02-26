import { describe, expect, it } from "vitest";

import { PolicyRepository } from "../../../src/server/infrastructure/repositories/PolicyRepository";
import { createSupabaseRepositoryClient } from "../../../src/server/infrastructure/repositories/supabase-repository-client";
import { CONSENT_RED_CASES } from "./fixtures/fnc-002-003-cases";
import { createConsentTestHarness } from "./helpers/consent-test-harness";

const harness = createConsentTestHarness();

function createUniqueRepository() {
  const now = new Date().toISOString();
  const repository = new PolicyRepository(
    createSupabaseRepositoryClient({
      policySettings: [
        {
          policyType: "terms",
          currentVersion: "3",
          effectiveFrom: now,
          updatedBy: "service_role:seed",
          updatedAt: now,
        },
        {
          policyType: "privacy",
          currentVersion: "4",
          effectiveFrom: now,
          updatedBy: "service_role:seed",
          updatedAt: now,
        },
      ],
      policyConsents: [],
    }),
  );

  return { repository, userId: "user-fnc003-unique" };
}

describe("T-036 PR-003 FNC-003 unique constraint red tests", () => {
  it("TC-IT-FR-005-002: FR-005 AC-005 CON-006 duplicate 同意は uq_policy_consents_user_type_ver で no-op 成功", async () => {
    const { repository, userId } = createUniqueRepository();
    const input = {
      policyType: "privacy" as const,
      policyVersion: "4",
      consentedAt: "2026-02-26T02:00:00.000Z",
    };

    const first = await repository.insertConsents(userId, [input]);
    const duplicate = await repository.insertConsents(userId, [input]);

    expect(first).toEqual({ insertedCount: 1, duplicateCount: 0 });
    expect(duplicate).toEqual({ insertedCount: 0, duplicateCount: 1 });
  });

  it("FNC-003/CON-006 観点: duplicate と no-op のトレースを保持する", () => {
    const uniqueCase = CONSENT_RED_CASES.find((entry) => entry.testCaseId === "TC-IT-FR-005-002");

    expect(uniqueCase?.requirementId).toBe("FR-005");
    expect(uniqueCase?.acceptanceId).toBe("AC-005");
    expect(uniqueCase?.notes).toContain("CON-006");
    expect(uniqueCase?.notes).toContain("duplicate");
    expect(uniqueCase?.notes).toContain("no-op");
    expect(uniqueCase?.notes).toContain("uq_policy_consents_user_type_ver");
  });

  it("red: T-037 未実装のため FNC-003 一意制約要件を失敗状態で固定する", () => {
    expect(harness.getT037ImplementationState()).toBe("implemented");
  });
});
