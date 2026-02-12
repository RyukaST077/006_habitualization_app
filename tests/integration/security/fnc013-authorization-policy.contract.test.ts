import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('FNC-013 AuthorizationPolicyService contract (Red)', () => {
  it('defines assertSelf/assertOpsRole and FORBIDDEN policy', () => {
    const path = resolve('src/server/application/authz/AuthorizationPolicyService.ts');

    expect(existsSync(path), 'AuthorizationPolicyService contract not implemented').toBe(true);

    const source = readFileSync(path, 'utf8');
    expect(source).toContain('assertSelf');
    expect(source).toContain('assertOpsRole');
    expect(source).toContain('FORBIDDEN');
    expect(source).toContain('ROLE-002');
  });
});
