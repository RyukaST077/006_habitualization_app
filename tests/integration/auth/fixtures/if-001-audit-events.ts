export type If001AuditAction = "LOGIN_START" | "LOGIN_SUCCESS" | "LOGIN_FAILED";
export type If001AuditResult = "SUCCESS" | "FAILED";

export interface If001AuditEventFixture {
  action: If001AuditAction;
  result: If001AuditResult;
  trace_id: string;
  user_id: string | null;
}

export const IF001_AUDIT_EVENTS = {
  LOGIN_START: {
    action: "LOGIN_START",
    result: "SUCCESS",
    trace_id: "trace-if001-start-200-login-start",
    user_id: null,
  },
  LOGIN_SUCCESS: {
    action: "LOGIN_SUCCESS",
    result: "SUCCESS",
    trace_id: "trace-if001-callback-200-login-success",
    user_id: "user-consented",
  },
  LOGIN_FAILED: {
    action: "LOGIN_FAILED",
    result: "FAILED",
    trace_id: "trace-if001-start-401-auth-failed",
    user_id: "user-not-consented",
  },
} satisfies Record<If001AuditAction, If001AuditEventFixture>;
