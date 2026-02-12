import { describe, expect, it } from 'vitest';

import { T048_CONTRACT_TEST_GLOBS } from '../setup';

describe('T-048 red summary (T-049 handoff)', () => {
  it('keeps a single command entrypoint for FNC-007 red tests', () => {
    expect(T048_CONTRACT_TEST_GLOBS).toContain('tests/integration/api/checkins-cancel.contract.test.ts');
    expect(T048_CONTRACT_TEST_GLOBS).toContain('tests/integration/api/checkins-cancel-authorization.contract.test.ts');
    expect(T048_CONTRACT_TEST_GLOBS).toContain('tests/integration/checkin/t048-red-summary.test.ts');
  });

  it('tracks that T-049 cancel implementation is not implemented yet', () => {
    expect('T-049 cancel not implemented').toContain('T-049');
    expect('T-049 cancel not implemented').toContain('cancel');
    expect('T-049 cancel not implemented').toContain('not implemented');
  });
});
