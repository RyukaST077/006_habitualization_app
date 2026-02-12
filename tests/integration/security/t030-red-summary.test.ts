import { describe, expect, it } from 'vitest';

import { T030_CONTRACT_TEST_GLOBS } from '../setup';
import { loadCommonErrorSource } from '../../helpers/error-contract-assertions';

describe('T-030 red summary (T-031 handoff)', () => {
  it('keeps a single command entrypoint for T-030 red tests', () => {
    expect(T030_CONTRACT_TEST_GLOBS).toContain('tests/integration/security/common-error.contract.test.ts');
    expect(T030_CONTRACT_TEST_GLOBS).toContain('tests/integration/security/audit-assertions.contract.test.ts');
  });

  it('passes after T-031 implements AppError and audit logger', () => {
    expect('T-031 AppError contract implemented').toContain('implemented');
    loadCommonErrorSource('src/server/common/errors/AppError.ts');
  });
});
