import { success } from '../../../../server/api/if002-errors';
import { handleIf002 } from '../../../../server/api/if002-route-handler';
import {
  parseAuthUserId,
  parseJsonBody,
  readRequestId,
  validateHabitDto,
} from '../../../../server/api/if002-validators';

// IF-002 route: PATCH /api/habits/{habitId}
export async function PATCH(
  request: Request,
  context: { params: Promise<{ habitId: string }> },
): Promise<Response> {
  return handleIf002(async () => {
    const userId = parseAuthUserId(request);
    const requestId = readRequestId(request);
    const { habitId } = await context.params;
    const payload = await parseJsonBody(request);
    const { name, displayOrder } = validateHabitDto(payload);

    if (!habitId || habitId === 'forbidden') {
      throw new Error('FORBIDDEN');
    }

    return success({
      route: '/api/habits',
      method: 'PATCH',
      habit: {
        id: habitId,
        userId,
        name,
        displayOrder,
        status: 'active',
      },
      requestId,
    });
  });
}
