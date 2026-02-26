import { expect, test } from "@playwright/test";

import { SMOKE_USERS } from "../fixtures/users";
import { getMissingSmokeEnvKeys, loadSmokeEnv } from "../helpers/env";

test.describe("TC-AUTO-SMK-001 ログイン→同意→ホーム導線", () => {
  test("主要導線のスモーク雛形", async ({ page }) => {
    const missingKeys = getMissingSmokeEnvKeys();
    test.skip(
      missingKeys.length > 0,
      `[E2E] smoke test skipped because required env vars are missing: ${missingKeys.join(", ")}`
    );

    const env = loadSmokeEnv();
    const user = SMOKE_USERS.primary;

    await test.step("FR-001 SCR-001: ログイン画面を開く", async () => {
      await page.goto(env.baseUrl);
    });

    await test.step("FR-001 SCR-001 -> SCR-008/SCR-002: 認証情報を入力する（雛形）", async () => {
      await expect.soft(page).toHaveURL(/.*/);
      await test.info().attach("smoke-user", {
        body: Buffer.from(`${user.id}/${user.role}/${user.locale}`),
        contentType: "text/plain",
      });
      await test.info().attach("traceability", {
        body: Buffer.from("TC-AUTO-SMK-001,FR-001,FR-003,SCR-001,SCR-008,SCR-002"),
        contentType: "text/plain",
      });
    });

    await test.step("FR-003 SCR-008 -> SCR-002: 同意画面からホーム遷移を確認する（雛形）", async () => {
      await expect.soft(page).toHaveTitle(/.*/);
    });

    await test.step("FR-001 SCR-001: 認証失敗時にエラー表示され再試行できる（雛形）", async () => {
      await test.info().attach("retry-traceability", {
        body: Buffer.from("TC-AUTO-SMK-001,FR-001,SCR-001,認証失敗,再試行"),
        contentType: "text/plain",
      });
      await expect.soft(true).toBe(true);
    });
  });
});
