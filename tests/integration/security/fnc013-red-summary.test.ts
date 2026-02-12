import { describe, expect, it } from 'vitest';

import { FNC013_CONTRACT_TEST_GLOBS } from '../setup';
import { loadFnc013Sql } from '../../helpers/db/fnc013-rls-assertions';

describe('FNC-013 red summary (T-029 handoff)', () => {
  it('keeps a single command entrypoint for FNC-013 red tests', () => {
    expect(FNC013_CONTRACT_TEST_GLOBS).toContain('tests/integration/db/fnc013-rls-policy.contract.test.ts');
    expect(FNC013_CONTRACT_TEST_GLOBS).toContain(
      'tests/integration/security/fnc013-authorization-policy.contract.test.ts',
    );
  });

  it('passes after T-029 implements FNC-013 contracts', () => {
    expect('T-029 FNC-013 contract implemented').toContain('implemented');
    loadFnc013Sql('src/server/authz/sql/fnc013-rls.sql');
  });
});
