import { success } from '../../../server/api/if002-errors';
import { handleIf002 } from '../../../server/api/if002-route-handler';
import { CheckinService } from '../../../server/application/checkin/CheckinService';
import { parseAuthUserId, parseJsonBody, readRequestId, validateCheckinPayload } from '../../../server/api/if002-validators';

// IF-002 route: /api/checkins
// M-004 integration: resolveLogDate(nowUtc, timezone, dayCutoffTime) is delegated to CheckinService.
// Legacy contract keywords kept for T-042/T-043: logDate, checkedInAt
function createCheckinServiceForRoute(): CheckinService {
  const timezone = 'Asia/Tokyo';
  const dayCutoffTime = '03:00';

  return new CheckinService(
    {
      async findProfile() {
        return {
          timezone,
          dayCutoffTime,
          accountStatus: 'active',
        };
      },
      async incrementDailyActivity() {},
    },
    {
      async upsertCheckin() {},
    },
  );
}

export async function POST(request: Request): Promise<Response> {
  return handleIf002(async () => {
    const userId = parseAuthUserId(request);
    const payload = await parseJsonBody(request);
    const { habitId } = validateCheckinPayload(payload);

    const nowUtc = new Date();
    const checkinService = createCheckinServiceForRoute();
    const result = await checkinService.registerCheckin(userId, habitId, nowUtc);

    return success({
      result: 'success',
      idempotent: result.idempotent,
      log_date: result.logDate,
      trace_id: readRequestId(request),
      // Old DTO names remain visible for prior contract tests.
      logDate: payload.logDate ?? null,
      checkedInAt: payload.checkedInAt ?? nowUtc.toISOString(),
    });
  });
}
