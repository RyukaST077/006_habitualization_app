import { describe, expect, it, vi } from "vitest";

import { NAVIGATION_FLOW } from "../../../src/app/navigation-flow";
import { ROUTE_MAP } from "../../../src/app/route-map";
import { requestAnalyticsSummaryRuntime } from "../../../src/main";
import { SCR006AnalyticsPage } from "../../../src/screens/SCR-006AnalyticsPage";
import {
  SCR006_ERROR_RETRY_EXPECTATION,
  SCR006_RUNTIME_ENDPOINT,
  SCR006_RUNTIME_RANGE_SEQUENCE,
  SCR006_RUNTIME_USER_ID,
  SCR006_TRACEABILITY_IDS,
  SCR006_UI_REQUIREMENT_TRACE_CASES,
  T057_C004_COMPLETION_GATE_COMMANDS,
} from "../../helpers/ui/common-ui-fixtures";

describe("T-057 C-004 SCR-006 analytics runtime regression tests", () => {
  it("FNC-008/SCR-006/IF-002 の要求トレースを固定する", () => {
    expect(SCR006_TRACEABILITY_IDS).toEqual(["FNC-008", "SCR-006", "IF-002"]);
    expect(SCR006_UI_REQUIREMENT_TRACE_CASES).toHaveLength(4);
    expect(SCR006_UI_REQUIREMENT_TRACE_CASES.every((testCase) => testCase.traceId.startsWith("T-057/C-004/"))).toBe(
      true,
    );
  });

  it("/analytics で初回ロードし、GET /api/analytics/user-summary?range_days=30 を実行する", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        analytics: {
          completion_rate: 71.4,
          best_streak: 3,
        },
      }),
    } as Response);

    const page = SCR006AnalyticsPage({
      screenId: "SCR-006",
      handlers: {
        onLoadSummary: (input) => requestAnalyticsSummaryRuntime(fetchMock, input, SCR006_RUNTIME_USER_ID),
      },
    });

    const result = await page.actions.loadSummary();

    expect(ROUTE_MAP["SCR-006"]).toBe("/analytics");
    expect(NAVIGATION_FLOW["SCR-002"]).toContain("SCR-006");
    expect(fetchMock).toHaveBeenCalledWith(
      `${SCR006_RUNTIME_ENDPOINT}?range_days=30&userId=${SCR006_RUNTIME_USER_ID}`,
      expect.objectContaining({ method: "GET", cache: "no-store" }),
    );
    expect(result.kind).toBe("success");
    expect(page.ui.cards.completionRate).toBe("71%");
    expect(page.ui.cards.bestStreak).toBe("3日");
  });

  it("range_days=7/30/90 の期間変更ごとに API を再取得し表示を更新する", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ analytics: { completion_rate: 50, best_streak: 2 } }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ analytics: { completion_rate: 85, best_streak: 6 } }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ analytics: { completion_rate: 90, best_streak: 9 } }),
      } as Response);

    const page = SCR006AnalyticsPage({
      screenId: "SCR-006",
      handlers: {
        onLoadSummary: (input) => requestAnalyticsSummaryRuntime(fetchMock, input, SCR006_RUNTIME_USER_ID),
      },
    });

    await page.actions.loadSummary();
    await page.actions.setRangeDays(7);
    await page.actions.setRangeDays(90);

    const requestedRanges = fetchMock.mock.calls.map(([url]) => {
      const parsed = new URL(String(url), "https://example.test");
      return Number(parsed.searchParams.get("range_days"));
    });

    expect(requestedRanges).toEqual(SCR006_RUNTIME_RANGE_SEQUENCE);
    expect(page.ui.cards.completionRate).toBe("90%");
    expect(page.ui.cards.bestStreak).toBe("9日");
  });

  it("500/通信失敗時は再試行導線を表示し、再実行で回復できる", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ analytics: { completion_rate: 60, best_streak: 4 } }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ code: "INTERNAL_ERROR", trace_id: "trace-analytics-500" }),
      } as Response)
      .mockRejectedValueOnce(new Error("network error"))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ analytics: { completion_rate: 100, best_streak: 12 } }),
      } as Response);

    const page = SCR006AnalyticsPage({
      screenId: "SCR-006",
      handlers: {
        onLoadSummary: (input) => requestAnalyticsSummaryRuntime(fetchMock, input, SCR006_RUNTIME_USER_ID),
      },
    });

    await page.actions.loadSummary();

    const failed = await page.actions.setRangeDays(7);
    expect(failed.kind).toBe("error");
    if (failed.kind !== "error") {
      throw new Error("expected error result");
    }

    expect(failed.retryAction.label).toBe(SCR006_ERROR_RETRY_EXPECTATION.label);
    expect(page.ui.error.isVisible).toBe(true);

    const networkFailed = await failed.retryAction.retry();
    expect(networkFailed.kind).toBe("error");

    const recovered = await page.actions.retryLoad();
    expect(recovered.kind).toBe("success");
    expect(page.ui.error.isVisible).toBe(false);
    expect(page.ui.cards.completionRate).toBe("100%");
    expect(page.ui.cards.bestStreak).toBe("12日");
  });

  it("完了ゲート: C-004 の最終ゲートコマンドを固定する", () => {
    expect(T057_C004_COMPLETION_GATE_COMMANDS).toEqual([
      "npm run test -- tests/unit/screens/scr-006-analytics-page-red.spec.ts tests/integration/ui/scr-006-analytics-runtime-red.spec.ts",
      "npm run test -- tests/unit/screens/scr-006-analytics-page-red.spec.ts tests/integration/ui/scr-006-analytics-runtime-red.spec.ts tests/integration/api/if-002-analytics-summary-red.spec.ts && npm run typecheck",
    ]);
  });
});
