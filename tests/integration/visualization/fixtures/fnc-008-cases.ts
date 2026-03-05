export type Fnc008RequirementId = "FR-015" | "FR-016" | "FR-017";
export type Fnc008AcceptanceId = "AC-015" | "AC-016" | "AC-017";
export type Fnc008TestCaseId =
  | "TC-IT-FR-015-001"
  | "TC-IT-FR-015-002"
  | "TC-ST-FR-016-003"
  | "TC-ST-FR-017-004";
export type Fnc008Perspective =
  | "CURRENT_STREAK_ON_HOME"
  | "STREAK_GRACE_AND_RESET_RULE"
  | "CALENDAR_HISTORY_MONTHLY_VIEW"
  | "ANALYTICS_SUMMARY_RANGE";
export type Fnc008Boundary = "SCR-002" | "IF-002" | "M-006" | "M-007" | "TBL-003" | "TBL-004";

export interface Fnc008CaseDefinition {
  traceId: string;
  testCaseId: Fnc008TestCaseId;
  requirementId: Fnc008RequirementId;
  acceptanceId: Fnc008AcceptanceId;
  perspective: Fnc008Perspective;
  boundary: Fnc008Boundary;
  title: string;
  notes: string;
  expected: {
    httpStatus: 200;
    surface: "SCR-002" | "history-calendar" | "analytics-user-summary";
    invariant:
      | "streak-current-days-visible"
      | "grace-1day-maintain-and-2day-reset"
      | "monthly-cells-with-include-archived-toggle"
      | "range-days-7-30-90-summary";
  };
}

export const FNC008_REQUIRED_REQUIREMENT_IDS: readonly Fnc008RequirementId[] = ["FR-015", "FR-016", "FR-017"];
export const FNC008_REQUIRED_ACCEPTANCE_IDS: readonly Fnc008AcceptanceId[] = ["AC-015", "AC-016", "AC-017"];
export const FNC008_REQUIRED_TEST_CASE_IDS: readonly Fnc008TestCaseId[] = [
  "TC-IT-FR-015-001",
  "TC-IT-FR-015-002",
  "TC-ST-FR-016-003",
  "TC-ST-FR-017-004",
];
export const FNC008_REQUIRED_PERSPECTIVES: readonly Fnc008Perspective[] = [
  "CURRENT_STREAK_ON_HOME",
  "STREAK_GRACE_AND_RESET_RULE",
  "CALENDAR_HISTORY_MONTHLY_VIEW",
  "ANALYTICS_SUMMARY_RANGE",
];

export const FNC008_RED_CASES: readonly Fnc008CaseDefinition[] = [
  {
    traceId: "T-027/C-001/FNC-008/TC-IT-FR-015-001/FR-015/AC-015/current-streak-on-home",
    testCaseId: "TC-IT-FR-015-001",
    requirementId: "FR-015",
    acceptanceId: "AC-015",
    perspective: "CURRENT_STREAK_ON_HOME",
    boundary: "SCR-002",
    title: "ホームで現在ストリーク日数を表示する",
    notes: "TC-IT-FR-015-001 FR-015 AC-015 SCR-002 current_streak_days を表示する",
    expected: {
      httpStatus: 200,
      surface: "SCR-002",
      invariant: "streak-current-days-visible",
    },
  },
  {
    traceId: "T-027/C-001/FNC-008/TC-IT-FR-015-002/FR-015/AC-015/streak-grace-and-reset-rule",
    testCaseId: "TC-IT-FR-015-002",
    requirementId: "FR-015",
    acceptanceId: "AC-015",
    perspective: "STREAK_GRACE_AND_RESET_RULE",
    boundary: "M-006",
    title: "ストリークは1日猶予で維持し2日連続未達でリセットする",
    notes: "TC-IT-FR-015-002 FR-015 AC-015 M-006 grace1day maintain, miss2days reset",
    expected: {
      httpStatus: 200,
      surface: "SCR-002",
      invariant: "grace-1day-maintain-and-2day-reset",
    },
  },
  {
    traceId: "T-027/C-001/FNC-008/TC-ST-FR-016-003/FR-016/AC-016/calendar-history-monthly-view",
    testCaseId: "TC-ST-FR-016-003",
    requirementId: "FR-016",
    acceptanceId: "AC-016",
    perspective: "CALENDAR_HISTORY_MONTHLY_VIEW",
    boundary: "M-007",
    title: "履歴APIは月次カレンダーセルを返し archived 切替を反映する",
    notes: "TC-ST-FR-016-003 FR-016 AC-016 IF-002 GET /api/history/calendar include_archived",
    expected: {
      httpStatus: 200,
      surface: "history-calendar",
      invariant: "monthly-cells-with-include-archived-toggle",
    },
  },
  {
    traceId: "T-027/C-001/FNC-008/TC-ST-FR-017-004/FR-017/AC-017/analytics-summary-range",
    testCaseId: "TC-ST-FR-017-004",
    requirementId: "FR-017",
    acceptanceId: "AC-017",
    perspective: "ANALYTICS_SUMMARY_RANGE",
    boundary: "TBL-004",
    title: "分析APIは range_days=7/30/90 の集計サマリーを返す",
    notes: "TC-ST-FR-017-004 FR-017 AC-017 IF-002 GET /api/analytics/user-summary range_days",
    expected: {
      httpStatus: 200,
      surface: "analytics-user-summary",
      invariant: "range-days-7-30-90-summary",
    },
  },
] as const;
