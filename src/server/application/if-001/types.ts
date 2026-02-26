export type If001PostLoginRoute = "SCR-002" | "SCR-008";

export interface If001CallbackDecisionResult {
  route: If001PostLoginRoute;
}

export interface If001ConsentDeclineLogoutResult {
  route: "SCR-001";
  sessionCleared: boolean;
  auditAction: "LOGIN_FAILED";
}
