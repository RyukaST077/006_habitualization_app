import { describe, expect, it } from 'vitest';

import { requireApiRoute } from '../../helpers/api/contract-assertions';

describe('T-049 PR-002 green summary', () => {
  it('includes cancelTodayCheckin service contract and out-of-day rejection markers', () => {
    const serviceSource = requireApiRoute('src/server/application/checkin/CheckinService.ts');
    expect(serviceSource).toContain('cancelTodayCheckin');
    expect(serviceSource).toContain('CHECKIN_CANCEL_NOT_ALLOWED');
    expect(serviceSource).toContain('DB_UNCHANGED');
    expect(serviceSource).toContain('FR-025');
    expect(serviceSource).toContain('RLS');
  });

  it('includes SCR-002 cancel UI and observability markers for PR-005', () => {
    const homeSource = requireApiRoute('src/app/home/page.tsx');
    const e2eSource = requireApiRoute('tests/e2e/smoke/checkin-idempotency.smoke.spec.ts');
    expect(homeSource).toContain('取消');
    expect(homeSource).toContain('CHECKIN_CANCEL');
    expect(homeSource).toContain('log_date');
    expect(homeSource).toContain('DELETE');
    expect(e2eSource).toContain('CHECKIN_CANCEL');
    expect(e2eSource).toContain('DELETE /api/checkins');
  });
});
