import { AUTH_CONSENT_SCREEN_IDS, BUSINESS_SCREEN_IDS, NAVIGATION_FLOW, PROTECTED_SCREEN_IDS, resolveNavigationTargets } from "./navigation-flow";
import { ROUTE_MAP } from "./route-map";
import type { ScreenId } from "../screens/types";
import { resolveErrorPresentation, type CommonErrorCode, type ErrorPresentation, type ErrorStatus } from "../ui/error-presentation";
import { resolveFooterViewModel, type FooterViewModel } from "../ui/footer";
import { resolveHeaderViewModel, type HeaderViewModel } from "../ui/header";

export type AuthState = "unauthenticated" | "authenticated";
export type ConsentState = "unknown" | "agreed" | "rejected";
export type GuardTarget = "/home" | "/habits/new" | "/history" | "/analytics" | "/settings";
export const PROTECTED_PATHS: readonly GuardTarget[] = PROTECTED_SCREEN_IDS.map(
  (screenId) => ROUTE_MAP[screenId]
) as readonly GuardTarget[];

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

const CONSENT_REQUIRED_PATHS = new Set(PROTECTED_PATHS);
const PROTECTED_PATHS_SET = new Set(PROTECTED_PATHS);

function resolveRouteDefinition(screenId: ScreenId): RouteDefinition {
  return {
    screenId,
    path: ROUTE_MAP[screenId],
    next: resolveNavigationTargets(screenId),
  };
}

function resolveRouteDefinitions(screenIds: readonly ScreenId[]): readonly RouteDefinition[] {
  return screenIds.map((screenId) => resolveRouteDefinition(screenId));
}

export const AUTH_CONSENT_ROUTES: readonly RouteDefinition[] = resolveRouteDefinitions(AUTH_CONSENT_SCREEN_IDS);
export const BUSINESS_ROUTES: readonly RouteDefinition[] = resolveRouteDefinitions(BUSINESS_SCREEN_IDS);

function isConsentRequiredPath(startPath: string): boolean {
  return CONSENT_REQUIRED_PATHS.has(startPath as GuardTarget) || /^\/habits\/[^/]+\/edit$/.test(startPath);
}

function resolveGuardRedirectFromState(state: { isAuthenticated: boolean; hasConsented: boolean }): "/login" | "/policy-consent" | null {
  if (!state.isAuthenticated) {
    return ROUTE_MAP["SCR-001"];
  }

  if (!state.hasConsented) {
    return ROUTE_MAP["SCR-008"];
  }

  return null;
}

export function resolveAuthConsentRedirect(
  startPath: string,
  authState: AuthState,
  consentState: ConsentState
): string {
  if (authState === "unauthenticated") {
    return ROUTE_MAP["SCR-001"];
  }

  if (consentState === "rejected") {
    return ROUTE_MAP["SCR-001"];
  }

  if (startPath === ROUTE_MAP["SCR-001"]) {
    return consentState === "agreed" ? ROUTE_MAP["SCR-002"] : ROUTE_MAP["SCR-008"];
  }

  if (startPath === ROUTE_MAP["SCR-008"]) {
    return consentState === "agreed" ? ROUTE_MAP["SCR-002"] : ROUTE_MAP["SCR-008"];
  }

  if (isConsentRequiredPath(startPath)) {
    const redirect = resolveGuardRedirectFromState({
      isAuthenticated: true,
      hasConsented: consentState === "agreed",
    });

    if (redirect !== null) {
      return redirect;
    }
  }

  return startPath;
}

export function resolveLoginArrivalRedirect(authState: AuthState, consentState: ConsentState): string {
  return resolveAuthConsentRedirect(ROUTE_MAP["SCR-001"], authState, consentState);
}

export function resolveHomeNavigationRedirect(targetScreenId: HomeNavigationTarget): string {
  return ROUTE_MAP[targetScreenId];
}

export function resolveAppRoutePaths(): readonly string[] {
  return [...AUTH_CONSENT_ROUTES, ...BUSINESS_ROUTES].map((route) => route.path);
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

export function resolveCommonUiRouteViewModels(routePaths: readonly string[]): readonly CommonUiRouteViewModel[] {
  return routePaths.map((routePath) => resolveCommonUiRouteViewModel(routePath));
}

export function resolveProtectedRouteGuard(
  state: { isAuthenticated: boolean; hasConsented: boolean },
  target: GuardTarget
): "/login" | "/policy-consent" | null {
  if (!PROTECTED_PATHS_SET.has(target)) {
    return null;
  }

  return resolveGuardRedirectFromState(state);
}
