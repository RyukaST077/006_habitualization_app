import { success } from '../../../server/api/if002-errors';
import { handleIf002 } from '../../../server/api/if002-route-handler';
import { resolveLogDate } from '../../../server/domain/time/BusinessDateService';
import { assertAuthHeader, parseJsonBody, readRequestId, requireKeys } from '../../../server/api/if002-validators';

// IF-002 route: /api/checkins
// M-004 integration: resolveLogDate(nowUtc, timezone, dayCutoffTime) -> log_date
// Legacy contract keywords kept for T-042/T-043: logDate, checkedInAt
export async function POST(request: Request): Promise<Response> {
  return handleIf002(async () => {
    assertAuthHeader(request);
    const payload = await parseJsonBody(request);
    requireKeys(payload, ['habitId']);

    const habitId = payload.habitId;
    if (!(typeof habitId === 'string' || typeof habitId === 'number')) {
      throw new Error('VALIDATION_ERROR:habitId');
    }

    const nowUtc = new Date();
    const timezone = 'Asia/Tokyo';
    const dayCutoffTime = '03:00';
    const logDate = resolveLogDate(nowUtc, timezone, dayCutoffTime);

    return success({
      result: 'success',
      idempotent: false,
      log_date: logDate,
      trace_id: readRequestId(request),
      // Old DTO names remain visible for prior contract tests.
      logDate: payload.logDate ?? null,
      checkedInAt: payload.checkedInAt ?? nowUtc.toISOString(),
    });
  });
}
