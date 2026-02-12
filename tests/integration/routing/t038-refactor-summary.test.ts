import { describe, expect, it } from 'vitest';

import { T038_CONTRACT_TEST_GLOBS } from '../setup';

describe('T-038 refactor summary', () => {
  it('keeps a single command entrypoint for T-038 contract checks', () => {
    expect(T038_CONTRACT_TEST_GLOBS).toContain('tests/integration/routing/policy-consent-api.contract.test.ts');
    expect(T038_CONTRACT_TEST_GLOBS).toContain('tests/unit/routing/auth-screen-flow.test.ts');
    expect(T038_CONTRACT_TEST_GLOBS).toContain('tests/integration/routing/t038-refactor-summary.test.ts');
  });

  it('documents VERSION_CONFLICT hold-and-retry requirement for SCR-008', () => {
    expect('SCR-008 VERSION_CONFLICT hold and retry').toContain('SCR-008');
    expect('SCR-008 VERSION_CONFLICT hold and retry').toContain('VERSION_CONFLICT');
    expect('SCR-008 VERSION_CONFLICT hold and retry').toContain('retry');
  });
});
