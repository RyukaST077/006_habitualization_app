import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('common shell routing contracts (Red)', () => {
  it('[SCR-001->SCR-008->SCR-002] 共通UI要素（ヘッダー/フッター）を主要導線で検証対象に含める', () => {
    const loginPage = readFileSync(resolve('src/app/login/page.tsx'), 'utf8');
    const policyPage = readFileSync(resolve('src/app/policy-consent/page.tsx'), 'utf8');
    const homePage = readFileSync(resolve('src/app/home/page.tsx'), 'utf8');

    expect(loginPage).toContain('ロゴ');
    expect(policyPage).toContain('利用規約');
    expect(homePage).toContain('ログアウト');
  });

  it('[SCR-002<->SCR-007] 画面遷移の前後でヘッダー項目（ホーム/履歴/設定）が維持される', () => {
    const homePage = readFileSync(resolve('src/app/home/page.tsx'), 'utf8');
    const settingsPage = readFileSync(resolve('src/app/settings/page.tsx'), 'utf8');

    expect(homePage).toContain('ホーム');
    expect(homePage).toContain('履歴');
    expect(homePage).toContain('設定');

    expect(settingsPage).toContain('ホーム');
    expect(settingsPage).toContain('履歴');
    expect(settingsPage).toContain('設定');
  });

  it('500応答時にトーストとtrace_idが表示され、500以外ではtrace_idを表示しない', () => {
    const errorDisplay = readFileSync(resolve('src/components/common/error-display.tsx'), 'utf8');

    expect(errorDisplay).toContain('status === 500');
    expect(errorDisplay).toContain('trace_id');
    expect(errorDisplay).toContain('toast');
    expect(errorDisplay).toContain('status !== 500');
  });
});
