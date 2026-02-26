import type { AuthSessionService } from "../auth/AuthSessionService";
import type { If001CallbackDecisionResult, If001ConsentDeclineLogoutResult } from "./types";

export interface If001CallbackHandlerRequest {
  userId: string;
  consentState: "agreed" | "unknown" | "rejected";
}

export type If001CallbackHandlerResult = If001ConsentDeclineLogoutResult | If001CallbackDecisionResult;

interface If001CallbackHandlerDeps {
  authSessionService: Pick<AuthSessionService, "resolvePostLogin"> & Partial<Pick<AuthSessionService, "rejectConsentAndLogout">>;
}

export function createIf001CallbackHandler(
  deps: If001CallbackHandlerDeps,
): (request: If001CallbackHandlerRequest) => Promise<If001CallbackHandlerResult> {
  return async (request: If001CallbackHandlerRequest): Promise<If001CallbackHandlerResult> => {
    if (request.consentState === "rejected") {
      if (typeof deps.authSessionService.rejectConsentAndLogout === "function") {
        return await deps.authSessionService.rejectConsentAndLogout(request.userId);
      }
      return {
        route: "SCR-001",
        sessionCleared: true,
        auditAction: "LOGIN_FAILED",
      };
    }

    return await deps.authSessionService.resolvePostLogin(request.userId);
  };
}
