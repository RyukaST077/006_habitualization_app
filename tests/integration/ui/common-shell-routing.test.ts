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

    expect(loginPage).toContain(COMMON_UI_HEADER_REQUIRED_ITEMS[0]);
    expect(policyPage).toContain(COMMON_UI_FOOTER_REQUIRED_ITEMS[0]);
    expect(homePage).toContain(COMMON_UI_HEADER_REQUIRED_ITEMS[4]);
  });

  it('[SCR-002<->SCR-007] 画面遷移の前後でヘッダー項目（ホーム/履歴/設定）が維持される', () => {
    const homePage = readSourceFile('src/app/home/page.tsx');
    const settingsPage = readSourceFile('src/app/settings/page.tsx');

    expectContainsAll(homePage, COMMON_UI_HEADER_PERSISTENCE_ITEMS);
    expectContainsAll(settingsPage, COMMON_UI_HEADER_PERSISTENCE_ITEMS);
  });

  it('500応答時にトーストとtrace_idが表示され、500以外ではtrace_idを表示しない', () => {
    const targetPath = 'src/components/common/error-display.tsx';
    if (expectSourceFileExists(targetPath)) {
      const errorDisplay = readSourceFile(targetPath);
      expectErrorDisplayFixture(errorDisplay, fixtures.INTERNAL_500_TRACE_BOUNDARY);
    }
  });
});
