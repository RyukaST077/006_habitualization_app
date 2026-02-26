import { describe, expect, it } from "vitest";

import { PolicyRepository } from "../../../src/server/infrastructure/repositories/PolicyRepository";
import { createSupabaseRepositoryClient } from "../../../src/server/infrastructure/repositories/supabase-repository-client";
import { CONSENT_RED_CASES } from "./fixtures/fnc-002-003-cases";
import { createConsentTestHarness } from "./helpers/consent-test-harness";

const harness = createConsentTestHarness();

function createHistoryRepository() {
  const now = new Date().toISOString();
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
      policyConsents: [],
    }),
  );

  return { repository, userId: "user-fnc003-history" };
}

describe("T-036 PR-003 FNC-003 consent history red tests", () => {
  it("TC-IT-FR-005-001: FR-005 AC-005 terms/privacy 同意受諾時に policy_consents 履歴を2件登録する", async () => {
    const { repository, userId } = createHistoryRepository();

    const inserted = await repository.insertConsents(userId, [
      {
        policyType: "terms",
        policyVersion: "5",
        consentedAt: "2026-02-26T00:00:00.000Z",
      },
      {
        policyType: "privacy",
        policyVersion: "5",
        consentedAt: "2026-02-26T00:05:00.000Z",
      },
    ]);

    expect(inserted).toEqual({ insertedCount: 2, duplicateCount: 0 });
    const latest = await repository.findUserLatestConsents(userId);
    expect(latest).toHaveLength(2);
  });

  it("FNC-003 観点: FR-005/AC-005 の履歴登録ケースを固定する", () => {
    const historyCase = CONSENT_RED_CASES.find((entry) => entry.testCaseId === "TC-IT-FR-005-001");

    expect(historyCase?.requirementId).toBe("FR-005");
    expect(historyCase?.acceptanceId).toBe("AC-005");
    expect(historyCase?.notes).toContain("policy_consents");
    expect(historyCase?.notes).toContain("insert history");
  });

  it("red: T-037 未実装のため FNC-003 履歴登録要件を失敗状態で固定する", () => {
    expect(harness.getT037ImplementationState()).toBe("implemented");
  });
});
