import { describe, expect, it } from "vitest";

import { AuthSessionService, type AuthSessionAuditLogPort, type ConsentStatusPort } from "../../../src/server/application/auth/AuthSessionService";
import type { SupabaseAuthGatewayContract } from "../../../src/server/application/auth/SupabaseAuthGateway";
import { createIf001StartHandler } from "../../../src/server/application/if-001/start-handler";
import { IF001_RED_CASES } from "./fixtures/if-001-cases";
import { createIf001TestHarness } from "./helpers/if-001-test-harness";

function createStartApi(providerError = false) {
  const authGateway: SupabaseAuthGatewayContract = {
    async buildGoogleOAuthUrl(): Promise<string> {
      if (providerError) {
        throw new Error("provider error");
      }

      return "https://accounts.google.com/o/oauth2/v2/auth?client_id=if001";
    },
    async clearSession(): Promise<void> {
      return;
    },
  };

  const consentStatusPort: ConsentStatusPort = {
    async hasConsented(): Promise<boolean> {
      return true;
    },
  };

  const auditLogService: AuthSessionAuditLogPort = {
    async record(): Promise<unknown> {
      return;
    },
  };

  const service = new AuthSessionService(authGateway, consentStatusPort, auditLogService);
  return createIf001StartHandler({ authSessionService: service });
}

describe("T-033 PR-002 IF-001 start API red tests", () => {
  it("POST /api/auth/google/start 正常系: auth_url と trace_id を返す", async () => {
    const harness = createIf001TestHarness();
    const startApi = createStartApi();
    const response = await startApi({
      redirectTo: "/home",
      authorization: "Bearer test-token",
    });

    harness.assertAuthStartSuccessContract(response);
  });

  it("POST /api/auth/google/start 異常系: 400 INVALID_REDIRECT + LOGIN_FAILED を返す", async () => {
    const harness = createIf001TestHarness();
    const startApi = createStartApi();
    const response = await startApi({
      redirectTo: "https://malicious.example",
      authorization: "Bearer test-token",
    });

    harness.assertAuthStartErrorContract(response, 400);
  });

  it("POST /api/auth/google/start 異常系: 401 AUTH_FAILED + LOGIN_FAILED を返す", async () => {
    const harness = createIf001TestHarness();
    const startApi = createStartApi();
    const response = await startApi({
      redirectTo: "/home",
    });

    harness.assertAuthStartErrorContract(response, 401);
  });

  it("POST /api/auth/google/start 異常系: 500 AUTH_PROVIDER_ERROR + LOGIN_FAILED を返す", async () => {
    const harness = createIf001TestHarness();
    const startApi = createStartApi(true);
    const response = await startApi({
      redirectTo: "/cause-provider-error",
      authorization: "Bearer test-token",
    });

    harness.assertAuthStartErrorContract(response, 500);
  });

  it("IF-001 trace ケースに LOGIN_SUCCESS/LOGIN_FAILED イベント観点を保持する", () => {
    const auditActions = new Set(IF001_RED_CASES.map((entry) => entry.expected.auditAction));

    expect(auditActions.has("LOGIN_FAILED")).toBe(true);
    expect(auditActions.has("LOGIN_SUCCESS")).toBe(true);
  });

  it("red: T-034 未実装のため start API は失敗させる", () => {
    const harness = createIf001TestHarness();
    expect(harness.getT034ImplementationState()).toBe("implemented");
  });
});
