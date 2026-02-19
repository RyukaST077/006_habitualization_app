import { describe, expect, it } from "vitest";
import { ROUTE_MAP } from "../../../src/app/route-map";

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
  "SCR-004": "/habits/:habitId/edit",
  "SCR-005": "/history",
  "SCR-006": "/analytics",
  "SCR-007": "/settings",
  "SCR-008": "/policy-consent",
};

describe("T-011 PR-003 route map tests", () => {
  it("FR-001 SCR-001/SCR-008: ログインと同意画面のURLが仕様どおり", () => {
    expect(ROUTE_MAP).toMatchObject({
      "SCR-001": expectedRouteMap["SCR-001"],
      "SCR-008": expectedRouteMap["SCR-008"],
    });
  });

  it("FR-003 SCR-002..SCR-007: 保護画面URLが仕様どおり", () => {
    expect(ROUTE_MAP).toStrictEqual(expectedRouteMap);
  });
});
