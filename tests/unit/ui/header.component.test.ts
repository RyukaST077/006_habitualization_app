import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('header component contracts (Red)', () => {
  it('SCR-COM-3.1-H: ロゴ/ホーム/履歴/設定/ログアウトが共通ヘッダーに表示される', () => {
    const homePage = readFileSync(resolve('src/app/home/page.tsx'), 'utf8');

    expect(homePage).toContain('ロゴ');
    expect(homePage).toContain('ホーム');
    expect(homePage).toContain('履歴');
    expect(homePage).toContain('設定');
    expect(homePage).toContain('ログアウト');
  });

  it('SCR-COM-3.1-H: ヘッダー導線が /home /history /settings に接続される', () => {
    const homePage = readFileSync(resolve('src/app/home/page.tsx'), 'utf8');

    expect(homePage).toContain('href="/home"');
    expect(homePage).toContain('href="/history"');
    expect(homePage).toContain('href="/settings"');
  });
});
