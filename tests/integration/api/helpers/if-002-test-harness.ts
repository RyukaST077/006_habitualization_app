import { expect } from "vitest";

import type { If002CaseDefinition, If002RequirementId } from "../fixtures/if-002-cases";
import type { If002ErrorScenario } from "../fixtures/if-002-error-scenarios";
import type { If002InvalidPayloadCase } from "../fixtures/if-002-invalid-payloads";
import { createIf002AuthHeaders } from "./if-002-auth";

export interface If002ErrorResponse {
  code: string;
  message: string;
  trace_id: string;
  requirement_id: string;
}

export interface If002PlannedResult {
  status: number;
  body: If002ErrorResponse;
}

export interface If002TestHarness {
  createAuthHeaders(actorUserId: string, requestId?: string): Record<string, string>;
  assertCommonErrorShape(
    payload: unknown,
    expected: { code: string; requirementId: If002RequirementId },
  ): asserts payload is If002ErrorResponse;
  assertErrorMapping(
    actualStatus: number,
    payload: unknown,
    expected: { status: number; code: string; requirementId: If002RequirementId },
  ): asserts payload is If002ErrorResponse;
  runPlannedCase(testCase: If002CaseDefinition): Promise<If002PlannedResult>;
  runInvalidPayloadCase(testCase: If002InvalidPayloadCase): Promise<If002PlannedResult>;
  runErrorScenarioCase(testCase: If002ErrorScenario): Promise<If002PlannedResult>;
}

export function createIf002TestHarness(): If002TestHarness {
  const assertErrorEnvelope = (
    payload: unknown,
    expected: { code: string; requirementId: If002RequirementId },
  ): asserts payload is If002ErrorResponse => {
    expect(payload).toBeTypeOf("object");
    expect(payload).not.toBeNull();

    const response = payload as Partial<If002ErrorResponse>;
    expect(response.code).toBe(expected.code);
    expect(response.requirement_id).toBe(expected.requirementId);
    expect(typeof response.trace_id).toBe("string");
    expect((response.trace_id ?? "").length).toBeGreaterThan(0);
  };

  return {
    createAuthHeaders(actorUserId: string, requestId = "if-002-red-request-id"): Record<string, string> {
      return createIf002AuthHeaders(actorUserId, requestId);
    },
    assertCommonErrorShape(
      payload: unknown,
      expected: { code: string; requirementId: If002RequirementId },
    ): asserts payload is If002ErrorResponse {
      assertErrorEnvelope(payload, expected);
      const response = payload as If002ErrorResponse;
      expect(typeof response.message).toBe("string");
    },
    assertErrorMapping(
      actualStatus: number,
      payload: unknown,
      expected: { status: number; code: string; requirementId: If002RequirementId },
    ): asserts payload is If002ErrorResponse {
      expect(actualStatus).toBe(expected.status);
      assertErrorEnvelope(payload, { code: expected.code, requirementId: expected.requirementId });
    },
    async runPlannedCase(_testCase: If002CaseDefinition): Promise<If002PlannedResult> {
      throw new Error("TODO(T-027): IF-002 API実呼び出しハーネスを実装する");
    },
    async runInvalidPayloadCase(_testCase: If002InvalidPayloadCase): Promise<If002PlannedResult> {
      throw new Error("TODO(T-027): DTO入力検証のAPI実呼び出しハーネスを実装する");
    },
    async runErrorScenarioCase(_testCase: If002ErrorScenario): Promise<If002PlannedResult> {
      throw new Error("TODO(T-027): 403/409/500 エラーマッピングのAPI実呼び出しハーネスを実装する");
    },
  };
}
