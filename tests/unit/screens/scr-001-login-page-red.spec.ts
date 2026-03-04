import { describe, expect, it, vi } from "vitest";

import { SCR001LoginPage } from "../../../src/screens/SCR-001LoginPage";
import { resolveAuthConsentRedirect } from "../../../src/app/router";
import { ROUTE_MAP } from "../../../src/app/route-map";
import {
  SCR001_AUTHENTICATED_REDIRECT_CASES,
  SCR001_AUTH_FAILURE_EXPECTATION,
  SCR001_TRACEABILITY_IDS,
  SCR001_LOGIN_BUTTON_LOADING_EXPECTATION,
  getT034AuthUiImplementationState,
} from "../../helpers/ui/common-ui-fixtures";

describe("T-050 C-001 SCR-001 login UI red tests", () => {
  it("FR-001 / SCR-001 / IF-001 トレースIDが固定されている", () => {
    expect(SCR001_TRACEABILITY_IDS).toEqual(["FR-001", "SCR-001", "IF-001"]);
  });

  it("Googleでログイン押下中は loading=true かつ disabled=true を維持し、完了後に解除する", async () => {
    let resolveStartAuth: (() => void) | undefined;
    const onStartAuth = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveStartAuth = resolve;
        })
    );
    const page = SCR001LoginPage({ screenId: "SCR-001", handlers: { onStartAuth } });

    expect(page.ui.loginButton.loading).toBe(SCR001_LOGIN_BUTTON_LOADING_EXPECTATION.initial.loading);
    expect(page.ui.loginButton.disabled).toBe(SCR001_LOGIN_BUTTON_LOADING_EXPECTATION.initial.disabled);
    expect(page.ui.loginButton.label).toBe(SCR001_LOGIN_BUTTON_LOADING_EXPECTATION.label);
    expect(page.ui.loginButton.ariaLabel).toBe(SCR001_LOGIN_BUTTON_LOADING_EXPECTATION.ariaLabel);

    page.actions.startAuth();
    await vi.waitFor(() => {
      expect(onStartAuth).toHaveBeenCalledTimes(1);
    });

    expect(page.ui.loginButton.loading).toBe(SCR001_LOGIN_BUTTON_LOADING_EXPECTATION.pending.loading);
    expect(page.ui.loginButton.disabled).toBe(SCR001_LOGIN_BUTTON_LOADING_EXPECTATION.pending.disabled);

    resolveStartAuth?.();
    await vi.waitFor(() => {
      expect(page.ui.loginButton.loading).toBe(SCR001_LOGIN_BUTTON_LOADING_EXPECTATION.settled.loading);
      expect(page.ui.loginButton.disabled).toBe(SCR001_LOGIN_BUTTON_LOADING_EXPECTATION.settled.disabled);
    });
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

  it("Enter キー押下時のみログイン開始操作を実行する", async () => {
    const onStartAuth = vi.fn();
    const page = SCR001LoginPage({ screenId: "SCR-001", handlers: { onStartAuth } });

    const enterExecuted = page.actions.handleLoginButtonKeyDown(SCR001_LOGIN_BUTTON_LOADING_EXPECTATION.executeKey);
    const spaceExecuted = page.actions.handleLoginButtonKeyDown("Space");
    await vi.waitFor(() => {
      expect(onStartAuth).toHaveBeenCalledTimes(1);
    });

    expect(enterExecuted).toBe(true);
    expect(spaceExecuted).toBe(false);
    expect(page.ui.loginButton.executeKey).toBe(SCR001_LOGIN_BUTTON_LOADING_EXPECTATION.executeKey);
  });

  it("送信中は Enter キーによる認証開始の多重実行を抑止する", async () => {
    let resolveStartAuth: (() => void) | undefined;
    const onStartAuth = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveStartAuth = resolve;
        })
    );
    const page = SCR001LoginPage({ screenId: "SCR-001", handlers: { onStartAuth } });

    const firstExecuted = page.actions.handleLoginButtonKeyDown("Enter");
    const secondExecuted = page.actions.handleLoginButtonKeyDown("Enter");
    await vi.waitFor(() => {
      expect(onStartAuth).toHaveBeenCalledTimes(1);
    });

    expect(firstExecuted).toBe(true);
    expect(secondExecuted).toBe(false);
    resolveStartAuth?.();
  });

  it("認証済みユーザーが /login に到達した場合、同意状態で遷移先を分岐する", () => {
    for (const testCase of SCR001_AUTHENTICATED_REDIRECT_CASES) {
      const actualPath = resolveAuthConsentRedirect(ROUTE_MAP["SCR-001"], "authenticated", testCase.consentState);
      expect(actualPath).toBe(testCase.expectedPath);
    }
  });

  it("T-034 実装状態が implemented である", () => {
    expect(getT034AuthUiImplementationState()).toBe("implemented");
  });
});
