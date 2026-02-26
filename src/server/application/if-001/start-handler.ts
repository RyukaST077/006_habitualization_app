import { isAppError } from "../common/AppError";
import { normalizeTraceId } from "../common/trace-id";
import type { AuthSessionService } from "../auth/AuthSessionService";
import type { If001StartApiRequest, If001StartApiResponse } from "./contracts";

interface If001StartHandlerDeps {
  authSessionService: Pick<AuthSessionService, "startGoogleLogin">;
}

type If001StartErrorCode = "INVALID_REDIRECT" | "AUTH_PROVIDER_ERROR";

function hasAuthorizationHeader(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function mapAppErrorToResponse(error: unknown): { status: 400 | 500; code: If001StartErrorCode; traceId: string } {
  const traceId = normalizeTraceId(isAppError(error) ? error.traceId : "if001-start-provider-error");
  if (!isAppError(error)) {
    return { status: 500, code: "AUTH_PROVIDER_ERROR", traceId };
  }

  const responseByCode: Record<If001StartErrorCode, { status: 400 | 500; code: If001StartErrorCode }> = {
    INVALID_REDIRECT: { status: 400, code: "INVALID_REDIRECT" },
    AUTH_PROVIDER_ERROR: { status: 500, code: "AUTH_PROVIDER_ERROR" },
  };

  const mapped = responseByCode[error.code as If001StartErrorCode] ?? {
    status: 500,
    code: "AUTH_PROVIDER_ERROR" as const,
  };
  return {
    status: mapped.status,
    code: mapped.code,
    traceId,
  };
}

export function createIf001StartHandler(deps: If001StartHandlerDeps): (request: If001StartApiRequest) => Promise<If001StartApiResponse> {
  return async (request: If001StartApiRequest): Promise<If001StartApiResponse> => {
    if (!hasAuthorizationHeader(request.authorization)) {
      return {
        status: 401,
        body: {
          code: "AUTH_FAILED",
          trace_id: normalizeTraceId("if001-start-auth-failed"),
          route: "SCR-001",
          audit_action: "LOGIN_FAILED",
        },
      };
    }

    try {
      const result = await deps.authSessionService.startGoogleLogin(request.redirectTo ?? "");
      return {
        status: 200,
        body: {
          auth_url: result.authUrl,
          trace_id: result.traceId,
          audit_action: result.auditAction,
        },
      };
    } catch (error: unknown) {
      const mapped = mapAppErrorToResponse(error);
      return {
        status: mapped.status,
        body: {
          code: mapped.code,
          trace_id: mapped.traceId,
          route: "SCR-001",
          audit_action: "LOGIN_FAILED",
        },
      };
    }
  };
}
