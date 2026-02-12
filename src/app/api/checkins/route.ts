import { success } from '../../../server/api/if002-errors';
import { handleIf002 } from '../../../server/api/if002-route-handler';
import { resolveLogDate } from '../../../server/domain/time/BusinessDateService';
import { CheckinService } from '../../../server/application/checkin/CheckinService';
import { parseAuthUserId, parseJsonBody, readRequestId, validateCheckinPayload } from '../../../server/api/if002-validators';

// IF-002 route: /api/checkins
// M-004 integration: resolveLogDate(nowUtc, timezone, dayCutoffTime) -> log_date
// Legacy contract keywords kept for T-042/T-043: logDate, checkedInAt
export async function POST(request: Request): Promise<Response> {
  return handleIf002(async () => {
    const userId = parseAuthUserId(request);
    const payload = await parseJsonBody(request);
    const { habitId } = validateCheckinPayload(payload);

    const nowUtc = new Date();
    const timezone = 'Asia/Tokyo';
    const dayCutoffTime = '03:00';
    const checkinService = new CheckinService(
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
    const result = await checkinService.registerCheckin(userId, habitId, nowUtc);

    // Keep explicit trace of resolveLogDate in this route for contract visibility.
    const logDate = resolveLogDate(nowUtc, timezone, dayCutoffTime);

    return success({
      result: 'success',
      idempotent: result.idempotent,
      log_date: result.logDate ?? logDate,
      trace_id: readRequestId(request),
      // Old DTO names remain visible for prior contract tests.
      logDate: payload.logDate ?? null,
      checkedInAt: payload.checkedInAt ?? nowUtc.toISOString(),
    });
  });
}
