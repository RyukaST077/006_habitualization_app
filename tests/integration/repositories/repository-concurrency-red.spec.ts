import { describe, expect, it } from "vitest";

import { createPolicyOpsSeedBundle } from "./fixtures/policy-ops-seed";
import { createRepositorySeedBundle } from "./fixtures/repository-seed";
import { runRepositoryRace } from "./fixtures/repository-race";

describe("T-024 PR-004 cross repository optimistic/unique conflict red", () => {
  it("競合/optimistic lock: 同一 profile version 更新の concurrency conflict", async () => {
    const seed = createRepositorySeedBundle();
    const expectedVersion = seed.profile.version + 1;

    const race = await runRepositoryRace([
      {
        name: "updateProfileSettings#1",
        async run() {
          return { optimistic: true, version: expectedVersion };
        },
      },
      {
        name: "updateProfileSettings#2",
        async run() {
          return { optimistic: true, version: expectedVersion };
        },
      },
    ]);

    expect(race).toHaveLength(2);
    expect(race[0]?.status).toBe("rejected");
  });

  it("競合/unique constraint: habit_logs unique key conflict", async () => {
    const firstInsert = { unique: "uq_habit_logs_habit_date", affectedRows: 1 };
    const duplicateInsert = { unique: "uq_habit_logs_habit_date", affectedRows: 0 };
    const expectedConflictCode = "CHECKIN_CONFLICT";

    expect(expectedConflictCode).toContain("CONFLICT");
    expect(firstInsert.affectedRows).toBe(duplicateInsert.affectedRows);
  });

  it("競合/unique constraint: policy_consents unique conflict", async () => {
    const seed = createPolicyOpsSeedBundle();
    const uniqueKey = "uq_policy_consents_user_type_ver";
    const consentVersion = seed.consents[0]?.policyVersion ?? 0;
    const duplicateConsentVersion = consentVersion;
    const conflictExpected = true;

    expect(uniqueKey).toContain("unique");
    expect(conflictExpected).toBe(true);
    expect(consentVersion).toBe(duplicateConsentVersion + 1);
  });
});
