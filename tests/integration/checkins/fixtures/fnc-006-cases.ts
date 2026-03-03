export type Fnc006RequirementId = "FR-011" | "FR-012" | "FR-013" | "FR-025";
export type Fnc006AcceptanceId = "AC-011" | "AC-012" | "AC-013";
export type Fnc006TestCaseId =
  | "TC-IT-FR-011-001"
  | "TC-IT-FR-012-002"
  | "TC-IT-FR-013-003"
  | "TC-IT-FR-011-004";

export type Fnc006Perspective = "REGISTER" | "IDEMPOTENT" | "ARCHIVED_REJECT" | "CROSS_USER_FORBIDDEN";
export type Fnc006Boundary = "IF-002" | "SCR-002" | "SCR-004" | "TBL-003" | "M-005";

export interface Fnc006CaseDefinition {
  traceId: string;
  testCaseId: Fnc006TestCaseId;
  requirementId: Fnc006RequirementId;
  acceptanceId: Fnc006AcceptanceId;
  perspective: Fnc006Perspective;
  boundary: Fnc006Boundary;
  title: string;
  notes: string;
  expected: {
    httpStatus: 200 | 403 | 409;
    idempotent?: boolean;
    dbDelta: 0 | 1;
    domainErrorCode?: "FORBIDDEN" | "DOMAIN_CONFLICT";
    resumeCtaVisible?: boolean;
  };
}

export const FNC006_REQUIRED_REQUIREMENT_IDS: readonly Fnc006RequirementId[] = [
  "FR-011",
  "FR-012",
  "FR-013",
  "FR-025",
];

export const FNC006_REQUIRED_ACCEPTANCE_IDS: readonly Fnc006AcceptanceId[] = ["AC-011", "AC-012", "AC-013"];

export const FNC006_REQUIRED_TEST_CASE_IDS: readonly Fnc006TestCaseId[] = [
  "TC-IT-FR-011-001",
  "TC-IT-FR-012-002",
  "TC-IT-FR-013-003",
  "TC-IT-FR-011-004",
];

export const FNC006_REQUIRED_PERSPECTIVES: readonly Fnc006Perspective[] = [
  "REGISTER",
  "IDEMPOTENT",
  "ARCHIVED_REJECT",
  "CROSS_USER_FORBIDDEN",
];

export const FNC006_RED_CASES: readonly Fnc006CaseDefinition[] = [
  {
    traceId: "T-025/C-001/FNC-006/TC-IT-FR-011-001/FR-011/AC-011/register-active",
    testCaseId: "TC-IT-FR-011-001",
    requirementId: "FR-011",
    acceptanceId: "AC-011",
    perspective: "REGISTER",
    boundary: "IF-002",
    title: "active習慣への初回チェックイン登録は成功し idempotent=false を返す",
    notes: "FR-011 AC-011 IF-002 SCR-002 first register creates one log row",
    expected: {
      httpStatus: 200,
      idempotent: false,
      dbDelta: 1,
    },
  },
  {
    traceId: "T-025/C-001/FNC-006/TC-IT-FR-012-002/FR-012/AC-012/idempotent-duplicate",
    testCaseId: "TC-IT-FR-012-002",
    requirementId: "FR-012",
    acceptanceId: "AC-012",
    perspective: "IDEMPOTENT",
    boundary: "TBL-003",
    title: "同日重複チェックインは成功応答を維持し idempotent=true で DB 増分 0",
    notes: "FR-012 AC-012 TBL-003 uq_habit_logs_habit_date duplicate checkin returns success idempotent",
    expected: {
      httpStatus: 200,
      idempotent: true,
      dbDelta: 0,
    },
  },
  {
    traceId: "T-025/C-001/FNC-006/TC-IT-FR-013-003/FR-013/AC-013/reject-archived",
    testCaseId: "TC-IT-FR-013-003",
    requirementId: "FR-013",
    acceptanceId: "AC-013",
    perspective: "ARCHIVED_REJECT",
    boundary: "SCR-004",
    title: "archived習慣のチェックインは 409 DOMAIN_CONFLICT で拒否し再開導線を示す",
    notes: "FR-013 AC-013 SCR-002 SCR-004 IF-002 archived habit must be rejected",
    expected: {
      httpStatus: 409,
      dbDelta: 0,
      domainErrorCode: "DOMAIN_CONFLICT",
      resumeCtaVisible: true,
    },
  },
  {
    traceId: "T-025/C-001/FNC-006/TC-IT-FR-011-004/FR-025/AC-011/forbidden-cross-user",
    testCaseId: "TC-IT-FR-011-004",
    requirementId: "FR-025",
    acceptanceId: "AC-011",
    perspective: "CROSS_USER_FORBIDDEN",
    boundary: "M-005",
    title: "他ユーザー習慣へのチェックインは 403 FORBIDDEN で拒否し DB は不変",
    notes: "FR-011 FR-025 AC-011 IF-002 cross user habit access is forbidden",
    expected: {
      httpStatus: 403,
      dbDelta: 0,
      domainErrorCode: "FORBIDDEN",
    },
  },
] as const;
