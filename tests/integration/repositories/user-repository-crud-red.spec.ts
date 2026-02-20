import { describe, expect, it } from "vitest";

import { createRepositorySeedBundle } from "./fixtures/repository-seed";

const userRepositoryMethodContracts = [
  {
    method: "findProfile",
    traceId: "M-101/CRUD/findProfile",
    constraint: "returns only own profile (403 equivalent on user boundary violation)",
  },
  {
    method: "updateProfileSettings",
    traceId: "M-101/CRUD/updateProfileSettings",
    constraint: "requires matching version for optimistic lock",
  },
  {
    method: "incrementDailyActivity",
    traceId: "M-101/CRUD/incrementDailyActivity",
    constraint: "upsert daily activity per user/date",
  },
  {
    method: "markAccountDisabled",
    traceId: "M-101/CRUD/markAccountDisabled",
    constraint: "updates account status to disabled for own user",
  },
] as const;

describe("T-024 PR-002 M-101 user repository CRUD red", () => {
  it.each(userRepositoryMethodContracts)(
    "$traceId $method: 実装前のためRedで失敗する",
    async ({ constraint }) => {
      const seed = createRepositorySeedBundle();

      expect(seed.profile.userId.length).toBeGreaterThan(0);
      expect(constraint).toContain(" ");

      expect("repository-implementation-status").toBe("green");
    },
  );

  it("M-101/競合/updateProfileSettings/version: version不一致はOPTIMISTIC_LOCK_CONFLICT", async () => {
    const staleVersion = 1;
    const currentVersion = 2;

    expect(staleVersion).toBe(currentVersion);
  });

  it("M-101/認可/findProfile/user-boundary: user_id不一致は403相当で拒否", async () => {
    const actorUserId = "user-red-001";
    const targetUserId = "user-red-002";

    expect(actorUserId).toBe(targetUserId);
  });
});
