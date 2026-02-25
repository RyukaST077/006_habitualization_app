import { expect } from "vitest";

import type { T030ScopeMapEntry } from "../fixtures/t-030-scope-map";

const T031_IMPLEMENTATION_STATE = "implemented" as const;

export interface T030CommonErrorPayload {
  code: string;
  message: string;
  trace_id: string;
  requirement_id: string;
}

export interface T030ErrorContractExpected {
  statuses: readonly [403, 409, 500];
  requirementId: "FR-025";
  acceptanceId: "AC-025";
}

export interface T030AppErrorScenarioContract {
  expectedStatus: 403 | 409 | 500;
  expectedCode: "FORBIDDEN" | "DOMAIN_CONFLICT" | "INTERNAL_ERROR";
  requirementId: string;
  traceId: string;
}

export interface T030AuditAssertExpected {
  requiredFields: readonly string[];
  requirementId: "FR-026";
  acceptanceId: "AC-026";
}

export type T030AuditRequiredField =
  | "actor"
  | "occurred_at"
  | "action"
  | "target_id"
  | "result"
  | "old_version"
  | "new_version"
  | "policy_type";

export interface T030AuditMissingFieldScenarioContract {
  traceId: string;
  scope: "audit_logs" | "policy_settings";
  missingField: T030AuditRequiredField;
  requirementId: "FR-026";
  acceptanceId: "AC-026";
}

export interface T030TestHarness {
  assertTraceTerms(scopeMap: readonly T030ScopeMapEntry[], terms: readonly string[]): void;
  assertResponsibilitySplit(scopeMap: readonly T030ScopeMapEntry[]): void;
  assertCommonErrorShape(payload: unknown): void;
  assertAppErrorScenarioContract(scenario: T030AppErrorScenarioContract, payload: unknown): void;
  assertAuditMissingFieldScenarioContract(
    scenario: T030AuditMissingFieldScenarioContract,
    requiredFields: readonly T030AuditRequiredField[],
  ): void;
  assertErrorContract(entry: T030ScopeMapEntry, expected: T030ErrorContractExpected): void;
  assertAuditRequiredFields(entry: T030ScopeMapEntry, expected: T030AuditAssertExpected): void;
  getT031ImplementationState(): typeof T031_IMPLEMENTATION_STATE;
}

export function createT030TestHarness(): T030TestHarness {
  const assertCommonErrorShape = (payload: unknown): void => {
    expect(payload).toBeTypeOf("object");
    expect(payload).not.toBeNull();

    const response = payload as Partial<T030CommonErrorPayload>;
    expect(typeof response.code).toBe("string");
    expect(typeof response.message).toBe("string");
    expect(typeof response.trace_id).toBe("string");
    expect((response.trace_id ?? "").length).toBeGreaterThan(0);
    expect(typeof response.requirement_id).toBe("string");
  };

  return {
    assertTraceTerms(scopeMap: readonly T030ScopeMapEntry[], terms: readonly string[]): void {
      const corpus = scopeMap
        .map((entry) => `${entry.traceId} ${entry.requirementId} ${entry.acceptanceId}`)
        .join(" ");

      terms.forEach((term) => {
        expect(corpus).toContain(term);
      });
    },
    assertResponsibilitySplit(scopeMap: readonly T030ScopeMapEntry[]): void {
      const errorScope = scopeMap.find((entry) => entry.perspective === "COMMON_ERROR_CONTRACT");
      const auditScope = scopeMap.find((entry) => entry.perspective === "AUDIT_REQUIRED_ASSERTION");

      expect(errorScope).toBeDefined();
      expect(auditScope).toBeDefined();
      expect(errorScope?.errorContractStatusSet).toEqual([403, 409, 500]);
      expect(errorScope?.tableId).toBe("TBL-008");
      expect(auditScope?.auditRequiredFields?.length).toBeGreaterThanOrEqual(8);
      expect(auditScope?.interfaceId).toBe("IF-005");
    },
    assertCommonErrorShape(payload: unknown): void {
      assertCommonErrorShape(payload);
    },
    assertAppErrorScenarioContract(scenario: T030AppErrorScenarioContract, payload: unknown): void {
      assertCommonErrorShape(payload);
      const response = payload as T030CommonErrorPayload;

      expect(response.code).toBe(scenario.expectedCode);
      expect(response.requirement_id).toBe(scenario.requirementId);

      if (scenario.expectedStatus === 403) {
        expect(response.requirement_id).toBe("FR-025");
      }
      if (scenario.expectedStatus === 500) {
        expect(response.trace_id).toContain("trace-");
      }
      expect(response.trace_id).toContain(scenario.traceId);
    },
    assertAuditMissingFieldScenarioContract(
      scenario: T030AuditMissingFieldScenarioContract,
      requiredFields: readonly T030AuditRequiredField[],
    ): void {
      expect(scenario.traceId).toContain("FR-026");
      expect(scenario.traceId).toContain("AC-026");
      expect(scenario.requirementId).toBe("FR-026");
      expect(scenario.acceptanceId).toBe("AC-026");
      expect(requiredFields).toContain(scenario.missingField);
      if (scenario.scope === "audit_logs") {
        expect(["actor", "occurred_at", "action", "target_id", "result"]).toContain(scenario.missingField);
      }
      if (scenario.scope === "policy_settings") {
        expect(["old_version", "new_version", "policy_type"]).toContain(scenario.missingField);
      }
    },
    assertErrorContract(entry: T030ScopeMapEntry, expected: T030ErrorContractExpected): void {
      expect(entry.perspective).toBe("COMMON_ERROR_CONTRACT");
      expect(entry.requirementId).toBe(expected.requirementId);
      expect(entry.acceptanceId).toBe(expected.acceptanceId);
      expect(entry.interfaceId).toBe("IF-002");
      expect(entry.errorContractStatusSet).toEqual(expected.statuses);
    },
    assertAuditRequiredFields(entry: T030ScopeMapEntry, expected: T030AuditAssertExpected): void {
      expect(entry.perspective).toBe("AUDIT_REQUIRED_ASSERTION");
      expect(entry.requirementId).toBe(expected.requirementId);
      expect(entry.acceptanceId).toBe(expected.acceptanceId);
      expect(entry.moduleId).toBe("M-010");
      expect(entry.tableId).toBe("TBL-008");

      expected.requiredFields.forEach((field) => {
        expect(entry.auditRequiredFields).toContain(field);
      });
    },
    getT031ImplementationState(): typeof T031_IMPLEMENTATION_STATE {
      return T031_IMPLEMENTATION_STATE;
    },
  };
}
