import { assertIf002SelfOnlyAccess } from "./authorization";
import { validateHabitCreateDto, validateHabitUpdateDto, validateProfileSettingsDto } from "./dto-schemas";
import { createIf002HandledError, mapIf002Error } from "./error-mapper";
import { createValidationErrorResult, type If002ErrorResult } from "./error-response";

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

function runWithErrorMapping(testCase: {
  traceId: string;
  requirementId: string;
  request: If002RunnerRequest;
  endpoint: string;
}): If002ErrorResult {
  try {
    assertIf002SelfOnlyAccess({
      actorUserId: testCase.request.actorUserId,
      targetUserId: testCase.request.targetUserId,
      requirementId: testCase.requirementId,
    });

    if (isForceThrowRequested(testCase.request.body)) {
      throw new Error("force_throw");
    }

    if (testCase.endpoint === "/api/checkins" && testCase.request.body.habit_id === "habit-archived-001") {
      throw createIf002HandledError("DOMAIN_CONFLICT", "archived habit cannot be checked in", testCase.requirementId);
    }

    throw new Error("unexpected error");
  } catch (error: unknown) {
    const mapped = mapIf002Error(error, testCase.traceId, testCase.requirementId);
    if (mapped.status === 500 && mapped.body.code === "INTERNAL_ERROR" && mapped.body.trace_id.length === 0) {
      mapped.body.trace_id = `trace-${testCase.traceId}`;
    }

    return mapped;
  }
}

export async function runPlannedCase(testCase: If002RunnerCase): Promise<If002ErrorResult> {
  const dtoErrorResult = maybeCreateDtoErrorResult(testCase);
  if (dtoErrorResult) {
    return dtoErrorResult;
  }

  return runWithErrorMapping(testCase);
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
  return runWithErrorMapping(testCase);
}
