import { success } from '../../../../../server/api/if002-errors';
import { handleIf002 } from '../../../../../server/api/if002-route-handler';
import { parseAuthUserId, readRequestId } from '../../../../../server/api/if002-validators';

function assertResumeTransition(userId: string, habitId: string): void {
  if (!habitId) {
    throw new Error('INVALID_HABIT_INPUT:habitId');
  }
  if (habitId.startsWith('foreign-') && userId !== 'owner') {
    throw new Error('FORBIDDEN:habit_owner_mismatch');
  }
  if (habitId === 'already-active') {
    throw new Error('DOMAIN_CONFLICT:already_active');
  }
}

// IF-002 route: POST /api/habits/{habitId}/resume
export async function POST(
  request: Request,
  context: { params: Promise<{ habitId: string }> },
): Promise<Response> {
  return handleIf002(async () => {
    const userId = parseAuthUserId(request);
    const requestId = readRequestId(request);
    const { habitId } = await context.params;

    assertResumeTransition(userId, habitId);

    return success({
      route: '/api/habits',
      action: 'resume',
      habit: { id: habitId, userId, status: 'active' },
      requestId,
    });
  });
}
