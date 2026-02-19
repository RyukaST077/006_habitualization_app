import { expect, test } from "@playwright/test";

import { ROUTING_SCENARIOS } from "../fixtures/routing-state";
import { resolveAuthConsentRedirect } from "../../../src/app/router";

test.describe("T-011 PR-002 auth/consent redirect tests", () => {
  test("FR-001 SCR-001 -> SCR-008: 未同意ユーザーを同意画面へ誘導する", async () => {
    const scenario = ROUTING_SCENARIOS[0];

    await test.step(`[${scenario.id}] ${scenario.traceIds.join("/")}`, async () => {
      const resolvedPath = resolveAuthConsentRedirect(
        scenario.startPath,
        scenario.authState,
        scenario.consentState
      );

      expect(resolvedPath).toBe(scenario.expectedPath);
    });
  });

  test("FR-003 SCR-008 -> SCR-002: 同意済み到達時にホームへリダイレクトする", async () => {
    const scenario = ROUTING_SCENARIOS[1];

    await test.step(`[${scenario.id}] ${scenario.traceIds.join("/")}`, async () => {
      const resolvedPath = resolveAuthConsentRedirect(
        scenario.startPath,
        scenario.authState,
        scenario.consentState
      );

      expect(resolvedPath).toBe(scenario.expectedPath);
    });
  });

  test("FR-003 SCR-008 -> SCR-001: 同意拒否時にログインへ戻す", async () => {
    const scenario = ROUTING_SCENARIOS[2];

    await test.step(`[${scenario.id}] ${scenario.traceIds.join("/")}`, async () => {
      const resolvedPath = resolveAuthConsentRedirect(
        scenario.startPath,
        scenario.authState,
        scenario.consentState
      );

      expect(resolvedPath).toBe(scenario.expectedPath);
    });
  });

  test("TC-IT-FR-003-002: 未同意ユーザーは /home 到達時に /policy-consent へ強制遷移する", async () => {
    const scenario = ROUTING_SCENARIOS[3];

    await test.step(`[${scenario.caseId ?? scenario.id}] ${scenario.traceIds.join("/")}`, async () => {
      const resolvedPath = resolveAuthConsentRedirect(
        scenario.startPath,
        scenario.authState,
        scenario.consentState
      );

      expect(resolvedPath).toBe(scenario.expectedPath);
    });
  });

  test("TC-IT-FR-003-003: 旧版同意（outdated consent）は再同意のため /policy-consent へ誘導する", async () => {
    const scenario = ROUTING_SCENARIOS[4];

    await test.step(`[${scenario.caseId ?? scenario.id}] ${scenario.traceIds.join("/")}`, async () => {
      const resolvedPath = resolveAuthConsentRedirect(
        scenario.startPath,
        scenario.authState,
        scenario.consentState
      );

      expect(resolvedPath).toBe(scenario.expectedPath);
    });
  });

  test("TC-ST-FR-004-004: 同意拒否時はセッション破棄相当として /login へ戻す", async () => {
    const scenario = ROUTING_SCENARIOS[5];

    await test.step(`[${scenario.caseId ?? scenario.id}] ${scenario.traceIds.join("/")}`, async () => {
      const resolvedPath = resolveAuthConsentRedirect(
        scenario.startPath,
        scenario.authState,
        scenario.consentState
      );

      expect(resolvedPath).toBe(scenario.expectedPath);
    });
  });
});
