import { describe, expect, it } from "vitest";

import {
  decodeJwtPayload,
  extractBearerToken,
  hasLatestRequiredConsents,
  isExpiredJwt,
  type PolicyConsentRow,
  type PolicySettingRow,
} from "../../../src/server/application/if-001/session-state-utils";

function createJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.`;
}

describe("IF-001 session-state utility tests", () => {
  it("Authorization なしは bearer token を抽出しない", () => {
    expect(extractBearerToken(undefined)).toBeNull();
    expect(extractBearerToken("Basic xxxxx")).toBeNull();
  });

  it("有効Bearer tokenは抽出できる", () => {
    expect(extractBearerToken("Bearer token-123")).toBe("token-123");
  });

  it("JWT payload を decode できる", () => {
    const jwt = createJwt({ sub: "user-001", exp: 4102444800 });
    expect(decodeJwtPayload(jwt)).toMatchObject({ sub: "user-001", exp: 4102444800 });
  });

  it("exp 切れJWTを期限切れとして判定する", () => {
    expect(isExpiredJwt({ exp: 1000 }, 1000 * 1000 + 1)).toBe(true);
    expect(isExpiredJwt({ exp: 2000 }, 1000 * 1000)).toBe(false);
  });

  it("terms/privacy が最新同意なら agreed 判定できる", () => {
    const settings: PolicySettingRow[] = [
      { policy_type: "terms", current_version: "v1.0" },
      { policy_type: "privacy", current_version: "v1.0" },
    ];
    const consents: PolicyConsentRow[] = [
      { policy_type: "terms", policy_version: "1.0", consented_at: "2026-02-28T00:00:00.000Z" },
      { policy_type: "privacy", policy_version: "v1.0", consented_at: "2026-02-28T00:00:00.000Z" },
    ];
    expect(hasLatestRequiredConsents(settings, consents)).toBe(true);
  });

  it("同意不足/版不一致は unknown 判定になる", () => {
    const settings: PolicySettingRow[] = [
      { policy_type: "terms", current_version: "v2.0" },
      { policy_type: "privacy", current_version: "v1.0" },
    ];
    const consents: PolicyConsentRow[] = [
      { policy_type: "terms", policy_version: "v1.0", consented_at: "2026-02-28T00:00:00.000Z" },
      { policy_type: "privacy", policy_version: "v1.0", consented_at: "2026-02-28T00:00:00.000Z" },
    ];
    expect(hasLatestRequiredConsents(settings, consents)).toBe(false);
  });
});

