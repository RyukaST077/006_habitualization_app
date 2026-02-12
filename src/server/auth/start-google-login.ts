import { randomUUID } from 'node:crypto';

import {
  createAuthFailureResult,
  type AuthAuditEvent,
  type AuthFailureCode,
  type AuthFailureResult,
} from './auth-flow-result';

export type AuthStartErrorCode = AuthFailureCode;

export type StartGoogleLoginSuccess = {
  status: 200;
  auth_url: string;
  trace_id: string;
  sessionCreated: true;
  auditEvent: 'LOGIN_START';
};

export type StartGoogleLoginFailure = {
  status: AuthFailureResult<AuthStartErrorCode>['status'];
  errorCode: AuthFailureResult<AuthStartErrorCode>['errorCode'];
  trace_id: AuthFailureResult<AuthStartErrorCode>['trace_id'];
  sessionCreated: false;
  auditEvent: AuthFailureResult<AuthStartErrorCode>['auditEvent'];
};

export type StartGoogleLoginResult = StartGoogleLoginSuccess | StartGoogleLoginFailure;

export type StartGoogleLoginOptions = {
  traceId?: string;
  failWith?: Exclude<AuthStartErrorCode, 'INVALID_REDIRECT'>;
  oauthUrlFactory?: (redirectTo: '/home') => string;
};

function createAuthUrl(redirectTo: '/home'): string {
  const query = new URLSearchParams({ redirectTo });
  return `https://auth.example.local/google/start?${query.toString()}`;
}

export function startGoogleLogin(
  redirectTo: string,
  options: StartGoogleLoginOptions = {},
): StartGoogleLoginResult {
  const traceId = options.traceId ?? randomUUID();

  if (redirectTo !== '/home') {
    return {
      ...createAuthFailureResult('INVALID_REDIRECT', traceId),
      sessionCreated: false,
    };
  }

  if (options.failWith) {
    return {
      ...createAuthFailureResult(options.failWith, traceId),
      sessionCreated: false,
    };
  }

  return {
    status: 200,
    auth_url: (options.oauthUrlFactory ?? createAuthUrl)('/home'),
    trace_id: traceId,
    sessionCreated: true,
    auditEvent: 'LOGIN_START',
  };
}
