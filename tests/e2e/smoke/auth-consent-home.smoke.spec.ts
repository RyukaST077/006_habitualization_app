import { test } from '@playwright/test';

import { resolveAuthBackendPolicy, smokeUsers } from '../fixtures/users';

const skeletonReason =
  'PR-002 skeleton: app selectors and backend contracts are finalized in later tasks.';

// Trace:
// - TC-AUTO-SMK-001
// - FNC-001, FNC-002
// - SCR-001 (Login), SCR-008 (Consent), SCR-002 (Home)
// - IF-001 (POST /api/auth/google/start)
test.describe('smoke: auth -> consent -> home', () => {
  test('TC-AUTO-SMK-001 login success path reaches home', async ({ page }) => {
    test.skip(true, skeletonReason);

    const policy = resolveAuthBackendPolicy();
    const user = smokeUsers.USER_A;

    // TODO(screen): SCR-001 ログイン画面を開き、ログイン導線を表示確認する。
    await page.goto('/login');

    // TODO(api): IF-001 POST /api/auth/google/start が mode に応じて期待レスポンスを返すこと。
    // TODO(authz): 未認証状態では /home に直接遷移できないこと。
    // TODO(screen): 同意未完了なら SCR-008 に遷移し、完了後に SCR-002 へ到達すること。
    // TODO(db): 同意状態・ユーザープロファイル更新を検証すること。
    // TODO(audit): 認証開始/成功イベントを監査ログで確認すること。
    void policy;
    void user;
  });

  test('TC-AUTO-SMK-004 unauthenticated access is denied', async ({ page }) => {
    test.skip(true, skeletonReason);

    // TODO(authz): 未認証ユーザーの保護画面アクセス拒否（302/401）を確認する。
    // TODO(screen): エラー表示にXSS耐性があること（危険文字列が無害化されること）を確認する。
    await page.goto('/home');
  });
});
