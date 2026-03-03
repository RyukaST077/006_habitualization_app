import { expect, test } from "@playwright/test";

import { SCR002HomePage } from "../../../src/screens/SCR-002HomePage";

test.describe("TC-AUTO-E2E-CHECKINS-001 チェックイン導線", () => {
  test("FR-013: archived 競合時に SCR-004 への再開導線を表示する", async () => {
    const homeScreen = SCR002HomePage({ screenId: "SCR-002" });

    const result = homeScreen.actions.resolveCheckinResult({
      kind: "error",
      status: 409,
      code: "DOMAIN_CONFLICT",
      traceId: "E2E-CHECKIN-409",
    });

    expect(result.error?.recoveryAction).toEqual({
      label: "再開してチェックインする",
      targetScreenId: "SCR-004",
    });
    expect(result.lastCheckinLogDate).toBeNull();
  });

  test("FR-012: 冪等成功時はエラー非表示で最終チェックイン日だけ更新する", async () => {
    const homeScreen = SCR002HomePage({ screenId: "SCR-002" });

    const result = homeScreen.actions.resolveCheckinResult({
      kind: "success",
      logDate: "2026-03-02",
      idempotent: true,
    });

    expect(result.error).toBeNull();
    expect(result.lastCheckinLogDate).toBe("2026-03-02");
  });
});
