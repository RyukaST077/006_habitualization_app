import { NAVIGATION_FLOW } from "./navigation-flow";
import { ROUTE_MAP } from "./route-map";
import type { ScreenId } from "../screens/types";
import { resolveErrorPresentation, type CommonErrorCode, type ErrorPresentation, type ErrorStatus } from "../ui/error-presentation";
import { resolveFooterViewModel, type FooterViewModel } from "../ui/footer";
import { resolveHeaderViewModel, type HeaderViewModel } from "../ui/header";

export type AuthState = "unauthenticated" | "authenticated";
export type ConsentState = "unknown" | "agreed" | "rejected";
export type GuardTarget = "/home" | "/habits/new" | "/history" | "/analytics" | "/settings";
export const PROTECTED_PATHS: readonly GuardTarget[] = ["/home", "/habits/new", "/history", "/analytics", "/settings"];

export type RouteDefinition = {
  screenId: ScreenId;
  path: string;
  next: readonly ScreenId[];
};

export type HomeNavigationTarget = (typeof NAVIGATION_FLOW)["SCR-002"][number];
export type CommonUiRouteViewModel = {
  routePath: string;
  header: HeaderViewModel;
  footer: FooterViewModel;
  traceIdFieldName: ErrorPresentation["traceIdLabel"];
  error: ErrorPresentation | null;
};
export type CommonUiRouteViewModelWithError = Omit<CommonUiRouteViewModel, "error"> & {
  error: ErrorPresentation;
};

export const AUTH_CONSENT_ROUTES: readonly RouteDefinition[] = [
  {
    screenId: "SCR-001",
    path: ROUTE_MAP["SCR-001"],
    next: NAVIGATION_FLOW["SCR-001"],
  },
  {
    screenId: "SCR-008",
    path: ROUTE_MAP["SCR-008"],
    next: NAVIGATION_FLOW["SCR-008"],
  },
  {
    screenId: "SCR-002",
    path: ROUTE_MAP["SCR-002"],
    next: NAVIGATION_FLOW["SCR-002"],
  },
] as const;

export const BUSINESS_ROUTES: readonly RouteDefinition[] = [
  {
    screenId: "SCR-003",
    path: ROUTE_MAP["SCR-003"],
    next: NAVIGATION_FLOW["SCR-003"],
  },
  {
    screenId: "SCR-004",
    path: ROUTE_MAP["SCR-004"],
    next: NAVIGATION_FLOW["SCR-004"],
  },
  {
    screenId: "SCR-005",
    path: ROUTE_MAP["SCR-005"],
    next: NAVIGATION_FLOW["SCR-005"],
  },
  {
    screenId: "SCR-006",
    // S-MOCK-04: analytics route is retained to preserve SCR-002 -> SCR-006 navigation while feature is mocked.
    path: ROUTE_MAP["SCR-006"],
    next: NAVIGATION_FLOW["SCR-006"],
  },
  {
    screenId: "SCR-007",
    path: ROUTE_MAP["SCR-007"],
    next: NAVIGATION_FLOW["SCR-007"],
  },
] as const;

function isConsentRequiredPath(startPath: string): boolean {
  return (
    startPath === ROUTE_MAP["SCR-002"] ||
    startPath === ROUTE_MAP["SCR-003"] ||
    startPath === ROUTE_MAP["SCR-005"] ||
    startPath === ROUTE_MAP["SCR-006"] ||
    startPath === ROUTE_MAP["SCR-007"] ||
    /^\/habits\/[^/]+\/edit$/.test(startPath)
  );
}

export function resolveAuthConsentRedirect(
  startPath: string,
  authState: AuthState,
  consentState: ConsentState
): string {
  if (authState === "unauthenticated") {
    return ROUTE_MAP["SCR-001"];
  }

  if (startPath === ROUTE_MAP["SCR-001"]) {
    return consentState === "agreed" ? ROUTE_MAP["SCR-002"] : ROUTE_MAP["SCR-008"];
  }

  if (consentState === "rejected") {
    return ROUTE_MAP["SCR-001"];
  }

  if (startPath === ROUTE_MAP["SCR-008"]) {
    return ROUTE_MAP["SCR-002"];
  }

  if (isConsentRequiredPath(startPath) && consentState !== "agreed") {
    return ROUTE_MAP["SCR-008"];
  }

  return startPath;
}

export function resolveHomeNavigationRedirect(targetScreenId: HomeNavigationTarget): string {
  return ROUTE_MAP[targetScreenId];
}

export function resolveCommonUiRouteViewModel(routePath: string): CommonUiRouteViewModel;
export function resolveCommonUiRouteViewModel(
  routePath: string,
  error: {
    status: ErrorStatus;
    code: CommonErrorCode;
    traceId?: string;
  }
): CommonUiRouteViewModelWithError;
export function resolveCommonUiRouteViewModel(
  routePath: string,
  error?: {
    status: ErrorStatus;
    code: CommonErrorCode;
    traceId?: string;
  }
): CommonUiRouteViewModel | CommonUiRouteViewModelWithError {
  return {
    routePath,
    header: resolveHeaderViewModel(),
    footer: resolveFooterViewModel(),
    traceIdFieldName: "trace_id",
    error: error ? resolveErrorPresentation(error.status, error.code, error.traceId) : null,
  };
}

export function resolveProtectedRouteGuard(
  state: { isAuthenticated: boolean; hasConsented: boolean },
  target: GuardTarget
): "/login" | "/policy-consent" | null {
  if (!PROTECTED_PATHS.includes(target)) {
    return null;
  }

  if (!state.isAuthenticated) {
    return ROUTE_MAP["SCR-001"];
  }

  if (!state.hasConsented) {
    return ROUTE_MAP["SCR-008"];
  }

  return null;
}
