import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('policy consent api contract (Red)', () => {
  it('defines current policy route contract for /api/policies/current', () => {
    const currentPoliciesPath = resolve('src/app/api/policies/current/route.ts');

    expect(existsSync(currentPoliciesPath), 'policy current API contract not implemented').toBe(true);

    const source = readFileSync(currentPoliciesPath, 'utf8');
    expect(source).toContain('policies/current');
    expect(source).toContain('policy_settings');
    expect(source).toContain('terms');
    expect(source).toContain('privacy');
  });

  it('defines consent registration route contract for /api/policies/consents', () => {
    const policyConsentsPath = resolve('src/app/api/policies/consents/route.ts');

    expect(existsSync(policyConsentsPath), 'policy consents API contract not implemented').toBe(true);

    const source = readFileSync(policyConsentsPath, 'utf8');
    expect(source).toContain('policies/consents');
    expect(source).toContain('policy_consents');
    expect(source).toContain('normalizePolicyConsentConflict');
    expect(source).toContain('status: 409');
    expect(source).toContain('VERSION_CONFLICT');
    expect(source).toContain('POLICY_UPDATE_FAILED');
  });
});
