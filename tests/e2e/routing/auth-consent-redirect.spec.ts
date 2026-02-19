import { expect, test } from "@playwright/test";

import { ROUTING_SCENARIOS } from "../fixtures/routing-state";

test.describe("T-010 PR-002 auth/consent redirect red tests", () => {
  test("FR-001 SCR-001 -> SCR-008: 未同意ユーザーを同意画面へ誘導する", async ({ page }) => {
    const scenario = ROUTING_SCENARIOS[0];

    await test.step(`[${scenario.id}] ${scenario.traceIds.join("/")}`, async () => {
      await page.goto(scenario.startPath);
      // Red: 実装前のため意図的に不一致URLを期待する
      await expect(page).toHaveURL(/\/home$/);
    });
  });

  test("FR-003 SCR-008 -> SCR-002: 同意済み到達時にホームへリダイレクトする", async ({ page }) => {
    const scenario = ROUTING_SCENARIOS[1];

    await test.step(`[${scenario.id}] ${scenario.traceIds.join("/")}`, async () => {
      await page.goto(scenario.startPath);
      // Red: 実装前のため意図的に不一致URLを期待する
      await expect(page).toHaveURL(/\/settings$/);
    });
  });

  test("FR-003 SCR-008 -> SCR-001: 同意拒否時にログインへ戻す", async ({ page }) => {
    const scenario = ROUTING_SCENARIOS[2];

    await test.step(`[${scenario.id}] ${scenario.traceIds.join("/")}`, async () => {
      await page.goto(scenario.startPath);
      // Red: 実装前のため意図的に不一致URLを期待する
      await expect(page).toHaveURL(/\/analytics$/);
    });
  });
});
