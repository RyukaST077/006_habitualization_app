import { describe, expect, it, vi } from "vitest";

import { NAVIGATION_FLOW } from "../../../src/app/navigation-flow";
import { ROUTE_MAP } from "../../../src/app/route-map";
import { SCR003HabitCreatePage } from "../../../src/screens/SCR-003HabitCreatePage";
import { requestHabitCreateRuntime } from "../../../src/main";
import {
  SCR003_CANCEL_TRANSITION_EXPECTATION,
  SCR003_SAVE_BUTTON_LOADING_EXPECTATION,
  SCR003_TRACEABILITY_IDS,
  SCR003_UI_REQUIREMENT_TRACE_CASES,
  T052_C004_COMPLETION_GATE_COMMANDS,
} from "../../helpers/ui/common-ui-fixtures";

describe("T-052 C-001 SCR-003 habit create runtime red tests", () => {
  it("TC-IT-FR-006-001/002 のトレースIDを fixtures へ固定する", () => {
    expect(SCR003_TRACEABILITY_IDS).toEqual(["FR-006", "AC-006", "SCR-003"]);
    expect(SCR003_UI_REQUIREMENT_TRACE_CASES.map((testCase) => testCase.testCaseId)).toEqual([
      "TC-IT-FR-006-001",
      "TC-IT-FR-006-002",
    ]);
    expect(SCR003_UI_REQUIREMENT_TRACE_CASES.every((testCase) => testCase.requirementId === "FR-006")).toBe(true);
    expect(SCR003_UI_REQUIREMENT_TRACE_CASES.every((testCase) => testCase.acceptanceId === "AC-006")).toBe(true);
  });

  it("キャンセル導線は SCR-003(/habits/new) -> SCR-002(/home) を要求する", () => {
    expect(ROUTE_MAP["SCR-003"]).toBe(SCR003_CANCEL_TRANSITION_EXPECTATION.fromPath);
    expect(ROUTE_MAP["SCR-002"]).toBe(SCR003_CANCEL_TRANSITION_EXPECTATION.expectedPath);
    expect(NAVIGATION_FLOW["SCR-003"]).toEqual(["SCR-002"]);
    expect(SCR003_CANCEL_TRANSITION_EXPECTATION.shouldSubmitOnCancel).toBe(false);
  });

  it("保存中 disabled の期待値を固定し、保存中は submit を拒否して多重送信を防ぐ", () => {
    expect(SCR003_SAVE_BUTTON_LOADING_EXPECTATION).toEqual({
      screenId: "SCR-003",
      requirementId: "FR-006",
      acceptanceId: "AC-006",
      label: "保存",
      initial: { disabled: false },
      pending: { disabled: true },
      settled: { disabled: false },
    });

    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    const page = SCR003HabitCreatePage({
      screenId: "SCR-003",
      handlers: { onSubmit, onCancel },
    });
    page.actions.setName("habit-name");
    page.actions.setDisplayOrder(1);
    expect(page.actions.submit()).toBe(true);
    expect(onSubmit).toHaveBeenCalledTimes(1);

    page.actions.setSaving(true);
    expect(page.ui.saveButton.disabled).toBe(true);
    expect(page.actions.submit()).toBe(false);
    expect(onSubmit).toHaveBeenCalledTimes(1);

    page.actions.cancel();

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("保存押下時は POST /api/habits を呼び、400/403/500 を画面エラー表示用に写像する", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          habit: {
            habit_id: "habit-created-001",
            name: "朝の散歩",
            status: "active",
            display_order: 1,
          },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          code: "VALIDATION_ERROR",
          trace_id: "trace-validation-error",
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          code: "FORBIDDEN",
          trace_id: "trace-forbidden",
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          code: "INTERNAL_ERROR",
          trace_id: "trace-internal-error",
        }),
      } as Response);

    const success = await requestHabitCreateRuntime(fetchMock, {
      userId: "user-001",
      name: "朝の散歩",
      displayOrder: 1,
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/habits",
      expect.objectContaining({
        method: "POST",
        headers: { "content-type": "application/json" },
      }),
    );
    const firstCall = fetchMock.mock.calls[0];
    expect(firstCall).toBeDefined();
    if (!firstCall) {
      return;
    }
    const firstRequestInit = firstCall[1] as RequestInit;
    expect(JSON.parse(String(firstRequestInit.body))).toEqual({
      userId: "user-001",
      name: "朝の散歩",
      display_order: 1,
    });
    expect(success).toEqual({
      kind: "success",
      habitId: "habit-created-001",
    });

    const validationError = await requestHabitCreateRuntime(fetchMock, {
      userId: "user-001",
      name: "",
      displayOrder: 1,
    });
    expect(validationError).toEqual({
      kind: "error",
      error: expect.objectContaining({
        status: 400,
        code: "VALIDATION_ERROR",
        message: "入力内容を確認してください",
        visibleTraceId: null,
      }),
    });

    const forbiddenError = await requestHabitCreateRuntime(fetchMock, {
      userId: "user-001",
      name: "朝の散歩",
      displayOrder: 1,
    });
    expect(forbiddenError).toEqual({
      kind: "error",
      error: expect.objectContaining({
        status: 403,
        code: "FORBIDDEN",
        message: "この操作を実行する権限がありません",
        visibleTraceId: null,
      }),
    });

    const internalError = await requestHabitCreateRuntime(fetchMock, {
      userId: "user-001",
      name: "朝の散歩",
      displayOrder: 1,
    });
    expect(internalError).toEqual({
      kind: "error",
      error: expect.objectContaining({
        status: 500,
        code: "INTERNAL_ERROR",
        message: "システムエラーが発生しました",
        visibleTraceId: "trace_id:trace-internal-error",
      }),
    });
  });

  it("完了ゲート: SCR-003 最終ゲートコマンド（API回帰+typecheck）を固定する", () => {
    expect(T052_C004_COMPLETION_GATE_COMMANDS).toEqual([
      "npm run test -- tests/unit/screens/scr-003-habit-create-page-red.spec.ts tests/integration/ui/scr-003-habit-create-runtime-red.spec.ts",
      "npm run test -- tests/unit/screens/scr-003-habit-create-page-red.spec.ts tests/integration/ui/scr-003-habit-create-runtime-red.spec.ts tests/integration/api/if-002-habits-create-update-red.spec.ts && npm run typecheck",
    ]);
  });
});
