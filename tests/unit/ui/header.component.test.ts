import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('header component contracts (Red)', () => {
  it('SCR-COM-3.1-H: ロゴ/ホーム/履歴/設定/ログアウトが共通ヘッダーに表示される', () => {
    const headerComponent = readFileSync(resolve('src/components/common/app-header.tsx'), 'utf8');

    expect(headerComponent).toContain('ロゴ');
    expect(headerComponent).toContain('ホーム');
    expect(headerComponent).toContain('履歴');
    expect(headerComponent).toContain('設定');
    expect(headerComponent).toContain('ログアウト');
  });

  it('SCR-COM-3.1-H: ヘッダー導線が /home /history /settings に接続される', () => {
    const homePage = readFileSync(resolve('src/app/home/page.tsx'), 'utf8');
    const headerComponent = readFileSync(resolve('src/components/common/app-header.tsx'), 'utf8');

    expect(homePage).toContain('AppHeader');

    expect(headerComponent).toContain('href="/home"');
    expect(headerComponent).toContain('href="/history"');
    expect(headerComponent).toContain('href="/settings"');
  });
});
