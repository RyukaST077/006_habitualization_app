export type If001AuthUserScenario = "SUCCESS" | "FAILED" | "DECLINED";
export type If001RouteId = "SCR-001" | "SCR-002" | "SCR-008";
export type If001AuditAction = "LOGIN_START" | "LOGIN_SUCCESS" | "LOGIN_FAILED";

export interface If001AuthUserFixture {
  id: string;
  scenario: If001AuthUserScenario;
  consented: boolean;
  expectedRoute: If001RouteId;
  expectedAuditAction: If001AuditAction;
}

export const IF001_AUTH_USERS = {
  success: {
    id: "user-consented",
    scenario: "SUCCESS",
    consented: true,
    expectedRoute: "SCR-002",
    expectedAuditAction: "LOGIN_SUCCESS",
  },
  failed: {
    id: "user-not-consented",
    scenario: "FAILED",
    consented: false,
    expectedRoute: "SCR-008",
    expectedAuditAction: "LOGIN_FAILED",
  },
  declined: {
    id: "user-declined",
    scenario: "DECLINED",
    consented: false,
    expectedRoute: "SCR-001",
    expectedAuditAction: "LOGIN_FAILED",
  },
} satisfies Record<string, If001AuthUserFixture>;
