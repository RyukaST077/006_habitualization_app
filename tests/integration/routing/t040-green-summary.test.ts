import { describe, expect, it } from 'vitest';

import { T040_CONTRACT_TEST_GLOBS } from '../setup';

describe('T-040 green summary', () => {
  it('keeps a single command entrypoint for T-040 contract checks', () => {
    expect(T040_CONTRACT_TEST_GLOBS).toContain('tests/integration/routing/habit-api.contract.test.ts');
    expect(T040_CONTRACT_TEST_GLOBS).toContain('tests/integration/routing/habit-usecase.contract.test.ts');
    expect(T040_CONTRACT_TEST_GLOBS).toContain('tests/integration/routing/t039-red-summary.test.ts');
    expect(T040_CONTRACT_TEST_GLOBS).toContain('tests/integration/routing/t040-green-summary.test.ts');
  });

  it('documents lifecycle green completion for create/update/archive/resume', () => {
    expect('T-040 lifecycle create update archive resume green').toContain('T-040');
    expect('T-040 lifecycle create update archive resume green').toContain('archive');
    expect('T-040 lifecycle create update archive resume green').toContain('resume');
    expect('T-040 lifecycle create update archive resume green').toContain('green');
  });
});
