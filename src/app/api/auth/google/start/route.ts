import {
  startGoogleLogin,
  type StartGoogleLoginFailure,
  type StartGoogleLoginSuccess,
} from '../../../../../server/auth/start-google-login';
import { toAuthErrorResponse, toAuthJsonResponse } from '../../../../../server/auth/auth-route-response';

type RequestBody = {
  redirectTo?: string;
};

function isRequestBody(value: unknown): value is RequestBody {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as { redirectTo?: unknown };
  return candidate.redirectTo === undefined || typeof candidate.redirectTo === 'string';
}

export async function POST(request: Request): Promise<Response> {
  const payload = await request.json();
  const redirectTo = isRequestBody(payload) ? payload.redirectTo ?? '' : '';
  const result = startGoogleLogin(redirectTo);

  if (result.status === 200) {
    const body: Pick<StartGoogleLoginSuccess, 'auth_url' | 'trace_id' | 'auditEvent'> = {
      auth_url: result.auth_url,
      trace_id: result.trace_id,
      auditEvent: result.auditEvent,
    };
    return toAuthJsonResponse({
      status: 200,
      ...body,
    });
  }

  const body: Pick<StartGoogleLoginFailure, 'errorCode' | 'trace_id' | 'auditEvent'> = {
    errorCode: result.errorCode,
    trace_id: result.trace_id,
    auditEvent: result.auditEvent,
  };
  return toAuthErrorResponse({
    status: result.status,
    ...body,
  });
}
