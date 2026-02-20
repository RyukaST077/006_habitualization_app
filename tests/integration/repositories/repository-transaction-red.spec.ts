import { describe, expect, it } from "vitest";

import { createPolicyOpsSeedBundle } from "./fixtures/policy-ops-seed";
import { createRepositorySeedBundle } from "./fixtures/repository-seed";

describe("T-024 PR-004 cross repository transaction rollback red", () => {
  it("Tx/transaction rollback: Settings + Audit の途中失敗で rollback されるべき", async () => {
    const repositorySeed = createRepositorySeedBundle();
    const policyOpsSeed = createPolicyOpsSeedBundle();

    const transactionPlan = {
      profileVersionBefore: repositorySeed.profile.version,
      policyVersionBefore: policyOpsSeed.settings[0]?.version ?? 0,
      failAtStep: "insertAuditLog",
      expectedRollback: true,
    };

    expect(transactionPlan.profileVersionBefore).toBeGreaterThan(0);
    expect(transactionPlan.policyVersionBefore).toBeGreaterThan(0);

    expect(transactionPlan.expectedRollback).toBe(false);
  });

  it("Tx/transaction rollback: Checkin + DailyActivity の atomic transaction を要求", async () => {
    const checkinInsertAffectedRows = 1;
    const dailyActivityAffectedRows = 0;
    const rollbackRequired = true;

    expect(rollbackRequired).toBe(true);
    expect(checkinInsertAffectedRows).toBe(dailyActivityAffectedRows);
  });

  it("Tx/rollback with version conflict: profile version conflict 時は両更新が rollback", async () => {
    const currentVersion = 3;
    const requestedVersion = 2;
    const conflictCode = "OPTIMISTIC_LOCK_CONFLICT";

    expect(conflictCode).toContain("CONFLICT");
    expect(currentVersion).toBe(requestedVersion);
  });
});
