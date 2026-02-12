import { success } from '../../../server/api/if002-errors';
import { handleIf002 } from '../../../server/api/if002-route-handler';
import { assertAuthHeader, parseJsonBody, requireKeys } from '../../../server/api/if002-validators';

// IF-002 route: /api/habits
// VALIDATION_ERROR is handled in shared handler.
export async function POST(request: Request): Promise<Response> {
  return handleIf002(async () => {
    assertAuthHeader(request);
    const payload = await parseJsonBody(request);
    requireKeys(payload, ['name', 'displayOrder']);
    return success({ habitId: 'dummy-habit-id' });
  });
}
