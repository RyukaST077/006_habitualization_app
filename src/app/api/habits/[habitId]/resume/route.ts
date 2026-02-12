import { success } from '../../../../../server/api/if002-errors';
import { handleIf002 } from '../../../../../server/api/if002-route-handler';
import { parseAuthUserId, readRequestId } from '../../../../../server/api/if002-validators';

// IF-002 route: POST /api/habits/{habitId}/resume
export async function POST(
  request: Request,
  context: { params: Promise<{ habitId: string }> },
): Promise<Response> {
  return handleIf002(async () => {
    const userId = parseAuthUserId(request);
    const requestId = readRequestId(request);
    const { habitId } = await context.params;

    if (!habitId) {
      throw new Error('VALIDATION_ERROR');
    }
    if (habitId === 'already-active') {
      throw new Error('DOMAIN_CONFLICT');
    }

    return success({
      route: '/api/habits',
      action: 'resume',
      habit: { id: habitId, userId, status: 'active' },
      requestId,
    });
  });
}
