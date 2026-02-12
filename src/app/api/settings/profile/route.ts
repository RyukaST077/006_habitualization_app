import { success } from '../../../../server/api/if002-errors';
import { handleIf002 } from '../../../../server/api/if002-route-handler';
import { assertAuthHeader, parseJsonBody, requireKeys } from '../../../../server/api/if002-validators';

// IF-002 route: /api/settings/profile
// VALIDATION_ERROR is returned by validators + shared handler.
export async function PATCH(request: Request): Promise<Response> {
  return handleIf002(async () => {
    assertAuthHeader(request);
    const payload = await parseJsonBody(request);
    requireKeys(payload, ['timezone', 'dayCutoffTime']);
    return success({ updated: true });
  });
}
