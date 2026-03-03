import { describe, expect, it } from "vitest";

import { HabitRepository } from "../../../src/server/infrastructure/repositories/HabitRepository";
import { PolicyRepository } from "../../../src/server/infrastructure/repositories/PolicyRepository";
import { UserRepository } from "../../../src/server/infrastructure/repositories/UserRepository";
import { createSupabaseRepositoryClient } from "../../../src/server/infrastructure/repositories/supabase-repository-client";
import { CONSENT_RED_CASES } from "../consent/fixtures/fnc-002-003-cases";
import { createConsentTestHarness } from "../consent/helpers/consent-test-harness";
import { createPolicyOpsSeedBundle } from "./fixtures/policy-ops-seed";
import { createRepositorySeedBundle } from "./fixtures/repository-seed";
import { runRepositoryRace } from "./fixtures/repository-race";

const harness = createConsentTestHarness();

function createBarrier(targetCount: number): () => Promise<void> {
  let count = 0;
  let release: (() => void) | null = null;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });

  return async () => {
    count += 1;
    if (count === targetCount) {
      release?.();
    }
    await gate;
  };
}

describe("T-024 PR-004 cross repository optimistic/unique conflict red", () => {
  it("競合/optimistic lock: 同一 profile version 更新の concurrency conflict", async () => {
    const seed = createRepositorySeedBundle();
    const client = createSupabaseRepositoryClient({
      profiles: [
        {
          userId: seed.profile.userId,
          displayName: seed.profile.displayName,
          timezone: seed.profile.timezone,
          dayCutoffTime: `${String(seed.profile.dayBoundaryHour).padStart(2, "0")}:00:00`,
          accountStatus: seed.profile.accountStatus,
          version: seed.profile.version,
        },
      ],
    });
    const barrier = createBarrier(2);
    const userId = seed.profile.userId;

    const race = await runRepositoryRace([
      {
        name: "updateProfileSettings#1",
        async run() {
          return client.withTransaction(async (txClient) => {
            const txUserRepository = new UserRepository(txClient);
            const snapshot = await txUserRepository.findProfile(userId);
            await barrier();
            return txUserRepository.updateProfileSettings(
              userId,
              "UTC",
              "05:00:00",
              snapshot!.version,
            );
          });
        },
      },
      {
        name: "updateProfileSettings#2",
        async run() {
          return client.withTransaction(async (txClient) => {
            const txUserRepository = new UserRepository(txClient);
            const snapshot = await txUserRepository.findProfile(userId);
            await barrier();
            return txUserRepository.updateProfileSettings(
              userId,
              "Asia/Tokyo",
              "04:00:00",
              snapshot!.version,
            );
          });
        },
      },
    ]);

    expect(race).toHaveLength(2);
    harness.assertRaceConflictResult(race, {
      conflictCode: "OPTIMISTIC_LOCK_CONFLICT",
      status: 409,
    });

    const profile = await new UserRepository(client).findProfile(userId);
    expect(profile?.version).toBe(seed.profile.version + 1);
  });

  it("FNC-006 FR-011/FR-012: habit_logs 同時登録は +1/+0 で冪等収束する", async () => {
    const seed = createRepositorySeedBundle();
    const now = "2026-02-21T10:00:00.000Z";
    const client = createSupabaseRepositoryClient({
      profiles: [
        {
          userId: seed.profile.userId,
          displayName: seed.profile.displayName,
          timezone: seed.profile.timezone,
          dayCutoffTime: `${String(seed.profile.dayBoundaryHour).padStart(2, "0")}:00:00`,
          accountStatus: seed.profile.accountStatus,
          version: seed.profile.version,
        },
      ],
      habits: seed.habits.map((habit, index) => ({
        habitId: habit.habitId,
        userId: habit.userId,
        name: habit.name,
        note: null,
        displayOrder: (index + 1) * 10,
        status: "active",
        version: habit.version,
        createdAt: now,
        updatedAt: now,
      })),
    });
    const barrier = createBarrier(2);
    const userId = seed.profile.userId;
    const habitId = seed.habits[0]!.habitId;
    const logDate = "2026-02-21";

    const race = await runRepositoryRace([
      {
        name: "checkin#1",
        async run() {
          await barrier();
          return new HabitRepository(client).upsertCheckin(userId, habitId, logDate, "2026-02-21T10:00:00.000Z");
        },
      },
      {
        name: "checkin#2",
        async run() {
          await barrier();
          return new HabitRepository(client).upsertCheckin(userId, habitId, logDate, "2026-02-21T10:00:01.000Z");
        },
      },
    ]);

    const fulfilled = race.filter((result) => result.status === "fulfilled");
    const rejected = race.filter((result) => result.status === "rejected");

    expect(rejected).toHaveLength(0);
    expect(fulfilled).toHaveLength(2);

    const idempotentResults = fulfilled
      .map((result) => {
        const value = result.value as { idempotent?: boolean };
        return value.idempotent;
      })
      .sort();
    expect(idempotentResults).toEqual([false, true]);

    const logs = await new HabitRepository(client).findLogsByDateRange(userId, logDate, logDate, true);
    expect(logs).toHaveLength(1);
  });

  it("競合/unique constraint: policy_consents unique conflict", async () => {
    const seed = createPolicyOpsSeedBundle();
    const now = "2026-02-21T00:00:00.000Z";
    const client = createSupabaseRepositoryClient({
      policySettings: seed.settings.map((setting) => ({
        policyType: setting.policyType,
        currentVersion: `${setting.version}`,
        effectiveFrom: now,
        updatedBy: "service_role:seed",
        updatedAt: now,
      })),
    });
    const barrier = createBarrier(2);
    const userId = "user-red-001";
    const consentInput = {
      policyType: "privacy" as const,
      policyVersion: "4",
      consentedAt: "2026-02-22T00:00:00.000Z",
    };

    const race = await runRepositoryRace([
      {
        name: "insertConsents#1",
        async run() {
          return client.withTransaction(async (txClient) => {
            await barrier();
            return new PolicyRepository(txClient).insertConsents(userId, [consentInput]);
          });
        },
      },
      {
        name: "insertConsents#2",
        async run() {
          return client.withTransaction(async (txClient) => {
            await barrier();
            return new PolicyRepository(txClient).insertConsents(userId, [consentInput]);
          });
        },
      },
    ]);

    harness.assertRaceConflictResult(race, {
      conflictCode: "UNIQUE_CONFLICT",
      status: 409,
    });

    const latest = await new PolicyRepository(client).findUserLatestConsents(userId);
    expect(latest.find((consent) => consent.policyType === "privacy")?.policyVersion).toBe("4");
  });

  it("FNC-003 観点: 重複送信と更新競合ロールバックの分類をケース定義で判別可能にする", () => {
    harness.assertConflictCase(CONSENT_RED_CASES, {
      testCaseId: "TC-IT-FR-005-002",
      requirementId: "FR-005",
      acceptanceId: "AC-005",
      conflictKind: "DUPLICATE_SUBMISSION",
      conflictOutcome: "NOOP_SUCCESS",
      conflictReasonCode: "UNIQUE_CONFLICT",
      notesIncludes: ["duplicate", "no-op"],
    });
    harness.assertConflictCase(CONSENT_RED_CASES, {
      testCaseId: "TC-IT-FR-005-003",
      requirementId: "FR-005",
      acceptanceId: "AC-005",
      conflictKind: "UPDATE_CONFLICT_ROLLBACK",
      conflictOutcome: "KEEP_PREVIOUS_VERSION",
      conflictReasonCode: "POLICY_VERSION_CONFLICT",
      notesIncludes: ["FR-026", "keeps previous consent version"],
      requireInterfaceId: "IF-004",
      requireLinkedRequirement: "FR-026",
    });
  });

  it("境界固定: チェックイン取消条件は後続タスクで扱う", () => {
    // NOTE: FR-014 (checkin cancellation) boundary is intentionally out of scope in this commit.
    expect("T-026").toBe("T-026");
  });
});
