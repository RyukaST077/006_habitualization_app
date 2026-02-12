import { randomUUID } from 'node:crypto';

import { createAuthFailureResult, type AuthFailureResult } from './auth-flow-result';

export type CompleteGoogleLoginSuccess = {
  status: 200;
  callback: true;
  redirectTo: '/home';
  trace_id: string;
  auditEvent: 'LOGIN_SUCCESS';
};

type CallbackFailureCode = 'AUTH_FAILED' | 'AUTH_PROVIDER_ERROR';
export type CompleteGoogleLoginFailure = AuthFailureResult<CallbackFailureCode> & { callback: true };

export type CompleteGoogleLoginResult = CompleteGoogleLoginSuccess | CompleteGoogleLoginFailure;

export function completeGoogleLogin(failWith?: 'AUTH_FAILED' | 'AUTH_PROVIDER_ERROR'): CompleteGoogleLoginResult {
  if (failWith) {
    return {
      ...createAuthFailureResult(failWith),
      callback: true,
    };
  }

  return {
    status: 200,
    callback: true,
    redirectTo: '/home',
    trace_id: randomUUID(),
    auditEvent: 'LOGIN_SUCCESS',
  };
}
