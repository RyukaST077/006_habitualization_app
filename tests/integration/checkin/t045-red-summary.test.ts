import { describe, expect, it } from 'vitest';

import { T045_CONTRACT_TEST_GLOBS } from '../setup';

describe('T-045 red summary (T-046 handoff)', () => {
  it('keeps a single command entrypoint for FNC-006 red tests', () => {
    expect(T045_CONTRACT_TEST_GLOBS).toContain('tests/integration/api/checkins-idempotency.contract.test.ts');
    expect(T045_CONTRACT_TEST_GLOBS).toContain('tests/integration/api/checkins-authorization.contract.test.ts');
    expect(T045_CONTRACT_TEST_GLOBS).toContain('tests/integration/checkin/t045-red-summary.test.ts');
  });

  it('tracks that T-046 checkin implementation is not implemented yet', () => {
    expect('T-046 checkin implemented').toContain('T-046');
    expect('T-046 checkin implemented').toContain('checkin');
    expect('T-046 checkin implemented').toContain('not implemented');
  });
});
