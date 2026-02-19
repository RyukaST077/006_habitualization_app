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
});
