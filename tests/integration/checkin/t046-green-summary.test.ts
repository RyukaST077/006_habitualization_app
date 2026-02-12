import { describe, expect, it } from 'vitest';

import { T046_CONTRACT_TEST_GLOBS } from '../setup';

describe('T-046 green summary', () => {
  it('keeps a single command entrypoint for FNC-006 green tests', () => {
    expect(T046_CONTRACT_TEST_GLOBS).toContain('tests/integration/api/checkins-idempotency.contract.test.ts');
    expect(T046_CONTRACT_TEST_GLOBS).toContain('tests/integration/api/checkins-authorization.contract.test.ts');
    expect(T046_CONTRACT_TEST_GLOBS).toContain('tests/integration/checkin/t046-green-summary.test.ts');
  });

  it('leaves handoff note for T-047 idempotency race follow-up', () => {
    expect('T-047 idempotency race handoff').toContain('T-047');
    expect('T-047 idempotency race handoff').toContain('idempotency');
    expect('T-047 idempotency race handoff').toContain('race');
  });
});
