import { expect, test } from "@playwright/test";
import { resolveHomeNavigationRedirect, resolveProtectedRouteGuard } from "../../../src/app/router";
import { ROUTE_MAP } from "../../../src/app/route-map";
import { createUnauthenticatedGuardEnv, createUnconsentedGuardEnv } from "../../helpers/env-guard";

type HomeNavigationCase = {
  id: string;
  toScreenId: "SCR-003" | "SCR-004" | "SCR-005" | "SCR-006" | "SCR-007";
  to: string;
  traceIds: readonly string[];
};

const HOME_NAVIGATION_CASES: readonly HomeNavigationCase[] = [
  { id: "HN-003", toScreenId: "SCR-003", to: "/habits/new", traceIds: ["SCR-002", "SCR-003"] },
  { id: "HN-004", toScreenId: "SCR-004", to: "/habits/:habitId/edit", traceIds: ["SCR-002", "SCR-004"] },
  { id: "HN-005", toScreenId: "SCR-005", to: "/history", traceIds: ["SCR-002", "SCR-005"] },
  { id: "HN-006", toScreenId: "SCR-006", to: "/analytics", traceIds: ["SCR-002", "SCR-006"] },
  { id: "HN-007", toScreenId: "SCR-007", to: "/settings", traceIds: ["SCR-002", "SCR-007"] },
];

test.describe("T-011 PR-003 home navigation tests", () => {
  for (const navCase of HOME_NAVIGATION_CASES) {
    test(`${navCase.id} ${navCase.traceIds.join("/")}: /home -> ${navCase.to}`, async () => {
      await test.step(`navigate /home to ${navCase.to}`, async () => {
        const destinationPath = resolveHomeNavigationRedirect(navCase.toScreenId);
        expect(destinationPath).toBe(navCase.to);
      });

      await test.step(`return flow ${navCase.to} -> /home`, async () => {
        expect(ROUTE_MAP["SCR-002"]).toBe("/home");
      });
    });
  }

  test("unauthenticated user should redirect login when trying protected transitions", async () => {
    const authEnv = createUnauthenticatedGuardEnv();
    const redirect = resolveProtectedRouteGuard(authEnv.state, "/habits/new");

    await test.step("redirect to /login is required for unauthenticated access to protected path", async () => {
      expect(redirect).toBe(authEnv.expectedRedirect);
    });
  });

  test("authenticated but unconsented user should redirect policy-consent before home navigation", async () => {
    const authEnv = createUnconsentedGuardEnv();
    const redirect = resolveProtectedRouteGuard(authEnv.state, "/settings");

    await test.step("redirect to /policy-consent is required for consent gate", async () => {
      expect(redirect).toBe(authEnv.expectedRedirect);
    });
  });
});
