export type AppHeaderItemId = 'logo' | 'home' | 'history' | 'settings' | 'logout';

export type AppFooterItemId = 'terms' | 'privacy' | 'copyright';

export type AppHeaderItem = {
  id: AppHeaderItemId;
  label: string;
  href?: string;
};

export type AppFooterItem = {
  id: AppFooterItemId;
  label: string;
  href?: string;
};

export type CommonUiErrorStatus = 400 | 403 | 409 | 500;

export type CommonUiErrorCode =
  | 'VALIDATION_ERROR'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'
  | (string & {});

export type CommonUiErrorDto = {
  code: CommonUiErrorCode;
  message: string;
  trace_id?: string;
  requirement_id?: string;
  status: CommonUiErrorStatus;
};

export type TraceIdVisibility = 'show' | 'hide';

export function shouldDisplayTraceId(error: Pick<CommonUiErrorDto, 'status' | 'trace_id'>): boolean {
  return error.status === 500 && Boolean(error.trace_id);
}

export function getTraceIdVisibility(error: Pick<CommonUiErrorDto, 'status' | 'trace_id'>): TraceIdVisibility {
  return shouldDisplayTraceId(error) ? 'show' : 'hide';
}

// 403 は内部情報を露出しないため、詳細メッセージではなく安全な共通文言を返す。
export function getSafeErrorMessage(error: Pick<CommonUiErrorDto, 'status' | 'message'>): string {
  if (error.status === 403) {
    return 'この操作を実行する権限がありません。';
  }

  return error.message;
}
