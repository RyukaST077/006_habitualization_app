import { describe, expect, it } from "vitest";

import { AuthSessionService, type AuthSessionAuditLogPort } from "../../../src/server/application/auth/AuthSessionService";
import { createConsentTestHarness } from "./helpers/consent-test-harness";

const harness = createConsentTestHarness();

function createAuditCapture() {
  const records: Parameters<AuthSessionAuditLogPort["record"]>[0][] = [];

  return {
    records,
    auditLogService: {
      async record(input: Parameters<AuthSessionAuditLogPort["record"]>[0]) {
        records.push(input);
      },
    } satisfies AuthSessionAuditLogPort,
  };
}

describe("T-036 PR-004 FNC-002/FNC-003 consent audit red tests", () => {
  it("TC-IT-FR-026-001: 同意受諾時は POLICY_CONSENT_ACCEPT を監査出力する", async () => {
    const capture = createAuditCapture();
    const service = new AuthSessionService(
      {
        async buildGoogleOAuthUrl() {
          return "https://example.com/oauth";
        },
        async clearSession() {},
      },
      {
        async hasConsented() {
          return true;
        },
      },
      capture.auditLogService,
    );

    const decision = await service.resolvePostLogin("user-consent-accepted");

    expect(decision.route).toBe("SCR-002");
    expect(capture.records).toHaveLength(1);
    expect(capture.records[0]).toMatchObject({
      action: "POLICY_CONSENT_ACCEPT",
      requirementId: "FR-026",
      result: "SUCCESS",
      targetType: "policy_consents",
      metadata: {
        policy_type: ["terms", "privacy"],
      },
    });
  });

  it("TC-IT-FR-026-002: 同意拒否時は POLICY_CONSENT_REJECT を監査出力する", async () => {
    const capture = createAuditCapture();
    const service = new AuthSessionService(
      {
        async buildGoogleOAuthUrl() {
          return "https://example.com/oauth";
        },
        async clearSession() {},
      },
      {
        async hasConsented() {
          return false;
        },
      },
      capture.auditLogService,
    );

    const result = await service.rejectConsentAndLogout("user-consent-rejected");

    expect(result.route).toBe("SCR-001");
    expect(result.auditAction).toBe("POLICY_CONSENT_REJECT");
    expect(capture.records).toHaveLength(1);
    expect(capture.records[0]).toMatchObject({
      action: "POLICY_CONSENT_REJECT",
      requirementId: "FR-026",
      result: "FAILED",
      targetType: "policy_consents",
    });
  });

  it("FR-026 観点: 同意監査ログは必須フィールドを保持する", async () => {
    const capture = createAuditCapture();
    const service = new AuthSessionService(
      {
        async buildGoogleOAuthUrl() {
          return "https://example.com/oauth";
        },
        async clearSession() {},
      },
      {
        async hasConsented() {
          return true;
        },
      },
      capture.auditLogService,
    );

    await service.resolvePostLogin("user-audit-fields");

    expect(capture.records).toHaveLength(1);
    expect(capture.records[0]).toMatchObject({
      actorRole: "user",
      action: "POLICY_CONSENT_ACCEPT",
      targetType: "policy_consents",
      targetId: "user-audit-fields",
      result: "SUCCESS",
      requirementId: "FR-026",
    });
    expect(capture.records[0].traceId.length).toBeGreaterThan(0);
  });

  it("red: T-037 未実装のため同意監査要件を失敗状態で固定する", () => {
    expect(harness.getT037ImplementationState()).toBe("implemented");
  });
});
