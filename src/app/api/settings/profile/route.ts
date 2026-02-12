import {
  domainConflict,
  forbidden,
  internalError,
  success,
  validationError,
} from '../../../../server/api/if002-errors';
import { assertAuthHeader, parseJsonBody, requireKeys } from '../../../../server/api/if002-validators';

// IF-002 route: /api/settings/profile
export async function PATCH(request: Request): Promise<Response> {
  try {
    assertAuthHeader(request);
    const payload = await parseJsonBody(request);
    requireKeys(payload, ['timezone', 'dayCutoffTime']);
    return success({ updated: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'VALIDATION_ERROR') {
      return validationError();
    }
    if (error instanceof Error && error.message === 'DOMAIN_CONFLICT') {
      return domainConflict();
    }
    if (error instanceof Error && error.message === 'INTERNAL_ERROR') {
      return internalError();
    }

    return forbidden();
  }
}
