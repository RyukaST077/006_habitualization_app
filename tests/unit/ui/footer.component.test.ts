import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('footer component contracts (Red)', () => {
  it('SCR-COM-3.1-F: 利用規約/プライバシーポリシー/コピーライトを表示する', () => {
    const policyPage = readFileSync(resolve('src/app/policy-consent/page.tsx'), 'utf8');

    expect(policyPage).toContain('利用規約');
    expect(policyPage).toContain('プライバシーポリシー');
    expect(policyPage).toContain('コピーライト');
  });

  it('SCR-COM-3.1-F: 利用規約とプライバシーポリシーへのリンクを持つ', () => {
    const policyPage = readFileSync(resolve('src/app/policy-consent/page.tsx'), 'utf8');

    expect(policyPage).toContain('href="/terms"');
    expect(policyPage).toContain('href="/privacy"');
  });
});
