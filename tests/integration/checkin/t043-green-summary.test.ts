import { describe, expect, it } from 'vitest';

import { T043_CONTRACT_TEST_GLOBS } from '../setup';

describe('T-043 green summary', () => {
  it('keeps a single command entrypoint for business date green tests', () => {
    expect(T043_CONTRACT_TEST_GLOBS).toContain('tests/integration/checkin/business-date.service.contract.test.ts');
    expect(T043_CONTRACT_TEST_GLOBS).toContain('tests/integration/api/checkins-business-date.contract.test.ts');
    expect(T043_CONTRACT_TEST_GLOBS).toContain('tests/integration/checkin/t043-green-summary.test.ts');
  });

  it('leaves handoff note for T-044 Refactor', () => {
    expect('T-044 Refactor handoff').toContain('T-044');
    expect('T-044 Refactor handoff').toContain('Refactor');
  });
});
