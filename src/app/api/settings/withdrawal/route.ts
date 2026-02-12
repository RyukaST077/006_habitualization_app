import { forbidden, success, validationError } from '../../../../server/api/if002-errors';
import { assertAuthHeader, parseJsonBody, requireKeys } from '../../../../server/api/if002-validators';

// IF-002 route: /api/settings/withdrawal
// Authorization required; response includes trace_id.
export async function POST(request: Request): Promise<Response> {
  try {
    assertAuthHeader(request);
    const payload = await parseJsonBody(request);
    requireKeys(payload, ['confirmation']);
    return success({ accepted: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'VALIDATION_ERROR') {
      return validationError();
    }

    return forbidden();
  }
}
