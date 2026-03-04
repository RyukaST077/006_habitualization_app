import { describe, expect, it, vi } from "vitest";

import { SCR004HabitEditPage } from "../../../src/screens/SCR-004HabitEditPage";
import type { HabitLifecycleStatus } from "../../../src/screens/types";
import {
  SCR004_API_PREFILL_EXPECTATIONS,
  SCR004_CONFIRMATION_MODAL_EXPECTATIONS,
  SCR004_CONFIRMATION_MODAL_STATE_TRANSITIONS,
  SCR004_FORBIDDEN_REDIRECT_EXPECTATION,
  SCR004_STATUS_BUTTON_VISIBILITY,
  SCR004_TRACEABILITY_IDS,
  SCR004_UI_REQUIREMENT_TRACE_CASES,
  T053_C004_COMPLETION_GATE_COMMANDS,
} from "../../helpers/ui/common-ui-fixtures";

describe("T-053 C-002 SCR-004 habit edit page model tests", () => {
  it("TC-IT-FR-007-003/TC-ST-FR-008-004/TC-ST-FR-009-005 のトレースIDを fixtures へ固定する", () => {
    const expectedStatusOrder: HabitLifecycleStatus[] = ["active", "archived"];
    const fixtureStatuses = SCR004_STATUS_BUTTON_VISIBILITY.map((item) => item.status);

    expect(SCR004_TRACEABILITY_IDS).toEqual([
      "FR-007",
      "FR-008",
      "FR-009",
      "AC-007",
      "AC-008",
      "AC-009",
      "SCR-004",
    ]);
    expect(fixtureStatuses).toEqual(expectedStatusOrder);
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

  it("TC-IT-FR-007-003: active/archived 状態ごとの archive/resume ボタン表示期待値を満たす", () => {
    const activePage = SCR004HabitEditPage({
      screenId: "SCR-004",
      params: { habitId: "habit-active", status: "active" },
    });
    expect(activePage.ui.status).toBe("active");
    expect(activePage.ui.buttons.archive.visible).toBe(true);
    expect(activePage.ui.buttons.resume.visible).toBe(false);

    const archivedPage = SCR004HabitEditPage({
      screenId: "SCR-004",
      params: { habitId: "habit-archived", status: "archived" },
    });
    expect(archivedPage.ui.status).toBe("archived");
    expect(archivedPage.ui.buttons.archive.visible).toBe(false);
    expect(archivedPage.ui.buttons.resume.visible).toBe(true);

    expect(SCR004_STATUS_BUTTON_VISIBILITY).toEqual([
      { status: "active", archiveVisible: true, resumeVisible: false },
      { status: "archived", archiveVisible: false, resumeVisible: true },
    ]);
  });

  it("TC-ST-FR-008-004: archive/resume は確認モーダル経由で実行する観点を fixture 化する", () => {
    expect(SCR004_CONFIRMATION_MODAL_EXPECTATIONS).toEqual([
      {
        action: "archive",
        status: "active",
        openButtonLabel: "アーカイブ",
        requiresConfirmation: true,
        confirmButtonLabel: "実行",
        cancelButtonLabel: "キャンセル",
      },
      {
        action: "resume",
        status: "archived",
        openButtonLabel: "再開",
        requiresConfirmation: true,
        confirmButtonLabel: "実行",
        cancelButtonLabel: "キャンセル",
      },
    ]);
  });

  it("APIレスポンス初期値（name/displayOrder/status）を画面モデルへ反映する", () => {
    SCR004_API_PREFILL_EXPECTATIONS.forEach((testCase) => {
      const page = SCR004HabitEditPage({
        screenId: "SCR-004",
        params: {
          habitId: `habit-prefill-${testCase.status}`,
          name: testCase.response.name,
          displayOrder: testCase.response.displayOrder,
          status: testCase.response.status,
        },
      });

      expect(page.ui.name).toBe(testCase.expected.name);
      expect(page.ui.displayOrder).toBe(testCase.expected.displayOrder);
      expect(page.ui.status).toBe(testCase.expected.status);
    });
  });

  it("archive/resume 押下時に確認モーダル状態を制御する", () => {
    SCR004_CONFIRMATION_MODAL_STATE_TRANSITIONS.forEach((testCase) => {
      const onArchive = vi.fn();
      const onResume = vi.fn();
      const page = SCR004HabitEditPage({
        screenId: "SCR-004",
        params: {
          habitId: `habit-modal-${testCase.action}`,
          status: testCase.status,
        },
        handlers: { onArchive, onResume },
      });

      expect(page.ui.confirmationModal).toEqual(testCase.initial);

      if (testCase.action === "archive") {
        page.actions.archive();
      } else {
        page.actions.resume();
      }
      expect(page.ui.confirmationModal).toEqual(testCase.opened);
      expect(onArchive).toHaveBeenCalledTimes(0);
      expect(onResume).toHaveBeenCalledTimes(0);

      page.actions.confirmLifecycleAction();
      expect(page.ui.confirmationModal).toEqual(testCase.closed);
      if (testCase.action === "archive") {
        expect(onArchive).toHaveBeenCalledTimes(1);
        expect(onResume).toHaveBeenCalledTimes(0);
      } else {
        expect(onArchive).toHaveBeenCalledTimes(0);
        expect(onResume).toHaveBeenCalledTimes(1);
      }
    });
  });

  it("403 受信時にホーム遷移アクションを呼び出す", () => {
    const onBack = vi.fn();
    const onNavigateHome = vi.fn();
    const page = SCR004HabitEditPage({
      screenId: "SCR-004",
      params: { habitId: "habit-forbidden" },
      handlers: { onBack, onNavigateHome },
    });

    page.actions.handleHttpError(403);
    page.actions.handleHttpError(500);

    expect(onNavigateHome).toHaveBeenCalledTimes(1);
    expect(onBack).toHaveBeenCalledTimes(0);
    expect(SCR004_FORBIDDEN_REDIRECT_EXPECTATION).toEqual({
      screenId: "SCR-004",
      requirementId: "FR-009",
      sourcePath: "/habits/:habitId/edit",
      triggerStatus: 403,
      expectedPath: "/home",
    });
  });

  it("完了ゲート: SCR-004 unit/integration 実行コマンドを固定する", () => {
    expect(T053_C004_COMPLETION_GATE_COMMANDS).toEqual([
      "npm run test -- tests/unit/screens/scr-004-habit-edit-page-red.spec.ts tests/integration/ui/scr-004-habit-edit-runtime-red.spec.ts",
      "npm run test -- tests/unit/screens/scr-004-habit-edit-page-red.spec.ts tests/integration/ui/scr-004-habit-edit-runtime-red.spec.ts tests/integration/api/if-002-habits-status-red.spec.ts && npm run typecheck",
    ]);
  });
});
