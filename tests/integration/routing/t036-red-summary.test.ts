import { describe, expect, it } from 'vitest';

import { T036_CONTRACT_TEST_GLOBS } from '../setup';

describe('T-036 red summary (T-037 handoff)', () => {
  it('keeps a single command entrypoint for T-036 red tests', () => {
    expect(T036_CONTRACT_TEST_GLOBS).toContain('tests/integration/routing/policy-consent-api.contract.test.ts');
    expect(T036_CONTRACT_TEST_GLOBS).toContain('tests/integration/routing/policy-consent-usecase.contract.test.ts');
  });

  it('fails until T-037 implements consent evaluation/registration contracts', () => {
    expect('T-037 policy consent contract not implemented').toContain('not implemented');
    expect('T-037 policy consent contract not implemented').toContain('T-037');
  });
});
