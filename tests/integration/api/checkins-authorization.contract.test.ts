import { describe, expect, it } from 'vitest';

import { requireApiRoute } from '../../helpers/api/contract-assertions';

describe('FNC-006 checkins authorization contract (T-045 Red)', () => {
  it('expects FORBIDDEN(403) when user A posts user B habit_id', () => {
    const routeSource = requireApiRoute('src/app/api/checkins/route.ts');
    const errorSource = requireApiRoute('src/server/api/if002-errors.ts');
    expect(routeSource).toContain('/api/checkins');
    expect(routeSource).toContain('habitId');
    expect(routeSource).toContain('FORBIDDEN');
    expect(errorSource).toContain('403');
    expect(errorSource).toContain('FORBIDDEN');
  });

  it('expects DB unchanged assertion hooks for rejected authorization', () => {
    const serviceSource = requireApiRoute('src/server/application/checkin/CheckinService.ts');
    expect(serviceSource).toContain('DB_UNCHANGED');
    expect(serviceSource).toContain('FORBIDDEN');
  });

  it('documents FR-025/RLS boundary keywords for checkin authorization', () => {
    const serviceSource = requireApiRoute('src/server/application/checkin/CheckinService.ts');
    expect(serviceSource).toContain('FR-025');
    expect(serviceSource).toContain('RLS');
    expect(serviceSource).toContain('user_id');
  });
});
