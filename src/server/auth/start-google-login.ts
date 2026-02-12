import { randomUUID } from 'node:crypto';

export type AuthStartErrorCode = 'INVALID_REDIRECT' | 'AUTH_FAILED' | 'AUTH_PROVIDER_ERROR';
export type AuthAuditEvent = 'LOGIN_START' | 'LOGIN_SUCCESS' | 'LOGIN_FAILED';

export type StartGoogleLoginSuccess = {
  status: 200;
  auth_url: string;
  trace_id: string;
  sessionCreated: true;
  auditEvent: 'LOGIN_START';
};

export type StartGoogleLoginFailure = {
  status: 400 | 401 | 500;
  errorCode: AuthStartErrorCode;
  trace_id: string;
  sessionCreated: false;
  auditEvent: 'LOGIN_FAILED';
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

function mapFailureStatus(
  errorCode: Exclude<AuthStartErrorCode, 'INVALID_REDIRECT'>,
): 401 | 500 {
  if (errorCode === 'AUTH_FAILED') {
    return 401;
  }

  return 500;
}

export function startGoogleLogin(
  redirectTo: string,
  options: StartGoogleLoginOptions = {},
): StartGoogleLoginResult {
  const traceId = options.traceId ?? randomUUID();

  if (redirectTo !== '/home') {
    return {
      status: 400,
      errorCode: 'INVALID_REDIRECT',
      trace_id: traceId,
      sessionCreated: false,
      auditEvent: 'LOGIN_FAILED',
    };
  }

  if (options.failWith) {
    return {
      status: mapFailureStatus(options.failWith),
      errorCode: options.failWith,
      trace_id: traceId,
      sessionCreated: false,
      auditEvent: 'LOGIN_FAILED',
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
