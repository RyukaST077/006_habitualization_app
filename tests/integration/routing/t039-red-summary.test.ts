import { describe, expect, it } from 'vitest';

import { T039_CONTRACT_TEST_GLOBS } from '../setup';

describe('T-039 red summary (T-040 handoff)', () => {
  it('keeps a single command entrypoint for habit lifecycle red tests', () => {
    expect(T039_CONTRACT_TEST_GLOBS).toContain('tests/integration/routing/habit-api.contract.test.ts');
    expect(T039_CONTRACT_TEST_GLOBS).toContain('tests/integration/routing/habit-usecase.contract.test.ts');
    expect(T039_CONTRACT_TEST_GLOBS).toContain('tests/integration/routing/t039-red-summary.test.ts');
  });

  it('fails until T-040 implements habit lifecycle contracts', () => {
    expect('T-040 habit lifecycle not implemented').toContain('T-040');
    expect('T-040 habit lifecycle not implemented').toContain('not implemented');
    expect('T-040 habit lifecycle not implemented').toContain('habit lifecycle');
  });
});
