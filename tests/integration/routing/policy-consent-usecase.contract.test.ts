import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('policy consent usecase contract (Red)', () => {
  it('defines consent evaluation usecase with policy_settings/policy_consents references', () => {
    const evaluateConsentPath = resolve('src/server/policies/evaluate-policy-consent.ts');

    expect(existsSync(evaluateConsentPath), 'policy consent evaluator contract not implemented').toBe(true);

    const source = readFileSync(evaluateConsentPath, 'utf8');
    expect(source).toContain('policy_settings');
    expect(source).toContain('policy_consents');
    expect(source).toContain('POLICY_CONSENT_ACCEPT');
  });

  it('defines consent registration usecase with accept/reject audit events', () => {
    const registerConsentPath = resolve('src/server/policies/register-policy-consents.ts');

    expect(existsSync(registerConsentPath), 'policy consent registration contract not implemented').toBe(true);

    const source = readFileSync(registerConsentPath, 'utf8');
    expect(source).toContain('POLICY_CONSENT_ACCEPT');
    expect(source).toContain('POLICY_CONSENT_REJECT');
    expect(source).toContain('policy_version');
    expect(source).toContain('VERSION_CONFLICT');
    expect(source).toContain('CONSENT_ALREADY_EXISTS');
  });

  it('defines conflict normalization contract for IF-004 and M-002 terms', () => {
    const contractPath = resolve('src/server/policies/policy-consent-contract.ts');

    expect(existsSync(contractPath), 'policy consent contract not implemented').toBe(true);

    const source = readFileSync(contractPath, 'utf8');
    expect(source).toContain('VERSION_CONFLICT');
    expect(source).toContain('POLICY_VERSION_MISMATCH');
    expect(source).toContain('CONSENT_ALREADY_EXISTS');
    expect(source).toContain('normalizePolicyConsentConflict');
  });
});
