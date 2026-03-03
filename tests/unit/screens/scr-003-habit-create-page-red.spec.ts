import { describe, expect, it } from "vitest";

import { SCR003HabitCreatePage } from "../../../src/screens/SCR-003HabitCreatePage";
import {
  SCR003_DISPLAY_ORDER_BOUNDARY_CASES,
  SCR003_HABIT_NAME_BOUNDARY_CASES,
} from "../../helpers/ui/common-ui-fixtures";

describe("T-039 PR-002 SCR-003 habit create UI red tests", () => {
  it("1文字/80文字/81文字 の習慣名境界を画面バリデーションとして要求する", () => {
    const page = SCR003HabitCreatePage({ screenId: "SCR-003" }) as unknown as Record<string, unknown>;

    expect(page).toHaveProperty("ui.validation.name.minLength", 1);
    expect(page).toHaveProperty("ui.validation.name.maxLength", 80);
    expect(page).toHaveProperty("ui.validation.name.error.maxLength", "習慣名は80文字以内で入力してください");

    const boundaryLabels = SCR003_HABIT_NAME_BOUNDARY_CASES.map((testCase) => testCase.label);
    expect(boundaryLabels).toEqual(["1文字", "80文字", "81文字"]);
  });

  it("display_order の境界値(1/9999)と異常値(0/10000)を要求する", () => {
    const page = SCR003HabitCreatePage({ screenId: "SCR-003" }) as unknown as Record<string, unknown>;

    expect(page).toHaveProperty("ui.validation.display_order.min", 1);
    expect(page).toHaveProperty("ui.validation.display_order.max", 9999);
    expect(page).toHaveProperty("ui.validation.display_order.error.range", "display_order は1〜9999で入力してください");

    const displayOrderValues = SCR003_DISPLAY_ORDER_BOUNDARY_CASES.map((testCase) => testCase.value);
    expect(displayOrderValues).toEqual([0, 1, 9999, 10000]);
  });
});
