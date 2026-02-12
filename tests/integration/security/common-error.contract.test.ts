import { describe, it } from 'vitest';

import { expectErrorKeywords, loadCommonErrorSource } from '../../helpers/error-contract-assertions';

describe('common error contract (Red)', () => {
  it('defines AppError/trace_id and common error mapping', () => {
    const source = loadCommonErrorSource('src/server/common/errors/AppError.ts');
    expect(source).toContain('AppError');
    expect(source).toContain('trace_id');
    expect(source).toContain('FORBIDDEN');
    expect(source).toContain('INTERNAL_ERROR');
    expectErrorKeywords(source);
  });
});
