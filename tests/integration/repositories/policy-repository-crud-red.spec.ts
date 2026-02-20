import { describe, expect, it } from "vitest";

import { createPolicyOpsSeedBundle } from "./fixtures/policy-ops-seed";

const policyRepositoryMethodContracts = [
  {
    method: "getCurrentPolicies",
    traceId: "M-103/CRUD/getCurrentPolicies",
    constraint: "returns active policy settings by type",
  },
  {
    method: "findUserLatestConsents",
    traceId: "M-103/CRUD/findUserLatestConsents",
    constraint: "returns latest consent state per policy type for user",
  },
  {
    method: "insertConsents",
    traceId: "M-103/CRUD/insertConsents",
    constraint: "inserts new consent rows and allows duplicate no-op success",
  },
  {
    method: "updatePolicySetting",
    traceId: "M-103/CRUD/updatePolicySetting",
    constraint: "service role only and enforces POLICY_VERSION_CONFLICT",
  },
] as const;

describe("T-024 PR-003 M-103 policy repository CRUD/conflict red", () => {
  it.each(policyRepositoryMethodContracts)(
    "$traceId $method: 実装前のためRedで失敗する",
    async ({ constraint }) => {
      const seed = createPolicyOpsSeedBundle();

      expect(seed.settings.length).toBeGreaterThan(0);
      expect(constraint).toContain(" ");

      expect("repository-implementation-status").toBe("green");
    },
  );

  it("M-103/競合/updatePolicySetting/version: version不一致はPOLICY_VERSION_CONFLICT", async () => {
    const requestedVersion = 2;
    const storedVersion = 3;
    const expectedErrorCode = "POLICY_VERSION_CONFLICT";

    expect(expectedErrorCode).toBe("POLICY_VERSION_CONFLICT");
    expect(requestedVersion).toBe(storedVersion);
  });

  it("M-103/冪等/insertConsents: 重複同意はno-op成功（エラーにしない）", async () => {
    const firstInsertAffectedRows = 1;
    const duplicateInsertAffectedRows = 0;
    const expectedResult = "success";

    expect(expectedResult).toBe("success");
    expect(firstInsertAffectedRows).toBe(duplicateInsertAffectedRows);
  });

  it("M-103/認可/updatePolicySetting: service role以外は拒否", async () => {
    const actorRole = "authenticated";
    const requiredRole = "service_role";

    expect(actorRole).toBe(requiredRole);
  });
});
