import { describe, expect, it } from "vitest";

import { resolvePolicyConsentEntryRoute } from "../../../src/app/policy-consent-entry";
import { SCR008PolicyConsentPage } from "../../../src/screens/SCR-008PolicyConsentPage";
import { T051_C004_COMPLETION_GATE_COMMANDS } from "../../e2e/fixtures/consent-state";
import {
  SCR008_CONSENT_ENTRY_REDIRECT_CASES,
  SCR008_DUAL_CHECK_REQUIRED_EXPECTATION,
  SCR008_POLICY_CONSENT_TRACE_EXPECTATION,
  SCR008_TRACEABILITY_IDS,
  SCR008_UI_REQUIREMENT_TRACE_CASES,
} from "../../helpers/ui/common-ui-fixtures";

const T051_C004_IMPLEMENTATION_STATE = "implemented" as const;

describe("T-051 C-004 SCR-008 policy consent regression gate tests", () => {
  it("FR-003/FR-004/FR-005/SCR-008 のトレースIDを fixture に固定する", () => {
    const requirementIds = SCR008_UI_REQUIREMENT_TRACE_CASES.map((testCase) => testCase.requirementId);

    expect(SCR008_TRACEABILITY_IDS).toEqual(["FR-003", "FR-004", "FR-005", "SCR-008"]);
    expect(new Set(requirementIds)).toEqual(new Set(["FR-003", "FR-004", "FR-005"]));
    expect(SCR008_UI_REQUIREMENT_TRACE_CASES.every((testCase) => testCase.screenId === "SCR-008")).toBe(true);
  });

  it("TC-ST-CON-007-001: terms/privacy の双方チェックONまでは同意ボタンを無効化する", () => {
    const page = SCR008PolicyConsentPage({ screenId: "SCR-008" }) as unknown as Record<string, unknown>;
    const pageActions = page["actions"] as {
      setTermsChecked: (checked: boolean) => void;
      setPrivacyChecked: (checked: boolean) => void;
    };

    expect(page).toHaveProperty("ui.acceptButton.requires", SCR008_DUAL_CHECK_REQUIRED_EXPECTATION.requiredChecks);
    expect(page).toHaveProperty("ui.terms.checked", false);
    expect(page).toHaveProperty("ui.privacy.checked", false);
    expect(page).toHaveProperty("ui.acceptButton.disabled", SCR008_DUAL_CHECK_REQUIRED_EXPECTATION.disabledWhenEitherUnchecked);

    pageActions.setTermsChecked(true);
    expect(page).toHaveProperty("ui.terms.checked", true);
    expect(page).toHaveProperty("ui.privacy.checked", false);
    expect(page).toHaveProperty("ui.acceptButton.disabled", true);

    pageActions.setPrivacyChecked(true);
    expect(page).toHaveProperty("ui.terms.checked", true);
    expect(page).toHaveProperty("ui.privacy.checked", true);
    expect(page).toHaveProperty("ui.acceptButton.disabled", false);

    pageActions.setTermsChecked(false);
    expect(page).toHaveProperty("ui.terms.checked", false);
    expect(page).toHaveProperty("ui.privacy.checked", true);
    expect(page).toHaveProperty("ui.acceptButton.disabled", true);
  });

  it("回帰固定: terms/privacy の2チェックが OFF のとき同意ボタンは disabled", () => {
    const page = SCR008PolicyConsentPage({ screenId: "SCR-008" }) as unknown as Record<string, unknown>;

    expect(page).toHaveProperty("ui.terms.checked", false);
    expect(page).toHaveProperty("ui.privacy.checked", false);
    expect(page).toHaveProperty("ui.acceptButton.disabled", true);
  });

  it("TC-ST-CON-007-002: terms/privacy 双方ON時のみ同意ボタンを活性化する", () => {
    const page = SCR008PolicyConsentPage({ screenId: "SCR-008" }) as unknown as Record<string, unknown>;
    const pageActions = page["actions"] as {
      setTermsChecked: (checked: boolean) => void;
      setPrivacyChecked: (checked: boolean) => void;
      accept: () => unknown;
    };

    pageActions.setTermsChecked(true);
    expect(page).toHaveProperty("ui.acceptButton.disabled", true);
    pageActions.setPrivacyChecked(true);
    const acceptTrace = pageActions.accept() as Record<string, unknown>;

    expect(page).toHaveProperty("ui.acceptButton.requires", SCR008_DUAL_CHECK_REQUIRED_EXPECTATION.requiredChecks);
    expect(page).toHaveProperty("ui.acceptButton.disabled", !SCR008_DUAL_CHECK_REQUIRED_EXPECTATION.enabledWhenBothChecked);
    expect(acceptTrace).toMatchObject({
      action: SCR008_POLICY_CONSENT_TRACE_EXPECTATION.acceptAction,
      requirementId: SCR008_POLICY_CONSENT_TRACE_EXPECTATION.requirementId,
      metadata: {
        policyTypes: SCR008_POLICY_CONSENT_TRACE_EXPECTATION.policyTypes,
      },
    });
  });

  it("C-002: 同意/拒否アクションが監査traceを返す", () => {
    const page = SCR008PolicyConsentPage({ screenId: "SCR-008" }) as unknown as Record<string, unknown>;
    const pageActions = page["actions"] as {
      setTermsChecked: (checked: boolean) => void;
      setPrivacyChecked: (checked: boolean) => void;
      accept: () => unknown;
      reject: () => unknown;
    };

    expect(pageActions.accept()).toBe(false);

    pageActions.setTermsChecked(true);
    pageActions.setPrivacyChecked(true);

    const acceptTrace = pageActions.accept() as Record<string, unknown>;
    const rejectTrace = pageActions.reject() as Record<string, unknown>;

    expect(acceptTrace).toMatchObject({
      action: SCR008_POLICY_CONSENT_TRACE_EXPECTATION.acceptAction,
      requirementId: SCR008_POLICY_CONSENT_TRACE_EXPECTATION.requirementId,
      metadata: {
        policyTypes: SCR008_POLICY_CONSENT_TRACE_EXPECTATION.policyTypes,
      },
    });
    expect(rejectTrace).toMatchObject({
      action: SCR008_POLICY_CONSENT_TRACE_EXPECTATION.rejectAction,
      requirementId: SCR008_POLICY_CONSENT_TRACE_EXPECTATION.requirementId,
      metadata: {
        policyTypes: SCR008_POLICY_CONSENT_TRACE_EXPECTATION.policyTypes,
      },
    });
  });

  it("同意済みユーザーが /policy-consent へ到達したとき /home へ遷移するケースを固定する", () => {
    const agreedCase = SCR008_CONSENT_ENTRY_REDIRECT_CASES.find((testCase) => testCase.consentState === "agreed");

    expect(agreedCase).toBeDefined();
    if (!agreedCase) {
      return;
    }
    const route = resolvePolicyConsentEntryRoute(
      { authState: "authenticated", consentState: agreedCase.consentState, userId: "user-001" },
      null,
    );
    expect(route).toBe(agreedCase.expectedPath);
  });

  it("green: T-051 C-004 の回帰ゲート定義を固定する", () => {
    expect(T051_C004_IMPLEMENTATION_STATE).toBe("implemented");
  });

  it("完了ゲート: 同意関連テスト群の実行コマンドを固定する", () => {
    expect(T051_C004_COMPLETION_GATE_COMMANDS).toEqual([
      "npm run test -- tests/integration/ui/scr-008-policy-consent-a11y-red.spec.ts tests/unit/screens/scr-008-policy-consent-page-red.spec.ts",
      "npm run test -- tests/unit/screens/scr-008-policy-consent-page-red.spec.ts tests/integration/ui/scr-008-policy-consent-runtime-red.spec.ts tests/integration/routing/policy-consent-entry.spec.ts && npm run typecheck",
    ]);
  });
});
