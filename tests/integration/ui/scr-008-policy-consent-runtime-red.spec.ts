import { describe, expect, it, vi } from "vitest";

import {
  buildPolicyConsentSubmissionPayload,
  requestCurrentPoliciesRuntime,
} from "../../../src/main";
import { resolveAuthConsentRedirect } from "../../../src/app/router";
import {
  SCR008_ACCEPT_FLOW_EXPECTATION,
  SCR008_REJECT_FLOW_EXPECTATION,
  SCR008_TRACEABILITY_IDS,
  SCR008_UI_REQUIREMENT_TRACE_CASES,
} from "../../helpers/ui/common-ui-fixtures";

describe("T-051 C-003 SCR-008 policy consent runtime tests", () => {
  it("FR-003/FR-004/FR-005 のランタイム導線トレースを固定する", () => {
    const requirementIds = SCR008_UI_REQUIREMENT_TRACE_CASES.map((testCase) => testCase.requirementId);

    expect(SCR008_TRACEABILITY_IDS).toEqual(["FR-003", "FR-004", "FR-005", "SCR-008"]);
    expect(new Set(requirementIds)).toEqual(new Set(["FR-003", "FR-004", "FR-005"]));
  });

  it("画面表示時に /api/policies/current から最新版ポリシーを取得できる", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          terms: { version: "v2.1", url: "https://example.com/terms-v2.1" },
          privacy: { version: "v1.3", url: "https://example.com/privacy-v1.3" },
        }),
      } as Response;
    });

    const result = await requestCurrentPoliciesRuntime(fetchMock);

    expect(fetchMock).toHaveBeenCalledWith("/api/policies/current", { method: "GET" });
    expect(result.terms.version).toBe("v2.1");
    expect(result.privacy.version).toBe("v1.3");
  });

  it("同意押下 payload は terms/privacy の最新版 version を両方含む", () => {
    const payload = buildPolicyConsentSubmissionPayload("user-001", {
      terms: { version: "v3.0", url: "https://example.com/terms-v3.0" },
      privacy: { version: "v2.0", url: "https://example.com/privacy-v2.0" },
    });

    expect(payload).toEqual({
      userId: "user-001",
      consents: [
        { policy_type: "terms", policy_version: "v3.0" },
        { policy_type: "privacy", policy_version: "v2.0" },
      ],
    });
  });

  it("FR-004: 同意拒否時は /login 導線へ戻す", () => {
    const nextPath = resolveAuthConsentRedirect(
      SCR008_REJECT_FLOW_EXPECTATION.fromPath,
      "authenticated",
      SCR008_REJECT_FLOW_EXPECTATION.consentState,
    );

    expect(nextPath).toBe(SCR008_REJECT_FLOW_EXPECTATION.expectedPath);
  });

  it("FR-005: 同意受諾時は /home 導線へ進める", () => {
    const nextPath = resolveAuthConsentRedirect(
      SCR008_ACCEPT_FLOW_EXPECTATION.fromPath,
      "authenticated",
      SCR008_ACCEPT_FLOW_EXPECTATION.consentState,
    );

    expect(nextPath).toBe(SCR008_ACCEPT_FLOW_EXPECTATION.expectedPath);
  });
});
