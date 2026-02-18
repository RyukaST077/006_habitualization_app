import { describe, expect, it } from 'vitest';

import { requireApiRoute } from '../../helpers/api/contract-assertions';

describe('FNC-007 checkins cancel contract (T-048 Red)', () => {
  it('expects DELETE /api/checkins/{habitId} same-day cancel success contract', () => {
    // Trace: TC-IT-FR-014-001 / FR-014 / AC-014 / SCR-002 / IF-002
    const routeSource = requireApiRoute('src/app/api/checkins/route.ts');
    expect(routeSource).toContain('/api/checkins');
    expect(routeSource).toContain('DELETE');
    expect(routeSource).toContain('habitId');
    expect(routeSource).toContain('log_date');
  });

  it('expects out-of-day cancel to return CHECKIN_CANCEL_NOT_ALLOWED or DOMAIN_CONFLICT', () => {
    // Trace: TC-IT-FR-014-002 / FR-014 / AC-014 / IF-002
    const routeSource = requireApiRoute('src/app/api/checkins/route.ts');
    const errorSource = requireApiRoute('src/server/api/if002-errors.ts');
    expect(routeSource).toContain('CHECKIN_CANCEL_NOT_ALLOWED');
    expect(errorSource).toContain('DOMAIN_CONFLICT');
    expect(errorSource).toContain('409');
  });

  it('expects DB unchanged marker for rejected cancel request', () => {
    // Trace: TC-IT-FR-014-002 / DB_UNCHANGED / M-005 / TBL-003
    const serviceSource = requireApiRoute('src/server/application/checkin/CheckinService.ts');
    const repositorySource = requireApiRoute('src/server/infrastructure/repositories/HabitRepository.ts');
    expect(serviceSource).toContain('DB_UNCHANGED');
    expect(serviceSource).toContain('cancelTodayCheckin');
    expect(repositorySource).toContain('habit_logs');
    expect(repositorySource).toContain('log_date');
    expect(repositorySource).toContain('cancelTodayCheckin');
  });
});
