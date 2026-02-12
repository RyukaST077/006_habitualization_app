import { randomUUID } from 'node:crypto';

export type CompleteGoogleLoginSuccess = {
  status: 200;
  callback: true;
  redirectTo: '/home';
  trace_id: string;
};

export type CompleteGoogleLoginFailure = {
  status: 401 | 500;
  errorCode: 'AUTH_FAILED' | 'AUTH_PROVIDER_ERROR';
  callback: true;
  trace_id: string;
};

export type CompleteGoogleLoginResult = CompleteGoogleLoginSuccess | CompleteGoogleLoginFailure;

export function completeGoogleLogin(failWith?: 'AUTH_FAILED' | 'AUTH_PROVIDER_ERROR'): CompleteGoogleLoginResult {
  if (failWith) {
    return {
      status: failWith === 'AUTH_FAILED' ? 401 : 500,
      errorCode: failWith,
      callback: true,
      trace_id: randomUUID(),
    };
  }

  return {
    status: 200,
    callback: true,
    redirectTo: '/home',
    trace_id: randomUUID(),
  };
}
