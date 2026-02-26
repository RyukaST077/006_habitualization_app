import { randomUUID } from "node:crypto";

import { createAppError, isAppError } from "../common/AppError";
import { normalizeTraceId } from "../common/trace-id";
import type { If001CallbackDecisionResult, If001ConsentDeclineLogoutResult } from "../if-001/types";
import type { SupabaseAuthGatewayContract } from "./SupabaseAuthGateway";

const AUTH_REQUIREMENT_ID = "FR-001";
const ACTOR_ROLE = "user";
const TARGET_TYPE = "auth_session";

const LOGIN_START = "LOGIN_START";
const LOGIN_SUCCESS = "LOGIN_SUCCESS";
const LOGIN_FAILED = "LOGIN_FAILED";

export interface AuthSessionAuditLogPort {
  record(input: {
    actorRole: string;
    action: string;
    targetType: string;
    targetId: string;
    result: string;
    requirementId: string;
    traceId: string;
    metadata?: Record<string, unknown>;
    actorUserId?: string | null;
  }): Promise<unknown>;
}

export interface ConsentStatusPort {
  hasConsented(userId: string): Promise<boolean>;
}

export interface StartGoogleLoginResult {
  authUrl: string;
  traceId: string;
  auditAction: "LOGIN_START";
}

function isValidRedirectTo(redirectTo: string): boolean {
  if (redirectTo.trim() !== redirectTo) {
    return false;
  }
  if (!redirectTo.startsWith("/") || redirectTo.startsWith("//")) {
    return false;
  }
  if (redirectTo.includes("\n") || redirectTo.includes("\r")) {
    return false;
  }

  return true;
}

function assertNonEmpty(value: string, fieldName: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${fieldName} is required`);
  }
}

function createTraceId(label: string): string {
  return normalizeTraceId(`if001-${label}-${randomUUID()}`);
}

export class AuthSessionService {
  public constructor(
    private readonly authGateway: SupabaseAuthGatewayContract,
    private readonly consentStatusPort: ConsentStatusPort,
    private readonly auditLogService: AuthSessionAuditLogPort,
  ) {}

  public async startGoogleLogin(redirectTo: string): Promise<StartGoogleLoginResult> {
    const traceId = createTraceId("login-start");

    if (!isValidRedirectTo(redirectTo)) {
      await this.recordAudit(LOGIN_FAILED, "FAILED", "invalid_redirect", traceId, null, { redirectTo });
      throw createAppError({
        code: "INVALID_REDIRECT",
        message: "redirectTo must be an internal path",
        requirementId: AUTH_REQUIREMENT_ID,
        traceId,
      });
    }

    try {
      const authUrl = await this.authGateway.buildGoogleOAuthUrl(redirectTo);
      await this.recordAudit(LOGIN_START, "SUCCESS", "google_oauth", traceId, null, { redirectTo });

      return {
        authUrl,
        traceId,
        auditAction: LOGIN_START,
      };
    } catch (error: unknown) {
      if (isAppError(error)) {
        throw error;
      }

      await this.recordAudit(LOGIN_FAILED, "FAILED", "google_oauth", traceId, null, { redirectTo });
      throw createAppError({
        code: "AUTH_PROVIDER_ERROR",
        message: "failed to create oauth url",
        requirementId: AUTH_REQUIREMENT_ID,
        traceId,
      });
    }
  }

  public async resolvePostLogin(userId: string): Promise<If001CallbackDecisionResult> {
    assertNonEmpty(userId, "userId");
    const traceId = createTraceId("post-login");
    const isConsented = await this.consentStatusPort.hasConsented(userId);

    if (isConsented) {
      await this.recordAudit(LOGIN_SUCCESS, "SUCCESS", userId, traceId, userId);
      return { route: "SCR-002" };
    }

    await this.recordAudit(LOGIN_FAILED, "FAILED", userId, traceId, userId, { reason: "consent_required" });
    return { route: "SCR-008" };
  }

  public async rejectConsentAndLogout(userId: string): Promise<If001ConsentDeclineLogoutResult> {
    assertNonEmpty(userId, "userId");
    const traceId = createTraceId("consent-declined");

    await this.authGateway.clearSession(userId);
    await this.recordAudit(LOGIN_FAILED, "FAILED", userId, traceId, userId, { reason: "consent_declined" });

    return {
      route: "SCR-001",
      sessionCleared: true,
      auditAction: LOGIN_FAILED,
    };
  }

  private async recordAudit(
    action: string,
    result: string,
    targetId: string,
    traceId: string,
    actorUserId?: string | null,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.auditLogService.record({
      actorRole: ACTOR_ROLE,
      action,
      targetType: TARGET_TYPE,
      targetId,
      result,
      requirementId: AUTH_REQUIREMENT_ID,
      traceId,
      metadata,
      actorUserId,
    });
  }
}
