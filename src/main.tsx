/// <reference lib="dom" />

import { createAppShell } from "./App";
import { ROUTE_MAP } from "./app/route-map";
import { resolveAuthConsentRedirect, resolveLoginArrivalRedirect } from "./app/router";
import {
  resolvePolicyConsentEntryRoute,
  type If001CallbackRoute,
  type If001SessionState,
} from "./app/policy-consent-entry";
import { SCR001LoginPage } from "./screens/SCR-001LoginPage";
import { SCR008PolicyConsentPage, type PolicyConsentAuditTrace } from "./screens/SCR-008PolicyConsentPage";
import { SCR003HabitCreatePage } from "./screens/SCR-003HabitCreatePage";
import { SCR004HabitEditPage } from "./screens/SCR-004HabitEditPage";
import { SCR002HomePage, type CheckinResolution } from "./screens/SCR-002HomePage";
import type { If001StartApiErrorResponse, If001StartApiSuccessResponse } from "./server/application/if-001/contracts";
import { resolveErrorPresentation } from "./ui/error-presentation";
import type { CommonErrorCode, ErrorPresentation, ErrorStatus } from "./ui/error-presentation";

export function bootstrapApp() {
  return createAppShell();
}

const CALLBACK_USER_ID_STORAGE_KEY = "if001-callback-user-id";
const CALLBACK_ACCESS_TOKEN_STORAGE_KEY = "if001-callback-access-token";
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
    void renderLoginOrRedirect(root, app);
    return;
  }
  if (window.location.pathname === "/auth/callback") {
    void renderAuthCallbackPage(root, app);
    return;
  }
  if (window.location.pathname === ROUTE_MAP["SCR-002"]) {
    renderHomePage(root, app);
    return;
  }
  if (window.location.pathname === ROUTE_MAP["SCR-003"]) {
    renderHabitCreatePage(root, app);
    return;
  }
  const editMatch = window.location.pathname.match(/^\/habits\/([^/]+)\/edit$/);
  if (editMatch) {
    renderHabitEditPage(root, app, decodeURIComponent(editMatch[1]));
    return;
  }
  if (window.location.pathname === ROUTE_MAP["SCR-008"]) {
    void renderPolicyConsentOrRedirect(root, app);
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

type If001SessionStateResponse = If001SessionState;

export async function renderLoginOrRedirect(root: HTMLDivElement, app: ReturnType<typeof bootstrapApp>): Promise<void> {
  const accessToken = readSessionStorage(CALLBACK_ACCESS_TOKEN_STORAGE_KEY);
  if (!accessToken) {
    renderLoginPage(root, app);
    return;
  }

  try {
    const response = await fetch("/api/auth/session-state", {
      method: "GET",
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });
    const data = (await response.json()) as If001SessionStateResponse;
    if (data.authState === "authenticated") {
      if (data.userId) {
        writeSessionStorage(CALLBACK_USER_ID_STORAGE_KEY, data.userId);
      }
      const nextPath = resolveLoginArrivalRedirect(data.authState, data.consentState);
      window.location.replace(nextPath);
      return;
    }
  } catch {
    // fall through
  }

  renderLoginPage(root, app);
}

async function fetchIf001SessionState(accessToken: string): Promise<If001SessionStateResponse | null> {
  try {
    const response = await fetch("/api/auth/session-state", {
      method: "GET",
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });
    return (await response.json()) as If001SessionStateResponse;
  } catch {
    return null;
  }
}

async function fetchIf001CallbackDecision(userId: string): Promise<If001CallbackApiResponse | null> {
  try {
    const response = await fetch("/api/auth/google/callback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId, consentState: "unknown" }),
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as If001CallbackApiResponse;
  } catch {
    return null;
  }
}

async function renderPolicyConsentOrRedirect(root: HTMLDivElement, app: ReturnType<typeof bootstrapApp>): Promise<void> {
  const accessToken = readSessionStorage(CALLBACK_ACCESS_TOKEN_STORAGE_KEY);
  if (accessToken) {
    const sessionState = await fetchIf001SessionState(accessToken);
    if (sessionState) {
      if (sessionState.userId) {
        writeSessionStorage(CALLBACK_USER_ID_STORAGE_KEY, sessionState.userId);
      }
      const nextPath = resolvePolicyConsentEntryRoute(sessionState, null);
      if (nextPath !== ROUTE_MAP["SCR-008"]) {
        window.location.replace(nextPath);
        return;
      }
      await renderPolicyConsentPage(root, app);
      return;
    }
  }

  const fallbackUserId = readSessionStorage(CALLBACK_USER_ID_STORAGE_KEY);
  if (!fallbackUserId) {
    window.location.replace(ROUTE_MAP["SCR-001"]);
    return;
  }

  const callbackDecision = await fetchIf001CallbackDecision(fallbackUserId);
  const fallbackRoute = resolvePolicyConsentEntryRoute(null, callbackDecision?.route ?? null);
  if (fallbackRoute === ROUTE_MAP["SCR-008"]) {
    await renderPolicyConsentPage(root, app);
    return;
  }
  window.location.replace(fallbackRoute);
}

function renderSimpleRoutePage(root: HTMLDivElement, app: ReturnType<typeof bootstrapApp>, title: string, description: string) {
  root.innerHTML = `<main style="font-family: sans-serif; max-width: 720px; margin: 32px auto; padding: 16px;">
    <h1>${app.name}</h1>
    <h2>${title}</h2>
    <p>${description}</p>
    <p><a href="/login">/login に戻る</a></p>
  </main>`;
}

type HabitSummary = {
  habitId: string;
  name: string;
  status: string;
  displayOrder: number;
  lastCheckinLogDate?: string | null;
};

type If002CancelSuccessPayload = {
  checkin?: {
    log_date?: string | null;
    canceled?: boolean;
  };
};

type If002CancelErrorPayload = {
  code?: string;
  trace_id?: string;
};

type If002HabitCreateSuccessPayload = {
  habit?: {
    habit_id?: string;
    name?: string;
    status?: string;
    display_order?: number;
  };
};

type If002HabitCreateErrorPayload = {
  code?: string;
  trace_id?: string;
};

export type HabitCreateRuntimeInput = {
  userId: string;
  name: string;
  displayOrder: number;
};

type HabitCreateRuntimeSuccess = {
  kind: "success";
  habitId: string;
};

type HabitCreateRuntimeError = {
  kind: "error";
  error: ErrorPresentation;
};

export type HabitCreateRuntimeResult = HabitCreateRuntimeSuccess | HabitCreateRuntimeError;

function asErrorStatus(status: number): 400 | 401 | 403 | 409 | 500 {
  if (status === 400 || status === 401 || status === 403 || status === 409) {
    return status;
  }
  return 500;
}

function asErrorCode(code: unknown): "VALIDATION_ERROR" | "AUTH_FAILED" | "FORBIDDEN" | "DOMAIN_CONFLICT" | "INTERNAL_ERROR" {
  if (
    code === "VALIDATION_ERROR"
    || code === "AUTH_FAILED"
    || code === "FORBIDDEN"
    || code === "DOMAIN_CONFLICT"
    || code === "INTERNAL_ERROR"
  ) {
    return code;
  }
  return "INTERNAL_ERROR";
}

function inferDomainConflictReason(
  status: number,
  code: unknown,
): "CHECKIN_CANCEL_NOT_ALLOWED" | undefined {
  if (status === 409 && code === "DOMAIN_CONFLICT") {
    return "CHECKIN_CANCEL_NOT_ALLOWED";
  }
  return undefined;
}

async function requestCancelCheckin(
  userId: string,
  habitId: string,
  nowUtc: string,
): Promise<CheckinResolution> {
  try {
    const response = await fetch(`/api/checkins/${encodeURIComponent(habitId)}`, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        userId,
        habit_id: habitId,
        now_utc: nowUtc,
      }),
    });

    let payload: If002CancelSuccessPayload | If002CancelErrorPayload | null = null;
    try {
      payload = (await response.json()) as If002CancelSuccessPayload | If002CancelErrorPayload;
    } catch {
      payload = null;
    }

    if (response.ok) {
      const successPayload = payload as If002CancelSuccessPayload | null;
      return {
        kind: "success",
        logDate: typeof successPayload?.checkin?.log_date === "string" ? successPayload.checkin.log_date : null,
        idempotent: false,
      };
    }

    const errorPayload = payload as If002CancelErrorPayload | null;
    const mappedCode = asErrorCode(errorPayload?.code);
    return {
      kind: "error",
      status: asErrorStatus(response.status),
      code: mappedCode,
      traceId: typeof errorPayload?.trace_id === "string" ? errorPayload.trace_id : undefined,
      domainConflictReason: inferDomainConflictReason(response.status, mappedCode),
    };
  } catch {
    return {
      kind: "error",
      status: 500,
      code: "INTERNAL_ERROR",
    };
  }
}

function renderHomePage(root: HTMLDivElement, app: ReturnType<typeof bootstrapApp>) {
  const userId = resolveHabitFormUserId();
  const page = SCR002HomePage({
    screenId: "SCR-002",
    handlers: {
      onNavigateTo: (target) => window.location.assign(target),
      onCancelCheckin: async ({ habitId, nowUtc }) => requestCancelCheckin(userId, habitId, nowUtc),
    },
  });

  root.innerHTML = `<main style="font-family: sans-serif; max-width: 720px; margin: 32px auto; padding: 16px;">
    <h1>${app.name}</h1>
    <h2>SCR-002 Home</h2>
    <p>当日チェックイン取消（FR-014）</p>
    <form id="cancel-checkin-form" style="display: grid; gap: 8px; margin: 12px 0;">
      <label>habit_id <input id="cancel-habit-id" required placeholder="habit-red-001" /></label>
      <label>now_utc <input id="cancel-now-utc" required /></label>
      <button id="cancel-checkin-submit" type="submit">当日チェックインを取り消す</button>
    </form>
    <pre id="cancel-checkin-status" style="white-space: pre-wrap;"></pre>
    <div id="cancel-checkin-error" style="color: #b00020; margin-top: 8px;"></div>
    <h3>Habits</h3>
    <button id="home-refresh" type="button">一覧を更新</button>
    <ul id="home-habit-list" style="margin-top: 8px;"></ul>
    <p><a href="/habits/new">習慣を作成</a></p>
  </main>`;

  const form = root.querySelector<HTMLFormElement>("#cancel-checkin-form");
  const habitIdInput = root.querySelector<HTMLInputElement>("#cancel-habit-id");
  const nowUtcInput = root.querySelector<HTMLInputElement>("#cancel-now-utc");
  const submitButton = root.querySelector<HTMLButtonElement>("#cancel-checkin-submit");
  const status = root.querySelector<HTMLPreElement>("#cancel-checkin-status");
  const errorContainer = root.querySelector<HTMLDivElement>("#cancel-checkin-error");
  const refreshButton = root.querySelector<HTMLButtonElement>("#home-refresh");
  const list = root.querySelector<HTMLUListElement>("#home-habit-list");
  if (!form || !habitIdInput || !nowUtcInput || !submitButton || !status || !errorContainer || !refreshButton || !list) {
    return;
  }

  nowUtcInput.value = new Date().toISOString();

  let habits: HabitSummary[] = [];

  const renderHabitList = async () => {
    try {
      const response = await fetch(`/api/habits?userId=${encodeURIComponent(userId)}`);
      const payload = (await response.json()) as { habits?: HabitSummary[] };
      habits = payload.habits ?? [];
      list.innerHTML = habits
        .map((habit) => {
          const statusText = `${escapeHtml(habit.status)} / display_order=${habit.displayOrder}`;
          const checkinText = habit.lastCheckinLogDate ? `last_checkin=${escapeHtml(habit.lastCheckinLogDate)}` : "last_checkin=none";
          return `<li>
            <strong>${escapeHtml(habit.name)}</strong> (#${escapeHtml(habit.habitId)})
            <br/>
            <small>${statusText}, ${checkinText}</small>
            <br/>
            <button type="button" data-habit-id="${escapeHtml(habit.habitId)}">この習慣を取消対象に設定</button>
          </li>`;
        })
        .join("");

      if (habits.length === 0) {
        list.innerHTML = "<li>データなし</li>";
      }
    } catch (error: unknown) {
      list.innerHTML = `<li>一覧取得失敗: ${escapeHtml(error instanceof Error ? error.message : "unknown error")}</li>`;
    }
  };

  const syncSubmitState = () => {
    submitButton.disabled = page.ui.cancelCheckin.isSubmitting;
    submitButton.textContent = page.ui.cancelCheckin.isSubmitting
      ? "取消中..."
      : "当日チェックインを取り消す";
  };

  list.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) {
      return;
    }
    const selectedHabitId = target.dataset.habitId;
    if (!selectedHabitId) {
      return;
    }
    habitIdInput.value = selectedHabitId;
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const habitId = habitIdInput.value.trim();
    const nowUtc = nowUtcInput.value.trim() || new Date().toISOString();
    if (habitId.length === 0) {
      status.textContent = "取消失敗: habit_id を入力してください";
      return;
    }

    syncSubmitState();
    status.textContent = "取消実行中...";
    errorContainer.textContent = "";

    const result = await page.actions.cancelTodayCheckin({ habitId, nowUtc });
    syncSubmitState();
    if (result === null) {
      status.textContent = "取消失敗: 実行中のため再実行できません";
      return;
    }

    if (result.error) {
      status.textContent = `取消失敗: status=${result.error.status} code=${result.error.code}`;
      errorContainer.textContent = result.error.message;
      return;
    }

    status.textContent = `取消成功: log_date=${result.lastCheckinLogDate ?? "null"}`;
    await renderHabitList();
  });

  refreshButton.addEventListener("click", () => {
    void renderHabitList();
  });

  syncSubmitState();
  void renderHabitList();
}

function renderHabitCreatePage(root: HTMLDivElement, app: ReturnType<typeof bootstrapApp>) {
  const page = SCR003HabitCreatePage({
    screenId: "SCR-003",
    handlers: {
      onCancel: () => {
        window.location.assign(ROUTE_MAP["SCR-002"]);
      },
    },
  });
  const userId = resolveHabitFormUserId();
  root.innerHTML = `<main style="font-family: sans-serif; max-width: 720px; margin: 32px auto; padding: 16px;">
    <h1>${app.name}</h1>
    <h2>SCR-003 Habit Create</h2>
    <p>習慣作成フォーム</p>
    <ul>
      <li>name: ${page.ui.validation.name.minLength}〜${page.ui.validation.name.maxLength} 文字</li>
      <li>display_order: ${page.ui.validation.display_order.min}〜${page.ui.validation.display_order.max}</li>
    </ul>
    <form id="habit-create-form" style="display: grid; gap: 8px; margin: 12px 0;">
      <label>name <input id="habit-name" required maxlength="${page.ui.validation.name.maxLength}" /></label>
      <div id="habit-name-error" style="color: #b00020; min-height: 1.4em;"></div>
      <label>
        display_order
        <input
          id="habit-display-order"
          type="number"
          min="${page.ui.validation.display_order.min}"
          max="${page.ui.validation.display_order.max}"
          required
        />
      </label>
      <div id="habit-display-order-error" style="color: #b00020; min-height: 1.4em;"></div>
      <div style="display: flex; gap: 8px;">
        <button id="habit-create-submit" type="submit">保存</button>
        <button id="habit-create-cancel" type="button">キャンセル</button>
      </div>
    </form>
    <pre id="habit-create-status" style="white-space: pre-wrap;"></pre>
    <div id="habit-create-error" style="color: #b00020; min-height: 1.4em;"></div>
    <p><a href="/home">/home に戻る</a></p>
  </main>`;

  const nameInput = root.querySelector<HTMLInputElement>("#habit-name");
  const displayOrderInput = root.querySelector<HTMLInputElement>("#habit-display-order");
  const nameError = root.querySelector<HTMLDivElement>("#habit-name-error");
  const displayOrderError = root.querySelector<HTMLDivElement>("#habit-display-order-error");
  const status = root.querySelector<HTMLPreElement>("#habit-create-status");
  const errorContainer = root.querySelector<HTMLDivElement>("#habit-create-error");
  const form = root.querySelector<HTMLFormElement>("#habit-create-form");
  const submitButton = root.querySelector<HTMLButtonElement>("#habit-create-submit");
  const cancelButton = root.querySelector<HTMLButtonElement>("#habit-create-cancel");
  if (
    !nameInput
    || !displayOrderInput
    || !nameError
    || !displayOrderError
    || !status
    || !errorContainer
    || !form
    || !submitButton
    || !cancelButton
  ) {
    return;
  }
  displayOrderInput.value = String(page.ui.form.display_order);

  const syncSubmitState = () => {
    submitButton.disabled = page.ui.saveButton.disabled;
    submitButton.textContent = page.ui.saveButton.loading ? "保存中..." : page.ui.saveButton.label;
  };

  const syncValidationErrors = () => {
    nameError.textContent = page.ui.errors.name ?? "";
    displayOrderError.textContent = page.ui.errors.display_order ?? "";
  };

  const parseDisplayOrderInput = (): number => {
    const rawDisplayOrder = displayOrderInput.value.trim();
    return rawDisplayOrder.length === 0 ? Number.NaN : Number(rawDisplayOrder);
  };

  nameInput.addEventListener("input", () => {
    page.actions.setName(nameInput.value);
    syncValidationErrors();
  });

  displayOrderInput.addEventListener("input", () => {
    page.actions.setDisplayOrder(parseDisplayOrderInput());
    syncValidationErrors();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (page.ui.isSaving) {
      return;
    }

    const name = nameInput.value.trim();
    const displayOrder = parseDisplayOrderInput();
    page.actions.setName(name);
    page.actions.setDisplayOrder(displayOrder);
    syncValidationErrors();

    if (!page.actions.validate()) {
      status.textContent = "保存失敗: 入力内容を確認してください";
      return;
    }

    page.actions.setSaving(true);
    syncSubmitState();
    status.textContent = "保存中...";
    errorContainer.textContent = "";
    try {
      const result = await requestHabitCreateRuntime(fetch, {
        userId,
        name,
        displayOrder,
      });
      if (result.kind === "error") {
        status.textContent = `保存失敗: status=${result.error.status} code=${result.error.code}`;
        errorContainer.textContent = result.error.visibleTraceId
          ? `${result.error.message} (${result.error.visibleTraceId})`
          : result.error.message;
        return;
      }
      status.textContent = `保存成功: ${result.habitId}`;
      window.location.assign(ROUTE_MAP["SCR-002"]);
    } finally {
      page.actions.setSaving(false);
      syncSubmitState();
    }
  });

  cancelButton.addEventListener("click", () => {
    page.actions.cancel();
  });

  syncValidationErrors();
  syncSubmitState();
}

function mapHabitCreateRuntimeError(
  status: number,
  code: unknown,
): { status: ErrorStatus; code: CommonErrorCode } {
  if (status === 400 && code === "VALIDATION_ERROR") {
    return { status: 400, code: "VALIDATION_ERROR" };
  }
  if (status === 403 && code === "FORBIDDEN") {
    return { status: 403, code: "FORBIDDEN" };
  }
  return { status: 500, code: "INTERNAL_ERROR" };
}

export async function requestHabitCreateRuntime(
  fetchFn: typeof fetch,
  input: HabitCreateRuntimeInput,
): Promise<HabitCreateRuntimeResult> {
  try {
    const response = await fetchFn("/api/habits", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        userId: input.userId,
        name: input.name,
        display_order: input.displayOrder,
      }),
    });

    let payload: If002HabitCreateSuccessPayload | If002HabitCreateErrorPayload | null = null;
    try {
      payload = (await response.json()) as If002HabitCreateSuccessPayload | If002HabitCreateErrorPayload;
    } catch {
      payload = null;
    }

    if (response.ok) {
      const habitId =
        payload !== null
        && "habit" in payload
        && typeof payload.habit?.habit_id === "string"
          ? payload.habit.habit_id
          : "unknown-habit-id";
      return {
        kind: "success",
        habitId,
      };
    }

    const rawTraceId =
      payload !== null && "trace_id" in payload && typeof payload.trace_id === "string" ? payload.trace_id : "INTERNAL_ERROR";
    const rawCode = payload !== null && "code" in payload ? payload.code : undefined;
    const mapped = mapHabitCreateRuntimeError(response.status, rawCode);
    return {
      kind: "error",
      error: resolveErrorPresentation(mapped.status, mapped.code, rawTraceId),
    };
  } catch {
    return {
      kind: "error",
      error: resolveErrorPresentation(500, "INTERNAL_ERROR"),
    };
  }
}

function renderHabitEditPage(root: HTMLDivElement, app: ReturnType<typeof bootstrapApp>, habitId: string) {
  const page = SCR004HabitEditPage({ screenId: "SCR-004", params: { habitId, status: "active" } });
  root.innerHTML = `<main style="font-family: sans-serif; max-width: 720px; margin: 32px auto; padding: 16px;">
    <h1>${app.name}</h1>
    <h2>SCR-004 Habit Edit</h2>
    <p>habitId: ${page.params.habitId}</p>
    <p>status: ${page.ui.status}</p>
    <ul>
      <li>archive button visible: ${page.ui.buttons.archive.visible}</li>
      <li>resume button visible: ${page.ui.buttons.resume.visible}</li>
    </ul>
    <p><a href="/home">/home に戻る</a></p>
  </main>`;
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function toSafeHttpUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch {
    return "#";
  }
  return "#";
}

function getOrCreateLocalUserId(): string {
  const key = "habit-local-user-id";
  try {
    const existing = window.localStorage.getItem(key);
    if (existing) {
      return existing;
    }
    const generated =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `00000000-0000-4000-8000-${Date.now().toString().slice(-12).padStart(12, "0")}`;
    window.localStorage.setItem(key, generated);
    return generated;
  } catch {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return "00000000-0000-4000-8000-000000000001";
  }
}

function resolveHabitFormUserId(): string {
  const authenticatedUserId = readSessionStorage(CALLBACK_USER_ID_STORAGE_KEY);
  if (authenticatedUserId) {
    return authenticatedUserId;
  }
  return getOrCreateLocalUserId();
}

type LoginStartRuntimeSuccess = {
  kind: "success";
  authUrl: string;
  traceId: string;
  auditAction: "LOGIN_START";
};

type LoginStartRuntimeError = {
  kind: "error";
  error: ErrorPresentation;
  traceId: string;
  route: "SCR-001";
};

export type LoginStartRuntimeResult = LoginStartRuntimeSuccess | LoginStartRuntimeError;

function isErrorStatus(value: number): value is ErrorStatus {
  return value === 400 || value === 401 || value === 403 || value === 409 || value === 500;
}

function mapStartApiError(
  status: number,
  code: unknown,
): { status: ErrorStatus; code: CommonErrorCode } {
  if (status === 400 && code === "INVALID_REDIRECT") {
    return { status: 400, code: "VALIDATION_ERROR" };
  }
  if (status === 401 && code === "AUTH_FAILED") {
    return { status: 401, code: "AUTH_FAILED" };
  }
  if (status === 500 && code === "AUTH_PROVIDER_ERROR") {
    return { status: 500, code: "INTERNAL_ERROR" };
  }
  return { status: 500, code: "INTERNAL_ERROR" };
}

export async function requestLoginStartRuntime(
  fetchFn: typeof fetch,
  resolveError: (status: ErrorStatus, code: CommonErrorCode, traceId?: string) => ErrorPresentation,
): Promise<LoginStartRuntimeResult> {
  try {
    const response = await fetchFn("/api/auth/google/start", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer dev-session",
      },
      body: JSON.stringify({ redirectTo: "/auth/callback" }),
    });

    const payload = (await response.json()) as If001StartApiSuccessResponse["body"] | If001StartApiErrorResponse["body"];
    if (response.ok && "auth_url" in payload) {
      return {
        kind: "success",
        authUrl: payload.auth_url,
        traceId: payload.trace_id,
        auditAction: payload.audit_action,
      };
    }

    const rawStatus = isErrorStatus(response.status) ? response.status : 500;
    const traceId = "trace_id" in payload && typeof payload.trace_id === "string" ? payload.trace_id : "INTERNAL_ERROR";
    const mapped = mapStartApiError(rawStatus, "code" in payload ? payload.code : undefined);
    return {
      kind: "error",
      error: resolveError(mapped.status, mapped.code, traceId),
      traceId,
      route: "SCR-001",
    };
  } catch {
    const traceId = "INTERNAL_ERROR";
    return {
      kind: "error",
      error: resolveError(500, "INTERNAL_ERROR", traceId),
      traceId,
      route: "SCR-001",
    };
  }
}

function renderLoginPage(root: HTMLDivElement, app: ReturnType<typeof bootstrapApp>) {
  root.innerHTML = `<main style="font-family: sans-serif; max-width: 720px; margin: 32px auto; padding: 16px;">
    <h1>${app.name}</h1>
    <h2>SCR-001 Login</h2>
    <p>Google認証の開始API（IF-001）を呼び出します。</p>
    <button id="login-start-button" type="button">Googleでログイン</button>
    <button id="login-retry-button" type="button" hidden>再試行</button>
    <p id="login-error-alert" role="alert" aria-live="assertive" style="min-height: 1.4em;"></p>
    <pre id="login-status" style="margin-top: 16px; white-space: pre-wrap;"></pre>
  </main>`;

  const button = root.querySelector<HTMLButtonElement>("#login-start-button");
  const retryButton = root.querySelector<HTMLButtonElement>("#login-retry-button");
  const errorAlert = root.querySelector<HTMLParagraphElement>("#login-error-alert");
  const status = root.querySelector<HTMLPreElement>("#login-status");
  if (!button || !retryButton || !errorAlert || !status) {
    return;
  }

  const handleStartAuth = async () => {
    status.textContent = "認証開始APIを呼び出し中...";
    errorAlert.textContent = "";
    retryButton.hidden = true;
    const result = await requestLoginStartRuntime(fetch, page.actions.resolveError);
    if (result.kind === "success") {
      status.textContent = `成功\ntrace_id: ${result.traceId}\naudit_action: ${result.auditAction}\nGoogleへ遷移します...`;
      window.location.assign(result.authUrl);
      return;
    }
    errorAlert.textContent = result.error.message;
    status.textContent = `失敗\ntrace_id: ${result.traceId}\nroute: ${result.route}`;
    retryButton.hidden = false;
  };
  const page = SCR001LoginPage({
    screenId: "SCR-001",
    handlers: {
      onStartAuth: handleStartAuth,
      onRetryAuth: handleStartAuth,
    },
  });

  const syncUiState = () => {
    button.textContent = page.ui.loginButton.label;
    button.ariaLabel = page.ui.loginButton.ariaLabel;
    button.disabled = page.ui.loginButton.disabled;
    retryButton.disabled = page.ui.loginButton.disabled;
  };

  const runAndSync = (task: Promise<void>) => {
    syncUiState();
    void task.finally(() => {
      syncUiState();
    });
  };

  syncUiState();

  button.addEventListener("click", () => {
    runAndSync(page.actions.startAuth());
  });
  retryButton.addEventListener("click", () => {
    runAndSync(page.actions.retryAuth());
  });
  button.addEventListener("keydown", (event) => {
    if (event.key !== page.ui.loginButton.executeKey) {
      return;
    }
    if (page.ui.loginButton.disabled) {
      return;
    }
    event.preventDefault();
    runAndSync(page.actions.startAuth());
  });
}

type If001CallbackApiResponse = {
  route: If001CallbackRoute;
  auditAction?: "POLICY_CONSENT_REJECT" | "LOGIN_FAILED";
  detail?: string;
};

type PolicyConsentInsertResponse = {
  insertedCount: number;
};
type PolicyConsentInsertErrorResponse = {
  code?: string;
  message?: string;
  detail?: string;
};
type PolicyType = "terms" | "privacy";
type PolicyCurrentDocument = {
  version: string;
  url: string;
};
export type PolicyCurrentResponse = Record<PolicyType, PolicyCurrentDocument>;
type PolicyConsentSubmissionPayload = {
  userId: string;
  consents: Array<{
    policy_type: PolicyType;
    policy_version: string;
  }>;
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

function isPolicyCurrentDocument(value: unknown): value is PolicyCurrentDocument {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const document = value as { version?: unknown; url?: unknown };
  return typeof document.version === "string" && document.version.length > 0
    && typeof document.url === "string" && document.url.length > 0;
}

export async function requestCurrentPoliciesRuntime(fetchFn: typeof fetch): Promise<PolicyCurrentResponse> {
  const response = await fetchFn("/api/policies/current", {
    method: "GET",
  });
  if (!response.ok) {
    throw new Error(`policy current fetch failed (${response.status})`);
  }
  const payload = (await response.json()) as { terms?: unknown; privacy?: unknown };
  if (!isPolicyCurrentDocument(payload.terms) || !isPolicyCurrentDocument(payload.privacy)) {
    throw new Error("policy current payload is invalid");
  }
  return {
    terms: payload.terms,
    privacy: payload.privacy,
  };
}

export function buildPolicyConsentSubmissionPayload(
  userId: string,
  policies: PolicyCurrentResponse,
): PolicyConsentSubmissionPayload {
  return {
    userId,
    consents: [
      { policy_type: "terms", policy_version: policies.terms.version },
      { policy_type: "privacy", policy_version: policies.privacy.version },
    ],
  };
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
  writeSessionStorage(CALLBACK_ACCESS_TOKEN_STORAGE_KEY, accessToken);
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

function clearAuthSessionStorage(): void {
  try {
    window.sessionStorage.removeItem(CALLBACK_ACCESS_TOKEN_STORAGE_KEY);
    window.sessionStorage.removeItem(CALLBACK_USER_ID_STORAGE_KEY);
    window.sessionStorage.removeItem(POLICY_CONSENT_TRACE_STORAGE_KEY);
  } catch {
    return;
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
  let policies: PolicyCurrentResponse;
  try {
    policies = await requestCurrentPoliciesRuntime(fetch);
  } catch (error: unknown) {
    root.innerHTML = `<main style="font-family: sans-serif; max-width: 720px; margin: 32px auto; padding: 16px;">
      <h1>${app.name}</h1>
      <h2>SCR-008 Policy Consent</h2>
      <p>ポリシー情報の取得に失敗しました。</p>
      <pre id="consent-status" style="margin-top: 16px; white-space: pre-wrap;">${
        escapeHtml(error instanceof Error ? error.message : "unknown error")
      }</pre>
      <p><a href="${ROUTE_MAP["SCR-001"]}">/login に戻る</a></p>
    </main>`;
    return;
  }

  root.innerHTML = `<main style="font-family: sans-serif; max-width: 720px; margin: 32px auto; padding: 16px;">
    <h1>${app.name}</h1>
    <h2>SCR-008 Policy Consent</h2>
    <p>利用規約とプライバシーポリシーの両方への同意が必要です。</p>
    <p>利用規約: ${escapeHtml(policies.terms.version)} (<a href="${escapeHtml(
      toSafeHttpUrl(policies.terms.url),
    )}" target="_blank" rel="noreferrer noopener">${escapeHtml(policies.terms.url)}</a>)</p>
    <p>プライバシーポリシー: ${escapeHtml(policies.privacy.version)} (<a href="${escapeHtml(
      toSafeHttpUrl(policies.privacy.url),
    )}" target="_blank" rel="noreferrer noopener">${escapeHtml(policies.privacy.url)}</a>)</p>
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
        void submitPolicyConsentDecision(status, acceptButton, rejectButton, "agreed", trace, policies);
      },
      onReject: (trace) => {
        void submitPolicyConsentDecision(status, acceptButton, rejectButton, "rejected", trace, policies);
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
  policies: PolicyCurrentResponse,
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
    if (consentState === "agreed") {
      const persistResponse = await fetch("/api/policies/consents", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(buildPolicyConsentSubmissionPayload(userId, policies)),
      });
      if (!persistResponse.ok) {
        let detail = "";
        try {
          const errorBody = (await persistResponse.json()) as PolicyConsentInsertErrorResponse;
          detail = errorBody.detail || errorBody.message || "";
        } catch {
          // ignore parse errors
        }
        status.textContent = `送信失敗: 同意履歴の保存に失敗しました (${persistResponse.status})${detail ? `\n${detail}` : ""}`;
        acceptButton.disabled = false;
        rejectButton.disabled = false;
        return;
      }
      const persistData = (await persistResponse.json()) as PolicyConsentInsertResponse;
      status.textContent = `${trace.action} を監査トレースに保持しました。\ntrace_id: ${traceId}\n同意履歴を保存しました (inserted=${persistData.insertedCount})。判定を更新中...`;
    }

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
    if (consentState === "rejected") {
      clearAuthSessionStorage();
    }
    status.textContent = `送信成功: ${trace.action}\n${nextPath} に遷移します。`;
    setTimeout(() => window.location.assign(nextPath), 250);
  } catch (error: unknown) {
    status.textContent = `送信失敗: ${error instanceof Error ? error.message : "unknown error"}`;
    acceptButton.disabled = consentState !== "agreed";
    rejectButton.disabled = false;
  }
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  renderAppShell();
}
