import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  mapHistoryCalendarStatus,
  SCR005HistoryPage,
} from "../../../src/screens/SCR-005HistoryPage";
import {
  SCR005_CALENDAR_STATUS_MAPPINGS,
  SCR005_DEFAULT_FILTERS,
  SCR005_EMPTY_MONTH_FRAME_EXPECTATION,
  SCR005_ERROR_RETRY_EXPECTATION,
  SCR005_RELOAD_INPUT_CASES,
  SCR005_TEST_PLAN_FOCUS_AREAS,
  SCR005_TRACEABILITY_IDS,
  SCR005_UI_REQUIREMENT_TRACE_CASES,
  T055_C004_COMPLETION_GATE_COMMANDS,
} from "../../helpers/ui/common-ui-fixtures";

describe("T-055 C-004 SCR-005 history page regression gate", () => {
  it("FR-017/AC-017/TC-ST-FR-017-004/005 の最終トレースを fixtures に固定する", () => {
    expect(SCR005_TRACEABILITY_IDS).toEqual([
      "FR-017",
      "AC-017",
      "SCR-005",
    ]);
    expect(SCR005_UI_REQUIREMENT_TRACE_CASES.map((testCase) => testCase.testCaseId)).toEqual([
      "TC-ST-FR-017-004",
      "TC-ST-FR-017-005",
    ]);
    expect(SCR005_UI_REQUIREMENT_TRACE_CASES.map((testCase) => testCase.acceptanceId)).toEqual([
      "AC-017",
      "AC-017",
    ]);
    expect(SCR005_UI_REQUIREMENT_TRACE_CASES.every((testCase) => testCase.traceId.startsWith("T-055/C-004/"))).toBe(
      true,
    );
  });

  it("SCR-005 の観点（カレンダー/フィルタ/archived/空月/再読込）を固定する", () => {
    expect(SCR005_TEST_PLAN_FOCUS_AREAS).toEqual([
      "month-calendar-grid",
      "month-picker",
      "habit-filter",
      "include-archived-toggle",
      "empty-month-frame",
      "error-retry-action",
    ]);
  });

  it("完了ゲート: C-004 の最終ゲートコマンド（if-002回帰 + typecheck）を固定する", () => {
    expect(T055_C004_COMPLETION_GATE_COMMANDS).toEqual([
      "npm run test -- tests/unit/screens/scr-005-history-page-red.spec.ts tests/integration/ui/scr-005-history-runtime-red.spec.ts",
      "npm run test -- tests/unit/screens/scr-005-history-page-red.spec.ts tests/integration/ui/scr-005-history-runtime-red.spec.ts tests/integration/api/if-002-history-calendar-red.spec.ts && npm run typecheck",
    ]);
  });
});

describe("T-055 C-002 SCR-005 history page model", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-05T09:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("初期状態は当月/全習慣/includeArchived=false で開始する", () => {
    const page = SCR005HistoryPage({ screenId: "SCR-005" });

    expect(page.commonUi.routePath).toBe("/history");
    expect(page.ui.filters.yearMonth).toBe(SCR005_DEFAULT_FILTERS.yearMonth);
    expect(page.ui.filters.habitId).toBe(SCR005_DEFAULT_FILTERS.habitId);
    expect(page.ui.filters.includeArchived).toBe(SCR005_DEFAULT_FILTERS.includeArchived);
  });

  it("checked/missed/grace を checked/unchecked/grace へ変換する", async () => {
    SCR005_CALENDAR_STATUS_MAPPINGS.forEach((testCase) => {
      expect(mapHistoryCalendarStatus(testCase.source)).toBe(testCase.display);
    });

    const page = SCR005HistoryPage({
      screenId: "SCR-005",
      handlers: {
        onLoadCalendar: async () => ({
          kind: "success",
          days: [
            { date: "2026-03-01", status: "checked" },
            { date: "2026-03-02", status: "missed" },
            { date: "2026-03-03", status: "grace" },
          ],
        }),
      },
    });

    const result = await page.actions.loadCalendar();
    expect(result.kind).toBe("success");

    expect(page.ui.calendar.days.find((cell) => cell.date === "2026-03-01")?.status).toBe("checked");
    expect(page.ui.calendar.days.find((cell) => cell.date === "2026-03-02")?.status).toBe("unchecked");
    expect(page.ui.calendar.days.find((cell) => cell.date === "2026-03-03")?.status).toBe("grace");
  });

  it("月変更/習慣フィルタ/archived 切替時に再取得入力を組み立てる", async () => {
    const onLoadCalendar = vi.fn(
      async (_input: { yearMonth: string; habitId: string | null; includeArchived: boolean }) => ({
        kind: "success" as const,
        days: [],
      }),
    );

    const page = SCR005HistoryPage({
      screenId: "SCR-005",
      handlers: { onLoadCalendar },
    });

    await page.actions.setYearMonth("2026-02");
    await page.actions.setHabitFilter("habit-001");
    await page.actions.setIncludeArchived(true);

    expect(onLoadCalendar.mock.calls.map((entry) => entry[0])).toEqual(SCR005_RELOAD_INPUT_CASES);
  });

  it("空データ月でも月枠を維持する", async () => {
    const page = SCR005HistoryPage({
      screenId: "SCR-005",
      handlers: {
        onLoadCalendar: async () => ({
          kind: "success",
          days: [],
        }),
      },
    });

    const result = await page.actions.setYearMonth(SCR005_EMPTY_MONTH_FRAME_EXPECTATION.yearMonth);
    expect(result.kind).toBe("success");
    expect(page.ui.calendar.days).toHaveLength(SCR005_EMPTY_MONTH_FRAME_EXPECTATION.daysInMonth);
    expect(page.ui.calendar.days.every((day) => day.status === SCR005_EMPTY_MONTH_FRAME_EXPECTATION.emptyStatus)).toBe(
      true,
    );
  });

  it("通信失敗時は再読込アクションを返し、再実行で回復できる", async () => {
    const onLoadCalendar = vi
      .fn()
      .mockResolvedValueOnce({ kind: "success", days: [] })
      .mockResolvedValueOnce({ kind: "success", days: [] })
      .mockResolvedValueOnce({ kind: "success", days: [] })
      .mockResolvedValueOnce({ kind: "error", status: 500, code: "INTERNAL_ERROR" })
      .mockResolvedValueOnce({
        kind: "success",
        days: [{ date: "2026-02-01", status: "checked" }],
      });

    const page = SCR005HistoryPage({
      screenId: "SCR-005",
      handlers: { onLoadCalendar },
    });

    await page.actions.setYearMonth(SCR005_ERROR_RETRY_EXPECTATION.yearMonth);
    await page.actions.setHabitFilter(SCR005_ERROR_RETRY_EXPECTATION.habitId);
    await page.actions.setIncludeArchived(SCR005_ERROR_RETRY_EXPECTATION.includeArchived);

    const failed = await page.actions.loadCalendar();
    expect(failed.kind).toBe("error");
    if (failed.kind !== "error") {
      throw new Error("expected load to fail");
    }

    expect(failed.input).toEqual({
      yearMonth: SCR005_ERROR_RETRY_EXPECTATION.yearMonth,
      habitId: SCR005_ERROR_RETRY_EXPECTATION.habitId,
      includeArchived: SCR005_ERROR_RETRY_EXPECTATION.includeArchived,
    });
    expect(failed.retryAction.label).toBe(SCR005_ERROR_RETRY_EXPECTATION.label);
    expect(page.ui.error.isVisible).toBe(true);

    const retried = await failed.retryAction.retry();
    expect(retried.kind).toBe("success");
    expect(page.ui.error.isVisible).toBe(false);
    expect(page.ui.calendar.days.find((day) => day.date === "2026-02-01")?.status).toBe("checked");
  });
});
