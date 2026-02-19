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

type RouteMap = Record<ScreenId, string>;

const expectedRouteMap: RouteMap = {
  "SCR-001": "/login",
  "SCR-002": "/home",
  "SCR-003": "/habits/new",
  "SCR-004": "/history",
  "SCR-005": "/analytics",
  "SCR-006": "/notifications",
  "SCR-007": "/settings",
  "SCR-008": "/policy-consent",
};

// Red: 実装前のため未定義扱いにし、期待仕様との差分を固定化する
const unresolvedRouteMap: Partial<RouteMap> = {};

describe("T-010 PR-001 route map red tests", () => {
  it("FR-001 SCR-001/SCR-008: ログインと同意画面のURLが仕様どおり", () => {
    expect(unresolvedRouteMap).toMatchObject({
      "SCR-001": expectedRouteMap["SCR-001"],
      "SCR-008": expectedRouteMap["SCR-008"],
    });
  });

  it("FR-003 SCR-002..SCR-007: 保護画面URLが仕様どおり", () => {
    expect(unresolvedRouteMap).toStrictEqual(expectedRouteMap);
  });
});
