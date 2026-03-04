import { describe, expect, it, vi } from "vitest";

import { ROUTE_MAP } from "../../../src/app/route-map";
import { SCR004HabitEditPage } from "../../../src/screens/SCR-004HabitEditPage";
import {
  requestHabitDetailRuntime,
  requestHabitEditUpdateRuntime,
  requestHabitStatusTransitionRuntime,
} from "../../../src/main";
import {
  SCR004_CONFIRMATION_MODAL_EXPECTATIONS,
  SCR004_API_PREFILL_EXPECTATIONS,
  SCR004_TRACEABILITY_IDS,
  SCR004_UI_REQUIREMENT_TRACE_CASES,
  T053_C004_COMPLETION_GATE_COMMANDS,
} from "../../helpers/ui/common-ui-fixtures";

describe("T-053 C-001 SCR-004 habit edit runtime red tests", () => {
  it("TC-IT-FR-007-003/TC-ST-FR-008-004/TC-ST-FR-009-005 の要求トレースを固定する", () => {
    expect(SCR004_TRACEABILITY_IDS).toEqual([
      "FR-007",
      "FR-008",
      "FR-009",
      "AC-007",
      "AC-008",
      "AC-009",
      "SCR-004",
    ]);
    expect(SCR004_UI_REQUIREMENT_TRACE_CASES.map((testCase) => testCase.testCaseId)).toEqual([
      "TC-IT-FR-007-003",
      "TC-ST-FR-008-004",
      "TC-ST-FR-009-005",
    ]);
    expect(SCR004_UI_REQUIREMENT_TRACE_CASES.map((testCase) => testCase.acceptanceId)).toEqual([
      "AC-007",
      "AC-008",
      "AC-009",
    ]);
  });

  it("表示時 GET /api/habits/{habit_id} を実行し、name/display_order/status をプリフィルする", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          habit: {
            habit_id: "habit-active-001",
            name: SCR004_API_PREFILL_EXPECTATIONS[0].response.name,
            display_order: SCR004_API_PREFILL_EXPECTATIONS[0].response.displayOrder,
            status: SCR004_API_PREFILL_EXPECTATIONS[0].response.status,
          },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          habit: {
            habit_id: "habit-archived-001",
            name: SCR004_API_PREFILL_EXPECTATIONS[1].response.name,
            display_order: SCR004_API_PREFILL_EXPECTATIONS[1].response.displayOrder,
            status: SCR004_API_PREFILL_EXPECTATIONS[1].response.status,
          },
        }),
      } as Response);

    const activeResult = await requestHabitDetailRuntime(fetchMock, { habitId: "habit-active-001" });
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/habits/habit-active-001",
      expect.objectContaining({ method: "GET" }),
    );
    expect(activeResult).toEqual({
      kind: "success",
      habit: {
        habitId: "habit-active-001",
        name: SCR004_API_PREFILL_EXPECTATIONS[0].expected.name,
        displayOrder: SCR004_API_PREFILL_EXPECTATIONS[0].expected.displayOrder,
        status: SCR004_API_PREFILL_EXPECTATIONS[0].expected.status,
      },
    });

    const archivedResult = await requestHabitDetailRuntime(fetchMock, { habitId: "habit-archived-001" });
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/habits/habit-archived-001",
      expect.objectContaining({ method: "GET" }),
    );
    expect(archivedResult).toEqual({
      kind: "success",
      habit: {
        habitId: "habit-archived-001",
        name: SCR004_API_PREFILL_EXPECTATIONS[1].expected.name,
        displayOrder: SCR004_API_PREFILL_EXPECTATIONS[1].expected.displayOrder,
        status: SCR004_API_PREFILL_EXPECTATIONS[1].expected.status,
      },
    });
  });

  it("保存で PATCH /api/habits/{habit_id} を実行し、成功時は /home へ遷移する契約を満たす", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        habit: {
          habit_id: "habit-save-001",
          name: "更新後の習慣名",
          display_order: 11,
          status: "active",
        },
      }),
    } as Response);

    const result = await requestHabitEditUpdateRuntime(fetchMock, {
      userId: "user-001",
      habitId: "habit-save-001",
      name: "更新後の習慣名",
      displayOrder: 11,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/habits/habit-save-001",
      expect.objectContaining({
        method: "PATCH",
        headers: { "content-type": "application/json" },
      }),
    );
    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1] && (fetchMock.mock.calls[0][1] as RequestInit).body));
    expect(body).toEqual({
      userId: "user-001",
      habit_id: "habit-save-001",
      name: "更新後の習慣名",
      display_order: 11,
    });
    expect(result).toEqual({
      kind: "success",
      habit: {
        habitId: "habit-save-001",
        name: "更新後の習慣名",
        displayOrder: 11,
        status: "active",
      },
    });
    expect(ROUTE_MAP["SCR-002"]).toBe("/home");
  });

  it("archive/resume は確認モーダルで confirm 後のみ状態変更 API を呼ぶ", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        habit: {
          habit_id: "habit-lifecycle-001",
          name: "習慣",
          display_order: 5,
          status: "archived",
        },
      }),
    } as Response);

    const onArchiveApi = vi.fn(async () => {
      await requestHabitStatusTransitionRuntime(fetchMock, {
        userId: "user-001",
        habitId: "habit-lifecycle-001",
        action: "archive",
      });
    });
    const onResumeApi = vi.fn(async () => {
      await requestHabitStatusTransitionRuntime(fetchMock, {
        userId: "user-001",
        habitId: "habit-lifecycle-001",
        action: "resume",
      });
    });

    const archivePage = SCR004HabitEditPage({
      screenId: "SCR-004",
      params: { habitId: "habit-lifecycle-001", status: "active" },
      handlers: {
        onArchive: () => {
          void onArchiveApi();
        },
      },
    });
    archivePage.actions.archive();
    expect(archivePage.ui.confirmationModal).toEqual({ isOpen: true, action: "archive" });
    expect(onArchiveApi).toHaveBeenCalledTimes(0);
    archivePage.actions.confirmLifecycleAction();
    expect(onArchiveApi).toHaveBeenCalledTimes(1);

    const resumePage = SCR004HabitEditPage({
      screenId: "SCR-004",
      params: { habitId: "habit-lifecycle-001", status: "archived" },
      handlers: {
        onResume: () => {
          void onResumeApi();
        },
      },
    });
    resumePage.actions.resume();
    expect(resumePage.ui.confirmationModal).toEqual({ isOpen: true, action: "resume" });
    expect(onResumeApi).toHaveBeenCalledTimes(0);
    resumePage.actions.confirmLifecycleAction();
    expect(onResumeApi).toHaveBeenCalledTimes(1);

    await Promise.resolve();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/habits/habit-lifecycle-001/archive",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/habits/habit-lifecycle-001/resume",
      expect.objectContaining({ method: "POST" }),
    );
    expect(SCR004_CONFIRMATION_MODAL_EXPECTATIONS.every((testCase) => testCase.requiresConfirmation)).toBe(true);
  });

  it("403 受信時は詳細理由を露出せず /home リダイレクト用エラーとして扱う", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({
        code: "FORBIDDEN",
        trace_id: "forbidden-trace-id-should-not-be-visible",
      }),
    } as Response);

    const detail = await requestHabitDetailRuntime(fetchMock, { habitId: "habit-forbidden-detail" });
    const save = await requestHabitEditUpdateRuntime(fetchMock, {
      userId: "user-001",
      habitId: "habit-forbidden-save",
      name: "x",
      displayOrder: 1,
    });
    const archive = await requestHabitStatusTransitionRuntime(fetchMock, {
      userId: "user-001",
      habitId: "habit-forbidden-archive",
      action: "archive",
    });

    [detail, save, archive].forEach((result) => {
      expect(result).toEqual({
        kind: "error",
        error: expect.objectContaining({
          status: 403,
          code: "FORBIDDEN",
          message: "この操作を実行する権限がありません",
          visibleTraceId: null,
        }),
      });
    });

    const navigateHome = vi.fn();
    const page = SCR004HabitEditPage({
      screenId: "SCR-004",
      params: { habitId: "habit-forbidden-runtime", status: "active" },
      handlers: { onNavigateHome: navigateHome },
    });
    page.actions.handleHttpError(403);
    expect(navigateHome).toHaveBeenCalledTimes(1);
    expect(ROUTE_MAP["SCR-002"]).toBe("/home");
  });

  it("完了ゲート: SCR-004 最終ゲートコマンド（API回帰+typecheck）を固定する", () => {
    expect(T053_C004_COMPLETION_GATE_COMMANDS).toEqual([
      "npm run test -- tests/unit/screens/scr-004-habit-edit-page-red.spec.ts tests/integration/ui/scr-004-habit-edit-runtime-red.spec.ts",
      "npm run test -- tests/unit/screens/scr-004-habit-edit-page-red.spec.ts tests/integration/ui/scr-004-habit-edit-runtime-red.spec.ts tests/integration/api/if-002-habits-status-red.spec.ts && npm run typecheck",
    ]);
  });
});
