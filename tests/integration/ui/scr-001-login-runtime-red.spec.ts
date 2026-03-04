/// <reference lib="dom" />

import { afterEach, describe, expect, it, vi } from "vitest";

import { ROUTE_MAP } from "../../../src/app/route-map";
import { SCR001LoginPage } from "../../../src/screens/SCR-001LoginPage";
import { bootstrapApp, renderLoginOrRedirect, requestLoginStartRuntime } from "../../../src/main";
import {
  SCR001_AUTH_FAILURE_EXPECTATION,
  SCR001_TRACEABILITY_IDS,
} from "../../helpers/ui/common-ui-fixtures";

const originalWindow = globalThis.window;

describe("T-050 C-001 SCR-001 login runtime red tests", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      writable: true,
      value: originalWindow,
    });
  });

  it("FR-001 / SCR-001 / IF-001: 認証開始API成功時に auth_url を返す", async () => {
    expect(SCR001_TRACEABILITY_IDS).toEqual(["FR-001", "SCR-001", "IF-001"]);
    const fetchMock = vi.fn<typeof fetch>(async () => {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          auth_url: "https://accounts.google.com/o/oauth2/v2/auth?client_id=if001",
          trace_id: "trace-if001-success",
          audit_action: "LOGIN_START",
        }),
      } as Response;
    });
    const page = SCR001LoginPage({ screenId: "SCR-001" });
    const result = await requestLoginStartRuntime(fetchMock, page.actions.resolveError);

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/google/start", expect.objectContaining({ method: "POST" }));
    expect(result.kind).toBe("success");
    if (result.kind !== "success") {
      return;
    }
    expect(result.authUrl).toContain("https://accounts.google.com");
    expect(result.traceId).toContain("trace-if001-");
    expect(result.auditAction).toBe("LOGIN_START");
  });

  it("失敗時にエラーアラート用の情報を返し、再試行可能状態へ戻せる", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => {
      return {
        ok: false,
        status: 401,
        json: async () => ({
          code: "AUTH_FAILED",
          trace_id: "trace-if001-auth-failed",
          route: "SCR-001",
          audit_action: "LOGIN_FAILED",
        }),
      } as Response;
    });
    const onRetryAuth = vi.fn(async () => {});
    const page = SCR001LoginPage({ screenId: "SCR-001", handlers: { onRetryAuth } });
    const result = await requestLoginStartRuntime(fetchMock, page.actions.resolveError);

    expect(result.kind).toBe("error");
    if (result.kind !== "error") {
      return;
    }
    expect(result.route).toBe("SCR-001");
    expect(result.error.message).toContain(SCR001_AUTH_FAILURE_EXPECTATION.errorMessageContains);
    expect(result.error.traceIdLabel).toBe("trace_id");

    await page.actions.retryAuth();
    expect(onRetryAuth).toHaveBeenCalledTimes(1);
    expect(page.ui.loginButton.disabled).toBe(false);
  });

  it("認証済みの /login 到達は resolveAuthConsentRedirect で同意状態ごとに遷移する", async () => {
    const replace = vi.fn();
    const windowStub = {
      location: {
        replace,
      },
      sessionStorage: {
        getItem: (key: string) => {
          if (key === "if001-callback-access-token") {
            return "access-token-for-runtime-test";
          }
          return null;
        },
        setItem: vi.fn(),
      },
    } as unknown as Window & typeof globalThis;
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      writable: true,
      value: windowStub,
    });

    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      if (String(input) === "/api/auth/session-state") {
        return {
          ok: true,
          json: async () => ({
            authState: "authenticated",
            consentState: "unknown",
            userId: "user-runtime",
          }),
        } as Response;
      }
      throw new Error("unexpected fetch");
    });
    vi.stubGlobal("fetch", fetchMock);

    const root = { innerHTML: "", querySelector: () => null } as unknown as HTMLDivElement;
    await renderLoginOrRedirect(root, bootstrapApp());

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/session-state", expect.any(Object));
    expect(replace).toHaveBeenCalledWith(ROUTE_MAP["SCR-008"]);
  });
});
