import { expect, test } from "@playwright/test";
import { resolveCommonUiRouteViewModel, resolveHomeNavigationRedirect, resolveProtectedRouteGuard } from "../../../src/app/router";
import type { GuardTarget } from "../../../src/app/router";
import { ROUTE_MAP } from "../../../src/app/route-map";
import { SCR002HomePage } from "../../../src/screens/SCR-002HomePage";
import { SCR006AnalyticsPage } from "../../../src/screens/SCR-006AnalyticsPage";
import { createUnauthenticatedGuardEnv, createUnconsentedGuardEnv } from "../../helpers/env-guard";
import type { AuthGuardTestEnv } from "../../helpers/env-guard";

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
  status: 400 | 401 | 403 | 409 | 500;
  code: "VALIDATION_ERROR" | "AUTH_FAILED" | "FORBIDDEN" | "DOMAIN_CONFLICT" | "INTERNAL_ERROR";
  hasCommonBanner: boolean;
  traceIdFieldName: "trace_id";
  shouldExposeTraceId: boolean;
};

async function expectHomeNavigationRedirectEventually(
  toScreenId: HomeNavigationCase["toScreenId"],
  expectedPath: string
): Promise<void> {
  await expect
    .poll(() => resolveHomeNavigationRedirect(toScreenId), {
      message: `${toScreenId} should resolve to ${expectedPath}`,
    })
    .toBe(expectedPath);
}

async function expectProtectedRouteGuardEventually(
  state: AuthGuardTestEnv["state"],
  targetPath: GuardTarget,
  expectedRedirect: AuthGuardTestEnv["expectedRedirect"]
): Promise<void> {
  await expect
    .poll(() => resolveProtectedRouteGuard(state, targetPath), {
      message: `guard should resolve target ${targetPath} to ${String(expectedRedirect)}`,
    })
    .toBe(expectedRedirect);
}

function observeCommonErrorUi(route: string, status: CommonErrorUiObservation["status"]): CommonErrorUiObservation {
  const codeMap: Record<CommonErrorUiObservation["status"], CommonErrorUiObservation["code"]> = {
    400: "VALIDATION_ERROR",
    401: "AUTH_FAILED",
    403: "FORBIDDEN",
    409: "DOMAIN_CONFLICT",
    500: "INTERNAL_ERROR",
  };
  const code = codeMap[status];
  const commonUi = resolveCommonUiRouteViewModel(route, { status, code });
  const error = commonUi.error;

  return {
    route,
    status,
    code,
    hasCommonBanner: commonUi.header.logoLabel !== null && commonUi.footer.copyright !== null,
    traceIdFieldName: error.traceIdLabel,
    shouldExposeTraceId: error.visibleTraceId !== null,
  };
}

test.describe("T-011 PR-003 home navigation tests", () => {
  for (const navCase of HOME_NAVIGATION_CASES) {
    test(`${navCase.id} ${navCase.traceIds.join("/")}: /home -> ${navCase.to}`, async () => {
      await test.step(`navigate /home to ${navCase.to}`, async () => {
        await expectHomeNavigationRedirectEventually(navCase.toScreenId, navCase.to);
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

      if (navCase.toScreenId === "SCR-006") {
        await test.step("SCR-006 mock route keeps round-trip path to /home", async () => {
          let didNavigateBackHome = false;
          const analyticsScreen = SCR006AnalyticsPage({
            screenId: "SCR-006",
            handlers: {
              onBackHome: () => {
                didNavigateBackHome = true;
              },
            },
          });

          expect(analyticsScreen.mockLabel).toBe("モック画面");
          expect(analyticsScreen.actions.backHomeLabel).toBe("ホームに戻る");
          analyticsScreen.actions.backHome();
          expect(didNavigateBackHome).toBe(true);
          expect(ROUTE_MAP["SCR-006"]).toBe("/analytics");
          expect(ROUTE_MAP["SCR-002"]).toBe("/home");
        });
      }
    });
  }

  test("unauthenticated user should redirect login when trying protected transitions", async () => {
    const authEnv = createUnauthenticatedGuardEnv();

    await test.step("redirect to /login is required for unauthenticated access to protected path", async () => {
      await expectProtectedRouteGuardEventually(authEnv.state, "/habits/new", authEnv.expectedRedirect);
    });
  });

  test("authenticated but unconsented user should redirect policy-consent before home navigation", async () => {
    const authEnv = createUnconsentedGuardEnv();

    await test.step("redirect to /policy-consent is required for consent gate", async () => {
      await expectProtectedRouteGuardEventually(authEnv.state, "/settings", authEnv.expectedRedirect);
    });
  });

  test("home flow exposes common error observation for INTERNAL_ERROR(500)", async () => {
    const homeScreen = SCR002HomePage({ screenId: "SCR-002" });
    const error = homeScreen.actions.resolveError(500, "INTERNAL_ERROR", "HOME-FLOW-500");
    const observation: CommonErrorUiObservation = {
      route: "/home",
      status: error.status,
      code: error.code,
      hasCommonBanner:
        homeScreen.commonUi.header.logoLabel !== null && homeScreen.commonUi.footer.copyright !== null,
      traceIdFieldName: error.traceIdLabel,
      shouldExposeTraceId: error.visibleTraceId !== null,
    };

    await test.step("500 INTERNAL_ERROR exposes trace_id in common UI", async () => {
      expect(observation.route).toBe("/home");
      expect(observation.code).toBe("INTERNAL_ERROR");
      expect(observation.traceIdFieldName).toBe("trace_id");
      expect(observation.shouldExposeTraceId).toBe(true);
    });
  });
});
