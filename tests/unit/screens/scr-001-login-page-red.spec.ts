import { describe, expect, it, vi } from "vitest";

import { SCR001LoginPage } from "../../../src/screens/SCR-001LoginPage";
import {
  SCR001_AUTH_FAILURE_EXPECTATION,
  SCR001_LOGIN_BUTTON_LOADING_EXPECTATION,
  getT034AuthUiImplementationState,
} from "../../helpers/ui/common-ui-fixtures";

describe("T-034 PR-004 SCR-001 login UI tests", () => {
  it("Googleでログイン押下中は loading=true かつ disabled=true を要求する", () => {
    const page = SCR001LoginPage({ screenId: "SCR-001" }) as unknown as Record<string, unknown>;

    expect(page).toHaveProperty("ui.loginButton.loading", SCR001_LOGIN_BUTTON_LOADING_EXPECTATION.loading);
    expect(page).toHaveProperty("ui.loginButton.disabled", SCR001_LOGIN_BUTTON_LOADING_EXPECTATION.disabled);
    expect(page).toHaveProperty("ui.loginButton.label", SCR001_LOGIN_BUTTON_LOADING_EXPECTATION.label);
  });

  it("認証失敗時はエラー表示し、再試行アクションを提供する", () => {
    const onRetryAuth = vi.fn();
    const page = SCR001LoginPage({ screenId: "SCR-001", handlers: { onRetryAuth } });
    const error = page.actions.resolveError(401, "AUTH_FAILED");

    expect(error.message).toContain(SCR001_AUTH_FAILURE_EXPECTATION.errorMessageContains);
    expect(typeof page.actions.retryAuth).toBe("function");

    page.actions.retryAuth();
    expect(onRetryAuth).toHaveBeenCalledTimes(1);
  });

  it("T-034 実装状態が implemented である", () => {
    expect(getT034AuthUiImplementationState()).toBe("implemented");
  });
});
