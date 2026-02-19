import { describe, expect, it } from "vitest";
import { resolveProtectedRouteGuard } from "../../../src/app/router";

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

const UNAUTHENTICATED_TARGETS: readonly GuardTarget[] = ["/home", "/habits/new", "/history", "/analytics", "/settings"];
const UNCONSENTED_TARGETS: readonly GuardTarget[] = ["/home", "/habits/new", "/history", "/analytics", "/settings"];

describe("T-011 PR-004 route guard tests", () => {
  it("未認証・未同意の保護画面アクセスはログインへリダイレクト", () => {
    const guardCase = GUARD_CASES[0];
    const redirect = resolveProtectedRouteGuard(guardCase.state, guardCase.target);
    expect(redirect, guardCase.traceIds.join("/")).toBe(guardCase.expectedRedirect);
  });

  it("認証済み・未同意の保護画面アクセスは同意画面へリダイレクト", () => {
    const guardCase = GUARD_CASES[1];
    const redirect = resolveProtectedRouteGuard(guardCase.state, guardCase.target);
    expect(redirect, guardCase.traceIds.join("/")).toBe(guardCase.expectedRedirect);
  });

  it("認証済み・同意済みの場合は保護画面アクセスを許可", () => {
    const guardCase = GUARD_CASES[2];
    const redirect = resolveProtectedRouteGuard(guardCase.state, guardCase.target);
    expect(redirect, guardCase.traceIds.join("/")).toBe(guardCase.expectedRedirect);
  });

  it("unauthenticated ユーザーはすべての保護画面で FORBIDDEN 扱いとして /login へリダイレクト", () => {
    for (const target of UNAUTHENTICATED_TARGETS) {
      const redirect = resolveProtectedRouteGuard({ isAuthenticated: false, hasConsented: false }, target);
      expect(redirect, `unauthenticated:${target}:FORBIDDEN`).toBe("/login");
    }
  });

  it("consent 未完了ユーザーは /policy-consent へ強制遷移される", () => {
    for (const target of UNCONSENTED_TARGETS) {
      const redirect = resolveProtectedRouteGuard({ isAuthenticated: true, hasConsented: false }, target);
      expect(redirect, `consent-required:${target}:FORBIDDEN`).toBe("/policy-consent");
    }
  });

  it("unauthenticated API access should return 401 (Red)", () => {
    const redirect = resolveProtectedRouteGuard(
      { isAuthenticated: false, hasConsented: false },
      "/home"
    );
    const apiStatus = redirect === "/login" ? 302 : 200;
    expect(apiStatus, "redirect login is not equivalent to API 401").toBe(401);
  });

  it("authenticated but missing consent API access should return 403 (Red)", () => {
    const redirect = resolveProtectedRouteGuard(
      { isAuthenticated: true, hasConsented: false },
      "/history"
    );
    const apiStatus = redirect === "/policy-consent" ? 302 : 200;
    expect(apiStatus, "redirect policy-consent is not equivalent to API 403").toBe(403);
  });
});
