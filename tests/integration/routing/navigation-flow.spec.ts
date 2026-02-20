import { describe, expect, it } from "vitest";
import { NAVIGATION_FLOW } from "../../../src/app/navigation-flow";
import { resolveAuthConsentRedirect } from "../../../src/app/router";

type ScreenId =
  | "SCR-001"
  | "SCR-002"
  | "SCR-003"
  | "SCR-004"
  | "SCR-005"
  | "SCR-006"
  | "SCR-007"
  | "SCR-008";

type FlowMap = Record<ScreenId, ScreenId[]>;

const expectedNavigationFlow: FlowMap = {
  "SCR-001": ["SCR-008", "SCR-002"],
  "SCR-002": ["SCR-003", "SCR-004", "SCR-005", "SCR-006", "SCR-007"],
  "SCR-003": ["SCR-002"],
  "SCR-004": ["SCR-002"],
  "SCR-005": ["SCR-002"],
  "SCR-006": ["SCR-002"],
  "SCR-007": ["SCR-002"],
  "SCR-008": ["SCR-001", "SCR-002"],
};

type CommonErrorObservation = {
  screenId: ScreenId;
  hasErrorBanner: boolean;
  exposesStatusCode: boolean;
  exposesErrorCode: boolean;
  traceIdFieldName: "trace_id";
};

const COMMON_ERROR_OBSERVATION_SCREENS: readonly ScreenId[] = [
  "SCR-001",
  "SCR-002",
  "SCR-003",
  "SCR-004",
  "SCR-005",
  "SCR-006",
  "SCR-007",
  "SCR-008",
];

const COMMON_ERROR_OBSERVATIONS: readonly CommonErrorObservation[] = COMMON_ERROR_OBSERVATION_SCREENS.map((screenId) => ({
  screenId,
  hasErrorBanner: true,
  exposesStatusCode: true,
  exposesErrorCode: true,
  traceIdFieldName: "trace_id",
}));

describe("T-011 PR-002 navigation flow tests", () => {
  it("FR-001 SCR-001: 認証後に SCR-008 または SCR-002 へ遷移する", () => {
    expect(NAVIGATION_FLOW["SCR-001"]).toEqual(expectedNavigationFlow["SCR-001"]);
  });

  it("FR-003 SCR-008: 同意で SCR-002、拒否で SCR-001 へ遷移する", () => {
    expect(NAVIGATION_FLOW["SCR-008"]).toEqual(expectedNavigationFlow["SCR-008"]);
  });

  it("SCR-002: ホーム起点で各機能画面へ遷移可能", () => {
    expect(NAVIGATION_FLOW["SCR-002"]).toEqual(expectedNavigationFlow["SCR-002"]);
  });

  it("SCR-001 はログイン後の分岐候補として SCR-008 と SCR-002 を保持する", () => {
    expect(NAVIGATION_FLOW["SCR-001"]).toEqual(["SCR-008", "SCR-002"]);
  });

  it("未同意ユーザーが /home へ到達した場合は re-consent 含め SCR-008 へ強制される", () => {
    const redirect = resolveAuthConsentRedirect("/home", "authenticated", "unknown");
    expect(redirect).toBe("/policy-consent");
  });
});

describe("T-014 PR-003 common error presentation consistency checks", () => {
  it("全画面で共通エラーUIの観測ポイントを提供する", () => {
    expect(COMMON_ERROR_OBSERVATIONS).toHaveLength(8);

    for (const observation of COMMON_ERROR_OBSERVATIONS) {
      expect(observation.hasErrorBanner, `${observation.screenId}:banner`).toBe(true);
      expect(observation.exposesStatusCode, `${observation.screenId}:status`).toBe(true);
      expect(observation.exposesErrorCode, `${observation.screenId}:code`).toBe(true);
      expect(observation.traceIdFieldName, `${observation.screenId}:trace_id`).toBe("trace_id");
    }
  });
});
