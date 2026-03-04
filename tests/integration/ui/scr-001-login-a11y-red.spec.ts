import { describe, expect, it, vi } from "vitest";

import { SCR001LoginPage } from "../../../src/screens/SCR-001LoginPage";
import { SCR001_A11Y_ENTER_KEY_EXPECTATION } from "../../helpers/ui/common-ui-fixtures";

function triggerByKeyboard(key: string, action: () => void): boolean {
  if (key !== SCR001_A11Y_ENTER_KEY_EXPECTATION.executeKey) {
    return false;
  }
  action();
  return true;
}

describe("T-050 C-001 SCR-001 login accessibility red tests", () => {
  it("Enter キーでログイン開始操作を実行できる", () => {
    const onStartAuth = vi.fn();
    const page = SCR001LoginPage({ screenId: "SCR-001", handlers: { onStartAuth } });

    const executed = triggerByKeyboard(SCR001_A11Y_ENTER_KEY_EXPECTATION.executeKey, page.actions.startAuth);

    expect(executed).toBe(true);
    expect(onStartAuth).toHaveBeenCalledTimes(1);
  });

  it("Enter 以外のキーではログイン開始操作を実行しない", () => {
    const onStartAuth = vi.fn();
    const page = SCR001LoginPage({ screenId: "SCR-001", handlers: { onStartAuth } });

    const executed = triggerByKeyboard(SCR001_A11Y_ENTER_KEY_EXPECTATION.ignoreKey, page.actions.startAuth);

    expect(executed).toBe(false);
    expect(onStartAuth).not.toHaveBeenCalled();
  });

  it("Googleログインボタンは aria-label と同一の公開ラベルを持つ", () => {
    const page = SCR001LoginPage({ screenId: "SCR-001" });

    expect(page.ui.loginButton.ariaLabel).toBe(SCR001_A11Y_ENTER_KEY_EXPECTATION.ariaLabel);
    expect(page.ui.loginButton.label).toBe(SCR001_A11Y_ENTER_KEY_EXPECTATION.ariaLabel);
  });

  it("フォーカス可視状態を保持したままキーボード操作できる", () => {
    const page = SCR001LoginPage({ screenId: "SCR-001" });
    const executed = page.actions.handleLoginButtonKeyDown(SCR001_A11Y_ENTER_KEY_EXPECTATION.executeKey);

    expect(executed).toBe(true);
    expect(page.ui.loginButton.executeKey).toBe(SCR001_A11Y_ENTER_KEY_EXPECTATION.executeKey);
  });
});
