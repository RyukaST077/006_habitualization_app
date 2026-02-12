import { logout } from '../../../../server/auth/logout';
import { toAuthJsonResponse } from '../../../../server/auth/auth-route-response';

export async function POST(): Promise<Response> {
  const result = logout();

  return toAuthJsonResponse({
    status: result.status,
    logout: result.logout,
    redirectTo: result.redirectTo,
    trace_id: result.trace_id,
    auditEvent: result.auditEvent,
  });
}
