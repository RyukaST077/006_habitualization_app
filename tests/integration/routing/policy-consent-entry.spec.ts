import { describe, expect, it } from "vitest";

import { resolvePolicyConsentEntryRoute } from "../../../src/app/policy-consent-entry";

describe("Policy consent entry redirect tests", () => {
  it("同意済みユーザーが /policy-consent に来たら /home へ遷移する", () => {
    const route = resolvePolicyConsentEntryRoute(
      { authState: "authenticated", consentState: "agreed", userId: "user-001" },
      null,
    );

    expect(route).toBe("/home");
  });

  it("未同意ユーザーは /policy-consent に留まる", () => {
    const route = resolvePolicyConsentEntryRoute(
      { authState: "authenticated", consentState: "unknown", userId: "user-001" },
      null,
    );

    expect(route).toBe("/policy-consent");
  });

  it("fallback callback 判定で SCR-002 なら /home へ遷移する", () => {
    const route = resolvePolicyConsentEntryRoute(null, "SCR-002");
    expect(route).toBe("/home");
  });

  it("未認証または判定不能なら /login に戻す", () => {
    const route = resolvePolicyConsentEntryRoute(null, null);
    expect(route).toBe("/login");
  });
});
