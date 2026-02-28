import { ROUTE_MAP } from "./route-map";
import { resolveAuthConsentRedirect, type AuthState, type ConsentState } from "./router";

export type If001CallbackRoute = "SCR-001" | "SCR-002" | "SCR-008";

export type If001SessionState = {
  authState: AuthState;
  consentState: Extract<ConsentState, "unknown" | "agreed">;
  userId?: string;
};

export function resolvePolicyConsentEntryRoute(
  sessionState: If001SessionState | null,
  fallbackCallbackRoute: If001CallbackRoute | null,
): string {
  if (sessionState && sessionState.authState === "authenticated") {
    return resolveAuthConsentRedirect(ROUTE_MAP["SCR-008"], sessionState.authState, sessionState.consentState);
  }
  if (fallbackCallbackRoute === "SCR-002") {
    return ROUTE_MAP["SCR-002"];
  }
  if (fallbackCallbackRoute === "SCR-008") {
    return ROUTE_MAP["SCR-008"];
  }
  return ROUTE_MAP["SCR-001"];
}

