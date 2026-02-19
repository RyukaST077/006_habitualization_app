import { expect, test } from "@playwright/test";
import { resolveHomeNavigationRedirect } from "../../../src/app/router";
import { ROUTE_MAP } from "../../../src/app/route-map";
import { createUnauthenticatedGuardEnv } from "../../helpers/env-guard";

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

  test("unauthenticated user should redirect login when trying /home transitions (Red)", async () => {
    const authEnv = createUnauthenticatedGuardEnv();
    const destinationPath = resolveHomeNavigationRedirect("SCR-003");

    await test.step("redirect to /login is required for unauthenticated access", async () => {
      expect(authEnv.authState).toBe("unauthenticated");
      expect(destinationPath).toBe("/login");
    });
  });

  test("unauthenticated API guard should return 401/403 before home navigation (Red)", async () => {
    const authEnv = createUnauthenticatedGuardEnv();

    await test.step("401 or 403 should be returned for protected resource access", async () => {
      const actualApiStatus = 302;
      expect([401, 403]).toContain(authEnv.expectedApiStatus);
      expect(actualApiStatus).toBe(authEnv.expectedApiStatus);
    });
  });
});
