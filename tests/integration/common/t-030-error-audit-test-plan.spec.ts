import { describe, expect, it } from "vitest";

import { T030_COMMON_ACTOR_IDS, T030_COMMON_ROLE_ID } from "./fixtures/t-030-actors";
import {
  T030_RED_TO_GREEN_TARGETS,
  T030_REQUIRED_TRACE_TERMS,
  T030_SCOPE_MAP,
} from "./fixtures/t-030-scope-map";
import { createT030TraceId, isT030TraceId } from "./helpers/t-030-trace-utils";
import { createT030TestHarness } from "./helpers/t-030-test-harness";

const T030_SUITE_COMMAND = "npm run test -- tests/integration/common/t-030-*.spec.ts";

describe("T-030 PR-001 common error and audit assert red test plan", () => {
  it("scope map に FR-025/FR-026 と AC-025/AC-026 を保持する", () => {
    const harness = createT030TestHarness();
    harness.assertTraceTerms(T030_SCOPE_MAP, T030_REQUIRED_TRACE_TERMS);
  });

  it("IF-002 共通エラー契約(403/409/500)と TBL-008 監査必須項目の責務を分離する", () => {
    const harness = createT030TestHarness();
    const errorScope = T030_SCOPE_MAP.find((entry) => entry.perspective === "COMMON_ERROR_CONTRACT");
    const auditScope = T030_SCOPE_MAP.find((entry) => entry.perspective === "AUDIT_REQUIRED_ASSERTION");

    expect(errorScope).toBeDefined();
    expect(auditScope).toBeDefined();

    harness.assertErrorContract(errorScope!, {
      statuses: [403, 409, 500],
      requirementId: "FR-025",
      acceptanceId: "AC-025",
    });
    harness.assertAuditRequiredFields(auditScope!, {
      requiredFields: ["actor", "occurred_at", "action", "target_id", "result", "old_version", "new_version", "policy_type"],
      requirementId: "FR-026",
      acceptanceId: "AC-026",
    });
    harness.assertResponsibilitySplit(T030_SCOPE_MAP);
  });

  it.each(T030_RED_TO_GREEN_TARGETS)("$traceId: T-031 で Green 化する対象導線を保持する", (target) => {
    expect(target.targetSpecPath).toContain("tests/integration/common/t-030-");
    expect(target.expectedPhase).toBe("RED");
  });

  it("T-030 スイート実行導線を単一コマンドで保持する", () => {
    expect(T030_SUITE_COMMAND).toBe("npm run test -- tests/integration/common/t-030-*.spec.ts");
    expect(T030_SUITE_COMMAND).toContain("tests/integration/common/t-030-*.spec.ts");
  });

  it("共通アクター/trace ヘルパをエラー試験と監査試験へ再利用可能な形で保持する", () => {
    expect(T030_COMMON_ROLE_ID).toBe("ROLE-002");
    expect(T030_COMMON_ACTOR_IDS).toEqual(["USER-A", "USER-B"]);

    const traceId = createT030TraceId("T-030/common-suite/FR-025/AC-025");
    expect(isT030TraceId(traceId)).toBe(true);
  });

  it("red: T-031 実装前のため common error/audit assertions は planned のまま失敗させる", () => {
    const harness = createT030TestHarness();

    expect(harness.getT031ImplementationState()).toBe("implemented");
  });
});
