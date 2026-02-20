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
