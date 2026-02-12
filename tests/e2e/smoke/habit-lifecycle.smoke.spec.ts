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
  test('TC-AUTO-SMK-002 FR-007/008/009: active -> archived -> active lifecycle', async ({ page }) => {
    test.skip(true, skeletonReason);

    const policy = resolveAuthBackendPolicy();
    const user = smokeUsers.USER_B;

    // TODO(screen): SCR-002 で習慣一覧/作成UIを表示する。
    await page.goto('/habits');

    // TODO(api): archive API 実行後に status=archived を観測する。
    // TODO(api): resume API 実行後に status=active を観測する。
    // TODO(api): 他ユーザーの状態遷移は FORBIDDEN(403) を返すことを観測する。
    // TODO(api): 不正遷移は DOMAIN_CONFLICT(409) を返すことを観測する。
    // TODO(db): status / archived_at が遷移に応じて更新されることを確認する。
    // TODO(audit): 習慣作成・更新・削除イベントの監査ログを確認する。
    // TODO(authz): セッション未確立時は作成操作を拒否すること。
    void policy;
    void user;
  });
});
