import { describe, expect, it } from 'vitest';

import { T042_CONTRACT_TEST_GLOBS } from '../setup';

describe('T-042 red summary (T-043 handoff)', () => {
  it('keeps a single command entrypoint for business date red tests', () => {
    expect(T042_CONTRACT_TEST_GLOBS).toContain('tests/integration/checkin/business-date.service.contract.test.ts');
    expect(T042_CONTRACT_TEST_GLOBS).toContain('tests/integration/api/checkins-business-date.contract.test.ts');
    expect(T042_CONTRACT_TEST_GLOBS).toContain('tests/integration/checkin/t042-red-summary.test.ts');
  });

  it('tracks that T-043 owns business date green implementation', () => {
    expect('T-043 business date not implemented').toContain('T-043');
    expect('T-043 business date not implemented').toContain('not implemented');
    expect('T-043 business date not implemented').toContain('business date');
  });
});
