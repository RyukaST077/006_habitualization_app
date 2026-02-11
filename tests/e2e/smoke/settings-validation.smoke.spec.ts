import { test } from '@playwright/test';

import { resolveAuthBackendPolicy, smokeUsers } from '../fixtures/users';

const skeletonReason =
  'PR-002 skeleton: settings validation assertions are prepared as TODO markers.';

// Trace:
// - TC-AUTO-SMK-005
// - FNC-002
// - SCR-002 (settings entry)
// - IF-001 (authenticated session)
test.describe('smoke: settings validation', () => {
  test('TC-AUTO-SMK-005 invalid settings payload is rejected safely', async ({ page }) => {
    test.skip(true, skeletonReason);

    const policy = resolveAuthBackendPolicy();
    const user = smokeUsers.OPS_1;

    // TODO(screen): 設定画面を開き、不正入力に対するバリデーション文言を確認する。
    await page.goto('/settings');

    // TODO(api): バリデーション失敗時のHTTPステータス/エラーコードを確認する。
    // TODO(security): XSSペイロードがエスケープされることを確認する。
    // TODO(db): バリデーション失敗時にDB更新が発生しないことを確認する。
    // TODO(audit): 設定更新失敗イベントを監査ログで確認する。
    void policy;
    void user;
  });
});
