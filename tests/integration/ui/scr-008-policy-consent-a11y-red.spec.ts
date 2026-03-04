import { describe, expect, it, vi } from "vitest";

import { resolveAuthConsentRedirect } from "../../../src/app/router";
import { SCR008PolicyConsentPage } from "../../../src/screens/SCR-008PolicyConsentPage";
import {
  SCR008_A11Y_KEYBOARD_EXPECTATION,
  SCR008_DUAL_CHECK_REQUIRED_EXPECTATION,
  SCR008_REJECT_FLOW_EXPECTATION,
} from "../../helpers/ui/common-ui-fixtures";

function toggleByKeyboard(key: string, current: boolean, setChecked: (checked: boolean) => void): boolean {
  if (key !== SCR008_A11Y_KEYBOARD_EXPECTATION.toggleKey) {
    return current;
  }
  const next = !current;
  setChecked(next);
  return next;
}

function activateByKeyboard(key: string, action: () => boolean | void): boolean {
  if (key !== SCR008_A11Y_KEYBOARD_EXPECTATION.submitKey) {
    return false;
  }
  const result = action();
  return result !== false;
}

describe("T-051 C-004 SCR-008 policy consent accessibility regression tests", () => {
  it("キーボード操作のみで同意導線を実行できる", () => {
    const onAccept = vi.fn();
    const page = SCR008PolicyConsentPage({ screenId: "SCR-008", handlers: { onAccept } });

    let termsChecked = false;
    let privacyChecked = false;

    termsChecked = toggleByKeyboard(SCR008_A11Y_KEYBOARD_EXPECTATION.toggleKey, termsChecked, page.actions.setTermsChecked);
    privacyChecked = toggleByKeyboard(SCR008_A11Y_KEYBOARD_EXPECTATION.toggleKey, privacyChecked, page.actions.setPrivacyChecked);

    expect(page.ui.acceptButton.requires).toEqual(SCR008_DUAL_CHECK_REQUIRED_EXPECTATION.requiredChecks);
    expect(page.ui.acceptButton.disabled).toBe(false);

    const executed = activateByKeyboard(SCR008_A11Y_KEYBOARD_EXPECTATION.submitKey, page.actions.accept);
    expect(executed).toBe(true);
    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it("2チェックOFFでは Enter を押しても同意操作できない（disabled 回帰）", () => {
    const onAccept = vi.fn();
    const page = SCR008PolicyConsentPage({ screenId: "SCR-008", handlers: { onAccept } });

    const executed = activateByKeyboard(SCR008_A11Y_KEYBOARD_EXPECTATION.submitKey, page.actions.accept);

    expect(page.ui.acceptButton.disabled).toBe(SCR008_DUAL_CHECK_REQUIRED_EXPECTATION.disabledWhenEitherUnchecked);
    expect(executed).toBe(false);
    expect(onAccept).not.toHaveBeenCalled();
  });

  it("キーボード操作のみで拒否導線を実行でき、/login へ戻る分岐を保持する", () => {
    const onReject = vi.fn();
    const page = SCR008PolicyConsentPage({ screenId: "SCR-008", handlers: { onReject } });

    const executed = activateByKeyboard(SCR008_A11Y_KEYBOARD_EXPECTATION.submitKey, page.actions.reject);
    const nextPath = resolveAuthConsentRedirect(
      SCR008_REJECT_FLOW_EXPECTATION.fromPath,
      "authenticated",
      SCR008_REJECT_FLOW_EXPECTATION.consentState,
    );

    expect(executed).toBe(true);
    expect(onReject).toHaveBeenCalledTimes(1);
    expect(nextPath).toBe(SCR008_REJECT_FLOW_EXPECTATION.expectedPath);
  });

  it("Space/Enter 以外のキーでは操作を実行しない", () => {
    const onAccept = vi.fn();
    const page = SCR008PolicyConsentPage({ screenId: "SCR-008", handlers: { onAccept } });

    const toggled = toggleByKeyboard(SCR008_A11Y_KEYBOARD_EXPECTATION.ignoreKey, false, page.actions.setTermsChecked);
    const executed = activateByKeyboard(SCR008_A11Y_KEYBOARD_EXPECTATION.ignoreKey, page.actions.accept);

    expect(toggled).toBe(false);
    expect(executed).toBe(false);
    expect(onAccept).not.toHaveBeenCalled();
  });
});
