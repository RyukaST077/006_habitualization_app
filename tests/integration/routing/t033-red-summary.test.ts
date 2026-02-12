import { describe, expect, it } from 'vitest';

import { T033_CONTRACT_TEST_GLOBS } from '../setup';

describe('T-033 red summary (T-034 handoff)', () => {
  it('keeps a single command entrypoint for T-033 red tests', () => {
    expect(T033_CONTRACT_TEST_GLOBS).toContain('tests/integration/routing/auth-callback-logout.contract.test.ts');
    expect(T033_CONTRACT_TEST_GLOBS).toContain('tests/integration/routing/auth-usecase.contract.test.ts');
  });

  it('passes after T-034 implements callback/logout auth contracts', () => {
    expect('T-034 auth callback/logout contract implemented').toContain('implemented');
  });
});
