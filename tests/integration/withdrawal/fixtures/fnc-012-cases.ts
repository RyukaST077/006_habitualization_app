export type Fnc012RequirementId = "FR-023" | "FR-024";
export type Fnc012AcceptanceId = "AC-023" | "AC-024";
export type Fnc012ConstraintId = "NFR-005" | "EX-007" | "BAT-004" | "IF-005";
export type Fnc012TestCaseId =
  | "TC-IT-FR-023-001"
  | "TC-IT-FR-023-002"
  | "TC-IT-FR-024-003"
  | "TC-ST-FR-023-004"
  | "TC-ST-FR-023-005";
export type Fnc012Perspective =
  | "REQUEST_ACCEPTED_AND_QUEUED"
  | "DISABLE_WITHIN_60_SECONDS"
  | "HARD_DELETE_WITHIN_5_MINUTES"
  | "POST_DELETE_RELOGIN_BLOCKED"
  | "FAILED_THEN_RERUN_COMPLETED";
export type Fnc012Boundary = "IF-002" | "BAT-004" | "IF-005" | "SCR-007";

export interface Fnc012CaseDefinition {
  traceId: string;
  testCaseId: Fnc012TestCaseId;
  requirementId: Fnc012RequirementId;
  acceptanceId: Fnc012AcceptanceId;
  perspective: Fnc012Perspective;
  boundary: Fnc012Boundary;
  title: string;
  notes: string;
  sla: {
    disableWithinSeconds: 60;
    hardDeleteWithinSeconds: 300;
  };
  mock: {
    strategyId: "S-MOCK-05";
    replacementDoneWhen: "BAT-004 hard delete runner is wired to ops repository and real API test";
  };
  scope: {
    ownerTask: "T-029";
    excludedTasks: readonly ["T-056", "T-030", "T-031"];
  };
}

export const FNC012_REQUIRED_REQUIREMENT_IDS: readonly Fnc012RequirementId[] = ["FR-023", "FR-024"];
export const FNC012_REQUIRED_ACCEPTANCE_IDS: readonly Fnc012AcceptanceId[] = ["AC-023", "AC-024"];
export const FNC012_REQUIRED_CONSTRAINT_IDS: readonly Fnc012ConstraintId[] = [
  "NFR-005",
  "EX-007",
  "BAT-004",
  "IF-005",
];
export const FNC012_REQUIRED_TEST_CASE_IDS: readonly Fnc012TestCaseId[] = [
  "TC-IT-FR-023-001",
  "TC-IT-FR-023-002",
  "TC-IT-FR-024-003",
  "TC-ST-FR-023-004",
  "TC-ST-FR-023-005",
];
export const FNC012_REQUIRED_PERSPECTIVES: readonly Fnc012Perspective[] = [
  "REQUEST_ACCEPTED_AND_QUEUED",
  "DISABLE_WITHIN_60_SECONDS",
  "HARD_DELETE_WITHIN_5_MINUTES",
  "POST_DELETE_RELOGIN_BLOCKED",
  "FAILED_THEN_RERUN_COMPLETED",
];

export const FNC012_SCOPE_EXCLUDED_TASKS = ["T-056", "T-030", "T-031"] as const;
export const FNC012_PLAN_COMMAND =
  "npm run test -- tests/integration/withdrawal/fnc-012-test-plan.spec.ts";

export const FNC012_SLA_POLLING = {
  disableWithinSeconds: 60,
  hardDeleteWithinSeconds: 300,
  pollIntervalMs: 1_000,
  maxPollAttempts: 5,
} as const;

export const FNC012_EXPECTED_JOB_STATUS = {
  requested: "queued",
  failed: "failed",
  rerun: "in_progress",
  completed: "completed",
} as const;

export const FNC012_TRACEABILITY_MARKERS = [
  "FR-023",
  "FR-024",
  "AC-023",
  "AC-024",
  "NFR-005",
  "EX-007",
  "BAT-004",
  "IF-005",
] as const;

export const FNC012_PLAN_CASES: readonly Fnc012CaseDefinition[] = [
  {
    traceId: "T-029/C-001/FNC-012/TC-IT-FR-023-001/FR-023/AC-023/request-accepted-and-queued",
    testCaseId: "TC-IT-FR-023-001",
    requirementId: "FR-023",
    acceptanceId: "AC-023",
    perspective: "REQUEST_ACCEPTED_AND_QUEUED",
    boundary: "IF-002",
    title: "退会要求を受理し queued ジョブを起票する",
    notes: "FR-023 AC-023 IF-002 M-009 disable_due_at(+60s) hard_delete_due_at(+5m) queued",
    sla: {
      disableWithinSeconds: 60,
      hardDeleteWithinSeconds: 300,
    },
    mock: {
      strategyId: "S-MOCK-05",
      replacementDoneWhen: "BAT-004 hard delete runner is wired to ops repository and real API test",
    },
    scope: {
      ownerTask: "T-029",
      excludedTasks: FNC012_SCOPE_EXCLUDED_TASKS,
    },
  },
  {
    traceId: "T-029/C-001/FNC-012/TC-IT-FR-023-002/FR-023/AC-023/disable-within-60-seconds",
    testCaseId: "TC-IT-FR-023-002",
    requirementId: "FR-023",
    acceptanceId: "AC-023",
    perspective: "DISABLE_WITHIN_60_SECONDS",
    boundary: "BAT-004",
    title: "退会要求から60秒以内に account_status を disabled 化する",
    notes: "TC-IT-FR-023-002 FR-023 AC-023 NFR-005 disabled_at <= requested_at + 60 seconds",
    sla: {
      disableWithinSeconds: 60,
      hardDeleteWithinSeconds: 300,
    },
    mock: {
      strategyId: "S-MOCK-05",
      replacementDoneWhen: "BAT-004 hard delete runner is wired to ops repository and real API test",
    },
    scope: {
      ownerTask: "T-029",
      excludedTasks: FNC012_SCOPE_EXCLUDED_TASKS,
    },
  },
  {
    traceId: "T-029/C-001/FNC-012/TC-IT-FR-024-003/FR-024/AC-024/hard-delete-within-5-minutes",
    testCaseId: "TC-IT-FR-024-003",
    requirementId: "FR-024",
    acceptanceId: "AC-024",
    perspective: "HARD_DELETE_WITHIN_5_MINUTES",
    boundary: "BAT-004",
    title: "退会要求から5分以内に完全削除が完了する",
    notes: "TC-IT-FR-024-003 FR-024 AC-024 NFR-005 hard_deleted_at <= requested_at + 5 minutes",
    sla: {
      disableWithinSeconds: 60,
      hardDeleteWithinSeconds: 300,
    },
    mock: {
      strategyId: "S-MOCK-05",
      replacementDoneWhen: "BAT-004 hard delete runner is wired to ops repository and real API test",
    },
    scope: {
      ownerTask: "T-029",
      excludedTasks: FNC012_SCOPE_EXCLUDED_TASKS,
    },
  },
  {
    traceId: "T-029/C-001/FNC-012/TC-ST-FR-023-004/FR-024/AC-024/post-delete-relogin-blocked",
    testCaseId: "TC-ST-FR-023-004",
    requirementId: "FR-024",
    acceptanceId: "AC-024",
    perspective: "POST_DELETE_RELOGIN_BLOCKED",
    boundary: "IF-002",
    title: "退会完了アカウントで再ログインできないことを契約化する",
    notes: "TC-ST-FR-023-004 FR-024 AC-024 IF-002 auth contract must reject deleted/disabled account",
    sla: {
      disableWithinSeconds: 60,
      hardDeleteWithinSeconds: 300,
    },
    mock: {
      strategyId: "S-MOCK-05",
      replacementDoneWhen: "BAT-004 hard delete runner is wired to ops repository and real API test",
    },
    scope: {
      ownerTask: "T-029",
      excludedTasks: FNC012_SCOPE_EXCLUDED_TASKS,
    },
  },
  {
    traceId: "T-029/C-001/FNC-012/TC-ST-FR-023-005/FR-023/AC-023/failed-then-rerun-completed",
    testCaseId: "TC-ST-FR-023-005",
    requirementId: "FR-023",
    acceptanceId: "AC-023",
    perspective: "FAILED_THEN_RERUN_COMPLETED",
    boundary: "IF-005",
    title: "失敗時に failed を記録し再実行で completed へ遷移する",
    notes:
      "TC-ST-FR-023-005 FR-023 AC-023 EX-007 BAT-004 IF-005 retry_count increments and last_error retained",
    sla: {
      disableWithinSeconds: 60,
      hardDeleteWithinSeconds: 300,
    },
    mock: {
      strategyId: "S-MOCK-05",
      replacementDoneWhen: "BAT-004 hard delete runner is wired to ops repository and real API test",
    },
    scope: {
      ownerTask: "T-029",
      excludedTasks: FNC012_SCOPE_EXCLUDED_TASKS,
    },
  },
] as const;
