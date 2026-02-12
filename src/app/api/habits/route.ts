import { success } from '../../../server/api/if002-errors';
import { handleIf002 } from '../../../server/api/if002-route-handler';
import { parseJsonBody, parseAuthUserId, readRequestId, validateHabitDto } from '../../../server/api/if002-validators';

// IF-002 route: /api/habits
// VALIDATION_ERROR is handled in shared handler.
export async function POST(request: Request): Promise<Response> {
  return handleIf002(async () => {
    const userId = parseAuthUserId(request);
    const requestId = readRequestId(request);
    const payload = await parseJsonBody(request);
    const { name, displayOrder } = validateHabitDto(payload);
    return success({
      route: '/api/habits',
      method: 'POST',
      habit: {
        id: 'dummy-habit-id',
        userId,
        name,
        displayOrder,
        status: 'active',
      },
      requestId,
    });
  });
}
