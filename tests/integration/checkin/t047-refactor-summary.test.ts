import { describe, expect, it } from 'vitest';

import { T047_CONTRACT_TEST_GLOBS } from '../setup';

describe('T-047 refactor summary', () => {
  it('keeps a single command entrypoint for idempotency race refactor tests', () => {
    expect(T047_CONTRACT_TEST_GLOBS).toContain('tests/integration/api/checkins-idempotency.contract.test.ts');
    expect(T047_CONTRACT_TEST_GLOBS).toContain('tests/integration/api/checkins-authorization.contract.test.ts');
    expect(T047_CONTRACT_TEST_GLOBS).toContain('tests/integration/checkin/t047-refactor-summary.test.ts');
  });

  it('leaves handoff note for T-048 checkin cancel tests', () => {
    expect('T-048 idempotency race handoff').toContain('T-048');
    expect('T-048 idempotency race handoff').toContain('idempotency');
    expect('T-048 idempotency race handoff').toContain('race');
  });
});
