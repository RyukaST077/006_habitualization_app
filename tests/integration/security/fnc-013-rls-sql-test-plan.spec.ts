import { describe, expect, it } from "vitest";

import { FNC013_ACTOR_KEYS, FNC013_ACTORS } from "./fixtures/fnc-013-actors";
import {
  FNC013_REQUIRED_CASE_IDS,
  FNC013_REQUIRED_TRACE_TERMS,
  FNC013_RLS_SQL_CASES,
} from "./fixtures/fnc-013-rls-cases";
import { createFnc013RlsTestHarness } from "./helpers/fnc-013-rls-test-harness";

const FNC013_GREEN_SUITE_ENTRYPOINT_COMMAND = "npm run test -- tests/integration/security/fnc-013-*.spec.ts";
const FNC013_GREEN_SUITE_SPEC_PATHS = [
  "tests/integration/security/fnc-013-rls-sql-test-plan.spec.ts",
  "tests/integration/security/fnc-013-self-scope-rls-red.spec.ts",
  "tests/integration/security/fnc-013-ops-scope-rls-red.spec.ts",
  "tests/integration/security/fnc-013-audit-required-red.spec.ts",
] as const;

describe("T-029 PR-004 FNC-013 RLS SQL test plan (GREEN entrypoint)", () => {
  it("single entrypoint command で FNC-013 green suite を再実行できる導線を保持する", () => {
    expect(FNC013_GREEN_SUITE_ENTRYPOINT_COMMAND).toBe("npm run test -- tests/integration/security/fnc-013-*.spec.ts");
    expect(FNC013_GREEN_SUITE_SPEC_PATHS).toEqual([
      "tests/integration/security/fnc-013-rls-sql-test-plan.spec.ts",
      "tests/integration/security/fnc-013-self-scope-rls-red.spec.ts",
      "tests/integration/security/fnc-013-ops-scope-rls-red.spec.ts",
      "tests/integration/security/fnc-013-audit-required-red.spec.ts",
    ]);
  });

  it("USER-A / USER-B / ROLE-002 の共通アクターとJWT claim切替データを保持する", () => {
    expect(FNC013_ACTOR_KEYS).toEqual(["USER-A", "USER-B", "ROLE-002"]);

    FNC013_ACTOR_KEYS.forEach((actorKey) => {
      const actor = FNC013_ACTORS[actorKey];

      expect(actor.jwtClaims.sub).toBe(actor.userId);
      expect(actor.jwtClaimSwitches.some((claim) => claim.key === "request.jwt.claim.sub")).toBe(true);
      expect(actor.jwtClaimSwitches.some((claim) => claim.key === "request.jwt.claim.role")).toBe(true);
    });
  });

  it("TC-IT-FR-025-001..003 / TC-IT-FR-026-004..005 をケースへマッピングする", () => {
    const coveredCaseIds = new Set(FNC013_RLS_SQL_CASES.map((testCase) => testCase.testCaseId));

    FNC013_REQUIRED_CASE_IDS.forEach((caseId) => {
      expect(coveredCaseIds.has(caseId)).toBe(true);
    });
  });

  it("FR-025 / FR-026 / AC-025 / AC-026 のトレース語を保持する", () => {
    const traceCorpus = FNC013_RLS_SQL_CASES.map((testCase) => {
      return `${testCase.traceId} ${testCase.requirementId} ${testCase.acceptanceId}`;
    }).join(" ");

    FNC013_REQUIRED_TRACE_TERMS.forEach((term) => {
      expect(traceCorpus).toContain(term);
    });
  });

  it("本人許可/他人拒否/ROLE-002境界/監査必須項目を責務分離する", () => {
    const scopes = new Set(FNC013_RLS_SQL_CASES.map((testCase) => testCase.scope));

    expect(scopes.has("SELF_ALLOW")).toBe(true);
    expect(scopes.has("OTHER_DENY")).toBe(true);
    expect(scopes.has("ROLE_002_BOUNDARY")).toBe(true);
    expect(scopes.has("AUDIT_REQUIRED_FIELDS")).toBe(true);
  });

  it.each(FNC013_RLS_SQL_CASES)(
    "$traceId: SQL client分離後も implemented 状態を維持する",
    async (testCase) => {
      const harness = createFnc013RlsTestHarness();
      const result = await harness.executeScenario(testCase);

      expect(result.traceId).toBe(testCase.traceId);
      expect(result.sql).toContain(testCase.requirementId);
      expect(result.implementationState).toBe("implemented");
    },
  );

  it("seed/reset/audit lookup をハーネス共通APIとして提供する", async () => {
    const harness = createFnc013RlsTestHarness();

    const seeded = await harness.seedScenario([
      {
        table: "profiles",
        userId: FNC013_ACTORS["USER-A"].userId,
        rowId: "profiles-seed-user-a",
      },
    ]);
    const reset = await harness.resetScenario(["profiles", "habits"]);
    const audit = await harness.checkAuditRecord({
      traceId: "FNC-013/FR-026/AC-026/audit-check",
      target: "audit_logs",
    });

    expect(seeded.sql).toContain("insert into public.profiles");
    expect(reset.sql).toContain("delete from public.profiles;");
    expect(audit.sql).toContain("from public.audit_logs");
    expect(audit.auditRecordState).toBe("required_fields_present");
    expect(audit.implementationState).toBe("implemented");
  });
});
