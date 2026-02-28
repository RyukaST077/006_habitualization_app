import { describe, expect, it } from "vitest";

import { buildPolicyConsentRowsToInsert } from "../../../src/server/application/if-002/policy-consent-utils";
import type { PolicyConsentRow, PolicySettingRow } from "../../../src/server/application/if-001/session-state-utils";

describe("IF-002 policy consent insert utility tests", () => {
  const policySettings: PolicySettingRow[] = [
    { policy_type: "terms", current_version: "v1.0" },
    { policy_type: "privacy", current_version: "v1.0" },
  ];

  it("未同意ユーザーは terms/privacy の2件を挿入対象にする", () => {
    const rows = buildPolicyConsentRowsToInsert(
      "8b7fd69b-5bdd-4d95-8196-085a8fdf1e3f",
      policySettings,
      [],
      "2026-02-28T00:00:00.000Z",
    );

    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.policy_type).sort()).toEqual(["privacy", "terms"]);
  });

  it("同意済みユーザーは insertedCount=0 相当（行生成0件）になる", () => {
    const latestConsents: PolicyConsentRow[] = [
      { policy_type: "terms", policy_version: "1.0", consented_at: "2026-02-28T00:00:00.000Z" },
      { policy_type: "privacy", policy_version: "v1.0", consented_at: "2026-02-28T00:00:00.000Z" },
    ];
    const rows = buildPolicyConsentRowsToInsert(
      "8b7fd69b-5bdd-4d95-8196-085a8fdf1e3f",
      policySettings,
      latestConsents,
      "2026-02-28T00:00:00.000Z",
    );

    expect(rows).toHaveLength(0);
  });
});

