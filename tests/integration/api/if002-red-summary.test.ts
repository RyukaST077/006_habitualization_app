import { describe, expect, it } from 'vitest';

import { IF002_CONTRACT_TEST_GLOBS } from '../setup';
import { requireApiRoute } from '../../helpers/api/contract-assertions';

describe('IF-002 red summary (T-027 handoff)', () => {
  it('keeps a single command entrypoint for IF-002 red tests', () => {
    expect(IF002_CONTRACT_TEST_GLOBS).toEqual(['tests/integration/api/*.test.ts']);
  });

  it('fails until T-027 implements IF-002 routes', () => {
    expect('T-027 IF-002 route contract not implemented').toContain('not implemented');
    requireApiRoute('src/app/api/home/habits/route.ts');
  });
});

