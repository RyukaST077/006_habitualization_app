import { completeGoogleLogin } from '../../../../../server/auth/complete-google-login';
import { toAuthErrorResponse, toAuthJsonResponse } from '../../../../../server/auth/auth-route-response';

const AUTH_CALLBACK_ERROR_ALIASES = {
  AUTH_FAILED: 'AUTH_FAILED',
  AUTH_PROVIDER_ERROR: 'AUTH_PROVIDER_ERROR',
} as const;

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const failWith = url.searchParams.get('failWith');
  const result = completeGoogleLogin(
    failWith === 'AUTH_FAILED' || failWith === 'AUTH_PROVIDER_ERROR' ? failWith : undefined,
  );

  if (result.status === 200) {
    return toAuthJsonResponse({
      status: 200,
      callback: result.callback,
      redirectTo: result.redirectTo,
      trace_id: result.trace_id,
      auditEvent: result.auditEvent,
    });
  }

  return toAuthErrorResponse(
    {
      status: result.status,
      callback: result.callback,
      errorCode: result.errorCode,
      trace_id: result.trace_id,
      auditEvent: result.auditEvent,
    },
    AUTH_CALLBACK_ERROR_ALIASES,
  );
}
