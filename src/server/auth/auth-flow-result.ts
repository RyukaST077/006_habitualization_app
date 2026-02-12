import { randomUUID } from 'node:crypto';

export type AuthFailureCode = 'INVALID_REDIRECT' | 'AUTH_FAILED' | 'AUTH_PROVIDER_ERROR';
export type AuthFailureStatus = 400 | 401 | 500;
export type AuthAuditEvent = 'LOGIN_START' | 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT_SUCCESS';

export type AuthFailureResult<TCode extends AuthFailureCode = AuthFailureCode> = {
  status: AuthFailureStatus;
  errorCode: TCode;
  trace_id: string;
  auditEvent: 'LOGIN_FAILED';
};

const AUTH_FAILURE_STATUS: Record<AuthFailureCode, AuthFailureStatus> = {
  INVALID_REDIRECT: 400,
  AUTH_FAILED: 401,
  AUTH_PROVIDER_ERROR: 500,
};

export function createAuthFailureResult<TCode extends AuthFailureCode>(
  errorCode: TCode,
  traceId?: string,
): AuthFailureResult<TCode> {
  return {
    status: AUTH_FAILURE_STATUS[errorCode],
    errorCode,
    trace_id: traceId ?? randomUUID(),
    auditEvent: 'LOGIN_FAILED',
  };
}
