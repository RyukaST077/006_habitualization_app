import { describe, expect, it } from "vitest";

import { resolveAuthConsentRedirect } from "../../../src/app/router";
import { ROUTE_MAP } from "../../../src/app/route-map";
import { getT034AuthUiImplementationState } from "../../helpers/ui/common-ui-fixtures";

describe("T-033 PR-003 auth session redirect red tests", () => {
  it("認証成功後は同意済みなら SCR-002 /home へ分岐する", () => {
    const route = resolveAuthConsentRedirect(ROUTE_MAP["SCR-001"], "authenticated", "agreed");

    expect(route).toBe(ROUTE_MAP["SCR-002"]);
  });

  it("認証成功後は未同意なら SCR-008 /policy-consent へ分岐する", () => {
    const route = resolveAuthConsentRedirect(ROUTE_MAP["SCR-001"], "authenticated", "unknown");

    expect(route).toBe(ROUTE_MAP["SCR-008"]);
  });

  it("認証成功後に同意拒否なら SCR-001 /login へ戻して再試行可能にする", () => {
    const route = resolveAuthConsentRedirect(ROUTE_MAP["SCR-001"], "authenticated", "rejected");

    expect(route).toBe(ROUTE_MAP["SCR-001"]);
  });

  it("red: T-034 未実装のため SCR-008/SCR-002 callback 分岐シナリオは失敗させる", () => {
    expect(getT034AuthUiImplementationState()).toBe("implemented");
  });
});
