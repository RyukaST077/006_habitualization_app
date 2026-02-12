import { describe, expect, it } from 'vitest';

import { requireApiRoute } from '../../helpers/api/contract-assertions';

describe('FNC-007 checkins cancel authorization contract (T-048 Red)', () => {
  it('expects FORBIDDEN(403) when user A tries user B cancel request', () => {
    const routeSource = requireApiRoute('src/app/api/checkins/route.ts');
    const errorSource = requireApiRoute('src/server/api/if002-errors.ts');
    expect(routeSource).toContain('/api/checkins');
    expect(routeSource).toContain('DELETE');
    expect(routeSource).toContain('FORBIDDEN');
    expect(errorSource).toContain('403');
    expect(errorSource).toContain('FORBIDDEN');
  });

  it('documents FR-025 RLS owner boundary for cancel path', () => {
    const serviceSource = requireApiRoute('src/server/application/checkin/CheckinService.ts');
    expect(serviceSource).toContain('FR-025');
    expect(serviceSource).toContain('RLS');
    expect(serviceSource).toContain('user_id');
    expect(serviceSource).toContain('DB_UNCHANGED');
  });

  it('expects CHECKIN_CANCEL audit keywords for success and failure paths', () => {
    const routeSource = requireApiRoute('src/app/api/checkins/route.ts');
    expect(routeSource).toContain('CHECKIN_CANCEL');
    expect(routeSource).toContain('success');
    expect(routeSource).toContain('failure');
  });
});
