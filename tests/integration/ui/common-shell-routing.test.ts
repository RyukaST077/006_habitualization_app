import { describe, expect, it } from 'vitest';

import {
  COMMON_UI_FOOTER_REQUIRED_ITEMS,
  COMMON_UI_HEADER_PERSISTENCE_ITEMS,
  COMMON_UI_HEADER_REQUIRED_ITEMS,
  createCommonUiErrorDisplayFixtures,
} from '../../helpers/ui/common-ui-fixtures';
import {
  expectContainsAll,
  expectErrorDisplayFixture,
  expectSourceFileExists,
  readSourceFile,
} from '../../helpers/ui/common-ui-assertions';

describe('common shell routing contracts (Red)', () => {
  const fixtures = createCommonUiErrorDisplayFixtures();

  it('[SCR-001->SCR-008->SCR-002] 共通UI要素（ヘッダー/フッター）を主要導線で検証対象に含める', () => {
    const loginPage = readSourceFile('src/app/login/page.tsx');
    const policyPage = readSourceFile('src/app/policy-consent/page.tsx');
    const homePage = readSourceFile('src/app/home/page.tsx');
    const headerComponent = readSourceFile('src/components/common/app-header.tsx');
    const footerComponent = readSourceFile('src/components/common/app-footer.tsx');

    expect(loginPage).toContain('AppHeader');
    expect(homePage).toContain('AppHeader');
    expect(policyPage).toContain('AppFooter');
    expectContainsAll(headerComponent, COMMON_UI_HEADER_REQUIRED_ITEMS);
    expectContainsAll(footerComponent, COMMON_UI_FOOTER_REQUIRED_ITEMS);
  });

  it('[SCR-002<->SCR-007] 画面遷移の前後でヘッダー項目（ホーム/履歴/設定）が維持される', () => {
    const homePage = readSourceFile('src/app/home/page.tsx');
    const settingsPage = readSourceFile('src/app/settings/page.tsx');
    const headerComponent = readSourceFile('src/components/common/app-header.tsx');

    expect(homePage).toContain('AppHeader');
    expect(settingsPage).toContain('AppHeader');
    expectContainsAll(headerComponent, COMMON_UI_HEADER_PERSISTENCE_ITEMS);
  });

  it('500応答時にトーストとtrace_idが表示され、500以外ではtrace_idを表示しない', () => {
    const targetPath = 'src/components/common/error-display.tsx';
    if (expectSourceFileExists(targetPath)) {
      const errorDisplay = readSourceFile(targetPath);
      expectErrorDisplayFixture(errorDisplay, fixtures.INTERNAL_500_TRACE_BOUNDARY);
    }
  });
});
