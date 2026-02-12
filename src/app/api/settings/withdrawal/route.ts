import { success } from '../../../../server/api/if002-errors';
import { handleIf002 } from '../../../../server/api/if002-route-handler';
import { assertAuthHeader, parseJsonBody, requireKeys } from '../../../../server/api/if002-validators';

// IF-002 route: /api/settings/withdrawal
// Authorization required; response includes trace_id.
export async function POST(request: Request): Promise<Response> {
  return handleIf002(async () => {
    assertAuthHeader(request);
    const payload = await parseJsonBody(request);
    requireKeys(payload, ['confirmation']);
    return success({ accepted: true });
  });
}
