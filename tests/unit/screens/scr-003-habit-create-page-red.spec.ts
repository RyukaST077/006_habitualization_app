import { describe, expect, it, vi } from "vitest";

import { SCR003HabitCreatePage } from "../../../src/screens/SCR-003HabitCreatePage";
import {
  SCR003_CANCEL_TRANSITION_EXPECTATION,
  SCR003_DISPLAY_ORDER_BOUNDARY_CASES,
  SCR003_HABIT_NAME_BOUNDARY_CASES,
  SCR003_SAVE_BUTTON_LOADING_EXPECTATION,
  SCR003_TRACEABILITY_IDS,
  SCR003_UI_REQUIREMENT_TRACE_CASES,
  T052_C004_COMPLETION_GATE_COMMANDS,
} from "../../helpers/ui/common-ui-fixtures";

describe("T-052 C-002 SCR-003 habit create page model", () => {
  it("TC-IT-FR-006-002: 1文字/80文字/81文字 の習慣名境界を要求する", () => {
    const page = SCR003HabitCreatePage({ screenId: "SCR-003" }) as unknown as Record<string, unknown>;

    expect(SCR003_TRACEABILITY_IDS).toEqual(["FR-006", "AC-006", "SCR-003"]);
    expect(SCR003_UI_REQUIREMENT_TRACE_CASES.some((testCase) => testCase.testCaseId === "TC-IT-FR-006-002")).toBe(true);
    expect(SCR003_UI_REQUIREMENT_TRACE_CASES.every((testCase) => testCase.requirementId === "FR-006")).toBe(true);
    expect(SCR003_UI_REQUIREMENT_TRACE_CASES.every((testCase) => testCase.acceptanceId === "AC-006")).toBe(true);

    expect(page).toHaveProperty("ui.validation.name.minLength", 1);
    expect(page).toHaveProperty("ui.validation.name.maxLength", 80);
    expect(page).toHaveProperty("ui.validation.name.error.minLength", "習慣名を1文字以上入力してください");
    expect(page).toHaveProperty("ui.validation.name.error.maxLength", "習慣名は80文字以内で入力してください");

    expect(SCR003_HABIT_NAME_BOUNDARY_CASES).toEqual([
      { label: "1文字", length: 1, valid: true },
      { label: "80文字", length: 80, valid: true },
      { label: "81文字", length: 81, valid: false },
    ]);
  });

  it("TC-IT-FR-006-002: display_order は 1/9999/範囲外(0,10000) を要求する", () => {
    const page = SCR003HabitCreatePage({ screenId: "SCR-003" }) as unknown as Record<string, unknown>;

    expect(page).toHaveProperty("ui.validation.display_order.min", 1);
    expect(page).toHaveProperty("ui.validation.display_order.max", 9999);
    expect(page).toHaveProperty("ui.validation.display_order.error.range", "display_order は1〜9999で入力してください");

    expect(SCR003_DISPLAY_ORDER_BOUNDARY_CASES).toEqual([
      { label: "display_order=1", value: 1, valid: true },
      { label: "display_order=9999", value: 9999, valid: true },
      { label: "display_order=範囲外(0)", value: 0, valid: false },
      { label: "display_order=範囲外(10000)", value: 10000, valid: false },
    ]);
  });

  it("name 1〜80 / display_order 1〜9999 をモデルAPIで検証する", () => {
    const page = SCR003HabitCreatePage({ screenId: "SCR-003" });

    page.actions.setName("");
    expect(page.actions.validateName()).toBe(false);
    expect(page.ui.errors.name).toBe("習慣名を1文字以上入力してください");

    page.actions.setName("a".repeat(80));
    expect(page.actions.validateName()).toBe(true);
    expect(page.ui.errors.name).toBeNull();

    page.actions.setName("a".repeat(81));
    expect(page.actions.validateName()).toBe(false);
    expect(page.ui.errors.name).toBe("習慣名は80文字以内で入力してください");

    page.actions.setDisplayOrder(1);
    expect(page.actions.validateDisplayOrder()).toBe(true);
    expect(page.ui.errors.display_order).toBeNull();

    page.actions.setDisplayOrder(9999);
    expect(page.actions.validateDisplayOrder()).toBe(true);
    expect(page.ui.errors.display_order).toBeNull();

    page.actions.setDisplayOrder(0);
    expect(page.actions.validateDisplayOrder()).toBe(false);
    expect(page.ui.errors.display_order).toBe("display_order は1〜9999で入力してください");

    page.actions.setDisplayOrder(10000);
    expect(page.actions.validateDisplayOrder()).toBe(false);
    expect(page.ui.errors.display_order).toBe("display_order は1〜9999で入力してください");
  });

  it("TC-IT-FR-006-001: 保存中フラグを公開し、cancel は submit を発火しない", () => {
    expect(SCR003_UI_REQUIREMENT_TRACE_CASES.some((testCase) => testCase.testCaseId === "TC-IT-FR-006-001")).toBe(true);
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

    expect(page.ui.isSaving).toBe(false);
    expect(page.ui.saveButton.loading).toBe(false);
    expect(page.ui.saveButton.disabled).toBe(false);

    page.actions.setSaving(true);
    expect(page.ui.isSaving).toBe(true);
    expect(page.ui.saveButton.loading).toBe(true);
    expect(page.ui.saveButton.disabled).toBe(true);

    page.actions.cancel();
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();

    expect(SCR003_CANCEL_TRANSITION_EXPECTATION.shouldSubmitOnCancel).toBe(false);
  });

  it("完了ゲート: SCR-003 unit/integration 実行コマンドを固定する", () => {
    expect(T052_C004_COMPLETION_GATE_COMMANDS).toEqual([
      "npm run test -- tests/unit/screens/scr-003-habit-create-page-red.spec.ts tests/integration/ui/scr-003-habit-create-runtime-red.spec.ts",
      "npm run test -- tests/unit/screens/scr-003-habit-create-page-red.spec.ts tests/integration/ui/scr-003-habit-create-runtime-red.spec.ts tests/integration/api/if-002-habits-create-update-red.spec.ts && npm run typecheck",
    ]);
  });
});
