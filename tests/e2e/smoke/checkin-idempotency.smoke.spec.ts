import { test } from '@playwright/test';

import { resolveAuthBackendPolicy, smokeUsers } from '../fixtures/users';

const skeletonReason =
  'PR-002 skeleton: idempotency verification needs stable test data fixtures.';

// Trace:
// - TC-AUTO-SMK-003
// - FNC-002
// - SCR-002
// - IF-001 (authenticated session prerequisite)
test.describe('smoke: check-in idempotency', () => {
  test('TC-AUTO-SMK-003 duplicate check-in is idempotent', async ({ page }) => {
    test.skip(true, skeletonReason);

    const policy = resolveAuthBackendPolicy();
    const user = smokeUsers.USER_A;

    // TODO(screen): 同日チェックインを連続実行できるUI導線を操作する。
    await page.goto('/habits');

    // TODO(api): 同一キーでの再送時に重複作成されないことを確認する。
    // TODO(db): checkin レコードが1件のまま維持されることを確認する。
    // TODO(audit): 重複試行時の監査イベントが期待どおり記録されることを確認する。
    // TODO(authz): 未認証ユーザーのチェックインAPI呼び出しを拒否すること。
    void policy;
    void user;
  });
});
