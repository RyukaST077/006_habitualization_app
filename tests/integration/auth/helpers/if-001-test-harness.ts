import { expect } from "vitest";
import { isAppError } from "../../../../src/server/application/common/AppError";
import { AuthSessionService, type AuthSessionAuditLogPort, type ConsentStatusPort } from "../../../../src/server/application/auth/AuthSessionService";
import type { SupabaseAuthGatewayContract } from "../../../../src/server/application/auth/SupabaseAuthGateway";
import type {
  If001StartApiRequest,
  If001StartApiResponse,
} from "../../../../src/server/application/if-001/contracts";
import type {
  If001CallbackDecisionResult,
  If001ConsentDeclineLogoutResult,
} from "../../../../src/server/application/if-001/types";

import type {
  If001CaseDefinition,
  If001ResponsibilityDefinition,
  If001RequirementId,
  If001AcceptanceId,
} from "../fixtures/if-001-cases";
import { IF001_AUDIT_EVENTS, type If001AuditAction, type If001AuditEventFixture } from "../fixtures/if-001-audit-events";
import { IF001_AUTH_USERS, type If001RouteId } from "../fixtures/if-001-users";

const T034_IMPLEMENTATION_STATE = "implemented" as const;

interface TestAuditRecord {
  action: string;
  result: string;
  traceId: string;
  actorUserId?: string | null;
}

interface HarnessServiceOptions {
  consentedUserIds: readonly string[];
  providerError: boolean;
}

export interface If001TestHarness {
  assertRequirementTrace(
    cases: readonly If001CaseDefinition[],
    requiredRequirementIds: readonly If001RequirementId[],
    requiredAcceptanceIds: readonly If001AcceptanceId[],
  ): void;
  assertResponsibilityBoundaries(
    responsibilities: readonly If001ResponsibilityDefinition[],
    requiredBoundaries: readonly If001ResponsibilityDefinition["boundary"][],
  ): void;
  assertRedPlanningCase(testCase: If001CaseDefinition): void;
  createStartApiStub(): (request: If001StartApiRequest) => Promise<If001StartApiResponse>;
  createPostLoginResolver(consentedUserIds: readonly string[]): (userId: string) => Promise<If001RouteId>;
  createConsentDeclineLogoutStub(): (userId: string) => Promise<If001ConsentDeclineLogoutResult>;
  assertAuthStartSuccessContract(response: If001StartApiResponse): void;
  assertAuthStartErrorContract(response: If001StartApiResponse, status: 400 | 401 | 500): void;
  assertPostLoginRouteDecision(route: If001RouteId, expectedRoute: If001CallbackDecisionResult["route"]): void;
  assertConsentDeclineLogout(result: If001ConsentDeclineLogoutResult): void;
  assertAuditEvent(event: If001AuditEventFixture, action: If001AuditAction): void;
  assertTraceId(traceId: string): void;
  getT034ImplementationState(): typeof T034_IMPLEMENTATION_STATE;
}

function createAuthSessionService(options: HarnessServiceOptions): {
  service: AuthSessionService;
  auditRecords: TestAuditRecord[];
} {
  const auditRecords: TestAuditRecord[] = [];

  const authGateway: SupabaseAuthGatewayContract = {
    async buildGoogleOAuthUrl(redirectTo: string): Promise<string> {
      void redirectTo;
      if (options.providerError) {
        throw new Error("provider error");
      }

      return "https://accounts.google.com/o/oauth2/v2/auth?client_id=if001";
    },
    async clearSession(userId: string): Promise<void> {
      void userId;
      return;
    },
  };

  const consentStatusPort: ConsentStatusPort = {
    async hasConsented(userId: string): Promise<boolean> {
      return new Set(options.consentedUserIds).has(userId);
    },
  };

  const auditLogService: AuthSessionAuditLogPort = {
    async record(input): Promise<unknown> {
      auditRecords.push({
        action: input.action,
        result: input.result,
        traceId: input.traceId,
        actorUserId: input.actorUserId,
      });
      return input;
    },
  };

  return {
    service: new AuthSessionService(authGateway, consentStatusPort, auditLogService),
    auditRecords,
  };
}

export function createIf001TestHarness(): If001TestHarness {
  const assertTraceId = (traceId: string): void => {
    expect(typeof traceId).toBe("string");
    expect(traceId.length).toBeGreaterThan(0);
    expect(traceId).toContain("trace-if001-");
  };

  const assertAuditEvent = (event: If001AuditEventFixture, action: If001AuditAction): void => {
    expect(event.action).toBe(action);
    assertTraceId(event.trace_id);
    if (action === "LOGIN_START") {
      expect(event.result).toBe("SUCCESS");
      expect(event.user_id).toBeNull();
      return;
    }
    expect(event.user_id).toBeTypeOf("string");
    if (action === "LOGIN_SUCCESS") {
      expect(event.result).toBe("SUCCESS");
      expect(event.user_id).toBe(IF001_AUTH_USERS.success.id);
      return;
    }
    expect(event.result).toBe("FAILED");
    expect(event.user_id).not.toBeNull();
  };

  return {
    assertRequirementTrace(
      cases: readonly If001CaseDefinition[],
      requiredRequirementIds: readonly If001RequirementId[],
      requiredAcceptanceIds: readonly If001AcceptanceId[],
    ): void {
      const requirementSet = new Set(cases.map((testCase) => testCase.requirementId));
      const acceptanceSet = new Set(cases.map((testCase) => testCase.acceptanceId));

      requiredRequirementIds.forEach((requirementId) => {
        expect(requirementSet.has(requirementId)).toBe(true);
      });
      requiredAcceptanceIds.forEach((acceptanceId) => {
        expect(acceptanceSet.has(acceptanceId)).toBe(true);
      });
    },
    assertResponsibilityBoundaries(
      responsibilities: readonly If001ResponsibilityDefinition[],
      requiredBoundaries: readonly If001ResponsibilityDefinition["boundary"][],
    ): void {
      const boundarySet = new Set(responsibilities.map((entry) => entry.boundary));
      requiredBoundaries.forEach((boundary) => {
        expect(boundarySet.has(boundary)).toBe(true);
      });

      responsibilities.forEach((entry) => {
        expect(entry.requirementId).toBe("FR-001");
        expect(entry.acceptanceId).toBe("AC-001");
        expect(entry.responsibility.length).toBeGreaterThan(0);
      });
    },
    assertRedPlanningCase(testCase: If001CaseDefinition): void {
      expect(testCase.traceId).toContain("FNC-001");
      expect(
        testCase.traceId.includes("IF-001") ||
          testCase.traceId.includes("SCR-001") ||
          testCase.traceId.includes("M-001") ||
          testCase.traceId.includes("M-010"),
      ).toBe(true);
      expect(testCase.traceId).toContain("FR-001");
      expect(testCase.traceId).toContain("AC-001");
    },
    createStartApiStub(): (request: If001StartApiRequest) => Promise<If001StartApiResponse> {
      return async (request: If001StartApiRequest): Promise<If001StartApiResponse> => {
        if (!request.authorization) {
          const auditEvent = {
            ...IF001_AUDIT_EVENTS.LOGIN_FAILED,
            trace_id: "trace-if001-start-401-auth-failed",
          };
          return {
            status: 401,
            body: {
              code: "AUTH_FAILED",
              trace_id: auditEvent.trace_id,
              route: "SCR-001",
              audit_action: auditEvent.action,
            },
          };
        }

        const { service } = createAuthSessionService({
          consentedUserIds: [],
          providerError: request.redirectTo === "/cause-provider-error",
        });

        try {
          const result = await service.startGoogleLogin(request.redirectTo ?? "");
          return {
            status: 200,
            body: {
              auth_url: result.authUrl,
              trace_id: result.traceId,
              audit_action: result.auditAction,
            },
          };
        } catch (error: unknown) {
          const traceId = isAppError(error) ? error.traceId : "trace-if001-start-500-provider-error";
          const code = isAppError(error) && error.code === "INVALID_REDIRECT" ? "INVALID_REDIRECT" : "AUTH_PROVIDER_ERROR";
          const status = code === "INVALID_REDIRECT" ? 400 : 500;

          return {
            status,
            body: {
              code,
              trace_id: traceId,
              route: "SCR-001",
              audit_action: "LOGIN_FAILED",
            },
          };
        }
      };
    },
    createPostLoginResolver(consentedUserIds: readonly string[]): (userId: string) => Promise<If001RouteId> {
      const { service } = createAuthSessionService({ consentedUserIds, providerError: false });
      return async (userId: string): Promise<If001RouteId> => {
        const result = await service.resolvePostLogin(userId);
        return result.route;
      };
    },
    createConsentDeclineLogoutStub(): (userId: string) => Promise<If001ConsentDeclineLogoutResult> {
      const { service, auditRecords } = createAuthSessionService({ consentedUserIds: [], providerError: false });
      return async (userId: string): Promise<If001ConsentDeclineLogoutResult> => {
        const result = await service.rejectConsentAndLogout(userId);
        const latestAudit = auditRecords[auditRecords.length - 1];
        expect(latestAudit?.action).toBe("LOGIN_FAILED");
        expect(latestAudit?.result).toBe("FAILED");
        expect(latestAudit?.actorUserId).toBe(userId);
        return result;
      };
    },
    assertAuthStartSuccessContract(response: If001StartApiResponse): void {
      expect(response.status).toBe(200);
      if (response.status !== 200) {
        throw new Error("Expected success response");
      }
      expect(response.body.auth_url).toContain("https://accounts.google.com");
      assertTraceId(response.body.trace_id);
      expect(response.body.audit_action).toBe(IF001_AUDIT_EVENTS.LOGIN_START.action);
      assertAuditEvent(
        { ...IF001_AUDIT_EVENTS.LOGIN_START, trace_id: response.body.trace_id },
        "LOGIN_START",
      );
    },
    assertAuthStartErrorContract(response: If001StartApiResponse, status: 400 | 401 | 500): void {
      expect(response.status).toBe(status);
      if (response.status === 200) {
        throw new Error("Expected error response");
      }
      assertTraceId(response.body.trace_id);
      expect(response.body.route).toBe("SCR-001");
      expect(response.body.audit_action).toBe("LOGIN_FAILED");
      assertAuditEvent(
        { ...IF001_AUDIT_EVENTS.LOGIN_FAILED, trace_id: response.body.trace_id },
        "LOGIN_FAILED",
      );
      if (status === 400) {
        expect(response.body.code).toBe("INVALID_REDIRECT");
      }
      if (status === 401) {
        expect(response.body.code).toBe("AUTH_FAILED");
      }
      if (status === 500) {
        expect(response.body.code).toBe("AUTH_PROVIDER_ERROR");
      }
    },
    assertPostLoginRouteDecision(route: If001RouteId, expectedRoute: If001CallbackDecisionResult["route"]): void {
      expect(route).toBe(expectedRoute);
      expect(route === "SCR-002" || route === "SCR-008").toBe(true);
    },
    assertConsentDeclineLogout(result: If001ConsentDeclineLogoutResult): void {
      expect(result.sessionCleared).toBe(true);
      expect(result.route).toBe("SCR-001");
      expect(result.auditAction).toBe("LOGIN_FAILED");
      assertAuditEvent(IF001_AUDIT_EVENTS.LOGIN_FAILED, "LOGIN_FAILED");
    },
    assertAuditEvent(event: If001AuditEventFixture, action: If001AuditAction): void {
      assertAuditEvent(event, action);
    },
    assertTraceId(traceId: string): void {
      assertTraceId(traceId);
    },
    getT034ImplementationState(): typeof T034_IMPLEMENTATION_STATE {
      return T034_IMPLEMENTATION_STATE;
    },
  };
}
