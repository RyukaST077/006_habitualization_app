import { describe, expect, it, vi } from "vitest";

import { SCR004HabitEditPage } from "../../../src/screens/SCR-004HabitEditPage";
import type { HabitLifecycleStatus } from "../../../src/screens/types";
import { SCR004_STATUS_BUTTON_VISIBILITY } from "../../helpers/ui/common-ui-fixtures";

describe("T-039 PR-002 SCR-004 habit edit UI red tests", () => {
  it("active/archived で archive/resume ボタン表示が切り替わることを要求する", () => {
    const activePage = SCR004HabitEditPage({
      screenId: "SCR-004",
      params: { habitId: "habit-active" },
    }) as unknown as Record<string, unknown>;

    expect(activePage).toHaveProperty("ui.status", "active");
    expect(activePage).toHaveProperty("ui.buttons.archive.visible", true);
    expect(activePage).toHaveProperty("ui.buttons.resume.visible", false);

    const expectedStatusOrder: HabitLifecycleStatus[] = ["active", "archived"];
    const fixtureStatuses = SCR004_STATUS_BUTTON_VISIBILITY.map((item) => item.status);
    expect(fixtureStatuses).toEqual(expectedStatusOrder);
  });

  it("403 発生時はホーム導線へ戻るアクションを要求する", () => {
    const onBack = vi.fn();
    const page = SCR004HabitEditPage({
      screenId: "SCR-004",
      params: { habitId: "habit-forbidden" },
      handlers: { onBack },
    }) as unknown as {
      actions: {
        handleHttpError: (status: number) => void;
      };
    };

    page.actions.handleHttpError(403);

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
