import { describe, expect, it } from "vitest";

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

// Red: 実装前の遷移定義を空として期待遷移との差分を固定化する
const unresolvedNavigationFlow: Partial<FlowMap> = {};

describe("T-010 PR-001 navigation flow red tests", () => {
  it("FR-001 SCR-001: 認証後に SCR-008 または SCR-002 へ遷移する", () => {
    expect(unresolvedNavigationFlow["SCR-001"]).toEqual(expectedNavigationFlow["SCR-001"]);
  });

  it("FR-003 SCR-008: 同意で SCR-002、拒否で SCR-001 へ遷移する", () => {
    expect(unresolvedNavigationFlow["SCR-008"]).toEqual(expectedNavigationFlow["SCR-008"]);
  });

  it("SCR-002: ホーム起点で各機能画面へ遷移可能", () => {
    expect(unresolvedNavigationFlow["SCR-002"]).toEqual(expectedNavigationFlow["SCR-002"]);
  });
});
