import { describe, expect, it } from "vitest";

type GuardTarget = "/home" | "/habits/new" | "/history" | "/analytics" | "/settings";
type GuardState = {
  isAuthenticated: boolean;
  hasConsented: boolean;
};

type GuardCase = {
  id: string;
  state: GuardState;
  target: GuardTarget;
  expectedRedirect: "/login" | "/policy-consent" | null;
  traceIds: readonly string[];
};

const GUARD_CASES: readonly GuardCase[] = [
  {
    id: "RG-001",
    state: { isAuthenticated: false, hasConsented: false },
    target: "/home",
    expectedRedirect: "/login",
    traceIds: ["FR-003", "SCR-001", "SCR-002"],
  },
  {
    id: "RG-002",
    state: { isAuthenticated: true, hasConsented: false },
    target: "/history",
    expectedRedirect: "/policy-consent",
    traceIds: ["FR-003", "SCR-008", "SCR-004"],
  },
  {
    id: "RG-003",
    state: { isAuthenticated: true, hasConsented: true },
    target: "/analytics",
    expectedRedirect: null,
    traceIds: ["FR-003", "SCR-002", "SCR-005"],
  },
];

// Red: 実装前のためガード結果を未定義として扱う
const unresolvedGuardResult: Record<string, string | null> = {};

describe("T-010 PR-003 route guard red tests", () => {
  it("未認証・未同意の保護画面アクセスはログインへリダイレクト", () => {
    const guardCase = GUARD_CASES[0];
    expect(unresolvedGuardResult[guardCase.id], guardCase.traceIds.join("/")).toBe(
      guardCase.expectedRedirect,
    );
  });

  it("認証済み・未同意の保護画面アクセスは同意画面へリダイレクト", () => {
    const guardCase = GUARD_CASES[1];
    expect(unresolvedGuardResult[guardCase.id], guardCase.traceIds.join("/")).toBe(
      guardCase.expectedRedirect,
    );
  });

  it("認証済み・同意済みの場合は保護画面アクセスを許可", () => {
    const guardCase = GUARD_CASES[2];
    expect(unresolvedGuardResult[guardCase.id], guardCase.traceIds.join("/")).toBe(
      guardCase.expectedRedirect,
    );
  });
});
