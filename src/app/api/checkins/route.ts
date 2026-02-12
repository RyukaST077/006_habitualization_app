import { forbidden, success, validationError } from '../../../server/api/if002-errors';
import { assertAuthHeader, parseJsonBody, requireKeys } from '../../../server/api/if002-validators';

// IF-002 route: /api/checkins
export async function POST(request: Request): Promise<Response> {
  try {
    assertAuthHeader(request);
    const payload = await parseJsonBody(request);
    requireKeys(payload, ['habitId', 'logDate', 'checkedInAt']);
    return success({ checkedIn: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'VALIDATION_ERROR') {
      return validationError();
    }

    return forbidden();
  }
}
