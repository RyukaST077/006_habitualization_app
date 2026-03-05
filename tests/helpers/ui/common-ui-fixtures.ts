export type CommonUiErrorCase = {
  status: 400 | 403 | 409 | 500;
  code:
    | "VALIDATION_ERROR"
    | "FORBIDDEN"
    | "DOMAIN_CONFLICT"
    | "INTERNAL_ERROR";
  expectedMessage: string;
  shouldShowTraceId: boolean;
};

export type CommonUiBreakpointKey = "sm" | "md" | "lg";
export type CommonUiBreakpointWidth = 640 | 768 | 1024;
export type CommonUiErrorStatus = CommonUiErrorCase["status"];
export type CommonUiErrorCode = CommonUiErrorCase["code"];

export type CommonUiErrorInput = {
  status: CommonUiErrorStatus;
  code: CommonUiErrorCode;
};

export type Scr003HabitNameBoundaryCase = {
  label: "1文字" | "80文字" | "81文字";
  length: 1 | 80 | 81;
  valid: boolean;
};

export type Scr003DisplayOrderBoundaryCase = {
  label: "display_order=1" | "display_order=9999" | "display_order=範囲外(0)" | "display_order=範囲外(10000)";
  value: 0 | 1 | 9999 | 10000;
  valid: boolean;
};

export type Scr003TraceabilityId = "FR-006" | "AC-006" | "SCR-003";
export type Scr003TraceCaseId = "TC-IT-FR-006-001" | "TC-IT-FR-006-002";

export type Scr003UiRequirementTraceCase = {
  traceId: string;
  testCaseId: Scr003TraceCaseId;
  requirementId: "FR-006";
  acceptanceId: "AC-006";
  screenId: "SCR-003";
  title: string;
};

export type Scr004StatusButtonVisibility = {
  status: "active" | "archived";
  archiveVisible: boolean;
  resumeVisible: boolean;
};

export type Scr004TraceabilityId =
  | "FR-007"
  | "FR-008"
  | "FR-009"
  | "AC-007"
  | "AC-008"
  | "AC-009"
  | "SCR-004";
export type Scr004TraceCaseId = "TC-IT-FR-007-003" | "TC-ST-FR-008-004" | "TC-ST-FR-009-005";
export type Scr004RequirementId = "FR-007" | "FR-008" | "FR-009";
export type Scr004AcceptanceId = "AC-007" | "AC-008" | "AC-009";

export type Scr004UiRequirementTraceCase = {
  traceId: string;
  testCaseId: Scr004TraceCaseId;
  requirementId: Scr004RequirementId;
  acceptanceId: Scr004AcceptanceId;
  screenId: "SCR-004";
  title: string;
};

export type Scr004ConfirmationModalAction = "archive" | "resume";

export type Scr004ConfirmationModalExpectation = {
  action: Scr004ConfirmationModalAction;
  status: "active" | "archived";
  openButtonLabel: "アーカイブ" | "再開";
  requiresConfirmation: true;
  confirmButtonLabel: "実行";
  cancelButtonLabel: "キャンセル";
};

export type Scr004ApiPrefillExpectation = {
  status: "active" | "archived";
  response: {
    name: string;
    displayOrder: number;
    status: "active" | "archived";
  };
  expected: {
    name: string;
    displayOrder: number;
    status: "active" | "archived";
  };
};

export type Scr004ConfirmationModalStateTransition = {
  action: Scr004ConfirmationModalAction;
  status: "active" | "archived";
  initial: {
    isOpen: false;
    action: null;
  };
  opened: {
    isOpen: true;
    action: Scr004ConfirmationModalAction;
  };
  closed: {
    isOpen: false;
    action: null;
  };
};

export type Scr002TraceabilityId =
  | "FR-011"
  | "FR-012"
  | "FR-013"
  | "FR-014"
  | "FR-015"
  | "FR-016"
  | "AC-011"
  | "AC-012"
  | "AC-013"
  | "AC-014"
  | "AC-015"
  | "AC-016"
  | "SCR-002";
export type Scr002TraceCaseId =
  | "TC-IT-FR-011-001"
  | "TC-IT-FR-012-002"
  | "TC-IT-FR-013-003"
  | "TC-IT-FR-014-001"
  | "TC-IT-FR-015-001"
  | "TC-ST-FR-016-003";
export type Scr002RequirementId =
  | "FR-011"
  | "FR-012"
  | "FR-013"
  | "FR-014"
  | "FR-015"
  | "FR-016";
export type Scr002AcceptanceId =
  | "AC-011"
  | "AC-012"
  | "AC-013"
  | "AC-014"
  | "AC-015"
  | "AC-016";

export type Scr002UiRequirementTraceCase = {
  traceId: string;
  testCaseId: Scr002TraceCaseId;
  requirementId: Scr002RequirementId;
  acceptanceId: Scr002AcceptanceId;
  screenId: "SCR-002";
  title: string;
};

export type Scr002HomeLoadState = "loading" | "loaded" | "error";
export type Scr005TraceabilityId = "FR-017" | "AC-017" | "SCR-005";
export type Scr005TraceCaseId = "TC-ST-FR-017-004" | "TC-ST-FR-017-005";

export type Scr005UiRequirementTraceCase = {
  traceId: string;
  testCaseId: Scr005TraceCaseId;
  requirementId: "FR-017";
  acceptanceId: "AC-017";
  screenId: "SCR-005";
  title: string;
};

export type Scr005CalendarStatusMappingCase = {
  source: "checked" | "missed" | "grace";
  display: "checked" | "unchecked" | "grace";
};

export type Scr005ReloadInputCase = {
  yearMonth: string;
  habitId: string | null;
  includeArchived: boolean;
};

export type Scr001TraceabilityId = "FR-001" | "SCR-001" | "IF-001";
export type Scr001ConsentState = "unknown" | "agreed";
export type Scr008RequirementId = "FR-003" | "FR-004" | "FR-005";
export type Scr008TraceCaseId = "TC-IT-FR-003-003" | "TC-ST-FR-004-004" | "TC-IT-FR-005-001";
export type Scr008ConsentState = "unknown" | "agreed";

export type Scr008UiRequirementTraceCase = {
  traceId: string;
  testCaseId: Scr008TraceCaseId;
  requirementId: Scr008RequirementId;
  screenId: "SCR-008";
  title: string;
};

const T034_AUTH_UI_IMPLEMENTATION_STATE = "implemented" as const;

export const COMMON_UI_DISPLAY_ITEMS = {
  header: [
    "ロゴ",
    "ホーム",
    "履歴",
    "設定",
    "ログアウト",
  ] as const,
  footer: [
    "利用規約",
    "プライバシーポリシー",
    "コピーライト",
  ] as const,
} as const;

export const COMMON_UI_HEADER_REQUIRED_ITEMS = COMMON_UI_DISPLAY_ITEMS.header;
export const COMMON_UI_FOOTER_REQUIRED_ITEMS = COMMON_UI_DISPLAY_ITEMS.footer;

export const COMMON_UI_ERROR_RESPONSES: readonly CommonUiErrorCase[] = [
  {
    status: 400,
    code: "VALIDATION_ERROR",
    expectedMessage: "入力内容を確認してください",
    shouldShowTraceId: false,
  },
  {
    status: 403,
    code: "FORBIDDEN",
    expectedMessage: "この操作を実行する権限がありません",
    shouldShowTraceId: false,
  },
  {
    status: 409,
    code: "DOMAIN_CONFLICT",
    expectedMessage: "現在の状態ではこの操作を完了できません",
    shouldShowTraceId: false,
  },
  {
    status: 500,
    code: "INTERNAL_ERROR",
    expectedMessage: "システムエラーが発生しました",
    shouldShowTraceId: true,
  },
] as const;

export const COMMON_UI_ERROR_CASES = COMMON_UI_ERROR_RESPONSES;

export const COMMON_UI_RESPONSIVE_BREAKPOINTS: Readonly<Record<CommonUiBreakpointKey, 640 | 768 | 1024>> = {
  sm: 640,
  md: 768,
  lg: 1024,
} as const;

const COMMON_UI_ERROR_CODE_BY_STATUS: Readonly<Record<CommonUiErrorStatus, CommonUiErrorCode>> = {
  400: "VALIDATION_ERROR",
  403: "FORBIDDEN",
  409: "DOMAIN_CONFLICT",
  500: "INTERNAL_ERROR",
} as const;

export const COMMON_UI_BREAKPOINT_CASES: readonly {
  key: CommonUiBreakpointKey;
  width: CommonUiBreakpointWidth;
}[] = [
  { key: "sm", width: COMMON_UI_RESPONSIVE_BREAKPOINTS.sm },
  { key: "md", width: COMMON_UI_RESPONSIVE_BREAKPOINTS.md },
  { key: "lg", width: COMMON_UI_RESPONSIVE_BREAKPOINTS.lg },
] as const;

export const SCR001_LOGIN_BUTTON_LOADING_EXPECTATION = {
  label: "Googleでログイン",
  ariaLabel: "Googleでログイン",
  executeKey: "Enter",
  initial: {
    loading: false,
    disabled: false,
  },
  pending: {
    loading: true,
    disabled: true,
  },
  settled: {
    loading: false,
    disabled: false,
  },
} as const;

export const SCR001_AUTH_FAILURE_EXPECTATION = {
  errorMessageContains: "認証失敗",
  retryActionLabel: "再試行",
} as const;

export const SCR001_TRACEABILITY_IDS: readonly Scr001TraceabilityId[] = [
  "FR-001",
  "SCR-001",
  "IF-001",
] as const;

export const SCR001_AUTHENTICATED_REDIRECT_CASES: readonly {
  consentState: Scr001ConsentState;
  expectedPath: "/policy-consent" | "/home";
}[] = [
  { consentState: "unknown", expectedPath: "/policy-consent" },
  { consentState: "agreed", expectedPath: "/home" },
] as const;

export const SCR001_A11Y_ENTER_KEY_EXPECTATION = {
  executeKey: "Enter",
  ignoreKey: "Space",
  ariaLabel: "Googleでログイン",
} as const;

export const SCR008_TRACEABILITY_IDS = ["FR-003", "FR-004", "FR-005", "SCR-008"] as const;

export const SCR008_UI_REQUIREMENT_TRACE_CASES: readonly Scr008UiRequirementTraceCase[] = [
  {
    traceId: "T-051/C-001/TC-IT-FR-003-003/FR-003/SCR-008",
    testCaseId: "TC-IT-FR-003-003",
    requirementId: "FR-003",
    screenId: "SCR-008",
    title: "同意済み到達時は /home へリダイレクトする",
  },
  {
    traceId: "T-051/C-001/TC-ST-FR-004-004/FR-004/SCR-008",
    testCaseId: "TC-ST-FR-004-004",
    requirementId: "FR-004",
    screenId: "SCR-008",
    title: "拒否時は /login へ戻す導線を保持する",
  },
  {
    traceId: "T-051/C-001/TC-IT-FR-005-001/FR-005/SCR-008",
    testCaseId: "TC-IT-FR-005-001",
    requirementId: "FR-005",
    screenId: "SCR-008",
    title: "同意送信時に履歴登録導線を保持する",
  },
] as const;

export const SCR008_DUAL_CHECK_REQUIRED_EXPECTATION = {
  screenId: "SCR-008",
  requirementId: "FR-004",
  requiredChecks: ["terms", "privacy"] as const,
  disabledWhenEitherUnchecked: true,
  enabledWhenBothChecked: true,
} as const;

export const SCR008_POLICY_CONSENT_TRACE_EXPECTATION = {
  requirementId: "FR-026",
  policyTypes: ["terms", "privacy"] as const,
  acceptAction: "POLICY_CONSENT_ACCEPT",
  rejectAction: "POLICY_CONSENT_REJECT",
} as const;

export const SCR008_REJECT_FLOW_EXPECTATION = {
  screenId: "SCR-008",
  requirementId: "FR-004",
  fromPath: "/policy-consent",
  consentState: "rejected",
  expectedPath: "/login",
} as const;

export const SCR008_ACCEPT_FLOW_EXPECTATION = {
  screenId: "SCR-008",
  requirementId: "FR-005",
  fromPath: "/policy-consent",
  consentState: "agreed",
  expectedPath: "/home",
} as const;

export const SCR008_CONSENT_ENTRY_REDIRECT_CASES: readonly {
  consentState: Scr008ConsentState;
  expectedPath: "/policy-consent" | "/home";
}[] = [
  { consentState: "unknown", expectedPath: "/policy-consent" },
  { consentState: "agreed", expectedPath: "/home" },
] as const;

export const SCR008_A11Y_KEYBOARD_EXPECTATION = {
  toggleKey: "Space",
  submitKey: "Enter",
  ignoreKey: "Escape",
} as const;

export const SCR003_TRACEABILITY_IDS: readonly Scr003TraceabilityId[] = ["FR-006", "AC-006", "SCR-003"] as const;

export const SCR003_UI_REQUIREMENT_TRACE_CASES: readonly Scr003UiRequirementTraceCase[] = [
  {
    traceId: "T-052/C-001/TC-IT-FR-006-001/FR-006/AC-006/SCR-003/create-habit-success",
    testCaseId: "TC-IT-FR-006-001",
    requirementId: "FR-006",
    acceptanceId: "AC-006",
    screenId: "SCR-003",
    title: "保存時に習慣作成API契約の成功経路を要求する",
  },
  {
    traceId: "T-052/C-001/TC-IT-FR-006-002/FR-006/AC-006/SCR-003/name-display-order-boundary",
    testCaseId: "TC-IT-FR-006-002",
    requirementId: "FR-006",
    acceptanceId: "AC-006",
    screenId: "SCR-003",
    title: "name/display_order 境界(1/80/81, 1/9999/範囲外)を要求する",
  },
] as const;

export const SCR003_HABIT_NAME_BOUNDARY_CASES: readonly Scr003HabitNameBoundaryCase[] = [
  { label: "1文字", length: 1, valid: true },
  { label: "80文字", length: 80, valid: true },
  { label: "81文字", length: 81, valid: false },
] as const;

export const SCR003_DISPLAY_ORDER_BOUNDARY_CASES: readonly Scr003DisplayOrderBoundaryCase[] = [
  { label: "display_order=1", value: 1, valid: true },
  { label: "display_order=9999", value: 9999, valid: true },
  { label: "display_order=範囲外(0)", value: 0, valid: false },
  { label: "display_order=範囲外(10000)", value: 10000, valid: false },
] as const;

export const SCR003_SAVE_BUTTON_LOADING_EXPECTATION = {
  screenId: "SCR-003",
  requirementId: "FR-006",
  acceptanceId: "AC-006",
  label: "保存",
  initial: {
    disabled: false,
  },
  pending: {
    disabled: true,
  },
  settled: {
    disabled: false,
  },
} as const;

export const SCR003_CANCEL_TRANSITION_EXPECTATION = {
  screenId: "SCR-003",
  requirementId: "FR-006",
  acceptanceId: "AC-006",
  fromPath: "/habits/new",
  expectedPath: "/home",
  shouldSubmitOnCancel: false,
} as const;

export const T052_C004_COMPLETION_GATE_COMMANDS = [
  "npm run test -- tests/unit/screens/scr-003-habit-create-page-red.spec.ts tests/integration/ui/scr-003-habit-create-runtime-red.spec.ts",
  "npm run test -- tests/unit/screens/scr-003-habit-create-page-red.spec.ts tests/integration/ui/scr-003-habit-create-runtime-red.spec.ts tests/integration/api/if-002-habits-create-update-red.spec.ts && npm run typecheck",
] as const;

export const SCR004_STATUS_BUTTON_VISIBILITY: readonly Scr004StatusButtonVisibility[] = [
  { status: "active", archiveVisible: true, resumeVisible: false },
  { status: "archived", archiveVisible: false, resumeVisible: true },
] as const;

export const SCR004_TRACEABILITY_IDS: readonly Scr004TraceabilityId[] = [
  "FR-007",
  "FR-008",
  "FR-009",
  "AC-007",
  "AC-008",
  "AC-009",
  "SCR-004",
] as const;

export const SCR004_UI_REQUIREMENT_TRACE_CASES: readonly Scr004UiRequirementTraceCase[] = [
  {
    traceId: "T-053/C-004/TC-IT-FR-007-003/FR-007/AC-007/SCR-004",
    testCaseId: "TC-IT-FR-007-003",
    requirementId: "FR-007",
    acceptanceId: "AC-007",
    screenId: "SCR-004",
    title: "active/archived 状態ごとのボタン表示を固定する",
  },
  {
    traceId: "T-053/C-004/TC-ST-FR-008-004/FR-008/AC-008/SCR-004",
    testCaseId: "TC-ST-FR-008-004",
    requirementId: "FR-008",
    acceptanceId: "AC-008",
    screenId: "SCR-004",
    title: "アーカイブ/再開は確認モーダル経由で実行する観点を固定する",
  },
  {
    traceId: "T-053/C-004/TC-ST-FR-009-005/FR-009/AC-009/SCR-004",
    testCaseId: "TC-ST-FR-009-005",
    requirementId: "FR-009",
    acceptanceId: "AC-009",
    screenId: "SCR-004",
    title: "403 発生時は /home へ遷移する導線を固定する",
  },
] as const;

export const T053_C004_COMPLETION_GATE_COMMANDS = [
  "npm run test -- tests/unit/screens/scr-004-habit-edit-page-red.spec.ts tests/integration/ui/scr-004-habit-edit-runtime-red.spec.ts",
  "npm run test -- tests/unit/screens/scr-004-habit-edit-page-red.spec.ts tests/integration/ui/scr-004-habit-edit-runtime-red.spec.ts tests/integration/api/if-002-habits-status-red.spec.ts && npm run typecheck",
] as const;

export const SCR002_TRACEABILITY_IDS: readonly Scr002TraceabilityId[] = [
  "FR-011",
  "FR-012",
  "FR-013",
  "FR-014",
  "FR-015",
  "FR-016",
  "AC-011",
  "AC-012",
  "AC-013",
  "AC-014",
  "AC-015",
  "AC-016",
  "SCR-002",
] as const;

export const SCR005_TRACEABILITY_IDS: readonly Scr005TraceabilityId[] = ["FR-017", "AC-017", "SCR-005"] as const;

export const SCR005_UI_REQUIREMENT_TRACE_CASES: readonly Scr005UiRequirementTraceCase[] = [
  {
    traceId: "T-055/C-004/TC-ST-FR-017-004/FR-017/AC-017/SCR-005/month-calendar-filter-archived",
    testCaseId: "TC-ST-FR-017-004",
    requirementId: "FR-017",
    acceptanceId: "AC-017",
    screenId: "SCR-005",
    title: "月カレンダー/月ピッカー/習慣フィルター/includeArchived 切替の観点を固定する",
  },
  {
    traceId: "T-055/C-004/TC-ST-FR-017-005/FR-017/AC-017/SCR-005/empty-month-and-error-retry",
    testCaseId: "TC-ST-FR-017-005",
    requirementId: "FR-017",
    acceptanceId: "AC-017",
    screenId: "SCR-005",
    title: "空月の枠表示とエラー再読込導線の観点を固定する",
  },
] as const;

export const SCR005_TEST_PLAN_FOCUS_AREAS = [
  "month-calendar-grid",
  "month-picker",
  "habit-filter",
  "include-archived-toggle",
  "empty-month-frame",
  "error-retry-action",
] as const;

export const SCR005_DEFAULT_FILTERS = {
  yearMonth: "2026-03",
  habitId: null,
  includeArchived: false,
} as const;

export const SCR005_CALENDAR_STATUS_MAPPINGS: readonly Scr005CalendarStatusMappingCase[] = [
  { source: "checked", display: "checked" },
  { source: "missed", display: "unchecked" },
  { source: "grace", display: "grace" },
] as const;

export const SCR005_RELOAD_INPUT_CASES: readonly Scr005ReloadInputCase[] = [
  { yearMonth: "2026-02", habitId: null, includeArchived: false },
  { yearMonth: "2026-02", habitId: "habit-001", includeArchived: false },
  { yearMonth: "2026-02", habitId: "habit-001", includeArchived: true },
] as const;

export const SCR005_EMPTY_MONTH_FRAME_EXPECTATION = {
  yearMonth: "2026-02",
  daysInMonth: 28,
  emptyStatus: "empty",
} as const;

export const SCR005_ERROR_RETRY_EXPECTATION = {
  label: "再読込",
  yearMonth: "2026-02",
  habitId: "habit-001",
  includeArchived: true,
} as const;

export const SCR005_RUNTIME_USER_ID = "00000000-0000-4000-8000-000000000001" as const;
export const SCR005_RUNTIME_ENDPOINT = "/api/history/calendar" as const;

export const SCR005_RUNTIME_RELOAD_SEQUENCE: readonly Scr005ReloadInputCase[] = [
  { yearMonth: "2026-03", habitId: null, includeArchived: false },
  { yearMonth: "2026-02", habitId: null, includeArchived: false },
  { yearMonth: "2026-02", habitId: "habit-001", includeArchived: false },
  { yearMonth: "2026-02", habitId: "habit-001", includeArchived: true },
] as const;

export const T055_C003_COMPLETION_GATE_COMMANDS = [
  "npm run test -- tests/integration/ui/scr-005-history-runtime-red.spec.ts",
  "npm run test -- tests/integration/api/if-002-history-calendar-red.spec.ts tests/integration/ui/scr-005-history-runtime-red.spec.ts",
] as const;

export const T055_C001_COMPLETION_GATE_COMMANDS = [
  "npm run test -- tests/unit/screens/scr-005-history-page-red.spec.ts tests/integration/ui/scr-005-history-runtime-red.spec.ts",
  "for id in FR-017 AC-017 SCR-005 TC-ST-FR-017-004 TC-ST-FR-017-005; do rg -n \"$id\" tests/helpers/ui/common-ui-fixtures.ts >/dev/null; done",
] as const;

export const T055_C004_COMPLETION_GATE_COMMANDS = [
  "npm run test -- tests/unit/screens/scr-005-history-page-red.spec.ts tests/integration/ui/scr-005-history-runtime-red.spec.ts",
  "npm run test -- tests/unit/screens/scr-005-history-page-red.spec.ts tests/integration/ui/scr-005-history-runtime-red.spec.ts tests/integration/api/if-002-history-calendar-red.spec.ts && npm run typecheck",
] as const;

export const SCR002_UI_REQUIREMENT_TRACE_CASES: readonly Scr002UiRequirementTraceCase[] = [
  {
    traceId: "T-054/C-004/TC-IT-FR-011-001/FR-011/AC-011/SCR-002/home-list-fetch-and-render",
    testCaseId: "TC-IT-FR-011-001",
    requirementId: "FR-011",
    acceptanceId: "AC-011",
    screenId: "SCR-002",
    title: "ホーム初期表示で習慣一覧を取得して描画する観点を固定する",
  },
  {
    traceId: "T-054/C-004/TC-IT-FR-012-002/FR-012/AC-012/SCR-002/checkin-optimistic-update-and-rollback",
    testCaseId: "TC-IT-FR-012-002",
    requirementId: "FR-012",
    acceptanceId: "AC-012",
    screenId: "SCR-002",
    title: "チェックイン登録は楽観的更新し失敗時ロールバックする観点を固定する",
  },
  {
    traceId: "T-054/C-004/TC-IT-FR-013-003/FR-013/AC-013/SCR-002/checkin-idempotent-success",
    testCaseId: "TC-IT-FR-013-003",
    requirementId: "FR-013",
    acceptanceId: "AC-013",
    screenId: "SCR-002",
    title: "冪等成功時はエラー表示せず当日達成状態のみ更新する観点を固定する",
  },
  {
    traceId: "T-054/C-004/TC-IT-FR-014-001/FR-014/AC-014/SCR-002/cancel-checkin-single-flight",
    testCaseId: "TC-IT-FR-014-001",
    requirementId: "FR-014",
    acceptanceId: "AC-014",
    screenId: "SCR-002",
    title: "取消実行中は二重送信を抑止し完了後に再操作可能へ戻す観点を固定する",
  },
  {
    traceId: "T-054/C-004/TC-IT-FR-015-001/FR-015/AC-015/SCR-002/streak-visibility-on-card",
    testCaseId: "TC-IT-FR-015-001",
    requirementId: "FR-015",
    acceptanceId: "AC-015",
    screenId: "SCR-002",
    title: "各習慣カードへ継続日数（ストリーク）を表示する観点を固定する",
  },
  {
    traceId: "T-054/C-004/TC-ST-FR-016-003/FR-016/AC-016/SCR-002/empty-error-retry-cta",
    testCaseId: "TC-ST-FR-016-003",
    requirementId: "FR-016",
    acceptanceId: "AC-016",
    screenId: "SCR-002",
    title: "空状態CTAとエラー時リトライ導線を表示する観点を固定する",
  },
] as const;

export const SCR002_HOME_LIST_REQUIRED_FIELDS = [
  "habitName",
  "statusBadge",
  "todayCheckin",
  "cancelTodayCheckin",
  "streakDays",
] as const;

export const SCR002_HOME_EMPTY_STATE_EXPECTATION = {
  ctaLabel: "習慣を作成",
  ctaPath: "/habits/new",
  helperText: "習慣がまだありません。まずは1つ作成しましょう。",
} as const;

export const SCR002_HOME_ERROR_STATE_EXPECTATION = {
  retryLabel: "再試行",
  fallbackMessage: "ホーム情報の取得に失敗しました",
} as const;

export const SCR002_HOME_LOAD_STATE_TRANSITIONS: readonly {
  before: Scr002HomeLoadState;
  success: Scr002HomeLoadState;
  failure: Scr002HomeLoadState;
}[] = [
  { before: "loading", success: "loaded", failure: "error" },
] as const;

export const SCR002_HOME_CHECKIN_OPTIMISTIC_EXPECTATION = {
  habitId: "habit-red-001",
  previousLogDate: null,
  optimisticLogDate: "2026-03-04",
  rollbackLogDate: null,
} as const;

export const SCR002_HOME_CANCEL_SINGLE_FLIGHT_EXPECTATION = {
  rejectMessage: "取消失敗: 実行中のため再実行できません",
  initialSubmitting: false,
  pendingSubmitting: true,
  settledSubmitting: false,
} as const;

export const SCR002_HOME_ARCHIVED_CONFLICT_RECOVERY_EXPECTATION = {
  status: 409,
  code: "DOMAIN_CONFLICT",
  actionLabel: "再開してチェックインする",
  targetScreenId: "SCR-004",
} as const;

export const SCR002_HOME_RUNTIME_ENDPOINTS = [
  "/api/home/habits",
  "/api/checkins",
  "/api/checkins/{habitId}",
] as const;

export const T054_C003_COMPLETION_GATE_COMMANDS = [
  "npm run test -- tests/integration/ui/scr-002-home-runtime-red.spec.ts",
  "npm run test -- tests/integration/api/if-002-checkins-register-red.spec.ts tests/integration/api/if-002-checkins-cancel-red.spec.ts",
] as const;

export const T054_C002_COMPLETION_GATE_COMMANDS = [
  "npm run test -- tests/unit/screens/scr-002-home-page-red.spec.ts",
  "npm run typecheck",
] as const;

export const T054_C001_COMPLETION_GATE_COMMANDS = [
  "npm run test -- tests/unit/screens/scr-002-home-page-red.spec.ts tests/integration/ui/scr-002-home-runtime-red.spec.ts",
  "for id in FR-011 FR-012 FR-013 FR-014 FR-015 FR-016 AC-011 AC-012 AC-013 AC-014 AC-015 AC-016 SCR-002; do rg -n \"$id\" tests/helpers/ui/common-ui-fixtures.ts >/dev/null; done",
] as const;

export const T054_C004_MINIMUM_REGRESSION_SET = [
  "tests/unit/screens/scr-002-home-page-red.spec.ts",
  "tests/integration/ui/scr-002-home-runtime-red.spec.ts",
  "tests/integration/api/if-002-checkins-register-red.spec.ts",
  "tests/integration/api/if-002-checkins-cancel-red.spec.ts",
] as const;

export const T054_C004_COMPLETION_GATE_COMMANDS = [
  "npm run test -- tests/unit/screens/scr-002-home-page-red.spec.ts tests/integration/ui/scr-002-home-runtime-red.spec.ts",
  "npm run test -- tests/unit/screens/scr-002-home-page-red.spec.ts tests/integration/ui/scr-002-home-runtime-red.spec.ts tests/integration/api/if-002-checkins-register-red.spec.ts tests/integration/api/if-002-checkins-cancel-red.spec.ts && npm run typecheck",
] as const;

export const SCR004_FORBIDDEN_REDIRECT_EXPECTATION = {
  screenId: "SCR-004",
  requirementId: "FR-009",
  sourcePath: "/habits/:habitId/edit",
  triggerStatus: 403,
  expectedPath: "/home",
} as const;

export const SCR004_CONFIRMATION_MODAL_EXPECTATIONS: readonly Scr004ConfirmationModalExpectation[] = [
  {
    action: "archive",
    status: "active",
    openButtonLabel: "アーカイブ",
    requiresConfirmation: true,
    confirmButtonLabel: "実行",
    cancelButtonLabel: "キャンセル",
  },
  {
    action: "resume",
    status: "archived",
    openButtonLabel: "再開",
    requiresConfirmation: true,
    confirmButtonLabel: "実行",
    cancelButtonLabel: "キャンセル",
  },
] as const;

export const SCR004_API_PREFILL_EXPECTATIONS: readonly Scr004ApiPrefillExpectation[] = [
  {
    status: "active",
    response: {
      name: "朝の散歩",
      displayOrder: 2,
      status: "active",
    },
    expected: {
      name: "朝の散歩",
      displayOrder: 2,
      status: "active",
    },
  },
  {
    status: "archived",
    response: {
      name: "読書",
      displayOrder: 7,
      status: "archived",
    },
    expected: {
      name: "読書",
      displayOrder: 7,
      status: "archived",
    },
  },
] as const;

export const SCR004_CONFIRMATION_MODAL_STATE_TRANSITIONS: readonly Scr004ConfirmationModalStateTransition[] = [
  {
    action: "archive",
    status: "active",
    initial: { isOpen: false, action: null },
    opened: { isOpen: true, action: "archive" },
    closed: { isOpen: false, action: null },
  },
  {
    action: "resume",
    status: "archived",
    initial: { isOpen: false, action: null },
    opened: { isOpen: true, action: "resume" },
    closed: { isOpen: false, action: null },
  },
] as const;

export function createCommonUiErrorInput(status: CommonUiErrorStatus): CommonUiErrorInput {
  return {
    status,
    code: COMMON_UI_ERROR_CODE_BY_STATUS[status],
  };
}

export function buildCommonUiRequiredHeaderItems(): string[] {
  return [...COMMON_UI_HEADER_REQUIRED_ITEMS];
}

export function buildCommonUiRequiredFooterItems(): string[] {
  return [...COMMON_UI_FOOTER_REQUIRED_ITEMS];
}

export function getT034AuthUiImplementationState(): typeof T034_AUTH_UI_IMPLEMENTATION_STATE {
  return T034_AUTH_UI_IMPLEMENTATION_STATE;
}
