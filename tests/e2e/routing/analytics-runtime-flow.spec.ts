import { expect, test } from "@playwright/test";

import { ROUTE_MAP } from "../../../src/app/route-map";
import { SCR006AnalyticsPage } from "../../../src/screens/SCR-006AnalyticsPage";

test.describe("TC-AUTO-E2E-ANALYTICS-001 SCR-006 analytics flow", () => {
  test("range_days 30→7→90 を再取得し、ホームへ戻れる", async () => {
    const requests: number[] = [];
    let didNavigateBackHome = false;
    const page = SCR006AnalyticsPage({
      screenId: "SCR-006",
      handlers: {
        onLoadSummary: async ({ rangeDays }) => {
          requests.push(rangeDays);
          return {
            kind: "success",
            analytics: {
              completionRate: rangeDays === 90 ? 88 : 62,
              bestStreak: rangeDays === 90 ? 10 : 4,
            },
          };
        },
        onBackHome: () => {
          didNavigateBackHome = true;
        },
      },
    });

    await page.actions.loadSummary();
    await page.actions.setRangeDays(7);
    await page.actions.setRangeDays(90);
    page.actions.backHome();

    expect(ROUTE_MAP["SCR-006"]).toBe("/analytics");
    expect(ROUTE_MAP["SCR-002"]).toBe("/home");
    expect(requests).toEqual([30, 7, 90]);
    expect(page.ui.cards.completionRate).toBe("88%");
    expect(page.ui.cards.bestStreak).toBe("10日");
    expect(didNavigateBackHome).toBe(true);
  });

  test("500/通信失敗後に再試行して回復できる", async () => {
    let attempt = 0;
    const page = SCR006AnalyticsPage({
      screenId: "SCR-006",
      handlers: {
        onLoadSummary: async () => {
          attempt += 1;
          if (attempt === 1) {
            return {
              kind: "error",
              status: 500,
              code: "INTERNAL_ERROR",
              traceId: "E2E-SCR006-500",
            };
          }
          if (attempt === 2) {
            throw new Error("network down");
          }
          return {
            kind: "success",
            analytics: {
              completionRate: 100,
              bestStreak: 12,
            },
          };
        },
      },
    });

    const first = await page.actions.loadSummary();
    expect(first.kind).toBe("error");
    expect(page.ui.error.isVisible).toBe(true);

    if (first.kind !== "error") {
      throw new Error("expected error result");
    }
    const second = await first.retryAction.retry();
    expect(second.kind).toBe("error");
    expect(page.ui.error.isVisible).toBe(true);

    const recovered = await page.actions.retryLoad();
    expect(recovered.kind).toBe("success");
    expect(page.ui.error.isVisible).toBe(false);
    expect(page.ui.cards.completionRate).toBe("100%");
    expect(page.ui.cards.bestStreak).toBe("12日");
  });

  test("不正 rangeDays は 30 日へフォールバックして取得する", async () => {
    const requests: number[] = [];
    const page = SCR006AnalyticsPage({
      screenId: "SCR-006",
      handlers: {
        onLoadSummary: async ({ rangeDays }) => {
          requests.push(rangeDays);
          return {
            kind: "success",
            analytics: {
              completionRate: 75,
              bestStreak: 8,
            },
          };
        },
      },
    });

    await page.actions.setRangeDays(14);

    expect(requests).toEqual([30]);
    expect(page.ui.filters.rangeDays).toBe(30);
  });
});
