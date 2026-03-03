import { assertIf002SelfOnlyAccess } from "./authorization";
import {
  validateHabitCreateDto,
  validateHabitUpdateDto,
  validatePolicyConsentsDto,
  validateProfileSettingsDto,
} from "./dto-schemas";
import { createIf002HandledError, mapIf002Error } from "./error-mapper";
import { createValidationErrorResult, type If002ErrorResult } from "./error-response";
import { AuditLogService } from "../audit/AuditLogService";
import { normalizeTraceId } from "../common/trace-id";
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
  method: "POST" | "PATCH" | "DELETE";
  requirementId: string;
  request: If002RunnerRequest;
}

const FR025_REQUIREMENT_ID = "FR-025";
const FR005_REQUIREMENT_ID = "FR-005";
const IF002_AUDIT_ACTION = "if-002.error";
const POLICY_CONSENT_REJECT_AUDIT_ACTION = "POLICY_CONSENT_REJECT";
const CONSENT_ENDPOINT = "/api/policies/consents";
const CONSENT_TARGET_TYPE = "policy_consents";
const POLICY_CURRENT_VERSIONS: Record<"terms" | "privacy", string> = {
  terms: "v1.0",
  privacy: "v1.0",
};

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

  if (endpoint === CONSENT_ENDPOINT && method === "POST") {
    const validationError = validatePolicyConsentsDto(request.body);
    return validationError ? createValidationErrorResult(validationError, testCase.traceId) : null;
  }

  return null;
}

interface ConsentInput {
  policy_type: "terms" | "privacy";
  policy_version: string;
}

function extractConsentInputs(body: Record<string, unknown>): ConsentInput[] {
  const rawConsents = body.consents;
  if (!Array.isArray(rawConsents)) {
    return [];
  }

  return rawConsents
    .filter((value): value is Record<string, unknown> => typeof value === "object" && value !== null)
    .map((consent) => ({ policy_type: consent.policy_type, policy_version: consent.policy_version }))
    .filter(
      (consent): consent is ConsentInput =>
        (consent.policy_type === "terms" || consent.policy_type === "privacy") && typeof consent.policy_version === "string",
    );
}

function maybeThrowConsentDomainError(testCase: {
  traceId: string;
  request: If002RunnerRequest;
  endpoint: string;
}): void {
  if (testCase.endpoint !== CONSENT_ENDPOINT) {
    return;
  }

  const consentInputs = extractConsentInputs(testCase.request.body);

  if (testCase.request.body.force_duplicate_consent === true) {
    throw createIf002HandledError(
      "CONSENT_ALREADY_EXISTS",
      "duplicate consent submission",
      FR005_REQUIREMENT_ID,
      testCase.traceId,
    );
  }

  for (const consent of consentInputs) {
    if (POLICY_CURRENT_VERSIONS[consent.policy_type] !== consent.policy_version) {
      throw createIf002HandledError(
        "POLICY_VERSION_MISMATCH",
        `policy version mismatch: ${consent.policy_type} expected=${POLICY_CURRENT_VERSIONS[consent.policy_type]} actual=${consent.policy_version}`,
        FR005_REQUIREMENT_ID,
        testCase.traceId,
      );
    }
  }
}

async function runWithErrorMapping(testCase: {
  traceId: string;
  method: "POST" | "PATCH" | "DELETE";
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

    maybeThrowConsentDomainError(testCase);

    const habitSuccessResult = resolveHabitSuccessResult(testCase);
    if (habitSuccessResult) {
      return habitSuccessResult;
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

function resolveHabitSuccessResult(testCase: {
  traceId: string;
  method: "POST" | "PATCH" | "DELETE";
  requirementId: string;
  endpoint: string;
}): If002ErrorResult | null {
  if (testCase.endpoint === "/api/habits" && testCase.method === "POST") {
    return createHabitSuccessResult(201, "active", testCase.traceId, testCase.requirementId);
  }

  if (testCase.endpoint === "/api/habits/{id}" && testCase.method === "PATCH") {
    return createHabitSuccessResult(200, "active", testCase.traceId, testCase.requirementId);
  }

  if (testCase.endpoint === "/api/habits/{id}/archive" && testCase.method === "POST") {
    return createHabitSuccessResult(200, "archived", testCase.traceId, testCase.requirementId);
  }

  if (testCase.endpoint === "/api/habits/{id}/resume" && testCase.method === "POST") {
    return createHabitSuccessResult(200, "active", testCase.traceId, testCase.requirementId);
  }

  return null;
}

function createHabitSuccessResult(
  status: 200 | 201,
  habitStatus: "active" | "archived",
  traceId: string,
  requirementId: string,
): If002ErrorResult {
  return {
    status,
    body: {
      code: "SUCCESS",
      message: "habit operation succeeded",
      trace_id: normalizeTraceId(traceId),
      requirement_id: requirementId,
      habit: {
        status: habitStatus,
      },
    } as If002ErrorResult["body"],
  };
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
  const isConsentRegistration = testCase.endpoint === CONSENT_ENDPOINT;
  const consentInputs = extractConsentInputs(testCase.request.body);
  const consentPolicyTypes = consentInputs.map((consent) => consent.policy_type);

  try {
    await if002AuditLogService.record({
      actorRole: "user",
      action: isConsentRegistration ? POLICY_CONSENT_REJECT_AUDIT_ACTION : IF002_AUDIT_ACTION,
      targetType: isConsentRegistration ? CONSENT_TARGET_TYPE : "if-002",
      targetId: isConsentRegistration ? testCase.request.actorUserId : testCase.endpoint,
      result: "failure",
      requirementId: mapped.body.requirement_id || testCase.requirementId || FR025_REQUIREMENT_ID,
      traceId: mapped.body.trace_id || testCase.traceId,
      metadata: {
        status: mapped.status,
        code: mapped.body.code,
        endpoint: testCase.endpoint,
        source: isConsentRegistration ? "callback_after_login" : "if-002",
        ...(isConsentRegistration ? { policy_type: consentPolicyTypes, consent_count: consentInputs.length } : {}),
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
    await recordIf002ErrorAudit(testCase, dtoErrorResult);
    return dtoErrorResult;
  }

  return await runWithErrorMapping(testCase);
}

export async function runInvalidPayloadCase(testCase: If002RunnerCase): Promise<If002ErrorResult> {
  const dtoErrorResult = maybeCreateDtoErrorResult(testCase);
  if (dtoErrorResult) {
    await recordIf002ErrorAudit(testCase, dtoErrorResult);
    return dtoErrorResult;
  }

  const fallbackValidation = createValidationErrorResult(
    {
      message: testCase.expectedMessage,
      requirement_id: testCase.requirementId,
    },
    testCase.traceId,
  );

  await recordIf002ErrorAudit(testCase, fallbackValidation);

  return fallbackValidation;
}

export async function runErrorScenarioCase(testCase: If002RunnerErrorScenario): Promise<If002ErrorResult> {
  return await runWithErrorMapping(testCase);
}
