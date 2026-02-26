import { describe, expect, it } from "vitest";

import { resolveAuthConsentRedirect } from "../../../src/app/router";
import { ROUTE_MAP } from "../../../src/app/route-map";
import { AuthSessionService, type AuthSessionAuditLogPort, type ConsentStatusPort } from "../../../src/server/application/auth/AuthSessionService";
import type { SupabaseAuthGatewayContract } from "../../../src/server/application/auth/SupabaseAuthGateway";
import { createIf001CallbackHandler } from "../../../src/server/application/if-001/callback-handler";

describe("T-033 PR-003 auth session redirect red tests", () => {
  it("認証成功後は同意済みなら SCR-002 /home へ分岐する", () => {
    const route = resolveAuthConsentRedirect(ROUTE_MAP["SCR-001"], "authenticated", "agreed");

    expect(route).toBe(ROUTE_MAP["SCR-002"]);
  });

  it("認証成功後は未同意なら SCR-008 /policy-consent へ分岐する", () => {
    const route = resolveAuthConsentRedirect(ROUTE_MAP["SCR-001"], "authenticated", "unknown");

    expect(route).toBe(ROUTE_MAP["SCR-008"]);
  });

  it("認証成功後に同意拒否なら SCR-001 /login へ戻して再試行可能にする", () => {
    const route = resolveAuthConsentRedirect(ROUTE_MAP["SCR-001"], "authenticated", "rejected");

    expect(route).toBe(ROUTE_MAP["SCR-001"]);
  });

  it("TC-IT-FR-003-003: IF-004 policy_settings 更新で同意状態が unknown の間は SCR-008 に留める", () => {
    const route = resolveAuthConsentRedirect(ROUTE_MAP["SCR-008"], "authenticated", "unknown");

    expect(route).toBe(ROUTE_MAP["SCR-008"]);
  });

  it("callback 分岐で rejected を最優先して SCR-001 を返す", async () => {
    const authGateway: SupabaseAuthGatewayContract = {
      async buildGoogleOAuthUrl(): Promise<string> {
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
    const callbackHandler = createIf001CallbackHandler({ authSessionService: service });
    const result = await callbackHandler({
      userId: "user-consented",
      consentState: "rejected",
    });

    expect(result.route).toBe("SCR-001");
  });
});
