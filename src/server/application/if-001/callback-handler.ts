import type { AuthSessionService } from "../auth/AuthSessionService";
import type { If001CallbackDecisionResult } from "./types";

export interface If001CallbackHandlerRequest {
  userId: string;
  consentState: "agreed" | "unknown" | "rejected";
}

export type If001CallbackHandlerResult = { route: "SCR-001" } | If001CallbackDecisionResult;

interface If001CallbackHandlerDeps {
  authSessionService: Pick<AuthSessionService, "resolvePostLogin">;
}

export function createIf001CallbackHandler(
  deps: If001CallbackHandlerDeps,
): (request: If001CallbackHandlerRequest) => Promise<If001CallbackHandlerResult> {
  return async (request: If001CallbackHandlerRequest): Promise<If001CallbackHandlerResult> => {
    if (request.consentState === "rejected") {
      return { route: "SCR-001" };
    }

    return await deps.authSessionService.resolvePostLogin(request.userId);
  };
}
