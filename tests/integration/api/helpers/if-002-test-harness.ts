import { expect } from "vitest";

import type {
  If002HabitLifecycleCase,
  If002RequirementId,
  If002RunnableCase,
  If002SettingsProfileCase,
} from "../fixtures/if-002-cases";
import type { If002ErrorScenario } from "../fixtures/if-002-error-scenarios";
import type { If002InvalidPayloadCase } from "../fixtures/if-002-invalid-payloads";
import {
  runErrorScenarioCase as runErrorScenarioCaseImpl,
  runInvalidPayloadCase as runInvalidPayloadCaseImpl,
  runPlannedCase as runPlannedCaseImpl,
} from "../../../../src/server/application/if-002/case-runner";
import { createIf002AuthHeaders } from "./if-002-auth";

export interface If002ErrorResponse {
  code: string;
  message: string;
  trace_id: string;
  requirement_id: string;
}

export interface If002PlannedResult {
  status: number;
  body: If002ErrorResponse & {
    habit?: {
      status?: string;
    };
    checkin?: {
      log_date?: string;
      idempotent?: boolean;
      canceled?: boolean;
    };
    settings?: {
      timezone?: string;
      day_cutoff_time?: string;
      version?: number;
      saved?: boolean;
      effective_from?: string;
    };
  };
}

export interface If002TestHarness {
  createAuthHeaders(actorUserId: string, requestId?: string): Record<string, string>;
  assertCommonErrorShape(
    payload: unknown,
    expected: { code: string; requirementId: If002RequirementId },
  ): void;
  assertErrorMapping(
    actualStatus: number,
    payload: unknown,
    expected: { status: number; code: string; requirementId: If002RequirementId },
  ): void;
  runPlannedCase(testCase: If002RunnableCase): Promise<If002PlannedResult>;
  runSettingsProfileCase(testCase: If002SettingsProfileCase): Promise<If002PlannedResult>;
  runHabitLifecycleCase(testCase: If002HabitLifecycleCase): Promise<If002PlannedResult>;
  runInvalidPayloadCase(testCase: If002InvalidPayloadCase): Promise<If002PlannedResult>;
  runErrorScenarioCase(testCase: If002ErrorScenario): Promise<If002PlannedResult>;
  assertForbiddenError(payload: unknown, requirementId: If002RequirementId): void;
  assertHabitStatus(payload: unknown, expectedStatus: "active" | "archived"): void;
  assertCheckinLogDate(payload: unknown, expectedLogDate: string): void;
  assertCheckinIdempotent(payload: unknown, expectedIdempotent: boolean): void;
  assertCheckinCanceled(payload: unknown, expectedCanceled: boolean): void;
  assertSettingsProfile(
    payload: unknown,
    expected: { timezone: string; dayCutoffTime: string; version: number },
  ): void;
  assertSettingsSaveResult(payload: unknown, expected: { saved: true }): void;
}

export function createIf002TestHarness(): If002TestHarness {
  const assertErrorEnvelope: (
    payload: unknown,
    expected: { code: string; requirementId: If002RequirementId },
  ) => void = (
    payload: unknown,
    expected: { code: string; requirementId: If002RequirementId },
  ) => {
    expect(payload).toBeTypeOf("object");
    expect(payload).not.toBeNull();

    const response = payload as Partial<If002ErrorResponse>;
    expect(response.code).toBe(expected.code);
    expect(response.requirement_id).toBe(expected.requirementId);
    expect(typeof response.trace_id).toBe("string");
    expect((response.trace_id ?? "").length).toBeGreaterThan(0);
  };

  return {
    createAuthHeaders(actorUserId: string, requestId = "if-002-request-id"): Record<string, string> {
      return createIf002AuthHeaders(actorUserId, requestId);
    },
    assertCommonErrorShape(
      payload: unknown,
      expected: { code: string; requirementId: If002RequirementId },
    ): void {
      assertErrorEnvelope(payload, expected);
      const response = payload as If002ErrorResponse;
      expect(typeof response.message).toBe("string");
    },
    assertErrorMapping(
      actualStatus: number,
      payload: unknown,
      expected: { status: number; code: string; requirementId: If002RequirementId },
    ): void {
      expect(actualStatus).toBe(expected.status);
      assertErrorEnvelope(payload, { code: expected.code, requirementId: expected.requirementId });
    },
    async runPlannedCase(testCase: If002RunnableCase): Promise<If002PlannedResult> {
      return runPlannedCaseImpl(testCase);
    },
    async runSettingsProfileCase(testCase: If002SettingsProfileCase): Promise<If002PlannedResult> {
      return runPlannedCaseImpl({
        traceId: testCase.traceId,
        endpoint: testCase.endpoint,
        method: testCase.method,
        requirementId: testCase.requirementId,
        expectedMessage: "settings profile scenario",
        request: testCase.request,
      });
    },
    async runHabitLifecycleCase(testCase: If002HabitLifecycleCase): Promise<If002PlannedResult> {
      return runPlannedCaseImpl({
        traceId: testCase.traceId,
        endpoint: testCase.endpoint,
        method: testCase.method,
        requirementId: testCase.requirementId,
        expectedMessage: "habit lifecycle scenario",
        request: testCase.request,
      });
    },
    async runInvalidPayloadCase(testCase: If002InvalidPayloadCase): Promise<If002PlannedResult> {
      return runInvalidPayloadCaseImpl(testCase);
    },
    async runErrorScenarioCase(testCase: If002ErrorScenario): Promise<If002PlannedResult> {
      return runErrorScenarioCaseImpl(testCase);
    },
    assertForbiddenError(payload: unknown, requirementId: If002RequirementId): void {
      assertErrorEnvelope(payload, { code: "FORBIDDEN", requirementId });
    },
    assertHabitStatus(payload: unknown, expectedStatus: "active" | "archived"): void {
      expect(payload).toBeTypeOf("object");
      expect(payload).not.toBeNull();

      const response = payload as If002PlannedResult["body"];
      expect(response.habit?.status).toBe(expectedStatus);
    },
    assertCheckinLogDate(payload: unknown, expectedLogDate: string): void {
      expect(payload).toBeTypeOf("object");
      expect(payload).not.toBeNull();

      const response = payload as If002PlannedResult["body"];
      expect(response.checkin?.log_date).toBe(expectedLogDate);
    },
    assertCheckinIdempotent(payload: unknown, expectedIdempotent: boolean): void {
      expect(payload).toBeTypeOf("object");
      expect(payload).not.toBeNull();

      const response = payload as If002PlannedResult["body"];
      expect(response.checkin?.idempotent).toBe(expectedIdempotent);
    },
    assertCheckinCanceled(payload: unknown, expectedCanceled: boolean): void {
      expect(payload).toBeTypeOf("object");
      expect(payload).not.toBeNull();

      const response = payload as If002PlannedResult["body"];
      expect(response.checkin?.canceled).toBe(expectedCanceled);
    },
    assertSettingsProfile(
      payload: unknown,
      expected: { timezone: string; dayCutoffTime: string; version: number },
    ): void {
      expect(payload).toBeTypeOf("object");
      expect(payload).not.toBeNull();

      const response = payload as If002PlannedResult["body"];
      expect(response.settings?.timezone).toBe(expected.timezone);
      expect(response.settings?.day_cutoff_time).toBe(expected.dayCutoffTime);
      expect(response.settings?.version).toBe(expected.version);
    },
    assertSettingsSaveResult(payload: unknown, expected: { saved: true }): void {
      expect(payload).toBeTypeOf("object");
      expect(payload).not.toBeNull();

      const response = payload as If002PlannedResult["body"];
      expect(response.settings?.saved).toBe(expected.saved);
      expect(typeof response.settings?.effective_from).toBe("string");
      expect((response.settings?.effective_from ?? "").length).toBeGreaterThan(0);
    },
  };
}
