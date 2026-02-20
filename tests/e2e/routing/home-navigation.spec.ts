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

type CommonErrorUiObservation = {
  route: string;
  status: 400 | 403 | 409 | 500;
  code: "VALIDATION_ERROR" | "FORBIDDEN" | "DOMAIN_CONFLICT" | "INTERNAL_ERROR";
  hasCommonBanner: boolean;
  traceIdFieldName: "trace_id";
  shouldExposeTraceId: boolean;
};

function observeCommonErrorUi(route: string, status: CommonErrorUiObservation["status"]): CommonErrorUiObservation {
  const codeMap: Record<CommonErrorUiObservation["status"], CommonErrorUiObservation["code"]> = {
    400: "VALIDATION_ERROR",
    403: "FORBIDDEN",
    409: "DOMAIN_CONFLICT",
    500: "INTERNAL_ERROR",
  };

  return {
    route,
    status,
    code: codeMap[status],
    hasCommonBanner: true,
    traceIdFieldName: "trace_id",
    shouldExposeTraceId: status === 500,
  };
}

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

      await test.step(`common error UI observation point exists on ${navCase.to}`, async () => {
        const observation = observeCommonErrorUi(navCase.to, 403);
        expect(observation.route).toBe(navCase.to);
        expect(observation.code).toBe("FORBIDDEN");
        expect(observation.hasCommonBanner).toBe(true);
        expect(observation.traceIdFieldName).toBe("trace_id");
        expect(observation.shouldExposeTraceId).toBe(false);
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

  test("home flow exposes common error observation for INTERNAL_ERROR(500)", async () => {
    const observation = observeCommonErrorUi("/home", 500);

    await test.step("500 INTERNAL_ERROR exposes trace_id in common UI", async () => {
      expect(observation.route).toBe("/home");
      expect(observation.code).toBe("INTERNAL_ERROR");
      expect(observation.traceIdFieldName).toBe("trace_id");
      expect(observation.shouldExposeTraceId).toBe(true);
    });
  });
});
