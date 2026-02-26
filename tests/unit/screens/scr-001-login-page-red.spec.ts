import { describe, expect, it } from "vitest";

import { SCR001LoginPage } from "../../../src/screens/SCR-001LoginPage";
import {
  SCR001_AUTH_FAILURE_EXPECTATION,
  SCR001_LOGIN_BUTTON_LOADING_EXPECTATION,
  getT034AuthUiImplementationState,
} from "../../helpers/ui/common-ui-fixtures";

describe("T-033 PR-003 SCR-001 login UI red tests", () => {
  it("Googleでログイン押下中は loading=true かつ disabled=true を要求する", () => {
    const page = SCR001LoginPage({ screenId: "SCR-001" }) as unknown as Record<string, unknown>;

    expect(page).toHaveProperty("ui.loginButton.loading", SCR001_LOGIN_BUTTON_LOADING_EXPECTATION.loading);
    expect(page).toHaveProperty("ui.loginButton.disabled", SCR001_LOGIN_BUTTON_LOADING_EXPECTATION.disabled);
    expect(page).toHaveProperty("ui.loginButton.label", SCR001_LOGIN_BUTTON_LOADING_EXPECTATION.label);
  });

  it("認証失敗時はエラー表示し、再試行アクションを提供する", () => {
    const page = SCR001LoginPage({ screenId: "SCR-001" });
    const error = page.actions.resolveError(401, "FORBIDDEN");

    expect(error.message).toContain(SCR001_AUTH_FAILURE_EXPECTATION.errorMessageContains);
    expect(page as unknown as Record<string, unknown>).toHaveProperty(
      "actions.retryAuth",
      SCR001_AUTH_FAILURE_EXPECTATION.retryActionLabel
    );
  });

  it("red: T-034 未実装のため SCR-001 loading/disabled と認証失敗再試行は失敗させる", () => {
    expect(getT034AuthUiImplementationState()).toBe("implemented");
  });
});
