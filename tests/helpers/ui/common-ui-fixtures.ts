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
