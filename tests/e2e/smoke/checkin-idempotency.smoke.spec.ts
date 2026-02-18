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
  test.describe.configure({ mode: 'serial' });
  test.skip(true, skeletonReason);

  test('TC-AUTO-SMK-003 duplicate check-in is idempotent', async ({ page }) => {
    const policy = resolveAuthBackendPolicy();
    const user = smokeUsers.USER_A;

    // TODO(screen): 同日チェックインを連続実行できるUI導線を操作する。
    // TODO(screen): 取消ボタン(当日)を押下し、当日外は disabled を確認する。
    await page.goto('/habits');

    // TODO(api): 同一キーでの再送時に重複作成されないことを確認する。
    // TODO(db): checkin レコードが1件のまま維持されることを確認する。
    // TODO(audit): CHECKIN_CANCEL success/failure を含む監査観点を確認する。
    // TODO(api): DELETE /api/checkins へ log_date を送る取消契約を確認する。
    // TODO(authz): 未認証ユーザーのチェックインAPI呼び出しを拒否すること。
    void policy;
    void user;
  });
});
