import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('footer component contracts (Red)', () => {
  it('SCR-COM-3.1-F: 利用規約/プライバシーポリシー/コピーライトを表示する', () => {
    const footerComponent = readFileSync(resolve('src/components/common/app-footer.tsx'), 'utf8');

    expect(footerComponent).toContain('利用規約');
    expect(footerComponent).toContain('プライバシーポリシー');
    expect(footerComponent).toContain('コピーライト');
  });

  it('SCR-COM-3.1-F: 利用規約とプライバシーポリシーへのリンクを持つ', () => {
    const policyPage = readFileSync(resolve('src/app/policy-consent/page.tsx'), 'utf8');
    const footerComponent = readFileSync(resolve('src/components/common/app-footer.tsx'), 'utf8');

    expect(policyPage).toContain('AppFooter');
    expect(footerComponent).toContain('href="/terms"');
    expect(footerComponent).toContain('href="/privacy"');
  });
});
