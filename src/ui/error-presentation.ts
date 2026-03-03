export type CommonErrorCode =
  | "VALIDATION_ERROR"
  | "AUTH_FAILED"
  | "FORBIDDEN"
  | "DOMAIN_CONFLICT"
  | "INTERNAL_ERROR";

export type ErrorStatus = 400 | 401 | 403 | 409 | 500;

export type ErrorPresentation = {
  status: ErrorStatus;
  code: CommonErrorCode;
  message: string;
  recoveryAction: {
    label: string;
    targetScreenId: "SCR-004";
  } | null;
  statusLabel: string;
  traceIdLabel: "trace_id";
  visibleTraceId: string | null;
  internalDetail: null;
};

const PUBLIC_MESSAGES: Readonly<Record<CommonErrorCode, string>> = {
  VALIDATION_ERROR: "入力内容を確認してください",
  AUTH_FAILED: "認証失敗。再試行してください",
  FORBIDDEN: "この操作を実行する権限がありません",
  DOMAIN_CONFLICT: "現在の状態ではこの操作を完了できません",
  INTERNAL_ERROR: "システムエラーが発生しました",
};
const TRACE_ID_VISIBLE_STATUS: ErrorStatus = 500;

export function resolveErrorPresentation(
  status: ErrorStatus,
  code: CommonErrorCode,
  traceId = "INTERNAL_ERROR"
): ErrorPresentation {
  const shouldShowTraceId = status === TRACE_ID_VISIBLE_STATUS && code === "INTERNAL_ERROR";
  const showResumeAction = status === 409 && code === "DOMAIN_CONFLICT";

  return {
    status,
    code,
    message: PUBLIC_MESSAGES[code],
    recoveryAction: showResumeAction
      ? {
          label: "再開してチェックインする",
          targetScreenId: "SCR-004",
        }
      : null,
    statusLabel: String(status),
    traceIdLabel: "trace_id",
    visibleTraceId: shouldShowTraceId ? `trace_id:${traceId}` : null,
    internalDetail: null,
  };
}
