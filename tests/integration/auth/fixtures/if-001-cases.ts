export type If001RequirementId = "FR-001";
export type If001AcceptanceId = "AC-001";
export type If001Boundary = "M-001" | "IF-001" | "SCR-001" | "M-010";
export type If001Perspective = "AUTH_START" | "CALLBACK_ROUTE" | "FAILURE_RECOVERY" | "AUDIT";
export type If001AuditAction = "LOGIN_START" | "LOGIN_SUCCESS" | "LOGIN_FAILED";

export interface If001CaseDefinition {
  traceId: string;
  requirementId: If001RequirementId;
  acceptanceId: If001AcceptanceId;
  perspective: If001Perspective;
  boundary: If001Boundary;
  title: string;
  expected: {
    status?: 200 | 400 | 401 | 500;
    route?: "SCR-001" | "SCR-002" | "SCR-008";
    auditAction?: If001AuditAction;
    code?: "INVALID_REDIRECT" | "AUTH_FAILED" | "AUTH_PROVIDER_ERROR";
  };
}

export interface If001ResponsibilityDefinition {
  boundary: If001Boundary;
  requirementId: If001RequirementId;
  acceptanceId: If001AcceptanceId;
  responsibility: string;
}

export interface If001RedToGreenTarget {
  traceId: string;
  targetSpecPath: string;
  expectedPhase: "RED";
}

export const IF001_REQUIRED_REQUIREMENT_IDS: readonly If001RequirementId[] = ["FR-001"];
export const IF001_REQUIRED_ACCEPTANCE_IDS: readonly If001AcceptanceId[] = ["AC-001"];
export const IF001_REQUIRED_BOUNDARIES: readonly If001Boundary[] = ["M-001", "IF-001", "SCR-001", "M-010"];
export const IF001_REQUIRED_PERSPECTIVES: readonly If001Perspective[] = [
  "AUTH_START",
  "CALLBACK_ROUTE",
  "FAILURE_RECOVERY",
  "AUDIT",
];

export const IF001_RESPONSIBILITY_MAP: readonly If001ResponsibilityDefinition[] = [
  {
    boundary: "M-001",
    requirementId: "FR-001",
    acceptanceId: "AC-001",
    responsibility: "startGoogleLogin/resolvePostLogin のユースケース責務を保持する",
  },
  {
    boundary: "IF-001",
    requirementId: "FR-001",
    acceptanceId: "AC-001",
    responsibility: "POST /api/auth/google/start の 200/400/401/500 契約を保持する",
  },
  {
    boundary: "SCR-001",
    requirementId: "FR-001",
    acceptanceId: "AC-001",
    responsibility: "ログイン開始・失敗復帰・再試行導線の表示責務を保持する",
  },
  {
    boundary: "M-010",
    requirementId: "FR-001",
    acceptanceId: "AC-001",
    responsibility: "LOGIN_START/LOGIN_SUCCESS/LOGIN_FAILED の監査記録責務を保持する",
  },
] as const;

export const IF001_RED_CASES: readonly If001CaseDefinition[] = [
  {
    traceId: "T-033/FNC-001/IF-001/auth-start-success/FR-001/AC-001",
    requirementId: "FR-001",
    acceptanceId: "AC-001",
    perspective: "AUTH_START",
    boundary: "IF-001",
    title: "Google認証開始で auth_url/trace_id を返す",
    expected: {
      status: 200,
      auditAction: "LOGIN_START",
    },
  },
  {
    traceId: "T-033/FNC-001/IF-001/invalid-redirect/FR-001/AC-001",
    requirementId: "FR-001",
    acceptanceId: "AC-001",
    perspective: "AUTH_START",
    boundary: "IF-001",
    title: "不正 redirectTo では 400 INVALID_REDIRECT を返す",
    expected: {
      status: 400,
      code: "INVALID_REDIRECT",
      route: "SCR-001",
      auditAction: "LOGIN_FAILED",
    },
  },
  {
    traceId: "T-033/FNC-001/M-001/callback-consent-routing/FR-001/AC-001",
    requirementId: "FR-001",
    acceptanceId: "AC-001",
    perspective: "CALLBACK_ROUTE",
    boundary: "M-001",
    title: "認証成功コールバック後に同意状態で SCR-008/SCR-002 を分岐する",
    expected: {
      route: "SCR-008",
      auditAction: "LOGIN_SUCCESS",
    },
  },
  {
    traceId: "T-033/FNC-001/SCR-001/auth-failed-recovery/FR-001/AC-001",
    requirementId: "FR-001",
    acceptanceId: "AC-001",
    perspective: "FAILURE_RECOVERY",
    boundary: "SCR-001",
    title: "認証失敗時はログイン画面に戻って再試行できる",
    expected: {
      status: 401,
      code: "AUTH_FAILED",
      route: "SCR-001",
      auditAction: "LOGIN_FAILED",
    },
  },
  {
    traceId: "T-033/FNC-001/M-010/audit-events/FR-001/AC-001",
    requirementId: "FR-001",
    acceptanceId: "AC-001",
    perspective: "AUDIT",
    boundary: "M-010",
    title: "認証開始/成功/失敗の監査イベントを残す",
    expected: {
      auditAction: "LOGIN_SUCCESS",
    },
  },
] as const;

export const IF001_RED_TO_GREEN_TARGETS: readonly If001RedToGreenTarget[] = [
  {
    traceId: "T-033/PR-001/target/if-001-start-red",
    targetSpecPath: "tests/integration/auth/if-001-start-red.spec.ts",
    expectedPhase: "RED",
  },
  {
    traceId: "T-033/PR-001/target/if-001-post-login-red",
    targetSpecPath: "tests/integration/auth/if-001-post-login-red.spec.ts",
    expectedPhase: "RED",
  },
  {
    traceId: "T-033/PR-001/target/if-001-logout-red",
    targetSpecPath: "tests/integration/auth/if-001-logout-red.spec.ts",
    expectedPhase: "RED",
  },
] as const;
