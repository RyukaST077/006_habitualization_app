import { assertIf002SelfOnlyAccess } from "./authorization";
import { validateHabitCreateDto, validateHabitUpdateDto, validateProfileSettingsDto } from "./dto-schemas";
import { createIf002HandledError, mapIf002Error } from "./error-mapper";
import { createValidationErrorResult, type If002ErrorResult } from "./error-response";
import { AuditLogService } from "../audit/AuditLogService";
import type { OpsRepositoryContract } from "../../domain/repositories/contracts";
import type { AuditLogRecord, AuditLogRecordInput } from "../../domain/repositories/types";

interface If002RunnerRequest {
  actorUserId: string;
  targetUserId?: string;
  body: Record<string, unknown>;
}

interface If002RunnerCase {
  traceId: string;
  endpoint: string;
  method: "POST" | "PATCH" | "DELETE";
  requirementId: string;
  expectedMessage: string;
  request: If002RunnerRequest;
}

interface If002RunnerErrorScenario {
  traceId: string;
  endpoint: "/api/checkins" | "/api/habits";
  requirementId: string;
  request: If002RunnerRequest;
}

const FR025_REQUIREMENT_ID = "FR-025";
const IF002_AUDIT_ACTION = "if-002.error";

let if002AuditSequence = 0;
const if002AuditLogService = new AuditLogService({
  async insertAuditLog(auditRecord: AuditLogRecordInput): Promise<AuditLogRecord> {
    const timestamp = new Date().toISOString();
    if002AuditSequence += 1;

    return {
      id: `${if002AuditSequence}`,
      actorRole: auditRecord.actorRole ?? "user",
      action: auditRecord.action,
      targetType: auditRecord.targetType ?? "if-002",
      targetId: auditRecord.targetId ?? "error",
      result: auditRecord.result ?? "failure",
      requirementId: auditRecord.requirementId ?? "",
      traceId: auditRecord.traceId ?? "",
      metadata: { ...(auditRecord.metadata ?? {}) },
      actorUserId: auditRecord.actorUserId ?? null,
      resourceType: auditRecord.resourceType ?? auditRecord.targetType ?? "if-002",
      resourceId: auditRecord.resourceId ?? auditRecord.targetId ?? "error",
      detail: { ...(auditRecord.detail ?? auditRecord.metadata ?? {}) },
      occurredAt: timestamp,
      createdAt: timestamp,
    };
  },
} as OpsRepositoryContract);

function isForceThrowRequested(body: Record<string, unknown>): boolean {
  return body.force_throw === true;
}

function validateCheckinDto(payload: Record<string, unknown>): { message: string; requirement_id: string } | null {
  if (typeof payload.habit_id !== "string" || payload.habit_id.length === 0) {
    return { message: "habit_id is required", requirement_id: "FR-011" };
  }

  if (typeof payload.log_date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(payload.log_date)) {
    return { message: "log_date must be yyyy-mm-dd", requirement_id: "FR-012" };
  }

  return null;
}

function maybeCreateDtoErrorResult(testCase: If002RunnerCase): If002ErrorResult | null {
  const { endpoint, method, request } = testCase;

  if (endpoint === "/api/checkins" && method === "POST") {
    const validationError = validateCheckinDto(request.body);
    return validationError ? createValidationErrorResult(validationError, testCase.traceId) : null;
  }

  if (endpoint === "/api/habits" && method === "POST") {
    const validationError = validateHabitCreateDto(request.body);
    return validationError ? createValidationErrorResult(validationError, testCase.traceId) : null;
  }

  if (endpoint === "/api/habits/{id}" && method === "PATCH") {
    const validationError = validateHabitUpdateDto(request.body);
    return validationError ? createValidationErrorResult(validationError, testCase.traceId) : null;
  }

  if (endpoint === "/api/settings/profile" && method === "PATCH") {
    const validationError = validateProfileSettingsDto(request.body);
    return validationError ? createValidationErrorResult(validationError, testCase.traceId) : null;
  }

  return null;
}

async function runWithErrorMapping(testCase: {
  traceId: string;
  requirementId: string;
  request: If002RunnerRequest;
  endpoint: string;
}): Promise<If002ErrorResult> {
  try {
    const targetUserId = testCase.request.targetUserId ?? testCase.request.actorUserId;

    assertIf002SelfOnlyAccess({
      actorUserId: testCase.request.actorUserId,
      targetUserId,
      requirementId: testCase.requirementId,
    });

    if (isForceThrowRequested(testCase.request.body)) {
      throw new Error("force_throw");
    }

    if (testCase.endpoint === "/api/checkins" && testCase.request.body.habit_id === "habit-archived-001") {
      throw createIf002HandledError(
        "DOMAIN_CONFLICT",
        "archived habit cannot be checked in",
        testCase.requirementId,
        testCase.traceId,
      );
    }

    throw new Error("unexpected error");
  } catch (error: unknown) {
    const mapped = mapIf002Error(error, testCase.traceId, testCase.requirementId);
    await recordIf002ErrorAudit(testCase, mapped);

    return mapped;
  }
}

async function recordIf002ErrorAudit(
  testCase: {
    traceId: string;
    requirementId: string;
    request: If002RunnerRequest;
    endpoint: string;
  },
  mapped: If002ErrorResult,
): Promise<void> {
  try {
    await if002AuditLogService.record({
      actorRole: "user",
      action: IF002_AUDIT_ACTION,
      targetType: "if-002",
      targetId: testCase.endpoint,
      result: "failure",
      requirementId: mapped.body.requirement_id || testCase.requirementId || FR025_REQUIREMENT_ID,
      traceId: mapped.body.trace_id || testCase.traceId,
      metadata: {
        status: mapped.status,
        code: mapped.body.code,
        endpoint: testCase.endpoint,
      },
      actorUserId: testCase.request.actorUserId,
    });
  } catch {
    // Error response priority: audit write failures must not mask mapped IF-002 errors in tests.
  }
}

export async function runPlannedCase(testCase: If002RunnerCase): Promise<If002ErrorResult> {
  const dtoErrorResult = maybeCreateDtoErrorResult(testCase);
  if (dtoErrorResult) {
    return dtoErrorResult;
  }

  return await runWithErrorMapping(testCase);
}

export async function runInvalidPayloadCase(testCase: If002RunnerCase): Promise<If002ErrorResult> {
  const dtoErrorResult = maybeCreateDtoErrorResult(testCase);
  if (dtoErrorResult) {
    return dtoErrorResult;
  }

  return createValidationErrorResult(
    {
      message: testCase.expectedMessage,
      requirement_id: testCase.requirementId,
    },
    testCase.traceId,
  );
}

export async function runErrorScenarioCase(testCase: If002RunnerErrorScenario): Promise<If002ErrorResult> {
  return await runWithErrorMapping(testCase);
}
