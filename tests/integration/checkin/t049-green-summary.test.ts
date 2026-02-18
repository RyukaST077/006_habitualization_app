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
});
