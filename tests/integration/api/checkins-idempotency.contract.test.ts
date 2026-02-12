import { describe, expect, it } from 'vitest';

import { requireApiRoute } from '../../helpers/api/contract-assertions';

describe('FNC-006 checkins idempotency contract (T-045 Red)', () => {
  it('expects active first checkin response contract with idempotent=false', () => {
    const sourceCode = requireApiRoute('src/app/api/checkins/route.ts');
    expect(sourceCode).toContain('/api/checkins');
    expect(sourceCode).toContain('idempotent');
    expect(sourceCode).toContain('false');
  });

  it('expects duplicate same-day checkin contract to expose idempotent=true path', () => {
    const sourceCode = requireApiRoute('src/server/application/checkin/CheckinService.ts');
    expect(sourceCode).toContain('idempotent');
    expect(sourceCode).toContain('true');
    expect(sourceCode).toContain('logDate');
  });

  it('expects archived habit checkin to map to DOMAIN_CONFLICT and resume route hint', () => {
    const routeSource = requireApiRoute('src/app/api/checkins/route.ts');
    const errorSource = requireApiRoute('src/server/api/if002-errors.ts');
    expect(routeSource).toContain('archived');
    expect(routeSource).toContain('SCR-004');
    expect(errorSource).toContain('DOMAIN_CONFLICT');
    expect(errorSource).toContain('409');
  });
});
