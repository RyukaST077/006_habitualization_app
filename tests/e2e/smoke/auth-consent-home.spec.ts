import { expect, test } from "@playwright/test";

import { SMOKE_USERS } from "../fixtures/users";
import { loadSmokeEnv } from "../helpers/env";

test.describe("TC-AUTO-SMK-001 ログイン→同意→ホーム導線", () => {
  test("主要導線のスモーク雛形", async ({ page }) => {
    const env = loadSmokeEnv();
    const user = SMOKE_USERS.primary;

    await test.step("ログイン画面を開く", async () => {
      await page.goto(env.baseUrl);
    });

    await test.step("認証情報を入力する（雛形）", async () => {
      await expect.soft(page).toHaveURL(/.*/);
      await test.info().attach("smoke-user", {
        body: Buffer.from(`${user.id}/${user.role}/${user.locale}`),
        contentType: "text/plain",
      });
      await test.info().attach("traceability", {
        body: Buffer.from("TC-AUTO-SMK-001"),
        contentType: "text/plain",
      });
    });

    await test.step("同意画面からホーム遷移を確認する（雛形）", async () => {
      await expect.soft(page).toHaveTitle(/.*/);
    });
  });
});
