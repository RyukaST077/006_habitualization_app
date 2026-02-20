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
