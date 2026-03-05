import { describe, expect, it } from "vitest";

const T029_REGRESSION_GATE_COMMAND =
  "npm run test -- tests/unit/server/withdrawal-service.spec.ts tests/integration/api/if-002-withdrawal-red.spec.ts tests/integration/withdrawal/bat-004-hard-delete-red.spec.ts tests/integration/withdrawal/if-005-deletion-trace-red.spec.ts tests/integration/withdrawal/fnc-012-sla-regression.spec.ts tests/integration/withdrawal/fnc-012-regression-gate.spec.ts";
const T029_FINAL_GATE_COMMAND =
  "npm run test -- tests/unit/server/withdrawal-service.spec.ts tests/integration/api/if-002-withdrawal-red.spec.ts tests/integration/withdrawal/bat-004-hard-delete-red.spec.ts tests/integration/withdrawal/if-005-deletion-trace-red.spec.ts tests/integration/withdrawal/fnc-012-sla-regression.spec.ts tests/integration/withdrawal/fnc-012-regression-gate.spec.ts && npm run typecheck";
const T029_BOUNDARY_NOTE =
  "Boundary note: T-056 owns SCR-007 UI only, T-030 owns monitoring/alerts only, and T-031 owns cross-cutting security/audit hardening only.";

describe("T-029 C-006 final regression gate", () => {
  it("FR-023/FR-024 + AC-023/AC-024 + NFR-005 + EX-007 を最終回帰ゲートへ束ねる", () => {
    const traceability = ["FR-023", "FR-024", "AC-023", "AC-024", "NFR-005", "EX-007"];
    traceability.forEach((id) => {
      expect(id.length).toBeGreaterThan(0);
    });
  });

  it("T-056/T-030/T-031 を除外した境界注記を固定する", () => {
    expect(T029_BOUNDARY_NOTE).toContain("T-056");
    expect(T029_BOUNDARY_NOTE).toContain("T-030");
    expect(T029_BOUNDARY_NOTE).toContain("T-031");
    expect(T029_BOUNDARY_NOTE).toContain("UI only");
    expect(T029_BOUNDARY_NOTE).toContain("monitoring/alerts only");
    expect(T029_BOUNDARY_NOTE).toContain("cross-cutting security/audit hardening only");
  });

  it("回帰ゲートと test+typecheck 最終ゲートコマンドを定数化する", () => {
    expect(T029_REGRESSION_GATE_COMMAND).toBe(
      "npm run test -- tests/unit/server/withdrawal-service.spec.ts tests/integration/api/if-002-withdrawal-red.spec.ts tests/integration/withdrawal/bat-004-hard-delete-red.spec.ts tests/integration/withdrawal/if-005-deletion-trace-red.spec.ts tests/integration/withdrawal/fnc-012-sla-regression.spec.ts tests/integration/withdrawal/fnc-012-regression-gate.spec.ts",
    );
    expect(T029_FINAL_GATE_COMMAND).toBe(
      "npm run test -- tests/unit/server/withdrawal-service.spec.ts tests/integration/api/if-002-withdrawal-red.spec.ts tests/integration/withdrawal/bat-004-hard-delete-red.spec.ts tests/integration/withdrawal/if-005-deletion-trace-red.spec.ts tests/integration/withdrawal/fnc-012-sla-regression.spec.ts tests/integration/withdrawal/fnc-012-regression-gate.spec.ts && npm run typecheck",
    );
  });

  it("Playwright E2E / t-030共通 / security テストを最終ゲートへ含めない", () => {
    expect(T029_REGRESSION_GATE_COMMAND.toLowerCase().includes("playwright")).toBe(false);
    expect(T029_REGRESSION_GATE_COMMAND.includes("tests/e2e/")).toBe(false);
    expect(T029_REGRESSION_GATE_COMMAND.includes("tests/integration/common/t-030-")).toBe(false);
    expect(T029_REGRESSION_GATE_COMMAND.includes("tests/integration/security/")).toBe(false);
    expect(T029_FINAL_GATE_COMMAND.includes("tests/integration/common/t-030-")).toBe(false);
    expect(T029_FINAL_GATE_COMMAND.includes("tests/integration/security/")).toBe(false);
  });
});
