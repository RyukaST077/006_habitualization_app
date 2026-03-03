import { expect, test } from "@playwright/test";

test.describe("TC-AUTO-E2E-HABITS-001 習慣作成の永続化", () => {
  test("SCR-003: 作成した習慣が再読込後も表示される", async ({ page, baseURL }) => {
    test.skip(!baseURL, "[E2E] this test requires baseURL (set E2E_BASE_URL)");

    const createdName = `e2e-persistent-${Date.now()}`;

    await test.step("習慣作成画面を開く", async () => {
      await page.goto("/habits/new");
      await expect(page.getByRole("heading", { name: "SCR-003 Habit Create" })).toBeVisible();
    });

    await test.step("習慣を作成する", async () => {
      await page.getByRole("textbox", { name: "name" }).fill(createdName);
      await page.getByRole("spinbutton", { name: "display_order" }).fill("10");
      await page.getByRole("button", { name: "作成" }).click();

      await expect(page.getByText("作成成功")).toBeVisible();
      await expect(page.locator("#habit-list")).toContainText(createdName);
    });

    await test.step("再読込後も作成済み習慣が残る", async () => {
      await page.reload();
      await expect(page.getByRole("heading", { name: "SCR-003 Habit Create" })).toBeVisible();
      await expect(page.locator("#habit-list")).toContainText(createdName);
    });
  });
});
