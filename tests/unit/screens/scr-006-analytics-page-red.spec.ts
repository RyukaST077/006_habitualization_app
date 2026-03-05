import { describe, expect, it, vi } from "vitest";

import { SCR006AnalyticsPage } from "../../../src/screens/SCR-006AnalyticsPage";
import {
  SCR006_CARD_DISPLAY_EXPECTATION,
  SCR006_DEFAULT_RANGE_DAYS,
  SCR006_ERROR_RETRY_EXPECTATION,
  SCR006_RANGE_DAYS_OPTIONS,
  SCR006_TEST_PLAN_FOCUS_AREAS,
  SCR006_TRACEABILITY_IDS,
  SCR006_UI_REQUIREMENT_TRACE_CASES,
  T057_C004_COMPLETION_GATE_COMMANDS,
} from "../../helpers/ui/common-ui-fixtures";

describe("T-057 C-004 SCR-006 analytics page regression gate", () => {
  it("FNC-008/SCR-006/IF-002 のトレースIDを fixtures に固定する", () => {
    expect(SCR006_TRACEABILITY_IDS).toEqual(["FNC-008", "SCR-006", "IF-002"]);
    expect(SCR006_UI_REQUIREMENT_TRACE_CASES.map((testCase) => testCase.testCaseId)).toEqual([
      "TC-UI-SCR006-001",
      "TC-UI-SCR006-002",
      "TC-UI-SCR006-003",
      "TC-UI-SCR006-004",
    ]);
    expect(SCR006_UI_REQUIREMENT_TRACE_CASES.every((testCase) => testCase.traceId.startsWith("T-057/C-004/"))).toBe(
      true,
    );
    expect(
      SCR006_UI_REQUIREMENT_TRACE_CASES.every((testCase) =>
        SCR006_TRACEABILITY_IDS.every((traceId) => testCase.traceability.includes(traceId)),
      ),
    ).toBe(true);
  });

  it("受け入れ観点（7/30/90・達成率・最長ストリーク・再試行）を固定する", () => {
    expect(SCR006_RANGE_DAYS_OPTIONS).toEqual([7, 30, 90]);
    expect(SCR006_TEST_PLAN_FOCUS_AREAS).toEqual([
      "range-days-7-30-90",
      "completion-rate-card",
      "best-streak-card",
      "runtime-if-002-user-summary",
      "error-retry-action",
    ]);
  });

  it("初期状態を rangeDays=30 とし、7/30/90 の選択肢を保持する", () => {
    const page = SCR006AnalyticsPage({ screenId: "SCR-006" });

    expect(page.commonUi.routePath).toBe("/analytics");
    expect(page.ui.filters.rangeDays).toBe(SCR006_DEFAULT_RANGE_DAYS);
    expect(page.ui.filters.options).toEqual(SCR006_RANGE_DAYS_OPTIONS);
    expect(page.ui.cards.completionRate).toBe("--%");
    expect(page.ui.cards.bestStreak).toBe("--日");
  });

  it("rangeDays 切替時に onLoadSummary へ入力を反映する", async () => {
    const onLoadSummary = vi.fn().mockResolvedValue({
      kind: "success",
      analytics: {
        completionRate: SCR006_CARD_DISPLAY_EXPECTATION.input.completionRate,
        bestStreak: SCR006_CARD_DISPLAY_EXPECTATION.input.bestStreak,
      },
    });

    const page = SCR006AnalyticsPage({
      screenId: "SCR-006",
      handlers: { onLoadSummary },
    });

    await page.actions.setRangeDays(7);
    await page.actions.setRangeDays(90);

    expect(onLoadSummary).toHaveBeenCalledTimes(2);
    expect(onLoadSummary.mock.calls.map((entry) => entry[0])).toEqual([{ rangeDays: 7 }, { rangeDays: 90 }]);
    expect(page.ui.filters.rangeDays).toBe(90);
  });

  it("不正な rangeDays 入力は 30 日にフォールバックして再取得する", async () => {
    const onLoadSummary = vi.fn().mockResolvedValue({
      kind: "success",
      analytics: {
        completionRate: 70,
        bestStreak: 5,
      },
    });

    const page = SCR006AnalyticsPage({
      screenId: "SCR-006",
      handlers: { onLoadSummary },
    });

    await page.actions.setRangeDays(14);

    expect(onLoadSummary).toHaveBeenCalledTimes(1);
    expect(onLoadSummary).toHaveBeenCalledWith({ rangeDays: 30 });
    expect(page.ui.filters.rangeDays).toBe(30);
  });

  it("completion_rate / best_streak をカード表示へ変換する", async () => {
    const page = SCR006AnalyticsPage({
      screenId: "SCR-006",
      handlers: {
        onLoadSummary: async () => ({
          kind: "success",
          analytics: {
            completionRate: SCR006_CARD_DISPLAY_EXPECTATION.input.completionRate,
            bestStreak: SCR006_CARD_DISPLAY_EXPECTATION.input.bestStreak,
          },
        }),
      },
    });

    const loaded = await page.actions.loadSummary();
    expect(loaded.kind).toBe("success");
    expect(page.ui.cards.completionRate).toBe(SCR006_CARD_DISPLAY_EXPECTATION.expected.completionRate);
    expect(page.ui.cards.bestStreak).toBe(SCR006_CARD_DISPLAY_EXPECTATION.expected.bestStreak);
  });

  it("completion_rate/best_streak の境界値を丸め・クランプする", async () => {
    const page = SCR006AnalyticsPage({
      screenId: "SCR-006",
      handlers: {
        onLoadSummary: vi
          .fn()
          .mockResolvedValueOnce({
            kind: "success",
            analytics: {
              completionRate: -1,
              bestStreak: -3,
            },
          })
          .mockResolvedValueOnce({
            kind: "success",
            analytics: {
              completionRate: 100.6,
              bestStreak: 2.9,
            },
          })
          .mockResolvedValueOnce({
            kind: "success",
            analytics: {
              completionRate: Number.NaN,
              bestStreak: Number.NaN,
            },
          }),
      },
    });

    await page.actions.loadSummary();
    expect(page.ui.cards.completionRate).toBe("0%");
    expect(page.ui.cards.bestStreak).toBe("0日");

    await page.actions.loadSummary();
    expect(page.ui.cards.completionRate).toBe("100%");
    expect(page.ui.cards.bestStreak).toBe("2日");

    await page.actions.loadSummary();
    expect(page.ui.cards.completionRate).toBe("--%");
    expect(page.ui.cards.bestStreak).toBe("--日");
  });

  it("読み込み中/失敗時の状態と再試行を定義し、再実行で回復できる", async () => {
    let resolvePending:
      | ((value: { kind: "success"; analytics: { completionRate: number; bestStreak: number } }) => void)
      | undefined;
    const onLoadSummary = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolvePending = resolve;
          }),
      )
      .mockResolvedValueOnce({
        kind: "error",
        status: SCR006_ERROR_RETRY_EXPECTATION.status,
        code: SCR006_ERROR_RETRY_EXPECTATION.code,
      })
      .mockResolvedValueOnce({
        kind: "success",
        analytics: {
          completionRate: 100,
          bestStreak: 21,
        },
      });

    const page = SCR006AnalyticsPage({
      screenId: "SCR-006",
      handlers: { onLoadSummary },
    });

    const pending = page.actions.loadSummary();
    expect(page.ui.loading.isFetching).toBe(true);
    if (typeof resolvePending !== "function") {
      throw new Error("resolvePending was not assigned");
    }
    resolvePending({
      kind: "success",
      analytics: {
        completionRate: SCR006_CARD_DISPLAY_EXPECTATION.input.completionRate,
        bestStreak: SCR006_CARD_DISPLAY_EXPECTATION.input.bestStreak,
      },
    });
    await pending;
    expect(page.ui.loading.isFetching).toBe(false);

    const failed = await page.actions.loadSummary();
    expect(failed.kind).toBe("error");
    if (failed.kind !== "error") {
      throw new Error("expected error result");
    }
    expect(page.ui.error.isVisible).toBe(true);
    expect(failed.retryAction.label).toBe(SCR006_ERROR_RETRY_EXPECTATION.label);

    const recovered = await failed.retryAction.retry();
    expect(recovered.kind).toBe("success");
    expect(page.ui.error.isVisible).toBe(false);
    expect(page.ui.cards.completionRate).toBe("100%");
    expect(page.ui.cards.bestStreak).toBe("21日");
  });

  it("ホームに戻る操作をハンドラ経由で呼び出す", () => {
    const onBackHome = vi.fn();
    const page = SCR006AnalyticsPage({
      screenId: "SCR-006",
      handlers: { onBackHome },
    });

    page.actions.backHome();
    expect(onBackHome).toHaveBeenCalledTimes(1);
  });

  it("onLoadSummary 未設定時は INTERNAL_ERROR 扱いで再試行を返す", async () => {
    const page = SCR006AnalyticsPage({
      screenId: "SCR-006",
    });

    const result = await page.actions.loadSummary();

    expect(result.kind).toBe("error");
    if (result.kind !== "error") {
      throw new Error("expected error result");
    }
    expect(result.error.status).toBe(500);
    expect(result.error.code).toBe("INTERNAL_ERROR");
    expect(result.retryAction.label).toBe("再試行");
    expect(page.ui.error.isVisible).toBe(true);
  });

  it("完了ゲート: C-004 の最終ゲートコマンドを固定する", () => {
    expect(T057_C004_COMPLETION_GATE_COMMANDS).toEqual([
      "npm run test -- tests/unit/screens/scr-006-analytics-page-red.spec.ts tests/integration/ui/scr-006-analytics-runtime-red.spec.ts",
      "npm run test -- tests/unit/screens/scr-006-analytics-page-red.spec.ts tests/integration/ui/scr-006-analytics-runtime-red.spec.ts tests/integration/api/if-002-analytics-summary-red.spec.ts && npm run typecheck",
    ]);
  });
});
