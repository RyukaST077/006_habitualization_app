import { test } from '@playwright/test';

import { resolveAuthBackendPolicy, smokeUsers } from '../fixtures/users';

const skeletonReason =
  'PR-002 skeleton: lifecycle assertions will be completed in subsequent implementation PRs.';

// Trace:
// - TC-AUTO-SMK-002
// - FNC-002
// - SCR-002
// - IF-001 (session established before protected actions)
test.describe('smoke: habit lifecycle', () => {
  test('TC-AUTO-SMK-002 create -> edit -> archive habit', async ({ page }) => {
    test.skip(true, skeletonReason);

    const policy = resolveAuthBackendPolicy();
    const user = smokeUsers.USER_B;

    // TODO(screen): SCR-002 で習慣一覧/作成UIを表示する。
    await page.goto('/habits');

    // TODO(api): 習慣作成・更新・アーカイブAPIの成功/失敗を観測する。
    // TODO(db): habit テーブルの作成/更新/論理削除状態を確認する。
    // TODO(audit): 習慣作成・更新・削除イベントの監査ログを確認する。
    // TODO(authz): セッション未確立時は作成操作を拒否すること。
    void policy;
    void user;
  });
});
