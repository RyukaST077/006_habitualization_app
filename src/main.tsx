import { createAppShell } from "./App";
import { ROUTE_MAP } from "./app/route-map";
import { resolveAuthConsentRedirect } from "./app/router";
import { SCR008PolicyConsentPage, type PolicyConsentAuditTrace } from "./screens/SCR-008PolicyConsentPage";
import type { If001StartApiErrorResponse, If001StartApiSuccessResponse } from "./server/application/if-001/contracts";

export function bootstrapApp() {
  return createAppShell();
}

const CALLBACK_USER_ID_STORAGE_KEY = "if001-callback-user-id";
const POLICY_CONSENT_TRACE_STORAGE_KEY = "if001-policy-consent-trace";

function renderAppShell() {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.querySelector<HTMLDivElement>("#app");
  if (!root) {
    return;
  }

  const app = bootstrapApp();
  if (window.location.pathname === "/login") {
    renderLoginPage(root, app);
    return;
  }
  if (window.location.pathname === "/auth/callback") {
    void renderAuthCallbackPage(root, app);
    return;
  }
  if (window.location.pathname === ROUTE_MAP["SCR-002"]) {
    renderSimpleRoutePage(root, app, "SCR-002 Home", "認証後の到達先です。");
    return;
  }
  if (window.location.pathname === ROUTE_MAP["SCR-008"]) {
    void renderPolicyConsentPage(root, app);
    return;
  }

  const routeList = app.routes.map((route) => `<li><a href="${route}">${route}</a></li>`).join("");
  root.innerHTML = `<main style="font-family: sans-serif; max-width: 720px; margin: 32px auto; padding: 16px;">
    <h1>${app.name}</h1>
    <p>Open <a href="/login">/login</a> to run Google auth start flow.</p>
    <h2>Routes</h2>
    <ul>${routeList}</ul>
  </main>`;
}

function renderSimpleRoutePage(root: HTMLDivElement, app: ReturnType<typeof bootstrapApp>, title: string, description: string) {
  root.innerHTML = `<main style="font-family: sans-serif; max-width: 720px; margin: 32px auto; padding: 16px;">
    <h1>${app.name}</h1>
    <h2>${title}</h2>
    <p>${description}</p>
    <p><a href="/login">/login に戻る</a></p>
  </main>`;
}

function renderLoginPage(root: HTMLDivElement, app: ReturnType<typeof bootstrapApp>) {
  root.innerHTML = `<main style="font-family: sans-serif; max-width: 720px; margin: 32px auto; padding: 16px;">
    <h1>${app.name}</h1>
    <h2>SCR-001 Login</h2>
    <p>Google認証の開始API（IF-001）を呼び出します。</p>
    <button id="login-start-button" type="button">Googleでログイン</button>
    <pre id="login-status" style="margin-top: 16px; white-space: pre-wrap;"></pre>
  </main>`;

  const button = root.querySelector<HTMLButtonElement>("#login-start-button");
  const status = root.querySelector<HTMLPreElement>("#login-status");
  if (!button || !status) {
    return;
  }

  button.disabled = false;
  button.addEventListener("click", async () => {
    button.disabled = true;
    status.textContent = "認証開始APIを呼び出し中...";
    try {
      const response = await fetch("/api/auth/google/start", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer dev-session",
        },
        body: JSON.stringify({ redirectTo: "/auth/callback" }),
      });

      const data = (await response.json()) as If001StartApiSuccessResponse["body"] | If001StartApiErrorResponse["body"];
      if (response.ok && "auth_url" in data) {
        status.textContent = `成功\ntrace_id: ${data.trace_id}\naudit_action: ${data.audit_action}\nGoogleへ遷移します...`;
        window.location.assign(data.auth_url);
      } else if ("code" in data) {
        status.textContent = `失敗\ncode: ${data.code}\ntrace_id: ${data.trace_id}\nroute: ${data.route}`;
      } else {
        status.textContent = "失敗: 予期しないレスポンス";
      }
    } catch (error: unknown) {
      status.textContent = `失敗: ${error instanceof Error ? error.message : "unknown error"}`;
    } finally {
      button.disabled = false;
    }
  });
}

type If001CallbackApiResponse = {
  route: "SCR-001" | "SCR-002" | "SCR-008";
  auditAction?: "POLICY_CONSENT_REJECT" | "LOGIN_FAILED";
  detail?: string;
};

function parseHashParams(hash: string): URLSearchParams {
  return new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
}

function decodeJwtSub(accessToken: string): string | null {
  const parts = accessToken.split(".");
  if (parts.length < 2) {
    return null;
  }
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))) as { sub?: unknown };
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

function mapRouteIdToPath(route: If001CallbackApiResponse["route"]): string {
  if (route === "SCR-002") {
    return ROUTE_MAP["SCR-002"];
  }
  if (route === "SCR-008") {
    return ROUTE_MAP["SCR-008"];
  }
  return ROUTE_MAP["SCR-001"];
}

async function renderAuthCallbackPage(root: HTMLDivElement, app: ReturnType<typeof bootstrapApp>) {
  root.innerHTML = `<main style="font-family: sans-serif; max-width: 720px; margin: 32px auto; padding: 16px;">
    <h1>${app.name}</h1>
    <h2>Auth Callback</h2>
    <pre id="callback-status" style="margin-top: 16px; white-space: pre-wrap;">認証結果を確認中...</pre>
  </main>`;

  const status = root.querySelector<HTMLPreElement>("#callback-status");
  if (!status) {
    return;
  }

  const hashParams = parseHashParams(window.location.hash);
  const authError = hashParams.get("error_description") ?? hashParams.get("error");
  if (authError) {
    status.textContent = `認証失敗: ${authError}\n/login に戻ります。`;
    setTimeout(() => window.location.assign("/login"), 1200);
    return;
  }

  const accessToken = hashParams.get("access_token");
  if (!accessToken) {
    status.textContent = "認証失敗: access_token が見つかりません。/login に戻って再試行してください。";
    return;
  }

  const userId = decodeJwtSub(accessToken);
  if (!userId) {
    status.textContent = "認証失敗: access_token の userId(sub) を取得できませんでした。";
    return;
  }
  writeSessionStorage(CALLBACK_USER_ID_STORAGE_KEY, userId);

  try {
    const response = await fetch("/api/auth/google/callback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId, consentState: "unknown" }),
    });
    const data = (await response.json()) as If001CallbackApiResponse;
    if (!response.ok) {
      status.textContent = `認証失敗: callback API ${response.status}${data.detail ? ` (${data.detail})` : ""}`;
      return;
    }
    const nextPath = mapRouteIdToPath(data.route);
    status.textContent = `認証成功: ${data.route} (${nextPath}) に遷移します。`;
    window.history.replaceState({}, document.title, "/auth/callback");
    setTimeout(() => window.location.assign(nextPath), 250);
  } catch (error: unknown) {
    status.textContent = `認証失敗: ${error instanceof Error ? error.message : "unknown error"}`;
  }
}

function writeSessionStorage(key: string, value: string): void {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    return;
  }
}

function readSessionStorage(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writePolicyConsentTrace(trace: PolicyConsentAuditTrace): string {
  const traceId = `${trace.action.toLowerCase()}-${Date.now()}`;
  writeSessionStorage(
    POLICY_CONSENT_TRACE_STORAGE_KEY,
    JSON.stringify({
      trace_id: traceId,
      action: trace.action,
      requirement_id: trace.requirementId,
      metadata: trace.metadata,
    }),
  );
  return traceId;
}

async function renderPolicyConsentPage(root: HTMLDivElement, app: ReturnType<typeof bootstrapApp>) {
  root.innerHTML = `<main style="font-family: sans-serif; max-width: 720px; margin: 32px auto; padding: 16px;">
    <h1>${app.name}</h1>
    <h2>SCR-008 Policy Consent</h2>
    <p>利用規約とプライバシーポリシーの両方への同意が必要です。</p>
    <label style="display: block; margin-top: 12px;">
      <input id="consent-terms" type="checkbox" />
      利用規約に同意する
    </label>
    <label style="display: block; margin-top: 8px;">
      <input id="consent-privacy" type="checkbox" />
      プライバシーポリシーに同意する
    </label>
    <div style="display: flex; gap: 8px; margin-top: 16px;">
      <button id="consent-accept-button" type="button">同意して続行</button>
      <button id="consent-reject-button" type="button">拒否してログインに戻る</button>
    </div>
    <pre id="consent-status" style="margin-top: 16px; white-space: pre-wrap;"></pre>
  </main>`;

  const termsInput = root.querySelector<HTMLInputElement>("#consent-terms");
  const privacyInput = root.querySelector<HTMLInputElement>("#consent-privacy");
  const acceptButton = root.querySelector<HTMLButtonElement>("#consent-accept-button");
  const rejectButton = root.querySelector<HTMLButtonElement>("#consent-reject-button");
  const status = root.querySelector<HTMLPreElement>("#consent-status");
  if (!termsInput || !privacyInput || !acceptButton || !rejectButton || !status) {
    return;
  }

  const page = SCR008PolicyConsentPage({
    screenId: "SCR-008",
    handlers: {
      onAccept: (trace) => {
        void submitPolicyConsentDecision(status, acceptButton, rejectButton, "agreed", trace);
      },
      onReject: (trace) => {
        void submitPolicyConsentDecision(status, acceptButton, rejectButton, "rejected", trace);
      },
    },
  });

  const syncUiState = () => {
    acceptButton.disabled = page.ui.acceptButton.disabled;
  };

  termsInput.checked = page.ui.terms.checked;
  privacyInput.checked = page.ui.privacy.checked;
  syncUiState();

  termsInput.addEventListener("change", () => {
    page.actions.setTermsChecked(termsInput.checked);
    syncUiState();
  });
  privacyInput.addEventListener("change", () => {
    page.actions.setPrivacyChecked(privacyInput.checked);
    syncUiState();
  });

  acceptButton.addEventListener("click", () => {
    if (!page.actions.accept()) {
      status.textContent = "利用規約とプライバシーポリシーの両方を選択してください。";
      syncUiState();
    }
  });
  rejectButton.addEventListener("click", () => {
    page.actions.reject();
  });
}

async function submitPolicyConsentDecision(
  status: HTMLPreElement,
  acceptButton: HTMLButtonElement,
  rejectButton: HTMLButtonElement,
  consentState: "agreed" | "rejected",
  trace: PolicyConsentAuditTrace,
): Promise<void> {
  const userId = readSessionStorage(CALLBACK_USER_ID_STORAGE_KEY);
  if (!userId) {
    status.textContent = "認証セッションが見つかりません。/login から再試行してください。";
    return;
  }

  acceptButton.disabled = true;
  rejectButton.disabled = true;
  const traceId = writePolicyConsentTrace(trace);
  status.textContent = `${trace.action} を監査トレースに保持しました。\ntrace_id: ${traceId}\n同意結果を送信中...`;

  try {
    const response = await fetch("/api/auth/google/callback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId, consentState }),
    });
    const data = (await response.json()) as If001CallbackApiResponse;
    if (!response.ok) {
      status.textContent = `送信失敗: callback API ${response.status}${data.detail ? ` (${data.detail})` : ""}`;
      acceptButton.disabled = consentState !== "agreed";
      rejectButton.disabled = false;
      return;
    }

    const nextPath = resolveAuthConsentRedirect(ROUTE_MAP["SCR-008"], "authenticated", consentState);
    status.textContent = `送信成功: ${trace.action}\n${nextPath} に遷移します。`;
    setTimeout(() => window.location.assign(nextPath), 250);
  } catch (error: unknown) {
    status.textContent = `送信失敗: ${error instanceof Error ? error.message : "unknown error"}`;
    acceptButton.disabled = consentState !== "agreed";
    rejectButton.disabled = false;
  }
}

renderAppShell();
