import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ROUTE_MAP } from "../../../src/app/route-map";
import { requestHistoryCalendarRuntime } from "../../../src/main";
import { SCR005HistoryPage } from "../../../src/screens/SCR-005HistoryPage";
import {
  SCR005_EMPTY_MONTH_FRAME_EXPECTATION,
  SCR005_ERROR_RETRY_EXPECTATION,
  SCR005_RUNTIME_ENDPOINT,
  SCR005_RUNTIME_RELOAD_SEQUENCE,
  SCR005_RUNTIME_USER_ID,
  SCR005_TRACEABILITY_IDS,
  SCR005_UI_REQUIREMENT_TRACE_CASES,
  T055_C004_COMPLETION_GATE_COMMANDS,
} from "../../helpers/ui/common-ui-fixtures";

describe("T-055 C-004 SCR-005 history runtime red tests", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-05T09:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("FR-017/AC-017/TC-ST-FR-017-004/005 の最終要求トレースを固定する", () => {
    expect(SCR005_TRACEABILITY_IDS).toEqual(["FR-017", "AC-017", "SCR-005"]);
    expect(SCR005_UI_REQUIREMENT_TRACE_CASES.map((testCase) => testCase.testCaseId)).toEqual([
      "TC-ST-FR-017-004",
      "TC-ST-FR-017-005",
    ]);
    expect(SCR005_UI_REQUIREMENT_TRACE_CASES.map((testCase) => testCase.acceptanceId)).toEqual(["AC-017", "AC-017"]);
    expect(SCR005_UI_REQUIREMENT_TRACE_CASES.every((testCase) => testCase.traceId.startsWith("T-055/C-004/"))).toBe(
      true,
    );
  });

  it("/history で初回ロードを実行し、GET /api/history/calendar へデフォルト条件を反映する", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        days: [
          { date: "2026-03-01T00:00:00.000Z", status: "checked" },
          { date: "2026-03-02", status: "missed" },
        ],
      }),
    } as Response);

    const page = SCR005HistoryPage({
      screenId: "SCR-005",
      handlers: {
        onLoadCalendar: (input) => requestHistoryCalendarRuntime(fetchMock, input, SCR005_RUNTIME_USER_ID),
      },
    });

    const result = await page.actions.loadCalendar();

    expect(ROUTE_MAP["SCR-005"]).toBe("/history");
    expect(fetchMock).toHaveBeenCalledWith(
      `${SCR005_RUNTIME_ENDPOINT}?year_month=2026-03&include_archived=false&userId=${SCR005_RUNTIME_USER_ID}`,
      expect.objectContaining({ method: "GET", cache: "no-store" }),
    );
    expect(result.kind).toBe("success");
    expect(page.ui.calendar.days.find((day) => day.date === "2026-03-01")?.status).toBe("checked");
    expect(page.ui.calendar.days.find((day) => day.date === "2026-03-02")?.status).toBe("unchecked");
  });

  it("month/habit/includeArchived の変更ごとに API リクエストを再取得する", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ days: [] }),
    } as Response);

    const page = SCR005HistoryPage({
      screenId: "SCR-005",
      handlers: {
        onLoadCalendar: (input) => requestHistoryCalendarRuntime(fetchMock, input, SCR005_RUNTIME_USER_ID),
      },
    });

    await page.actions.loadCalendar();
    await page.actions.setYearMonth("2026-02");
    await page.actions.setHabitFilter("habit-001");
    await page.actions.setIncludeArchived(true);

    const requestedInputs = fetchMock.mock.calls.map(([input]) => {
      const url = new URL(String(input), "https://example.test");
      return {
        yearMonth: url.searchParams.get("year_month"),
        habitId: url.searchParams.get("habit_id"),
        includeArchived: url.searchParams.get("include_archived"),
        userId: url.searchParams.get("userId"),
      };
    });

    expect(requestedInputs).toEqual(
      SCR005_RUNTIME_RELOAD_SEQUENCE.map((entry) => ({
        yearMonth: entry.yearMonth,
        habitId: entry.habitId,
        includeArchived: String(entry.includeArchived),
        userId: SCR005_RUNTIME_USER_ID,
      })),
    );
  });

  it("500/通信失敗時は再読込を表示し、再実行で回復できる", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ days: [] }) } as Response)
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ days: [] }) } as Response)
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ days: [] }) } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ code: "INTERNAL_ERROR", trace_id: "trace-history-500" }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          days: [{ date: "2026-02-01", status: "checked" }],
        }),
      } as Response);

    const page = SCR005HistoryPage({
      screenId: "SCR-005",
      handlers: {
        onLoadCalendar: (input) => requestHistoryCalendarRuntime(fetchMock, input, SCR005_RUNTIME_USER_ID),
      },
    });

    await page.actions.setYearMonth(SCR005_ERROR_RETRY_EXPECTATION.yearMonth);
    await page.actions.setHabitFilter(SCR005_ERROR_RETRY_EXPECTATION.habitId);
    await page.actions.setIncludeArchived(SCR005_ERROR_RETRY_EXPECTATION.includeArchived);

    const failed = await page.actions.loadCalendar();
    expect(failed.kind).toBe("error");
    if (failed.kind !== "error") {
      throw new Error("expected error");
    }

    expect(failed.retryAction.label).toBe(SCR005_ERROR_RETRY_EXPECTATION.label);
    expect(page.ui.error.isVisible).toBe(true);

    const retried = await failed.retryAction.retry();
    expect(retried.kind).toBe("success");
    expect(page.ui.error.isVisible).toBe(false);
    expect(page.ui.calendar.days.find((day) => day.date === "2026-02-01")?.status).toBe("checked");

    const failedUrl = String(fetchMock.mock.calls[3]?.[0]);
    const retriedUrl = String(fetchMock.mock.calls[4]?.[0]);
    expect(retriedUrl).toBe(failedUrl);
  });

  it("対象月データが0件でも月グリッドを描画する", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ days: [] }),
    } as Response);

    const page = SCR005HistoryPage({
      screenId: "SCR-005",
      handlers: {
        onLoadCalendar: (input) => requestHistoryCalendarRuntime(fetchMock, input, SCR005_RUNTIME_USER_ID),
      },
    });

    const result = await page.actions.setYearMonth(SCR005_EMPTY_MONTH_FRAME_EXPECTATION.yearMonth);

    expect(result.kind).toBe("success");
    expect(page.ui.calendar.days).toHaveLength(SCR005_EMPTY_MONTH_FRAME_EXPECTATION.daysInMonth);
    expect(page.ui.calendar.days.every((day) => day.status === SCR005_EMPTY_MONTH_FRAME_EXPECTATION.emptyStatus)).toBe(
      true,
    );
  });

  it("完了ゲート: C-004 の最終ゲートコマンド（if-002回帰 + typecheck）を固定する", () => {
    expect(T055_C004_COMPLETION_GATE_COMMANDS).toEqual([
      "npm run test -- tests/unit/screens/scr-005-history-page-red.spec.ts tests/integration/ui/scr-005-history-runtime-red.spec.ts",
      "npm run test -- tests/unit/screens/scr-005-history-page-red.spec.ts tests/integration/ui/scr-005-history-runtime-red.spec.ts tests/integration/api/if-002-history-calendar-red.spec.ts && npm run typecheck",
    ]);
  });
});
