import { describe, expect, it } from 'vitest';
import { HOME_TRANSITION_LINKS } from '../../../src/client/routing/transition-map';

import {
  COMMON_UI_ANALYTICS_REQUIRED_ITEMS,
  COMMON_UI_FOOTER_REQUIRED_ITEMS,
  COMMON_UI_HEADER_PERSISTENCE_ITEMS,
  COMMON_UI_HEADER_REQUIRED_ITEMS,
  createCommonUiErrorDisplayFixtures,
  createCommonShellSourcePaths,
} from '../../helpers/ui/common-ui-fixtures';
import {
  expectContainsAll,
  expectErrorDisplayFixture,
  expectSourceFileExists,
  readSourceFiles,
  readSourceFile,
} from '../../helpers/ui/common-ui-assertions';

describe('common shell routing contracts (Red)', () => {
  const fixtures = createCommonUiErrorDisplayFixtures();
  const paths = createCommonShellSourcePaths();
  const sources = readSourceFiles([
    paths.LOGIN_PAGE,
    paths.POLICY_PAGE,
    paths.HOME_PAGE,
    paths.SETTINGS_PAGE,
    paths.ANALYTICS_PAGE,
    paths.HEADER_COMPONENT,
    paths.FOOTER_COMPONENT,
  ]);

  it('[SCR-001->SCR-008->SCR-002] 共通UI要素（ヘッダー/フッター）を主要導線で検証対象に含める', () => {
    const loginPage = sources[paths.LOGIN_PAGE];
    const policyPage = sources[paths.POLICY_PAGE];
    const homePage = sources[paths.HOME_PAGE];
    const headerComponent = sources[paths.HEADER_COMPONENT];
    const footerComponent = sources[paths.FOOTER_COMPONENT];

    expect(loginPage).toContain('AppHeader');
    expect(homePage).toContain('AppHeader');
    expect(policyPage).toContain('AppFooter');
    expectContainsAll(headerComponent, COMMON_UI_HEADER_REQUIRED_ITEMS);
    expectContainsAll(footerComponent, COMMON_UI_FOOTER_REQUIRED_ITEMS);
  });

  it('[SCR-002<->SCR-007] 画面遷移の前後でヘッダー項目（ホーム/履歴/設定）が維持される', () => {
    const homePage = sources[paths.HOME_PAGE];
    const settingsPage = sources[paths.SETTINGS_PAGE];
    const headerComponent = sources[paths.HEADER_COMPONENT];

    expect(homePage).toContain('AppHeader');
    expect(settingsPage).toContain('AppHeader');
    expectContainsAll(headerComponent, COMMON_UI_HEADER_PERSISTENCE_ITEMS);
  });

  it('[SCR-002->SCR-006] 任意機能/モック導線が主要導線を壊さず観測できる', () => {
    const homePage = sources[paths.HOME_PAGE];
    const analyticsPage = sources[paths.ANALYTICS_PAGE];
    const scr006Link = HOME_TRANSITION_LINKS.find((link) => link.to === 'SCR-006');

    expect(homePage).toContain('HOME_TRANSITION_LINKS.map');
    expect(scr006Link?.href).toBe('/analytics');
    expect(scr006Link?.label).toContain('任意機能/モック');
    expectContainsAll(analyticsPage, COMMON_UI_ANALYTICS_REQUIRED_ITEMS);
  });

  it('500応答時にトーストとtrace_idが表示され、500以外ではtrace_idを表示しない', () => {
    const targetPath = paths.ERROR_DISPLAY_COMPONENT;
    if (expectSourceFileExists(targetPath)) {
      const errorDisplay = readSourceFile(targetPath);
      expectErrorDisplayFixture(errorDisplay, fixtures.INTERNAL_500_TRACE_BOUNDARY);
    }
  });
});
