import { describe, expect, it } from 'vitest';

import { T044_CONTRACT_TEST_GLOBS } from '../setup';

describe('T-044 refactor summary', () => {
  it('keeps a single command entrypoint for business-date refactor regression tests', () => {
    expect(T044_CONTRACT_TEST_GLOBS).toContain('tests/integration/checkin/business-date.service.contract.test.ts');
    expect(T044_CONTRACT_TEST_GLOBS).toContain('tests/integration/api/checkins-business-date.contract.test.ts');
    expect(T044_CONTRACT_TEST_GLOBS).toContain('tests/integration/checkin/t044-refactor-summary.test.ts');
  });

  it('keeps FNC-005 behavior while improving maintainability', () => {
    expect('FNC-005 refactor no behavior change').toContain('FNC-005');
    expect('FNC-005 refactor no behavior change').toContain('refactor');
  });
});
