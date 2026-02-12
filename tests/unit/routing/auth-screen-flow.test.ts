import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('auth screen flow ui contracts', () => {
  it('login page calls auth start API and keeps retryable error rendering', () => {
    const loginPageContent = readFileSync(resolve('src/app/login/page.tsx'), 'utf8');

    expect(loginPageContent).toContain("fetch('/api/auth/google/start'");
    expect(loginPageContent).toContain("redirectTo: '/home'");
    expect(loginPageContent).toContain('Googleでログイン');
    expect(loginPageContent).toContain('role="alert"');
    expect(loginPageContent).toContain('AUTH_FAILED');
    expect(loginPageContent).toContain('AUTH_PROVIDER_ERROR');
  });

  it('policy consent page wires accept/reject transitions to home/login', () => {
    const policyPageContent = readFileSync(resolve('src/app/policy-consent/page.tsx'), 'utf8');

    expect(policyPageContent).toContain('POLICY_CONSENT_TRANSITION');
    expect(policyPageContent).toContain('POLICY_REJECT_TRANSITION');
    expect(policyPageContent).toContain('同意して続行');
    expect(policyPageContent).toContain('同意しない');
  });

  it('transition map defines login->consent and consent reject->login links', () => {
    const transitionMapContent = readFileSync(resolve('src/client/routing/transition-map.ts'), 'utf8');

    expect(transitionMapContent).toContain('LOGIN_TO_CONSENT_TRANSITION');
    expect(transitionMapContent).toContain("label: 'Googleでログイン'");
    expect(transitionMapContent).toContain('POLICY_REJECT_TRANSITION');
    expect(transitionMapContent).toContain("href: resolveRoutePath('SCR-001')");
  });
});
