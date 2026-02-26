import { randomUUID } from "node:crypto";

import { createAppError, isAppError } from "../common/AppError";
import { normalizeTraceId } from "../common/trace-id";
import type { If001CallbackDecisionResult, If001ConsentDeclineLogoutResult } from "../if-001/types";
import type { SupabaseAuthGatewayContract } from "./SupabaseAuthGateway";

const AUTH_REQUIREMENT_ID = "FR-001";
const CONSENT_REQUIREMENT_ID = "FR-026";
const ACTOR_ROLE = "user";
const TARGET_TYPE = "auth_session";
const CONSENT_TARGET_TYPE = "policy_consents";

const LOGIN_START = "LOGIN_START";
const LOGIN_FAILED = "LOGIN_FAILED";
const POLICY_CONSENT_ACCEPT = "POLICY_CONSENT_ACCEPT";
const POLICY_CONSENT_REJECT = "POLICY_CONSENT_REJECT";
type LoginAuditAction = typeof LOGIN_START | "LOGIN_SUCCESS" | typeof LOGIN_FAILED;
type LoginAuditResult = "SUCCESS" | "FAILED";
type ConsentAuditAction = typeof POLICY_CONSENT_ACCEPT | typeof POLICY_CONSENT_REJECT;
type ConsentAuditResult = "SUCCESS" | "FAILED";

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

type StartGoogleLoginErrorCode = "INVALID_REDIRECT" | "AUTH_PROVIDER_ERROR";

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
      await this.recordAudit({
        action: LOGIN_FAILED,
        result: "FAILED",
        targetId: "invalid_redirect",
        traceId,
        actorUserId: null,
        metadata: { redirectTo },
      });
      throw this.createStartGoogleLoginError("INVALID_REDIRECT", traceId, "redirectTo must be an internal path");
    }

    try {
      const authUrl = await this.authGateway.buildGoogleOAuthUrl(redirectTo);
      await this.recordAudit({
        action: LOGIN_START,
        result: "SUCCESS",
        targetId: "google_oauth",
        traceId,
        actorUserId: null,
        metadata: { redirectTo },
      });

      return {
        authUrl,
        traceId,
        auditAction: LOGIN_START,
      };
    } catch (error: unknown) {
      await this.recordAudit({
        action: LOGIN_FAILED,
        result: "FAILED",
        targetId: "google_oauth",
        traceId,
        actorUserId: null,
        metadata: { redirectTo },
      });
      throw this.mapStartGoogleLoginError(error, traceId);
    }
  }

  public async resolvePostLogin(userId: string): Promise<If001CallbackDecisionResult> {
    assertNonEmpty(userId, "userId");
    const traceId = createTraceId("post-login");
    const isConsented = await this.consentStatusPort.hasConsented(userId);

    if (isConsented) {
      await this.recordConsentAudit({
        action: POLICY_CONSENT_ACCEPT,
        result: "SUCCESS",
        targetId: userId,
        traceId,
        actorUserId: userId,
        metadata: { policy_type: ["terms", "privacy"] },
      });
      return { route: "SCR-002" };
    }

    await this.recordConsentAudit({
      action: POLICY_CONSENT_ACCEPT,
      result: "FAILED",
      targetId: userId,
      traceId,
      actorUserId: userId,
      metadata: {
        reason: "consent_required",
        policy_type: ["terms", "privacy"],
      },
    });
    return { route: "SCR-008" };
  }

  public async rejectConsentAndLogout(userId: string): Promise<If001ConsentDeclineLogoutResult> {
    assertNonEmpty(userId, "userId");
    const traceId = createTraceId("consent-declined");

    await this.authGateway.clearSession(userId);
    await this.recordConsentAudit({
      action: POLICY_CONSENT_REJECT,
      result: "FAILED",
      targetId: userId,
      traceId,
      actorUserId: userId,
      metadata: {
        reason: "consent_declined",
        policy_type: ["terms", "privacy"],
      },
    });

    return {
      route: "SCR-001",
      sessionCleared: true,
      auditAction: POLICY_CONSENT_REJECT,
    };
  }

  private createLoginAuditRecord(input: {
    action: LoginAuditAction;
    result: LoginAuditResult;
    targetId: string;
    traceId: string;
    actorUserId?: string | null,
    metadata?: Record<string, unknown>;
  }): Parameters<AuthSessionAuditLogPort["record"]>[0] {
    return {
      actorRole: ACTOR_ROLE,
      action: input.action,
      targetType: TARGET_TYPE,
      targetId: input.targetId,
      result: input.result,
      requirementId: AUTH_REQUIREMENT_ID,
      traceId: input.traceId,
      metadata: input.metadata,
      actorUserId: input.actorUserId,
    };
  }

  private async recordAudit(input: {
    action: LoginAuditAction;
    result: LoginAuditResult;
    targetId: string;
    traceId: string;
    actorUserId?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.auditLogService.record({
      ...this.createLoginAuditRecord(input),
    });
  }

  private createConsentAuditRecord(input: {
    action: ConsentAuditAction;
    result: ConsentAuditResult;
    targetId: string;
    traceId: string;
    actorUserId?: string | null;
    metadata?: Record<string, unknown>;
  }): Parameters<AuthSessionAuditLogPort["record"]>[0] {
    return {
      actorRole: ACTOR_ROLE,
      action: input.action,
      targetType: CONSENT_TARGET_TYPE,
      targetId: input.targetId,
      result: input.result,
      requirementId: CONSENT_REQUIREMENT_ID,
      traceId: input.traceId,
      metadata: input.metadata,
      actorUserId: input.actorUserId,
    };
  }

  private async recordConsentAudit(input: {
    action: ConsentAuditAction;
    result: ConsentAuditResult;
    targetId: string;
    traceId: string;
    actorUserId?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.auditLogService.record({
      ...this.createConsentAuditRecord(input),
    });
  }

  private mapStartGoogleLoginError(error: unknown, traceId: string) {
    if (isAppError(error) && error.code === "INVALID_REDIRECT") {
      return this.createStartGoogleLoginError("INVALID_REDIRECT", traceId, error.message);
    }
    return this.createStartGoogleLoginError("AUTH_PROVIDER_ERROR", traceId, "failed to create oauth url");
  }

  private createStartGoogleLoginError(code: StartGoogleLoginErrorCode, traceId: string, message: string) {
    return createAppError({
      code,
      message,
      requirementId: AUTH_REQUIREMENT_ID,
      traceId,
    });
  }
}
