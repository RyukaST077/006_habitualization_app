export type Fnc004RequirementId = "FR-006" | "FR-007" | "FR-008" | "FR-009";
export type Fnc004AcceptanceId = "AC-006" | "AC-007" | "AC-008" | "AC-009";
export type Fnc004ExceptionId = "EX-003" | "EX-004";

export type Fnc004LifecycleOperation = "create" | "update" | "archive" | "resume";

export type Fnc004Perspective =
  | "LIFECYCLE_CREATE"
  | "LIFECYCLE_UPDATE"
  | "LIFECYCLE_ARCHIVE"
  | "LIFECYCLE_RESUME"
  | "INPUT_VALIDATION_EXCEPTION"
  | "CROSS_USER_FORBIDDEN_EXCEPTION"
  | "TBL002_NAME_LENGTH_CONSTRAINT"
  | "TBL002_STATUS_TRANSITION_CONSTRAINT"
  | "TBL002_RLS_ENFORCEMENT";

export type Fnc004Boundary = "SCR-003" | "SCR-004" | "IF-002" | "M-003" | "M-102" | "TBL-002";

export type Fnc004Tbl002ConstraintId = "chk_habits_name_len" | "chk_habits_status" | "rls_auth_uid_user_id";

export interface Fnc004CaseDefinition {
  traceId: string;
  testCaseId:
    | "TC-IT-FR-006-001"
    | "TC-IT-FR-006-002"
    | "TC-IT-FR-007-003"
    | "TC-ST-FR-008-004"
    | "TC-ST-FR-009-005";
  requirementId: Fnc004RequirementId;
  acceptanceId: Fnc004AcceptanceId;
  operation: Fnc004LifecycleOperation;
  perspective: Fnc004Perspective;
  boundary: Fnc004Boundary;
  title: string;
  notes: string;
  statusTransition?: readonly ["active" | "archived", "active" | "archived"];
  expectedErrorCode?: "VALIDATION_ERROR" | "FORBIDDEN";
  exceptionIds?: readonly Fnc004ExceptionId[];
  tbl002ConstraintIds?: readonly Fnc004Tbl002ConstraintId[];
}

export const FNC004_REQUIRED_REQUIREMENT_IDS: readonly Fnc004RequirementId[] = [
  "FR-006",
  "FR-007",
  "FR-008",
  "FR-009",
];

export const FNC004_REQUIRED_ACCEPTANCE_IDS: readonly Fnc004AcceptanceId[] = [
  "AC-006",
  "AC-007",
  "AC-008",
  "AC-009",
];

export const FNC004_REQUIRED_OPERATIONS: readonly Fnc004LifecycleOperation[] = [
  "create",
  "update",
  "archive",
  "resume",
];

export const FNC004_REQUIRED_EXCEPTION_IDS: readonly Fnc004ExceptionId[] = ["EX-003", "EX-004"];

export const FNC004_REQUIRED_TBL002_CONSTRAINT_IDS: readonly Fnc004Tbl002ConstraintId[] = [
  "chk_habits_name_len",
  "chk_habits_status",
  "rls_auth_uid_user_id",
];

export const FNC004_RED_CASES: readonly Fnc004CaseDefinition[] = [
  {
    traceId: "T-039/PR-001/FNC-004/TC-IT-FR-006-001/FR-006/AC-006/create-active",
    testCaseId: "TC-IT-FR-006-001",
    requirementId: "FR-006",
    acceptanceId: "AC-006",
    operation: "create",
    perspective: "LIFECYCLE_CREATE",
    boundary: "SCR-003",
    title: "必須項目入力で習慣を active 作成できる",
    notes: "FR-006 AC-006 SCR-003 create habit with active default state",
    statusTransition: ["active", "active"],
    tbl002ConstraintIds: ["chk_habits_status"],
  },
  {
    traceId: "T-039/PR-001/FNC-004/TC-IT-FR-006-002/FR-006/AC-006/name-length-boundary",
    testCaseId: "TC-IT-FR-006-002",
    requirementId: "FR-006",
    acceptanceId: "AC-006",
    operation: "create",
    perspective: "TBL002_NAME_LENGTH_CONSTRAINT",
    boundary: "TBL-002",
    title: "習慣名1/80は許可、81文字は VALIDATION_ERROR で拒否する",
    notes: "FR-006 AC-006 EX-003 TBL-002 chk_habits_name_len boundary 1..80 and reject 81",
    expectedErrorCode: "VALIDATION_ERROR",
    exceptionIds: ["EX-003"],
    tbl002ConstraintIds: ["chk_habits_name_len"],
  },
  {
    traceId: "T-039/PR-001/FNC-004/TC-IT-FR-007-003/FR-007/AC-007/forbidden-cross-user-update",
    testCaseId: "TC-IT-FR-007-003",
    requirementId: "FR-007",
    acceptanceId: "AC-007",
    operation: "update",
    perspective: "CROSS_USER_FORBIDDEN_EXCEPTION",
    boundary: "IF-002",
    title: "他ユーザー習慣更新を FORBIDDEN で拒否し DB を不変に保つ",
    notes: "FR-007 AC-007 EX-004 IF-002 other user habit update must be forbidden and state unchanged",
    expectedErrorCode: "FORBIDDEN",
    exceptionIds: ["EX-004"],
    tbl002ConstraintIds: ["rls_auth_uid_user_id"],
  },
  {
    traceId: "T-039/PR-001/FNC-004/TC-ST-FR-008-004/FR-008/AC-008/archive-to-archived",
    testCaseId: "TC-ST-FR-008-004",
    requirementId: "FR-008",
    acceptanceId: "AC-008",
    operation: "archive",
    perspective: "LIFECYCLE_ARCHIVE",
    boundary: "SCR-004",
    title: "アーカイブ操作で status を archived へ遷移し archived_at を設定する",
    notes: "FR-008 AC-008 SCR-004 TBL-002 status transition active->archived with archived_at",
    statusTransition: ["active", "archived"],
    tbl002ConstraintIds: ["chk_habits_status"],
  },
  {
    traceId: "T-039/PR-001/FNC-004/TC-ST-FR-009-005/FR-009/AC-009/resume-to-active",
    testCaseId: "TC-ST-FR-009-005",
    requirementId: "FR-009",
    acceptanceId: "AC-009",
    operation: "resume",
    perspective: "LIFECYCLE_RESUME",
    boundary: "SCR-004",
    title: "再開操作で status を active へ戻す",
    notes: "FR-009 AC-009 SCR-004 resume archived habit and reactivate",
    statusTransition: ["archived", "active"],
    tbl002ConstraintIds: ["chk_habits_status"],
  },
  {
    traceId: "T-039/PR-001/FNC-004/TC-IT-FR-007-003/FR-007/AC-007/tbl-002-rls-enforcement",
    testCaseId: "TC-IT-FR-007-003",
    requirementId: "FR-007",
    acceptanceId: "AC-007",
    operation: "update",
    perspective: "TBL002_RLS_ENFORCEMENT",
    boundary: "TBL-002",
    title: "RLS auth.uid() = user_id により他者更新を拒否する",
    notes: "FR-007 AC-007 EX-004 TBL-002 RLS auth.uid() = user_id enforcement",
    expectedErrorCode: "FORBIDDEN",
    exceptionIds: ["EX-004"],
    tbl002ConstraintIds: ["rls_auth_uid_user_id"],
  },
  {
    traceId: "T-039/PR-001/FNC-004/TC-ST-FR-008-004/FR-008/AC-008/tbl-002-status-constraint",
    testCaseId: "TC-ST-FR-008-004",
    requirementId: "FR-008",
    acceptanceId: "AC-008",
    operation: "archive",
    perspective: "TBL002_STATUS_TRANSITION_CONSTRAINT",
    boundary: "TBL-002",
    title: "status は active/archived 以外を許可しない",
    notes: "FR-008 AC-008 TBL-002 chk_habits_status only active and archived are valid",
    statusTransition: ["active", "archived"],
    tbl002ConstraintIds: ["chk_habits_status"],
  },
  {
    traceId: "T-039/PR-001/FNC-004/TC-IT-FR-006-002/FR-006/AC-006/ex-003-input-validation",
    testCaseId: "TC-IT-FR-006-002",
    requirementId: "FR-006",
    acceptanceId: "AC-006",
    operation: "create",
    perspective: "INPUT_VALIDATION_EXCEPTION",
    boundary: "M-003",
    title: "入力不備(EX-003)は作成/更新で共通の検証エラーにマップする",
    notes: "FR-006 AC-006 EX-003 M-003 invalid name length returns VALIDATION_ERROR",
    expectedErrorCode: "VALIDATION_ERROR",
    exceptionIds: ["EX-003"],
    tbl002ConstraintIds: ["chk_habits_name_len"],
  },
  {
    traceId: "T-039/PR-001/FNC-004/TC-IT-FR-007-003/FR-007/AC-007/update-self",
    testCaseId: "TC-IT-FR-007-003",
    requirementId: "FR-007",
    acceptanceId: "AC-007",
    operation: "update",
    perspective: "LIFECYCLE_UPDATE",
    boundary: "M-102",
    title: "本人習慣更新は許可される",
    notes: "FR-007 AC-007 M-102 self habit update lifecycle scenario",
    statusTransition: ["active", "active"],
    tbl002ConstraintIds: ["chk_habits_name_len", "chk_habits_status"],
  },
] as const;
