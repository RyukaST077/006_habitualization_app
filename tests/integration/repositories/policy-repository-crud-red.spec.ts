import { describe, expect, it } from "vitest";

import { PolicyRepository } from "../../../src/server/infrastructure/repositories/PolicyRepository";
import { createSupabaseRepositoryClient } from "../../../src/server/infrastructure/repositories/supabase-repository-client";
import { createPolicyOpsSeedBundle } from "./fixtures/policy-ops-seed";

function createPolicyRepository() {
  const seed = createPolicyOpsSeedBundle();
  const now = new Date().toISOString();
  const client = createSupabaseRepositoryClient({
    policySettings: seed.settings.map((setting) => ({
      policyType: setting.policyType,
      currentVersion: `${setting.version}`,
      effectiveFrom: now,
      updatedBy: "service_role:seed",
      updatedAt: now,
    })),
    policyConsents: seed.consents.map((consent) => ({
      userId: consent.userId,
      policyType: consent.policyType,
      policyVersion: `${consent.policyVersion}`,
      consentedAt: consent.consentedAt,
    })),
  });

  return {
    repository: new PolicyRepository(client),
    userId: seed.consents[0]!.userId,
  };
}

describe("T-025 PR-003 M-103 policy repository CRUD/conflict", () => {
  it("M-103/CRUD/getCurrentPolicies: policy typeごとの現行版を取得", async () => {
    const { repository } = createPolicyRepository();

    const policies = await repository.getCurrentPolicies();

    expect(policies).toHaveLength(2);
    expect(policies.map((policy) => policy.policyType)).toEqual(["privacy", "terms"]);
  });

  it("M-103/CRUD/findUserLatestConsents: userごとの最新同意を取得", async () => {
    const { repository, userId } = createPolicyRepository();

    await repository.insertConsents(userId, [
      {
        policyType: "terms",
        policyVersion: "3",
        consentedAt: "2026-02-21T00:00:00.000Z",
      },
      {
        policyType: "privacy",
        policyVersion: "4",
        consentedAt: "2026-02-21T01:00:00.000Z",
      },
    ]);

    const latest = await repository.findUserLatestConsents(userId);

    expect(latest).toHaveLength(2);
    expect(latest.find((consent) => consent.policyType === "terms")?.policyVersion).toBe("3");
    expect(latest.find((consent) => consent.policyType === "privacy")?.policyVersion).toBe("4");
  });

  it("M-103/CRUD/insertConsents: 重複同意はno-op成功", async () => {
    const { repository, userId } = createPolicyRepository();

    const first = await repository.insertConsents(userId, [
      {
        policyType: "privacy",
        policyVersion: "4",
        consentedAt: "2026-02-22T00:00:00.000Z",
      },
    ]);
    expect(first).toEqual({ insertedCount: 1, duplicateCount: 0 });

    const duplicate = await repository.insertConsents(userId, [
      {
        policyType: "privacy",
        policyVersion: "4",
        consentedAt: "2026-02-22T00:00:00.000Z",
      },
    ]);
    expect(duplicate).toEqual({ insertedCount: 0, duplicateCount: 1 });
  });

  it("M-103/CRUD/updatePolicySetting: service_roleのみ更新可能、版競合はPOLICY_VERSION_CONFLICT", async () => {
    const { repository } = createPolicyRepository();

    await expect(
      repository.updatePolicySetting("terms", "3", "2026-03-01T00:00:00.000Z", "authenticated:user-001"),
    ).rejects.toMatchObject({
      status: 403,
      code: "FORBIDDEN",
    });

    const updated = await repository.updatePolicySetting(
      "terms",
      "3",
      "2026-03-01T00:00:00.000Z",
      "service_role:ops",
    );
    expect(updated.currentVersion).toBe("3");

    await expect(
      repository.updatePolicySetting("terms", "2", "2026-04-01T00:00:00.000Z", "service_role:ops"),
    ).rejects.toMatchObject({
      code: "POLICY_VERSION_CONFLICT",
      status: 409,
    });
  });
});
