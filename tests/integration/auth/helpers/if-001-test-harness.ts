import { expect } from "vitest";

import type {
  If001CaseDefinition,
  If001ResponsibilityDefinition,
  If001RequirementId,
  If001AcceptanceId,
} from "../fixtures/if-001-cases";
import { IF001_AUDIT_EVENTS, type If001AuditAction, type If001AuditEventFixture } from "../fixtures/if-001-audit-events";
import { IF001_AUTH_USERS, type If001RouteId } from "../fixtures/if-001-users";

const T034_IMPLEMENTATION_STATE = "planned" as const;

export interface If001StartApiRequest {
  redirectTo?: string;
  authorization?: string;
}

export interface If001StartApiSuccessResponse {
  status: 200;
  body: {
    auth_url: string;
    trace_id: string;
    audit_action: "LOGIN_START";
  };
}

export interface If001StartApiErrorResponse {
  status: 400 | 401 | 500;
  body: {
    code: "INVALID_REDIRECT" | "AUTH_FAILED" | "AUTH_PROVIDER_ERROR";
    trace_id: string;
    route: "SCR-001";
    audit_action: "LOGIN_FAILED";
  };
}

export type If001StartApiResponse = If001StartApiSuccessResponse | If001StartApiErrorResponse;

export interface If001LogoutResult {
  route: "SCR-001";
  sessionCleared: boolean;
  auditAction: "LOGIN_FAILED";
}

export interface If001TestHarness {
  assertRequirementTrace(
    cases: readonly If001CaseDefinition[],
    requiredRequirementIds: readonly If001RequirementId[],
    requiredAcceptanceIds: readonly If001AcceptanceId[],
  ): void;
  assertResponsibilityBoundaries(
    responsibilities: readonly If001ResponsibilityDefinition[],
    requiredBoundaries: readonly string[],
  ): void;
  assertRedPlanningCase(testCase: If001CaseDefinition): void;
  createStartApiStub(): (request: If001StartApiRequest) => Promise<If001StartApiResponse>;
  createPostLoginResolver(consentedUserIds: readonly string[]): (userId: string) => If001RouteId;
  createConsentDeclineLogoutStub(): (userId: string) => If001LogoutResult;
  assertAuthStartSuccessContract(response: If001StartApiResponse): void;
  assertAuthStartErrorContract(response: If001StartApiResponse, status: 400 | 401 | 500): void;
  assertPostLoginRouteDecision(route: If001RouteId, expectedRoute: "SCR-002" | "SCR-008"): void;
  assertConsentDeclineLogout(result: If001LogoutResult): void;
  assertAuditEvent(event: If001AuditEventFixture, action: If001AuditAction): void;
  assertTraceId(traceId: string): void;
  getT034ImplementationState(): typeof T034_IMPLEMENTATION_STATE;
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
      requiredBoundaries: readonly string[],
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
        if (!request.redirectTo || !request.redirectTo.startsWith("/")) {
          const auditEvent = {
            ...IF001_AUDIT_EVENTS.LOGIN_FAILED,
            trace_id: "trace-if001-start-400-invalid-redirect",
          };
          return {
            status: 400,
            body: {
              code: "INVALID_REDIRECT",
              trace_id: auditEvent.trace_id,
              route: "SCR-001",
              audit_action: auditEvent.action,
            },
          };
        }
        if (request.redirectTo === "/cause-provider-error") {
          const auditEvent = {
            ...IF001_AUDIT_EVENTS.LOGIN_FAILED,
            trace_id: "trace-if001-start-500-provider-error",
          };
          return {
            status: 500,
            body: {
              code: "AUTH_PROVIDER_ERROR",
              trace_id: auditEvent.trace_id,
              route: "SCR-001",
              audit_action: auditEvent.action,
            },
          };
        }

        const auditEvent = IF001_AUDIT_EVENTS.LOGIN_START;
        return {
          status: 200,
          body: {
            auth_url: "https://accounts.google.com/o/oauth2/v2/auth?client_id=if001",
            trace_id: auditEvent.trace_id,
            audit_action: auditEvent.action,
          },
        };
      };
    },
    createPostLoginResolver(consentedUserIds: readonly string[]): (userId: string) => If001RouteId {
      const consentedUsers = new Set(consentedUserIds);
      return (userId: string): If001RouteId => {
        if (consentedUsers.has(userId)) {
          return "SCR-002";
        }
        return "SCR-008";
      };
    },
    createConsentDeclineLogoutStub(): (userId: string) => If001LogoutResult {
      return (_userId: string): If001LogoutResult => {
        return {
          route: IF001_AUTH_USERS.declined.expectedRoute,
          sessionCleared: true,
          auditAction: IF001_AUTH_USERS.declined.expectedAuditAction,
        };
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
    assertPostLoginRouteDecision(route: If001RouteId, expectedRoute: "SCR-002" | "SCR-008"): void {
      expect(route).toBe(expectedRoute);
      expect(route === "SCR-002" || route === "SCR-008").toBe(true);
    },
    assertConsentDeclineLogout(result: If001LogoutResult): void {
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
