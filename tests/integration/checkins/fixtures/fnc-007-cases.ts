export type Fnc007RequirementId = "FR-014" | "FR-025";
export type Fnc007AcceptanceId = "AC-014";
export type Fnc007TestCaseId = "TC-IT-FR-014-001" | "TC-IT-FR-014-002" | "TC-IT-FR-014-003";
export type Fnc007Perspective = "CANCEL_TODAY_SUCCESS" | "CANCEL_OUTSIDE_DAY_REJECT" | "CROSS_USER_FORBIDDEN";
export type Fnc007Boundary = "IF-002" | "SCR-002" | "M-005" | "TBL-003";

export interface Fnc007CaseDefinition {
  traceId: string;
  testCaseId: Fnc007TestCaseId;
  requirementId: Fnc007RequirementId;
  acceptanceId: Fnc007AcceptanceId;
  perspective: Fnc007Perspective;
  boundary: Fnc007Boundary;
  title: string;
  notes: string;
  expected: {
    httpStatus: 200 | 403 | 409;
    dbDelta: -1 | 0;
    domainErrorCode?: "CHECKIN_CANCEL_NOT_ALLOWED" | "FORBIDDEN";
  };
}

export const FNC007_REQUIRED_REQUIREMENT_IDS: readonly Fnc007RequirementId[] = ["FR-014", "FR-025"];
export const FNC007_REQUIRED_ACCEPTANCE_IDS: readonly Fnc007AcceptanceId[] = ["AC-014"];
export const FNC007_REQUIRED_TEST_CASE_IDS: readonly Fnc007TestCaseId[] = [
  "TC-IT-FR-014-001",
  "TC-IT-FR-014-002",
  "TC-IT-FR-014-003",
];
export const FNC007_REQUIRED_PERSPECTIVES: readonly Fnc007Perspective[] = [
  "CANCEL_TODAY_SUCCESS",
  "CANCEL_OUTSIDE_DAY_REJECT",
  "CROSS_USER_FORBIDDEN",
];

export const FNC007_RED_CASES: readonly Fnc007CaseDefinition[] = [
  {
    traceId: "T-026/C-001/FNC-007/TC-IT-FR-014-001/FR-014/AC-014/cancel-today-success",
    testCaseId: "TC-IT-FR-014-001",
    requirementId: "FR-014",
    acceptanceId: "AC-014",
    perspective: "CANCEL_TODAY_SUCCESS",
    boundary: "SCR-002",
    title: "当日チェックイン済みログは取消できる",
    notes: "TC-IT-FR-014-001 FR-014 AC-014 SCR-002 当日 log_date の habit_logs を 1 件削除する",
    expected: {
      httpStatus: 200,
      dbDelta: -1,
    },
  },
  {
    traceId: "T-026/C-001/FNC-007/TC-IT-FR-014-002/FR-014/AC-014/cancel-outside-day-reject",
    testCaseId: "TC-IT-FR-014-002",
    requirementId: "FR-014",
    acceptanceId: "AC-014",
    perspective: "CANCEL_OUTSIDE_DAY_REJECT",
    boundary: "M-005",
    title: "当日外ログの取消は拒否する",
    notes: "TC-IT-FR-014-002 FR-014 AC-014 EX-006 IF-002 CHECKIN_CANCEL_NOT_ALLOWED DB不変",
    expected: {
      httpStatus: 409,
      dbDelta: 0,
      domainErrorCode: "CHECKIN_CANCEL_NOT_ALLOWED",
    },
  },
  {
    traceId: "T-026/C-001/FNC-007/TC-IT-FR-014-003/FR-025/AC-014/cross-user-forbidden",
    testCaseId: "TC-IT-FR-014-003",
    requirementId: "FR-025",
    acceptanceId: "AC-014",
    perspective: "CROSS_USER_FORBIDDEN",
    boundary: "IF-002",
    title: "他ユーザーのログ取消は FORBIDDEN で拒否する",
    notes: "TC-IT-FR-014-003 FR-014 FR-025 AC-014 IF-002 403 FORBIDDEN DB不変",
    expected: {
      httpStatus: 403,
      dbDelta: 0,
      domainErrorCode: "FORBIDDEN",
    },
  },
] as const;
