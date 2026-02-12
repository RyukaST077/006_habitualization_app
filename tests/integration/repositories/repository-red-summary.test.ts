import { describe, expect, it } from 'vitest';

import { REPOSITORY_CONTRACT_TEST_GLOBS } from '../setup';
import { loadRepositorySource } from '../../helpers/db/repository-contract-assertions';

describe('repository contract red summary (T-025 handoff)', () => {
  it('keeps a single command entrypoint for repository red tests', () => {
    expect(REPOSITORY_CONTRACT_TEST_GLOBS).toEqual(['tests/integration/repositories/*.test.ts']);
  });

  it('loads repository index after T-025 implementation', () => {
    expect('T-025 Repository contracts implemented').toContain('implemented');
    loadRepositorySource('src/server/infrastructure/repositories/index.ts');
  });
});
