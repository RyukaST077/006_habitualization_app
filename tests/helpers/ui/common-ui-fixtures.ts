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
  label: "display_order=0" | "display_order=1" | "display_order=9999" | "display_order=10000";
  value: 0 | 1 | 9999 | 10000;
  valid: boolean;
};

export type Scr004StatusButtonVisibility = {
  status: "active" | "archived";
  archiveVisible: boolean;
  resumeVisible: boolean;
};

export type Scr001TraceabilityId = "FR-001" | "SCR-001" | "IF-001";
export type Scr001ConsentState = "unknown" | "agreed";

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

export const SCR003_HABIT_NAME_BOUNDARY_CASES: readonly Scr003HabitNameBoundaryCase[] = [
  { label: "1文字", length: 1, valid: true },
  { label: "80文字", length: 80, valid: true },
  { label: "81文字", length: 81, valid: false },
] as const;

export const SCR003_DISPLAY_ORDER_BOUNDARY_CASES: readonly Scr003DisplayOrderBoundaryCase[] = [
  { label: "display_order=0", value: 0, valid: false },
  { label: "display_order=1", value: 1, valid: true },
  { label: "display_order=9999", value: 9999, valid: true },
  { label: "display_order=10000", value: 10000, valid: false },
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
