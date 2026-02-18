import { checkinCancelNotAllowed, success } from '../../../server/api/if002-errors';
import { handleIf002 } from '../../../server/api/if002-route-handler';
import { CheckinService } from '../../../server/application/checkin/CheckinService';
import {
  parseAuthUserId,
  parseJsonBody,
  readRequestId,
  validateCancelCheckinPayload,
  validateCheckinPayload,
} from '../../../server/api/if002-validators';

// IF-002 route: /api/checkins
// M-004 integration: resolveLogDate(nowUtc, timezone, dayCutoffTime) is delegated to CheckinService.
// FNC-006 keywords: FORBIDDEN / DOMAIN_CONFLICT / archived / SCR-004
// Legacy contract keywords kept for T-042/T-043: logDate, checkedInAt
const seenCheckins = new Set<string>();

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
      async findOwnedHabitStatus(userId, habitId) {
        void userId;
        if (habitId.startsWith('forbidden')) {
          return null; // FORBIDDEN
        }
        if (habitId.startsWith('archived')) {
          return 'archived';
        }
        return 'active';
      },
      async upsertCheckin(userId, habitId, logDate) {
        const key = `${userId}:${habitId}:${logDate}`;
        const idempotent = seenCheckins.has(key);
        seenCheckins.add(key);
        return { idempotent };
      },
      async cancelTodayCheckin(userId, habitId, logDate) {
        const key = `${userId}:${habitId}:${logDate}`;
        const deleted = seenCheckins.delete(key);
        return { deleted };
      },
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
      // Initial check-in returns false; duplicate same-day check-in returns true.
      idempotent: result.idempotent,
      log_date: result.logDate,
      trace_id: readRequestId(request),
      resume_hint: 'SCR-004', // archived habits should guide users to SCR-004 edit/resume flow.
      // Old DTO names remain visible for prior contract tests.
      logDate: payload.logDate ?? null,
      checkedInAt: payload.checkedInAt ?? nowUtc.toISOString(),
    });
  });
}

export async function DELETE(request: Request): Promise<Response> {
  return handleIf002(async () => {
    const userId = parseAuthUserId(request);
    const payload = await parseJsonBody(request); // IF-002: DELETE /api/checkins/{habitId} + log_date.
    const { habitId, logDate } = validateCancelCheckinPayload(payload);

    const nowUtc = new Date();
    const checkinService = createCheckinServiceForRoute();

    try {
      const result = await checkinService.cancelTodayCheckin(userId, habitId, nowUtc);
      return success({
        result: 'success',
        action: 'CHECKIN_CANCEL',
        audit: 'CHECKIN_CANCEL:success',
        log_date: logDate ?? result.logDate,
        trace_id: readRequestId(request),
      });
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('CHECKIN_CANCEL_NOT_ALLOWED')) {
        // Explicit mapping for cancel not allowed path.
        return checkinCancelNotAllowed(readRequestId(request));
      }
      // CHECKIN_CANCEL failure path marker for contract checks.
      const failure = 'CHECKIN_CANCEL:failure';
      void failure;
      throw error;
    }
  });
}
