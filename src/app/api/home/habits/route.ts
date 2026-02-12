import { forbidden, success } from '../../../../server/api/if002-errors';
import { assertAuthHeader } from '../../../../server/api/if002-validators';

// IF-002 route: /api/home/habits
// Authorization: Bearer JWT required.
export async function GET(request: Request): Promise<Response> {
  try {
    assertAuthHeader(request);
    return success({ habits: [] });
  } catch {
    return forbidden();
  }
}
