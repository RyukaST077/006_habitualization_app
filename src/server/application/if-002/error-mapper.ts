import type { If002ErrorResult } from "./error-response";
import { AppError, createAppError, type AppErrorCode, isAppError } from "../common/AppError";
import { normalizeTraceId } from "../common/trace-id";

type If002HandledErrorCode = "FORBIDDEN" | "DOMAIN_CONFLICT";
const FORBIDDEN_REQUIREMENT_ID = "FR-025";
const DEFAULT_REQUIREMENT_ID = "FR-011";
const INTERNAL_ERROR_CODE = "INTERNAL_ERROR";
const INTERNAL_ERROR_MESSAGE = "unexpected error";
const DEFAULT_HANDLED_ERROR_TRACE_ID = "if-002-handled-error";

type If002ResponseCode = If002HandledErrorCode | "VALIDATION_ERROR" | "INTERNAL_ERROR";
const IF002_HANDLED_ERROR_STATUS: Record<If002HandledErrorCode | "VALIDATION_ERROR", 400 | 403 | 409> = {
  FORBIDDEN: 403,
  DOMAIN_CONFLICT: 409,
  VALIDATION_ERROR: 400,
};

export function createIf002HandledError(
  code: AppErrorCode,
  message: string,
  requirementId: string,
  traceId: string = "if-002-handled-error",
): AppError {
  return createAppError({ code, message, requirementId, traceId });
}

export function mapIf002Error(error: unknown, traceId: string, fallbackRequirementId: string): If002ErrorResult {
  if (isAppError(error)) {
    return buildIf002ErrorResult(
      ensureIf002AppError(error, traceId, fallbackRequirementId),
      fallbackRequirementId,
      traceId,
    );
  }

  return buildIf002ErrorResult(
    createAppError({
      code: INTERNAL_ERROR_CODE,
      message: INTERNAL_ERROR_MESSAGE,
      requirementId: fallbackRequirementId,
      traceId,
    }),
    fallbackRequirementId,
    traceId,
  );
}

function buildIf002ErrorResult(error: AppError, fallbackRequirementId: string, fallbackTraceId: string): If002ErrorResult {
  const responseCode = toIf002ResponseCode(error.code);
  const requirementId = resolveRequirementId(responseCode, error.requirementId, fallbackRequirementId);
  const traceId = resolveTraceId(error.traceId, fallbackTraceId);

  return {
    status: toIf002Status(responseCode),
    body: {
      code: responseCode,
      message: responseCode === INTERNAL_ERROR_CODE ? INTERNAL_ERROR_MESSAGE : error.message,
      trace_id: normalizeTraceId(traceId),
      requirement_id: requirementId,
    },
  };
}

function ensureIf002AppError(error: AppError, fallbackTraceId: string, fallbackRequirementId: string): AppError {
  const traceId = resolveTraceId(error.traceId, fallbackTraceId);
  const requirementId = resolveRequirementId(toIf002ResponseCode(error.code), error.requirementId, fallbackRequirementId);

  if (traceId === error.traceId && requirementId === error.requirementId) {
    return error;
  }

  return createAppError({
    code: error.code,
    message: error.message,
    requirementId,
    traceId,
  });
}

function resolveRequirementId(
  responseCode: If002ResponseCode,
  appRequirementId: string,
  fallbackRequirementId: string,
): string {
  if (responseCode === "FORBIDDEN") {
    return FORBIDDEN_REQUIREMENT_ID;
  }
  if (responseCode === "DOMAIN_CONFLICT" && fallbackRequirementId.trim().length > 0) {
    return fallbackRequirementId.trim();
  }

  return appRequirementId.trim() || fallbackRequirementId.trim() || DEFAULT_REQUIREMENT_ID;
}

function resolveTraceId(appTraceId: string, fallbackTraceId: string): string {
  const normalizedAppTrace = appTraceId.trim();
  if (normalizedAppTrace.length === 0 || normalizedAppTrace === DEFAULT_HANDLED_ERROR_TRACE_ID) {
    return fallbackTraceId;
  }

  return normalizedAppTrace;
}

function toIf002Status(code: If002ResponseCode): 400 | 403 | 409 | 500 {
  if (code in IF002_HANDLED_ERROR_STATUS) {
    return IF002_HANDLED_ERROR_STATUS[code as If002HandledErrorCode | "VALIDATION_ERROR"];
  }

  return 500;
}

function toIf002ResponseCode(code: AppErrorCode): If002ResponseCode {
  if (code === "FORBIDDEN" || code === "DOMAIN_CONFLICT" || code === "VALIDATION_ERROR") {
    return code as If002HandledErrorCode | "VALIDATION_ERROR";
  }

  if (code === "INVALID_HABIT_INPUT") {
    return "VALIDATION_ERROR";
  }

  if (code === "INVALID_HABIT_STATUS_TRANSITION" || code === "OPTIMISTIC_LOCK_CONFLICT") {
    return "DOMAIN_CONFLICT";
  }

  if (code === "CHECKIN_CANCEL_NOT_ALLOWED") {
    return "DOMAIN_CONFLICT";
  }

  if (code === "WITHDRAWAL_ALREADY_REQUESTED") {
    return "DOMAIN_CONFLICT";
  }

  if (code === "POLICY_VERSION_MISMATCH" || code === "POLICY_VERSION_CONFLICT") {
    return "DOMAIN_CONFLICT";
  }

  if (code === "CONSENT_ALREADY_EXISTS" || code === "DUPLICATE_CONSENT_INPUT") {
    return "VALIDATION_ERROR";
  }

  return INTERNAL_ERROR_CODE;
}
