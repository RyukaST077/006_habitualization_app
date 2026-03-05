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
import {
  SCR005HistoryPage,
  type HistoryCalendarLoadInput,
  type HistoryCalendarLoadResolution,
  type HistoryCalendarUiCell,
} from "./screens/SCR-005HistoryPage";
import {
  SCR002HomePage,
  type CheckinResolution,
  type HomeHabitSummary,
  type HomeListResolution,
} from "./screens/SCR-002HomePage";
import type { If001StartApiErrorResponse, If001StartApiSuccessResponse } from "./server/application/if-001/contracts";
import { resolveErrorPresentation } from "./ui/error-presentation";
import type { CommonErrorCode, ErrorPresentation, ErrorStatus } from "./ui/error-presentation";

export function bootstrapApp() {
  return createAppShell();
}

const CALLBACK_USER_ID_STORAGE_KEY = "if001-callback-user-id";
const CALLBACK_ACCESS_TOKEN_STORAGE_KEY = "if001-callback-access-token";
const POLICY_CONSENT_TRACE_STORAGE_KEY = "if001-policy-consent-trace";
const LOCAL_USER_ID_STORAGE_KEY = "habit-local-user-id";
const LOCAL_USER_ID_FALLBACK = "00000000-0000-4000-8000-000000000001";
const HOME_CHECKIN_OVERRIDE_STORAGE_KEY = "habit-home-checkin-overrides-v1";

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
  if (window.location.pathname === ROUTE_MAP["SCR-005"]) {
    renderHistoryPage(root, app);
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

type If002HomeHabitItem = {
  habit_id?: string | number;
  name?: string;
  status?: HabitLifecycleStatus;
  streak_days?: number;
  last_checkin_log_date?: string | null;
  streak?: number;
  log_date?: string | null;
  is_checked_today?: boolean;
};

type If002HomeHabitsSuccessPayload = {
  habits?: If002HomeHabitItem[];
  items?: If002HomeHabitItem[];
};

type If002HomeHabitsErrorPayload = {
  code?: string;
  trace_id?: string;
};

type If002RegisterSuccessPayload = {
  checkin?: {
    log_date?: string | null;
    idempotent?: boolean;
  };
};

type If002RegisterErrorPayload = {
  code?: string;
  trace_id?: string;
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

type If002HistoryCalendarCellPayload = {
  date?: string;
  status?: "checked" | "missed" | "grace";
};

type If002HistoryCalendarSuccessPayload = {
  days?: If002HistoryCalendarCellPayload[];
  history?: {
    days?: If002HistoryCalendarCellPayload[];
  };
};

type If002HistoryCalendarErrorPayload = {
  code?: string;
  trace_id?: string;
};

function normalizeCalendarDate(value: string): string | null {
  const ymdMatch = /^(\d{4}-\d{2}-\d{2})/.exec(value);
  if (ymdMatch) {
    return ymdMatch[1];
  }
  return null;
}

function normalizeCalendarStatus(value: unknown): "checked" | "missed" | "grace" | null {
  if (value === "checked" || value === "missed" || value === "grace") {
    return value;
  }
  if (value === "unchecked") {
    return "missed";
  }
  return null;
}

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

type HabitLifecycleStatus = "active" | "archived";

type If002HabitDetailSuccessPayload = {
  habit?: {
    habit_id?: string;
    name?: string;
    status?: HabitLifecycleStatus;
    display_order?: number;
  };
};

type If002HabitLifecycleSuccessPayload = {
  habit?: {
    habit_id?: string;
    name?: string;
    status?: HabitLifecycleStatus;
    display_order?: number;
  };
};

type If002HabitRuntimeErrorPayload = {
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

export type HabitEditDetailRuntimeInput = {
  habitId: string;
};

export type HabitEditUpdateRuntimeInput = {
  userId: string;
  habitId: string;
  name: string;
  displayOrder: number;
};

export type HabitEditStatusTransitionAction = "archive" | "resume";

export type HabitEditStatusTransitionRuntimeInput = {
  userId: string;
  habitId: string;
  action: HabitEditStatusTransitionAction;
};

type HabitEditRuntimeSuccess = {
  habitId: string;
  name: string;
  status: HabitLifecycleStatus;
  displayOrder: number;
};

type HabitEditRuntimeResult =
  | {
    kind: "success";
    habit: HabitEditRuntimeSuccess;
  }
  | {
    kind: "error";
    error: ErrorPresentation;
  };

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
  fetchFn: typeof fetch,
  userId: string,
  habitId: string,
  nowUtc: string,
): Promise<CheckinResolution> {
  try {
    const response = await fetchFn(`/api/checkins/${encodeURIComponent(habitId)}`, {
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

function mapHomeHabitSummary(payload: If002HomeHabitItem, index: number): HomeHabitSummary {
  const rawHabitId = payload?.habit_id;
  const habitId = typeof rawHabitId === "string" && rawHabitId.length > 0
    ? rawHabitId
    : typeof rawHabitId === "number"
      ? String(rawHabitId)
      : `habit-${index + 1}`;
  const streakDays = typeof payload?.streak_days === "number"
    ? payload.streak_days
    : "streak" in payload && typeof payload.streak === "number"
      ? payload.streak
      : 0;
  const lastCheckinLogDate = typeof payload?.last_checkin_log_date === "string" || payload?.last_checkin_log_date === null
    ? payload.last_checkin_log_date
    : "log_date" in payload && (typeof payload.log_date === "string" || payload.log_date === null)
      ? payload.log_date
      : null;

  return {
    habitId,
    name: typeof payload?.name === "string" ? payload.name : "",
    status: payload?.status === "archived" ? "archived" : "active",
    streakDays,
    lastCheckinLogDate,
  };
}

function buildTodayLogDate(nowUtcIso: string): string {
  return nowUtcIso.slice(0, 10);
}

type HomeCheckinOverrides = Record<string, Record<string, string>>;

function readHomeCheckinOverrides(): HomeCheckinOverrides {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(HOME_CHECKIN_OVERRIDE_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return {};
    }
    return parsed as HomeCheckinOverrides;
  } catch {
    return {};
  }
}

function writeHomeCheckinOverrides(overrides: HomeCheckinOverrides): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(HOME_CHECKIN_OVERRIDE_STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    return;
  }
}

function setHomeCheckinOverride(userId: string, habitId: string, logDate: string): void {
  const overrides = readHomeCheckinOverrides();
  const userOverrides = overrides[userId] ?? {};
  userOverrides[habitId] = logDate;
  overrides[userId] = userOverrides;
  writeHomeCheckinOverrides(overrides);
}

function clearHomeCheckinOverride(userId: string, habitId: string): void {
  const overrides = readHomeCheckinOverrides();
  const userOverrides = overrides[userId];
  if (!userOverrides) {
    return;
  }
  delete userOverrides[habitId];
  if (Object.keys(userOverrides).length === 0) {
    delete overrides[userId];
  } else {
    overrides[userId] = userOverrides;
  }
  writeHomeCheckinOverrides(overrides);
}

function applyHomeCheckinOverrides(userId: string, habits: HomeHabitSummary[]): HomeHabitSummary[] {
  const overrides = readHomeCheckinOverrides()[userId] ?? {};
  if (Object.keys(overrides).length === 0) {
    return habits;
  }

  return habits.map((habit) => {
    const overrideDate = overrides[habit.habitId];
    if (!overrideDate) {
      return habit;
    }
    if (habit.lastCheckinLogDate) {
      clearHomeCheckinOverride(userId, habit.habitId);
      return habit;
    }
    return {
      ...habit,
      lastCheckinLogDate: overrideDate,
    };
  });
}

function applyHistoryCheckinOverrides(
  userId: string,
  input: HistoryCalendarLoadInput,
  days: Array<{ date: string; status: "checked" | "missed" | "grace" }>,
): Array<{ date: string; status: "checked" | "missed" | "grace" }> {
  const userOverrides = readHomeCheckinOverrides()[userId] ?? {};
  const overrideDates = Object.entries(userOverrides)
    .filter(([habitId]) => input.habitId === null || input.habitId === habitId)
    .map(([, logDate]) => logDate)
    .filter((logDate) => logDate.startsWith(`${input.yearMonth}-`));

  if (overrideDates.length === 0) {
    return days;
  }

  const overrideSet = new Set(overrideDates);
  return days.map((day) => (overrideSet.has(day.date) ? { ...day, status: "checked" as const } : day));
}

function resolveScr004Path(habitId: string): string {
  return ROUTE_MAP["SCR-004"].replace(":habitId", encodeURIComponent(habitId));
}

export async function requestHomeHabitsRuntime(
  fetchFn: typeof fetch,
  input: { userId: string },
): Promise<HomeListResolution> {
  try {
    const response = await fetchFn(`/api/home/habits?userId=${encodeURIComponent(input.userId)}`, {
      method: "GET",
      cache: "no-store",
    });
    const payload = await parseJsonResponse<If002HomeHabitsSuccessPayload | If002HomeHabitsErrorPayload>(response);
    if (response.ok) {
      const rawHabits = payload !== null && "habits" in payload && Array.isArray(payload.habits)
        ? payload.habits
        : payload !== null && "items" in payload && Array.isArray(payload.items)
          ? payload.items
          : [];
      const habits = rawHabits.length > 0
        ? rawHabits.map((habit, index) => mapHomeHabitSummary(habit, index))
        : [];
      return {
        kind: "success",
        habits: applyHomeCheckinOverrides(input.userId, habits),
      };
    }
    const rawCode = payload !== null && "code" in payload ? payload.code : undefined;
    const rawTraceId = payload !== null && "trace_id" in payload && typeof payload.trace_id === "string"
      ? payload.trace_id
      : undefined;
    return {
      kind: "error",
      status: asErrorStatus(response.status),
      code: asErrorCode(rawCode),
      traceId: rawTraceId,
    };
  } catch {
    return {
      kind: "error",
      status: 500,
      code: "INTERNAL_ERROR",
    };
  }
}

export async function requestRegisterCheckinRuntime(
  fetchFn: typeof fetch,
  input: { userId: string; habitId: string; logDate: string; nowUtc: string },
): Promise<CheckinResolution> {
  try {
    const response = await fetchFn("/api/checkins", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        userId: input.userId,
        habit_id: input.habitId,
        log_date: input.logDate,
        now_utc: input.nowUtc,
      }),
    });
    const payload = await parseJsonResponse<If002RegisterSuccessPayload | If002RegisterErrorPayload>(response);
    if (response.ok) {
      const successPayload = payload as If002RegisterSuccessPayload | null;
      return {
        kind: "success",
        logDate: typeof successPayload?.checkin?.log_date === "string" ? successPayload.checkin.log_date : input.logDate,
        idempotent: successPayload?.checkin?.idempotent === true,
      };
    }
    const errorPayload = payload as If002RegisterErrorPayload | null;
    return {
      kind: "error",
      status: asErrorStatus(response.status),
      code: asErrorCode(errorPayload?.code),
      traceId: typeof errorPayload?.trace_id === "string" ? errorPayload.trace_id : undefined,
    };
  } catch {
    return {
      kind: "error",
      status: 500,
      code: "INTERNAL_ERROR",
    };
  }
}

export async function requestCancelCheckinRuntime(
  fetchFn: typeof fetch,
  input: { userId: string; habitId: string; nowUtc: string },
): Promise<CheckinResolution> {
  return requestCancelCheckin(fetchFn, input.userId, input.habitId, input.nowUtc);
}

function extractHistoryCalendarDays(
  payload: If002HistoryCalendarSuccessPayload | If002HistoryCalendarErrorPayload | null,
): If002HistoryCalendarCellPayload[] {
  if (payload === null) {
    return [];
  }
  if ("days" in payload && Array.isArray(payload.days)) {
    return payload.days;
  }
  if ("history" in payload && payload.history && Array.isArray(payload.history.days)) {
    return payload.history.days;
  }
  return [];
}

export async function requestHistoryCalendarRuntime(
  fetchFn: typeof fetch,
  input: HistoryCalendarLoadInput,
  userId?: string,
): Promise<HistoryCalendarLoadResolution> {
  try {
    const query = new URLSearchParams();
    query.set("year_month", input.yearMonth);
    query.set("include_archived", String(input.includeArchived));
    if (typeof userId === "string" && userId.length > 0) {
      query.set("userId", userId);
    }
    if (input.habitId !== null) {
      query.set("habit_id", input.habitId);
    }

    const response = await fetchFn(`/api/history/calendar?${query.toString()}`, {
      method: "GET",
      cache: "no-store",
    });
    const payload = await parseJsonResponse<If002HistoryCalendarSuccessPayload | If002HistoryCalendarErrorPayload>(response);
    if (response.ok) {
      let days = extractHistoryCalendarDays(payload)
        .map((day) => {
          const date = typeof day.date === "string" ? normalizeCalendarDate(day.date) : null;
          const status = normalizeCalendarStatus(day.status);
          if (!date || !status) {
            return null;
          }
          return { date, status };
        })
        .filter((day): day is { date: string; status: "checked" | "missed" | "grace" } => day !== null);
      if (typeof userId === "string" && userId.length > 0) {
        days = applyHistoryCheckinOverrides(userId, input, days);
      }
      return {
        kind: "success",
        days,
      };
    }

    const errorCode = payload !== null && "code" in payload ? payload.code : undefined;
    const traceId = payload !== null && "trace_id" in payload && typeof payload.trace_id === "string"
      ? payload.trace_id
      : undefined;
    return {
      kind: "error",
      status: asErrorStatus(response.status),
      code: asErrorCode(errorCode),
      traceId,
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
      onLoadHabits: async () => requestHomeHabitsRuntime(fetch, { userId }),
      onRegisterCheckin: async ({ habitId, logDate }) => {
        return requestRegisterCheckinRuntime(fetch, {
          userId,
          habitId,
          logDate,
          nowUtc: new Date().toISOString(),
        });
      },
      onCancelCheckin: async ({ habitId, nowUtc }) => requestCancelCheckinRuntime(fetch, { userId, habitId, nowUtc }),
    },
  });

  root.innerHTML = `<main style="font-family: sans-serif; max-width: 720px; margin: 32px auto; padding: 16px;">
    <h1>${app.name}</h1>
    <h2>SCR-002 Home</h2>
    <p id="home-status">読み込み中...</p>
    <section id="home-error" hidden style="border: 1px solid #d79a9a; border-radius: 8px; padding: 12px; margin: 8px 0; color: #8f1d1d;">
      <p id="home-error-message" style="margin: 0;"></p>
      <p id="home-error-trace" style="margin: 8px 0 0 0;"></p>
      <div style="display: flex; gap: 8px; margin-top: 8px;">
        <button id="home-error-retry" type="button">再試行</button>
        <a id="home-error-recovery" href="#" hidden></a>
      </div>
    </section>
    <ul id="home-habit-list" style="display: grid; gap: 12px; list-style: none; padding: 0; margin: 0;"></ul>
    <section id="home-empty-state" hidden style="padding: 12px; border: 1px dashed #999; border-radius: 8px; margin-top: 12px;">
      <p style="margin-top: 0;">習慣がまだありません。まずは1つ作成しましょう。</p>
      <p style="margin-bottom: 0;"><a href="/habits/new">習慣を作成</a></p>
    </section>
  </main>`;

  const status = root.querySelector<HTMLParagraphElement>("#home-status");
  const errorPanel = root.querySelector<HTMLElement>("#home-error");
  const errorMessage = root.querySelector<HTMLParagraphElement>("#home-error-message");
  const errorTrace = root.querySelector<HTMLParagraphElement>("#home-error-trace");
  const retryButton = root.querySelector<HTMLButtonElement>("#home-error-retry");
  const recoveryLink = root.querySelector<HTMLAnchorElement>("#home-error-recovery");
  const list = root.querySelector<HTMLUListElement>("#home-habit-list");
  const emptyState = root.querySelector<HTMLElement>("#home-empty-state");
  if (!status || !errorPanel || !errorMessage || !errorTrace || !retryButton || !recoveryLink || !list || !emptyState) {
    return;
  }

  const setRuntimeError = (error: ErrorPresentation | null, habitId?: string) => {
    if (!error) {
      errorPanel.hidden = true;
      errorMessage.textContent = "";
      errorTrace.textContent = "";
      retryButton.hidden = true;
      recoveryLink.hidden = true;
      recoveryLink.textContent = "";
      recoveryLink.removeAttribute("href");
      return;
    }
    errorPanel.hidden = false;
    errorMessage.textContent = error.message;
    errorTrace.textContent = error.visibleTraceId ?? "";
    retryButton.hidden = error.status !== 500;
    if (error.recoveryAction && habitId) {
      recoveryLink.hidden = false;
      recoveryLink.textContent = error.recoveryAction.label;
      recoveryLink.href = resolveScr004Path(habitId);
    } else {
      recoveryLink.hidden = true;
      recoveryLink.textContent = "";
      recoveryLink.removeAttribute("href");
    }
  };

  const renderHabits = () => {
    if (page.ui.habits.status === "loading") {
      status.textContent = "読み込み中...";
      list.innerHTML = "<li>読み込み中...</li>";
      emptyState.hidden = true;
      return;
    }
    if (page.ui.habits.status === "error") {
      status.textContent = "ホーム情報の取得に失敗しました";
      list.innerHTML = "";
      emptyState.hidden = true;
      setRuntimeError(page.ui.habits.error);
      return;
    }

    const items = [...page.ui.habits.items];
    status.textContent = "";
    setRuntimeError(null);

    if (items.length === 0) {
      list.innerHTML = "";
      emptyState.hidden = false;
      return;
    }

    emptyState.hidden = true;
    list.innerHTML = items
      .map((habit) => {
        const checkinDisabled = habit.status === "archived"
          || page.ui.checkin.isSubmitting(habit.habitId)
          || Boolean(habit.lastCheckinLogDate);
        const cancelDisabled = page.ui.cancelCheckin.isSubmitting || !habit.lastCheckinLogDate;
        const checkinLabel = page.ui.checkin.isSubmitting(habit.habitId) ? "チェックイン中..." : "チェックイン";
        const cancelLabel = page.ui.cancelCheckin.isSubmitting ? "取消中..." : "取消";
        return `<li style="border: 1px solid #ddd; border-radius: 8px; padding: 12px;">
          <strong>${escapeHtml(habit.name)}</strong>
          <p style="margin: 6px 0 0 0;">status: ${escapeHtml(habit.status)}</p>
          <p style="margin: 2px 0;">今日の達成: ${habit.lastCheckinLogDate ? "達成済み" : "未達成"}</p>
          <p style="margin: 2px 0 10px 0;">ストリーク: ${habit.streakDays}日</p>
          <div style="display: flex; gap: 8px;">
            <button
              type="button"
              data-home-action="checkin"
              data-habit-id="${escapeHtml(habit.habitId)}"
              ${checkinDisabled ? "disabled" : ""}
            >${checkinLabel}</button>
            <button
              type="button"
              data-home-action="cancel"
              data-habit-id="${escapeHtml(habit.habitId)}"
              ${cancelDisabled ? "disabled" : ""}
            >${cancelLabel}</button>
          </div>
        </li>`;
      })
      .join("");
  };

  const loadAndRenderHabits = async () => {
    const loadPromise = page.actions.loadHabits();
    renderHabits();
    await loadPromise;
    renderHabits();
  };

  list.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) {
      return;
    }
    const habitId = target.dataset.habitId;
    const action = target.dataset.homeAction;
    if (!habitId || !action) {
      return;
    }

    if (action === "checkin") {
      if (page.ui.checkin.isSubmitting(habitId)) {
        return;
      }
      const nowUtc = new Date().toISOString();
      const registerPromise = page.actions.registerTodayCheckin({
        habitId,
        logDate: buildTodayLogDate(nowUtc),
      });
      renderHabits();
      void registerPromise.then((result) => {
        renderHabits();
        if (result.error) {
          setRuntimeError(result.error, habitId);
        } else {
          if (result.lastCheckinLogDate) {
            setHomeCheckinOverride(userId, habitId, result.lastCheckinLogDate);
          }
          setRuntimeError(null);
        }
      });
      return;
    }

    if (action === "cancel") {
      if (page.ui.cancelCheckin.isSubmitting) {
        return;
      }
      const cancelPromise = page.actions.cancelTodayCheckin({
        habitId,
        nowUtc: new Date().toISOString(),
      });
      renderHabits();
      void cancelPromise.then((result) => {
        renderHabits();
        if (result === null) {
          return;
        }
        if (result.error) {
          setRuntimeError(result.error, habitId);
          return;
        }
        clearHomeCheckinOverride(userId, habitId);
        setRuntimeError(null);
      });
    }
  });

  retryButton.addEventListener("click", () => {
    void loadAndRenderHabits();
  });

  recoveryLink.addEventListener("click", (event) => {
    event.preventDefault();
    if (recoveryLink.href.length > 0) {
      window.location.assign(recoveryLink.href);
    }
  });

  void loadAndRenderHabits();
}

export function renderHistoryPage(root: HTMLDivElement, app: ReturnType<typeof bootstrapApp>) {
  const userId = resolveHabitFormUserId();
  const page = SCR005HistoryPage({
    screenId: "SCR-005",
    handlers: {
      onBackHome: () => {
        window.location.assign(ROUTE_MAP["SCR-002"]);
      },
      onLoadCalendar: (input) => requestHistoryCalendarRuntime(fetch, input, userId),
    },
  });

  root.innerHTML = `<main style="font-family: sans-serif; max-width: 720px; margin: 32px auto; padding: 16px;">
    <h1>${app.name}</h1>
    <h2>SCR-005 History</h2>
    <section style="display: grid; gap: 10px; margin: 12px 0;">
      <label>表示年月 <input id="history-year-month" type="month" /></label>
      <label>習慣フィルター（habit_id） <input id="history-habit-id" placeholder="未指定で全習慣" /></label>
      <label><input id="history-include-archived" type="checkbox" /> archived を表示</label>
      <div style="display: flex; gap: 8px;">
        <button id="history-back-home" type="button">ホームへ戻る</button>
      </div>
    </section>
    <p id="history-load-status">読み込み中...</p>
    <section id="history-error" hidden style="border: 1px solid #d79a9a; border-radius: 8px; padding: 12px; margin: 8px 0; color: #8f1d1d;">
      <p id="history-error-message" style="margin: 0;"></p>
      <button id="history-error-retry" type="button">再読込</button>
    </section>
    <section id="history-calendar-grid" style="display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px;"></section>
  </main>`;

  const yearMonthInput = root.querySelector<HTMLInputElement>("#history-year-month");
  const habitIdInput = root.querySelector<HTMLInputElement>("#history-habit-id");
  const includeArchivedInput = root.querySelector<HTMLInputElement>("#history-include-archived");
  const backHomeButton = root.querySelector<HTMLButtonElement>("#history-back-home");
  const loadStatus = root.querySelector<HTMLParagraphElement>("#history-load-status");
  const errorPanel = root.querySelector<HTMLElement>("#history-error");
  const errorMessage = root.querySelector<HTMLParagraphElement>("#history-error-message");
  const retryButton = root.querySelector<HTMLButtonElement>("#history-error-retry");
  const grid = root.querySelector<HTMLElement>("#history-calendar-grid");

  if (
    !yearMonthInput
    || !habitIdInput
    || !includeArchivedInput
    || !backHomeButton
    || !loadStatus
    || !errorPanel
    || !errorMessage
    || !retryButton
    || !grid
  ) {
    return;
  }

  const renderCalendarCell = (cell: HistoryCalendarUiCell): string => {
    const label = cell.status === "checked"
      ? "達成"
      : cell.status === "unchecked"
        ? "未達成"
        : cell.status === "grace"
          ? "猶予"
          : "未記録";
    return `<div style="border: 1px solid #ddd; border-radius: 6px; padding: 6px;">
      <p style="margin: 0; font-size: 12px;">${escapeHtml(cell.date)}</p>
      <p style="margin: 4px 0 0 0; font-weight: 600;">${label}</p>
    </div>`;
  };

  const render = () => {
    yearMonthInput.value = page.ui.filters.yearMonth;
    habitIdInput.value = page.ui.filters.habitId ?? "";
    includeArchivedInput.checked = page.ui.filters.includeArchived;
    yearMonthInput.disabled = page.ui.loading.isFetching;
    habitIdInput.disabled = page.ui.loading.isFetching;
    includeArchivedInput.disabled = page.ui.loading.isFetching;
    retryButton.disabled = page.ui.loading.isFetching;
    loadStatus.textContent = page.ui.loading.isFetching ? "読み込み中..." : "";

    const retryAction = page.ui.error.retryAction;
    errorPanel.hidden = !page.ui.error.isVisible || retryAction === null;
    errorMessage.textContent = retryAction ? "履歴の取得に失敗しました。" : "";

    grid.innerHTML = page.ui.calendar.days.map((cell) => renderCalendarCell(cell)).join("");
  };

  const runWithRender = async (runner: () => Promise<unknown>) => {
    const promise = runner();
    render();
    await promise;
    render();
  };

  yearMonthInput.addEventListener("change", () => {
    void runWithRender(() => page.actions.setYearMonth(yearMonthInput.value));
  });
  habitIdInput.addEventListener("change", () => {
    const habitId = habitIdInput.value.trim();
    void runWithRender(() => page.actions.setHabitFilter(habitId.length > 0 ? habitId : null));
  });
  includeArchivedInput.addEventListener("change", () => {
    void runWithRender(() => page.actions.setIncludeArchived(includeArchivedInput.checked));
  });
  retryButton.addEventListener("click", () => {
    void runWithRender(() => page.actions.retryLoad());
  });
  backHomeButton.addEventListener("click", () => {
    page.actions.backHome();
  });

  void runWithRender(() => page.actions.loadCalendar());
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

function mapHabitEditRuntimeError(
  status: number,
  code: unknown,
): { status: ErrorStatus; code: CommonErrorCode } {
  if (status === 400 && code === "VALIDATION_ERROR") {
    return { status: 400, code: "VALIDATION_ERROR" };
  }
  if (status === 403 && code === "FORBIDDEN") {
    return { status: 403, code: "FORBIDDEN" };
  }
  if (status === 409 && code === "DOMAIN_CONFLICT") {
    return { status: 409, code: "DOMAIN_CONFLICT" };
  }
  return { status: 500, code: "INTERNAL_ERROR" };
}

function mapHabitRuntimeSuccess(
  payload: If002HabitDetailSuccessPayload | If002HabitLifecycleSuccessPayload | null,
  fallbackHabitId: string,
): HabitEditRuntimeSuccess {
  const habit = payload?.habit;
  const status = habit?.status === "archived" ? "archived" : "active";
  return {
    habitId: typeof habit?.habit_id === "string" ? habit.habit_id : fallbackHabitId,
    name: typeof habit?.name === "string" ? habit.name : "",
    status,
    displayOrder: typeof habit?.display_order === "number" ? habit.display_order : 1,
  };
}

async function parseJsonResponse<TPayload>(response: Response): Promise<TPayload | null> {
  try {
    return (await response.json()) as TPayload;
  } catch {
    return null;
  }
}

export async function requestHabitDetailRuntime(
  fetchFn: typeof fetch,
  input: HabitEditDetailRuntimeInput,
): Promise<HabitEditRuntimeResult> {
  try {
    const response = await fetchFn(`/api/habits/${encodeURIComponent(input.habitId)}`, {
      method: "GET",
    });
    const payload = await parseJsonResponse<If002HabitDetailSuccessPayload | If002HabitRuntimeErrorPayload>(response);
    if (response.ok) {
      return {
        kind: "success",
        habit: mapHabitRuntimeSuccess(payload as If002HabitDetailSuccessPayload | null, input.habitId),
      };
    }
    const rawCode = payload !== null && "code" in payload ? payload.code : undefined;
    const rawTraceId = payload !== null && "trace_id" in payload && typeof payload.trace_id === "string"
      ? payload.trace_id
      : "INTERNAL_ERROR";
    const mapped = mapHabitEditRuntimeError(response.status, rawCode);
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

export async function requestHabitEditUpdateRuntime(
  fetchFn: typeof fetch,
  input: HabitEditUpdateRuntimeInput,
): Promise<HabitEditRuntimeResult> {
  try {
    const response = await fetchFn(`/api/habits/${encodeURIComponent(input.habitId)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        userId: input.userId,
        habit_id: input.habitId,
        name: input.name,
        display_order: input.displayOrder,
      }),
    });
    const payload = await parseJsonResponse<If002HabitLifecycleSuccessPayload | If002HabitRuntimeErrorPayload>(response);
    if (response.ok) {
      return {
        kind: "success",
        habit: mapHabitRuntimeSuccess(payload as If002HabitLifecycleSuccessPayload | null, input.habitId),
      };
    }
    const rawCode = payload !== null && "code" in payload ? payload.code : undefined;
    const rawTraceId = payload !== null && "trace_id" in payload && typeof payload.trace_id === "string"
      ? payload.trace_id
      : "INTERNAL_ERROR";
    const mapped = mapHabitEditRuntimeError(response.status, rawCode);
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

export async function requestHabitStatusTransitionRuntime(
  fetchFn: typeof fetch,
  input: HabitEditStatusTransitionRuntimeInput,
): Promise<HabitEditRuntimeResult> {
  const endpoint = input.action === "archive" ? "archive" : "resume";
  try {
    const response = await fetchFn(`/api/habits/${encodeURIComponent(input.habitId)}/${endpoint}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        userId: input.userId,
        habit_id: input.habitId,
      }),
    });
    const payload = await parseJsonResponse<If002HabitLifecycleSuccessPayload | If002HabitRuntimeErrorPayload>(response);
    if (response.ok) {
      return {
        kind: "success",
        habit: mapHabitRuntimeSuccess(payload as If002HabitLifecycleSuccessPayload | null, input.habitId),
      };
    }
    const rawCode = payload !== null && "code" in payload ? payload.code : undefined;
    const rawTraceId = payload !== null && "trace_id" in payload && typeof payload.trace_id === "string"
      ? payload.trace_id
      : "INTERNAL_ERROR";
    const mapped = mapHabitEditRuntimeError(response.status, rawCode);
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
  const userId = resolveHabitFormUserId();
  const state: {
    name: string;
    displayOrder: number;
    status: HabitLifecycleStatus;
    confirmationAction: HabitEditStatusTransitionAction | null;
    isSubmitting: boolean;
    errorMessage: string;
  } = {
    name: "",
    displayOrder: 1,
    status: "active",
    confirmationAction: null,
    isSubmitting: false,
    errorMessage: "",
  };

  const navigateHome = () => {
    window.location.assign(ROUTE_MAP["SCR-002"]);
  };

  const syncFromRuntime = (runtimeHabit: HabitEditRuntimeSuccess) => {
    state.name = runtimeHabit.name;
    state.displayOrder = runtimeHabit.displayOrder;
    state.status = runtimeHabit.status;
  };

  const render = () => {
    const page = SCR004HabitEditPage({
      screenId: "SCR-004",
      params: {
        habitId,
        name: state.name,
        displayOrder: state.displayOrder,
        status: state.status,
      },
      handlers: {
        onBack: navigateHome,
        onNavigateHome: navigateHome,
      },
    });
    const confirmationAction = state.confirmationAction;
    const isConfirmationOpen = confirmationAction !== null;

    root.innerHTML = `<main style="font-family: sans-serif; max-width: 720px; margin: 32px auto; padding: 16px;">
      <h1>${app.name}</h1>
      <h2>SCR-004 Habit Edit</h2>
      <form id="habit-edit-form" style="display: grid; gap: 8px; margin: 12px 0;">
        <label>name <input id="habit-edit-name" required value="${escapeHtml(state.name)}" /></label>
        <label>
          display_order
          <input id="habit-edit-display-order" type="number" min="1" max="9999" required value="${state.displayOrder}" />
        </label>
        <p id="habit-edit-status-badge">status: ${escapeHtml(page.ui.status)}</p>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button id="habit-edit-save" type="submit">${state.isSubmitting ? "保存中..." : "保存"}</button>
          <button id="habit-edit-archive" type="button" ${page.ui.buttons.archive.visible ? "" : "hidden"}>アーカイブ</button>
          <button id="habit-edit-resume" type="button" ${page.ui.buttons.resume.visible ? "" : "hidden"}>再開</button>
          <button id="habit-edit-back" type="button">戻る</button>
        </div>
      </form>
      <p id="habit-edit-error" role="alert" style="color: #b00020; min-height: 1.4em;">${escapeHtml(state.errorMessage)}</p>
      <div id="habit-edit-confirmation-modal" role="dialog" aria-modal="true" ${isConfirmationOpen ? "" : "hidden"}>
        <p>${confirmationAction === "archive" ? "この習慣をアーカイブしますか？" : "この習慣を再開しますか？"}</p>
        <div style="display: flex; gap: 8px;">
          <button id="habit-edit-confirm-ok" type="button">実行</button>
          <button id="habit-edit-confirm-cancel" type="button">キャンセル</button>
        </div>
      </div>
      <p><a href="/home">/home に戻る</a></p>
    </main>`;

    const form = root.querySelector<HTMLFormElement>("#habit-edit-form");
    const nameInput = root.querySelector<HTMLInputElement>("#habit-edit-name");
    const displayOrderInput = root.querySelector<HTMLInputElement>("#habit-edit-display-order");
    const saveButton = root.querySelector<HTMLButtonElement>("#habit-edit-save");
    const archiveButton = root.querySelector<HTMLButtonElement>("#habit-edit-archive");
    const resumeButton = root.querySelector<HTMLButtonElement>("#habit-edit-resume");
    const backButton = root.querySelector<HTMLButtonElement>("#habit-edit-back");
    const confirmOkButton = root.querySelector<HTMLButtonElement>("#habit-edit-confirm-ok");
    const confirmCancelButton = root.querySelector<HTMLButtonElement>("#habit-edit-confirm-cancel");
    if (
      !form
      || !nameInput
      || !displayOrderInput
      || !saveButton
      || !archiveButton
      || !resumeButton
      || !backButton
      || !confirmOkButton
      || !confirmCancelButton
    ) {
      return;
    }

    saveButton.disabled = state.isSubmitting;
    archiveButton.disabled = state.isSubmitting;
    resumeButton.disabled = state.isSubmitting;
    backButton.disabled = state.isSubmitting;
    confirmOkButton.disabled = state.isSubmitting;

    nameInput.addEventListener("input", () => {
      state.name = nameInput.value;
    });
    displayOrderInput.addEventListener("input", () => {
      state.displayOrder = Number(displayOrderInput.value);
    });
    backButton.addEventListener("click", () => {
      page.actions.back();
    });
    archiveButton.addEventListener("click", () => {
      page.actions.archive();
      state.confirmationAction = page.ui.confirmationModal.action;
      render();
    });
    resumeButton.addEventListener("click", () => {
      page.actions.resume();
      state.confirmationAction = page.ui.confirmationModal.action;
      render();
    });
    confirmCancelButton.addEventListener("click", () => {
      state.confirmationAction = null;
      render();
    });

    confirmOkButton.addEventListener("click", async () => {
      const action = state.confirmationAction;
      if (!action) {
        return;
      }
      state.isSubmitting = true;
      state.errorMessage = "";
      render();
      const result = await requestHabitStatusTransitionRuntime(fetch, {
        userId,
        habitId,
        action,
      });
      if (result.kind === "error") {
        if (result.error.status === 403) {
          navigateHome();
          return;
        }
        state.errorMessage = result.error.message;
      } else {
        syncFromRuntime(result.habit);
      }
      state.confirmationAction = null;
      state.isSubmitting = false;
      render();
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (state.isSubmitting) {
        return;
      }
      state.name = nameInput.value.trim();
      state.displayOrder = Number(displayOrderInput.value);
      state.isSubmitting = true;
      state.errorMessage = "";
      render();
      const result = await requestHabitEditUpdateRuntime(fetch, {
        userId,
        habitId,
        name: state.name,
        displayOrder: state.displayOrder,
      });
      state.isSubmitting = false;
      if (result.kind === "error") {
        if (result.error.status === 403) {
          navigateHome();
          return;
        }
        state.errorMessage = result.error.message;
        render();
        return;
      }
      navigateHome();
    });
  };

  root.innerHTML = `<main style="font-family: sans-serif; max-width: 720px; margin: 32px auto; padding: 16px;">
    <h1>${app.name}</h1>
    <h2>SCR-004 Habit Edit</h2>
    <p>読み込み中...</p>
  </main>`;

  void requestHabitDetailRuntime(fetch, { habitId }).then((result) => {
    if (result.kind === "error") {
      if (result.error.status === 403) {
        navigateHome();
        return;
      }
      state.errorMessage = result.error.message;
      render();
      return;
    }
    syncFromRuntime(result.habit);
    render();
  });
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
  const key = LOCAL_USER_ID_STORAGE_KEY;
  const sessionScoped = readSessionStorage(key);
  if (sessionScoped) {
    return sessionScoped;
  }

  try {
    const existing = window.localStorage.getItem(key);
    if (existing) {
      writeSessionStorage(key, existing);
      return existing;
    }
    const generated =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : LOCAL_USER_ID_FALLBACK;
    window.localStorage.setItem(key, generated);
    writeSessionStorage(key, generated);
    return generated;
  } catch {
    const existingSessionScoped = readSessionStorage(key);
    if (existingSessionScoped) {
      return existingSessionScoped;
    }

    const generated =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : LOCAL_USER_ID_FALLBACK;
    writeSessionStorage(key, generated);

    // storage が完全に使えない環境では固定IDで user 文脈のぶれを防ぐ
    return readSessionStorage(key) ?? LOCAL_USER_ID_FALLBACK;
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
