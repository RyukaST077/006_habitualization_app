import { expect, test } from "@playwright/test";

import { CONSENT_FAILURE_SCENARIOS } from "../fixtures/consent-state";
import { ROUTING_SCENARIOS } from "../fixtures/routing-state";
import { resolveAuthConsentRedirect } from "../../../src/app/router";
import type { RoutingScenario } from "../fixtures/routing-state";

async function expectResolvedPathEventually(scenario: RoutingScenario): Promise<void> {
  await expect
    .poll(
      () =>
        resolveAuthConsentRedirect(scenario.startPath, scenario.authState, scenario.consentState),
      {
        message: `[${scenario.caseId ?? scenario.id}] expected redirect path to be stable`,
      }
    )
    .toBe(scenario.expectedPath);
}

test.describe("T-011 PR-002 auth/consent redirect tests", () => {
  test("FR-001 SCR-001 -> SCR-008: 未同意ユーザーを同意画面へ誘導する", async () => {
    const scenario = ROUTING_SCENARIOS[0];

    await test.step(`[${scenario.id}] ${scenario.traceIds.join("/")}`, async () => {
      await expectResolvedPathEventually(scenario);
    });
  });

  test("FR-003 SCR-008 -> SCR-002: 同意済み到達時にホームへリダイレクトする", async () => {
    const scenario = ROUTING_SCENARIOS[1];

    await test.step(`[${scenario.id}] ${scenario.traceIds.join("/")}`, async () => {
      await expectResolvedPathEventually(scenario);
    });
  });

  test("FR-003 SCR-008 -> SCR-001: 同意拒否時にログインへ戻す", async () => {
    const scenario = ROUTING_SCENARIOS[2];

    await test.step(`[${scenario.id}] ${scenario.traceIds.join("/")}`, async () => {
      await expectResolvedPathEventually(scenario);
    });
  });

  test("TC-IT-FR-003-002: 未同意ユーザーは /home 到達時に /policy-consent へ強制遷移する", async () => {
    const scenario = ROUTING_SCENARIOS[3];

    await test.step(`[${scenario.caseId ?? scenario.id}] ${scenario.traceIds.join("/")}`, async () => {
      await expectResolvedPathEventually(scenario);
    });
  });

  test("TC-IT-FR-003-003: 旧版同意（outdated consent）は再同意のため /policy-consent へ誘導する", async () => {
    const scenario = ROUTING_SCENARIOS[4];

    await test.step(`[${scenario.caseId ?? scenario.id}] ${scenario.traceIds.join("/")}`, async () => {
      await expectResolvedPathEventually(scenario);
    });
  });

  test("TC-ST-FR-004-004: 同意拒否時はセッション破棄相当として /login へ戻す", async () => {
    const scenario = ROUTING_SCENARIOS[5];

    await test.step(`[${scenario.caseId ?? scenario.id}] ${scenario.traceIds.join("/")}`, async () => {
      await expectResolvedPathEventually(scenario);
    });
  });

  test("TC-IT-FR-026-002: 同意拒否導線に FR-026 監査イベント（POLICY_CONSENT_REJECT）トレースを保持する", async () => {
    const scenario = CONSENT_FAILURE_SCENARIOS[3];

    await test.step(`[${scenario.caseId}] ${scenario.traceIds.join("/")}`, async () => {
      expect(scenario.traceIds).toContain("FR-026");
      expect(scenario.traceIds).toContain("CON-007");
      expect(scenario.traceIds).toContain("POLICY_CONSENT_REJECT");
      expect(resolveAuthConsentRedirect(scenario.startPath, scenario.authState, scenario.consentState)).toBe(
        scenario.expectedPath,
      );
    });
  });
});
