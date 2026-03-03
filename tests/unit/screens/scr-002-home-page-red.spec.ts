import { describe, expect, it } from "vitest";

import { SCR002HomePage } from "../../../src/screens/SCR-002HomePage";

describe("T-025 C-004 SCR-002 archived conflict handling tests", () => {
  it("archived拒否(409)時は SCR-004 への再開導線を表示する", () => {
    const page = SCR002HomePage({ screenId: "SCR-002" });
    const result = page.actions.resolveCheckinResult({
      kind: "error",
      status: 409,
      code: "DOMAIN_CONFLICT",
    });

    expect(result.lastCheckinLogDate).toBeNull();
    expect(result.error?.status).toBe(409);
    expect(result.error?.code).toBe("DOMAIN_CONFLICT");
    expect(result.error?.recoveryAction).toEqual({
      label: "再開してチェックインする",
      targetScreenId: "SCR-004",
    });
  });

  it("冪等成功時はエラーを表示せず状態のみ更新する", () => {
    const page = SCR002HomePage({ screenId: "SCR-002" });
    const result = page.actions.resolveCheckinResult({
      kind: "success",
      logDate: "2026-02-23",
      idempotent: true,
    });

    expect(result.error).toBeNull();
    expect(result.lastCheckinLogDate).toBe("2026-02-23");
  });

  it("403/500 エラー時は再開導線を表示しない", () => {
    const page = SCR002HomePage({ screenId: "SCR-002" });
    const forbidden = page.actions.resolveCheckinResult({
      kind: "error",
      status: 403,
      code: "FORBIDDEN",
    });
    const internal = page.actions.resolveCheckinResult({
      kind: "error",
      status: 500,
      code: "INTERNAL_ERROR",
      traceId: "SCR002-500",
    });

    expect(forbidden.error?.recoveryAction).toBeNull();
    expect(internal.error?.recoveryAction).toBeNull();
  });
});
